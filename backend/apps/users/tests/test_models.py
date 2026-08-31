import pytest
from apps.users.models import User

@pytest.mark.django_db
def test_user_creation():
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123"
    )
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.check_password("testpass123")
    assert user.role == "member"

@pytest.mark.django_db
def test_user_initials():
    user = User.objects.create_user(
        username="testuser",
        first_name="John",
        last_name="Doe",
        password="testpass123"
    )
    assert user.get_initials() == "JD"

@pytest.mark.django_db
def test_user_str():
    user = User.objects.create_user(
        username="testuser",
        first_name="John",
        last_name="Doe",
        password="testpass123"
    )
    assert str(user) == "John Doe"
