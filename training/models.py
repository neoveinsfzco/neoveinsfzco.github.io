import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree

from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import BusinessUnit, Department

def course_attachment_upload_path(instance, filename,):
    # Extract extension
    ext = filename.split('.')[-1]

    # Clean filename (optional)
    name = os.path.splitext(filename)[0].replace(' ', '_')

    # Add timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Final filename
    new_filename = f"{name}_{timestamp}.{ext}"
    
    return f"training/courses/{instance.course_id}/attachments/{new_filename}"

def course_cover_upload_path(instance, filename):
    # Extract extension
    ext = filename.split('.')[-1]

    # Clean filename (optional)
    name = os.path.splitext(filename)[0].replace(' ', '_')

    # Add timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Final filename
    new_filename = f"{name}_{timestamp}.{ext}"
    
    return f"training/courses/{instance.id}/covers/{new_filename}"

def course_trailer_upload_path(instance, filename):
    # Extract extension
    ext = filename.split('.')[-1]

    # Clean filename (optional)
    name = os.path.splitext(filename)[0].replace(' ', '_')

    # Add timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Final filename
    new_filename = f"{name}_{timestamp}.{ext}"
    
    return f"training/courses/{instance.id}/trailers/{new_filename}"

class TrainingCategory(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_categories'
    )
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_training_categories',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return f'{self.business_unit.code} - {self.name}'


class TrainingVendor(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_vendors'
    )
    name = models.CharField(max_length=200)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_training_vendors',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business_unit', 'name')

    def __str__(self):
        return f'{self.business_unit.code} - {self.name}'


class TrainingContentType(models.TextChoices):
    PDF = 'PDF', 'PDF'
    PPT = 'PPT', 'PowerPoint'
    SCORM = 'SCORM', 'SCORM'
    VIDEO = 'VIDEO', 'Video'
    ASSESSMENT = 'ASSESSMENT', 'Assessment'
    COVER = 'COVER', 'Cover Page'


class TrainingContent(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_contents'
    )
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=20, choices=TrainingContentType.choices)
    file = models.FileField(upload_to='training/library/', blank=True, null=True)
    external_url = models.URLField(blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_training_contents',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class TrainingCourseStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PUBLISHED = 'PUBLISHED', 'Published'
    ARCHIVED = 'ARCHIVED', 'Archived'


class TrainingDeliveryType(models.TextChoices):
    INHOUSE = 'INHOUSE', 'In-house'
    VENDOR = 'VENDOR', 'Vendor'


def _next_sequence(prefix: str, existing: str | None) -> int:
    if not existing:
        return 1
    suffix = existing.replace(prefix, '')
    try:
        return int(suffix) + 1
    except ValueError:
        return 1


class TrainingCourse(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_courses'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    objectives = models.TextField(blank=True)
    publish_start_date = models.DateField()
    publish_end_date = models.DateField(null=True, blank=True)
    course_number = models.CharField(max_length=50, unique=True, blank=True)
    min_effort_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_effort_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    cover_image = models.ImageField(upload_to=course_cover_upload_path, null=True, blank=True)
    trailer_video = models.FileField(upload_to=course_trailer_upload_path, null=True, blank=True)
    mandatory_enabled = models.BooleanField(default=False)
    mandatory_departments = models.ManyToManyField(
        Department, blank=True, related_name='mandatory_training_courses'
    )
    validity_years = models.PositiveIntegerField(default=1)
    delivery_type = models.CharField(
        max_length=20, choices=TrainingDeliveryType.choices, default=TrainingDeliveryType.INHOUSE
    )
    accreditation_enabled = models.BooleanField(default=False)
    accreditation_number = models.CharField(max_length=100, blank=True)
    accreditation_body = models.CharField(max_length=255, blank=True)
    vendor = models.ForeignKey(
        TrainingVendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
    )
    category = models.ForeignKey(
        TrainingCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='courses',
    )
    status = models.CharField(
        max_length=20, choices=TrainingCourseStatus.choices, default=TrainingCourseStatus.DRAFT
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_training_courses',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-publish_start_date', 'title']

    def _generate_course_number(self):
        year = self.publish_start_date.year if self.publish_start_date else timezone.now().year
        prefix = f'TRN-{self.business_unit.code.upper()}-{year}-'
        last = (
            TrainingCourse.objects.filter(course_number__startswith=prefix)
            .order_by('-course_number')
            .first()
        )
        seq = _next_sequence(prefix, last.course_number if last else None)
        return f'{prefix}{seq:04d}'

    def save(self, *args, **kwargs):
        if not self.course_number and self.business_unit:
            self.course_number = self._generate_course_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.course_number} - {self.title}'


class CourseAttachmentVisibility(models.TextChoices):
    ALL = 'ALL', 'All learners'
    TRAINING_ONLY = 'TRAINING_ONLY', 'Training team only'
    MANAGERS_ONLY = 'MANAGERS_ONLY', 'Managers only'



class TrainingCourseAttachment(models.Model):
    course = models.ForeignKey(
        TrainingCourse, on_delete=models.CASCADE, related_name='attachments'
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=course_attachment_upload_path)
    visibility = models.CharField(
        max_length=20, choices=CourseAttachmentVisibility.choices, default=CourseAttachmentVisibility.ALL
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_training_attachments',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class TrainingModuleType(models.TextChoices):
    INSTRUCTOR_LED = 'INSTRUCTOR_LED', 'Instructor Led'
    SELF_PACED = 'SELF_PACED', 'Self Paced'
    BLENDED = 'BLENDED', 'Blended'


class TrainingModule(models.Model):
    course = models.ForeignKey(
        TrainingCourse, on_delete=models.CASCADE, related_name='modules'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    module_number = models.CharField(max_length=60, unique=True, blank=True)
    module_type = models.CharField(
        max_length=20, choices=TrainingModuleType.choices, default=TrainingModuleType.SELF_PACED
    )
    publish_start_date = models.DateField()
    publish_end_date = models.DateField(null=True, blank=True)
    coordinator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coordinated_training_modules',
    )
    supporting_attachment = models.FileField(
        upload_to='training/modules/attachments/', null=True, blank=True
    )
    capacity_min = models.PositiveIntegerField(null=True, blank=True)
    capacity_max = models.PositiveIntegerField(null=True, blank=True)
    waitlist_enabled = models.BooleanField(default=False)
    cme_cne_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    training_category = models.ForeignKey(
        TrainingCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modules',
    )
    validity_years = models.PositiveIntegerField(default=1)
    approval_required = models.BooleanField(default=False)
    is_sequential = models.BooleanField(default=False)
    order_index = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order_index', 'title']

    def _generate_module_number(self):
        prefix = f'{self.course.course_number}-M'
        last = (
            TrainingModule.objects.filter(module_number__startswith=prefix)
            .order_by('-module_number')
            .first()
        )
        seq = _next_sequence(prefix, last.module_number if last else None)
        return f'{prefix}{seq:02d}'

    def save(self, *args, **kwargs):
        if not self.module_number and self.course:
            self.module_number = self._generate_module_number()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.module_number} - {self.title}'


class SectionType(models.TextChoices):
    READING = 'READING', 'Reading Material'
    ASSESSMENT = 'ASSESSMENT', 'Assessment'
    FEEDBACK = 'FEEDBACK', 'Feedback'
    RECORDED = 'RECORDED', 'Recorded Session'


class SectionCompletionMode(models.TextChoices):
    PER_SECTION = 'PER_SECTION', 'Per Section'
    PER_ACTIVITY = 'PER_ACTIVITY', 'Per Sub-Activity'


class TrainingSection(models.Model):
    module = models.ForeignKey(
        TrainingModule, on_delete=models.CASCADE, related_name='sections'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    section_type = models.CharField(max_length=20, choices=SectionType.choices)
    sequence_order = models.PositiveIntegerField(default=1)
    is_mandatory = models.BooleanField(default=True)
    completion_mode = models.CharField(
        max_length=20, choices=SectionCompletionMode.choices, default=SectionCompletionMode.PER_SECTION
    )

    class Meta:
        ordering = ['sequence_order', 'title']

    def __str__(self):
        return f'{self.module.module_number} - {self.title}'


class TrainingSubActivity(models.Model):
    section = models.ForeignKey(
        TrainingSection, on_delete=models.CASCADE, related_name='sub_activities'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content_type = models.CharField(max_length=20, choices=TrainingContentType.choices)
    content = models.ForeignKey(
        TrainingContent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='used_in_subactivities',
    )
    file = models.FileField(upload_to='training/subactivities/', null=True, blank=True)
    external_url = models.URLField(blank=True)
    scorm_launch_path = models.CharField(max_length=500, blank=True)
    sequence_order = models.PositiveIntegerField(default=1)
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        ordering = ['sequence_order', 'title']

    def _scorm_extract_root(self) -> str:
        return os.path.join(settings.MEDIA_ROOT, 'training', 'scorm', str(self.id))

    def _resolve_scorm_launch_file(self, extract_root: str) -> str:
        manifest_path = os.path.join(extract_root, 'imsmanifest.xml')
        if os.path.exists(manifest_path):
            try:
                tree = ElementTree.parse(manifest_path)
                manifest_root = tree.getroot()
                for resource in manifest_root.findall('.//{*}resource'):
                    href = resource.attrib.get('href')
                    if not href:
                        continue
                    launch_path = os.path.normpath(os.path.join(extract_root, href))
                    if launch_path.startswith(os.path.abspath(extract_root)) and os.path.exists(launch_path):
                        return launch_path
            except ElementTree.ParseError:
                pass

        preferred_names = ('index_lms.html', 'index.html', 'story.html', 'launch.html')
        for preferred_name in preferred_names:
            for candidate in Path(extract_root).rglob(preferred_name):
                if candidate.is_file():
                    return str(candidate)

        for candidate in Path(extract_root).rglob('*.html'):
            if candidate.is_file():
                return str(candidate)

        raise ValueError('No SCORM launch HTML file was found in the uploaded package.')

    def _extract_scorm_package(self):
        if not self.file:
            self.scorm_launch_path = ''
            return

        extract_root = self._scorm_extract_root()
        if os.path.isdir(extract_root):
            shutil.rmtree(extract_root)
        os.makedirs(extract_root, exist_ok=True)

        with zipfile.ZipFile(self.file.path, 'r') as archive:
            archive.extractall(extract_root)

        launch_file = self._resolve_scorm_launch_file(extract_root)
        self.scorm_launch_path = os.path.relpath(launch_file, settings.MEDIA_ROOT).replace('\\', '/')

    def save(self, *args, **kwargs):
        previous_file_name = None
        previous_content_type = None
        if self.pk:
            previous = TrainingSubActivity.objects.filter(pk=self.pk).values(
                'file',
                'content_type',
                'scorm_launch_path',
            ).first()
            if previous:
                previous_file_name = previous['file']
                previous_content_type = previous['content_type']

        super().save(*args, **kwargs)

        file_changed = self.file and self.file.name != previous_file_name
        content_type_changed = self.content_type != previous_content_type

        if self.content_type == TrainingContentType.SCORM and self.file:
            if file_changed or content_type_changed or not self.scorm_launch_path:
                self._extract_scorm_package()
                TrainingSubActivity.objects.filter(pk=self.pk).update(
                    scorm_launch_path=self.scorm_launch_path
                )
        elif self.scorm_launch_path:
            self.scorm_launch_path = ''
            TrainingSubActivity.objects.filter(pk=self.pk).update(scorm_launch_path='')

    def __str__(self):
        return f'{self.section.title} - {self.title}'


class AssessmentScoringMode(models.TextChoices):
    AVERAGE = 'AVERAGE', 'Average'
    SUM = 'SUM', 'Sum'


class TrainingAssessment(models.Model):
    section = models.OneToOneField(
        TrainingSection, on_delete=models.CASCADE, related_name='assessment'
    )
    attempts_allowed = models.PositiveIntegerField(default=1)
    passing_score = models.PositiveIntegerField(default=0)
    scoring_mode = models.CharField(
        max_length=10, choices=AssessmentScoringMode.choices, default=AssessmentScoringMode.SUM
    )
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    questions = models.JSONField(default=list, blank=True)
    is_feedback = models.BooleanField(default=False)

    def __str__(self):
        return f'Assessment for {self.section}'


class TrainingLearningPath(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_paths'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_days = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_training_paths',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class TrainingLearningPathCourse(models.Model):
    learning_path = models.ForeignKey(
        TrainingLearningPath, on_delete=models.CASCADE, related_name='path_courses'
    )
    course = models.ForeignKey(
        TrainingCourse, on_delete=models.CASCADE, related_name='path_links'
    )
    sequence_order = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('learning_path', 'course')
        ordering = ['sequence_order']


class AssignmentType(models.TextChoices):
    RECOMMENDED = 'RECOMMENDED', 'Recommended'
    MANDATORY = 'MANDATORY', 'Mandatory'
    VOLUNTARY = 'VOLUNTARY', 'Voluntary'


class TrainingAssignment(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_assignments'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assignment_type = models.CharField(
        max_length=20, choices=AssignmentType.choices, default=AssignmentType.RECOMMENDED
    )
    start_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    assigned_by_department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='training_assignments',
    )
    learner_note = models.TextField(blank=True)
    notify_schema = models.JSONField(default=dict, blank=True)
    target_departments = models.ManyToManyField(
        Department, blank=True, related_name='targeted_training_assignments'
    )
    target_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name='targeted_training_assignments'
    )
    allow_retake = models.BooleanField(default=False)
    exempt_if_completed = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_training_assignments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.title


class TrainingAssignmentItem(models.Model):
    assignment = models.ForeignKey(
        TrainingAssignment, on_delete=models.CASCADE, related_name='items'
    )
    course = models.ForeignKey(
        TrainingCourse, on_delete=models.CASCADE, null=True, blank=True, related_name='assignment_items'
    )
    learning_path = models.ForeignKey(
        TrainingLearningPath,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assignment_items',
    )

    def __str__(self):
        return f'{self.assignment} - {self.course or self.learning_path}'


class TrainingEnrollmentStatus(models.TextChoices):
    ASSIGNED = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    EXEMPTED = 'EXEMPTED', 'Exempted'


class TrainingEnrollment(models.Model):
    assignment_item = models.ForeignKey(
        TrainingAssignmentItem, on_delete=models.CASCADE, related_name='enrollments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='training_enrollments'
    )
    status = models.CharField(
        max_length=20, choices=TrainingEnrollmentStatus.choices, default=TrainingEnrollmentStatus.ASSIGNED
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    progress = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('assignment_item', 'user')
        ordering = ['-id']


class TrainingEmployeeProfile(models.Model):
    business_unit = models.ForeignKey(
        BusinessUnit, on_delete=models.CASCADE, related_name='training_profiles'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='training_profiles'
    )
    line_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='managed_training_profiles',
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='training_profiles',
    )
    position = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('business_unit', 'user')
        ordering = ['user_id']

    def __str__(self):
        return f'{self.user} - {self.business_unit.code}'
