
# # product_importer_core/celery.py
# import os
# from celery import Celery
# from .settings import *

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'product_importer_core.settings')

# app = Celery('product_importer_core')

# # Redis as broker & backend
# app.conf.broker_url = "redis://localhost:6379/0"
# app.conf.result_backend = "redis://localhost:6379/0"
# # app.conf.broker_url = "rediss://default:AZmqAAIncDJhZjZiZGM2MDc2ZGQ0YzA2OWQyZDc5MDg2YzQwNTQ3OXAyMzkzMzg@beloved-crappie-39338.upstash.io:6379"
# # app.conf.result_backend = "rediss://default:AZmqAAIncDJhZjZiZGM2MDc2ZGQ0YzA2OWQyZDc5MDg2YzQwNTQ3OXAyMzkzMzg@beloved-crappie-39338.upstash.io:6379"

# app.autodiscover_tasks()

# product_importer_core/celery.py
import os
from celery import Celery
from celery.backends.redis import RedisBackend
from celery.utils.log import get_logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "product_importer_core.settings")

app = Celery("product_importer_core")

# Your Upstash Redis URL
redis_url = "rediss://default:AZmqAAIncDJhZjZiZGM2MDc2ZGQ0YzA2OWQyZDc5MDg2YzQwNTQ3OXAyMzkzMzg@beloved-crappie-39338.upstash.io:6379"

# Configure Celery
app.conf.broker_url = redis_url
app.conf.result_backend = redis_url

# SSL options for Celery/Redis
app.conf.redis_backend_use_ssl = {
    "ssl_cert_reqs": "CERT_NONE"  # or CERT_REQUIRED if you have certificates
}

app.autodiscover_tasks()
