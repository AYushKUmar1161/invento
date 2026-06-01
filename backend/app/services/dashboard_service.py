from sqlalchemy.orm import Session
from app.models.models import Product, Customer, Order
from app.schemas.schemas import DashboardStats, ProductOut

def get_dashboard_stats(db: Session) -> DashboardStats:
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    
    # Get products where stock is less than 10
    low_stock = db.query(Product).filter(Product.stock_quantity < 10).order_by(Product.stock_quantity.asc()).all()
    
    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=[ProductOut.model_validate(p) for p in low_stock]
    )
