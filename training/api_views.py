from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

from core.permissions import BusinessUnitRolePermission, filter_queryset_by_membership, user_has_role
from .models import (
    TrainingCategory,
    TrainingVendor,
    TrainingContent,
    TrainingCourse,
    TrainingCourseAttachment,
    TrainingModule,
    TrainingSection,
    TrainingSubActivity,
    TrainingAssessment,
    TrainingLearningPath,
    TrainingLearningPathCourse,
    TrainingAssignment,
    TrainingAssignmentItem,
    TrainingEnrollment,
    TrainingEmployeeProfile,
)
from .serializers import (
    TrainingCategorySerializer,
    TrainingVendorSerializer,
    TrainingContentSerializer,
    TrainingCourseSerializer,
    TrainingCourseAttachmentSerializer,
    TrainingModuleSerializer,
    TrainingSectionSerializer,
    TrainingSubActivitySerializer,
    TrainingAssessmentSerializer,
    TrainingLearningPathSerializer,
    TrainingLearningPathCourseSerializer,
    TrainingAssignmentSerializer,
    TrainingAssignmentItemSerializer,
    TrainingEnrollmentSerializer,
    TrainingEmployeeProfileSerializer,
)


TRAINING_ADMIN_ROLES = ('TRAINING_ADMIN', 'TRAINING_OFFICER', 'BU_ADMIN')
LINE_MANAGER_ROLES = ('LINE_MANAGER', 'BU_ADMIN')


class TrainingCategoryViewSet(viewsets.ModelViewSet):
    queryset = TrainingCategory.objects.all()
    serializer_class = TrainingCategorySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class TrainingVendorViewSet(viewsets.ModelViewSet):
    queryset = TrainingVendor.objects.all()
    serializer_class = TrainingVendorSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class TrainingContentViewSet(viewsets.ModelViewSet):
    queryset = TrainingContent.objects.all()
    serializer_class = TrainingContentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'content_type', 'is_active']
    search_fields = ['title']
    ordering_fields = ['title', 'content_type']
    ordering = ['title']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class TrainingCourseAttachmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingCourseAttachment.objects.select_related('course').all()
    serializer_class = TrainingCourseAttachmentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['course', 'visibility']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'course__business_unit_id')

    def get_bu_id_for_request(self, request):
        course_id = request.data.get('course')
        if not course_id:
            return None
        return TrainingCourse.objects.filter(id=course_id).values_list('business_unit_id', flat=True).first()

    def get_bu_id_for_obj(self, obj):
        return obj.course.business_unit_id


class TrainingCourseViewSet(viewsets.ModelViewSet):
    queryset = TrainingCourse.objects.select_related('business_unit', 'vendor', 'category').all()
    serializer_class = TrainingCourseSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'status', 'category', 'vendor', 'delivery_type']
    search_fields = ['title', 'course_number']
    ordering_fields = ['title', 'publish_start_date', 'course_number']
    ordering = ['-publish_start_date']

    def get_queryset(self):
        qs = filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')
        bu_id = self.request.query_params.get('business_unit')
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='catalog')
    def catalog(self, request):
        bu_id = request.query_params.get('business_unit')
        if not bu_id:
            return Response({'detail': 'business_unit is required'}, status=400)
        today = timezone.now().date()
        qs = TrainingCourse.objects.filter(
            business_unit_id=bu_id,
            status='PUBLISHED',
        )
        qs = qs.filter(
            publish_start_date__lte=today
        ).filter(Q(publish_end_date__isnull=True) | Q(publish_end_date__gte=today))
        qs = filter_queryset_by_membership(qs, request.user, 'business_unit_id')
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['get'], url_path='assigned')
    def assigned(self, request):
        bu_id = request.query_params.get('business_unit')
        if not bu_id:
            return Response({'detail': 'business_unit is required'}, status=400)
        enrollments = TrainingEnrollment.objects.filter(
            assignment_item__assignment__business_unit_id=bu_id,
            user=request.user,
        ).select_related('assignment_item__course', 'assignment_item__learning_path')
        course_ids = set()
        for enrollment in enrollments:
            if enrollment.assignment_item.course_id:
                course_ids.add(enrollment.assignment_item.course_id)
            if enrollment.assignment_item.learning_path_id:
                path_courses = TrainingLearningPathCourse.objects.filter(
                    learning_path_id=enrollment.assignment_item.learning_path_id
                ).values_list('course_id', flat=True)
                course_ids.update(path_courses)
        qs = TrainingCourse.objects.filter(id__in=course_ids).distinct()
        qs = filter_queryset_by_membership(qs, request.user, 'business_unit_id')
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class TrainingModuleViewSet(viewsets.ModelViewSet):
    queryset = TrainingModule.objects.select_related('course').all()
    serializer_class = TrainingModuleSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['course', 'module_type', 'training_category']
    search_fields = ['title', 'module_number']
    ordering_fields = ['order_index', 'title']
    ordering = ['order_index']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'course__business_unit_id')

    def get_bu_id_for_request(self, request):
        course_id = request.data.get('course')
        if not course_id:
            return None
        return TrainingCourse.objects.filter(id=course_id).values_list('business_unit_id', flat=True).first()

    def get_bu_id_for_obj(self, obj):
        return obj.course.business_unit_id


class TrainingSectionViewSet(viewsets.ModelViewSet):
    queryset = TrainingSection.objects.select_related('module').all()
    serializer_class = TrainingSectionSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['module', 'section_type']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'module__course__business_unit_id')

    def get_bu_id_for_request(self, request):
        module_id = request.data.get('module')
        if not module_id:
            return None
        return (
            TrainingModule.objects.filter(id=module_id)
            .values_list('course__business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.module.course.business_unit_id


class TrainingSubActivityViewSet(viewsets.ModelViewSet):
    queryset = TrainingSubActivity.objects.select_related('section').all()
    serializer_class = TrainingSubActivitySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['section', 'content_type']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'section__module__course__business_unit_id')

    def get_bu_id_for_request(self, request):
        section_id = request.data.get('section')
        if not section_id:
            return None
        return (
            TrainingSection.objects.filter(id=section_id)
            .values_list('module__course__business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.section.module.course.business_unit_id


class TrainingAssessmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingAssessment.objects.select_related('section').all()
    serializer_class = TrainingAssessmentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['section', 'is_feedback']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'section__module__course__business_unit_id')

    def get_bu_id_for_request(self, request):
        section_id = request.data.get('section')
        if not section_id:
            return None
        return (
            TrainingSection.objects.filter(id=section_id)
            .values_list('module__course__business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.section.module.course.business_unit_id


class TrainingLearningPathViewSet(viewsets.ModelViewSet):
    queryset = TrainingLearningPath.objects.all()
    serializer_class = TrainingLearningPathSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'is_active']
    search_fields = ['title']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')


class TrainingLearningPathCourseViewSet(viewsets.ModelViewSet):
    queryset = TrainingLearningPathCourse.objects.select_related('learning_path', 'course').all()
    serializer_class = TrainingLearningPathCourseSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['learning_path', 'course']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'learning_path__business_unit_id')

    def get_bu_id_for_request(self, request):
        path_id = request.data.get('learning_path')
        if not path_id:
            return None
        return TrainingLearningPath.objects.filter(id=path_id).values_list('business_unit_id', flat=True).first()

    def get_bu_id_for_obj(self, obj):
        return obj.learning_path.business_unit_id


class TrainingAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingAssignment.objects.all()
    serializer_class = TrainingAssignmentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['business_unit', 'assignment_type', 'assigned_by_department']
    search_fields = ['title']
    ordering_fields = ['start_date', 'due_date']
    ordering = ['-start_date']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='generate-enrollments')
    def generate_enrollments(self, request, *args, **kwargs):
        assignment: TrainingAssignment = self.get_object()
        bu_id = assignment.business_unit_id
        user_ids = request.data.get('user_ids', [])
        department_ids = request.data.get('department_ids', [])

        if user_ids and department_ids:
            return Response({'detail': 'Target must be either users or departments, not both.'}, status=400)
        if not user_ids and not department_ids:
            return Response({'detail': 'Target users or departments are required.'}, status=400)

        qs = TrainingEmployeeProfile.objects.filter(business_unit_id=bu_id)
        if user_ids:
            qs = qs.filter(user_id__in=user_ids)
        if department_ids:
            qs = qs.filter(department_id__in=department_ids)

        target_user_ids = list(qs.values_list('user_id', flat=True))
        items = assignment.items.all()
        created = 0
        for item in items:
            for user_id in target_user_ids:
                enrollment, was_created = TrainingEnrollment.objects.get_or_create(
                    assignment_item=item,
                    user_id=user_id,
                )
                if was_created and item.learning_path_id and item.learning_path:
                    due = None
                    if assignment.start_date and item.learning_path.duration_days:
                        due = assignment.start_date + timedelta(days=item.learning_path.duration_days)
                    enrollment.result = {
                        **(enrollment.result or {}),
                        'learning_path_duration_days': item.learning_path.duration_days,
                        'learning_path_due_date': due.isoformat() if due else None,
                    }
                    enrollment.save(update_fields=['result'])
                if was_created:
                    created += 1
        return Response({'created': created, 'targets': len(target_user_ids)})


class TrainingAssignmentItemViewSet(viewsets.ModelViewSet):
    queryset = TrainingAssignmentItem.objects.select_related('assignment', 'course', 'learning_path').all()
    serializer_class = TrainingAssignmentItemSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['assignment', 'course', 'learning_path']

    def get_queryset(self):
        return filter_queryset_by_membership(super().get_queryset(), self.request.user, 'assignment__business_unit_id')

    def get_bu_id_for_request(self, request):
        assignment_id = request.data.get('assignment')
        if not assignment_id:
            return None
        return TrainingAssignment.objects.filter(id=assignment_id).values_list('business_unit_id', flat=True).first()

    def get_bu_id_for_obj(self, obj):
        return obj.assignment.business_unit_id


class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingEnrollment.objects.select_related('assignment_item').all()
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES
    filterset_fields = ['assignment_item', 'status', 'user', 'assignment_item__course', 'assignment_item__learning_path']

    def get_queryset(self):
        qs = filter_queryset_by_membership(super().get_queryset(), self.request.user, 'assignment_item__assignment__business_unit_id')
        if self.request.query_params.get('mine') == '1':
            qs = qs.filter(user=self.request.user)
        return qs

    def get_bu_id_for_request(self, request):
        assignment_item_id = request.data.get('assignment_item')
        if not assignment_item_id:
            return None
        return (
            TrainingAssignmentItem.objects.filter(id=assignment_item_id)
            .values_list('assignment__business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.assignment_item.assignment.business_unit_id

    @action(detail=False, methods=['get'], url_path='manager')
    def manager(self, request):
        bu_id = request.query_params.get('business_unit')
        if not bu_id:
            return Response({'detail': 'business_unit is required'}, status=400)
        managed_users = TrainingEmployeeProfile.objects.filter(
            business_unit_id=bu_id,
            line_manager=request.user,
        ).values_list('user_id', flat=True)
        qs = self.get_queryset().filter(user_id__in=managed_users)
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class TrainingEmployeeProfileViewSet(viewsets.ModelViewSet):
    queryset = TrainingEmployeeProfile.objects.select_related('business_unit', 'user', 'line_manager', 'department').all()
    serializer_class = TrainingEmployeeProfileSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = TRAINING_ADMIN_ROLES + ('LINE_MANAGER',)
    filterset_fields = ['business_unit', 'line_manager', 'department']

    def get_queryset(self):
        qs = filter_queryset_by_membership(super().get_queryset(), self.request.user, 'business_unit_id')
        bu_id = self.request.query_params.get('business_unit')
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        if self.request.query_params.get('mine') == '1':
            qs = qs.filter(line_manager=self.request.user)
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')
