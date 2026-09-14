from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import json
from app.core.config import settings

Base = declarative_base()

class AnalysisRecord(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, index=True)
    input_type = Column(String, default="message")
    input_text_hash = Column(String, index=True)
    source = Column(String, default="Other")
    risk_score = Column(Integer, default=0)
    risk_level = Column(String, default="LOW")
    category = Column(String, default="Uncertain")
    confidence = Column(String, default="LOW")
    confidence_score = Column(Float, default=0.0)
    summary = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_saved = Column(Boolean, default=False)
    
    # Store complete structured assessment for high-fidelity retrieval
    result_json = Column(Text, default="{}")

# Database engine setup (SQLite default with PostgreSQL/pgvector compatibility)
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
