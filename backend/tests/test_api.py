from __future__ import annotations

import io
import time

import pytest

from app import create_app
from app.db import VIEW_KEYS


@pytest.fixture()
def app(tmp_path):
    return create_app({"TESTING": True, "DATABASE": str(tmp_path / "test.sqlite3"), "UPLOAD_FOLDER": str(tmp_path / "uploads"), "PROCESSING_SECONDS": 0.1})


@pytest.fixture()
def client(app):
    return app.test_client()


def test_health_and_seed_projects(client):
    assert client.get("/api/health").get_json()["data"]["status"] == "ok"
    projects = client.get("/api/projects").get_json()["data"]
    assert len(projects) == 4
    assert all(project["status"] == "done" for project in projects)


def test_sample_project_generation_flow(client):
    created = client.post("/api/projects", json={"name": "测试跑车", "sample": True})
    assert created.status_code == 201
    project = created.get_json()["data"]
    assert project["photo_count"] == 10
    assert project["status"] == "draft"
    assert client.post(f"/api/projects/{project['id']}/generate").status_code == 200
    time.sleep(0.12)
    completed = client.get(f"/api/projects/{project['id']}").get_json()["data"]
    assert completed["status"] == "done"
    assert completed["progress"] == 100


def test_real_photo_upload_requires_all_views(client):
    project = client.post("/api/projects", json={"name": "上传测试"}).get_json()["data"]
    for view_key in VIEW_KEYS:
        response = client.post(
            f"/api/projects/{project['id']}/photos",
            data={"view_key": view_key, "photo": (io.BytesIO(b"fake-image"), f"{view_key}.jpg")},
            content_type="multipart/form-data",
        )
        assert response.status_code == 201
    assert client.post(f"/api/projects/{project['id']}/generate").status_code == 200


def test_generation_rejects_incomplete_project(client):
    project = client.post("/api/projects", json={"name": "不完整"}).get_json()["data"]
    response = client.post(f"/api/projects/{project['id']}/generate")
    assert response.status_code == 400
    assert "还缺少 10 张照片" in response.get_json()["message"]

