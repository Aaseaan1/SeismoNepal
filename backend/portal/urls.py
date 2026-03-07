from django.contrib.auth import views as auth_views
from django.urls import path

from .views import admin_dashboard, admin_delete_user, admin_send_test_push, admin_update_user, client_dashboard, portal_home, portal_logout

urlpatterns = [
    path('', portal_home, name='portal-home'),
    path('login/', auth_views.LoginView.as_view(template_name='portal/login.html'), name='portal-login'),
    path('logout/', portal_logout, name='portal-logout'),
    path('admin/', admin_dashboard, name='admin-dashboard'),
    path('admin/user/<int:user_id>/update/', admin_update_user, name='admin-update-user'),
    path('admin/user/<int:user_id>/delete/', admin_delete_user, name='admin-delete-user'),
    path('admin/user/<int:user_id>/test-push/', admin_send_test_push, name='admin-send-test-push'),
    path('client/', client_dashboard, name='client-dashboard'),
]
