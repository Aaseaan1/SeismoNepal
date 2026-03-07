from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import EarthquakeEvent
from .services import scrape_earthquakes


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def scrape_now(request):
	try:
		created = scrape_earthquakes(limit=int(request.data.get('limit', 20)))
	except Exception as exc:
		return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
	return Response({'created': created})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def latest_events(request):
	events = EarthquakeEvent.objects.order_by('-scraped_at')[:50]
	payload = [
		{
			'id': event.id,
			'source': event.source,
			'location': event.location,
			'magnitude': event.magnitude,
			'occurred_at': event.occurred_at,
			'scraped_at': event.scraped_at,
		}
		for event in events
	]
	return Response(payload)
