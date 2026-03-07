from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.models import ClientProfile, User
from alerts.models import AlertNotification, DeviceToken
from alerts.services import dispatch_notification


def is_admin_portal_user(user):
	return user.is_authenticated and (user.is_staff or user.role == User.Roles.ADMIN)


def portal_logout(request):
	"""Custom logout view that handles GET requests"""
	logout(request)
	return redirect('portal-login')


@login_required
def portal_home(request):
	if is_admin_portal_user(request.user):
		return redirect('admin-dashboard')
	return redirect('client-dashboard')


@login_required
@user_passes_test(is_admin_portal_user)
def admin_dashboard(request):
	users = User.objects.all().order_by('username')
	return render(request, 'portal/admin_dashboard.html', {'users': users})


@login_required
@user_passes_test(is_admin_portal_user)
def admin_update_user(request, user_id):
	if request.method == 'POST':
		user = get_object_or_404(User, pk=user_id)
		user.email = request.POST.get('email', user.email)
		user.phone_number = request.POST.get('phone_number', user.phone_number)
		user.is_active = request.POST.get('is_active') == 'on'
		user.role = request.POST.get('role', user.role)
		user.is_staff = user.role == User.Roles.ADMIN
		user.save()
		messages.success(request, f'Updated user: {user.username}')
	return redirect('admin-dashboard')


@login_required
@user_passes_test(is_admin_portal_user)
def admin_delete_user(request, user_id):
	if request.method == 'POST':
		user = get_object_or_404(User, pk=user_id)
		if user == request.user:
			messages.error(request, 'You cannot delete your own account from portal.')
		else:
			username = user.username
			user.delete()
			messages.success(request, f'Deleted user: {username}')
	return redirect('admin-dashboard')


@login_required
@user_passes_test(is_admin_portal_user)
def admin_send_test_push(request, user_id):
	if request.method == 'POST':
		user = get_object_or_404(User, pk=user_id)
		has_device = DeviceToken.objects.filter(user=user).exists()

		if not has_device:
			messages.error(
				request,
				f'No registered mobile device token for {user.username}. Open the mobile app on a physical device, allow notifications, and log in again. Also set EXPO_PUBLIC_EAS_PROJECT_ID in frontend-mobile/.env.'
			)
			return redirect('admin-dashboard')

		notification = AlertNotification.objects.create(
			user=user,
			channel=AlertNotification.Channels.APP,
			message=f'Admin test push at {timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")}',
		)

		if sent := dispatch_notification(notification):
			messages.success(request, f'Test push sent to {user.username}.')
		else:
			messages.error(request, f'Push delivery failed for {user.username}. Check Expo token and backend config.')

	return redirect('admin-dashboard')


@login_required
def client_dashboard(request):
	profile, _ = ClientProfile.objects.get_or_create(user=request.user)

	if request.method == 'POST':
		profile.full_name = request.POST.get('full_name', profile.full_name)
		profile.address = request.POST.get('address', profile.address)
		profile.emergency_contact = request.POST.get('emergency_contact', profile.emergency_contact)
		profile.save()

		request.user.phone_number = request.POST.get('phone_number', request.user.phone_number)
		request.user.vibration_alerts_enabled = request.POST.get('vibration_alerts_enabled') == 'on'
		request.user.save()
		messages.success(request, 'Profile updated successfully.')
		return redirect('client-dashboard')

	return render(request, 'portal/client_dashboard.html', {'profile': profile})
