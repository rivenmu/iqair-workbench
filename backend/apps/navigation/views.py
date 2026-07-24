﻿import logging
import mimetypes
import ssl
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from django.core.files.base import ContentFile
from django.http import FileResponse, Http404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.audit.mixins import AuditLogMixin
from apps.accounts.permissions import IsAdmin

from .models import WebsiteLink
from .serializers import WebsiteLinkSerializer, WebsiteLinkListSerializer

logger = logging.getLogger(__name__)

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

_INSECURE_SSL = ssl.create_default_context()
_INSECURE_SSL.check_hostname = False
_INSECURE_SSL.verify_mode = ssl.CERT_NONE


def _http_get(url, timeout=10, retries=1):
    """使用标准库发起HTTP GET请求，返回(content, content_type)。禁用SSL验证以支持自签名证书。"""
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers={'User-Agent': UA})
            with urlopen(req, timeout=timeout, context=_INSECURE_SSL) as resp:
                content = resp.read()
                content_type = resp.headers.get('Content-Type', '')
                return content, content_type
        except HTTPError as e:
            logger.warning(f'HTTP GET failed for {url}: {e}')
            return None, None
        except (URLError, OSError, Exception) as e:
            last_exc = e
            reason = getattr(e, 'reason', e)
            is_timeout = 'timeout' in str(reason).lower() or 'handshake' in str(reason).lower()
            if attempt < retries and is_timeout:
                logger.warning(f'HTTP GET timeout for {url} (attempt {attempt + 1}), retrying...')
                continue
            logger.warning(f'HTTP GET failed for {url}: {e}')
            return None, None
    return None, None


def _is_valid_image(content):
    """检查内容是否为有效的图片格式（通过magic bytes）"""
    if not content or len(content) < 20:
        return False
    if content[:8] == b'\x89PNG\r\n\x1a\n':
        return True
    if content[:2] == b'\xff\xd8':
        return True
    if content[:4] == b'\x00\x00\x01\x00':
        return True
    if content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        return True
    if b'<svg' in content[:500]:
        return True
    return False


class WebsiteLinkViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """网站链接 ViewSet"""
    audit_module = 'navigation'
    queryset = WebsiteLink.objects.filter(is_active=True).order_by(
        'sort_order', '-created_at'
    )

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'fetch_icon', 'serve_icon']:
            return [AllowAny()]
        return [IsAdmin()]

    def get_serializer_class(self):
        if self.action == 'list':
            return WebsiteLinkListSerializer
        return WebsiteLinkSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset

    @action(detail=True, methods=['post'])
    def fetch_icon(self, request, pk=None):
        """抓取网站图标"""
        link = self.get_object()
        domain = urlparse(link.url).hostname
        if not domain:
            return Response({'success': False, 'message': '无效的URL，无法解析域名'}, status=400)

        icon_content, content_type = self._fetch_favicon(domain, link.url)
        if not icon_content:
            return Response({'success': False, 'message': '未找到图标'}, status=404)

        ext = self._get_extension(content_type, icon_content)
        filename = f'{domain}{ext}'
        link.icon_image.save(filename, ContentFile(icon_content), save=True)

        serializer = WebsiteLinkSerializer(link, context={'request': request})
        return Response({'success': True, 'link': serializer.data})

    @action(detail=True, methods=['get'], url_path='icon')
    def serve_icon(self, request, pk=None):
        """直接提供图标文件，绕过 /media/ 静态文件路径"""
        try:
            link = self.get_object()
        except Http404:
            return Response({'detail': '链接不存在'}, status=404)

        if not link.icon_image:
            return Response({'detail': '无图标'}, status=404)

        try:
            file_path = link.icon_image.path
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = 'application/octet-stream'
            response = FileResponse(open(file_path, 'rb'), content_type=content_type)
            response['Cache-Control'] = 'public, max-age=86400'
            return response
        except Exception as e:
            logger.error(f'提供图标失败: {e}')
            return Response({'detail': '图标文件读取失败'}, status=500)

    def _fetch_favicon(self, domain, original_url):
        """尝试多种方式抓取favicon，返回(bytes, content_type)"""
        scheme = urlparse(original_url).scheme or 'https'
        port = urlparse(original_url).port
        host_with_port = f'{domain}:{port}' if port else domain

        content, ct = _http_get(f'https://www.google.com/s2/favicons?domain={domain}&sz=128')
        if content and _is_valid_image(content):
            return content, ct or 'image/png'

        content, ct = _http_get(f'{scheme}://{host_with_port}/favicon.ico')
        if content and _is_valid_image(content):
            return content, ct or 'image/x-icon'

        content, ct = _http_get(f'{scheme}://{host_with_port}')
        if content:
            try:
                html = content.decode('utf-8', errors='ignore')
                icon_url = self._parse_html_for_icon(html, host_with_port, scheme)
                if icon_url:
                    icon_content, icon_ct = _http_get(icon_url)
                    if icon_content and _is_valid_image(icon_content):
                        return icon_content, icon_ct or 'image/png'
            except Exception as e:
                logger.warning(f'HTML parse favicon failed for {domain}: {e}')

        for path in ['/favicon.png', '/favicon.svg', '/assets/favicon.png',
                     '/static/favicon.ico', '/img/favicon.ico']:
            content, ct = _http_get(f'{scheme}://{host_with_port}{path}')
            if content and _is_valid_image(content):
                return content, ct or 'image/png'

        return None, None

    def _parse_html_for_icon(self, html, domain, scheme):
        """从HTML中解析favicon链接"""
        import re
        patterns = [
            r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]+href=["\']([^"\']+)["\']',
            r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\'](?:shortcut )?icon["\']',
            r'<link[^>]+rel=["\']apple-touch-icon["\'][^>]+href=["\']([^"\']+)["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                href = match.group(1)
                if href.startswith('//'):
                    return f'{scheme}:{href}'
                elif href.startswith('/'):
                    return f'{scheme}://{domain}{href}'
                elif href.startswith('http'):
                    return href
                else:
                    return f'{scheme}://{domain}/{href}'
        return None

    def _get_extension(self, content_type, icon_bytes):
        """根据content_type和文件头确定扩展名"""
        ct = (content_type or '').lower()
        if 'svg' in ct:
            return '.svg'
        if 'png' in ct:
            return '.png'
        if 'webp' in ct:
            return '.webp'
        if 'jpeg' in ct or 'jpg' in ct:
            return '.jpg'
        if icon_bytes[:8] == b'\x89PNG\r\n\x1a\n':
            return '.png'
        if icon_bytes[:2] == b'\xff\xd8':
            return '.jpg'
        return '.ico'
