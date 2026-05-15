import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://property-search-app-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@homefinder.local"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="session")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def base_url():
    return API


@pytest.fixture(scope="session")
def admin_token(api_client):
    """Full login -> MFA verify -> return access_token."""
    r = api_client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    ct = data["challenge_token"]
    code = data["simulated_code"]
    r2 = api_client.post(f"{API}/auth/mfa/verify", json={"challenge_token": ct, "code": code})
    assert r2.status_code == 200, f"mfa verify failed: {r2.status_code} {r2.text}"
    return r2.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
