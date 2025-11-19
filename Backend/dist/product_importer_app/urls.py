from django.urls import path
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("webhooks", WebhookViewSet, basename="webhook")

urlpatterns = [
    path('upload-csv/', CSVUploadView.as_view(), name='upload-csv'),
    path('task-status/<str:job_id>/', task_status, name='task-status'),
    path('products/bulk-delete/', bulk_delete_all),
    path('products/bulk-delete-selected/', bulk_delete_selected),
]

urlpatterns += router.urls