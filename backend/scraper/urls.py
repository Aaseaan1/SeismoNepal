from django.urls import path

from .views import latest_events, scrape_now

urlpatterns = [
    path('events/', latest_events, name='latest-events'),
    path('run/', scrape_now, name='scrape-now'),
]
