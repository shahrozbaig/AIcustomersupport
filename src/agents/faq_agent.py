from .base_agent import BaseAgent
from typing import Dict, Any


class FAQAgent(BaseAgent):
    FAQS = {
        "how to reset password": "Go to Settings → Account → Reset Password and follow the instructions.",
        "what is your refund policy": "We offer refunds within 30 days of purchase. Contact billing for details.",
    }

    def __init__(self):
        super().__init__(name="FAQ", role="answer_faq", goals=["Answer common questions"])

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        text = ticket.get("query", "").lower()
        for k, v in self.FAQS.items():
            if k in text:
                return {"answer": v, "matched_faq": k}

        # Fallback: no exact FAQ match
        return {"answer": None}
