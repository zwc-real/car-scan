import struct

from app import create_app


def test_placeholder_model_and_range(tmp_path):
    app = create_app({"TESTING": True, "DATABASE": str(tmp_path / "db.sqlite3"),
                      "UPLOAD_FOLDER": str(tmp_path / "uploads")})
    client = app.test_client()
    metadata = client.get("/api/models/placeholder").get_json()["data"]
    assert metadata["placeholder"] is True
    assert metadata["faces"] == 310052
    assert metadata["textures"] == 2
    response = client.get(metadata["url"], headers={"Range": "bytes=0-11"})
    assert response.status_code == 206
    assert response.mimetype == "model/gltf-binary"
    assert struct.unpack("<3I", response.data) == (0x46546C67, 2, metadata["bytes"])
    assert client.get(metadata["url"], headers={"If-None-Match": response.headers["ETag"]}).status_code == 304
