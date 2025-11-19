import pandas as pd
from celery import shared_task
from django.db import connection
from pytz import timezone
from .models import Webhook
import time
import requests
@shared_task(bind=True)
def process_csv(self, file_path):
    try:
        chunk_size = 20000
        total_rows = sum(1 for _ in open(file_path)) - 1
        processed = 0

        for chunk in pd.read_csv(file_path, chunksize=chunk_size):
            chunk["sku"] = chunk["sku"].fillna("").str.strip()
            chunk["name"] = chunk["name"].fillna("")
            chunk["description"] = chunk["description"].fillna("")

            now = timezone.now()

            data = [
                (row.sku, row.name, row.description)
                for row in chunk.itertuples(index=False)
                if row.sku
            ]

            with connection.cursor() as cursor:
                cursor.executemany(
                    """
                    INSERT INTO product_importer_app_product 
                    (sku, name, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (sku)
                    DO UPDATE SET 
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        
                    """,
                    data
                )

            processed += len(chunk)

            self.update_state(
                state="PROGRESS",
                meta={"processed": processed, "total": total_rows}
            )

        return {"status": "completed", "processed": processed, "total_rows": total_rows}

    except Exception as e:
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise e



@shared_task(bind=True)
def send_webhook_test(self, webhook_id):
    webhook = Webhook.objects.get(id=webhook_id)
    if not webhook.active:
        return {"success": False, "message": "Webhook is disabled"}

    try:
        start = time.time()
        response = requests.post(webhook.url, json={"test": True}, timeout=5)
        elapsed = int((time.time() - start) * 1000)
        return {
            "success": True,
            "status_code": response.status_code,
            "response_time_ms": elapsed,
            "response_text": response.text[:200]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}