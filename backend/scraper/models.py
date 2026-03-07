from django.db import models


class EarthquakeEvent(models.Model):
	source = models.CharField(max_length=100, default='EMSC')
	location = models.CharField(max_length=255)
	magnitude = models.FloatField()
	occurred_at = models.CharField(max_length=100)
	scraped_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"M{self.magnitude} - {self.location}"
