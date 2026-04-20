from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BusinessUnit, Department
from .serializers import BusinessUnitSerializer, DepartmentSerializer
from .permissions import (
    BusinessUnitRolePermission,
    filter_queryset_by_membership,
)


class BusinessUnitViewSet(viewsets.ModelViewSet):
    queryset = BusinessUnit.objects.all()
    serializer_class = BusinessUnitSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    admin_only_write = True

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'id')

    def get_bu_id_for_obj(self, obj):
        return obj.id


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('business_unit').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

