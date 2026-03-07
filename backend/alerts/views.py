from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import AlertNotification, DeviceToken
from .services import dispatch_notification


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_alert(request):
	channel = request.data.get('channel', AlertNotification.Channels.APP)
	message = request.data.get('message', '').strip()
	if not message:
		return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

	if channel not in {choice[0] for choice in AlertNotification.Channels.choices}:
		return Response({'detail': 'Invalid channel.'}, status=status.HTTP_400_BAD_REQUEST)

	notification = AlertNotification.objects.create(
		user=request.user,
		channel=channel,
		message=message,
	)
	sent = dispatch_notification(notification)
	return Response({'id': notification.id, 'channel': channel, 'sent': sent}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_alerts(request):
	alerts = AlertNotification.objects.filter(user=request.user).order_by('-created_at')[:50]
	data = [
		{
			'id': alert.id,
			'channel': alert.channel,
			'message': alert.message,
			'sent': alert.sent,
			'created_at': alert.created_at,
		}
		for alert in alerts
	]
	return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def register_device_token(request):
	token = request.data.get('token', '').strip()
	platform = request.data.get('platform', '').strip()

	if not token:
		return Response({'detail': 'Device token is required.'}, status=status.HTTP_400_BAD_REQUEST)

	device, _ = DeviceToken.objects.update_or_create(
		token=token,
		defaults={'user': request.user, 'platform': platform},
	)
	return Response({'id': device.id, 'token': device.token, 'platform': device.platform})
