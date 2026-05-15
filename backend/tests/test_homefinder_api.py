"""
HomeFinder API regression tests.
Covers: health, auth (login/MFA/me/replay), properties (search/filter), admin CRUD,
and SessionManager Singleton property.
"""
import os
import sys
import pytest
import requests

API = os.environ.get("REACT_APP_BACKEND_URL", "https://property-search-app-3.preview.emergentagent.com").rstrip("/") + "/api"

ADMIN_EMAIL = "admin@homefinder.local"
ADMIN_PASSWORD = "Admin@123"


# ---------- Health ----------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("app") == "HomeFinder"


# ---------- Auth: login ----------
class TestAuthLogin:
    def test_login_success_returns_challenge_and_simulated_code(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "challenge_token" in d and isinstance(d["challenge_token"], str) and len(d["challenge_token"]) > 10
        assert "simulated_code" in d
        assert len(d["simulated_code"]) == 6 and d["simulated_code"].isdigit()
        assert d.get("email") == ADMIN_EMAIL

    def test_login_wrong_password_returns_401(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong-pass"})
        assert r.status_code == 401


# ---------- Auth: MFA verify ----------
class TestAuthMfa:
    def _login(self, api_client):
        r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        return r.json()

    def test_mfa_verify_success(self, api_client):
        d = self._login(api_client)
        r = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": d["challenge_token"], "code": d["simulated_code"]})
        assert r.status_code == 200, r.text
        body = r.json()
        assert "access_token" in body and isinstance(body["access_token"], str)
        assert body.get("token_type") == "bearer"
        assert body["user"]["email"] == ADMIN_EMAIL
        assert body["user"]["role"] == "admin"

    def test_mfa_verify_wrong_code_returns_401(self, api_client):
        d = self._login(api_client)
        r = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": d["challenge_token"], "code": "000000"})
        # If by chance the random code is 000000, retry once
        if r.status_code == 200:
            d = self._login(api_client)
            wrong = "999999" if d["simulated_code"] != "999999" else "111111"
            r = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": d["challenge_token"], "code": wrong})
        assert r.status_code == 401

    def test_mfa_replay_attack_returns_401(self, api_client):
        d = self._login(api_client)
        r1 = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": d["challenge_token"], "code": d["simulated_code"]})
        assert r1.status_code == 200
        r2 = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": d["challenge_token"], "code": d["simulated_code"]})
        assert r2.status_code == 401


# ---------- Auth: /me ----------
class TestAuthMe:
    def test_me_with_token(self, api_client, admin_token):
        r = api_client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == ADMIN_EMAIL
        assert u["role"] == "admin"

    def test_me_without_token(self, api_client):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Properties: public search ----------
class TestProperties:
    def test_list_returns_seeded(self, api_client):
        r = api_client.get(f"{API}/properties")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 6
        sample = items[0]
        for key in ("propertyID", "title", "location", "price", "bedrooms", "bathrooms", "description", "image_url"):
            assert key in sample
        assert "_id" not in sample

    def test_filter_by_location(self, api_client):
        r = api_client.get(f"{API}/properties", params={"location": "lahore"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all("lahore" in p["location"].lower() for p in items)

    def test_filter_by_price_range(self, api_client):
        r = api_client.get(f"{API}/properties", params={"min_price": 20000, "max_price": 50000})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for p in items:
            assert 20000 <= p["price"] <= 50000


# ---------- Admin CRUD ----------
class TestAdminCRUD:
    def test_create_requires_admin_token(self, api_client):
        r = api_client.post(f"{API}/admin/properties", json={
            "title": "TEST_unauth", "location": "X", "price": 1.0,
            "bedrooms": 1, "bathrooms": 1, "description": "x", "image_url": "https://x/y.png"
        })
        assert r.status_code == 401

    def test_create_update_delete_flow(self, api_client, admin_headers):
        payload = {
            "title": "TEST_Created Property",
            "location": "TestCity",
            "price": 33333.0,
            "bedrooms": 2,
            "bathrooms": 1,
            "description": "Created by automated test",
            "image_url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        }
        r = api_client.post(f"{API}/admin/properties", headers=admin_headers, json=payload)
        assert r.status_code == 201, r.text
        created = r.json()
        pid = created["propertyID"]
        assert created["title"] == payload["title"]
        assert created["location"] == "TestCity"
        assert "_id" not in created

        # Verify via GET
        r2 = api_client.get(f"{API}/properties/{pid}")
        assert r2.status_code == 200
        assert r2.json()["title"] == payload["title"]

        # Update
        r3 = api_client.put(f"{API}/admin/properties/{pid}", headers=admin_headers, json={"price": 44444.0, "title": "TEST_Updated"})
        assert r3.status_code == 200
        # Verify update persisted
        r4 = api_client.get(f"{API}/properties/{pid}")
        assert r4.status_code == 200
        d = r4.json()
        assert d["price"] == 44444.0
        assert d["title"] == "TEST_Updated"

        # Delete
        r5 = api_client.delete(f"{API}/admin/properties/{pid}", headers=admin_headers)
        assert r5.status_code == 204
        # Verify deleted
        r6 = api_client.get(f"{API}/properties/{pid}")
        assert r6.status_code in (404, 400)


# ---------- SessionManager Singleton ----------
class TestSingleton:
    def test_session_manager_singleton(self):
        sys.path.insert(0, "/app/backend")
        from core.session_manager import SessionManager
        a = SessionManager()
        b = SessionManager()
        assert a is b
        a.register_session("tok-x", {"id": "u1", "email": "u@x", "role": "user", "name": "u"})
        assert b.get_user_by_token("tok-x")["email"] == "u@x"
        b.clear_session("tok-x")
        assert a.get_user_by_token("tok-x") is None
