from rest_framework import serializers
from .models import BusinessUnit, BusinessUnitModule, Department
from core.validators import validate_logo

class BusinessUnitModuleSerializer(serializers.ModelSerializer):

    class Meta:
        model = BusinessUnitModule
        fields = ['id', 'module_type', 'is_enabled', 'settings']


class BusinessUnitSerializer(serializers.ModelSerializer):
    modules = BusinessUnitModuleSerializer(many=True, read_only=True)
    logo = serializers.ImageField(
        required=False,
        allow_null=True,
        validators=[validate_logo],
    )

    class Meta:
        model = BusinessUnit
        fields = ['id', 'name', 'code', 'logo', 'description', 'is_active', 'modules']


class DepartmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Department
        fields = ['id', 'business_unit', 'name', 'code', 'is_active', 'created_at']
