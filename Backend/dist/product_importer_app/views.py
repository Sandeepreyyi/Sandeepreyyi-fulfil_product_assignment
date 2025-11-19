from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CSVUploadSerializer
from .tasks import process_csv
import tempfile
from celery.result import AsyncResult
from rest_framework.decorators import api_view
from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination
from .models import Product
from .serializers import *
from .tasks import send_webhook_test
from rest_framework.decorators import action
from django.db.models import Q


def api_response(message, message_type="success", status_code=200, data=None):
    response = {
        "message": message,
        "message_type": message_type,
        "status_code": status_code,
    }
    if data is not None:
        response["data"] = data
    return Response(response, status=status_code)


class CSVUploadView(APIView):
    def post(self, request):
        serializer = CSVUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        csv_file = serializer.validated_data["file"]

        # Save CSV temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
        for chunk in csv_file.chunks():
            temp_file.write(chunk)
        temp_file.close()

        # Start Celery task
        job = process_csv.delay(temp_file.name)

        return Response(
            {"job_id": job.id},
            status=status.HTTP_202_ACCEPTED
        )


@api_view(['GET'])
def task_status(request, job_id):
    result = AsyncResult(job_id)

    response = {"state": result.state}

    if result.state == "PROGRESS":
        response["progress"] = result.info  # meta={'processed': X, 'total': Y}

    elif result.state == "SUCCESS":
        response["progress"] = result.info

    elif result.state == "FAILURE":
        response["progress"] = {"error": str(result.info)}

    return Response(response)




class ProductPagination(PageNumberPagination):
    page_size = 20

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    pagination_class = ProductPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['id','sku','name','created_at']
    ordering = ['-id']

    def get_queryset(self):
        qs = Product.objects.all().order_by("-id")
        search = self.request.query_params.get("search")
        status = self.request.query_params.get("status")

        if search:
            qs = qs.filter(Q(sku__icontains=search) | Q(name__icontains=search) | Q(description__icontains=search))

        if status == "active":
            qs = qs.filter(active=True)
        elif status == "inactive":
            qs = qs.filter(active=False)

        ordering = self.request.query_params.get('ordering')
        if ordering:
            qs = qs.order_by(ordering)

        return qs
    

@api_view(["POST"])
def bulk_delete_all(request):
    Product.objects.all().delete()
    return Response({"success": True, "message": "All products deleted."})

@api_view(["POST"])
def bulk_delete_selected(request):
    ids = request.data.get("ids", [])
    if not isinstance(ids, list):
        return Response({"success": False, "message": "Invalid ids"}, status=400)
    Product.objects.filter(id__in=ids).delete()
    return Response({"success": True, "deleted": len(ids)})




class WebhookViewSet(viewsets.ModelViewSet):
    queryset = Webhook.objects.all().order_by("-created_at")
    serializer_class = WebhookSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(
            message="Webhooks fetched successfully",
            message_type="success",
            status_code=status.HTTP_200_OK,
            data=serializer.data
        )

    # ---------------- TEST WEBHOOK ----------------
    @action(detail=True, methods=["POST"])
    def test(self, request, pk=None):
        webhook = self.get_object()
        if not webhook.active:
            return api_response(
                message="Webhook is disabled",
                message_type="error",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        result = send_webhook_test.delay(webhook.id)
        return api_response(
            message="Webhook test queued",
            message_type="success",
            status_code=status.HTTP_200_OK,
            data={"task_id": result.id}
        )

    # ---------------- OVERRIDE CREATE ----------------
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return api_response(
            message="Webhook created successfully",
            message_type="success",
            status_code=status.HTTP_201_CREATED,
            data=serializer.data
        )

    # ---------------- OVERRIDE UPDATE ----------------
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return api_response(
            message="Webhook updated successfully",
            message_type="success",
            status_code=status.HTTP_200_OK,
            data=serializer.data
        )

    # ---------------- OVERRIDE DESTROY ----------------
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_response(
            message="Webhook deleted successfully",
            message_type="success",
            status_code=status.HTTP_200_OK
        )