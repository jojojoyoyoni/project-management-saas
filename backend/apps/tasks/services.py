from .models import Task, TaskActivity

class TaskService:
    @staticmethod
    def log_task_update(task, old_values, user):
        changes = []
        for field, old_value in old_values.items():
            new_value = getattr(task, field, None)
            if str(old_value) != str(new_value):
                changes.append({
                    "field": field,
                    "old": str(old_value),
                    "new": str(new_value),
                })
        
        if changes:
            TaskActivity.objects.create(
                task=task,
                user=user,
                action="updated",
                description=f"Updated: {', '.join(c['field'] for c in changes)}",
                old_value=old_values,
                new_value={c["field"]: c["new"] for c in changes},
            )
    
    @staticmethod
    def clone_task(task, user):
        cloned = Task.objects.create(
            project=task.project,
            title=f"{task.title} (Copy)",
            description=task.description,
            task_type=task.task_type,
            priority=task.priority,
            status=task.status,
            assignee=task.assignee,
            estimate_hours=task.estimate_hours,
            due_date=task.due_date,
            reporter=user,
        )
        TaskActivity.objects.create(
            task=cloned, user=user, action="created",
            description=f"Cloned from {task.key}",
        )
        return cloned
