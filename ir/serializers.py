# ir/serializers.py
from rest_framework import serializers
from .models import (
    Incident,
    IncidentType,
    IncidentLocation,
    IncidentSeverity,
    IncidentProbability,
    IncidentRiskRating,
    IncidentRcaTool,
    IncidentEffectivenessRating,
    IncidentTaskTemplate,
    IncidentTask,
    IncidentInvestigation,
)


class IncidentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentType
        fields = ['id', 'business_unit', 'name', 'code', 'is_active']


class IncidentLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentLocation
        fields = ['id', 'business_unit', 'name', 'code', 'is_active']


class IncidentSeveritySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentSeverity
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class IncidentProbabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentProbability
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class IncidentRiskRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentRiskRating
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class IncidentRcaToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentRcaTool
        fields = ['id', 'business_unit', 'name', 'is_active']


class IncidentEffectivenessRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentEffectivenessRating
        fields = ['id', 'business_unit', 'name', 'score', 'description', 'is_active']


class IncidentTaskTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentTaskTemplate
        fields = ['id', 'business_unit', 'name', 'task_type', 'is_active']


class IncidentTaskSerializer(serializers.ModelSerializer):
    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        many=True,
        queryset=Incident._meta.get_field('assigned_to').remote_field.model.objects.all(),
        required=False,
    )
    assigned_by_username = serializers.CharField(
        source='assigned_by.username', read_only=True
    )
    completed_by_username = serializers.CharField(
        source='completed_by.username', read_only=True
    )

    class Meta:
        model = IncidentTask
        fields = '__all__'

    def create(self, validated_data):
        assigned_to = validated_data.pop('assigned_to', [])
        task = super().create(validated_data)
        if assigned_to:
            task.assigned_to.set(assigned_to)
        return task

    def update(self, instance, validated_data):
        assigned_to = validated_data.pop('assigned_to', None)
        task = super().update(instance, validated_data)
        if assigned_to is not None:
            task.assigned_to.set(assigned_to)
        return task


class IncidentInvestigationSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentInvestigation
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    # Optional helper field to show username in responses
    reported_by_username = serializers.CharField(
        source='reported_by.username', read_only=True
    )
    incident_type_name = serializers.CharField(
        source='incident_type.name', read_only=True
    )
    location_option_name = serializers.CharField(
        source='location_option.name', read_only=True
    )
    severity_option_name = serializers.CharField(
        source='severity_option.name', read_only=True
    )
    probability_option_name = serializers.CharField(
        source='probability_option.name', read_only=True
    )
    risk_rating_option_name = serializers.CharField(
        source='risk_rating_option.name', read_only=True
    )
    department_name = serializers.CharField(
        source='department.name', read_only=True
    )
    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        many=True,
        queryset=Incident._meta.get_field('assigned_to').remote_field.model.objects.all(),
        required=False,
    )

    class Meta:
        model = Incident
        fields = '__all__'
        # make sure these cannot be written from the client
        read_only_fields = ['date_reported', 'reported_by', 'reference']

    def validate(self, attrs):
        incident_type = attrs.get('incident_type')
        location_option = attrs.get('location_option')
        severity_option = attrs.get('severity_option')
        probability_option = attrs.get('probability_option')
        risk_rating_option = attrs.get('risk_rating_option')
        business_unit = attrs.get('business_unit')
        department = attrs.get('department')
        if incident_type and business_unit and incident_type.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'incident_type': 'Incident type must belong to the same Business Unit.'}
            )
        if location_option and business_unit and location_option.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'location_option': 'Location must belong to the same Business Unit.'}
            )
        if severity_option and business_unit and severity_option.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'severity_option': 'Severity must belong to the same Business Unit.'}
            )
        if probability_option and business_unit and probability_option.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'probability_option': 'Probability must belong to the same Business Unit.'}
            )
        if risk_rating_option and business_unit and risk_rating_option.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'risk_rating_option': 'Risk rating must belong to the same Business Unit.'}
            )
        if department and business_unit and department.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'department': 'Department must belong to the same Business Unit.'}
            )
        return attrs

    def create(self, validated_data):
        assigned_to = validated_data.pop('assigned_to', [])
        location_option = validated_data.get('location_option')
        severity_option = validated_data.get('severity_option')
        if location_option and not validated_data.get('location'):
            validated_data['location'] = location_option.name
        if severity_option and not validated_data.get('severity'):
            validated_data['severity'] = severity_option.name
        incident = super().create(validated_data)
        if assigned_to:
            incident.assigned_to.set(assigned_to)
        return incident

    def update(self, instance, validated_data):
        assigned_to = validated_data.pop('assigned_to', None)
        location_option = validated_data.get('location_option')
        severity_option = validated_data.get('severity_option')
        if location_option and not validated_data.get('location'):
            validated_data['location'] = location_option.name
        if severity_option and not validated_data.get('severity'):
            validated_data['severity'] = severity_option.name
        incident = super().update(instance, validated_data)
        if assigned_to is not None:
            incident.assigned_to.set(assigned_to)
        return incident
