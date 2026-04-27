import json
import threading
import pathlib

_DATA_DIR = pathlib.Path(__file__).parent / "data"
_lock = threading.Lock()

TOPICS = []
CHAPTERS = []
LESSONS = {}
PATHS = []
BADGES = []
PATHS_BY_ID = {}
BADGES_BY_ID = {}


def _load():
    global TOPICS, CHAPTERS, LESSONS, PATHS, BADGES, PATHS_BY_ID, BADGES_BY_ID
    with _lock:
        TOPICS   = json.loads((_DATA_DIR / "topics.json").read_text(encoding="utf-8"))
        CHAPTERS = json.loads((_DATA_DIR / "chapters.json").read_text(encoding="utf-8"))
        LESSONS  = json.loads((_DATA_DIR / "lessons.json").read_text(encoding="utf-8"))
        PATHS    = json.loads((_DATA_DIR / "paths.json").read_text(encoding="utf-8"))
        BADGES   = json.loads((_DATA_DIR / "badges.json").read_text(encoding="utf-8"))
        PATHS_BY_ID  = {p["id"]: p for p in PATHS}
        BADGES_BY_ID = {b["id"]: b for b in BADGES}


def reload_content():
    _load()


_load()
