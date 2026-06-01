# Invento - Inventory & Order Management System

A production-ready full-stack Inventory & Order Management System named **Invento**, engineered with a high-performance **FastAPI** backend and a modern **React 19 + Material UI (MUI)** client panel. The application includes transaction-isolated order processing, automated live stock level deductions, low-inventory notifications, and comprehensive Docker containerization.

## 🚀 Tech Stack

### Backend
* **Core**: Python 3.12, FastAPI
* **ORM & Database Connection**: SQLAlchemy (2.0)
* **Migrations**: Alembic
* **Validations**: Pydantic v2
* **Testing**: Pytest & HTTPX client

### Frontend
* **Core**: React 19, Vite, React Router v6
* **Component Framework**: Material UI (MUI v5)
* **API Client**: Axios

### Containerization & Database
* **Database Engine**: PostgreSQL 16
* **Deployment Packaging**: Docker & Multi-stage Docker Compose

---

## 📂 Project Architecture

```text
invento/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes (products, customers, orders, stats)
│   │   ├── core/         # Global configuration using Pydantic settings
│   │   ├── database/     # SQLAlchemy engine, session maker & Base
│   │   ├── models/       # Declarative database tables models
│   │   ├── schemas/      # Pydantic data validation schemas
│   │   ├── services/     # Business logic & transaction isolation layer
│   │   └── main.py       # App launchpad, CORS rules & exception mapping
│   ├── alembic/          # Database migrations folder
│   ├── tests/            # Test suite (SKUs, transaction rollbacks, etc)
│   ├── requirements.txt  # Pin-point python dependencies
│   ├── seed.py           # Database seeder script
│   ├── start.sh          # Orchestrated table-builder and startup shell script
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Common shared visual parts
│   │   ├── context/      # Notification Snackbar context
│   │   ├── layouts/      # Dashboard layouts with collapsible sidebars
│   │   ├── pages/        # Dashboard, Products, Customers, Orders
│   │   ├── services/     # Axios api config and error parsers
│   │   ├── App.jsx       # Theme system configuration and routing
│   │   ├── index.css     # Dark reset scrollbars and glow animations
│   │   └── main.jsx      # React launcher entrypoint
│   ├── public/           # Shared assets
│   ├── nginx.conf        # Custom Nginx server configuration for deep routing
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml    # Main orchestration docker config
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Option A: Run via Docker Compose (Recommended)

1. Make sure you have **Docker** and **Docker Compose** installed.
2. In the project root folder, boot the entire stack by executing:
   ```bash
   docker-compose up --build
   ```
3. Docker Compose will launch:
   * **PostgreSQL Database** on port `5432`
   * **FastAPI Backend** on port `8000` (docs available at [http://localhost:8000/docs](http://localhost:8000/docs))
   * **React Frontend Dashboard** on port `80` (accessible at [http://localhost](http://localhost))
4. The database is **automatically seeded** with a rich portfolio of electronics products (some low-stock and out-of-stock), client customer profiles, and transaction order receipts so the visual dashboard looks alive immediately!

---

### Option B: Local Manual Setup (Without Docker)

#### 1. Setup Backend
1. Open a terminal and enter the `backend/` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment configuration and edit if needed:
   ```bash
   copy .env.example .env
   ```
5. Seed database & run server:
   ```bash
   python seed.py
   python app/main.py
   ```

#### 2. Setup Frontend
1. Open a new terminal and enter the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
4. Start the Vite React development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## 🛡️ Business Logic & Validations

1. **SKU Uniqueness**: Rejects duplicate SKU codes across all products.
2. **Email Uniqueness**: Restricts customer registry from containing duplicated email entries.
3. **Transaction Rollbacks**: Ordering relies on a nested database transaction. If stock check fails or item allocations throw exceptions, the entire process is immediately rolled back, safeguarding stock values.
4. **Live Stock Decrements**: After successfully placing an order, stock values are instantly decremented in the inventory catalog.
5. **No Negative Stock**: Database constraints and Pydantic validation schemas enforce that price must be `> 0`, order quantities `> 0`, and inventory stocks `>= 0`.

---

## 🧪 Testing

The backend contains a test suite built on `pytest` using an isolated **in-memory SQLite** engine. This tests all constraints (SKU/Email uniqueness), order transactions, and stock limits cleanly.

Run testing commands:
```bash
cd backend
pytest -v
```

---

## 🗺️ REST API Documentation

FastAPI dynamically serves Swagger API docs at `http://localhost:8000/docs`.

### Products
* `POST /api/products` — Create a product.
* `GET /api/products` — List all products (supports optional `?search=Query` matching on name/SKU).
* `GET /api/products/{id}` — Get single product.
* `PUT /api/products/{id}` — Edit product values.
* `DELETE /api/products/{id}` — Delete a product.

### Customers
* `POST /api/customers` — Register a client.
* `GET /api/customers` — List customers (supports `?search=` matching on name/email).
* `GET /api/customers/{id}` — Get single customer details.
* `DELETE /api/customers/{id}` — Delete customer account.

### Orders
* `POST /api/orders` — Place order and decrement stocks.
  * **Payload Schema**:
    ```json
    {
      "customer_id": 1,
      "items": [
        { "product_id": 2, "quantity": 1 },
        { "product_id": 5, "quantity": 3 }
      ]
    }
    ```
* `GET /api/orders` — List order receipts history.
* `GET /api/orders/{id}` — Get specific invoice summary.
* `DELETE /api/orders/{id}` — Cancel/remove order.

### Dashboard
* `GET /api/dashboard` — Statistics aggregation.
  * **Response Format**:
    ```json
    {
      "total_products": 6,
      "total_customers": 3,
      "total_orders": 2,
      "low_stock_products": [
        { "id": 2, "name": "UltraWide Monitor 34\"", "sku": "MON-UW34", "price": 549.99, "stock_quantity": 3 }
      ]
    }
    ```

---

## ☁️ Deployment Guidelines

### Backend Deployment (Render)
1. Register a **Render PostgreSQL database** service and copy its `Internal Database URL`.
2. Deploy a new **Render Web Service** pointing to your GitHub repository.
3. Configure settings:
   * **Runtime**: `Python`
   * **Root Directory**: `backend`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables** in Render Settings:
   * `DATABASE_URL` — *(Paste the Render PostgreSQL URL)*
   * `SECRET_KEY` — *(A secure randomly generated key)*
   * `ALLOWED_ORIGINS` — `https://your-frontend.vercel.app`

### Frontend Deployment (Vercel)
1. Go to Vercel and create a new project pointing to your GitHub repository.
2. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Under Environment Variables, add:
   * `VITE_API_URL` — *(Paste your deployed Render Backend URL, e.g., `https://your-backend.onrender.com`)*
4. Click **Deploy**. Vercel will build the frontend assets and host the dashboard automatically.
