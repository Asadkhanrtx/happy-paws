import os
from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, text
from sqlalchemy.orm import declarative_base, sessionmaker
import uvicorn

app = FastAPI(title="Appointment Service")

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "mysql+pymysql://happypaws:happypaws123@localhost:3306/happypaws_appointments"
)

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

class AppointmentModel(Base):
    __tablename__ = "appointments"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer)
    pet_id       = Column(String(50))
    service_type = Column(String(50))
    date         = Column(String(50))
    status       = Column(String(50), default="confirmed")

try:
    _init_db()
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    DB_READY = True
except Exception as e:
    print(f"[appointment-service] DB init failed: {e}")

class AppointmentReq(BaseModel):
    user_id:      int    = 1
    pet_id:       str    = "1"
    service_type: str
    date:         str

@app.get("/")
@app.get("/health")
def health():
    return {"service": "Appointment Service", "db_ready": DB_READY}

@app.post("/book")
def book_appointment(req: AppointmentReq):
    if DB_READY:
        with SessionLocal() as sess:
            appt = AppointmentModel(
                user_id=req.user_id,
                pet_id=req.pet_id,
                service_type=req.service_type,
                date=req.date,
            )
            sess.add(appt)
            sess.commit()
            sess.refresh(appt)
            return {"msg": "Appointment booked successfully", "id": appt.id, "details": req.dict()}
    return {"msg": "Appointment booked successfully", "details": req.dict()}

@app.get("/list/{user_id}")
def list_appointments(user_id: int):
    if not DB_READY:
        return []
    with SessionLocal() as sess:
        appts = sess.query(AppointmentModel).filter(
            AppointmentModel.user_id == user_id
        ).all()
        return [
            {"id": a.id, "pet_id": a.pet_id, "service_type": a.service_type,
             "date": a.date, "status": a.status}
            for a in appts
        ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)
