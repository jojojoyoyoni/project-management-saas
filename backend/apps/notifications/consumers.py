import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            # Extract project_id from the URL (e.g. ws/notifications/5/)
            self.project_id = self.scope.get("url_route", {}).get("kwargs", {}).get("project_id")
            
            if self.project_id:
                self.group_name = f"project_{self.project_id}"
            else:
                self.group_name = f"user_{self.scope['user'].id}"

            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    # Listener for task movements (Kanban board updates)
    async def send_task_update(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'task_update',
            'message': message
        }))


    async def send_notification(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': message
        }))