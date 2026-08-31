import pytest
from rest_framework.test import APIClient
from apps.users.models import User

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user_data():
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "password_confirm": "TestPass123!",
        "first_name": "John",
        "last_name": "Doe",
    }

@pytest.mark.django_db
def test_register_user(api_client, user_data):
    response = api_client.post("/api/auth/register/", user_data)
    assert response.status_code == 201
    assert response.data["success"] is True
    assert User.objects.filter(username="testuser").exists()

@pytest.mark.django_db
def test_login_user(api_client, user_data):
    api_client.post("/api/auth/register/", user_data)
    response = api_client.post("/api/auth/login/", {
        "username": "testuser",
        "password": "TestPass123!",
    })
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data

@pytest.mark.django_db
def test_get_current_user(api_client, user_data):
    api_client.post("/api/auth/register/", user_data)
    login_response = api_client.post("/api/auth/login/", {
        "username": "testuser",
        "password": "TestPass123!",
    })
    token = login_response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    
    response = api_client.get("/api/auth/me/")
    assert response.status_code == 200
    assert response.data["user"]["username"] == "testuser"
