import re

from django.db import models
from django.utils import timezone
from core.models import BusinessUnit
from django.conf import settings


class NonConformanceType(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformanceSource(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformanceOccurrence(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformanceSeverity(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformanceProbability(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformanceRiskRating(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    score = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return self.name


class NonConformance(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    reference = models.CharField(max_length=50)
    source_incident = models.ForeignKey('ir.Incident', null=True, blank=True, on_delete=models.SET_NULL)
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    date_raised = models.DateTimeField(auto_now_add=True)
    description = models.TextField()
    classification = models.CharField(max_length=50, blank=True)
    occurrence_place = models.ForeignKey(
        NonConformanceOccurrence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )
    source = models.ForeignKey(
        NonConformanceSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )
    nc_type = models.ForeignKey(
        NonConformanceType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )
    severity_option = models.ForeignKey(
        NonConformanceSeverity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )
    probability_option = models.ForeignKey(
        NonConformanceProbability,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )
    risk_rating_option = models.ForeignKey(
        NonConformanceRiskRating,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nonconformances',
    )

    corrective_action = models.TextField(blank=True)
    preventive_action = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        default='Raised',
        choices=(
            ('Raised', 'Raised'),
            ('Logged', 'Logged'),
            ('Assigned', 'Assigned'),
            ('RCA', 'RCA'),
            ('CAPA Implemented', 'CAPA Implemented'),
            ('Verified', 'Verified'),
            ('Closed', 'Closed'),
        ),
    )
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logged_nonconformances',
    )
    logged_at = models.DateTimeField(null=True, blank=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_nonconformances_by',
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='assigned_nonconformances',
        blank=True,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_nonconformances',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_nonconformances',
    )
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.reference

    class Meta:
        unique_together = ('business_unit', 'reference')

    @staticmethod
    def _next_reference(business_unit: BusinessUnit, year: int) -> str:
        prefix = f"NC-{business_unit.code}-{year}-"
        max_num = 0
        refs = (
            NonConformance.objects.filter(business_unit=business_unit)
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
