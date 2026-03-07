from django.contrib import admin
from .models import EarthquakeEvent


@admin.register(EarthquakeEvent)
class EarthquakeEventAdmin(admin.ModelAdmin):
	list_display = ('source', 'location', 'magnitude', 'occurred_at', 'scraped_at')
	search_fields = ('location',)
