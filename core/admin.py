from django.contrib import admin

# Register your models here.
from .models import BusinessUnit, BusinessUnitModule


@admin.register(BusinessUnit)
class BusinessUnitAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'created_at')
    search_fields = ('name', 'code')
    list_filter = ('is_active',)


@admin.register(BusinessUnitModule)
class BusinessUnitModuleAdmin(admin.ModelAdmin):
    list_display = ('business_unit', 'module_type', 'is_enabled')
    list_filter = ('module_type', 'is_enabled')