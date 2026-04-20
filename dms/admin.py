from django.contrib import admin
from .models import Document,DocumentType, DocumentCategory, DocumentVersion
# Register your models here.


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'category', 'type', 'is_active', 'current_version', 'effective_date', 'business_unit')
    search_fields = ('title', 'code')
    list_filter = ('is_active','category','type', 'business_unit','is_active')


@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('business_unit', 'name', 'code', 'date_added', 'added_by')
    list_filter = ('business_unit__name', 'added_by')
    search_fields = ('name', 'code')

@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ('business_unit', 'name', 'code', 'date_added', 'added_by')
    list_filter = ('business_unit__name', 'added_by')
    search_fields = ('name', 'code')

@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ('document', 'version_number', 'status','change_summary', 'created_by', 'created_at', 'prepared_by', 'prepared_at', 'reviewed_by', 'reviewed_at', 'approved_by', 'approved_at', 'archived_by', 'archived_at')
    list_filter = ('status', 'document__title')
    search_fields = ('document__title', 'document__code')