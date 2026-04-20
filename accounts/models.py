from django.db import models
from django.conf import settings
from core.models import BusinessUnit


class BusinessUnitMembership(models.Model):
    ROLE_CHOICES = (
        ('BU_ADMIN', 'Business Unit Admin'),
        ('QUALITY_MANAGER', 'Quality Manager'),
        ('QUALITY_LEAD', 'Quality Lead'),
        ('QUALITY', 'Quality Officer'),
        ('TRAINING_ADMIN', 'Training Admin'),
        ('TRAINING_OFFICER', 'Training Officer'),
        ('LINE_MANAGER', 'Line Manager'),
        ('EMPLOYEE', 'Employee'),
        ('STAFF', 'Staff'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')

    class Meta:
        unique_together = ('user', 'business_unit')

    def __str__(self):
        return f'{self.user} - {self.business_unit} ({self.role})'
