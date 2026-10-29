from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from .db import VIEW_KEYS, get_db


api = Blueprint("api", __name__, url_prefix="/api")
COLORS = ("#E8452C", "#2F6FED", "#F2B01E", "#1FA37A", "#7B4FE0")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic"}


def ok(data, status: int = 200):
    return jsonify(data=data), status


def error(message: str, status: int = 400):
    return jsonify(message=message), status


def find_project(project_id: str):
    return get_db().execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()


def refresh_progress(project_id: str):
    """查询时推进本地进度桩，不启动后台线程，便于开发和容器测试。"""

    connection = get_db()
    project = find_project(project_id)
    if project is None or project["status"] != "processing" or not project["processing_started_at"]:
        return project

    started = datetime.fromisoformat(project["processing_started_at"])
    elapsed = max(0.0, (datetime.now(timezone.utc) - started).total_seconds())
    duration = max(0.1, float(current_app.config["PROCESSING_SECONDS"]))
    progress = min(100, int(elapsed / duration * 100))
    if progress >= 100:
        connection.execute("UPDATE projects SET status = 'done', progress = 100 WHERE id = ?", (project_id,))
    elif progress > project["progress"]:
        connection.execute("UPDATE projects SET progress = ? WHERE id = ?", (progress, project_id))
    connection.commit()
    return find_project(project_id)


def serialize_project(project) -> dict:
    photo_count = get_db().execute(
        "SELECT COUNT(*) FROM photos WHERE project_id = ?", (project["id"],)
    ).fetchone()[0]
    return {
        "id": project["id"], "name": project["name"], "created_at": project["created_at"],
        "photo_count": photo_count, "color": project["color"], "status": project["status"],
        "progress": project["progress"], "faces": project["faces"],
    }


@api.route("/health")
def health():
    return ok({"status": "ok"})


@api.route("/projects", methods=["GET"])
def list_projects():
    status = request.args.get("status")
    if status and status not in {"processing", "done"}:
        return error("status 只支持 processing 或 done")

    connection = get_db()
    if status:
        rows = connection.execute(
            "SELECT id FROM projects WHERE status = ? ORDER BY created_at DESC", (status,)
        ).fetchall()
    else:
        rows = connection.execute(
            "SELECT id FROM projects WHERE status != 'draft' ORDER BY created_at DESC"
        ).fetchall()
    return ok([serialize_project(refresh_progress(row["id"])) for row in rows])


@api.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id: str):
    project = refresh_progress(project_id)
    if project is None:
        return error("项目不存在", 404)
    return ok(serialize_project(project))


@api.route("/projects", methods=["POST"])
def create_project():
    payload = request.get_json(silent=True) or {}
    sample = bool(payload.get("sample", False))
    connection = get_db()
    project_count = connection.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    name = str(payload.get("name", "")).strip()[:40] or f"玩具车 {project_count + 1}"
    project_id = uuid.uuid4().hex
    color = COLORS[project_count % len(COLORS)]
    now = datetime.now(timezone.utc).isoformat()
    connection.execute(
        "INSERT INTO projects (id, name, created_at, status, progress, faces, color) VALUES (?, ?, ?, 'draft', 0, ?, ?)",
        (project_id, name, now, 100000 + project_count * 3700, color),
    )
    if sample:
        connection.executemany(
            "INSERT INTO photos (project_id, view_key, file_path) VALUES (?, ?, ?)",
            [(project_id, view_key, f"demo://{view_key}") for view_key in VIEW_KEYS],
        )
    connection.commit()
    return ok(serialize_project(find_project(project_id)), 201)


@api.route("/projects/<project_id>/photos", methods=["POST"])
def upload_photo(project_id: str):
    project = find_project(project_id)
    if project is None:
        return error("项目不存在", 404)
    if project["status"] != "draft":
        return error("项目已开始生成，不能继续上传照片", 409)

    view_key = request.form.get("view_key", "")
    if view_key not in VIEW_KEYS:
        return error("无效的拍摄视角")
    file = request.files.get("photo")
    if file is None or not file.filename:
        return error("请选择照片")
    extension = Path(secure_filename(file.filename)).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        return error("照片格式仅支持 JPG、PNG、WEBP 或 HEIC")

    upload_folder = Path(current_app.config["UPLOAD_FOLDER"]) / project_id
    upload_folder.mkdir(parents=True, exist_ok=True)
    destination = upload_folder / f"{view_key}-{uuid.uuid4().hex[:10]}{extension}"
    file.save(destination)

    connection = get_db()
    connection.execute(
        "INSERT INTO photos (project_id, view_key, file_path) VALUES (?, ?, ?) "
        "ON CONFLICT(project_id, view_key) DO UPDATE SET file_path = excluded.file_path",
        (project_id, view_key, str(destination)),
    )
    connection.commit()
    return ok({"view_key": view_key}, 201)


@api.route("/projects/<project_id>/generate", methods=["POST"])
def generate_project(project_id: str):
    project = find_project(project_id)
    if project is None:
        return error("项目不存在", 404)
    count = get_db().execute(
        "SELECT COUNT(*) FROM photos WHERE project_id = ?", (project_id,)
    ).fetchone()[0]
    if count < len(VIEW_KEYS):
        return error(f"还缺少 {len(VIEW_KEYS) - count} 张照片")

    started_at = datetime.now(timezone.utc).isoformat()
    connection = get_db()
    connection.execute(
        "UPDATE projects SET status = 'processing', progress = 0, processing_started_at = ? WHERE id = ?",
        (started_at, project_id),
    )
    connection.commit()
    return ok(serialize_project(find_project(project_id)))


@api.route("/projects/<project_id>/regenerate", methods=["POST"])
def regenerate_project(project_id: str):
    project = find_project(project_id)
    if project is None:
        return error("项目不存在", 404)
    started_at = datetime.now(timezone.utc).isoformat()
    connection = get_db()
    connection.execute(
        "UPDATE projects SET status = 'processing', progress = 0, processing_started_at = ? WHERE id = ?",
        (started_at, project_id),
    )
    connection.commit()
    return ok(serialize_project(find_project(project_id)))


@api.route("/projects/<project_id>/export", methods=["POST"])
def export_project(project_id: str):
    if find_project(project_id) is None:
        return error("项目不存在", 404)
    return ok({"message": "AI 接口尚未接入，当前版本仅提供模型预览"}, 202)

