# dms/api_views_new.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.core.files.base import ContentFile
import io

from .serializers_new_document import NewDocumentSerializer
from .models import Document, DocumentVersion, DocumentCategory, DocumentType
from core.permissions import user_in_business_unit


class CreateDocumentWithVersion(APIView):
    """
    POST /api/dms/new-document/

    Accepts:
    - business_unit (int)
    - title (str)
    - category (int, optional)
    - type (int, optional)
    - status (str, optional, default 'Draft')
    - change_summary (str, optional)
    - EITHER:
        - file (uploaded file, e.g. PDF)
        - html_content (HTML from the builder, converted to PDF via xhtml2pdf)

    Creates:
    - Document
    - DocumentVersion (version_number="1")
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = NewDocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        business_unit_id = data["business_unit"]
        title = data["title"]
        category_id = data.get("category")
        type_id = data.get("type")
        status_value = data.get("status") or "Draft"
        change_summary = data.get("change_summary", "")

        if not user_in_business_unit(request.user, business_unit_id):
            return Response(
                {"detail": "You are not a member of this Business Unit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if category_id:
            if not DocumentCategory.objects.filter(
                id=category_id, business_unit_id=business_unit_id
            ).exists():
                return Response(
                    {"detail": "Category must belong to the same Business Unit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if type_id:
            if not DocumentType.objects.filter(
                id=type_id, business_unit_id=business_unit_id
            ).exists():
                return Response(
                    {"detail": "Type must belong to the same Business Unit."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if DocumentType.objects.filter(id=type_id).exclude(category_id=None).exists() and not category_id:
                return Response(
                    {"detail": "Category is required when selecting a Type."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if category_id and not DocumentType.objects.filter(
                id=type_id, category_id=category_id
            ).exists():
                return Response(
                    {"detail": "Type must belong to the selected Category."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Step 1 — create the Document
        doc = Document.objects.create(
            business_unit_id=business_unit_id,
            title=title,
            category_id=category_id,
            type_id=type_id,
            is_active=True,
            current_version="1",
        )

        # Step 2 — choose / generate the file for version 1
        upload_file = data.get("file")
        html = data.get("html_content")
        final_file = upload_file

        if html and not upload_file:
            # Convert HTML to PDF using xhtml2pdf (optional dependency)
            try:
                from xhtml2pdf import pisa
            except ImportError:
                doc.delete()
                return Response(
                    {
                        "detail": "PDF generation requires xhtml2pdf. Install it in the backend environment.",
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            pdf_io = io.BytesIO()
            pisa_status = pisa.CreatePDF(html, dest=pdf_io)

            if pisa_status.err:
                # If PDF generation fails, we should roll back the document creation
                doc.delete()
                return Response(
                    {"detail": "Failed to generate PDF from HTML content."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            pdf_io.seek(0)
            filename = f"{doc.code}_v1.pdf"
            final_file = ContentFile(pdf_io.getvalue(), name=filename)

        if not final_file:
            # This should not happen because we validated that either file or html must be provided
            doc.delete()
            return Response(
                {"detail": "No file or HTML content received."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 3 — Create initial DocumentVersion
        version = DocumentVersion.objects.create(
            document=doc,
            version_number="1",
            file=final_file,
            created_by=request.user if request.user.is_authenticated else None,
            status=status_value,
            change_summary=change_summary,
        )

        return Response(
            {
                "document_id": doc.id,
                "version_id": version.id,
                "message": "Document and initial version created successfully.",
            },
            status=status.HTTP_201_CREATED,
        )
