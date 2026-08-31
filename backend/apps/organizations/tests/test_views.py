import pytest
from rest_framework.test import APIClient
from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="TestPass123!",
        first_name="John",
        last_name="Doe",
    )


@pytest.fixture
def other_user():
    return User.objects.create_user(
        username="otheruser",
        email="other@example.com",
        password="TestPass123!",
        first_name="Jane",
        last_name="Smith",
    )


@pytest.fixture
def auth_client(api_client, user):
    response = api_client.post("/api/auth/login/", {
        "username": "testuser",
        "password": "TestPass123!",
    })
    token = response.data["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return api_client


@pytest.fixture
def organization(user):
    org = Organization.objects.create(
        name="Test Org",
        slug="TESTORG",
        owner=user,
    )
    OrganizationMember.objects.create(
        organization=org,
        user=user,
        role=OrganizationMember.Role.OWNER,
    )
    return org


@pytest.mark.django_db
def test_create_organization(auth_client):
    response = auth_client.post("/api/organizations/", {
        "name": "New Org",
        "description": "A new organization",
    })
    
    assert response.status_code == 201
    assert response.data["success"] is True
    assert response.data["organization"]["name"] == "New Org"
    assert response.data["organization"]["is_owner"] is True
    assert Organization.objects.filter(name="New Org").exists()


@pytest.mark.django_db
def test_list_organizations(auth_client, organization):
    response = auth_client.get("/api/organizations/")
    
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Test Org"


@pytest.mark.django_db
def test_cannot_see_other_organization(auth_client, organization, other_user):
    """KEY multi-tenancy test!"""
    other_org = Organization.objects.create(
        name="Secret Org",
        slug="SECRET",
        owner=other_user,
    )
    OrganizationMember.objects.create(
        organization=other_org,
        user=other_user,
        role=OrganizationMember.Role.OWNER,
    )
    
    response = auth_client.get("/api/organizations/")
    
    assert response.status_code == 200
    assert response.data["count"] == 1  # NOT 2!


@pytest.mark.django_db
def test_get_organization_detail(auth_client, organization):
    response = auth_client.get(f"/api/organizations/{organization.id}/")
    
    assert response.status_code == 200
    assert response.data["organization"]["name"] == "Test Org"


@pytest.mark.django_db
def test_get_organization_members(auth_client, organization):
    response = auth_client.get(f"/api/organizations/{organization.id}/members/")
    
    assert response.status_code == 200
    assert len(response.data["members"]) == 1
    assert response.data["members"][0]["role"] == "owner"


@pytest.mark.django_db
def test_cannot_access_other_org(auth_client, organization, other_user):
    other_org = Organization.objects.create(
        name="Secret Org",
        slug="SECRET2",
        owner=other_user,
    )
    OrganizationMember.objects.create(
        organization=other_org,
        user=other_user,
        role=OrganizationMember.Role.OWNER,
    )
    
    response = auth_client.get(f"/api/organizations/{other_org.id}/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_owner_cannot_leave(auth_client, organization):
    response = auth_client.post(f"/api/organizations/{organization.id}/leave/")
    
    assert response.status_code == 400
    assert "Owner cannot leave" in response.data["error"]
