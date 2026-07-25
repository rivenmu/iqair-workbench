import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


class TestAuthEndpoints:

    def test_register_creates_user(self, api_client, db):
        resp = api_client.post('/api/auth/register/', {
            'username': 'newuser', 'password': 'pass1234', 'email': 'a@b.com'
        })
        assert resp.status_code == 201
        assert User.objects.filter(username='newuser').exists()

    def test_register_duplicate_username(self, api_client, admin_user):
        resp = api_client.post('/api/auth/register/', {
            'username': 'admin_test', 'password': 'pass1234'
        })
        assert resp.status_code == 400

    def test_login_returns_tokens(self, api_client, admin_user):
        resp = api_client.post('/api/auth/login/', {
            'username': 'admin_test', 'password': 'test1234'
        })
        assert resp.status_code == 200
        assert 'access' in resp.data
        assert 'refresh' in resp.data

    def test_login_bad_password(self, api_client, admin_user):
        resp = api_client.post('/api/auth/login/', {
            'username': 'admin_test', 'password': 'wrong'
        })
        assert resp.status_code == 401

    def test_me_requires_auth(self, api_client):
        resp = api_client.get('/api/auth/me/')
        assert resp.status_code == 401

    def test_me_returns_user_info(self, auth_client, admin_user):
        resp = auth_client.get('/api/auth/me/')
        assert resp.status_code == 200
        assert resp.data['username'] == 'admin_test'

    def test_change_password(self, auth_client):
        resp = auth_client.post('/api/auth/change-password/', {
            'old_password': 'test1234', 'new_password': 'newpass5678'
        })
        assert resp.status_code == 200

    def test_change_password_wrong_old(self, auth_client):
        resp = auth_client.post('/api/auth/change-password/', {
            'old_password': 'wrong', 'new_password': 'newpass5678'
        })
        assert resp.status_code == 400


class TestPermissions:

    def test_normal_user_sees_only_self(self, user_client, normal_user):
        resp = user_client.get('/api/auth/users/')
        assert resp.status_code == 200
        results = resp.data.get('results', resp.data) if isinstance(resp.data, dict) else resp.data
        assert len(list(results)) == 1

    def test_admin_can_list_users(self, auth_client):
        resp = auth_client.get('/api/auth/users/')
        assert resp.status_code == 200

    def test_user_can_access_own_data(self, user_client, normal_user):
        resp = user_client.get(f'/api/auth/users/{normal_user.id}/')
        assert resp.status_code == 200


class TestModels:

    def test_user_is_admin_property(self, admin_user, normal_user):
        assert admin_user.is_admin is True
        assert normal_user.is_admin is False

    def test_user_str(self, admin_user):
        assert str(admin_user) == 'admin_test (管理员)'

    def test_user_role_default(self, db):
        u = User.objects.create_user(username='def', password='p')
        assert u.role == 'user'
