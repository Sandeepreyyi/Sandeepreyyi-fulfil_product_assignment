# import os
# from celery import Celery

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'product_importer_core.settings')

# app = Celery('product_importer_core')
# app.config_from_object('django.conf:settings', namespace='CELERY')
# app.autodiscover_tasks()

# celery.py
# product_importer_core/celery.py
import os
from celery import Celery
from .settings import REDIS_URL

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'product_importer_core.settings')

app = Celery('product_importer_core')

# Redis as broker & backend
# app.conf.broker_url = 'redis://localhost:6379/0'
# app.conf.result_backend = 'redis://localhost:6379/0'
app.conf.broker_url = REDIS_URL
app.conf.result_backend = REDIS_URL

app.autodiscover_tasks()

