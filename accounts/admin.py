from django.contrib import admin
from .models import BusinessUnitMembership


@admin.register(BusinessUnitMembership)
class BusinessUnitMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_unit', 'role')
    list_filter = ('role', 'business_unit')
    search_fields = ('user__username', 'business_unit__name')