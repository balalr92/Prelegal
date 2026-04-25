"""Integration tests for auth and document endpoints."""
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def temp_db(tmp_path):
    """Use a temporary DB for each test."""
    db_path = tmp_path / "test.db"
    with patch("db.DB_PATH", db_path):
        import db
        db.init_db()
        yield db_path


@pytest.fixture
def client(temp_db):
    import main
    return TestClient(main.app)


def test_register_and_login(client):
    # Register
    r = client.post("/api/auth/register", json={"email": "alice@example.com", "password": "secret123"})
    assert r.status_code == 200
    data = r.json()
    assert "token" in data
    assert data["email"] == "alice@example.com"

    # Login
    r = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "secret123"})
    assert r.status_code == 200
    assert "token" in r.json()


def test_duplicate_register(client):
    client.post("/api/auth/register", json={"email": "bob@example.com", "password": "password1"})
    r = client.post("/api/auth/register", json={"email": "bob@example.com", "password": "otherpass"})
    assert r.status_code == 409


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={"email": "carol@example.com", "password": "correct_pw"})
    r = client.post("/api/auth/login", json={"email": "carol@example.com", "password": "wrongwrong"})
    assert r.status_code == 401


def test_save_and_list_documents(client):
    # Register and get token
    r = client.post("/api/auth/register", json={"email": "dave@example.com", "password": "password1"})
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Save a document
    r = client.post("/api/documents", json={
        "doc_type": "mutual-nda",
        "doc_title": "Acme / Beta NDA",
        "fields": {"party_a_entity": "Acme", "party_b_entity": "Beta"},
    }, headers=headers)
    assert r.status_code == 201
    doc_id = r.json()["id"]
    assert doc_id > 0

    # List documents
    r = client.get("/api/documents", headers=headers)
    assert r.status_code == 200
    docs = r.json()
    assert len(docs) == 1
    assert docs[0]["doc_title"] == "Acme / Beta NDA"
    assert docs[0]["doc_type"] == "mutual-nda"


def test_documents_require_auth(client):
    r = client.get("/api/documents")
    assert r.status_code == 422  # missing Authorization header

    r = client.get("/api/documents", headers={"Authorization": "Bearer invalidtoken"})
    assert r.status_code == 401


def test_users_cannot_see_each_others_documents(client):
    # User 1
    r1 = client.post("/api/auth/register", json={"email": "u1@example.com", "password": "password1"})
    t1 = r1.json()["token"]
    client.post("/api/documents", json={
        "doc_type": "csa", "doc_title": "U1 Doc", "fields": {}
    }, headers={"Authorization": f"Bearer {t1}"})

    # User 2
    r2 = client.post("/api/auth/register", json={"email": "u2@example.com", "password": "password1"})
    t2 = r2.json()["token"]

    docs = client.get("/api/documents", headers={"Authorization": f"Bearer {t2}"}).json()
    assert len(docs) == 0
