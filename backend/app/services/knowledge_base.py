import json
import os
import re
from typing import List, Dict, Any, Optional

KB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "knowledge_documents.json")

class KnowledgeBaseService:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self._load_documents()

    def _load_documents(self):
        if os.path.exists(KB_PATH):
            with open(KB_PATH, "r", encoding="utf-8") as f:
                self.documents = json.load(f)
        else:
            self.documents = []

    def search(self, query: str, category: Optional[str] = None, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Performs category and indicator keyword overlap matching to retrieve relevant fraud evidence.
        Works reliably without requiring external vector database services, while supporting pgvector migration.
        """
        query_lower = query.lower()
        query_words = set(re.findall(r'\w+', query_lower))

        scored_docs = []
        for doc in self.documents:
            score = 0.0

            # Category boost
            if category and doc.get("category", "").lower() == category.lower():
                score += 3.0

            # Title match
            title_words = set(re.findall(r'\w+', doc.get("title", "").lower()))
            overlap_title = len(query_words.intersection(title_words))
            score += overlap_title * 1.5

            # Indicator matches
            indicators = doc.get("indicators", [])
            for ind in indicators:
                ind_words = set(re.findall(r'\w+', ind.lower()))
                overlap = len(query_words.intersection(ind_words))
                if overlap > 0:
                    score += overlap * 0.8

            if score > 0.5 or (category and doc.get("category", "").lower() == category.lower()):
                # Normalize relevance score between 0.50 and 0.98
                relevance = min(0.98, max(0.50, round(score / (len(query_words) + 3) + 0.5, 2)))
                scored_docs.append({
                    "title": doc.get("title"),
                    "category": doc.get("category"),
                    "indicators": doc.get("indicators", []),
                    "guidance": doc.get("guidance", []),
                    "relevance_score": relevance
                })

        scored_docs.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        # Always return at least the safety guidelines if nothing matched well
        if not scored_docs and self.documents:
            safety_doc = next((d for d in self.documents if d.get("category") == "Safety Guidelines"), self.documents[-1])
            scored_docs.append({
                "title": safety_doc.get("title"),
                "category": safety_doc.get("category"),
                "indicators": safety_doc.get("indicators", []),
                "guidance": safety_doc.get("guidance", []),
                "relevance_score": 0.65
            })

        return scored_docs[:limit]

kb_service = KnowledgeBaseService()
