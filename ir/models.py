import re

from django.db import models
from django.utils import timezone
from core.models import BusinessUnit, Department
from django.conf import settings


class IncidentType(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentLocation(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentSeverity(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentProbability(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentRiskRating(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class Incident(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    reference = models.CharField(max_length=50)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reported_incidents'
    )
    reported_by_designation = models.CharField(max_length=255, blank=True)
    date_reported = models.DateTimeField(auto_now_add=True)

    incident_type = models.ForeignKey(
        IncidentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )
    location_option = models.ForeignKey(
        IncidentLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )
    incident_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    witness_name = models.CharField(max_length=255, blank=True)
    description = models.TextField()

    severity = models.CharField(
        max_length=20,
        choices=(
            ('Minor', 'Minor'),
            ('Moderate', 'Moderate'),
            ('Major', 'Major'),
            ('Critical', 'Critical'),
        )
        ,
        blank=True,
    )
    severity_option = models.ForeignKey(
        IncidentSeverity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )
    probability_option = models.ForeignKey(
        IncidentProbability,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )
    risk_rating_option = models.ForeignKey(
        IncidentRiskRating,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incidents',
    )

    status = models.CharField(
        max_length=20,
        default='Submitted',
        choices=(
            ('Submitted', 'Submitted'),
            ('Acknowledged', 'Acknowledged'),
            ('Assigned', 'Assigned'),
            ('Investigation', 'Investigation'),
            ('Reviewed', 'Reviewed'),
            ('Approved', 'Approved'),
            ('Closed', 'Closed'),
        ),
    )
    root_cause = models.TextField(blank=True)
    immediate_actions = models.TextField(blank=True)
    immediate_actions_data = models.JSONField(default=list, blank=True)
    corrective_actions = models.TextField(blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_incidents',
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by_designation = models.CharField(max_length=255, blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_incidents_by',
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    assigned_by_designation = models.CharField(max_length=255, blank=True)
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_incidents',
        blank=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_incidents',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by_designation = models.CharField(max_length=255, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_incidents',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by_designation = models.CharField(max_length=255, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_incidents',
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by_designation = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.reference

    class Meta:
        unique_together = ('business_unit', 'reference')

    @staticmethod
    def _next_reference(business_unit: BusinessUnit, year: int) -> str:
        prefix = f"IR-{business_unit.code}-{year}-"
        max_num = 0
        refs = (
            Incident.objects.filter(business_unit=business_unit)
            .values_list('reference', flat=True)
        )
        for ref in refs:
            match = re.match(rf"^{re.escape(prefix)}(\d+)$", ref or "")
            if match:
                max_num = max(max_num, int(match.group(1)))
        return f"{prefix}{max_num + 1:04d}"

    def save(self, *args, **kwargs):
        if not self.reference:
            year = timezone.now().year
            self.reference = self._next_reference(self.business_unit, year)
        super().save(*args, **kwargs)


class IncidentRcaTool(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentEffectivenessRating(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    score = models.PositiveSmallIntegerField(default=1)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentTaskTemplate(models.Model):
    TASK_TYPES = (
        ('GENERAL', 'General'),
        ('RCA', 'Root Cause Analysis'),
        ('RISK_ASSESSMENT', 'Risk Assessment'),
        ('ACTION_PLAN', 'Action Plan'),
    )
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    task_type = models.CharField(max_length=30, choices=TASK_TYPES, default='GENERAL')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class IncidentTask(models.Model):
    STATUS_CHOICES = (
        ('Assigned', 'Assigned'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    template = models.ForeignKey(
        IncidentTaskTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    description = models.TextField(blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_incident_tasks',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='incident_tasks',
        blank=True,
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Assigned')
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_incident_tasks',
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    response_text = models.TextField(blank=True)
    response_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.incident.reference} - {self.template or 'Task'}"


class IncidentInvestigation(models.Model):
    incident = models.OneToOneField(
        Incident,
        on_delete=models.CASCADE,
        related_name='investigation',
    )
    problem_definition = models.TextField(blank=True)
    team_composition = models.TextField(blank=True)
    current_process_map = models.TextField(blank=True)
    rca_tool = models.ForeignKey(
        IncidentRcaTool,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='investigations',
    )
    rca_tool_details = models.TextField(blank=True)
    root_cause = models.TextField(blank=True)
    action_plan_items = models.JSONField(default=list, blank=True)
    risk_assessment_items = models.JSONField(default=list, blank=True)
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prepared_incident_investigations',
    )
    prepared_at = models.DateTimeField(null=True, blank=True)
    prepared_by_designation = models.CharField(max_length=255, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_incident_investigations',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by_designation = models.CharField(max_length=255, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_incident_investigations',
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by_designation = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Investigation - {self.incident.reference}"
