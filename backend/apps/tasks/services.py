from .models import Task, TaskActivity


class TaskService:
    """Business logic for tasks - keeps views thin."""
    
    @staticmethod
    def log_status_change(task, old_status, user):
        """Log when task status changes."""
        TaskActivity.objects.create(
            task=task,
            user=user,
            action=TaskActivity.Action.STATUS_CHANGED,
            old_value={"status": str(old_status) if old_status else None},
            new_value={"status": str(task.status) if task.status else None},
            description=f"Changed status from {old_status} to {task.status}",
        )
    
    @staticmethod
    def log_assignment(task, old_assignee, user):
        """Log when task is assigned."""
        TaskActivity.objects.create(
            task=task,
            user=user,
            action=TaskActivity.Action.ASSIGNED,
            old_value={"assignee": old_assignee},
            new_value={"assignee": str(task.assignee) if task.assignee else None},
            description=f"Assigned to {task.assignee}",
        )
    
    @staticmethod
    def log_update(task, old_values, user):
        """Log generic task updates."""
        changes = []
        for field, old_value in old_values.items():
            new_value = getattr(task, field, None)
            if str(old_value) != str(new_value):
                changes.append({"field": field, "old": str(old_value), "new": str(new_value)})
        
        if changes:
            TaskActivity.objects.create(
                task=task,
                user=user,
                action=TaskActivity.Action.UPDATED,
                old_value=old_values,
                new_value={c["field"]: c["new"] for c in changes},
                description=f"Updated: {', '.join(c['field'] for c in changes)}",
            )
    
    @staticmethod
    def clone_task(task, user):
        """Clone a task."""
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
            task=cloned, user=user, action=TaskActivity.Action.CREATED,
            description=f"Cloned from {task.key}",
        )
        return cloned
