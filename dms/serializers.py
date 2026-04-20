# dms/serializers.py
from rest_framework import serializers
from .models import (
    DocumentCategory,
    DocumentType,
    Document,
    DocumentVersion,
)
from core.permissions import user_in_business_unit


class DocumentCategorySerializer(serializers.ModelSerializer):
    business_unit_code = serializers.CharField(
        source='business_unit.code', read_only=True
    )
    added_by_username = serializers.CharField(
        source='added_by.username', read_only=True
    )

    class Meta:
        model = DocumentCategory
        fields = [
            'id',
            'business_unit',
            'business_unit_code',
            'name',
            'code',
            'date_added',
            'added_by',
            'added_by_username',
        ]
        read_only_fields = ['date_added', 'added_by']


class DocumentTypeSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=DocumentCategory.objects.all(),
        required=False,
        allow_null=True,
    )
    category_name = serializers.CharField(
        source='category.name', read_only=True
    )
    business_unit_code = serializers.CharField(
        source='business_unit.code', read_only=True
    )
    added_by_username = serializers.CharField(
        source='added_by.username', read_only=True
    )

    class Meta:
        model = DocumentType
        fields = [
            'id',
            'business_unit',
            'business_unit_code',
            'category',
            'category_name',
            'name',
            'code',
            'date_added',
            'added_by',
            'added_by_username',
        ]
        read_only_fields = ['date_added', 'added_by']

    def validate(self, attrs):
        business_unit = attrs.get('business_unit') or getattr(self.instance, 'business_unit', None)
        category = attrs.get('category')
        if category and business_unit and category.business_unit_id != business_unit.id:
            raise serializers.ValidationError(
                {'category': 'Category must belong to the same Business Unit.'}
            )
        return attrs


class DocumentSerializer(serializers.ModelSerializer):
    business_unit_code = serializers.CharField(
        source='business_unit.code', read_only=True
    )
    category_name = serializers.CharField(
        source='category.name', read_only=True
    )
    type_name = serializers.CharField(
        source='type.name', read_only=True
    )

    class Meta:
        model = Document
        fields = [
            'id',
            'business_unit',
            'business_unit_code',
            'code',
            'title',
            'category',
            'category_name',
            'type',
            'type_name',
            'is_active',
            'current_version',
            'effective_date',
        ]
        read_only_fields = ['current_version', 'code']


class DocumentVersionSerializer(serializers.ModelSerializer):
    document_code = serializers.CharField(
        source='document.code', read_only=True
    )
    document_title = serializers.CharField(
        source='document.title', read_only=True
    )
    full_code_s = serializers.CharField(
        source='full_code', read_only=True
    )
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )
    prepared_by_username = serializers.CharField(
        source='prepared_by.username', read_only=True
    )
    reviewed_by_username = serializers.CharField(
        source='reviewed_by.username', read_only=True
    )
    approved_by_username = serializers.CharField(
        source='approved_by.username', read_only=True
    )
    archived_by_username = serializers.CharField(
        source='archived_by.username', read_only=True
    )
    file_url = serializers.FileField(source='file', read_only=True)

    class Meta:
        model = DocumentVersion
        fields = [
            'id',
            'document',
            'document_code',
            'document_title',
            'version_number',
            'full_code_s',
            'file',
            'file_url',
            'created_at',
            'created_by',
            'created_by_username',
            'prepared_at',
            'prepared_by',
            'prepared_by_username',
            'reviewed_at',
            'reviewed_by',
            'reviewed_by_username',
            'approved_at',
            'approved_by',
            'approved_by_username',
            'archived_at',
            'archived_by',
            'archived_by_username',
            'status',
            'change_summary',
        ]
        read_only_fields = [
            'created_at',
            'created_by',
            'created_by_username',
            'prepared_at',
            'reviewed_at',
            'approved_at',
            'archived_at',
        ]


# dms/serializers.py
from rest_framework import serializers
from .models import Document, DocumentVersion, DocumentCategory, DocumentType
from core.models import BusinessUnit


class DocumentCreateWithVersionSerializer(serializers.Serializer):
    # --- Document fields ---
    business_unit = serializers.PrimaryKeyRelatedField(
        queryset=BusinessUnit.objects.all()
    )
    title = serializers.CharField(max_length=255)
    category = serializers.PrimaryKeyRelatedField(
        queryset=DocumentCategory.objects.all(),
        required=False,
        allow_null=True,
    )
    type = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all(),
        required=False,
        allow_null=True,
    )
    is_active = serializers.BooleanField(default=True)

    # --- Version fields ---
    file = serializers.FileField()
    status = serializers.ChoiceField(
        choices=DocumentVersion.STATUS_OPTIONS,
        default='Draft',
    )
    change_summary = serializers.CharField(
        allow_blank=True,
        required=False,
    )

    def validate(self, attrs):
        """
        Ensure the user is allowed to create documents for the business unit.
        """
        bu = attrs['business_unit']
        request = self.context.get('request')

        if request and request.user and request.user.is_authenticated:
            if not user_in_business_unit(request.user, bu.id):
                raise serializers.ValidationError(
                    {'business_unit': 'You are not a member of this Business Unit.'}
                )

        category = attrs.get('category')
        if category and category.business_unit_id != bu.id:
            raise serializers.ValidationError(
                {'category': 'Category must belong to the same Business Unit.'}
            )

        doc_type = attrs.get('type')
        if doc_type and doc_type.business_unit_id != bu.id:
            raise serializers.ValidationError(
                {'type': 'Type must belong to the same Business Unit.'}
            )
        if doc_type and doc_type.category_id and not category:
            raise serializers.ValidationError(
                {'category': 'Category is required when selecting a Type.'}
            )
        if category and doc_type and doc_type.category_id and doc_type.category_id != category.id:
            raise serializers.ValidationError(
                {'type': 'Type must belong to the selected Category.'}
            )

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        bu = validated_data['business_unit']
        title = validated_data['title']
        category = validated_data.get('category')
        doc_type = validated_data.get('type')
        is_active = validated_data.get('is_active', True)

        file = validated_data['file']
        status = validated_data.get('status', 'Draft')
        change_summary = validated_data.get('change_summary', '')

        # 1) Create the Document
        document = Document.objects.create(
            business_unit=bu,
            title=title,
            category=category,
            type=doc_type,
            is_active=is_active,
            # current_version will be set after creating the version
        )

        # 2) Create the initial DocumentVersion
        version = DocumentVersion.objects.create(
            document=document,
            # version_number will be set automatically by .save()
            file=file,
            created_by=user,
            status=status,
            change_summary=change_summary,
        )

        # Ensure our helper logic runs (in case it relies on save override)
        # Note: if your generate_version_number is used on save, it's already done.

        # 3) Set current_version on Document if status is Approved or we want it always
        document.current_version = version.version_number
        document.save(update_fields=['current_version'])

        return {
            'document': document,
            'version': version,
        }


class DocumentWithVersionResponseSerializer(serializers.Serializer):
    """
    Response shape for the combined create endpoint.
    You can adjust fields as needed for the frontend.
    """
    document_id = serializers.IntegerField()
    document_code = serializers.CharField()
    document_title = serializers.CharField()
    current_version = serializers.CharField()
    version_id = serializers.IntegerField()
    version_number = serializers.CharField()
    status = serializers.CharField()
    file_url = serializers.CharField()

    @staticmethod
    def from_instances(document: Document, version: DocumentVersion):
        return DocumentWithVersionResponseSerializer({
            'document_id': document.id,
            'document_code': document.code,
            'document_title': document.title,
            'current_version': document.current_version,
            'version_id': version.id,
            'version_number': version.version_number,
            'status': version.status,
            'file_url': version.file.url if version.file else '',
        })
