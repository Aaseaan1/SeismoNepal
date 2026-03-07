from django.conf import settings
from django.core.mail import send_mail
import requests
from twilio.rest import Client

from .models import AlertNotification, DeviceToken


def send_email_alert(notification: AlertNotification):
    if not notification.user.email:
        return False
    send_mail(
        subject='SeismoNep Alert',
        message=notification.message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[notification.user.email],
        fail_silently=False,
    )
    return True


def send_sms_alert(notification: AlertNotification):
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_FROM_NUMBER:
        return False
    if not notification.user.phone_number:
        return False

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=notification.message,
        from_=settings.TWILIO_FROM_NUMBER,
        to=notification.user.phone_number,
    )
    return True


def send_app_push_alert(notification: AlertNotification):
    tokens = list(DeviceToken.objects.filter(user=notification.user).values_list('token', flat=True))
    if not tokens:
        return False

    sent_any = False
    for token in tokens:
        payload = {
            'to': token,
            'title': 'SeismoNep Alert',
            'body': notification.message,
            'sound': 'default',
            'priority': 'high',
            'channelId': 'default',
        }
        response = requests.post(
            settings.EXPO_PUSH_API_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=15,
        )

        if not response.ok:
            continue

        try:
            body = response.json()
        except ValueError:
            continue

        # Expo often returns HTTP 200 even when a ticket contains an error.
        # Only count this token as sent when at least one ticket status is "ok".
        tickets = body.get('data', []) if isinstance(body, dict) else []
        if isinstance(tickets, dict):
            tickets = [tickets]
        if any(isinstance(ticket, dict) and ticket.get('status') == 'ok' for ticket in tickets):
            sent_any = True
    return sent_any


def dispatch_notification(notification: AlertNotification):
    sent = False
    if notification.channel == AlertNotification.Channels.EMAIL:
        sent = send_email_alert(notification)
    elif notification.channel == AlertNotification.Channels.SMS:
        sent = send_sms_alert(notification)
    elif notification.channel == AlertNotification.Channels.APP:
        sent = send_app_push_alert(notification)

    notification.sent = sent
    notification.save(update_fields=['sent'])
    return sent
