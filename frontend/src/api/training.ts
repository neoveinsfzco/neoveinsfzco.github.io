import api from './client';

export const fetchTrainingCatalog = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/courses/catalog/', { params: { business_unit: businessUnitId, ...params } });

export const fetchAssignedTraining = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/courses/assigned/', { params: { business_unit: businessUnitId, ...params } });

export const fetchTrainingEnrollments = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/enrollments/', { params: { business_unit: businessUnitId, ...params } });

export const fetchTrainingCategories = (businessUnitId: number) =>
  api.get('training/categories/', { params: { business_unit: businessUnitId, is_active: true } });

export const fetchTrainingVendors = (businessUnitId: number) =>
  api.get('training/vendors/', { params: { business_unit: businessUnitId, is_active: true } });

export const fetchTrainingCourses = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/courses/', { params: { business_unit: businessUnitId, ...params } });

const buildFormData = (payload: Record<string, any>) => {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => form.append(key, String(item)));
      return;
    }
    form.append(key, value as any);
  });
  return form;
};

export const createTrainingCourse = (payload: Record<string, any>) =>
  api.post('training/courses/', buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateTrainingCourse = (id: number, payload: Record<string, any>) =>
  api.patch(`training/courses/${id}/`, buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchTrainingModules = (courseId: number) =>
  api.get('training/modules/', { params: { course: courseId } });

export const createTrainingModule = (payload: Record<string, any>) =>
  api.post('training/modules/', payload);

export const fetchTrainingSections = (moduleId: number) =>
  api.get('training/sections/', { params: { module: moduleId } });

export const createTrainingSection = (payload: Record<string, any>) =>
  api.post('training/sections/', payload);

export const fetchTrainingSubActivities = (sectionId: number) =>
  api.get('training/subactivities/', { params: { section: sectionId } });

export const createTrainingSubActivity = (payload: Record<string, any>) =>
  api.post('training/subactivities/', buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchTrainingAssessments = (sectionId: number) =>
  api.get('training/assessments/', { params: { section: sectionId } });

export const upsertTrainingAssessment = (id: number | null, payload: Record<string, any>) =>
  id ? api.patch(`training/assessments/${id}/`, payload) : api.post('training/assessments/', payload);

export const fetchTrainingAssignments = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/assignments/', { params: { business_unit: businessUnitId, ...params } });

export const createTrainingAssignment = (payload: Record<string, any>) =>
  api.post('training/assignments/', payload);

export const createTrainingAssignmentItem = (payload: Record<string, any>) =>
  api.post('training/assignment-items/', payload);

export const generateTrainingEnrollments = (assignmentId: number, payload: Record<string, any>) =>
  api.post(`training/assignments/${assignmentId}/generate-enrollments/`, payload);

export const fetchTrainingProfiles = (businessUnitId: number, params: Record<string, any> = {}) =>
  api.get('training/employee-profiles/', { params: { business_unit: businessUnitId, ...params } });

export const fetchManagerEnrollments = (businessUnitId: number) =>
  api.get('training/enrollments/manager/', { params: { business_unit: businessUnitId } });

export const updateTrainingEnrollment = (id: number, payload: Record<string, any>) =>
  api.patch(`training/enrollments/${id}/`, payload);

export const fetchTrainingCourseAttachments = (courseId: number) =>
  api.get('training/course-attachments/', { params: { course: courseId } });

export const createTrainingCourseAttachment = (payload: Record<string, any>) =>
  api.post('training/course-attachments/', buildFormData(payload), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchTrainingLearningPaths = (businessUnitId: number) =>
  api.get('training/learning-paths/', { params: { business_unit: businessUnitId } });

export const createTrainingLearningPath = (payload: Record<string, any>) =>
  api.post('training/learning-paths/', payload);

export const updateTrainingLearningPath = (id: number, payload: Record<string, any>) =>
  api.patch(`training/learning-paths/${id}/`, payload);

export const deleteTrainingLearningPath = (id: number) =>
  api.delete(`training/learning-paths/${id}/`);

export const fetchTrainingLearningPathCourses = (learningPathId: number) =>
  api.get('training/learning-path-courses/', { params: { learning_path: learningPathId } });

export const createTrainingLearningPathCourse = (payload: Record<string, any>) =>
  api.post('training/learning-path-courses/', payload);
