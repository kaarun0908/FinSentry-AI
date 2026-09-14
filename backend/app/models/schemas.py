from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class AnalyzeRequest(BaseModel):
    input_type: str = Field(..., description="'message' or 'url'")
    content: str = Field(..., description="Message text or URL to investigate")
    source: Optional[str] = Field("Other", description="SMS, WhatsApp, Email, UPI, Website, Phone, Other")
    context: Optional[str] = Field("", description="Optional context from user about where it was received")

class IndicatorItem(BaseModel):
    id: str
    name: str
    description: str
    weight: int
    category: str  # e.g., 'credential', 'threat', 'url', 'payment', 'urgency', 'reward'
    detected_pattern: Optional[str] = None

class UrlAnalysisResult(BaseModel):
    url: str
    domain: str
    registered_domain: str
    tld: str
    is_ip: bool = False
    is_shortener: bool = False
    is_suspicious_tld: bool = False
    punycode_detected: bool = False
    brand_mismatch_flag: bool = False
    spoofed_brand: Optional[str] = None
    risk_signals: List[str] = []
    safety_verdict: str = "SAFE"

class EvidenceItem(BaseModel):
    title: str
    category: str
    indicators: List[str] = []
    guidance: List[str] = []
    relevance_score: float = 0.0

class RecommendationItem(BaseModel):
    priority: str  # IMMEDIATE, CAUTION, VERIFICATION, GENERAL
    action: str
    rationale: str

class AnalysisResultData(BaseModel):
    analysis_id: str
    input_type: str
    source: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: int  # 0 - 100
    category: str  # e.g., Phishing, Bank/KYC Fraud, UPI/Payment Fraud, etc.
    secondary_categories: List[str] = []
    confidence: str  # LOW, MEDIUM, HIGH
    confidence_score: float  # 0.0 - 1.0
    summary: str
    indicators: List[IndicatorItem] = []
    evidence: List[EvidenceItem] = []
    recommendations: List[RecommendationItem] = []
    url_analysis: Optional[UrlAnalysisResult] = None
    created_at: str

class AnalyzeResponse(BaseModel):
    status: str = "completed"
    analysis_id: str
    result: AnalysisResultData

class HistoryItem(BaseModel):
    analysis_id: str
    input_type: str
    source: str
    risk_level: str
    risk_score: int
    category: str
    confidence: str
    summary: str
    created_at: str
    is_saved: bool = True

class KnowledgeSearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 3

class InvestigationStepEvent(BaseModel):
    step_id: str
    name: str
    status: str  # 'running', 'completed', 'skipped'
    detail: Optional[str] = None
