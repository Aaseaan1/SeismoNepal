from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ClientProfile, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
	fieldsets = UserAdmin.fieldsets + (
		('Portal Access', {'fields': ('role', 'phone_number', 'vibration_alerts_enabled')}),
	)
	list_display = ('username', 'email', 'role', 'is_active', 'is_staff')
	list_filter = ('role', 'is_active', 'is_staff')


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
	list_display = ('user', 'full_name', 'emergency_contact')
