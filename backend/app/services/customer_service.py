from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.models import Customer
from app.schemas.schemas import CustomerCreate
from fastapi import HTTPException, status

def get_all_customers(db: Session, search: Optional[str] = None) -> List[Customer]:
    query = db.query(Customer)
    if search:
        query = query.filter(
            or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
    return query.order_by(Customer.id.desc()).all()

def get_customer_by_id(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
    # Check email uniqueness
    existing = db.query(Customer).filter(Customer.email == customer_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer email '{customer_in.email}' already registered"
        )
        
    customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer_by_id(db, customer_id)
    db.delete(customer)
    db.commit()
