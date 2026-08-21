import uuid
import logging
import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from routers.auth import get_current_user_id
from database import db_manager

logger = logging.getLogger("InsightX.Collaboration")
router = APIRouter(prefix="/api/collaboration", tags=["Client Collaboration"])


class CommentRequest(BaseModel):
    project_id: str
    content: str = Field(..., min_length=1, max_length=2000)
    comment_type: str = "COMMENT"  # COMMENT | CHANGE_REQUEST | APPROVAL


class ApprovalRequest(BaseModel):
    project_id: str
    decision: str  # APPROVED | REJECTED
    notes: Optional[str] = None


@router.post("/comment")
async def add_comment(req: CommentRequest, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": req.project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found.")

    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"id": user_id})
    author_name = user.get("name", "Unknown") if user else "Unknown"

    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "author": author_name,
        "content": req.content,
        "comment_type": req.comment_type,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    existing_comments = pred.get("comments", [])
    existing_comments.append(comment)

    scope_risk_delta = 0.0
    if req.comment_type == "CHANGE_REQUEST":
        current_risk = pred.get("ml_results", {}).get("overall_risk_score", 50.0)
        scope_risk_delta = round(min(current_risk * 0.05, 8.0), 2)
        new_risk = round(min(current_risk + scope_risk_delta, 99.0), 1)
        await preds_col.update_one(
            {"project_id": req.project_id},
            {"$set": {"comments": existing_comments, "ml_results.scope_adjusted_risk": new_risk}}
        )
    else:
        await preds_col.update_one(
            {"project_id": req.project_id},
            {"$set": {"comments": existing_comments}}
        )

    return {
        "comment": comment,
        "scope_risk_delta": scope_risk_delta,
        "message": (
            "Change request logged — scope risk recalculated."
            if req.comment_type == "CHANGE_REQUEST"
            else "Comment added successfully."
        ),
    }


@router.get("/comments/{project_id}")
async def get_comments(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"comments": pred.get("comments", []), "total": len(pred.get("comments", []))}


@router.post("/approve")
async def submit_approval(req: ApprovalRequest, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": req.project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found.")

    users_col = db_manager.get_collection("users")
    user = await users_col.find_one({"id": user_id})
    approver_name = user.get("name", "Unknown") if user else "Unknown"

    approval_record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "approver": approver_name,
        "decision": req.decision,
        "notes": req.notes,
        "decided_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

    existing_approvals = pred.get("approvals", [])
    existing_approvals.append(approval_record)
    await preds_col.update_one(
        {"project_id": req.project_id},
        {"$set": {"approvals": existing_approvals, "approval_status": req.decision}}
    )
    return {"approval": approval_record, "message": f"Project {req.decision.lower()} successfully."}


@router.get("/approvals/{project_id}")
async def get_approvals(project_id: str, user_id: str = Depends(get_current_user_id)):
    preds_col = db_manager.get_collection("predictions")
    pred = await preds_col.find_one({"project_id": project_id})
    if not pred:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {
        "approvals": pred.get("approvals", []),
        "approval_status": pred.get("approval_status", "PENDING"),
    }
