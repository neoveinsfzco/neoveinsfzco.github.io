# dms/serializers_new_document.py
from rest_framework import serializers


class NewDocumentSerializer(serializers.Serializer):
    """
    Serializer for creating a new Document + initial DocumentVersion
    in a single API call.

    Supports either:
    - file upload (PDF or any file you accept), OR
    - html_content (used by the Builder, converted to PDF on the server)
    """

    business_unit = serializers.IntegerField()
    title = serializers.CharField(max_length=255)

    category = serializers.IntegerField(required=False, allow_null=True)
    type = serializers.IntegerField(required=False, allow_null=True)

    # Option A: direct file upload (preferred for PDFs)
    file = serializers.FileField(required=False, allow_null=True)

    # Option B: HTML content from the builder
    html_content = serializers.CharField(required=False, allow_blank=True)

    # Optional fields for version details (you can extend later)
    status = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        default='Draft',
    )
    change_summary = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate(self, data):
        file = data.get("file")
        html = data.get("html_content", "")

        if not file and not html:
            raise serializers.ValidationError(
                "You must provide either a file OR HTML content."
            )

        return data
