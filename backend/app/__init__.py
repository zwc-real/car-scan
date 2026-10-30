from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify

from . import db
from .projects import api
from .models import models


def create_app(test_config: dict | None = None) -> Flask:
    """创建 Flask 应用；配置保持小而明确，便于容器和测试覆盖。"""

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        DATABASE=str(Path(app.instance_path) / "car_scan.sqlite3"),
        UPLOAD_FOLDER=str(Path(app.root_path).parent / "uploads"),
        MAX_CONTENT_LENGTH=12 * 1024 * 1024,
        PROCESSING_SECONDS=float(os.getenv("PROCESSING_SECONDS", "30")),
    )
    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    app.register_blueprint(api)
    app.register_blueprint(models)

    @app.after_request
    def add_cors_headers(response):
        # 微信小程序不受浏览器 CORS 限制；这里主要服务 Taro H5 开发预览。
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
        return response

    @app.errorhandler(413)
    def file_too_large(_error):
        return jsonify(message="单次上传不能超过 12 MB"), 413

    with app.app_context():
        db.init_db()

    return app

