from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	class Roles(models.TextChoices):
		ADMIN = 'admin', 'Admin'
		CLIENT = 'client', 'Client'

	role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CLIENT)
	phone_number = models.CharField(max_length=20, blank=True)
	vibration_alerts_enabled = models.BooleanField(default=True)


class ClientProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
	full_name = models.CharField(max_length=120, blank=True)
	address = models.CharField(max_length=255, blank=True)
	emergency_contact = models.CharField(max_length=20, blank=True)

	def __str__(self) -> str:
		return f"Profile<{self.user.username}>"
