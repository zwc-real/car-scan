from __future__ import annotations

import json
import struct
from functools import lru_cache
from pathlib import Path

from flask import Blueprint, jsonify, send_file


models = Blueprint("models", __name__, url_prefix="/api/models")
MODEL_PATH = Path(__file__).resolve().parent.parent / "assets" / "models" / "placeholder.glb"


@lru_cache(maxsize=1)
def model_metadata():
    """只读 GLB 的 JSON 块，统计实际面数，不把 34 MiB 二进制整体载入内存。"""
    with MODEL_PATH.open("rb") as stream:
        magic, version, size, json_size, chunk_type = struct.unpack("<5I", stream.read(20))
        if magic != 0x46546C67 or version != 2 or chunk_type != 0x4E4F534A:
            raise ValueError("测试模型必须是 GLB 2.0")
        document = json.loads(stream.read(json_size))
    faces = 0
    for mesh in document.get("meshes", []):
        for primitive in mesh["primitives"]:
            if primitive.get("mode", 4) == 4:
                accessor = primitive.get("indices", primitive["attributes"]["POSITION"])
                faces += document["accessors"][accessor]["count"] // 3
    return {"url": "/api/models/placeholder.glb", "name": "Emerald Tufted Chesterfield",
            "placeholder": True, "bytes": size, "faces": faces,
            "textures": len(document.get("textures", []))}


@models.get("/placeholder")
def get_placeholder():
    return jsonify(data=model_metadata())


@models.get("/placeholder.glb")
def get_placeholder_file():
    # conditional 支持 ETag / 304 以及 Range 请求，不重复下载大型测试资产。
    return send_file(MODEL_PATH, mimetype="model/gltf-binary", conditional=True,
                     max_age=3600, download_name="placeholder.glb")
