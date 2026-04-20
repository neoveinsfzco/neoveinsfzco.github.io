# nc/api_views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone

from .models import (
    NonConformance,
    NonConformanceOccurrence,
    NonConformanceSource,
    NonConformanceType,
    NonConformanceSeverity,
    NonConformanceProbability,
    NonConformanceRiskRating,
)
from .serializers import (
    NonConformanceSerializer,
    NonConformanceOccurrenceSerializer,
    NonConformanceSourceSerializer,
    NonConformanceTypeSerializer,
    NonConformanceSeveritySerializer,
    NonConformanceProbabilitySerializer,
    NonConformanceRiskRatingSerializer,
)
from core.permissions import (
    BusinessUnitRolePermission,
    filter_queryset_by_membership,
    user_has_role,
)


class NonConformanceOccurrenceViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceOccurrence.objects.all()
    serializer_class = NonConformanceOccurrenceSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceSourceViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceSource.objects.all()
    serializer_class = NonConformanceSourceSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceTypeViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceType.objects.all()
    serializer_class = NonConformanceTypeSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceSeverityViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceSeverity.objects.all()
    serializer_class = NonConformanceSeveritySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceProbabilityViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceProbability.objects.all()
    serializer_class = NonConformanceProbabilitySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceRiskRatingViewSet(viewsets.ModelViewSet):
    queryset = NonConformanceRiskRating.objects.all()
    serializer_class = NonConformanceRiskRatingSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN',)
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'score']
    ordering = ['score']

    def get_queryset(self):
        qs = super().get_queryset()
        return filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class NonConformanceViewSet(viewsets.ModelViewSet):
    queryset = NonConformance.objects.all().order_by('-id')
    serializer_class = NonConformanceSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    search_fields = ['reference']
    ordering_fields = [
        'reference',
        'date_raised',
        'status',
        'classification',
        'risk_rating_option__score',
        'risk_rating_option__name',
    ]
    ordering = ['-date_raised']
    filterset_fields = [
        'business_unit',
        'occurrence_place',
        'source',
        'nc_type',
        'severity_option',
        'probability_option',
        'risk_rating_option',
        'status',
    ]

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        bu_id = self.request.query_params.get('business_unit')
        year = self.request.query_params.get('year')
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        if year:
            try:
                qs = qs.filter(date_raised__year=int(year))
            except ValueError:
                pass
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(raised_by=user, status='Raised')

    def perform_update(self, serializer):
        instance: NonConformance = serializer.instance
        user = self.request.user
        bu_id = instance.business_unit_id
        next_status = serializer.validated_data.get('status', instance.status)

        is_quality = user_has_role(user, bu_id, ('QUALITY', 'BU_ADMIN'))
        is_admin = user_has_role(user, bu_id, ('BU_ADMIN',))
        is_assigned = instance.assigned_to.filter(id=user.id).exists()

        if next_status in ('Logged', 'Assigned', 'Verified', 'Closed') and not is_quality:
            raise PermissionDenied('Only quality users can log, assign, verify, or close NCs.')
        if next_status in ('Verified', 'Closed') and not is_admin:
            raise PermissionDenied('Only BU admins can verify or close NCs.')
        if next_status in ('RCA', 'CAPA Implemented') and not (is_quality or is_assigned):
            raise PermissionDenied('Only assigned users or quality can progress NCs.')

        updated = serializer.save()

        if next_status == 'Logged' and not updated.logged_by:
            updated.logged_by = user
            updated.logged_at = timezone.now()
        if next_status == 'Assigned' and not updated.assigned_by:
            updated.assigned_by = user
            updated.assigned_at = timezone.now()
        if next_status == 'Verified' and not updated.verified_by:
            updated.verified_by = user
            updated.verified_at = timezone.now()
        if next_status == 'Closed' and not updated.closed_by:
            updated.closed_by = user
            updated.closed_at = timezone.now()
        updated.save()
