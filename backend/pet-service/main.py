import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, text
from sqlalchemy.orm import declarative_base, sessionmaker
import uvicorn
from typing import Optional

app = FastAPI(title="Pet Service")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://happypaws:happypaws123@localhost:3306/happypaws_pets"
)

SEED_PETS = [
    {"name": "Bella",   "type": "Dog",    "breed": "Golden Retriever", "age": 3, "price": 0.0,
     "description": "Friendly and energetic, loves fetch and cuddles.",
     "image_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"},
    {"name": "Luna",    "type": "Cat",    "breed": "Maine Coon",       "age": 2, "price": 0.0,
     "description": "Fluffy and gentle, perfect lap companion.",
     "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"},
    {"name": "Charlie", "type": "Dog",    "breed": "French Bulldog",   "age": 1, "price": 0.0,
     "description": "Playful pup with a huge personality.",
     "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80"},
    {"name": "Milo",    "type": "Cat",    "breed": "Scottish Fold",    "age": 4, "price": 0.0,
     "description": "Calm and curious, loves window-watching.",
     "image_url": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80"},
    {"name": "Daisy",   "type": "Dog",    "breed": "Labrador",         "age": 2, "price": 0.0,
     "description": "Super smart and eager to please.",
     "image_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"},
    {"name": "Oliver",  "type": "Cat",    "breed": "British Shorthair","age": 3, "price": 0.0,
     "description": "Independent yet affectionate on his terms.",
     "image_url": "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?auto=format&fit=crop&w=600&q=80"},
    {"name": "Max",     "type": "Dog",    "breed": "Beagle",           "age": 5, "price": 0.0,
     "description": "Gentle senior dog, ideal for quiet homes.",
     "image_url": "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80"},
    {"name": "Coco",    "type": "Rabbit", "breed": "Holland Lop",      "age": 1, "price": 0.0,
     "description": "Tiny and adorable with floppy ears.",
     "image_url": "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80"},
    {"name": "Nala",    "type": "Dog",    "breed": "Siberian Husky",   "age": 2, "price": 0.0,
     "description": "Striking blue eyes, loves outdoor adventures.",
     "image_url": "https://images.unsplash.com/photo-1568572933382-74d440642117?auto=format&fit=crop&w=600&q=80"},
    {"name": "Simba",   "type": "Cat",    "breed": "Tabby",            "age": 6, "price": 0.0,
     "description": "Wise and mellow, perfect family cat.",
     "image_url": "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?auto=format&fit=crop&w=600&q=80"},
]

def _init_db():
    base_url = DATABASE_URL.rsplit("/", 1)[0]
    db_name  = DATABASE_URL.rsplit("/", 1)[1]
    root_engine = create_engine(base_url + "/")
    with root_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
    root_engine.dispose()

DB_READY = False
engine = None
SessionLocal = None
Base = declarative_base()

class PetModel(Base):
    __tablename__ = "pets"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100))
    type        = Column(String(50))
    breed       = Column(String(100))
    age         = Column(Integer)
    image_url   = Column(String(500))
    price       = Column(Float, default=0.0)
    description = Column(String(500), default="")
    available   = Column(Integer, default=1)

try:
    _init_db()
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    # Seed pets if table is empty
    with SessionLocal() as sess:
        if sess.query(PetModel).count() == 0:
            for p in SEED_PETS:
                sess.add(PetModel(**p))
            sess.commit()
    DB_READY = True
except Exception as e:
    print(f"[pet-service] DB init failed: {e}")

class PetCreate(BaseModel):
    name:        str
    type:        str
    breed:       str
    age:         int
    image_url:   str
    price:       Optional[float] = 0.0
    description: Optional[str]  = ""

@app.get("/")
@app.get("/health")
def health():
    return {"service": "Pet Service", "db_ready": DB_READY}

@app.get("/pets")
def get_pets(type: Optional[str] = None):
    if not DB_READY:
        return SEED_PETS
    with SessionLocal() as sess:
        q = sess.query(PetModel)
        if type:
            q = q.filter(PetModel.type == type)
        pets = q.all()
        return [
            {
                "id": p.id, "name": p.name, "type": p.type,
                "breed": p.breed, "age": p.age, "image_url": p.image_url,
                "price": p.price, "description": p.description,
                "available": bool(p.available),
            }
            for p in pets
        ]

@app.post("/pets")
def add_pet(pet: PetCreate):
    if not DB_READY:
        return {"msg": "DB unavailable"}
    with SessionLocal() as sess:
        sess.add(PetModel(**pet.dict()))
        sess.commit()
    return {"msg": "Pet added successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
