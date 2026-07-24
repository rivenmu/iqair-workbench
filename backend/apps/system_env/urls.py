from django.urls import path

from . import views

urlpatterns = [
    path('trigger-sync/', views.trigger_sync_view, name='trigger_sync'),
    path('status/', views.sync_status_view, name='sync_status'),
]
