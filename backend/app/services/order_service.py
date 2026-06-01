from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.models import Order, OrderItem, Product, Customer
from app.schemas.schemas import OrderCreate
from fastapi import HTTPException, status

def get_all_orders(db: Session) -> List[Order]:
    orders = db.query(Order).order_by(Order.id.desc()).all()
    # Populate customer name dynamically to make it friendly
    for order in orders:
        if order.customer:
            order.customer_name = order.customer.full_name
        else:
            order.customer_name = "Unknown Customer"
            
        for item in order.items:
            if item.product:
                item.product_name = item.product.name
                item.sku = item.product.sku
            else:
                item.product_name = "Deleted Product"
                item.sku = "N/A"
    return orders

def get_order_by_id(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
        
    if order.customer:
        order.customer_name = order.customer.full_name
    else:
        order.customer_name = "Unknown Customer"
        
    for item in order.items:
        if item.product:
            item.product_name = item.product.name
            item.sku = item.product.sku
        else:
            item.product_name = "Deleted Product"
            item.sku = "N/A"
            
    return order

def create_order(db: Session, order_in: OrderCreate) -> Order:
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_in.customer_id} not found"
        )

    # Use nested transaction or standard try-catch rollback block
    try:
        total_amount = 0.0
        db_items = []
        
        # Track products to update stock in bulk or one-by-one
        for item in order_in.items:
            # Get product with SELECT FOR UPDATE to prevent race conditions (highly production ready!)
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {item.product_id} not found"
                )
                
            # Verify stock
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Required: {item.quantity}, Available: {product.stock_quantity}"
                )
                
            # Decrement stock
            product.stock_quantity -= item.quantity
            
            # Calculate item cost
            unit_price = float(product.price)
            item_cost = unit_price * item.quantity
            total_amount += item_cost
            
            # Create OrderItem object
            db_item = OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=unit_price
            )
            db_items.append(db_item)
            
        # Create Order
        db_order = Order(
            customer_id=order_in.customer_id,
            total_amount=total_amount,
            status="Pending"
        )
        
        db.add(db_order)
        db.flush() # Flushes order to get db_order.id
        
        # Link items to order
        for db_item in db_items:
            db_item.order_id = db_order.id
            db.add(db_item)
            
        db.commit()
        db.refresh(db_order)
        
        # Dynamic properties for Out Schema mapping
        db_order.customer_name = customer.full_name
        for item in db_order.items:
            # Fetch product info
            item.product_name = item.product.name if item.product else "Deleted Product"
            item.sku = item.product.sku if item.product else "N/A"
            
        return db_order
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to place order: {str(e)}"
        )

def delete_order(db: Session, order_id: int) -> None:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    
    # Optional: Should we restock items if we cancel/delete?
    # The requirement says "DELETE /orders/{id}" deletes the order.
    # To be extremely clean, we just delete it. Cascade deletes OrderItems.
    db.delete(order)
    db.commit()
