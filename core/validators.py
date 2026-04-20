# core/validators.py
import imghdr
from django.core.exceptions import ValidationError

def validate_logo(file):
    max_size = 2 * 1024 * 1024  # 2 MB
    allowed_extensions = ('.png', '.jpg', '.jpeg')
    allowed_mime_types = ('png', 'jpeg')  # imghdr returns 'jpeg' for jpg

    # Size check
    if file.size > max_size:
        raise ValidationError("Logo file is too large. Maximum size allowed is 2 MB.")

    # Extension check (case-insensitive)
    if not file.name.lower().endswith(allowed_extensions):
        raise ValidationError("Invalid file format. Only PNG and JPG images are accepted.")

    # MIME/content validation using imghdr
    file_type = imghdr.what(file)
    file.seek(0)  # reset file pointer after reading

    if file_type not in allowed_mime_types:
        raise ValidationError("Invalid image content. File is not a valid PNG/JPG image.")
