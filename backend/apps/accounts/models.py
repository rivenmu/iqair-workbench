from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = 'admin', '管理员'
    USER = 'user', '普通用户'


class User(AbstractUser):
    """用户模型 - 支持管理员/普通用户两种角色"""
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        verbose_name='角色'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    last_login_ip = models.GenericIPAddressField(null=True, blank=True, verbose_name='最后登录IP')
    dataease_password = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name='DataEase密码哈希(BCrypt)'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    @property
    def is_admin(self):
        return self.role == Role.ADMIN

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'
