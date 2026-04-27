import json
import os
import pathlib
from . import store

_DATA_DIR = pathlib.Path(__file__).parent / "data"


def _atomic_write(filename: str, data):
    path = _DATA_DIR / filename
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)
    store.reload_content()


def save_topics(data):
    _atomic_write("topics.json", data)


def save_chapters(data):
    _atomic_write("chapters.json", data)


def save_lessons(data):
    _atomic_write("lessons.json", data)


def save_paths(data):
    _atomic_write("paths.json", data)


def save_badges(data):
    _atomic_write("badges.json", data)
