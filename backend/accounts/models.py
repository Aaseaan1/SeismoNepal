from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	class Roles(models.TextChoices):
		ADMIN = 'admin', 'Admin'
		CLIENT = 'client', 'Client'

	role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CLIENT)
	phone_number = models.CharField(max_length=20, blank=True)
	vibration_alerts_enabled = models.BooleanField(default=True)


class ClientProfile(models.Model):
	class SexChoices(models.TextChoices):
		MALE = 'male', 'Male'
		FEMALE = 'female', 'Female'

	class BloodGroupChoices(models.TextChoices):
		A_POS = 'A+', 'A+'
		A_NEG = 'A-', 'A-'
		B_POS = 'B+', 'B+'
		B_NEG = 'B-', 'B-'
		AB_POS = 'AB+', 'AB+'
		AB_NEG = 'AB-', 'AB-'
		O_POS = 'O+', 'O+'
		O_NEG = 'O-', 'O-'

	class ProvinceChoices(models.TextChoices):
		KOSHI = 'Koshi', 'Koshi'
		MADESH = 'Madesh', 'Madesh'
		BAGMATI = 'Bagmati', 'Bagmati'
		GANDAKI = 'Gandaki', 'Gandaki'
		LUMBINI = 'Lumbini', 'Lumbini'
		KARNALI = 'Karnali', 'Karnali'
		SUDURPASCHIM = 'Sudurpaschim', 'Sudurpaschim'

	class StateNoChoices(models.TextChoices):
		STATE_1 = '1', '1'
		STATE_2 = '2', '2'
		STATE_3 = '3', '3'
		STATE_4 = '4', '4'
		STATE_5 = '5', '5'
		STATE_6 = '6', '6'
		STATE_7 = '7', '7'

	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
	full_name = models.CharField(max_length=120, blank=True)
	date_of_birth = models.DateField(blank=True, null=True)
	address = models.CharField(max_length=255, blank=True)
	sex = models.CharField(max_length=10, choices=SexChoices.choices, blank=True)
	district = models.CharField(max_length=120, blank=True)
	province = models.CharField(max_length=30, choices=ProvinceChoices.choices, blank=True)
	state_no = models.CharField(max_length=2, choices=StateNoChoices.choices, blank=True)
	blood_group = models.CharField(max_length=5, choices=BloodGroupChoices.choices, blank=True)
	emergency_contact = models.CharField(max_length=20, blank=True)

	def __str__(self) -> str:
		return f"Profile<{self.user.username}>"
