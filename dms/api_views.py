# dms/api_views.py
from rest_framework import viewsets, status
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import (
    DocumentCategory,
    DocumentType,
    Document,
    DocumentVersion,
)
from .serializers import (
    DocumentCategorySerializer,
    DocumentTypeSerializer,
    DocumentSerializer,
    DocumentVersionSerializer,
    DocumentCreateWithVersionSerializer,
    DocumentWithVersionResponseSerializer,
)
from core.permissions import (
    BusinessUnitRolePermission,
    filter_queryset_by_membership,
    user_has_role,
)

class DocumentCategoryViewSet(viewsets.ModelViewSet):
    """
    BU-specific document categories.
    """
    queryset = DocumentCategory.objects.select_related('business_unit').all()
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN', 'QUALITY')
    filterset_fields = ['business_unit', 'code']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'date_added']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(added_by=user)


class DocumentTypeViewSet(viewsets.ModelViewSet):
    """
    BU-specific document types.
    """
    queryset = DocumentType.objects.select_related('business_unit').all()
    serializer_class = DocumentTypeSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN', 'QUALITY')
    filterset_fields = ['business_unit', 'code', 'category']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'date_added']
    ordering = ['name']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(added_by=user)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    Core Document records.

    - Scoped by BU via ?business_unit=...
    - Filterable by category, type, is_active.
    - Search on code/title.
    - Ordered by code/title/effective_date.
    """
    queryset = Document.objects.select_related('business_unit', 'category', 'type').all()
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN', 'QUALITY')

    filterset_fields = {
        'business_unit': ['exact'],
        'category': ['exact'],
        'type': ['exact'],
        'is_active': ['exact'],
    }
    search_fields = ['code', 'title']
    ordering_fields = ['code', 'title', 'effective_date', 'current_version']
    ordering = ['code']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(qs, self.request.user, 'business_unit_id')
        bu_id = self.request.query_params.get('business_unit')
        year = self.request.query_params.get('year')
        user = self.request.user
        if bu_id:
            qs = qs.filter(business_unit_id=bu_id)
        if year:
            try:
                yy = str(int(year))[-2:]
                qs = qs.filter(
                    Q(effective_date__year=int(year)) | Q(code__contains=f"-{yy}-")
                )
            except ValueError:
                pass
        if bu_id and not user_has_role(user, bu_id, ('QUALITY', 'BU_ADMIN')):
            qs = qs.filter(is_active=True)
        return qs

    def get_bu_id_for_request(self, request):
        return request.data.get('business_unit')

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(
        detail=False,
        methods=['post'],
        url_path='create-with-version',
        permission_classes=[IsAuthenticated, BusinessUnitRolePermission],
    )
    def create_with_version(self, request, *args, **kwargs):
        """
        Create a new Document AND its initial DocumentVersion in one request.

        Expects multipart/form-data (for file upload) with:
        - business_unit (id)
        - code
        - title
        - category (optional id)
        - type (optional id)
        - is_active (optional bool)
        - file (required)
        - status (optional, default='Draft')
        - change_summary (optional)
        """
        serializer = DocumentCreateWithVersionSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()  # returns {'document': document, 'version': version}

        document = result['document']
        version = result['version']

        response_serializer = DocumentWithVersionResponseSerializer.from_instances(
            document, version
        )

        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class DocumentVersionViewSet(viewsets.ModelViewSet):
    """
    Handles versioned files for a Document.

    - Requires auth to create/update/delete.
    - Automatically sets created_by on create.
    - If status is Approved, updates parent Document.current_version.
    """
    queryset = (
        DocumentVersion.objects
        .select_related(
            'document',
            'document__business_unit',
            'created_by',
            'prepared_by',
            'reviewed_by',
            'approved_by',
            'archived_by',
        )
        .all()
        .order_by('-created_at')
    )
    serializer_class = DocumentVersionSerializer
    permission_classes = [IsAuthenticated, BusinessUnitRolePermission]
    write_roles = ('BU_ADMIN', 'QUALITY')

    filterset_fields = {
        'document': ['exact'],
        'document__business_unit': ['exact'],
        'document__category': ['exact'],
        'document__type': ['exact'],
        'document__is_active': ['exact'],
        'status': ['exact'],
    }
    search_fields = ['version_number', 'change_summary', 'document__code', 'document__title']
    ordering_fields = ['created_at', 'version_number', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = filter_queryset_by_membership(
            qs, self.request.user, 'document__business_unit_id'
        )
        document_id = self.request.query_params.get('document')
        bu_id = self.request.query_params.get('business_unit')
        year = self.request.query_params.get('year')
        recent_days = self.request.query_params.get('recent_days')

        if document_id:
            qs = qs.filter(document_id=document_id)

        if bu_id:
            qs = qs.filter(document__business_unit_id=bu_id)
            if not user_has_role(self.request.user, bu_id, ('QUALITY', 'BU_ADMIN')):
                qs = qs.filter(status='Approved')

        if year:
            try:
                yy = str(int(year))[-2:]
                qs = qs.filter(
                    Q(document__effective_date__year=int(year))
                    | Q(document__code__contains=f"-{yy}-")
                )
            except ValueError:
                pass

        if recent_days:
            try:
                days = int(recent_days)
                cutoff = timezone.now() - timedelta(days=days)
                qs = qs.filter(created_at__gte=cutoff)
            except ValueError:
                pass

        return qs

    def get_bu_id_for_request(self, request):
        document_id = request.data.get('document')
        if not document_id:
            return None
        return (
            Document.objects.filter(id=document_id)
            .values_list('business_unit_id', flat=True)
            .first()
        )

    def get_bu_id_for_obj(self, obj):
        return obj.document.business_unit_id

    @action(
        detail=True,
        methods=['get'],
        url_path='view',
        permission_classes=[IsAuthenticated, BusinessUnitRolePermission],
    )
    def view_pdf(self, request, *args, **kwargs):
        """
        Return a stamped PDF for viewing with a left-border disclaimer.
        """
        version: DocumentVersion = self.get_object()
        if not version.file:
            return Response(
                {"detail": "No file available for this document version."},
                status=status.HTTP_404_NOT_FOUND,
            )

        doc = version.document
        bu = doc.business_unit.code
        category = doc.category.code if doc.category else 'GEN'
        doc_type = doc.type.code if doc.type else 'GEN'
        accessed_at = timezone.localtime(timezone.now()).strftime(
            "%b %d, %Y %I:%M %p"
        )
        username = request.user.get_username()
        lines = [
            f"{bu}/{category}/{doc_type}/{doc.code}/v{version.version_number}. Accessed by {username} on {accessed_at}.",
            "This document is uncontrolled when printed. The electronic version of this document is the approved and most current."
        ]

        reader = PdfReader(version.file)
        writer = PdfWriter()

        for page in reader.pages:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)

            overlay_stream = BytesIO()
            c = canvas.Canvas(overlay_stream, pagesize=(width, height))
            c.setFillColorRGB(0.4, 0.4, 0.4)
            c.setFont("Helvetica", 7)
            c.saveState()
            c.translate(10, 20)
            c.rotate(90)
            text = c.beginText()
            text.setTextOrigin(0, 0)
            text.setLeading(10)
            for line in lines:
                text.textLine(line)
            c.drawText(text)
            c.restoreState()
            c.save()

            overlay_stream.seek(0)
            overlay_pdf = PdfReader(overlay_stream)
            page.merge_page(overlay_pdf.pages[0])
            writer.add_page(page)

        output = BytesIO()
        writer.write(output)
        output.seek(0)

        response = HttpResponse(output.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = (
            f'inline; filename="{doc.code}-v{version.version_number}.pdf"'
        )
        return response

    def _update_current_version_if_needed(self, instance: DocumentVersion):
        """
        If this version is Approved, set Document.current_version to this version_number.
        You can also, if desired, update effective_date from approved_at/created_at.
        """
        if instance.status == 'Approved':
            doc = instance.document
            doc.current_version = instance.version_number
            doc.is_active = True
            # Optional: set effective_date if not set
            # if not doc.effective_date and instance.approved_at:
            #     doc.effective_date = instance.approved_at.date()
            doc.save(update_fields=['current_version', 'is_active'])
        elif instance.status == 'Archived':
            doc = instance.document
            doc.is_active = False
            doc.save(update_fields=['is_active'])

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance: DocumentVersion = serializer.save(created_by=user)
        self._update_current_version_if_needed(instance)

    def perform_update(self, serializer):
        instance: DocumentVersion = serializer.save()
        self._update_current_version_if_needed(instance)

    def destroy(self, request, *args, **kwargs):
        instance: DocumentVersion = self.get_object()
        document = instance.document
        was_current = document.current_version == instance.version_number

        response = super().destroy(request, *args, **kwargs)

        if was_current:
            # Recompute current_version as last Approved version, if any
            latest_approved = (
                DocumentVersion.objects
                .filter(document=document, status='Approved')
                .order_by('-created_at')
                .first()
            )
            if latest_approved:
                document.current_version = latest_approved.version_number
            else:
                document.current_version = ''
            document.save(update_fields=['current_version'])

        return response
