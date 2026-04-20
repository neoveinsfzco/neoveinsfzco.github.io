from django.conf import settings
from rest_framework import serializers

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


class TrainingCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingCategory
        fields = '__all__'


class TrainingVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingVendor
        fields = '__all__'


class TrainingContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingContent
        fields = '__all__'


class TrainingCourseAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingCourseAttachment
        fields = '__all__'


class TrainingCourseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)

    class Meta:
        model = TrainingCourse
        fields = '__all__'
        read_only_fields = ['course_number', 'created_at', 'created_by']


class TrainingModuleSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = TrainingModule
        fields = '__all__'
        read_only_fields = ['module_number']


class TrainingSectionSerializer(serializers.ModelSerializer):
    module_title = serializers.CharField(source='module.title', read_only=True)

    class Meta:
        model = TrainingSection
        fields = '__all__'


class TrainingSubActivitySerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)
    scorm_launch_url = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSubActivity
        fields = '__all__'

    def get_scorm_launch_url(self, obj):
        if not obj.scorm_launch_path:
            return ''
        request = self.context.get('request')
        relative_url = f'{settings.MEDIA_URL}{obj.scorm_launch_path}'
        if request:
            return request.build_absolute_uri(relative_url)
        return relative_url


class TrainingAssessmentSerializer(serializers.ModelSerializer):
    section_title = serializers.CharField(source='section.title', read_only=True)

    class Meta:
        model = TrainingAssessment
        fields = '__all__'


class TrainingLearningPathCourseSerializer(serializers.ModelSerializer):
    # This grabs the 'title' attribute from the related 'course' object
    course_title = serializers.ReadOnlyField(source='course.title')

    class Meta:
        model = TrainingLearningPathCourse
        fields = ['id', 'learning_path', 'course', 'course_title', 'sequence_order']


class TrainingLearningPathSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingLearningPath
        fields = '__all__'


class TrainingAssignmentItemSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    learning_path_title = serializers.CharField(source='learning_path.title', read_only=True)

    class Meta:
        model = TrainingAssignmentItem
        fields = '__all__'

    def validate(self, attrs):
        course = attrs.get('course') or getattr(self.instance, 'course', None)
        learning_path = attrs.get('learning_path') or getattr(self.instance, 'learning_path', None)
        if course and learning_path:
            raise serializers.ValidationError('Assignment item must have either course or learning path, not both.')
        if not course and not learning_path:
            raise serializers.ValidationError('Assignment item must include a course or learning path.')
        return attrs


class TrainingAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrainingAssignment
        fields = '__all__'

    def validate(self, attrs):
        target_departments = attrs.get('target_departments')
        target_users = attrs.get('target_users')

        if self.instance:
            if target_departments is None:
                target_departments = self.instance.target_departments.all()
            if target_users is None:
                target_users = self.instance.target_users.all()

        has_departments = bool(target_departments)
        has_users = bool(target_users)

        if has_departments and has_users:
            raise serializers.ValidationError('Assignment target must be either departments or users, not both.')
        if not has_departments and not has_users:
            raise serializers.ValidationError('Assignment must target at least one department or user.')
        return attrs


class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(
        source='assignment_item.course.title', read_only=True
    )
    course_id = serializers.IntegerField(
        source='assignment_item.course.id', read_only=True
    )
    learning_path_title = serializers.CharField(
        source='assignment_item.learning_path.title', read_only=True
    )
    learning_path_id = serializers.IntegerField(
        source='assignment_item.learning_path.id', read_only=True
    )
    assignment_title = serializers.CharField(
        source='assignment_item.assignment.title', read_only=True
    )
    assignment_type = serializers.CharField(
        source='assignment_item.assignment.assignment_type', read_only=True
    )

    class Meta:
        model = TrainingEnrollment
        fields = '__all__'


class TrainingEmployeeProfileSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    line_manager_username = serializers.CharField(source='line_manager.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = TrainingEmployeeProfile
        fields = '__all__'
