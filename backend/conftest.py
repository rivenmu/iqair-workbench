import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.projects.models import Project

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username='admin_test', password='test1234', role='admin')


@pytest.fixture
def normal_user(db):
    return User.objects.create_user(username='user_test', password='test1234', role='user')


@pytest.fixture
def auth_client(api_client, admin_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return api_client


@pytest.fixture
def user_client(api_client, normal_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    token = RefreshToken.for_user(normal_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token.access_token}')
    return api_client


@pytest.fixture
def project(db):
    return Project.objects.create(name='Test Project', route='/dashboard/test', icon='Monitor', sort_order=1)
