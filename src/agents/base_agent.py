from typing import Dict, Any


class BaseAgent:
    def __init__(self, name: str, role: str, goals: list):
        self.name = name
        self.role = role
        self.goals = goals

    def handle(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        """Override in subclasses. Should return a dict with results."""
        raise NotImplementedError()
