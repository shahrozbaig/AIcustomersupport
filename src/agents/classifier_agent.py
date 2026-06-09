from .base_agent import BaseAgent
from typing import Dict, Any


class ClassifierAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Classifier", role="classify", goals=["Determine ticket category"])

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        text = ticket.get("query", "").lower()
        category = "general"
        if any(k in text for k in ["invoice", "charge", "billing", "payment"]):
            category = "billing"
        elif any(k in text for k in ["error", "crash", "bug", "exception", "stack trace"]):
            category = "technical"
        elif any(k in text for k in ["how", "where", "what", "faq", "help"]):
            category = "general"

        return {"category": category}
