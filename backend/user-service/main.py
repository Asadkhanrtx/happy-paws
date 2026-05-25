import os
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import uvicorn
from passlib.context import CryptContext

app = FastAPI(title="User Service")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://happypaws:happypaws123@localhost:3306/happypaws_users"
)

def _init_db():
    # Ensure the database exists before connecting to it
    base_url = DATABASE_URL.rsplit("/", 1)[0]
    db_name  = DATABASE_URL.rsplit("/", 1)[1]
    root_engine = create_engine(base_url + "/")
    with root_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))
    root_engine.dispose()

try:
    _init_db()
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()

    class User(Base):
        __tablename__ = "users"
        id              = Column(Integer, primary_key=True, index=True)
        email           = Column(String(255), unique=True, index=True)
        hashed_password = Column(String(255))
        role            = Column(String(50), default="user")

    Base.metadata.create_all(bind=engine)
    DB_READY = True
except Exception as e:
    print(f"[user-service] DB init failed: {e}")
    DB_READY = False

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserCreate(BaseModel):
    email:    str
    password: str
    role:     str = "user"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
@app.get("/health")
def health():
    return {"service": "User Service", "db_ready": DB_READY}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        email=user.email,
        hashed_password=pwd_context.hash(user.password),
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User registered successfully"}

@app.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    return {
        "access_token": "jwt-placeholder",
        "token_type": "bearer",
        "role": db_user.role,
        "email": db_user.email,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
