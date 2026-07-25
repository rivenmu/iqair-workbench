"""Async favicon fetch Celery task."""
import logging, re, ssl
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from celery import shared_task
from django.core.files.base import ContentFile
from apps.navigation.models import WebsiteLink
logger = logging.getLogger(__name__)
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
_SSL = ssl.create_default_context()
_SSL.check_hostname = False
_SSL.verify_mode = ssl.CERT_NONE

def _http_get(url, timeout=10):
    try:
        req = Request(url, headers={'User-Agent': UA})
        with urlopen(req, timeout=timeout, context=_SSL) as resp:
            return resp.read(), resp.headers.get('Content-Type', '')
    except Exception:
        return None, None

def _is_valid_image(content):
    if not content or len(content) < 20:
        return False
    if content[:8] == b'\x89PNG\r\n\x1a\n':
        return True
    if content[:2] == b'\xff\xd8':
        return True
    if content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        return True
    if b'<svg' in content[:500]:
        return True
    return False

def _parse_html_icon(html, domain, scheme):
    import re
    for pat in [r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]+href=["\']([^"\']+)["\']', r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\'](?:shortcut )?icon["\']']:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            href = m.group(1)
            if href.startswith('//'): return f'{scheme}:{href}'
            elif href.startswith('/'): return f'{scheme}://{domain}{href}'
            elif href.startswith('http'): return href
            else: return f'{scheme}://{domain}/{href}'
    return None

def _save_icon(link, content, domain):
    ext = '.png'
    if content[:2] == b'\xff\xd8': ext = '.jpg'
    if content[:8] == b'\x89PNG\r\n\x1a\n': ext = '.png'
    filename = f'{domain}{ext}'
    link.icon_image.save(filename, ContentFile(content), save=True)
    link.icon_fetch_failed = False
    link.save(update_fields=['icon_fetch_failed'])

@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def fetch_favicon(self, link_id):
    try:
        link = WebsiteLink.objects.get(id=link_id)
    except WebsiteLink.DoesNotExist:
        return {'success': False, 'error': 'Link not found'}
    if link.icon_image:
        return {'success': True, 'status': 'already has icon'}
    domain = urlparse(link.url).hostname
    if not domain:
        link.icon_fetch_failed = True
        link.save(update_fields=['icon_fetch_failed'])
        return {'success': False, 'error': 'Invalid URL'}
    scheme = urlparse(link.url).scheme or 'https'
    port = urlparse(link.url).port
    host_port = f'{domain}:{port}' if port else domain
    # Google favicon
    content, _ = _http_get(f'https://www.google.com/s2/favicons?domain={domain}&sz=128')
    if content and _is_valid_image(content):
        _save_icon(link, content, domain)
        return {'success': True}
    # /favicon.ico
    content, _ = _http_get(f'{scheme}://{host_port}/favicon.ico')
    if content and _is_valid_image(content):
        _save_icon(link, content, domain)
        return {'success': True}
    # HTML parse
    content, _ = _http_get(f'{scheme}://{host_port}')
    if content:
        try:
            html = content.decode('utf-8', errors='ignore')
            icon_url = _parse_html_icon(html, domain, scheme)
            if icon_url:
                icon_content, _ = _http_get(icon_url)
                if icon_content and _is_valid_image(icon_content):
                    _save_icon(link, icon_content, domain)
                    return {'success': True}
        except Exception:
            pass
    link.icon_fetch_failed = True
    link.save(update_fields=['icon_fetch_failed'])
    return {'success': False, 'error': 'No icon found'}
