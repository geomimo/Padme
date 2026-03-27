#!/bin/sh
set -e

# Seed the database on first run (when the DB file doesn't exist yet)
if [ ! -f /app/data/padme.db ]; then
    echo "==> First run detected — seeding database..."
    python seed.py
    echo "==> Seed complete."
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
