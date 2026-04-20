from django.contrib import admin

from .models import (
    TrainingCategory,
    TrainingVendor,
    TrainingContent,
    TrainingCourse,
    TrainingCourseAttachment,
    TrainingModule,
    TrainingSection,
    TrainingSubActivity,
    TrainingAssessment,
    TrainingLearningPath,
    TrainingLearningPathCourse,
    TrainingAssignment,
    TrainingAssignmentItem,
    TrainingEnrollment,
    TrainingEmployeeProfile,
)


# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------

class TrainingCourseAttachmentInline(admin.TabularInline):
    model = TrainingCourseAttachment
    extra = 0
    fields = ('title', 'file', 'visibility', 'uploaded_by', 'uploaded_at')
    readonly_fields = ('uploaded_at',)


class TrainingModuleInline(admin.TabularInline):
    model = TrainingModule
    extra = 0
    fields = ('order_index', 'module_number', 'title', 'module_type', 'publish_start_date', 'capacity_max')
    readonly_fields = ('module_number',)
    ordering = ('order_index',)
    show_change_link = True


class TrainingSectionInline(admin.TabularInline):
    model = TrainingSection
    extra = 0
    fields = ('sequence_order', 'title', 'section_type', 'completion_mode')
    ordering = ('sequence_order',)
    show_change_link = True


class TrainingSubActivityInline(admin.TabularInline):
    model = TrainingSubActivity
    extra = 0
    fields = ('sequence_order', 'title', 'content_type', 'content', 'file', 'external_url')
    ordering = ('sequence_order',)


class TrainingAssessmentInline(admin.StackedInline):
    model = TrainingAssessment
    extra = 0
    fields = ('attempts_allowed', 'passing_score', 'scoring_mode', 'time_limit_minutes', 'is_feedback', 'questions')


class TrainingLearningPathCourseInline(admin.TabularInline):
    model = TrainingLearningPathCourse
    extra = 0
    fields = ('sequence_order', 'course')
    ordering = ('sequence_order',)


class TrainingAssignmentItemInline(admin.TabularInline):
    model = TrainingAssignmentItem
    extra = 0
    fields = ('course', 'learning_path')


class TrainingEnrollmentInline(admin.TabularInline):
    model = TrainingEnrollment
    extra = 0
    fields = ('user', 'status', 'started_at', 'completed_at')
    readonly_fields = ('started_at', 'completed_at')


# ---------------------------------------------------------------------------
# ModelAdmin classes
# ---------------------------------------------------------------------------

@admin.register(TrainingCategory)
class TrainingCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_unit', 'is_active', 'created_by', 'created_at')
    list_filter = ('business_unit', 'is_active')
    search_fields = ('name', 'business_unit__code')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('business_unit', 'name', 'is_active')
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at'),
        }),
    )


@admin.register(TrainingVendor)
class TrainingVendorAdmin(admin.ModelAdmin):
    list_display = ('name', 'business_unit', 'contact_email', 'contact_phone', 'is_active', 'created_at')
    list_filter = ('business_unit', 'is_active')
    search_fields = ('name', 'contact_email', 'business_unit__code')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('business_unit', 'name', 'is_active')
        }),
        ('Contact', {
            'fields': ('contact_email', 'contact_phone'),
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at'),
        }),
    )


@admin.register(TrainingContent)
class TrainingContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'business_unit', 'content_type', 'duration_minutes', 'is_active', 'created_at')
    list_filter = ('business_unit', 'content_type', 'is_active')
    search_fields = ('title', 'business_unit__code')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('business_unit', 'title', 'content_type', 'is_active')
        }),
        ('Content source', {
            'fields': ('file', 'external_url', 'duration_minutes'),
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('uploaded_by', 'created_at'),
        }),
    )


@admin.register(TrainingCourse)
class TrainingCourseAdmin(admin.ModelAdmin):
    list_display = (
        'course_number', 'title', 'business_unit', 'category', 'status',
        'delivery_type', 'publish_start_date', 'publish_end_date',
    )
    list_filter = ('business_unit', 'status', 'delivery_type', 'accreditation_enabled', 'mandatory_enabled')
    search_fields = ('course_number', 'title', 'accreditation_number', 'business_unit__code')
    readonly_fields = ('course_number', 'created_at')
    filter_horizontal = ('mandatory_departments',)
    inlines = [TrainingCourseAttachmentInline, TrainingModuleInline]
    fieldsets = (
        ('Basic info', {
            'fields': (
                'business_unit', 'course_number', 'title', 'description',
                'objectives', 'status', 'category',
            )
        }),
        ('Publishing', {
            'fields': ('publish_start_date', 'publish_end_date', 'validity_years'),
        }),
        ('Effort', {
            'fields': ('min_effort_hours', 'max_effort_hours'),
        }),
        ('Media', {
            'fields': ('cover_image', 'trailer_video'),
        }),
        ('Delivery', {
            'fields': ('delivery_type', 'vendor'),
        }),
        ('Mandatory', {
            'fields': ('mandatory_enabled', 'mandatory_departments'),
        }),
        ('Accreditation', {
            'classes': ('collapse',),
            'fields': ('accreditation_enabled', 'accreditation_number', 'accreditation_body'),
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at'),
        }),
    )


@admin.register(TrainingModule)
class TrainingModuleAdmin(admin.ModelAdmin):
    list_display = (
        'module_number', 'title', 'course', 'module_type',
        'publish_start_date', 'capacity_max', 'waitlist_enabled', 'order_index',
    )
    list_filter = ('module_type', 'waitlist_enabled', 'approval_required', 'is_sequential')
    search_fields = ('module_number', 'title', 'course__course_number', 'course__title')
    readonly_fields = ('module_number',)
    inlines = [TrainingSectionInline]
    fieldsets = (
        ('Basic info', {
            'fields': ('course', 'module_number', 'title', 'description', 'module_type', 'order_index')
        }),
        ('Publishing', {
            'fields': ('publish_start_date', 'publish_end_date'),
        }),
        ('Capacity', {
            'fields': ('capacity_min', 'capacity_max', 'waitlist_enabled'),
        }),
        ('Settings', {
            'fields': (
                'coordinator', 'training_category', 'validity_years',
                'cme_cne_hours', 'approval_required', 'is_sequential',
            ),
        }),
        ('Attachment', {
            'fields': ('supporting_attachment',),
        }),
    )


@admin.register(TrainingSection)
class TrainingSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'section_type', 'sequence_order', 'completion_mode')
    list_filter = ('section_type', 'completion_mode')
    search_fields = ('title', 'module__title', 'module__module_number')
    inlines = [TrainingSubActivityInline, TrainingAssessmentInline]
    fieldsets = (
        (None, {
            'fields': ('module', 'title', 'description', 'section_type', 'sequence_order', 'completion_mode')
        }),
    )


@admin.register(TrainingSubActivity)
class TrainingSubActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'section', 'content_type', 'sequence_order')
    list_filter = ('content_type',)
    search_fields = ('title', 'section__title')
    fieldsets = (
        (None, {
            'fields': ('section', 'title', 'description', 'content_type', 'sequence_order')
        }),
        ('Content source', {
            'fields': ('content', 'file', 'external_url'),
        }),
    )


@admin.register(TrainingAssessment)
class TrainingAssessmentAdmin(admin.ModelAdmin):
    list_display = ('section', 'attempts_allowed', 'passing_score', 'scoring_mode', 'time_limit_minutes', 'is_feedback')
    list_filter = ('scoring_mode', 'is_feedback')
    search_fields = ('section__title',)
    fieldsets = (
        (None, {
            'fields': ('section', 'scoring_mode', 'passing_score', 'attempts_allowed', 'time_limit_minutes', 'is_feedback')
        }),
        ('Questions', {
            'fields': ('questions',),
        }),
    )


@admin.register(TrainingLearningPath)
class TrainingLearningPathAdmin(admin.ModelAdmin):
    list_display = ('title', 'business_unit', 'is_active', 'created_by', 'created_at')
    list_filter = ('business_unit', 'is_active')
    search_fields = ('title', 'business_unit__code')
    readonly_fields = ('created_at',)
    inlines = [TrainingLearningPathCourseInline]
    fieldsets = (
        (None, {
            'fields': ('business_unit', 'title', 'description', 'is_active')
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at'),
        }),
    )


@admin.register(TrainingAssignment)
class TrainingAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'business_unit', 'assignment_type', 'start_date', 'due_date',
        'allow_retake', 'exempt_if_completed', 'created_at',
    )
    list_filter = ('business_unit', 'assignment_type', 'allow_retake', 'exempt_if_completed')
    search_fields = ('title', 'business_unit__code')
    readonly_fields = ('created_at',)
    filter_horizontal = ('target_departments', 'target_users')
    inlines = [TrainingAssignmentItemInline]
    fieldsets = (
        ('Basic info', {
            'fields': ('business_unit', 'title', 'description', 'assignment_type')
        }),
        ('Schedule', {
            'fields': ('start_date', 'due_date'),
        }),
        ('Targeting', {
            'fields': ('assigned_by_department', 'target_departments', 'target_users'),
        }),
        ('Options', {
            'fields': ('allow_retake', 'exempt_if_completed', 'learner_note', 'notify_schema'),
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_by', 'created_at'),
        }),
    )


@admin.register(TrainingAssignmentItem)
class TrainingAssignmentItemAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'course', 'learning_path')
    list_filter = ('assignment__business_unit',)
    search_fields = ('assignment__title', 'course__title', 'learning_path__title')
    inlines = [TrainingEnrollmentInline]


@admin.register(TrainingEnrollment)
class TrainingEnrollmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'assignment_item', 'status', 'started_at', 'completed_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'user__email', 'assignment_item__assignment__title')
    readonly_fields = ('started_at', 'completed_at')
    fieldsets = (
        (None, {
            'fields': ('assignment_item', 'user', 'status')
        }),
        ('Progress', {
            'fields': ('started_at', 'completed_at', 'progress', 'result'),
        }),
    )


@admin.register(TrainingEmployeeProfile)
class TrainingEmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_unit', 'department', 'position', 'line_manager', 'created_at')
    list_filter = ('business_unit', 'department')
    search_fields = ('user__username', 'user__email', 'position', 'business_unit__code')
    readonly_fields = ('created_at',)
    fieldsets = (
        (None, {
            'fields': ('business_unit', 'user', 'department', 'position', 'line_manager')
        }),
        ('Audit', {
            'classes': ('collapse',),
            'fields': ('created_at',),
        }),
    )
