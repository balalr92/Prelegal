# Prelegal

A SaaS product to draft legal agreements via AI chat. Users describe what they need, the AI asks clarifying questions, and a filled-in document is generated in real time with a live PDF preview.

## Features

- 12 supported document types (NDA, CSA, DPA, PSA, and more)
- AI chat interface that populates document fields via structured outputs
- "Help me choose" assistant to recommend the right document
- User accounts with sign-up / sign-in (JWT auth)
- Save, open, and delete documents in My Documents
- Legal disclaimer on all generated drafts

## Running locally

```bash
# Windows
scripts/start-windows.ps1

# Mac
scripts/start-mac.sh

# Linux
scripts/start-linux.sh
```

The app runs at http://localhost:8000.

> Documents are stored in SQLite and reset on each container restart.
