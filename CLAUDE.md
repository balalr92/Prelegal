# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

**Current implementation status (as of PL-4):**
- V1 technical foundation is in place: FastAPI backend (`backend/`), Next.js frontend statically built and served by FastAPI, SQLite database initialised on startup with a `users` table, Dockerfile (multi-stage build), and start/stop scripts for Mac, Linux, and Windows.
- A fake login screen (`/`) navigates directly to the platform shell (`/platform/`) — no real authentication yet.
- Only the Mutual NDA creator is implemented (form + live PDF preview, client-side only). AI chat, real authentication, multi-document support, and document persistence are not yet built.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use OpenAI to the `gpt-5.4-mini` model as the inference provider. You should use Structured Outputs (Pydantic) so that you can interpret the results and populate fields in the legal document.

There is an OPENAI_API_KEY in the .env file in the project root.

## Technical design

The entire project is packaged into a Docker container (multi-stage build: Node builds Next.js static export, Python runtime serves it via FastAPI).  
The backend is in `backend/` — a uv project using FastAPI, running at http://localhost:8000.  
The frontend is in `frontend/` — Next.js with `output: 'export'`; the static build (`out/`) is served by FastAPI via `StaticFiles`.  
The database uses SQLite (`prelegal.db`), created from scratch each time the container starts, with a `users` table for future sign-up and sign-in.  
Scripts are in `scripts/` for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

