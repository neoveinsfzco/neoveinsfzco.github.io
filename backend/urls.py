from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core.api_views import BusinessUnitViewSet, DepartmentViewSet
from accounts.api_views import BusinessUnitMembershipViewSet
from dms.api_views import DocumentViewSet, DocumentCategoryViewSet, DocumentVersionViewSet, DocumentTypeViewSet
from dms.api_views_new import CreateDocumentWithVersion

from ir.api_views import (
    IncidentViewSet,
    IncidentTypeViewSet,
    IncidentLocationViewSet,
    IncidentSeverityViewSet,
    IncidentProbabilityViewSet,
    IncidentRiskRatingViewSet,
    IncidentRcaToolViewSet,
    IncidentEffectivenessRatingViewSet,
    IncidentTaskTemplateViewSet,
    IncidentTaskViewSet,
    IncidentInvestigationViewSet,
)
from nc.api_views import NonConformanceViewSet
from nc.api_views import (
    NonConformanceOccurrenceViewSet,
    NonConformanceSourceViewSet,
    NonConformanceTypeViewSet,
    NonConformanceSeverityViewSet,
    NonConformanceProbabilityViewSet,
    NonConformanceRiskRatingViewSet,
)
from training.api_views import (
    TrainingCategoryViewSet,
    TrainingVendorViewSet,
    TrainingContentViewSet,
    TrainingCourseViewSet,
    TrainingCourseAttachmentViewSet,
    TrainingModuleViewSet,
    TrainingSectionViewSet,
    TrainingSubActivityViewSet,
    TrainingAssessmentViewSet,
    TrainingLearningPathViewSet,
    TrainingLearningPathCourseViewSet,
    TrainingAssignmentViewSet,
    TrainingAssignmentItemViewSet,
    TrainingEnrollmentViewSet,
    TrainingEmployeeProfileViewSet,
)

router = DefaultRouter()
router.register('business-units', BusinessUnitViewSet, basename='businessunit')
router.register('departments', DepartmentViewSet, basename='department')
router.register('bu-memberships', BusinessUnitMembershipViewSet, basename='bumembership')
router.register('dms/categories', DocumentCategoryViewSet, basename='documentcategory')
router.register('dms/types', DocumentTypeViewSet, basename='documenttype')
router.register('dms/documents', DocumentViewSet, basename='document')
router.register('dms/versions', DocumentVersionViewSet, basename='documentversion')

router.register('ir/incidents', IncidentViewSet, basename='incident')  # NEW
router.register('ir/incident-types', IncidentTypeViewSet, basename='incidenttype')
router.register('ir/incident-locations', IncidentLocationViewSet, basename='incidentlocation')
router.register('ir/incident-severities', IncidentSeverityViewSet, basename='incidentseverity')
router.register('ir/incident-probabilities', IncidentProbabilityViewSet, basename='incidentprobability')
router.register('ir/incident-risk-ratings', IncidentRiskRatingViewSet, basename='incidentriskrating')
router.register('ir/rca-tools', IncidentRcaToolViewSet, basename='incidentrcatool')
router.register('ir/effectiveness-ratings', IncidentEffectivenessRatingViewSet, basename='incidenteffectivenessrating')
router.register('ir/task-templates', IncidentTaskTemplateViewSet, basename='incidenttasktemplate')
router.register('ir/tasks', IncidentTaskViewSet, basename='incidenttask')
router.register('ir/investigations', IncidentInvestigationViewSet, basename='incidentinvestigation')
router.register('nc/nonconformances', NonConformanceViewSet, basename='nonconformance')  # NEW
router.register('nc/occurrences', NonConformanceOccurrenceViewSet, basename='ncoccurrence')
router.register('nc/sources', NonConformanceSourceViewSet, basename='ncsource')
router.register('nc/types', NonConformanceTypeViewSet, basename='nctype')
router.register('nc/severities', NonConformanceSeverityViewSet, basename='ncseverity')
router.register('nc/probabilities', NonConformanceProbabilityViewSet, basename='ncprobability')
router.register('nc/risk-ratings', NonConformanceRiskRatingViewSet, basename='ncriskrating')
router.register('training/categories', TrainingCategoryViewSet, basename='trainingcategory')
router.register('training/vendors', TrainingVendorViewSet, basename='trainingvendor')
router.register('training/content', TrainingContentViewSet, basename='trainingcontent')
router.register('training/courses', TrainingCourseViewSet, basename='trainingcourse')
router.register('training/course-attachments', TrainingCourseAttachmentViewSet, basename='trainingcourseattachment')
router.register('training/modules', TrainingModuleViewSet, basename='trainingmodule')
router.register('training/sections', TrainingSectionViewSet, basename='trainingsection')
router.register('training/subactivities', TrainingSubActivityViewSet, basename='trainingsubactivity')
router.register('training/assessments', TrainingAssessmentViewSet, basename='trainingassessment')
router.register('training/learning-paths', TrainingLearningPathViewSet, basename='trainingpath')
router.register('training/learning-path-courses', TrainingLearningPathCourseViewSet, basename='trainingpathcourse')
router.register('training/assignments', TrainingAssignmentViewSet, basename='trainingassignment')
router.register('training/assignment-items', TrainingAssignmentItemViewSet, basename='trainingassignmentitem')
router.register('training/enrollments', TrainingEnrollmentViewSet, basename='trainingenrollment')
router.register('training/employee-profiles', TrainingEmployeeProfileViewSet, basename='trainingprofile')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # JWT auth endpoints
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dms/new-document/', CreateDocumentWithVersion.as_view(), name='dms_new_document'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
