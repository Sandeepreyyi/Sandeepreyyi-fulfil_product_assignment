
# product_importer_core/celery.py
import os
from celery import Celery
from .settings import *

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'product_importer_core.settings')

app = Celery('product_importer_core')

# Redis as broker & backend
app.conf.broker_url = CELERY_BROKER_URL
app.conf.result_backend = CELERY_BROKER_URL
# app.conf.broker_url = "rediss://default:AZmqAAIncDJhZjZiZGM2MDc2ZGQ0YzA2OWQyZDc5MDg2YzQwNTQ3OXAyMzkzMzg@beloved-crappie-39338.upstash.io:6379"
# app.conf.result_backend = "rediss://default:AZmqAAIncDJhZjZiZGM2MDc2ZGQ0YzA2OWQyZDc5MDg2YzQwNTQ3OXAyMzkzMzg@beloved-crappie-39338.upstash.io:6379"

app.autodiscover_tasks()

