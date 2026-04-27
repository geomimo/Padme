"""One-time migration: dump hardcoded Python content dicts to JSON files.

Run from backend/ directory:
    python -m app.content.migrate
"""
import json
import pathlib

# Import originals before they become shims
from .lessons import TOPICS, CHAPTERS, LESSONS
from .paths import PATHS
from .badges import BADGES

_DATA_DIR = pathlib.Path(__file__).parent / "data"
_DATA_DIR.mkdir(exist_ok=True)


def _write(filename, data):
    path = _DATA_DIR / filename
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {path}")


if __name__ == "__main__":
    _write("topics.json", TOPICS)
    _write("chapters.json", CHAPTERS)
    _write("lessons.json", LESSONS)
    # Normalise None → null (json.dumps handles this already)
    paths_clean = []
    for p in PATHS:
        paths_clean.append({k: v for k, v in p.items()})
    _write("paths.json", paths_clean)
    _write("badges.json", BADGES)
    print("Migration complete.")
