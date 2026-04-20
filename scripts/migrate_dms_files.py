import os
import shutil
import sys

import django
from django.conf import settings


def setup_django():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
    django.setup()


def build_target_path(version, filename: str) -> str:
    doc = version.document
    bu_code = doc.business_unit.code if doc.business_unit else "GEN"
    cat_code = doc.category.code if doc.category else "GEN"
    type_code = doc.type.code if doc.type else "GEN"
    return os.path.join(bu_code, cat_code, type_code, filename)


def migrate_files():
    from dms.models import DocumentVersion

    media_root = settings.MEDIA_ROOT
    if not media_root:
        raise RuntimeError("MEDIA_ROOT is not configured.")

    updated = 0
    skipped = 0
    missing = 0

    for version in DocumentVersion.objects.select_related(
        "document",
        "document__business_unit",
        "document__category",
        "document__type",
    ):
        if not version.file:
            skipped += 1
            continue

        current_rel = version.file.name
        filename = os.path.basename(current_rel)
        target_rel = build_target_path(version, filename)
        if current_rel == target_rel:
            skipped += 1
            continue

        current_abs = os.path.join(media_root, current_rel)
        target_abs = os.path.join(media_root, target_rel)

        if not os.path.exists(current_abs):
            missing += 1
            continue

        os.makedirs(os.path.dirname(target_abs), exist_ok=True)

        if os.path.exists(target_abs):
            # Avoid overwriting existing files with the same name.
            skipped += 1
            continue

        shutil.move(current_abs, target_abs)
        version.file.name = target_rel
        version.save(update_fields=["file"])
        updated += 1

    print(
        f"Migration complete. updated={updated}, skipped={skipped}, missing={missing}"
    )


if __name__ == "__main__":
    setup_django()
    migrate_files()
