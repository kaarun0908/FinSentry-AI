import uuid
from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime
from langgraph.graph import StateGraph, END

from app.services.fraud_detector import extract_entities, detect_fraud_indicators
from app.services.url_analyzer import analyze_url_string
from app.services.llm_service import classify_scam_contextually
from app.services.knowledge_base import kb_service
from app.services.risk_engine import (
    calculate_deterministic_risk_score,
    calculate_confidence_score,
    format_calibrated_summary
)

class FinSentryState(TypedDict):
    analysis_id: str
    input_text: str
    input_type: str
    source: str
    context: str
    entities: Dict[str, Any]
    category: str
    secondary_categories: List[str]
    indicators: List[Dict[str, Any]]
    extracted_urls: List[str]
    url_analysis: Optional[Dict[str, Any]]
    retrieved_evidence: List[Dict[str, Any]]
    risk_score: int
    risk_level: str
    confidence: str
    confidence_score: float
    recommendations: List[Dict[str, Any]]
    final_summary: str
    step_history: List[Dict[str, str]]

# Step 1: Input Analysis
def node_input_analysis(state: FinSentryState) -> Dict[str, Any]:
    steps = list(state.get("step_history", []))
    steps.append({"step": "input_analysis", "label": "Analyzing message context and communication intent", "status": "completed"})
    return {"step_history": steps}

# Step 2: Entity Extraction
def node_entity_extraction(state: FinSentryState) -> Dict[str, Any]:
    entities = extract_entities(state["input_text"])
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "entity_extraction", 
        "label": f"Extracted financial entities ({len(entities.get('brands', []))} brands, {len(entities.get('urls', []))} URLs)", 
        "status": "completed"
    })
    return {
        "entities": entities,
        "extracted_urls": entities.get("urls", []),
        "step_history": steps
    }

# Step 3: Fraud Indicator Detection
def node_fraud_indicators(state: FinSentryState) -> Dict[str, Any]:
    indicators = detect_fraud_indicators(state["input_text"])
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "fraud_indicators", 
        "label": f"Scanned pattern rules (identified {len(indicators)} risk indicators)", 
        "status": "completed"
    })
    return {
        "indicators": indicators,
        "step_history": steps
    }

# Step 4: Scam Classification
def node_scam_classification(state: FinSentryState) -> Dict[str, Any]:
    classification = classify_scam_contextually(
        content=state["input_text"],
        source=state["source"],
        entities=state.get("entities", {}),
        indicators=state.get("indicators", []),
        url_analysis=state.get("url_analysis")
    )
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "classification", 
        "label": f"Classified primary category: {classification['primary_category']}", 
        "status": "completed"
    })
    return {
        "category": classification["primary_category"],
        "secondary_categories": classification["secondary_categories"],
        "step_history": steps
    }

# Step 5: URL Analyzer (handles both present and absent URLs)
def node_url_analyzer(state: FinSentryState) -> Dict[str, Any]:
    urls = state.get("extracted_urls", [])
    steps = list(state.get("step_history", []))
    
    if urls and len(urls) > 0:
        target_url = urls[0]
        url_analysis = analyze_url_string(target_url)
        steps.append({
            "step": "url_analysis", 
            "label": f"Inspected URL string safely without fetching ({url_analysis.get('safety_verdict')})", 
            "status": "completed"
        })
        return {
            "url_analysis": url_analysis,
            "step_history": steps
        }
    else:
        steps.append({
            "step": "url_analysis", 
            "label": "No external URLs found in content — skipped web string inspection", 
            "status": "skipped"
        })
        return {
            "url_analysis": None,
            "step_history": steps
        }

# Step 6: Evidence Retrieval (RAG)
def node_evidence_retrieval(state: FinSentryState) -> Dict[str, Any]:
    evidence = kb_service.search(
        query=state["input_text"],
        category=state.get("category"),
        limit=2
    )
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "evidence_retrieval", 
        "label": f"Retrieved {len(evidence)} verified fraud patterns from knowledge base", 
        "status": "completed"
    })
    return {
        "retrieved_evidence": evidence,
        "step_history": steps
    }

# Step 7: Deterministic Risk Engine
def node_risk_engine(state: FinSentryState) -> Dict[str, Any]:
    score, level = calculate_deterministic_risk_score(
        indicators=state.get("indicators", []),
        url_analysis=state.get("url_analysis")
    )
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "risk_engine", 
        "label": f"Calculated deterministic risk score: {score}/100 ({level})", 
        "status": "completed"
    })
    return {
        "risk_score": score,
        "risk_level": level,
        "step_history": steps
    }

# Step 8: Multi-Factor Confidence Assessment
def node_confidence_assessment(state: FinSentryState) -> Dict[str, Any]:
    is_ambiguous = (state.get("category") == "Uncertain")
    has_url = state.get("url_analysis") is not None
    conf_level, conf_val = calculate_confidence_score(
        indicator_count=len(state.get("indicators", [])),
        evidence_count=len(state.get("retrieved_evidence", [])),
        has_url_analysis=has_url,
        is_ambiguous=is_ambiguous
    )
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "confidence_engine", 
        "label": f"Evaluated confidence: {conf_level} ({int(conf_val * 100)}%)", 
        "status": "completed"
    })
    return {
        "confidence": conf_level,
        "confidence_score": conf_val,
        "step_history": steps
    }

# Step 9: Recommendation Engine
def node_recommendations(state: FinSentryState) -> Dict[str, Any]:
    level = state.get("risk_level", "LOW")
    recs = []

    if level in ["CRITICAL", "HIGH"]:
        recs.append({
            "priority": "IMMEDIATE",
            "action": "Do NOT share OTPs, PINs, Passwords, or click provided links",
            "rationale": "Severe indicators of credential phishing or unauthorized access traps were identified."
        })
        recs.append({
            "priority": "HIGH",
            "action": "Verify via official verified banking / customer app or back of card",
            "rationale": "Directly dial official customer service to cross-check any purported account problems."
        })
        recs.append({
            "priority": "HIGH",
            "action": "Report incident to Cyber Crime Helpline (1930 / cybercrime.gov.in)",
            "rationale": "Timely reporting helps financial authorities freeze illicit beneficiary accounts within the Golden Hour."
        })
    elif level == "MEDIUM":
        recs.append({
            "priority": "CAUTION",
            "action": "Do not rush or yield to artificial deadlines",
            "rationale": "Scammers manufacture emergency situations to hinder objective validation."
        })
        recs.append({
            "priority": "VERIFICATION",
            "action": "Independently contact the purported sender using a known phone number",
            "rationale": "The content lacks explicit proof of authority; verify before sending any money or responses."
        })
    else:
        recs.append({
            "priority": "STANDARD",
            "action": "Standard cyber hygiene reminder: Never share OTPs or enter UPI PIN to receive funds",
            "rationale": "Even if this communication appears legitimate, remain cautious against future follow-ups."
        })

    steps = list(state.get("step_history", []))
    steps.append({
        "step": "recommendations", 
        "label": f"Generated {len(recs)} tailored safety recommendations", 
        "status": "completed"
    })
    return {
        "recommendations": recs,
        "step_history": steps
    }

# Step 10: Response Generator
def node_response_generator(state: FinSentryState) -> Dict[str, Any]:
    summary = format_calibrated_summary(
        risk_level=state.get("risk_level", "LOW"),
        category=state.get("category", "General"),
        indicators=state.get("indicators", []),
        url_analysis=state.get("url_analysis")
    )
    steps = list(state.get("step_history", []))
    steps.append({
        "step": "response_generator", 
        "label": "Compiled structured risk assessment dossier", 
        "status": "completed"
    })
    return {
        "final_summary": summary,
        "step_history": steps
    }

# Build LangGraph workflow
def build_finsentry_graph():
    workflow = StateGraph(FinSentryState)

    workflow.add_node("input_analysis", node_input_analysis)
    workflow.add_node("entity_extraction", node_entity_extraction)
    workflow.add_node("fraud_indicators", node_fraud_indicators)
    workflow.add_node("classification", node_scam_classification)
    workflow.add_node("url_analyzer", node_url_analyzer)
    workflow.add_node("evidence_retrieval", node_evidence_retrieval)
    workflow.add_node("risk_engine", node_risk_engine)
    workflow.add_node("confidence_assessment", node_confidence_assessment)
    workflow.add_node("recommendations", node_recommendations)
    workflow.add_node("response_generator", node_response_generator)

    # Linear pipeline with URL branch inspection
    workflow.set_entry_point("input_analysis")
    workflow.add_edge("input_analysis", "entity_extraction")
    workflow.add_edge("entity_extraction", "fraud_indicators")
    workflow.add_edge("fraud_indicators", "classification")
    workflow.add_edge("classification", "url_analyzer")
    workflow.add_edge("url_analyzer", "evidence_retrieval")
    workflow.add_edge("evidence_retrieval", "risk_engine")
    workflow.add_edge("risk_engine", "confidence_assessment")
    workflow.add_edge("confidence_assessment", "recommendations")
    workflow.add_edge("recommendations", "response_generator")
    workflow.add_edge("response_generator", END)

    return workflow.compile()

compiled_graph = build_finsentry_graph()

def execute_investigation(
    content: str, 
    input_type: str = "message", 
    source: str = "Other", 
    context: str = ""
) -> FinSentryState:
    analysis_id = str(uuid.uuid4())
    initial_state: FinSentryState = {
        "analysis_id": analysis_id,
        "input_text": content,
        "input_type": input_type,
        "source": source,
        "context": context,
        "entities": {},
        "category": "Uncertain",
        "secondary_categories": [],
        "indicators": [],
        "extracted_urls": [],
        "url_analysis": None,
        "retrieved_evidence": [],
        "risk_score": 0,
        "risk_level": "LOW",
        "confidence": "LOW",
        "confidence_score": 0.0,
        "recommendations": [],
        "final_summary": "",
        "step_history": []
    }

    result = compiled_graph.invoke(initial_state)
    return result
