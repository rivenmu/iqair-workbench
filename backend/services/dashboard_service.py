"""Dashboard data service with atomic upsert pattern."""
from decimal import Decimal
from django.db import transaction

from apps.dashboard.models import Brand, FilterRevenue, UIText
from apps.projects.models import Project
from apps.snapshots.services import SnapshotService
from utils.exceptions import BusinessError, ConflictError


class DashboardService:
    """Dashboard data aggregation and atomic batch update."""

    @staticmethod
    def get_dashboard_data(project_id):
        """Return aggregated dashboard data for frontend rendering."""
        brands = Brand.objects.filter(project_id=project_id)\
            .prefetch_related('revenues').order_by('sort_order')

        periods_set = set()
        brands_data = []

        for brand in brands:
            revenues = brand.revenues.all().order_by('period')
            periods_set.update(r.period for r in revenues)

            rev_data = [float(r.revenue) for r in revenues]
            pct_data = [float(r.filter_percentage) for r in revenues]

            brands_data.append({
                'id': brand.id,
                'name': brand.name,
                'color': brand.color,
                'logo': brand.logo,
                'filterRev': rev_data,
                'filterPct': pct_data,
                'sort_order': brand.sort_order,
                'updated_at': brand.updated_at.isoformat() if brand.updated_at else None,
            })

        periods = sorted(periods_set)
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
        """Atomic upsert: diff old/new data, apply only changes within a transaction."""
        project = Project.objects.get(id=project_id)
        old_data = DashboardService.get_dashboard_data(project_id)

        # Conflict detection
        loaded_at = data.get('_loaded_at')
        if loaded_at:
            for brand in Brand.objects.filter(project_id=project_id):
                if brand.updated_at and brand.updated_at.isoformat() > loaded_at:
                    raise ConflictError(
                        f'Brand "{brand.name}" was modified by another user. '
                        'Please refresh and try again.'
                    )

        # Snapshot old data before mutation
        SnapshotService.create_snapshot(project_id, user.id, old_data, 'update')

        periods = data.get('periods', [])
        brands_data = data.get('brands', [])
        incoming_names = {b['name'] for b in brands_data}
        incoming_brand_ids = {b.get('id') for b in brands_data if b.get('id')}

        # Delete brands not in incoming data
        Brand.objects.filter(project_id=project_id).exclude(name__in=incoming_names).delete()

        # Upsert brands
        for idx, brand_data in enumerate(brands_data):
            brand, _created = Brand.objects.update_or_create(
                project=project,
                name=brand_data['name'],
                defaults={
                    'color': brand_data.get('color', '#64748B'),
                    'logo': brand_data.get('logo', ''),
                    'sort_order': idx,
                }
            )

            rev_list = brand_data.get('filterRev', [])
            pct_list = brand_data.get('filterPct', [])

            for i, period in enumerate(periods):
                if i < len(rev_list) and i < len(pct_list):
                    FilterRevenue.objects.update_or_create(
                        brand=brand,
                        period=period,
                        defaults={
                            'revenue': Decimal(str(rev_list[i])),
                            'filter_percentage': Decimal(str(pct_list[i])),
                        }
                    )

            # Remove revenues for periods not in the new periods list
            FilterRevenue.objects.filter(brand=brand).exclude(period__in=periods).delete()

        # Upsert UI texts
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
        """Lightweight UI-text-only save."""
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
