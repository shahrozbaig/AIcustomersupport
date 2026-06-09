"""Light wrapper that prefers CrewAI if installed, falls back to OpenAI or mock.

The wrapper exposes `run_prompt(role, prompt)` which returns a text response.
"""
import os
from typing import Optional

try:
    import crewai
    _HAS_CREW = True
except Exception:
    crewai = None
    _HAS_CREW = False

try:
    import openai
    _HAS_OPENAI = True
except Exception:
    openai = None
    _HAS_OPENAI = False

from config import OPENAI_API_KEY, DEFAULT_MODEL


def run_prompt(role: str, prompt: str) -> str:
    """Run a prompt via CrewAI/OpenAI if available, else return a mock response.

    role is a short role name for logging/context.
    """
    if _HAS_CREW:
        try:
            # Example usage; real CrewAI API may differ
            agent = crewai.Agent(name=role)
            return agent.complete(prompt)
        except Exception:
            pass

    if _HAS_OPENAI and OPENAI_API_KEY:
        openai.api_key = OPENAI_API_KEY
        try:
            # ChatCompletion compatibility
            resp = openai.ChatCompletion.create(
                model=DEFAULT_MODEL,
                messages=[{"role": "system", "content": f"You are {role}."}, {"role": "user", "content": prompt}],
                max_tokens=400,
            )
            return resp.choices[0].message.content.strip()
        except Exception:
            pass

    # Fallback mock behavior (deterministic/simple)
    return _mock_response(role, prompt)


def _mock_response(role: str, prompt: str) -> str:
    """Simple deterministic responses for local testing.
    Designed to be helpful but not call external APIs.
    """
    lower = prompt.lower()
    if "billing" in lower:
        return "This sounds like a billing question. Please provide your invoice number and account email."
    if "error" in lower or "crash" in lower or "traceback" in lower:
        return "It looks like a technical error. Please include error messages and reproduction steps."
    if "password" in lower or "reset" in lower:
        return "For password resets, follow the reset flow in Settings → Account → Reset Password."
    # general fallback
    return "Thanks for your message — could you provide more details?"
