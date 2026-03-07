from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import ClientProfile, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'phone_number')

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=User.Roles.CLIENT,
        )


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid username or password.')
        attrs['user'] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    phone_number = serializers.CharField(source='user.phone_number', required=False)
    vibration_alerts_enabled = serializers.BooleanField(source='user.vibration_alerts_enabled', required=False)
    role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = ClientProfile
        fields = (
            'username',
            'full_name',
            'address',
            'emergency_contact',
            'email',
            'phone_number',
            'vibration_alerts_enabled',
            'role',
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        user = instance.user
        for key, value in user_data.items():
            setattr(user, key, value)
        user.save()
        return instance
