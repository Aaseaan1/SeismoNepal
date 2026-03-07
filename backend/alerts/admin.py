from django.contrib import admin
from .models import AlertNotification, DeviceToken


@admin.register(AlertNotification)
class AlertNotificationAdmin(admin.ModelAdmin):
	list_display = ('user', 'channel', 'sent', 'created_at')
	list_filter = ('channel', 'sent')


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
	list_display = ('user', 'platform', 'token', 'updated_at')
	search_fields = ('token', 'user__username')
