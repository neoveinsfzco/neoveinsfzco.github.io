from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import BusinessUnit, BusinessUnitModule, ModuleType


@receiver(post_save, sender=BusinessUnit)
def create_default_modules_for_bu(sender, instance, created, **kwargs):
    if not created:
        return

    default_modules = [ModuleType.DMS, ModuleType.IR, ModuleType.NC]

    for module_type in default_modules:
        BusinessUnitModule.objects.get_or_create(
            business_unit=instance,
            module_type=module_type
        )
