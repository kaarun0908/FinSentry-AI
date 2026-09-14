import math
from typing import List, Dict, Any, Tuple
from app.core.config import settings

def calculate_deterministic_risk_score(
    indicators: List[Dict[str, Any]], 
    url_analysis: Dict[str, Any] = None
) -> Tuple[int, str]:
    """
    Computes a deterministic, normalized risk score (0-100) based on detected indicator weights
    and URL analysis signals. Does NOT use LLM for calculation.
    """
    raw_score = sum(ind.get("weight", 0) for ind in indicators)

    # Incorporate URL analysis signals deterministically
    if url_analysis:
        if url_analysis.get("brand_mismatch_flag"):
            raw_score += settings.RISK_WEIGHTS.get("brand_domain_mismatch", 25)
        elif url_analysis.get("is_ip"):
            raw_score += settings.RISK_WEIGHTS.get("ip_url", 20)
        elif url_analysis.get("is_shortener"):
            raw_score += settings.RISK_WEIGHTS.get("shortener_url", 15)
        elif url_analysis.get("is_suspicious_tld"):
            raw_score += settings.RISK_WEIGHTS.get("suspicious_url", 20)
        elif len(url_analysis.get("risk_signals", [])) > 0:
            raw_score += 15

    # Normalize to 0 - 100 with bounded dampening
    normalized_score = min(100, max(0, raw_score))

    # Map to risk level thresholds
    if normalized_score <= settings.THRESHOLD_LOW:
        risk_level = "LOW"
    elif normalized_score <= settings.THRESHOLD_MEDIUM:
        risk_level = "MEDIUM"
    elif normalized_score <= settings.THRESHOLD_HIGH:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return normalized_score, risk_level

def calculate_confidence_score(
    indicator_count: int,
    evidence_count: int,
    has_url_analysis: bool,
    has_contradictions: bool = False,
    is_ambiguous: bool = False
) -> Tuple[str, float]:
    """
    Computes multi-factor confidence rating (LOW, MEDIUM, HIGH)
    based on signal convergence, independent indicators, and evidence quality.
    """
    if is_ambiguous:
        return "LOW", 0.35

    base = 0.40
    # Add confidence for multiple corroborating indicators
    base += min(0.35, indicator_count * 0.10)
    # Add confidence for verified knowledge base evidence
    base += min(0.15, evidence_count * 0.05)
    # Add confidence if URL was inspected
    if has_url_analysis:
        base += 0.10

    if has_contradictions:
        base -= 0.25

    final_score = max(0.20, min(0.98, round(base, 2)))

    if final_score >= 0.75:
        level = "HIGH"
    elif final_score >= 0.50:
        level = "MEDIUM"
    else:
        level = "LOW"

    return level, final_score

def format_calibrated_summary(
    risk_level: str,
    category: str,
    indicators: List[Dict[str, Any]],
    url_analysis: Dict[str, Any] = None
) -> str:
    """
    Generates strictly calibrated, non-absolute risk narrative adhering to FinSentry safety rules:
    - Never says 'definitely a scam' or '100% safe'.
    - Uses evidence-calibrated risk descriptors.
    """
    if risk_level == "CRITICAL":
        return (
            f"Critical risk — Strong indicators of {category.lower()} detected. "
            f"Multiple high-severity vectors present, including {', '.join([i['name'].lower() for i in indicators[:2]])}. "
            "Immediate caution advised. Do not engage or submit any credentials."
        )
    elif risk_level == "HIGH":
        summary = f"High risk — Significant patterns consistent with {category.lower()} identified. "
        if url_analysis and url_analysis.get("safety_verdict") in ["HIGH_RISK", "SUSPICIOUS"]:
            summary += "Unverified or suspicious link detected alongside coercive triggers. "
        else:
            summary += "Contains multiple pressure or payment indicators. "
        summary += "We strongly advise independent verification before taking any action."
        return summary
    elif risk_level == "MEDIUM":
        return (
            f"Medium risk — Ambiguous or partial indicators of {category.lower()} detected. "
            "While severe credential demands were not detected, the phrasing exhibits caution flags. "
            "Verify the request through official channels before responding."
        )
    else:
        return (
            f"Low risk — No significant scam indicators detected. "
            "The message matches conventional transaction or standard informational communication patterns. "
            "Remain alert and never share private PINs or passwords under any circumstances."
        )
