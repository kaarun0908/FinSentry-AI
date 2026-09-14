import re
import urllib.parse
from typing import Dict, Any, List, Optional
import tldextract

# Known legitimate domains for popular financial institutions and brands
LEGITIMATE_BRAND_DOMAINS = {
    "sbi": ["sbi.co.in", "onlinesbi.sbi", "statebankofindia.com"],
    "hdfc": ["hdfcbank.com", "hdfc.com"],
    "icici": ["icicibank.com"],
    "axis": ["axisbank.com"],
    "pnb": ["pnbindia.in"],
    "paytm": ["paytm.com"],
    "phonepe": ["phonepe.com"],
    "googlepay": ["google.com", "pay.google.com"],
    "paypal": ["paypal.com"],
    "amazon": ["amazon.in", "amazon.com"],
    "netflix": ["netflix.com"],
    "indiapost": ["indiapost.gov.in"],
    "rbi": ["rbi.org.in"],
    "income tax": ["incometax.gov.in", "incometaxindia.gov.in"]
}

# Known link shortening services
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy", 
    "shorturl.at", "ow.ly", "goo.gl", "buff.ly", "rebrand.ly", "v.gd"
}

# Frequently abused TLDs in mass phishing campaigns
SUSPICIOUS_TLDS = {
    "top", "xyz", "tk", "ml", "ga", "cf", "gq", "click", "buzz",
    "work", "rest", "support", "vip", "icu", "cam", "fit", "surf"
}

# High-risk path keywords
SUSPICIOUS_PATH_KEYWORDS = [
    "login", "verify", "verification", "kyc", "otp", "password", 
    "update-account", "security-alert", "claim", "refund", "bonus", "reward"
]

def analyze_url_string(url_string: str) -> Dict[str, Any]:
    """
    Safely analyzes a URL string without making ANY network requests.
    Inspects domain, TLD, brand spoofing, IP hosts, shorteners, and path traps.
    """
    raw_url = url_string.strip()
    # Normalize scheme if missing for parser
    parseable_url = raw_url
    if not re.match(r'^[a-zA-Z]+://', raw_url):
        parseable_url = "http://" + raw_url

    parsed = urllib.parse.urlparse(parseable_url)
    extracted = tldextract.extract(parseable_url)
    
    hostname = (parsed.hostname or extracted.fqdn or "").lower()
    tld = extracted.suffix.lower()
    domain_name = extracted.domain.lower()
    registered_domain = f"{extracted.domain}.{extracted.suffix}".lower() if extracted.domain and extracted.suffix else hostname
    
    risk_signals = []
    is_ip = False
    is_shortener = False
    is_suspicious_tld = False
    punycode_detected = False
    brand_mismatch_flag = False
    spoofed_brand = None

    # 1. IP Host Detection
    ip_pattern = r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'
    if re.match(ip_pattern, hostname):
        is_ip = True
        risk_signals.append("Uses raw IP address instead of domain name")

    # 2. URL Shortener Detection
    if registered_domain in KNOWN_SHORTENERS or hostname in KNOWN_SHORTENERS:
        is_shortener = True
        risk_signals.append(f"Uses link shortener service ({registered_domain}) to conceal destination")

    # 3. Suspicious TLD Detection
    if tld in SUSPICIOUS_TLDS:
        is_suspicious_tld = True
        risk_signals.append(f"Employs high-abuse top-level domain (.{tld})")

    # 4. Punycode / Homograph Attack Detection
    if "xn--" in hostname:
        punycode_detected = True
        risk_signals.append("Punycode (xn--) detected — potential homograph domain spoofing")

    # 5. Brand Spoofing / Lookalike Domain Analysis
    for brand, legit_domains in LEGITIMATE_BRAND_DOMAINS.items():
        # Check if brand name is in subdomain or domain part
        brand_clean = brand.replace(" ", "")
        if brand_clean in hostname:
            # Check if actual registered domain matches genuine official domains
            is_legit = any(registered_domain == legit or registered_domain.endswith("." + legit) for legit in legit_domains)
            if not is_legit:
                brand_mismatch_flag = True
                spoofed_brand = brand.upper()
                risk_signals.append(
                    f"Brand Spoofing: Contains brand reference '{brand.upper()}' but registered domain is '{registered_domain}' (official: {', '.join(legit_domains)})"
                )
                break

    # 6. Suspicious Path or Query Structure
    path_and_query = (parsed.path + "?" + parsed.query).lower()
    matched_paths = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in path_and_query]
    if matched_paths and (is_shortener or is_suspicious_tld or brand_mismatch_flag or is_ip):
        risk_signals.append(f"Suspicious path keywords detected: {', '.join(matched_paths)}")

    # Determine URL verdict
    if brand_mismatch_flag or is_ip or (is_suspicious_tld and len(risk_signals) > 1):
        verdict = "HIGH_RISK"
    elif is_shortener or is_suspicious_tld or len(risk_signals) > 0:
        verdict = "SUSPICIOUS"
    else:
        verdict = "UNFLAGGED"

    return {
        "url": raw_url,
        "domain": hostname,
        "registered_domain": registered_domain,
        "tld": tld,
        "is_ip": is_ip,
        "is_shortener": is_shortener,
        "is_suspicious_tld": is_suspicious_tld,
        "punycode_detected": punycode_detected,
        "brand_mismatch_flag": brand_mismatch_flag,
        "spoofed_brand": spoofed_brand,
        "risk_signals": risk_signals,
        "safety_verdict": verdict
    }
