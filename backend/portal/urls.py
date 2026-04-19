from django.contrib.auth import views as auth_views
from django.urls import path
from django.views.generic.base import RedirectView

from .views import admin_delete_user, admin_send_test_push, admin_send_test_push_all, admin_update_user, client_dashboard, portal_home, portal_logout, safety_measures

urlpatterns = [
    path('', portal_home, name='portal-home'),
    path('login/', auth_views.LoginView.as_view(template_name='portal/login.html', next_page='/admin/'), name='portal-login'),
    path('logout/', portal_logout, name='portal-logout'),
    path('safety-measures/', safety_measures, name='safety-measures'),
    path('admin/', RedirectView.as_view(url='/admin/', permanent=False), name='admin-dashboard'),
    path('admin/user/<int:user_id>/update/', admin_update_user, name='admin-update-user'),
    path('admin/user/<int:user_id>/delete/', admin_delete_user, name='admin-delete-user'),
    path('admin/user/<int:user_id>/test-push/', admin_send_test_push, name='admin-send-test-push'),
    path('admin/test-push-all/', admin_send_test_push_all, name='admin-send-test-push-all'),
    path('client/', client_dashboard, name='client-dashboard'),
]
