from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models_cloudword import CloudWord

class CloudWordViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def list(self, request):
        words = CloudWord.objects.filter(is_active=True).order_by('-weight')
        data = [{'text': w.cn_text, 'weight': w.weight, 'en': w.en_text or w.cn_text} for w in words]
        return Response(data)

    def create(self, request):
        from apps.accounts.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return Response({'detail': 'permission denied'}, status=403)
        w = CloudWord.objects.create(
            cn_text=request.data.get('cn_text', ''),
            en_text=request.data.get('en_text', ''),
            weight=request.data.get('weight', 50),
            is_active=request.data.get('is_active', True),
        )
        return Response({'id': w.id, 'cn_text': w.cn_text, 'weight': w.weight})

    def destroy(self, request, pk=None):
        from apps.accounts.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return Response({'detail': 'permission denied'}, status=403)
        CloudWord.objects.filter(id=pk).delete()
        return Response({'detail': 'deleted'})

    def partial_update(self, request, pk=None):
        from apps.accounts.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return Response({'detail': 'permission denied'}, status=403)
        try:
            w = CloudWord.objects.get(id=pk)
        except CloudWord.DoesNotExist:
            return Response({'detail': 'not found'}, status=404)
        for field in ('cn_text', 'en_text', 'weight', 'is_active'):
            if field in request.data:
                setattr(w, field, request.data[field])
        w.save()
        return Response({'id': w.id, 'cn_text': w.cn_text, 'weight': w.weight})
