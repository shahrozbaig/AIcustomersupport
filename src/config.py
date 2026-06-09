import os
from pathlib import Path

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
TICKET_FILE = DATA_DIR / "tickets.json"

# Small default model name; change if you have access to others
DEFAULT_MODEL = "gpt-4o"
