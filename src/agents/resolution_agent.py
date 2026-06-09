import json
import re
from typing import Dict, Any

from .base_agent import BaseAgent
from crewai_wrapper import run_prompt


class ResolutionAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Resolution", role="suggest_fix", goals=["Suggest technical resolutions"])

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        query = ticket.get("query", "")
        category = ticket.get("category", "general")
        escalation = ticket.get("escalation", {})

        prompt = (
            "You are a senior support engineer. Analyze the ticket and return only valid JSON. "
            "The JSON object must include root_cause, steps, priority, confidence, summary, and suggestion.\n\n"
            f"Ticket query: {query}\n"
            f"Category: {category}\n"
            f"Escalation state: {escalation}\n\n"
            "Provide:\n"
            "- root_cause: a short explanation of the likely problem\n"
            "- steps: an array of step-by-step troubleshooting actions\n"
            "- priority: high, medium, or low\n"
            "- confidence: a number between 0.0 and 1.0\n"
            "- summary: one concise recommendation for the customer\n"
            "- suggestion: a complete resolution answer that can be shown to the user\n"
        )

        raw = run_prompt(self.role, prompt)
        parsed = self._parse_response(raw)
        result = {
            "suggestion": parsed.get("suggestion") or raw,
            "root_cause": parsed.get("root_cause") or self._guess_root_cause(query, category),
            "steps": parsed.get("steps") or self._guess_steps(query, category),
            "priority": parsed.get("priority") or self._guess_priority(query, category),
            "confidence": parsed.get("confidence") or 0.7,
            "summary": parsed.get("summary") or self._guess_summary(raw, category),
            "raw_response": raw,
        }

        return result

    def _parse_response(self, raw_text: str) -> Dict[str, Any]:
        text = raw_text.strip()
        if not text:
            return {}

        try:
            body = self._extract_json(text)
            return json.loads(body)
        except Exception:
            return {}

    def _extract_json(self, text: str) -> str:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON object detected")
        return text[start:end + 1]

    def _guess_priority(self, query: str, category: str) -> str:
        low = ["how", "faq", "information", "reset password"]
        high = ["data loss", "security", "urgent", "asap", "crash", "outage"]
        text = query.lower()
        if any(word in text for word in high):
            return "high"
        if any(word in text for word in low):
            return "low"
        if category == "technical":
            return "medium"
        return "low"

    def _guess_root_cause(self, query: str, category: str) -> str:
        text = query.lower()
        if "timeout" in text or "slow" in text:
            return "Performance or network-related failure"
        if "crash" in text or "exception" in text or "stack trace" in text:
            return "Application runtime error or unexpected exception"
        if "billing" in text or "invoice" in text:
            return "Billing or payment configuration mismatch"
        if "password" in text or "reset" in text:
            return "Account authentication or password reset flow"
        return "Likely a support issue requiring diagnostic steps"

    def _guess_steps(self, query: str, category: str) -> list[str]:
        text = query.lower()
        if "crash" in text or "error" in text:
            return [
                "Collect the full error message and stack trace.",
                "Reproduce the issue in a clean environment.",
                "Check recent code or configuration changes.",
            ]
        if "billing" in text or "invoice" in text:
            return [
                "Verify the invoice or charge details.",
                "Confirm the customer account and subscription status.",
                "Escalate to billing operations if needed.",
            ]
        if "password" in text or "reset" in text:
            return [
                "Confirm the customer identity.",
                "Guide them through the password reset flow.",
                "Check for account lockout or MFA issues.",
            ]
        return [
            "Ask the user for additional details.",
            "Review the ticket category and prior similar cases.",
            "Provide a clear next step based on urgency.",
        ]

    def _guess_summary(self, raw_text: str, category: str) -> str:
        if category == "technical":
            return "Troubleshoot the issue with targeted diagnostics and escalate if it persists."
        if category == "billing":
            return "Review invoices and account details before responding."
        return "Answer with a clear support response and confirm next steps."
