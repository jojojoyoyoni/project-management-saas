from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender="projects.Project")
def create_default_statuses(sender, instance, created, **kwargs):
    """Create default statuses when a project is created."""
    if not created:
        return
    
    # Import HERE (lazy) - only runs when signal fires, not at startup
    from .models import TaskStatus, TaskPriority
    
    if instance.task_statuses.exists():
        return
    
    defaults = [
        ("To Do", "to-do", 0, "#6b7280"),
        ("In Progress", "in-progress", 1, "#3b82f6"),
        ("In Review", "in-review", 2, "#f59e0b"),
        ("Done", "done", 3, "#22c55e")
    ]
    
    for name, slug, order, color in defaults:
        TaskStatus.objects.create(
            project=instance, name=name, slug=slug,
            order=order, color=color,
            is_default=(slug == "to-do"),
        )


@receiver(post_save, sender="projects.Project")
def create_default_priorities(sender, instance, created, **kwargs):
    """Create default priorities when a project is created."""
    if not created:
        return
    
    from .models import TaskPriority
    
    if instance.task_priorities.exists():
        return
    
    defaults = [
        ("Low", "low", 0, "#94a3b8"),
        ("Medium", "medium", 1, "#3b82f6"),
        ("High", "high", 2, "#f97316"),
        ("Critical", "critical", 3, "#ef4444")
    ]
    
    for name, slug, order, color in defaults:
        TaskPriority.objects.create(
            project=instance, name=name, slug=slug,
            order=order, color=color,
        )
