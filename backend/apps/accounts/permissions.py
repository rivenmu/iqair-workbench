from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """仅管理员可访问"""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsAdminOrReadOnly(BasePermission):
    """管理员可写，其他用户只读"""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_admin)


class IsOwnerOrAdmin(BasePermission):
    """仅数据所有者或管理员可访问"""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_admin:
            return True
        # 检查是否有 user 字段
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
