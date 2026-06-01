#!/bin/sh

echo "Waiting for database to boot..."

# Since our docker-compose uses service_healthy, the db is guaranteed to be up.
# Let's run seeding to create database tables and seed if empty.
python seed.py

echo "Starting FastAPI backend server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
