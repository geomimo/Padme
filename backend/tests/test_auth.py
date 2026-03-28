"""Tests for authentication endpoints and token flow."""
import pytest


class TestLogin:
    def test_login_success(self, client, regular_user):
        res = client.post("/auth/login", json={"email": "user@test.com", "password": "password123"})
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "user@test.com"
        assert data["user"]["role"] == "user"

    def test_login_wrong_password(self, client, regular_user):
        res = client.post("/auth/login", json={"email": "user@test.com", "password": "wrongpass"})
        assert res.status_code == 401
        assert "Invalid" in res.json()["detail"]

    def test_login_unknown_email(self, client):
        res = client.post("/auth/login", json={"email": "nobody@test.com", "password": "anything"})
        assert res.status_code == 401

    def test_login_disabled_account(self, client, session, regular_user):
        regular_user.is_active = False
        session.add(regular_user)
        session.commit()

        res = client.post("/auth/login", json={"email": "user@test.com", "password": "password123"})
        assert res.status_code == 403
        assert "disabled" in res.json()["detail"].lower()

    def test_token_contains_user_fields(self, client, regular_user):
        res = client.post("/auth/login", json={"email": "user@test.com", "password": "password123"})
        user = res.json()["user"]
        assert "id" in user
        assert "xp" in user
        assert "streak" in user
        assert "longest_streak" in user


class TestMe:
    def test_me_returns_current_user(self, client, regular_user, auth_headers):
        res = client.get("/auth/me", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "user@test.com"
        assert data["name"] == "Test User"

    def test_me_without_token_returns_401(self, client):
        res = client.get("/auth/me")
        assert res.status_code == 401

    def test_me_with_invalid_token_returns_401(self, client):
        res = client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
        assert res.status_code == 401

    def test_admin_login_has_admin_role(self, client, admin_user):
        res = client.post("/auth/login", json={"email": "admin@test.com", "password": "adminpass"})
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "admin"
