import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.config import settings


async def save_upload_file(
    file: UploadFile,
    sub_dir: str,
) -> tuple[str, int]:
    """
    Save an uploaded file to disk.

    Returns (stored_path, file_size_bytes).
    """
    upload_dir = Path(settings.UPLOAD_DIR) / sub_dir
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename to prevent collisions
    ext = Path(file.filename or "file").suffix or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / unique_name

    file_size = 0
    async with aiofiles.open(file_path, "wb") as out_file:
        while chunk := await file.read(1024 * 64):  # 64KB chunks
            await out_file.write(chunk)
            file_size += len(chunk)

    return str(file_path), file_size


def get_file_url(stored_path: str) -> str:
    """Convert a stored file path to a servable URL path."""
    # Strip the leading upload dir to get relative path
    rel = stored_path.replace(settings.UPLOAD_DIR, "").lstrip("/\\")
    return f"/uploads/{rel}"


def delete_file(stored_path: str) -> None:
    """Delete a file from disk if it exists."""
    try:
        os.remove(stored_path)
    except FileNotFoundError:
        pass
