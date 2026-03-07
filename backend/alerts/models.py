from django.db import models
from django.conf import settings


class AlertNotification(models.Model):
	class Channels(models.TextChoices):
		SMS = 'sms', 'SMS'
		EMAIL = 'email', 'Email'
		APP = 'app', 'App'

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
	channel = models.CharField(max_length=20, choices=Channels.choices)
	message = models.TextField()
	sent = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.channel}:{self.user.username}:{self.created_at.isoformat()}"


class DeviceToken(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='device_tokens')
	token = models.CharField(max_length=255, unique=True)
	platform = models.CharField(max_length=30, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return f"{self.user.username}:{self.platform}"
