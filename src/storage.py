import json
from pathlib import Path
from typing import Dict, Any

from config import DATA_DIR, TICKET_FILE


def init_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TICKET_FILE.exists():
        TICKET_FILE.write_text("[]")


def save_ticket(ticket: Dict[str, Any]):
    init_storage()
    cur = json.loads(TICKET_FILE.read_text())
    cur.append(ticket)
    TICKET_FILE.write_text(json.dumps(cur, indent=2))


def load_tickets():
    init_storage()
    return json.loads(TICKET_FILE.read_text())
