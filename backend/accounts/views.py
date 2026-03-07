from django.conf import settings
from django.contrib.auth import logout
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from alerts.models import AlertNotification, DeviceToken
from alerts.services import dispatch_notification

from .models import ClientProfile, User
from .serializers import LoginSerializer, ProfileSerializer, RegisterSerializer


def _jwt_for_user(user: User):
	refresh = RefreshToken.for_user(user)
	return {'refresh': str(refresh), 'access': str(refresh.access_token)}


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_client(request):
	serializer = RegisterSerializer(data=request.data)
	serializer.is_valid(raise_exception=True)
	user = serializer.save()

	if user.username == settings.ADMIN_SPECIAL_USERNAME:
		user.role = User.Roles.ADMIN
		user.is_staff = True
		user.is_superuser = True
		user.save()

	token, _ = Token.objects.get_or_create(user=user)
	jwt = _jwt_for_user(user)
	return Response(
		{
			'token': token.key,
			'access': jwt['access'],
			'refresh': jwt['refresh'],
			'username': user.username,
			'role': user.role,
		},
		status=status.HTTP_201_CREATED,
	)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
	serializer = LoginSerializer(data=request.data)
	serializer.is_valid(raise_exception=True)
	user = serializer.validated_data['user']
	token, _ = Token.objects.get_or_create(user=user)
	jwt = _jwt_for_user(user)
	return Response(
		{
			'token': token.key,
			'access': jwt['access'],
			'refresh': jwt['refresh'],
			'username': user.username,
			'role': user.role,
		}
	)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
	Token.objects.filter(user=request.user).delete()
	logout(request)
	return Response({'detail': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def client_profile(request):
	profile, _ = ClientProfile.objects.get_or_create(user=request.user)

	if request.method == 'GET':
		return Response(ProfileSerializer(profile).data)

	serializer = ProfileSerializer(profile, data=request.data, partial=True)
	serializer.is_valid(raise_exception=True)
	serializer.save()
	return Response(serializer.data)


class IsAdminUser(permissions.BasePermission):
	"""Permission class for admin-only API access."""

	def has_permission(self, request, view):
		return request.user and request.user.is_authenticated and (
			request.user.is_staff or request.user.role == User.Roles.ADMIN
		)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_users(request):
	"""List all users with their basic info."""
	users = User.objects.all().order_by('-date_joined')
	data = []
	for user in users:
		data.append({
			'id': user.id,
			'username': user.username,
			'email': user.email,
			'phone_number': user.phone_number,
			'role': user.role,
			'is_active': user.is_active,
			'date_joined': user.date_joined,
			'has_push_token': DeviceToken.objects.filter(user=user).exists(),
		})
	return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_get_user(request, user_id):
	"""Get detailed info for a specific user."""
	try:
		user = User.objects.get(pk=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

	profile, _ = ClientProfile.objects.get_or_create(user=user)
	return Response({
		'id': user.id,
		'username': user.username,
		'email': user.email,
		'phone_number': user.phone_number,
		'role': user.role,
		'is_active': user.is_active,
		'date_joined': user.date_joined,
		'full_name': profile.full_name,
		'address': profile.address,
		'emergency_contact': profile.emergency_contact,
		'vibration_alerts_enabled': user.vibration_alerts_enabled,
		'has_push_token': DeviceToken.objects.filter(user=user).exists(),
	})


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_update_user(request, user_id):
	"""Update user details (admin only)."""
	try:
		user = User.objects.get(pk=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

	if 'email' in request.data:
		user.email = request.data['email']
	if 'phone_number' in request.data:
		user.phone_number = request.data['phone_number']
	if 'role' in request.data:
		user.role = request.data['role']
		user.is_staff = user.role == User.Roles.ADMIN
	if 'is_active' in request.data:
		user.is_active = request.data['is_active']

	user.save()
	return Response({'success': True, 'message': f'User {user.username} updated'})


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_user(request, user_id):
	"""Delete a user (admin only)."""
	try:
		user = User.objects.get(pk=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

	if user == request.user:
		return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)

	username = user.username
	user.delete()
	return Response({'success': True, 'message': f'User {username} deleted'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_send_test_push(request, user_id):
	"""Send a test push notification to a user (admin only)."""
	try:
		user = User.objects.get(pk=user_id)
	except User.DoesNotExist:
		return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

	has_device = DeviceToken.objects.filter(user=user).exists()
	if not has_device:
		return Response(
			{'error': f'No registered mobile device for {user.username}'},
			status=status.HTTP_400_BAD_REQUEST
		)

	notification = AlertNotification.objects.create(
		user=user,
		channel=AlertNotification.Channels.APP,
		message=f'Admin test push at {timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")}',
	)
	sent = dispatch_notification(notification)

	if sent:
		return Response({'success': True, 'message': f'Test push sent to {user.username}'})
	else:
		return Response(
			{'error': f'Push delivery failed for {user.username}'},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)
