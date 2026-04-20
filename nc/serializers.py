# nc/serializers.py
from rest_framework import serializers
from .models import (
    NonConformance,
    NonConformanceOccurrence,
    NonConformanceSource,
    NonConformanceType,
    NonConformanceSeverity,
    NonConformanceProbability,
    NonConformanceRiskRating,
)


class NonConformanceOccurrenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceOccurrence
        fields = ['id', 'business_unit', 'name', 'code', 'is_active']


class NonConformanceSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceSource
        fields = ['id', 'business_unit', 'name', 'code', 'is_active']


class NonConformanceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceType
        fields = ['id', 'business_unit', 'name', 'code', 'is_active']


class NonConformanceSeveritySerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceSeverity
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class NonConformanceProbabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceProbability
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class NonConformanceRiskRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NonConformanceRiskRating
        fields = ['id', 'business_unit', 'name', 'score', 'is_active']


class NonConformanceSerializer(serializers.ModelSerializer):
    raised_by_username = serializers.CharField(
        source='raised_by.username', read_only=True
    )
    occurrence_place_name = serializers.CharField(
        source='occurrence_place.name', read_only=True
    )
    source_name = serializers.CharField(
        source='source.name', read_only=True
    )
    nc_type_name = serializers.CharField(
        source='nc_type.name', read_only=True
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
    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        many=True,
        queryset=NonConformance._meta.get_field('assigned_to').remote_field.model.objects.all(),
        required=False,
    )

    class Meta:
        model = NonConformance
        fields = '__all__'
        read_only_fields = ['raised_by', 'reference']

    def validate(self, attrs):
        business_unit = attrs.get('business_unit')
        occurrence_place = attrs.get('occurrence_place')
        source = attrs.get('source')
        nc_type = attrs.get('nc_type')
        severity_option = attrs.get('severity_option')
        probability_option = attrs.get('probability_option')
        risk_rating_option = attrs.get('risk_rating_option')
        if occurrence_place and business_unit and occurrence_place.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'occurrence_place': 'Occurrence place must belong to the same Business Unit.'}
            )
        if source and business_unit and source.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'source': 'Source must belong to the same Business Unit.'}
            )
        if nc_type and business_unit and nc_type.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'nc_type': 'Type must belong to the same Business Unit.'}
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
        return attrs

    def create(self, validated_data):
        assigned_to = validated_data.pop('assigned_to', [])
        instance = super().create(validated_data)
        if assigned_to:
            instance.assigned_to.set(assigned_to)
        return instance

    def update(self, instance, validated_data):
        assigned_to = validated_data.pop('assigned_to', None)
        instance = super().update(instance, validated_data)
        if assigned_to is not None:
            instance.assigned_to.set(assigned_to)
        return instance
