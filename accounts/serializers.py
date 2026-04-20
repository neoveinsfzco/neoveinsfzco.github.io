from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import BusinessUnitMembership


class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class BusinessUnitMembershipSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)

    class Meta:
        model = BusinessUnitMembership
        fields = ['id', 'user', 'business_unit', 'role']
