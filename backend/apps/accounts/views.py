from django.contrib.auth import get_user_model, login
from django.http import HttpResponseRedirect
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Role
from .permissions import IsAdmin, IsOwnerOrAdmin
from .serializers import (
    UserSerializer, UserListSerializer,
    ChangePasswordSerializer, ResetPasswordSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """JWT 登录，返回 access + refresh token 和用户信息"""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # 记录登录 IP
            user = User.objects.get(username=request.data.get('username'))
            xff = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')
            user.last_login_ip = ip
            user.save(update_fields=['last_login_ip'])
        return response


class RegisterView(APIView):
    """用户注册（公开接口，默认普通用户）"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'detail': '注册成功',
                'user': UserListSerializer(user).data,
            },
            status=status.HTTP_201_CREATED
        )


class UserViewSet(viewsets.ModelViewSet):
    """用户管理 ViewSet（管理员可增删改查，普通用户只能查看自己）"""
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_admin:
            return User.objects.all().order_by('-created_at')
        return User.objects.filter(id=self.request.user.id)

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'reset_password']:
            return [IsAdmin()]
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsOwnerOrAdmin()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reset_password(self, request, pk=None):
        """管理员重置用户密码"""
        user = self.get_object()
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': '密码重置成功'}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """修改自己密码"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': '密码修改成功'}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """获取当前登录用户信息"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserListSerializer(request.user)
        return Response(serializer.data)


class _QueryParamJWTAuthentication(JWTAuthentication):
    """支持从 URL 查询参数 token 读取 JWT（用于管理后台 SSO 跳转）。"""

    def authenticate(self, request):
        token = request.GET.get('token')
        if token:
            try:
                validated_token = self.get_validated_token(token)
                return self.get_user(validated_token), validated_token
            except Exception as exc:
                raise AuthenticationFailed('无效的登录凭证') from exc
        return super().authenticate(request)


class AdminSSOView(APIView):
    """
    管理后台单点登录。

    前端已登录用户点击"管理后台"后访问该接口，
    后端通过 JWT 认证识别用户，建立 Django session，
    然后重定向到 /admin/。
    """
    authentication_classes = [_QueryParamJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # 建立 Django session
        login(request, user)

        # 非管理员也可以进入 /admin/ 查看个人权限内的内容，
        # 若要严格限制仅管理员，可在此返回 403
        next_url = request.GET.get('next', '/admin/')
        return HttpResponseRedirect(next_url)
