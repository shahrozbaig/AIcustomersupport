# Autonomous Customer Support (CrewAI) — Starter

Simple multi-agent customer support demo using Python and a light CrewAI wrapper.

Requirements
- Python 3.9+
- Optional: `OPENAI_API_KEY` environment variable to use OpenAI models

Install

```
pip install -r requirements.txt
```

Run demo (simulates a ticket):

```
python src/main.py
```

Run as a small API server (localhost and LAN):

```
# Windows (PowerShell)
set OPENAI_API_KEY=your_key_here
python src/main.py --serve
# Open http://127.0.0.1:5000 or http://<your-lan-ip>:5000 in your browser.
```

Then open the React frontend at:

```
http://127.0.0.1:5000/
```

This project uses a simple fallback mock model when no API key is present so beginners can try it locally without external services.

## Deploying the UI to Vercel

This repository now includes a static frontend deployable on Vercel.

1. Push the repository to GitHub.
2. In Vercel, choose "New Project" and import the repo.
3. Set the framework preset to "Other" or use the default static deployment.

The static frontend is served from `index.html` and `static/`.

> Note: This deployment only hosts the UI. The Flask backend (`src/main.py`) must be hosted separately or updated to Vercel serverless functions for full API support.
