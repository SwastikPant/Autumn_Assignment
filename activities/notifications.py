from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification


def notify_user(recipient, actor, verb, image=None, comment=None):
    # Create notification record
    notif = Notification.objects.create(
        user=recipient,
        actor=actor,
        verb=verb,
        image=image,
        comment=comment,
    )

    # Broadcast over channels to recipient group
    channel_layer = get_channel_layer()
    payload = {
        'id': notif.id,
        'actor': str(actor) if actor else None,
        'verb': verb,
        'image_id': image.id if image else None,
        'comment_id': comment.id if comment else None,
        'unread': notif.unread,
        'created_at': notif.created_at.isoformat(),
    }
    async_to_sync(channel_layer.group_send)(
        f'user_{recipient.id}',
        {
            'type': 'notify',
            'notification': payload,
        }
    )

    return notif
