from time import timezone
from django.db import models
from django.utils import timezone
# Create your models here.
class Product(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=255, unique=True,db_index=True)
    description = models.TextField(blank=True, null=True)
    active = models.BooleanField(default=True)
    # created_at = models.DateTimeField(default=timezone.now)
    # updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['sku']),
        ]
        ordering = ['id']

    def save(self, *args, **kwargs):
        # Normalize SKU for uniqueness (case-insensitive)
        self.sku = self.sku.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sku} - {self.name}"
    

class Webhook(models.Model):
    url = models.URLField()
    event = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.event} -> {self.url}"