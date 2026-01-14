import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if user is None or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.group_name = f'user_{user.id}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    # Receive notifications sent to the group
    async def notify(self, event):
        # event should contain a 'notification' dict
        notification = event.get('notification')
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': notification,
        }))
