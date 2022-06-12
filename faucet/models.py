from django.db import models

class Transactions(models.Model):
    ip = models.GenericIPAddressField()
    date = models.DateTimeField(auto_now_add=True)
    network = models.CharField(max_length=128)
    network_id = models.PositiveIntegerField()
    address = models.CharField(max_length=42)

    def __str__(self):
        return f'{self.address[:5]}...{self.address[-3:]}, {self.date}, {self.network}, {self.ip}'