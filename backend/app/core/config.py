from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinSentry AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # PRISMtrace Observability
    PRISMTRACE_API_KEY: str = os.getenv("PRISMTRACE_API_KEY", "")
    PRISMTRACE_PROJECT_ID: str = os.getenv("PRISMTRACE_PROJECT_ID", "7dc1d636-ca58-4c76-88b9-dbb8700c11e8")
    PRISMTRACE_HOST: str = os.getenv("PRISMTRACE_HOST", "https://prism-api-prod.up.railway.app")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finsentry.db")
    
    # Risk Scoring Weights (Configurable)
    RISK_WEIGHTS: Dict[str, int] = {
        "credential_request": 25,
        "suspicious_url": 20,
        "payment_request": 20,
        "threat_pressure": 15,
        "impersonation": 15,
        "urgency": 10,
        "unrealistic_reward": 15,
        "unsolicited_contact": 10,
        "shortener_url": 15,
        "brand_domain_mismatch": 25,
        "ip_url": 20
    }
    
    # Risk Level Thresholds (Configurable)
    # 0–25 LOW · 26–50 MEDIUM · 51–75 HIGH · 76–100 CRITICAL
    THRESHOLD_LOW: int = 25
    THRESHOLD_MEDIUM: int = 50
    THRESHOLD_HIGH: int = 75

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
