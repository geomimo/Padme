"""Tests for application startup and health endpoint."""


def test_health_endpoint(client):
    """GET /health returns 200 with status ok."""
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_openapi_schema_is_available(client):
    """OpenAPI schema is served at /openapi.json."""
    res = client.get("/openapi.json")
    assert res.status_code == 200
    data = res.json()
    assert data["info"]["title"] == "Padme — Databricks Learning API"


def test_unauthenticated_request_to_protected_endpoint(client):
    """Requests without a token are rejected with 401."""
    res = client.get("/daily-set")
    assert res.status_code == 401


def test_invalid_token_rejected(client):
    """Requests with a malformed token are rejected with 401."""
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401
