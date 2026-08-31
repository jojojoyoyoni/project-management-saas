import pytest
from datetime import date
from apps.projects.models import Project, ProjectMember
from apps.organizations.models import Organization, OrganizationMember
from apps.users.models import User

@pytest.fixture
def org_and_user(db):
    user = User.objects.create_user(username="testuser", password="testpass123")
    org = Organization.objects.create(name="Test Org", slug="TESTORG", owner=user)
    OrganizationMember.objects.create(organization=org, user=user, role="owner")
    return org, user

@pytest.mark.django_db
def test_project_creation(org_and_user):
    org, user = org_and_user
    project = Project.objects.create(
        organization=org, name="Test Project", key="TEST", created_by=user,
    )
    assert project.key == "TEST"
    assert project.status == "active"

@pytest.mark.django_db
def test_project_str(org_and_user):
    org, user = org_and_user
    project = Project.objects.create(
        organization=org, name="Test Project", key="TEST", created_by=user,
    )
    assert str(project) == "TEST - Test Project"
