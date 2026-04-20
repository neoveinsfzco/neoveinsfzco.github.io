from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import BusinessUnitMembership
from .serializers import BusinessUnitMembershipSerializer
from core.permissions import BusinessUnitRolePermission, filter_queryset_by_membership
from ir.models import Incident


class BusinessUnitMembershipViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusinessUnitMembership.objects.select_related('user', 'business_unit').all()
    serializer_class = BusinessUnitMembershipSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    filterset_fields = ['business_unit', 'role']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    ordering_fields = ['user__username', 'role']
    ordering = ['user__username']

    def get_queryset(self):
        qs = super().get_queryset()
        incident_id = self.request.query_params.get('incident')
        if incident_id:
            bu_id = (
                Incident.objects.filter(id=incident_id)
                .values_list('business_unit_id', flat=True)
                .first()
            )
            if bu_id:
                qs = qs.filter(business_unit_id=bu_id)
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        return qs

    def get_bu_id_for_request(self, request):
        return request.query_params.get('business_unit')
