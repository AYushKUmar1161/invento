# 📦 Invento - Production DevOps Deployment Guide

This repository contains the full-stack codebase and DevOps blueprints for **Invento**, a production-ready Inventory & Order Management System. It is engineered with a high-performance **FastAPI** backend, transaction-isolated order processing, low-inventory notifications, and a modern **React 19 + Material UI** client panel, fully optimized for cloud deployment.

---

## 🚀 Live Production URL Registry

* **GitHub Repository URL**: [https://github.com/AYushKUmar1161/invento](https://github.com/AYushKUmar1161/invento)
* **Docker Hub Image (Backend)**: `docker.io/ayushkumar1161/invento-backend:latest`
* **Docker Hub Image (Frontend)**: `docker.io/ayushkumar1161/invento-frontend:latest`
* **Render Backend URL**: `https://invento-backend-n5b0.onrender.com` (Example)
* **Vercel Frontend URL**: `https://invento-frontend.vercel.app` (Example)

---

## 🛠️ DevOps Blueprints & Runtimes

### 1. Production-Ready Dockerfile for Backend (`backend/Dockerfile`)
Uses a secure, multi-stage architecture to separate compiler environments from runtime execution. It runs as a **non-root user** (`appuser` with UID 1000) for security.

```dockerfile
# Stage 1: Builder
FROM python:3.12-slim AS builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runner (Production)
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH=/home/appuser/.local/bin:$PATH
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -u 1000 -m appuser
USER appuser
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1
CMD ["sh", "start.sh"]
```

---

### 2. Production-Ready Dockerfile for Frontend (`frontend/Dockerfile`)
Compiles Vite + React 19 static assets in a build container, then hosts them with high-performance Alpine Nginx. Includes deep-routing fallback configuration.

```dockerfile
# Stage 1: Build Assets
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV VITE_API_URL=""
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 3. Production Local Orchestration (`docker-compose.yml`)
Brings up a PostgreSQL 16 server, waits until it is fully healthy, then launches the backend with automatic migrations/seeding, and routes the frontend dynamically.

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: inventory_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: inventory_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d inventory_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: inventory_backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgrespassword@postgres:5432/inventory_db
      - SECRET_KEY=your-super-secret-key-for-development-use-only
      - ALLOWED_ORIGINS=http://localhost:5173,http://localhost
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: inventory_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy

volumes:
  postgres_data:
```

---

### 4. Excluded Artifact Filters (`.dockerignore` files)

#### Backend (`backend/.dockerignore`)
```text
.git
.gitignore
__pycache__
*.pyc
*.pyo
venv
.env
.pytest_cache
tests
Dockerfile
.dockerignore
```

#### Frontend (`frontend/.dockerignore`)
```text
.git
.gitignore
node_modules
dist
.env
Dockerfile
.dockerignore
```

---

## ☁️ 3. Cloud Deployment Procedures

### 5. Render PostgreSQL Provisioning
1. Log in to [Render.com](https://render.com).
2. Click **New** ➔ **PostgreSQL**.
3. Configure settings:
   - **Name**: `inventory_db`
   - **Database Name**: `inventory_db`
   - **User**: `postgres`
   - **Plan**: `Free`
4. Click **Create Database**. Copy the **Internal Database URL** for your backend.

---

### 6. Render Backend Deployment Steps
1. On Render, click **New** ➔ **Web Service**.
2. Connect your Git repository: `https://github.com/AYushKUmar1161/invento.git`.
3. Configure settings:
   - **Name**: `invento-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the required **Environment Variables** (see Section 8).
5. Click **Deploy Web Service** and copy your public URL.

---

### 7. Vercel Frontend Deployment Steps
1. Log in to [Vercel](https://vercel.com).
2. Import your GitHub repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the required **Environment Variables** (see Section 8).
5. Click **Deploy**. Vercel will build the frontend assets. Deep SPA routing is automatically handled by the pre-configured [vercel.json](file:///c:/Users/ADMIN/OneDrive/Desktop/ethara/frontend/vercel.json) file.

---

### 8. Environment Variables Specification

#### Backend (Render environment parameters)
* `DATABASE_URL` ➔ *(Connection string copied from Render PostgreSQL)*
* `SECRET_KEY` ➔ *(A cryptographically secure string)*
* `ALLOWED_ORIGINS` ➔ `https://invento-frontend.vercel.app` *(Your Vercel URL)*

#### Frontend (Vercel environment parameters)
* `VITE_API_URL` ➔ `https://invento-backend.onrender.com` *(Your Render URL)*

---

### 9. Infrastructure as Code: `render.yaml`
Deploy the entire backend stack with one click using the Render Blueprint specification:

```yaml
databases:
  - name: inventory_db
    databaseName: inventory_db
    user: postgres
    plan: free

services:
  - type: web
    name: invento-backend
    env: python
    plan: free
    rootDir: backend
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: inventory_db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: ALLOWED_ORIGINS
        value: "https://invento-frontend.vercel.app"
```

---

### 10. Automated GitHub Actions CI/CD Workflow (`.github/workflows/deploy.yml`)
Save this file as `.github/workflows/deploy.yml` in your repository. It automatically runs tests, builds your Docker images, pushes them to Docker Hub, and triggers Render to pull and deploy the latest code on every push to `main`!

```yaml
name: Continuous Integration & Deployment (CI/CD)

on:
  push:
    branches: [ "main" ]

jobs:
  test-and-build:
    name: Run Tests, Build and Push Images
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Source Code
      uses: actions/checkout@v4

    # 1. Setup Python & Run Backend Tests
    - name: Setup Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'

    - name: Install Dependencies
      run: |
        cd backend
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install email-validator pytest httpx

    - name: Run Backend Tests
      run: |
        cd backend
        python -m pytest -v

    # 2. Login to Docker Hub
    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_PASSWORD }}

    # 3. Build & Push Backend Docker Image
    - name: Build & Push Backend Image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/invento-backend:latest

    # 4. Build & Push Frontend Docker Image
    - name: Build & Push Frontend Image
      uses: docker/build-push-action@v5
      with:
        context: ./frontend
        push: true
        tags: ${{ secrets.DOCKERHUB_USERNAME }}/invento-frontend:latest

    # 5. Trigger Auto-Deploy on Render
    - name: Trigger Render Deploy Hook
      if: success()
      run: |
        curl -X GET "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
```

---

### 11. Docker Hub Build & Push CLI Commands
To compile and upload the images manually:
```bash
docker login -u YOUR_DOCKERHUB_USERNAME
docker build -t YOUR_DOCKERHUB_USERNAME/invento-backend:latest ./backend
docker build -t YOUR_DOCKERHUB_USERNAME/invento-frontend:latest ./frontend
docker push YOUR_DOCKERHUB_USERNAME/invento-backend:latest
docker push YOUR_DOCKERHUB_USERNAME/invento-frontend:latest
```

---

## 🔒 4. Security & CORS Architecture

### 12. Health Check Endpoint Configuration
FastAPI monitors health through the `/health` endpoint:
```python
@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}
```

### 13. Production CORS Configuration
Safe production CORS mapping is configured dynamically in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 14. Production Security Best Practices
1. **User Privilege Isolation**: Containers run on custom UIDs rather than default root layers.
2. **Reverse Proxy Masking**: The REST backend server acts inside an internal network. The browser routes requests on a unified port `80`, fully avoiding CORS.
3. **Database SSL**: Render database connections require `sslmode=require` query parameters to encrypt transit payloads.
4. **Parameterized Protection**: SQLAlchemy ORM natively splits parameter tags to fully block SQL Injection attacks.
5. **Robust Schema Validations**: Pydantic v2 enforces clean, parameterized formats before data is committed.
