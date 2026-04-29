# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

**V1 complete — all tickets (PL-1 through PL-7) Done.**
- V1 technical foundation is in place: FastAPI backend (`backend/`), Next.js frontend statically built and served by FastAPI, SQLite database initialised on startup, Dockerfile (multi-stage build), and start/stop scripts for Mac, Linux, and Windows.
- Real sign-in / sign-up at `/` — PBKDF2-HMAC-SHA256 password hashing, JWT issued on login/register and stored in `localStorage`. Auth endpoints in `backend/auth.py` (`POST /api/auth/register`, `POST /api/auth/login`).
- Platform auth guard in `frontend/app/platform/layout.tsx` — unauthenticated visitors are redirected to `/` before any content renders.
- `/platform` shows a catalog grid of all 12 supported document types plus a "Help me choose" card.
- Each document card links to `/platform/[slug]` — a dynamic route with `generateStaticParams` for static export. The `SLUG_TO_FILENAME` map and `buildCatalog` helper in `frontend/lib/catalog.ts` drive slug resolution across all three page types.
- The Mutual NDA uses `frontend/components/nda/nda-chat.tsx` with live PDF preview. All other documents use `frontend/components/doc/doc-chat.tsx` + `DocDocument`.
- `/platform/help` is an AI chat (`frontend/components/help/help-chat.tsx`) that recommends the right document from a user's description.
- The chat backend (`POST /api/chat`, `backend/chat.py`) routes by `doc_type`: `mutual-nda` uses `NdaFieldsPartial`, `help` uses `HelpFields`, all other slugs use `GenericDocFields` (55 optional fields).
- Document persistence: `backend/documents.py` exposes `POST /api/documents` (save), `GET /api/documents` (list), `GET /api/documents/{id}` (fetch with fields), `DELETE /api/documents/{id}` (delete). All endpoints are user-scoped via JWT.
- `/platform/my-documents` lists saved drafts. Each card has **Open** (preloads saved fields via `sessionStorage` then navigates to the doc page), **New** (fresh session), and **Delete** buttons.
- Chat components preload saved fields on mount by reading `sessionStorage` key `prelegal_preload` (set by the Open flow), so the PDF renders the saved state immediately.
- Explicit **Save to My Documents** button in the PDF preview header bar of each chat page — no auto-saving.
- Nav shows user initial avatar, "My Documents" link, and sign-out button.
- Legal disclaimer shown below the chat input in all three chat components.
- Markdown is rendered in AI chat responses via `react-markdown`.
- Database (`prelegal.db`) is SQLite, created fresh on each container start — data does not persist across restarts.

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
The database uses SQLite (`prelegal.db`), created from scratch each time the container starts, with `users` and `documents` tables (see `backend/db.py`).  
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

