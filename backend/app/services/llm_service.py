import os
import json
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings

SCAM_CATEGORIES = [
    "Phishing",
    "Bank/KYC Fraud",
    "UPI/Payment Fraud",
    "Investment Scam",
    "Job/Employment Scam",
    "Customer Support Scam",
    "Account Takeover",
    "Fake Offers/Rewards",
    "Impersonation",
    "Legitimate",
    "Uncertain"
]

def classify_scam_contextually(
    content: str, 
    source: str, 
    entities: Dict[str, Any], 
    indicators: List[Dict[str, Any]],
    url_analysis: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    content_lower = content.lower()
    
    primary = "Uncertain"
    secondary = []
    
    # Check if this matches a legitimate banking / transaction alert
    is_informational_alert = any(w in content_lower for w in ["credited with", "debited by", "balance is", "statement", "receipt", "transaction successful"])
    has_no_severe_indicators = not any(i["category"] in ["threat_pressure", "credential_request", "urgency"] for i in indicators)
    has_no_suspicious_url = (url_analysis is None) or (url_analysis.get("safety_verdict") == "SAFE")

    if is_informational_alert and has_no_severe_indicators and has_no_suspicious_url:
        return {
            "primary_category": "Legitimate",
            "secondary_categories": [],
            "threat_present": False,
            "urgency_level": "LOW",
            "intent": "Standard informational banking transaction notification."
        }

    has_kyc = "kyc" in content_lower or "pan card" in content_lower or "aadhaar" in content_lower
    has_bank = any(b.lower() in content_lower for b in ["sbi", "hdfc", "icici", "axis", "bank", "netbanking", "account blocked"])
    has_upi = any(u in content_lower for u in ["upi", "gpay", "phonepe", "paytm", "qr code", "collect request", "pin to receive"]) or len(entities.get("upi_handles", [])) > 0
    has_job = any(j in content_lower for j in ["job", "recruitment", "salary", "work from home", "daily income", "part time", "typing", "task"])
    has_investment = any(i in content_lower for i in ["invest", "crypto", "trading", "guaranteed return", "daily 5000", "double your money", "profit"])
    has_support = any(s in content_lower for s in ["customer care", "helpline", "toll free", "support team", "refund executive"])
    has_takeover = any(t in content_lower for t in ["sim swap", "5g upgrade", "forwarding", "mmi code", "unauthorized login", "device login"])
    has_prize = any(p in content_lower for p in ["lottery", "prize", "won", "winner", "lucky draw", "gift card", "reward"])
    has_phishing = (url_analysis and url_analysis.get("safety_verdict") in ["HIGH_RISK", "SUSPICIOUS"]) or any(p in content_lower for p in ["login", "verify your account", "update-account", "password reset", "link below"])

    if has_kyc or (has_bank and ("blocked" in content_lower or "suspended" in content_lower)):
        primary = "Bank/KYC Fraud"
        if has_phishing:
            secondary.append("Phishing")
        if any(i["category"] == "credential_request" for i in indicators):
            secondary.append("Credential Phishing")

    elif has_upi and len(indicators) > 0:
        primary = "UPI/Payment Fraud"
        if "qr" in content_lower:
            secondary.append("QR Code Scam")
        if "collect" in content_lower:
            secondary.append("Collect Request Trap")

    elif has_investment:
        primary = "Investment Scam"
        if "telegram" in content_lower or "task" in content_lower:
            secondary.append("Task / Ponzi Scheme")

    elif has_job:
        primary = "Job/Employment Scam"
        if "registration fee" in content_lower or "deposit" in content_lower:
            secondary.append("Advance Fee Fraud")

    elif has_support:
        primary = "Customer Support Scam"
        if "anydesk" in content_lower or "teamviewer" in content_lower:
            secondary.append("Remote Access Fraud")

    elif has_takeover:
        primary = "Account Takeover"

    elif has_prize:
        primary = "Fake Offers/Rewards"

    elif has_phishing:
        primary = "Phishing"
        if url_analysis and url_analysis.get("brand_mismatch_flag"):
            secondary.append("Brand Impersonation")

    elif len(indicators) == 0:
        primary = "Legitimate" if is_informational_alert else "Uncertain"
    else:
        primary = "Impersonation"

    threat_present = any(i["category"] in ["threat_pressure", "credential_request"] for i in indicators)
    urgency_level = "HIGH" if any(i["category"] == "urgency" for i in indicators) else "LOW"

    return {
        "primary_category": primary,
        "secondary_categories": secondary,
        "threat_present": threat_present,
        "urgency_level": urgency_level,
        "intent": f"Evaluated as likely {primary.lower()} communication pattern."
    }
