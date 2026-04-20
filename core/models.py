from django.db import models
from django.conf import settings

from core.validators import validate_logo



class BusinessUnit(models.Model):
    name = models.CharField(max_length=255, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    logo = models.ImageField(
        upload_to='logos/',
        validators=[validate_logo],
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_business_units'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ModuleType(models.TextChoices):
    DMS = 'DMS', 'Document Management'
    IR  = 'IR', 'Incident Reporting'
    NC  = 'NC', 'Non Conformance'
    TRN = 'TRN', 'Training & Learning'


class BusinessUnitModule(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit,
        on_delete=models.CASCADE,
        related_name='modules',
    )
    module_type = models.CharField(max_length=10, choices=ModuleType.choices)
    is_enabled = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('business_unit', 'module_type')

    def __str__(self):
        return f'{self.business_unit} - {self.get_module_type_display()}'


class Department(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit,
        on_delete=models.CASCADE,
        related_name='departments',
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_departments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return f'{self.business_unit.code} - {self.name}'
