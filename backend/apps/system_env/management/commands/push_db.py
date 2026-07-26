"""
将本地数据库完整推送到服务器。
用法: python manage.py push_db [--no-confirm]
"""
import subprocess
import sys
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = '将本地数据库完整推送到服务器（覆盖服务器数据）'

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-confirm',
            action='store_true',
            help='跳过确认提示，直接执行推送',
        )

    def handle(self, **options):
        no_confirm = options['no_confirm']

        if not no_confirm:
            self.stderr.write(self.style.WARNING(
                '\n⚠️  警告：此操作将覆盖服务器上的所有数据！\n'
                '   服务器的现有数据将被本地数据库完全替换。\n'
            ))
            confirm = input('确认推送？输入 "yes" 继续: ')
            if confirm.strip().lower() != 'yes':
                self.stdout.write('已取消。')
                return

        self.stdout.write('开始推送数据库到服务器...')
        try:
            result = subprocess.run(
                ['/sync/push-db.sh'],
                capture_output=True, text=True, timeout=600,
            )
            self.stdout.write(result.stdout)
            if result.returncode == 0:
                self.stdout.write(self.style.SUCCESS('\n✅ 数据库推送成功！'))
            else:
                self.stderr.write(result.stderr)
                self.stderr.write(self.style.ERROR('\n❌ 推送失败，请检查日志。'))
                sys.exit(1)
        except subprocess.TimeoutExpired:
            self.stderr.write(self.style.ERROR('\n❌ 推送超时（超过10分钟），请检查网络。'))
            sys.exit(1)
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(
                '\n❌ 未找到推送脚本 /sync/push-db.sh\n'
                '   请在 db-sync-cron 容器中运行此命令。'
            ))
            sys.exit(1)
