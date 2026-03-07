#!/usr/bin/env python
"""Script to create a superuser for SeismoNep"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

username = 'admin'
email = 'admin@seismonep.com'
password = 'admin123'  # Change this to a secure password

if User.objects.filter(username=username).exists():
    print(f'User "{username}" already exists.')
    user = User.objects.get(username=username)
    user.set_password(password)
    user.is_superuser = True
    user.is_staff = True
    user.role = User.Roles.ADMIN
    user.save()
    print(f'Updated user "{username}" with new password and admin role.')
else:
    user = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
    )
    user.role = User.Roles.ADMIN
    user.save()
    print(f'Superuser "{username}" created successfully!')

print('\n✅ Login Credentials:')
print(f'   Username: {username}')
print(f'   Password: {password}')
print(f'   Role: {user.role}')
print('\n📍 Portal URL: http://127.0.0.1:8000/portal/login/')
print('\n📍 Admin URL: http://127.0.0.1:8000/admin/')
print('\n🔑 For Postman API testing:')
print('   POST http://127.0.0.1:8000/api/accounts/login/')
print(f'   Body: {{"username": "{username}", "password": "{password}"}}')
print('   This will return access and refresh JWT tokens.')
