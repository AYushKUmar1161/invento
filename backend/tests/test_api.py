import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.models.models import Product, Customer, Order

# Setup Test Database using SQLite in-memory
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    # Create tables
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==========================================
# TEST CASES
# ==========================================

def test_create_product(client):
    response = client.post(
        "/api/products",
        json={"name": "Gaming Laptop", "sku": "LAP-001", "price": 1299.99, "stock_quantity": 15}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Gaming Laptop"
    assert data["sku"] == "LAP-001"
    assert data["price"] == 1299.99
    assert data["stock_quantity"] == 15
    assert "id" in data

def test_sku_uniqueness(client):
    # Create first product
    response1 = client.post(
        "/api/products",
        json={"name": "Laptop A", "sku": "LAP-001", "price": 1000.0, "stock_quantity": 5}
    )
    assert response1.status_code == 201
    
    # Create second product with identical SKU
    response2 = client.post(
        "/api/products",
        json={"name": "Laptop B", "sku": "LAP-001", "price": 1100.0, "stock_quantity": 3}
    )
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]

def test_create_customer(client):
    response = client.post(
        "/api/customers",
        json={"full_name": "Alice Smith", "email": "alice@example.com", "phone_number": "123-456-7890"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Alice Smith"
    assert data["email"] == "alice@example.com"
    assert "id" in data

def test_customer_email_uniqueness(client):
    # First customer
    response1 = client.post(
        "/api/customers",
        json={"full_name": "Alice Smith", "email": "alice@example.com"}
    )
    assert response1.status_code == 201
    
    # Second customer with same email
    response2 = client.post(
        "/api/customers",
        json={"full_name": "Bob Smith", "email": "alice@example.com"}
    )
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"]

def test_order_creation_success(client):
    # Setup: Create product and customer
    prod_resp = client.post(
        "/api/products",
        json={"name": "Monitor", "sku": "MON-001", "price": 200.00, "stock_quantity": 10}
    )
    cust_resp = client.post(
        "/api/customers",
        json={"full_name": "Charlie Brown", "email": "charlie@example.com"}
    )
    product_id = prod_resp.json()["id"]
    customer_id = cust_resp.json()["id"]
    
    # Place order
    order_resp = client.post(
        "/api/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "quantity": 3}]
        }
    )
    assert order_resp.status_code == 201
    order_data = order_resp.json()
    assert order_data["total_amount"] == 600.00
    assert order_data["status"] == "Pending"
    assert len(order_data["items"]) == 1
    
    # Check that stock decreased
    get_prod = client.get(f"/api/products/{product_id}")
    assert get_prod.json()["stock_quantity"] == 7

def test_order_creation_insufficient_stock(client):
    # Setup
    prod_resp = client.post(
        "/api/products",
        json={"name": "Keyboard", "sku": "KEY-001", "price": 50.00, "stock_quantity": 2}
    )
    cust_resp = client.post(
        "/api/customers",
        json={"full_name": "Charlie Brown", "email": "charlie@example.com"}
    )
    product_id = prod_resp.json()["id"]
    customer_id = cust_resp.json()["id"]
    
    # Place order for 5 keyboards (only 2 in stock)
    order_resp = client.post(
        "/api/orders",
        json={
            "customer_id": customer_id,
            "items": [{"product_id": product_id, "quantity": 5}]
        }
    )
    assert order_resp.status_code == 400
    assert "Insufficient stock" in order_resp.json()["detail"]
    
    # Verify stock remained at 2 (no deduction occurred)
    get_prod = client.get(f"/api/products/{product_id}")
    assert get_prod.json()["stock_quantity"] == 2

def test_order_transaction_rollback(client):
    # Setup two products: one has enough stock, the other does not
    prod1_resp = client.post(
        "/api/products",
        json={"name": "Mouse", "sku": "MOU-001", "price": 20.00, "stock_quantity": 10}
    )
    prod2_resp = client.post(
        "/api/products",
        json={"name": "Speaker", "sku": "SPK-001", "price": 100.00, "stock_quantity": 1}
    )
    cust_resp = client.post(
        "/api/customers",
        json={"full_name": "Charlie Brown", "email": "charlie@example.com"}
    )
    p1_id = prod1_resp.json()["id"]
    p2_id = prod2_resp.json()["id"]
    customer_id = cust_resp.json()["id"]
    
    # Place order: MOU-001 (quantity 2) and SPK-001 (quantity 2 - exceeds stock of 1)
    order_resp = client.post(
        "/api/orders",
        json={
            "customer_id": customer_id,
            "items": [
                {"product_id": p1_id, "quantity": 2},
                {"product_id": p2_id, "quantity": 2}
            ]
        }
    )
    assert order_resp.status_code == 400
    
    # Verify that BOTH products remained unchanged because of database transaction rollback!
    get_p1 = client.get(f"/api/products/{p1_id}")
    get_p2 = client.get(f"/api/products/{p2_id}")
    
    assert get_p1.json()["stock_quantity"] == 10
    assert get_p2.json()["stock_quantity"] == 1

def test_dashboard_stats(client):
    # Create products, customers, and orders
    client.post("/api/products", json={"name": "A", "sku": "A", "price": 1.0, "stock_quantity": 5}) # Low stock
    client.post("/api/products", json={"name": "B", "sku": "B", "price": 2.0, "stock_quantity": 15}) # High stock
    client.post("/api/customers", json={"full_name": "C", "email": "c@c.com"})
    
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_products"] == 2
    assert data["total_customers"] == 1
    assert data["total_orders"] == 0
    assert len(data["low_stock_products"]) == 1
    assert data["low_stock_products"][0]["sku"] == "A"
