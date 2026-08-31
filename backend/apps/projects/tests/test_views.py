import pytest
from rest_framework.test import APIClient
from apps.users.models import User
from apps.organizations.models import Organization, OrganizationMember
from apps.projects.models import Project, ProjectMember


@pytest.fixture
def user():
    return User.objects.create_user(
        username="testuser", email="test@example.com",
        password="TestPass123!", first_name="John", last_name="Doe",
    )


@pytest.fixture
def other_user():
    return User.objects.create_user(
        username="otheruser", email="other@example.com",
        password="TestPass123!", first_name="Jane", last_name="Smith",
    )


@pytest.fixture
def org(user):
    org = Organization.objects.create(name="Test Org", slug="TESTORG", owner=user)
    OrganizationMember.objects.create(
        organization=org, user=user, role=OrganizationMember.Role.OWNER,
    )
    return org


@pytest.fixture
def auth_client(user):
    client = APIClient()
    response = client.post("/api/auth/login/", {
        "username": "testuser", "password": "TestPass123!",
    })
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
    return client


@pytest.fixture
def project(org, user):
    proj = Project.objects.create(
        organization=org, name="Test Project", key="TEST",
        created_by=user, priority="high",
    )
    ProjectMember.objects.create(
        project=proj, user=user, role=ProjectMember.Role.OWNER,
    )
    return proj


@pytest.mark.django_db
def test_create_project(auth_client, org):
    response = auth_client.post(f"/api/organizations/{org.id}/projects/", {
        "name": "New Project",
        "key": "NEW",
        "description": "A new project",
        "priority": "high",
    })
    
    assert response.status_code == 201
    assert response.data["success"] is True
    assert response.data["project"]["key"] == "NEW"
    assert response.data["project"]["member_count"] == 1


@pytest.mark.django_db
def test_create_project_duplicate_key(auth_client, project):
    response = auth_client.post(
        f"/api/organizations/{project.organization.id}/projects/",
        {"name": "Another", "key": "TEST"},
    )
    
    assert response.status_code == 400
    assert "already exists" in str(response.data)


@pytest.mark.django_db
def test_list_projects(auth_client, project):
    response = auth_client.get(f"/api/organizations/{project.organization.id}/projects/")
    
    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["key"] == "TEST"


@pytest.mark.django_db
def test_get_project_detail(auth_client, project):
    response = auth_client.get(
        f"/api/organizations/{project.organization.id}/projects/{project.id}/"
    )
    
    assert response.status_code == 200
    assert response.data["project"]["name"] == "Test Project"
    assert response.data["project"]["current_user_role"] == "owner"


@pytest.mark.django_db
def test_cannot_see_other_org_projects(auth_client, project, other_user):
    other_org = Organization.objects.create(
        name="Other Org", slug="OTHERORG", owner=other_user,
    )
    OrganizationMember.objects.create(
        organization=other_org, user=other_user, role=OrganizationMember.Role.OWNER,
    )
    Project.objects.create(
        organization=other_org, name="Secret Project", key="SEC", created_by=other_user,
    )
    
    response = auth_client.get(f"/api/organizations/{other_org.id}/projects/")
    assert response.status_code == 200
    assert response.data["count"] == 0


@pytest.mark.django_db
def test_cannot_access_project_not_member(auth_client, project, other_user):
    other_project = Project.objects.create(
        organization=project.organization, name="Other Project",
        key="OTH", created_by=other_user,
    )
    
    response = auth_client.get(
        f"/api/organizations/{project.organization.id}/projects/{other_project.id}/"
    )
    assert response.status_code == 404


@pytest.mark.django_db
def test_project_members(auth_client, project, other_user):
    ProjectMember.objects.create(
        project=project, user=other_user, role=ProjectMember.Role.EDITOR,
    )
    
    response = auth_client.get(
        f"/api/organizations/{project.organization.id}/projects/{project.id}/members/"
    )
    
    assert response.status_code == 200
    assert len(response.data["members"]) == 2


@pytest.mark.django_db
def test_add_member(auth_client, project, other_user):
    OrganizationMember.objects.create(
        organization=project.organization, user=other_user,
        role=OrganizationMember.Role.MEMBER,
    )
    
    response = auth_client.post(
        f"/api/organizations/{project.organization.id}/projects/{project.id}/add_member/",
        {"user_id": other_user.id, "role": "editor"},
    )
    
    assert response.status_code == 201
    assert response.data["member"]["role"] == "editor"
