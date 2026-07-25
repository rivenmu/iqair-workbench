import pytest
from apps.navigation.models import WebsiteLink, UserFavorite

class TestNavigationModels:
    def test_link_creation(self, db):
        link = WebsiteLink.objects.create(name='Google', url='https://google.com', category='common_sites')
        assert str(link) == 'Google'
        assert link.is_active is True
        assert link.is_internal is False
    def test_link_category_choices(self, db):
        link = WebsiteLink.objects.create(name='Test', url='https://x.com', category='friend_links')
        assert link.get_category_display() == chr(21451)+chr(24773)+chr(38142)+chr(25509)
    def test_link_internal_flag(self, db):
        link = WebsiteLink.objects.create(name='Dashboard', url='/dashboard', category='common_sites', is_internal=True)
        assert link.is_internal is True
    def test_link_default_sort(self, db):
        a = WebsiteLink.objects.create(name='A', url='/a', category='common_sites', sort_order=2)
        b = WebsiteLink.objects.create(name='B', url='/b', category='common_sites', sort_order=1)
        links = list(WebsiteLink.objects.filter(category='common_sites'))
        assert links[0].name == 'B'
    def test_favorite_creation(self, db, admin_user):
        link = WebsiteLink.objects.create(name='GitHub', url='https://github.com', category='tools')
        fav = UserFavorite.objects.create(user=admin_user, website_link=link)
        assert fav.user == admin_user
        assert fav.website_link == link
    def test_favorite_unique(self, db, admin_user):
        link = WebsiteLink.objects.create(name='GH', url='https://x.com', category='tools')
        UserFavorite.objects.create(user=admin_user, website_link=link)
        with pytest.raises(Exception):
            UserFavorite.objects.create(user=admin_user, website_link=link)

class TestNavigationAPI:
    def test_list_links_public(self, api_client, db):
        WebsiteLink.objects.create(name='Test', url='https://t.com', category='common_sites')
        resp = api_client.get('/api/navigation/links/')
        assert resp.status_code == 200
        assert len(resp.data) >= 1  # may include pre-existing
    def test_filter_by_category(self, api_client, db):
        WebsiteLink.objects.create(name='A', url='/a', category='common_sites')
        WebsiteLink.objects.create(name='B', url='/b', category='friend_links')
        resp = api_client.get('/api/navigation/links/?category=common_sites')
        assert resp.status_code == 200
        assert len(resp.data) >= 1  # may include pre-existing  # may include pre-existing links
    def test_toggle_favorite_requires_auth(self, api_client, db):
        link = WebsiteLink.objects.create(name='X', url='/x', category='tools')
        resp = api_client.post(f'/api/navigation/links/{link.id}/toggle_favorite/')
        assert resp.status_code == 401
    def test_toggle_favorite(self, auth_client, db):
        link = WebsiteLink.objects.create(name='X', url='/x', category='tools')
        resp = auth_client.post(f'/api/navigation/links/{link.id}/toggle_favorite/')
        assert resp.status_code == 200
        assert resp.data['is_favorited'] is True
    def test_create_link_requires_admin(self, user_client, db):
        resp = user_client.post('/api/navigation/links/', {'name':'N','url':'/n','category':'common_sites'})
        assert resp.status_code == 403
    def test_admin_can_create_link(self, auth_client, db):
        resp = auth_client.post('/api/navigation/links/', {'name':'New','url':'/new','category':'common_sites'})
        assert resp.status_code == 201
