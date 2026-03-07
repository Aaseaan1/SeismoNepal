from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ClientProfile, User


@receiver(post_save, sender=User)
def create_client_profile(sender, instance: User, created: bool, **kwargs):
    if created and instance.role == User.Roles.CLIENT:
        ClientProfile.objects.get_or_create(user=instance)
