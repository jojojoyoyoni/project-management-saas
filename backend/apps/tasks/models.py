from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class TaskStatus(models.Model):
    """
    Custom statuses per project.
    
    Why not a simple choices field?
    - Different projects want different columns
    - "To Do / In Progress / Done" for software
    "Backlog / Design / Dev / Review / Done" for bigger teams
    """
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="task_statuses",
    )
    name = models.CharField(max_length=100)  # "To Do", "In Progress"
    slug = models.SlugField(max_length=100)  # "to-do", "in-progress"
    order = models.PositiveIntegerField(default=0)  # Column order on Kanban
    color = models.CharField(max_length=7, default="#6366f1")  # Hex color
    is_default = models.BooleanField(default=False)  # Default status for new tasks
    
    class Meta:
        db_table = "task_statuses"
        unique_together = ["project", "slug"]
        ordering = ["order"]
    
    def __str__(self):
        return self.name


class TaskPriority(models.Model):
    """Custom priorities per project."""
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="task_priorities",
    )
    name = models.CharField(max_length=50)  # "Low", "High", "Urgent"
    slug = models.SlugField(max_length=50)
    order = models.PositiveIntegerField(default=0)
    color = models.CharField(max_length=7, default="#6366f1")
    
    class Meta:
        db_table = "task_priorities"
        unique_together = ["project", "slug"]
        ordering = ["order"]
    
    def __str__(self):
        return self.name


class Task(models.Model):
    """
    The core task model.
    
    Task numbers are AUTO-INCREMENT per project:
    Project WEB → WEB-1, WEB-2, WEB-3, ...
    Project MOB → MOB-1, MOB-2, MOB-3, ...
    """
    
    class TaskType(models.TextChoices):
        TASK = "task", _("Task")
        BUG = "bug", _("Bug")
        STORY = "story", _("Story")
        EPIC = "epic", _("Epic")
    
    # ─── Relationships ─────────────────────────────
    
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
    )
    status = models.ForeignKey(
        TaskStatus,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tasks",
    )
    priority = models.ForeignKey(
        TaskPriority,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tasks",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_tasks",
    )
    
    # ─── Task Info ────────────────────────────────
    
    task_number = models.PositiveIntegerField(editable=False)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    task_type = models.CharField(
        max_length=50,
        choices=TaskType.choices,
        default=TaskType.TASK,
    )
    
    # ─── Time Tracking ───────────────────────────
    
    estimate_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    time_spent_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # ─── Tracking ──────────────────────────────────
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ─── Watchers ────────────────────────────────
    
    watchers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="watching_tasks",
        blank=True,
    )
    
    class Meta:
        db_table = "tasks"
        verbose_name = _("Task")
        verbose_name_plural = _("Tasks")
        unique_together = ["project", "task_number"]
        ordering = ["task_number"]
    
    def __str__(self):
        return f"{self.project.key}-{self.task_number}: {self.title}"
    
    @property
    def key(self):
        """Generate the display key like WEB-1"""
        return f"{self.project.key}-{self.task_number}"
    
    def save(self, *args, **kwargs):
        """Auto-increment task_number per project."""
        if not self.task_number:
            last = Task.objects.filter(project=self.project).order_by("-task_number").first()
            self.task_number = (last.task_number + 1) if last else 1
        super().save(*args, **kwargs)
    
    def comments_count(self):
        try:
            return self.comments.count()
        except Exception:
            return 0


class TaskComment(models.Model):
    """Comments on tasks."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    content = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text="Only visible to team members, not clients",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = "task_comments"
        ordering = ["created_at"]
    
    def __str__(self):
        return f"Comment by {self.author} on {self.task.key}"


class TaskActivity(models.Model):
    """
    Activity log for tasks.
    
    Every change creates a record:
    "John changed status from 'To Do' to 'In Progress'"
    "Jane assigned task to Bob"
    """
    
    class Action(models.TextChoices):
        CREATED = "created", _("Created")
        UPDATED = "updated", _("Updated")
        STATUS_CHANGED = "status_changed", _("Status Changed")
        ASSIGNED = "assigned", _("Assigned")
        COMMENTED = "commented", _("Commented")
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    action = models.CharField(max_length=50, choices=Action.choices)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    description = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "task_activities"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.action} on {self.task.key}"


class TaskAttachment(models.Model):
    """File attachments for tasks."""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="task_attachments/")
    filename = models.CharField(max_length=255)
    file_size = models.PositiveBigIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "task_attachments"
    
    def __str__(self):
        return self.filename
