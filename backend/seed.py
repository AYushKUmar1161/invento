import sys
import os

# Add parent directory to path to support imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database.session import SessionLocal, Base, engine
from app.models.models import Product, Customer, Order, OrderItem

def seed_database():
    print("Initializing database tables...")
    # This automatically creates tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(Product).count() > 0:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding products...")
        products = [
            Product(name="Gaming Laptop Core i9", sku="LAP-G01", price=1499.99, stock_quantity=12),
            Product(name="UltraWide Monitor 34\"", sku="MON-UW34", price=549.99, stock_quantity=3), # Low stock
            Product(name="Mechanical Keyboard RGB", sku="KEY-MX80", price=129.99, stock_quantity=25),
            Product(name="Wireless Gaming Mouse", sku="MOU-WRLS", price=79.99, stock_quantity=0),   # Out of stock
            Product(name="USB-C Travel Hub 8-in-1", sku="HUB-USBC", price=49.99, stock_quantity=8), # Low stock
            Product(name="Studio Headphones Pro", sku="AUD-HD100", price=199.99, stock_quantity=18),
        ]
        db.add_all(products)
        db.flush() # Flush to get product IDs

        print("Seeding customers...")
        customers = [
            Customer(full_name="Alice Vance", email="alice@vance.com", phone_number="+1-555-0199"),
            Customer(full_name="Bob Miller", email="bob@miller.com", phone_number="+1-555-0142"),
            Customer(full_name="Charlie Rogers", email="charlie@rogers.com", phone_number="+1-555-0187"),
        ]
        db.add_all(customers)
        db.flush() # Flush to get customer IDs

        print("Seeding sample orders...")
        # Order 1: Alice buys Gaming Laptop and Mechanical Keyboard
        order1 = Order(
            customer_id=customers[0].id,
            total_amount=1629.98,
            status="Pending"
        )
        db.add(order1)
        db.flush()

        order_items1 = [
            OrderItem(order_id=order1.id, product_id=products[0].id, quantity=1, unit_price=1499.99),
            OrderItem(order_id=order1.id, product_id=products[2].id, quantity=1, unit_price=129.99),
        ]
        db.add_all(order_items1)

        # Update stocks for Order 1
        products[0].stock_quantity -= 1
        products[2].stock_quantity -= 1

        # Order 2: Bob buys 2 USB-C Hubs
        order2 = Order(
            customer_id=customers[1].id,
            total_amount=99.98,
            status="Completed"
        )
        db.add(order2)
        db.flush()

        order_items2 = [
            OrderItem(order_id=order2.id, product_id=products[4].id, quantity=2, unit_price=49.99),
        ]
        db.add_all(order_items2)

        # Update stocks for Order 2
        products[4].stock_quantity -= 2

        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
