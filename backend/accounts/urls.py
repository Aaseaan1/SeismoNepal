from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    admin_delete_user,
    admin_get_user,
    admin_list_users,
    admin_send_test_push,
    admin_update_user,
    client_profile,
    login_user,
    logout_user,
    register_client,
)

urlpatterns = [
    path('register/', register_client, name='register-client'),
    path('login/', login_user, name='login-user'),
    path('logout/', logout_user, name='logout-user'),
    path('profile/', client_profile, name='client-profile'),
    path('jwt/token/', TokenObtainPairView.as_view(), name='jwt-token-obtain'),
    path('jwt/refresh/', TokenRefreshView.as_view(), name='jwt-token-refresh'),
    # Admin endpoints
    path('admin/users/', admin_list_users, name='admin-list-users'),
    path('admin/users/<int:user_id>/', admin_get_user, name='admin-get-user'),
    path('admin/users/<int:user_id>/update/', admin_update_user, name='admin-update-user'),
    path('admin/users/<int:user_id>/delete/', admin_delete_user, name='admin-delete-user'),
    path('admin/users/<int:user_id>/test-push/', admin_send_test_push, name='admin-test-push'),
]
