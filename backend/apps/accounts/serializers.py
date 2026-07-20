from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Role


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display', 'phone',
                  'password', 'created_at', 'last_login', 'last_login_ip']
        read_only_fields = ['id', 'created_at', 'last_login', 'last_login_ip']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserListSerializer(serializers.ModelSerializer):
    """用户列表用精简序列化器"""
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'role_display',
                  'phone', 'created_at', 'last_login', 'last_login_ip']
        read_only_fields = fields


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('原密码错误')
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """管理员重置密码"""
    new_password = serializers.CharField(required=True)


class RegisterSerializer(serializers.ModelSerializer):
    """用户注册（公开接口，默认普通用户）"""
    password = serializers.CharField(write_only=True, required=True)
    username = serializers.CharField(
        max_length=150,
        validators=[],
    )

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'phone']
        extra_kwargs = {
            'email': {'required': False},
            'phone': {'required': False},
        }

    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('用户名不能为空')
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('该用户名已被注册')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.role = Role.USER
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT 登录响应附加用户信息"""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserListSerializer(self.user).data
        return data
