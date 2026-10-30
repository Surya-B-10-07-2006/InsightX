import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from routers.auth import get_current_user_id
from services.parser_service import ProjectParserService
from security import SecurityInspector, _safe_path
from database import db_manager, MongoCollectionWrapper

router = APIRouter(prefix="/api/upload", tags=["Upload & Security Parser"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    filename = file.filename or "uploaded_project"
    # Sanitize filename to prevent path traversal
    filename = _safe_path(filename).split("/")[-1] or "uploaded_project"
    lower_fname = filename.lower()
    
    if not (lower_fname.endswith(".pdf") or lower_fname.endswith(".zip")):
        raise HTTPException(status_code=400, detail="Only PHR PDF (.pdf) or Project ZIP (.zip) files are accepted.")

    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:  # 50MB max limit
        raise HTTPException(status_code=400, detail="Uploaded file exceeds maximum limit of 50MB.")

    # Execute safe parser engine
    if lower_fname.endswith(".pdf"):
        parsed_data = ProjectParserService.parse_pdf_phr(contents, filename)
    else:
        parsed_data = ProjectParserService.parse_project_zip(contents, filename)

    project_id = str(uuid.uuid4())
    project_doc = {
        "id": project_id,
        "_id": project_id,
        "user_id": user_id,
        "name": filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title(),
        "filename": filename,
        "source_type": parsed_data["source_type"],
        "upload_time": MongoCollectionWrapper.utcnow(),
        "is_insufficient_evidence": parsed_data.get("is_insufficient_evidence", False),
        "insufficient_reason": parsed_data.get("insufficient_reason"),
        "metrics": parsed_data["metrics"],
        "hotspots": parsed_data["hotspots"],
        "file_tree": parsed_data.get("file_tree", []),
        "parsed_files": parsed_data.get("parsed_files", []),
        "raw_files_with_content": parsed_data.get("raw_files_with_content", []),
        "detected_secrets": parsed_data.get("detected_secrets", []),
        "blocked_files": parsed_data.get("blocked_files", []),
        "status": "PARSED"
    }

    projects_col = db_manager.get_collection("projects")
    await projects_col.insert_one(project_doc)

    return {
        "project_id": project_id,
        "filename": filename,
        "source_type": parsed_data["source_type"],
        "security_scan": {
            "secrets_detected_count": len(parsed_data.get("detected_secrets", [])),
            "prohibited_files_blocked": len(parsed_data.get("blocked_files", [])),
            "blocked_files": parsed_data.get("blocked_files", []),
            "status": "CLEAN_AND_REDACTED"
        },
        "extracted_summary": {
            "lines_of_code": parsed_data["metrics"]["lines_of_code"],
            "cyclomatic_complexity": parsed_data["metrics"]["cyclomatic_complexity"],
            "dependency_coupling": parsed_data["metrics"]["dependency_coupling"],
            "top_hotspot_file": parsed_data["hotspots"][0]["file"] if parsed_data["hotspots"] else "N/A"
        }
    }
