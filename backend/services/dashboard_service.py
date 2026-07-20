from decimal import Decimal
from django.db import transaction

from apps.dashboard.models import Brand, FilterRevenue, UIText
from apps.projects.models import Project
from apps.snapshots.services import SnapshotService


class DashboardService:
    """看板数据服务层 - 处理数据聚合和批量更新"""

    @staticmethod
    def get_dashboard_data(project_id):
        """
        获取完整看板数据，返回前端渲染所需的聚合格式
        """
        brands = Brand.objects.filter(project_id=project_id).prefetch_related('revenues').order_by('sort_order')

        # 收集所有期间
        periods_set = set()
        brands_data = []

        for brand in brands:
            revenues = brand.revenues.all().order_by('period')
            periods_set.update([r.period for r in revenues])

            # 按期间顺序整理营收数据
            rev_data = []
            pct_data = []
            for rev in revenues:
                rev_data.append(float(rev.revenue))
                pct_data.append(float(rev.filter_percentage))

            brands_data.append({
                'id': brand.id,
                'name': brand.name,
                'color': brand.color,
                'logo': brand.logo,
                'filterRev': rev_data,
                'filterPct': pct_data,
                'sort_order': brand.sort_order
            })

        periods = sorted(periods_set)

        # 加载该项目的 UI 文本
        ui_texts = {
            t.key: t.value
            for t in UIText.objects.filter(project_id=project_id)
        }

        return {
            'project_id': project_id,
            'periods': periods,
            'brands': brands_data,
            'uiTexts': ui_texts,
        }

    @staticmethod
    @transaction.atomic
    def save_dashboard_data(project_id, data, user):
        """
        批量保存看板数据
        数据格式：{ periods: [], brands: [{ name, color, logo, filterRev: [], filterPct: [] }], uiTexts: {} }
        """
        project = Project.objects.get(id=project_id)

        # 创建修改前快照
        old_data = DashboardService.get_dashboard_data(project_id)
        SnapshotService.create_snapshot(project_id, user.id, old_data, 'update')

        # 清除旧数据
        Brand.objects.filter(project_id=project_id).delete()

        # 批量创建新数据
        periods = data.get('periods', [])
        brands_data = data.get('brands', [])

        for idx, brand_data in enumerate(brands_data):
            brand = Brand.objects.create(
                project=project,
                name=brand_data['name'],
                color=brand_data.get('color', '#64748B'),
                logo=brand_data.get('logo', ''),
                sort_order=idx
            )

            rev_list = brand_data.get('filterRev', [])
            pct_list = brand_data.get('filterPct', [])

            for i, period in enumerate(periods):
                if i < len(rev_list) and i < len(pct_list):
                    FilterRevenue.objects.create(
                        brand=brand,
                        period=period,
                        revenue=Decimal(str(rev_list[i])),
                        filter_percentage=Decimal(str(pct_list[i]))
                    )

        # 持久化 UI 文本（upsert）
        ui_texts = data.get('uiTexts', {}) or {}
        if isinstance(ui_texts, dict):
            for key, value in ui_texts.items():
                UIText.objects.update_or_create(
                    project=project,
                    key=key,
                    defaults={'value': value if value is not None else ''}
                )

        return True

    @staticmethod
    @transaction.atomic
    def save_ui_texts(project_id, ui_texts):
        """
        单独保存 UI 文本（用于轻量更新场景，避免触发全量品牌数据写入）
        """
        project = Project.objects.get(id=project_id)
        if not isinstance(ui_texts, dict):
            return False
        for key, value in ui_texts.items():
            UIText.objects.update_or_create(
                project=project,
                key=key,
                defaults={'value': value if value is not None else ''}
            )
        return True
