from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import hashlib
import json
import asyncio
from datetime import datetime
from typing import List, Optional

from app.models.schemas import (
    AnalyzeRequest, 
    AnalyzeResponse, 
    AnalysisResultData, 
    HistoryItem,
    KnowledgeSearchRequest
)
from app.models.db import get_db, AnalysisRecord
from app.services.agent_workflow import execute_investigation, FinSentryState
from app.services.knowledge_base import kb_service

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FinSentry AI Backend",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_content(req: AnalyzeRequest, db: Session = Depends(get_db)):
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    # Execute LangGraph investigation workflow
    state: FinSentryState = execute_investigation(
        content=req.content,
        input_type=req.input_type,
        source=req.source or "Other",
        context=req.context or ""
    )

    created_iso = datetime.utcnow().isoformat()
    result_data = AnalysisResultData(
        analysis_id=state["analysis_id"],
        input_type=state["input_type"],
        source=state["source"],
        risk_level=state["risk_level"],
        risk_score=state["risk_score"],
        category=state["category"],
        secondary_categories=state.get("secondary_categories", []),
        confidence=state["confidence"],
        confidence_score=state["confidence_score"],
        summary=state["final_summary"],
        indicators=state.get("indicators", []),
        evidence=state.get("retrieved_evidence", []),
        recommendations=state.get("recommendations", []),
        url_analysis=state.get("url_analysis"),
        created_at=created_iso
    )

    # Compute text hash for privacy-safe storage (do not store raw sensitive text)
    text_hash = hashlib.sha256(req.content.encode('utf-8')).hexdigest()

    # Store record in database
    db_record = AnalysisRecord(
        id=state["analysis_id"],
        input_type=state["input_type"],
        input_text_hash=text_hash,
        source=state["source"],
        risk_score=state["risk_score"],
        risk_level=state["risk_level"],
        category=state["category"],
        confidence=state["confidence"],
        confidence_score=state["confidence_score"],
        summary=state["final_summary"],
        created_at=datetime.utcnow(),
        is_saved=False,  # Privacy default: opt-in saved
        result_json=json.dumps(result_data.model_dump())
    )
    db.add(db_record)
    db.commit()

    return AnalyzeResponse(
        status="completed",
        analysis_id=state["analysis_id"],
        result=result_data
    )

@router.get("/analyze/stream")
async def analyze_stream(content: str, input_type: str = "message", source: str = "Other", context: str = ""):
    """
    Streams step-by-step investigation events via Server-Sent Events (SSE).
    """
    async def event_generator():
        # Step definitions
        steps = [
            ("input_analysis", "Analyzing context and intent"),
            ("entity_extraction", "Extracting financial entities & handles"),
            ("fraud_indicators", "Scanning rule patterns and threat indicators"),
            ("classification", "Evaluating scam classification taxonomy"),
            ("url_analysis", "Safely inspecting URL strings & domains"),
            ("evidence_retrieval", "Querying verified fraud knowledge base"),
            ("risk_engine", "Calculating deterministic risk score"),
            ("confidence_engine", "Assessing multi-factor confidence rating"),
            ("recommendations", "Generating actionable safety guidance"),
            ("response_generator", "Synthesizing comprehensive assessment dossier")
        ]

        for step_id, label in steps:
            event = {
                "event": "step_start",
                "step_id": step_id,
                "label": label,
                "status": "running",
                "timestamp": datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.25)
            
            event["status"] = "completed"
            yield f"data: {json.dumps(event)}\n\n"

        # Execute final result
        state = execute_investigation(
            content=content,
            input_type=input_type,
            source=source,
            context=context
        )
        created_iso = datetime.utcnow().isoformat()
        result_data = AnalysisResultData(
            analysis_id=state["analysis_id"],
            input_type=state["input_type"],
            source=state["source"],
            risk_level=state["risk_level"],
            risk_score=state["risk_score"],
            category=state["category"],
            secondary_categories=state.get("secondary_categories", []),
            confidence=state["confidence"],
            confidence_score=state["confidence_score"],
            summary=state["final_summary"],
            indicators=state.get("indicators", []),
            evidence=state.get("retrieved_evidence", []),
            recommendations=state.get("recommendations", []),
            url_analysis=state.get("url_analysis"),
            created_at=created_iso
        )

        final_event = {
            "event": "analysis_complete",
            "analysis_id": state["analysis_id"],
            "result": result_data.model_dump()
        }
        yield f"data: {json.dumps(final_event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/analysis/{analysis_id}")
def get_analysis_by_id(analysis_id: str, db: Session = Depends(get_db)):
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    data = json.loads(record.result_json) if record.result_json else {}
    return {
        "analysis_id": record.id,
        "is_saved": record.is_saved,
        "created_at": record.created_at.isoformat(),
        "result": data
    }

@router.get("/history", response_model=List[HistoryItem])
def get_history(saved_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(AnalysisRecord)
    if saved_only:
        query = query.filter(AnalysisRecord.is_saved == True)
    
    records = query.order_by(AnalysisRecord.created_at.desc()).limit(50).all()
    history_items = []
    for r in records:
        history_items.append(HistoryItem(
            analysis_id=r.id,
            input_type=r.input_type,
            source=r.source,
            risk_level=r.risk_level,
            risk_score=r.risk_score,
            category=r.category,
            confidence=r.confidence,
            summary=r.summary,
            created_at=r.created_at.isoformat(),
            is_saved=r.is_saved
        ))
    return history_items

@router.post("/history/save/{analysis_id}")
def toggle_save_history(analysis_id: str, db: Session = Depends(get_db)):
    record = db.query(AnalysisRecord).filter(AnalysisRecord.id == analysis_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis record not found.")
    
    record.is_saved = not record.is_saved
    db.commit()
    return {"analysis_id": analysis_id, "is_saved": record.is_saved}

@router.post("/knowledge/search")
def search_knowledge(req: KnowledgeSearchRequest):
    results = kb_service.search(query=req.query, category=req.category, limit=req.limit)
    return {"query": req.query, "results": results}
