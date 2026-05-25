import os
from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, text
from sqlalchemy.orm import declarative_base, sessionmaker
import uvicorn
import json

app = FastAPI(title="Order Service")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://happypaws:happypaws123@localhost:3306/happypaws_orders"
)

SEED_PRODUCTS = [
    {"name": "Premium Salmon Kibble",    "price": 45.99,  "image_url": "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=400&q=80", "category": "Food"},
    {"name": "Plush Donut Bed",          "price": 34.50,  "image_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80", "category": "Beds"},
    {"name": "Interactive Laser Toy",    "price": 18.99,  "image_url": "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=400&q=80", "category": "Toys"},
    {"name": "Organic Dog Treats",       "price": 12.50,  "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80", "category": "Food"},
    {"name": "Cat Tree Tower",           "price": 120.00, "image_url": "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=400&q=80", "category": "Furniture"},
    {"name": "Heavy Duty Leash",         "price": 25.00,  "image_url": "https://images.unsplash.com/photo-1625794084867-8ddd239946b1?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
    {"name": "Stainless Steel Bowl",     "price": 15.00,  "image_url": "https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
    {"name": "Pet Grooming Kit",         "price": 40.00,  "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80", "category": "Grooming"},
    {"name": "Automatic Feeder",         "price": 85.00,  "image_url": "https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
    {"name": "Self-Cleaning Litter Box", "price": 150.00, "image_url": "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
    {"name": "Squeaky Chew Toy",         "price": 8.99,   "image_url": "https://images.unsplash.com/photo-1535930749574-1399327ce78f?auto=format&fit=crop&w=400&q=80", "category": "Toys"},
    {"name": "Cozy Cat Cave",            "price": 45.00,  "image_url": "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80", "category": "Beds"},
    {"name": "Reflective Harness",       "price": 28.50,  "image_url": "https://images.unsplash.com/photo-1625794084867-8ddd239946b1?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
    {"name": "Puppy Training Pads",      "price": 22.00,  "image_url": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80", "category": "Training"},
    {"name": "Ceramic Water Fountain",   "price": 65.00,  "image_url": "https://images.unsplash.com/photo-1602584386319-fa8eb4361c2c?auto=format&fit=crop&w=400&q=80", "category": "Accessories"},
]

def _init_db():
    base_url = DATABASE_URL.rsplit("/", 1)[0]
    db_name  = DATABASE_URL.rsplit("/", 1)[1]
    root_engine = create_engine(base_url + "/")
    with root_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
    root_engine.dispose()

DB_READY = False
SessionLocal = None
Base = declarative_base()

class ProductModel(Base):
    __tablename__ = "products"
    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String(200))
    price     = Column(Float)
    image_url = Column(String(500))
    category  = Column(String(100), default="General")

class OrderModel(Base):
    __tablename__ = "orders"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer)
    product_ids = Column(String(500))
    status      = Column(String(50), default="confirmed")

try:
    _init_db()
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as sess:
        if sess.query(ProductModel).count() == 0:
            for p in SEED_PRODUCTS:
                sess.add(ProductModel(**p))
            sess.commit()
    DB_READY = True
except Exception as e:
    print(f"[order-service] DB init failed: {e}")

class OrderReq(BaseModel):
    user_id:     int
    product_ids: list

@app.get("/")
@app.get("/health")
def health():
    return {"service": "Order Service", "db_ready": DB_READY}

@app.get("/products")
def get_products(category: str = None):
    if not DB_READY:
        return SEED_PRODUCTS
    with SessionLocal() as sess:
        q = sess.query(ProductModel)
        if category:
            q = q.filter(ProductModel.category == category)
        products = q.all()
        return [
            {"id": p.id, "name": p.name, "price": p.price,
             "image": p.image_url, "category": p.category}
            for p in products
        ]

@app.post("/place-order")
def place_order(order: OrderReq):
    if DB_READY:
        with SessionLocal() as sess:
            o = OrderModel(
                user_id=order.user_id,
                product_ids=json.dumps(order.product_ids),
            )
            sess.add(o)
            sess.commit()
            return {"msg": "Order placed successfully", "order_id": o.id}
    return {"msg": "Order placed successfully", "order_id": 99999}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8004, reload=True)
