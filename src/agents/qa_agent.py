from .base_agent import BaseAgent
from typing import Dict, Any


class QAAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="QA", role="review", goals=["Assess final response quality"])

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        # Very simple quality checks: presence of an answer and clarity
        final = ticket.get("final_response", "")
        score = 1.0
        notes = []
        if not final:
            score = 0.0
            notes.append("No response generated")
        elif len(final.split()) < 6:
            score = 0.5
            notes.append("Response is very short")

        return {"qa_score": score, "notes": notes}
