from django.core.management.base import BaseCommand
from apps.accounts.models import User, Role
from apps.projects.models import Project


class Command(BaseCommand):
    help = '初始化管理员账户和默认项目数据'

    def handle(self, *args, **options):
        # 创建管理员账户
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                password='admin123',
                email='admin@iqair.local',
                role=Role.ADMIN
            )
            self.stdout.write(self.style.SUCCESS('✓ 管理员账户创建成功 (admin/admin123)'))
        else:
            self.stdout.write(self.style.WARNING('管理员账户已存在，跳过'))

        # 创建默认项目
        default_projects = [
            {
                'name': 'IQAir及竞品数据面板',
                'description': 'IQAir 与竞品滤芯营收及占比演变分析',
                'icon': 'TrendCharts',
                'route': '/dashboard/iqair',
                'sort_order': 1
            },
            {
                'name': '空气质量实时监测面板',
                'description': '实时空气质量数据监测与可视化',
                'icon': 'Wind',
                'route': '/dashboard/air-quality',
                'sort_order': 2
            },
            {
                'name': '销售数据分析面板',
                'description': '销售数据多维度分析与趋势预测',
                'icon': 'Histogram',
                'route': '/dashboard/sales',
                'sort_order': 3
            },
            {
                'name': '周报面板',
                'description': '每周业务数据汇总与展示',
                'icon': 'Document',
                'route': '/dashboard/weekly',
                'sort_order': 4
            },
            {
                'name': '日报面板',
                'description': '每日数据导入与分析',
                'icon': 'Calendar',
                'route': '/dashboard/daily',
                'sort_order': 5
            },
        ]

        for proj_data in default_projects:
            project, created = Project.objects.get_or_create(
                name=proj_data['name'],
                defaults=proj_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ 项目创建成功: {project.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'项目已存在: {project.name}'))

        self.stdout.write(self.style.SUCCESS('初始化完成！'))
