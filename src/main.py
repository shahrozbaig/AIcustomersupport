import argparse
import uuid
import datetime
from flask import Flask, request, jsonify, render_template

from agents.classifier_agent import ClassifierAgent
from agents.faq_agent import FAQAgent
from agents.escalation_agent import EscalationAgent
from agents.resolution_agent import ResolutionAgent
from agents.qa_agent import QAAgent
from storage import save_ticket, load_tickets


classifier = ClassifierAgent()
faq = FAQAgent()
escalation = EscalationAgent()
resolution = ResolutionAgent()
qa = QAAgent()


def run_pipeline(query: str) -> dict:
    ticket = {
        "id": str(uuid.uuid4()),
        "query": query,
        "received_at": datetime.datetime.utcnow().isoformat() + "Z",
    }

    # Step 1: classify
    cls = classifier.handle(ticket)
    ticket.update(cls)

    final_response = None

    # Step 2: simple FAQ handling
    if ticket.get("category") == "general":
        faq_res = faq.handle(ticket)
        ticket["faq_result"] = faq_res
        if faq_res.get("answer"):
            final_response = faq_res["answer"]

    # Step 3: technical resolution
    if ticket.get("category") == "technical":
        res = resolution.handle(ticket)
        ticket["resolution"] = res

    # Step 4: escalation decision
    esc = escalation.handle(ticket)
    ticket["escalation"] = esc

    if esc.get("escalate"):
        final_response = f"Escalated to human support. Reason: {esc.get('reason')}." + (" Suggested: " + ticket.get("resolution", {}).get("suggestion", "") if ticket.get("resolution") else "")
    else:
        if final_response is None:
            # If we have a resolution suggestion, use it
            final_response = ticket.get("resolution", {}).get("suggestion") or "Thanks — a human will review this shortly."

    ticket["final_response"] = final_response

    # QA check
    qa_res = qa.handle(ticket)
    ticket["qa"] = qa_res

    # persist
    save_ticket(ticket)

    return ticket


app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ticket", methods=["POST"])
def ticket_endpoint():
    data = request.get_json(force=True)
    query = data.get("query")
    if not query:
        return jsonify({"error": "Missing 'query' in JSON body"}), 400
    ticket = run_pipeline(query)
    return jsonify(ticket)


@app.route("/tickets", methods=["GET"])
def tickets_list():
    return jsonify(load_tickets())


def demo():
    examples = [
        "I was charged twice on my invoice, please help",
        "My app crashes with a NullPointerException when I start it",
        "How do I reset my password?",
        "There's a security breach and data loss",
    ]
    for q in examples:
        print("Query:", q)
        out = run_pipeline(q)
        print("Final response:", out.get("final_response"))
        print("QA:", out.get("qa"))
        print("---")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true", help="Run Flask server")
    args = parser.parse_args()
    if args.serve:
        # Bind to 0.0.0.0 so the server is reachable from the LAN/local network.
        app.run(host="0.0.0.0", port=5000, debug=True)
    else:
        demo()
