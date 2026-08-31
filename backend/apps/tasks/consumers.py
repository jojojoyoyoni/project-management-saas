import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return
        
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.room_group_name = f"project_{self.project_id}"
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        
        if message_type == "task_update":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "task_updated",
                    "task_id": data["task_id"],
                    "updates": data["updates"],
                    "user": self.user.get_full_name(),
                    "user_id": self.user.id,
                },
            )
        elif message_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_typing",
                    "task_id": data["task_id"],
                    "user": self.user.get_full_name(),
                    "user_id": self.user.id,
                },
            )
    
    async def task_updated(self, event):
        await self.send(text_data=json.dumps({
            "type": "task_update",
            "task_id": event["task_id"],
            "updates": event["updates"],
            "user": event["user"],
            "user_id": event["user_id"],
        }))
    
    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "task_id": event["task_id"],
            "user": event["user"],
            "user_id": event["user_id"],
        }))
