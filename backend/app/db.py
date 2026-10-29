from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone

import click
from flask import current_app, g


SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'processing', 'done')),
    progress INTEGER NOT NULL DEFAULT 0,
    faces INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL,
    processing_started_at TEXT
);

CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    view_key TEXT NOT NULL,
    file_path TEXT NOT NULL,
    UNIQUE(project_id, view_key),
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
"""

SEED_PROJECTS = [
    ("demo-red", "红色跑车 Racer", "#E8452C", 128400, 0),
    ("demo-blue", "蓝色越野 Rover", "#2F6FED", 96200, 1),
    ("demo-yellow", "黄色出租车", "#F2B01E", 110800, 4),
    ("demo-green", "绿色小卡车", "#1FA37A", 87500, 10),
]

VIEW_KEYS = (
    "front", "back", "left", "right", "top", "bottom",
    "leftFront", "rightFront", "leftBack", "rightBack",
)


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"], detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(_error=None) -> None:
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db() -> None:
    connection = get_db()
    connection.executescript(SCHEMA)
    count = connection.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    if count:
        return

    now = datetime.now(timezone.utc)
    for project_id, name, color, faces, days_ago in SEED_PROJECTS:
        created_at = (now - timedelta(days=days_ago)).isoformat()
        connection.execute(
            "INSERT INTO projects (id, name, created_at, status, progress, faces, color) VALUES (?, ?, ?, 'done', 100, ?, ?)",
            (project_id, name, created_at, faces, color),
        )
        connection.executemany(
            "INSERT INTO photos (project_id, view_key, file_path) VALUES (?, ?, ?)",
            [(project_id, view_key, f"demo://{view_key}") for view_key in VIEW_KEYS],
        )
    connection.commit()


@click.command("init-db")
def init_db_command() -> None:
    init_db()
    click.echo("Initialized the database.")


def init_app(app) -> None:
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)

