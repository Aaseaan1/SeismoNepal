from django.urls import path

from .views import create_alert, list_alerts, register_device_token

urlpatterns = [
    path('', list_alerts, name='list-alerts'),
    path('send/', create_alert, name='create-alert'),
    path('device-token/', register_device_token, name='register-device-token'),
]
