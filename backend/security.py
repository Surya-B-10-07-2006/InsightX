import re
import secrets
import datetime
import hashlib
from typing import Optional, List, Dict, Any
from jose import jwt, JWTError
from passlib.context import CryptContext
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _get_pbkdf2_salt() -> bytes:
    """Return a stable per-deployment salt from .env, or generate a random one as fallback."""
    if settings.PBKDF2_SALT:
        try:
            return bytes.fromhex(settings.PBKDF2_SALT)
        except ValueError:
            pass
    # Fallback: derive from JWT_SECRET so it is at least deployment-stable
    return hashlib.sha256(settings.JWT_SECRET.encode()).digest()

def hash_password(password: str) -> str:
    try:
        return pwd_context.hash(password)
    except Exception:
        salt = _get_pbkdf2_salt()
        return "pbkdf2:" + hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260000).hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if hashed_password.startswith("pbkdf2:"):
        salt = _get_pbkdf2_salt()
        expected = "pbkdf2:" + hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt, 260000).hex()
        return secrets.compare_digest(expected, hashed_password)
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

# --- Security File & Secret Inspector ---

FORBIDDEN_FILE_PATTERNS = [
    r"^\.env.*",
    r".*\.pem$",
    r".*\.key$",
    r".*\.p12$",
    r".*\.pkcs12$",
    r"^id_rsa.*",
    r"^id_ed25519.*",
    r".*credentials.*",
    r".*secrets?.*",
    r".*\.exe$",
    r".*\.dll$",
    r".*\.so$",
    r".*\.dylib$",
    r"^\.git/.*"
]

SECRET_KEY_REGEXES = [
    (r"(?i)sk_live_[0-9a-zA-Z]{24,}", "Stripe Live Secret Key"),
    (r"(?i)AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
    (r"(?i)AIza[0-9A-Za-z-_]{35}", "Google API Key"),
    (r"ghp_[0-9a-zA-Z]{36}", "GitHub Personal Access Token"),
    (r"xox[b-z0-9]\-[0-9a-zA-Z]{10,48}", "Slack Token"),
    (r"sq0atp-[0-9A-Za-z\-_]{22}", "Square Token"),
    (r"(?i)bearer\s+[A-Za-z0-9\-\._~\+\/]+=*", "Bearer Auth Token"),
    (r"(?i)postgres://[^:]+:[^@]+@", "PostgreSQL Connection String"),
    (r"(?i)mongodb(\+srv)?://[^:]+:[^@]+@", "MongoDB Connection String")
]

def _safe_path(filename: str) -> str:
    """Normalize and sanitize a file path to prevent traversal attacks."""
    normalized = filename.replace("\\", "/").strip()
    # Remove any leading ../ sequences
    parts = [p for p in normalized.split("/") if p not in ("", ".", "..")]
    return "/".join(parts)

class SecurityInspector:
    @staticmethod
    def is_file_allowed(filename: str) -> tuple[bool, Optional[str]]:
        """Return (allowed, reason_if_blocked)"""
        safe = _safe_path(filename)
        base_name = safe.split("/")[-1].lower()
        norm_lower = safe.lower()

        for pattern in FORBIDDEN_FILE_PATTERNS:
            if re.match(pattern, base_name) or re.match(pattern, norm_lower):
                return False, f"File '{filename}' matched prohibited security policy pattern ({pattern})"

        return True, None

    @staticmethod
    def sanitize_text_and_detect_keys(text: str) -> tuple[str, List[Dict[str, str]]]:
        """Redacts sensitive keys and returns (sanitized_text, list_of_detected_keys)"""
        detected = []
        sanitized = text
        for regex, key_type in SECRET_KEY_REGEXES:
            matches = re.findall(regex, sanitized)
            if matches:
                for match in set(matches):
                    match_str = match if isinstance(match, str) else match[0]
                    detected.append({"type": key_type, "match": match_str[:4] + "..." + match_str[-4:]})
                    sanitized = sanitized.replace(match_str, f"[REDACTED_{key_type.upper().replace(' ', '_')}]")
        return sanitized, detected
