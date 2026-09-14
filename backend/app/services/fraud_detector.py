import re
from typing import Dict, Any, List, Tuple
from app.core.config import settings

# Keywords categorized by risk dimension
INDICATOR_PATTERNS = {
    "credential_request": {
        "keywords": [
            r"\botp\b", r"\bpin\b", r"\bcvv\b", r"\bpassword\b", r"\blogin code\b",
            r"\bsecurity code\b", r"\bpasscode\b", r"\bsecret key\b", r"\bcard number\b",
            r"\bexpiry date\b"
        ],
        "weight": settings.RISK_WEIGHTS["credential_request"],
        "name": "Direct Credential Request",
        "desc": "Requests high-security credentials (OTP, PIN, CVV, password) which legitimate entities never request."
    },
    "threat_pressure": {
        "keywords": [
            r"\bblocked\b", r"\bsuspended\b", r"\bdeactivated\b", r"\bterminated\b",
            r"\blegal action\b", r"\barrest\b", r"\bpolice\b", r"\bcbi\b", r"\bcourt\b",
            r"\bpenalty\b", r"\bfreeze\b", r"\bfrozen\b", r"\bnon-compliance\b"
        ],
        "weight": settings.RISK_WEIGHTS["threat_pressure"],
        "name": "Coercive Threat / Account Block Warning",
        "desc": "Uses intimidation, legal threats, or immediate service suspension to induce panic."
    },
    "urgency": {
        "keywords": [
            r"\burgent\b", r"\bimmediately\b", r"\bright now\b", r"\btoday only\b",
            r"\bwithin 24 hours\b", r"\bwithin 2 hours\b", r"\bexpires in\b",
            r"\bact fast\b", r"\blast warning\b", r"\btime is running out\b"
        ],
        "weight": settings.RISK_WEIGHTS["urgency"],
        "name": "Artificial Urgency & Pressure",
        "desc": "Imposes tight deadlines to prevent the recipient from verifying claims."
    },
    "payment_request": {
        "keywords": [
            r"\bpay\b", r"\btransfer\b", r"\bdeposit\b", r"\bfee\b", r"\bcharges\b",
            r"\bregistration fee\b", r"\bprocessing fee\b", r"\badvance\b",
            r"\bsecurity deposit\b", r"\bsend money\b", r"\bupi pin to receive\b"
        ],
        "weight": settings.RISK_WEIGHTS["payment_request"],
        "name": "Upfront Payment or Advance Fee Demand",
        "desc": "Requests an upfront payment, processing fee, or claim deposit."
    },
    "unrealistic_reward": {
        "keywords": [
            r"\bguaranteed\b", r"\bprize\b", r"\bwon\b", r"\blottery\b", r"\bselected\b",
            r"\bcashback\b", r"\bbonus\b", r"\bpart-time earning\b", r"\bdaily 5000\b",
            r"\bdaily income\b", r"\bzero risk\b", r"\bwork from home job\b", r"\bfree gift\b"
        ],
        "weight": settings.RISK_WEIGHTS["unrealistic_reward"],
        "name": "Unrealistic Reward / Get-Rich Offer",
        "desc": "Promises improbable returns, lottery winnings, or lucrative low-effort rewards."
    },
    "impersonation": {
        "keywords": [
            r"\bkyc\b", r"\baadhaar\b", r"\bpan card\b", r"\bcompliance department\b",
            r"\bhead office\b", r"\btech support\b", r"\bcustomer care executive\b",
            r"\bverification team\b", r"\bbank manager\b"
        ],
        "weight": settings.RISK_WEIGHTS["impersonation"],
        "name": "Institutional Impersonation / KYC Trigger",
        "desc": "Poses as a financial authority, bank executive, or KYC verification officer."
    }
}

# Regex for entity detection
URL_REGEX = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s<>"]*)?')
PHONE_REGEX = re.compile(r'(?:\+?91[\s-]?)?[6789]\d{9}|\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
EMAIL_REGEX = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
CURRENCY_REGEX = re.compile(r'(?:₹|Rs\.?|INR|\$|USD)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*(?:rupees|inr|dollars)\b', re.IGNORECASE)
UPI_REGEX = re.compile(r'[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}')

KNOWN_BRANDS = [
    "SBI", "State Bank of India", "HDFC", "HDFC Bank", "ICICI", "Axis Bank", "PNB",
    "Paytm", "PhonePe", "Google Pay", "GPay", "PayPal", "Amazon", "Flipkart",
    "Netflix", "India Post", "Airtel", "Jio", "SEBI", "RBI"
]

# Patterns representing legitimate warning disclaimers (e.g. "never share your OTP", "do not share PIN")
DISCLAIMER_PATTERNS = [
    r"(?i)(?:never|do\s+not|don't|should\s+not|not\s+to\s+be)\s+share[^\.\n]*",
    r"(?i)(?:otp|pin)\s+(?:is\s+secret|confidential|should\s+never\s+be\s+shared)"
]

def extract_entities(text: str) -> Dict[str, Any]:
    urls = URL_REGEX.findall(text)
    cleaned_urls = []
    for u in urls:
        clean = u.rstrip(".,;!?'\")")
        if "." in clean and not clean.startswith("@"):
            cleaned_urls.append(clean)
    
    phones = PHONE_REGEX.findall(text)
    emails = EMAIL_REGEX.findall(text)
    currencies = CURRENCY_REGEX.findall(text)
    upis = UPI_REGEX.findall(text)
    filtered_upis = [u for u in upis if not any(u in email for email in emails)]

    mentioned_brands = []
    text_lower = text.lower()
    for brand in KNOWN_BRANDS:
        if re.search(r'\b' + re.escape(brand.lower()) + r'\b', text_lower):
            mentioned_brands.append(brand)

    return {
        "urls": list(set(cleaned_urls)),
        "phones": list(set(phones)),
        "emails": list(set(emails)),
        "currency_amounts": list(set(currencies)),
        "upi_handles": list(set(filtered_upis)),
        "brands": list(set(mentioned_brands))
    }

def detect_fraud_indicators(text: str) -> List[Dict[str, Any]]:
    detected = []
    text_lower = text.lower()

    # Identify disclaimer segments to avoid false-positive credential alarms
    clean_text_for_credentials = text_lower
    for disc_pat in DISCLAIMER_PATTERNS:
        clean_text_for_credentials = re.sub(disc_pat, "[safety_advisory]", clean_text_for_credentials)

    for category_key, data in INDICATOR_PATTERNS.items():
        matched_terms = []
        target_text = clean_text_for_credentials if category_key == "credential_request" else text_lower

        for kw_pattern in data["keywords"]:
            if re.search(kw_pattern, target_text):
                matched_terms.append(kw_pattern.replace(r"\b", ""))

        if matched_terms:
            detected.append({
                "id": f"ind_{category_key}",
                "name": data["name"],
                "description": data["desc"],
                "weight": data["weight"],
                "category": category_key,
                "detected_pattern": ", ".join(matched_terms[:4])
            })

    return detected
