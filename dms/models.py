import re

from django.db import models
from django.utils import timezone
from core.models import BusinessUnit
from django.conf import settings


class DocumentCategory(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit,
        on_delete=models.CASCADE,
        related_name='document_categories',
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32)
    date_added = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='added_document_categories',
    )

    class Meta:
        unique_together = ('business_unit', 'code')

    def __str__(self):
        return f'{self.business_unit.code} - {self.name}'

class DocumentType(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit,
        on_delete=models.CASCADE,
        related_name='document_types',
    )
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='types',
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32)
    date_added = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='added_document_types',
    )

    class Meta:
        unique_together = ('business_unit', 'code')

    def __str__(self):
        return f'{self.business_unit.code} - {self.name}'


class Document(models.Model):
    business_unit = models.ForeignKey(BusinessUnit, on_delete=models.CASCADE)
    code = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.ForeignKey(DocumentType, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    current_version = models.CharField(max_length=20, blank=True)
    effective_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('business_unit', 'code')

    def __str__(self):
        return self.code

    @staticmethod
    def _next_code(
        business_unit: BusinessUnit,
        category: DocumentCategory | None,
        doc_type: DocumentType | None,
        year: int,
    ) -> str:
        cat_code = category.code if category else 'GEN'
        type_code = doc_type.code if doc_type else 'GEN'
        yy = str(year)[-2:]
        prefix = f"{business_unit.code}-{cat_code}-{type_code}-{yy}-"
        max_num = 0
        codes = (
            Document.objects.filter(
                business_unit=business_unit,
                category=category,
                type=doc_type,
            )
            .values_list('code', flat=True)
        )
        for code in codes:
            match = re.match(rf"^{re.escape(prefix)}(\d+)$", code or "")
            if match:
                max_num = max(max_num, int(match.group(1)))
        return f"{prefix}{max_num + 1:04d}"

    def save(self, *args, **kwargs):
        if not self.code:
            year = timezone.now().year
            self.code = self._next_code(self.business_unit, self.category, self.type, year)
        super().save(*args, **kwargs)

def generate_version_number(document: Document) -> str:
    latest = (
        DocumentVersion.objects
        .filter(document=document)
        .order_by('-created_at')
        .first()
    )
    if latest:
        # simple integer sequence "1", "2", "3"...:
        try:
            latest_num = int(latest.version_number)
        except ValueError:
            latest_num = 0
        return str(latest_num + 1)
    else:
        return "1"


class DocumentVersion(models.Model):
    STATUS_OPTIONS = [
        ('Draft', 'Draft'),
        ('Prepared', 'Prepared'),
        ('Reviewed', 'Reviewed'),
        ('Approved', 'Approved'),
        ('Archived', 'Archived'),

    ]
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='versions')
    version_number = models.CharField(max_length=20)
    def _upload_to(self, filename: str) -> str:
        doc = self.document
        bu_code = doc.business_unit.code if doc.business_unit else 'GEN'
        cat_code = doc.category.code if doc.category else 'GEN'
        type_code = doc.type.code if doc.type else 'GEN'
        return f"{bu_code}/{cat_code}/{type_code}/{filename}"

    file = models.FileField(upload_to=_upload_to)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_document_versions',
    )
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prepared_document_versions',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_document_versions',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_document_versions',
    )
    archived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='archived_document_versions',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    prepared_at = models.DateTimeField(blank=True, null=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    archived_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Draft')
    change_summary = models.TextField(blank=True)

    def __str__(self):
        return f'{self.document} v{self.version_number}'

    # Ensure uniqueness per document:
    class Meta:
        unique_together = ('document', 'version_number')

    @property
    def full_code(self):
        doc = self.document
        parts = (doc.code or '').split('-')
        if len(parts) >= 5:
            prefix = '-'.join(parts[:-1])
            seq = parts[-1]
            return f"{prefix}-{self.version_number}-{seq}"
        return f"{doc.code}-V{self.version_number}"

    def save(self, *args, **kwargs):
        if not self.version_number:
            self.version_number = generate_version_number(self.document)
        super().save(*args, **kwargs)
