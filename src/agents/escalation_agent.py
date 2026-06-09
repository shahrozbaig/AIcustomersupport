from .base_agent import BaseAgent
from typing import Dict, Any


class EscalationAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Escalation", role="decide_escalation", goals=["Flag tickets for human support"])

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        text = ticket.get("query", "").lower()
        # Simple heuristics for escalation
        urgent = any(k in text for k in ["urgent", "immediately", "asap"]) or "stack trace" in text
        complex_keywords = any(k in text for k in ["database", "corrupt", "data loss", "security"])
        escalate = urgent or complex_keywords
        reason = None
        if escalate:
            reason = "Marked urgent or contains complex keywords"

        return {"escalate": escalate, "reason": reason}
