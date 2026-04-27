import json

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from auth import verify_token
from db import get_conn

router = APIRouter(prefix="/api")


def _user_id_from_header(authorization: str) -> int:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    payload = verify_token(authorization[7:])
    return int(payload["sub"])


class SaveDocRequest(BaseModel):
    doc_type: str
    doc_title: str
    fields: dict


@router.post("/documents", status_code=201)
def save_document(body: SaveDocRequest, authorization: str = Header(...)):
    user_id = _user_id_from_header(authorization)
    conn = get_conn()
    cursor = conn.execute(
        "INSERT INTO documents (user_id, doc_type, doc_title, fields_json) VALUES (?, ?, ?, ?)",
        (user_id, body.doc_type, body.doc_title, json.dumps(body.fields)),
    )
    conn.commit()
    doc_id = cursor.lastrowid
    conn.close()
    return {"id": doc_id}


@router.get("/documents")
def list_documents(authorization: str = Header(...)):
    user_id = _user_id_from_header(authorization)
    conn = get_conn()
    rows = conn.execute(
        "SELECT id, doc_type, doc_title, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/documents/{doc_id}")
def get_document(doc_id: int, authorization: str = Header(...)):
    user_id = _user_id_from_header(authorization)
    conn = get_conn()
    row = conn.execute(
        "SELECT id, doc_type, doc_title, fields_json, created_at FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, user_id),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    result = dict(row)
    result["fields"] = json.loads(result.pop("fields_json"))
    return result
