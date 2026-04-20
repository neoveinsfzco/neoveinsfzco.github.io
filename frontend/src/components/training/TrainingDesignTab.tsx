import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  createTrainingCourse,
  updateTrainingCourse,
  createTrainingModule,
  createTrainingSection,
  createTrainingSubActivity,
  createTrainingCourseAttachment,
  fetchTrainingCategories,
  fetchTrainingCourseAttachments,
  fetchTrainingCourses,
  fetchTrainingModules,
  fetchTrainingSections,
  fetchTrainingSubActivities,
  fetchTrainingVendors,
  fetchTrainingAssessments,
  upsertTrainingAssessment,
} from '../../api/training';

interface TrainingDesignTabProps {
  businessUnitId: number | '';
}

export const TrainingDesignTab: React.FC<TrainingDesignTabProps> = ({ businessUnitId }) => {
  const getActivityAccept = (contentType: string) => {
    if (contentType === 'PDF') return '.pdf,application/pdf';
    if (contentType === 'PPT') {
      return '.ppt,.pptx,.pps,.ppsx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    if (contentType === 'SCORM') return '.zip,application/zip,application/x-zip-compressed';
    if (contentType === 'VIDEO') return 'video/*';
    return '*/*';
  };

  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subActivities, setSubActivities] = useState<any[]>([]);
  const [sectionsByModule, setSectionsByModule] = useState<Record<number, any[]>>({});
  const [activitiesBySection, setActivitiesBySection] = useState<Record<number, any[]>>({});
  const [assessmentId, setAssessmentId] = useState<number | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    objectives: '',
    publish_start_date: '',
    publish_end_date: '',
    min_effort_hours: '',
    max_effort_hours: '',
    mandatory_enabled: false,
    validity_years: 1,
    delivery_type: 'INHOUSE',
    accreditation_enabled: false,
    accreditation_number: '',
    accreditation_body: '',
    vendor: '',
    category: '',
    status: 'DRAFT',
  });

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    module_type: 'SELF_PACED',
    publish_start_date: '',
    publish_end_date: '',
    approval_required: false,
    is_sequential: false,
    order_index: 1,
  });

  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    section_type: 'READING',
    sequence_order: 1,
    is_mandatory: true,
    completion_mode: 'PER_SECTION',
  });

  const [subActivityForm, setSubActivityForm] = useState({
    title: '',
    description: '',
    content_type: 'PDF',
    external_url: '',
    sequence_order: 1,
    is_mandatory: true,
  });
  const [subActivityFile, setSubActivityFile] = useState<File | null>(null);

  const [assessmentForm, setAssessmentForm] = useState({
    attempts_allowed: 1,
    passing_score: 0,
    scoring_mode: 'SUM',
    time_limit_minutes: '',
    is_feedback: false,
  });
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);
  const [courseAttachments, setCourseAttachments] = useState<any[]>([]);
  const [courseFiles, setCourseFiles] = useState<{ cover?: File; trailer?: File }>({});
  const [attachmentForm, setAttachmentForm] = useState({
    title: '',
    visibility: 'ALL',
    file: null as File | null,
  });
  const [courseError, setCourseError] = useState('');
  const [moduleError, setModuleError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    if (!businessUnitId) {
      setCourses([]);
      return;
    }
    fetchTrainingCourses(businessUnitId).then((res) => setCourses(res.data.results || []));
    fetchTrainingCategories(businessUnitId).then((res) => setCategories(res.data.results || []));
    fetchTrainingVendors(businessUnitId).then((res) => setVendors(res.data.results || []));
  }, [businessUnitId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setModules([]);
      setSelectedModuleId(null);
      setCourseAttachments([]);
      setSectionsByModule({});
      setActivitiesBySection({});
      return;
    }
    fetchTrainingModules(selectedCourseId).then((res) => setModules(res.data.results || []));
    fetchTrainingCourseAttachments(selectedCourseId).then((res) => setCourseAttachments(res.data.results || []));
  }, [selectedCourseId]);

  useEffect(() => {
    const loadAllSections = async () => {
      const next: Record<number, any[]> = {};
      for (const mod of modules) {
        const res = await fetchTrainingSections(mod.id);
        next[mod.id] = res.data.results || [];
      }
      setSectionsByModule(next);
    };
    if (modules.length) {
      loadAllSections();
    }
  }, [modules]);

  useEffect(() => {
    const loadActivities = async () => {
      const next: Record<number, any[]> = {};
      const allSections = Object.values(sectionsByModule).flat();
      for (const section of allSections) {
        const res = await fetchTrainingSubActivities(section.id);
        next[section.id] = res.data.results || [];
      }
      setActivitiesBySection(next);
    };
    if (Object.keys(sectionsByModule).length) {
      loadActivities();
    }
  }, [sectionsByModule]);

  useEffect(() => {
    if (!selectedModuleId) {
      setSections([]);
      setSelectedSectionId(null);
      return;
    }
    fetchTrainingSections(selectedModuleId).then((res) => setSections(res.data.results || []));
  }, [selectedModuleId]);

  useEffect(() => {
    if (!selectedSectionId) {
      setSubActivities([]);
      setAssessmentId(null);
      return;
    }
    fetchTrainingSubActivities(selectedSectionId).then((res) => setSubActivities(res.data.results || []));
    fetchTrainingAssessments(selectedSectionId).then((res) => {
      const found = res.data.results?.[0] || null;
      setAssessmentId(found?.id || null);
      if (found) {
        setAssessmentForm({
          attempts_allowed: found.attempts_allowed ?? 1,
          passing_score: found.passing_score ?? 0,
          scoring_mode: found.scoring_mode ?? 'SUM',
          time_limit_minutes: found.time_limit_minutes ?? '',
          is_feedback: found.is_feedback ?? false,
        });
        setAssessmentQuestions(found.questions || []);
      }
    });
  }, [selectedSectionId]);

  const courseColumns: GridColDef[] = useMemo(
    () => [
      { field: 'course_number', headerName: 'Course #', minWidth: 140, flex: 1 },
      { field: 'title', headerName: 'Title', minWidth: 200, flex: 1.5 },
      { field: 'status', headerName: 'Status', minWidth: 100, flex: 0.7 },
    ],
    [],
  );

  if (!businessUnitId) {
    return (
      <Typography variant="body2" color="text.secondary">
        Select a Business Unit to design training courses.
      </Typography>
    );
  }
  // Find the title of the selected module
  const selectedModuleTitle = useMemo(() => {
    return modules.find((m) => m.id === selectedModuleId) || 'None';
  }, [modules, selectedModuleId]);

  // Find the title of the selected section
  const selectedSectionTitle = useMemo(() => {
    return sections.find((s) => s.id === selectedSectionId) || 'None';
  }, [sections, selectedSectionId]);


  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Course Builder
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <DataGrid
              autoHeight
              rows={courses}
              columns={courseColumns}
              onRowClick={(params) => {
                const row = params.row;
                setSelectedCourseId(row.id);
                setCourseForm({
                  title: row.title || '',
                  description: row.description || '',
                  objectives: row.objectives || '',
                  publish_start_date: row.publish_start_date || '',
                  publish_end_date: row.publish_end_date || '',
                  min_effort_hours: row.min_effort_hours || '',
                  max_effort_hours: row.max_effort_hours || '',
                  mandatory_enabled: row.mandatory_enabled || false,
                  validity_years: row.validity_years || 1,
                  delivery_type: row.delivery_type || 'INHOUSE',
                  accreditation_enabled: row.accreditation_enabled || false,
                  accreditation_number: row.accreditation_number || '',
                  accreditation_body: row.accreditation_body || '',
                  vendor: row.vendor || '',
                  category: row.category || '',
                  status: row.status || 'DRAFT',
                });
              }}
              pageSizeOptions={[25, 50, 100]}
              sx={{ minHeight: 280 }}
            />
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <TextField
                label="Title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              />
              <TextField
                label="Objectives"
                multiline
                minRows={2}
                value={courseForm.objectives}
                onChange={(e) => setCourseForm({ ...courseForm, objectives: e.target.value })}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Publish Start"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={courseForm.publish_start_date}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, publish_start_date: e.target.value })
                  }
                />
                <TextField
                  label="Publish End"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={courseForm.publish_end_date}
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, publish_end_date: e.target.value })
                  }
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Min Hours"
                  type="number"
                  value={courseForm.min_effort_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, min_effort_hours: e.target.value })}
                />
                <TextField
                  label="Max Hours"
                  type="number"
                  value={courseForm.max_effort_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, max_effort_hours: e.target.value })}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Category"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Vendor"
                  value={courseForm.vendor}
                  onChange={(e) => setCourseForm({ ...courseForm, vendor: e.target.value })}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {vendors.map((vendor) => (
                    <MenuItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Delivery"
                  value={courseForm.delivery_type}
                  onChange={(e) => setCourseForm({ ...courseForm, delivery_type: e.target.value })}
                >
                  <MenuItem value="INHOUSE">In-house</MenuItem>
                  <MenuItem value="VENDOR">Vendor</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Status"
                  value={courseForm.status}
                  onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                >
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="PUBLISHED">Published</MenuItem>
                  <MenuItem value="ARCHIVED">Archived</MenuItem>
                </TextField>
              </Stack>
              <Button
                variant="contained"
                onClick={() =>
                  (() => {
                    if (!courseForm.title || !courseForm.publish_start_date) {
                      setCourseError('Title and publish start date are required.');
                      return Promise.resolve();
                    }
                    setCourseError('');
                    return (selectedCourseId
                      ? updateTrainingCourse(selectedCourseId, {
                          ...courseForm,
                          cover_image: courseFiles.cover,
                          trailer_video: courseFiles.trailer,
                        })
                      : createTrainingCourse({
                          ...courseForm,
                          business_unit: businessUnitId,
                          cover_image: courseFiles.cover,
                          trailer_video: courseFiles.trailer,
                        })
                    ).then(() =>
                      fetchTrainingCourses(businessUnitId).then((res) => setCourses(res.data.results || [])),
                    );
                  })()
                }
              >
                {selectedCourseId ? 'Update Course' : 'Save Course'}
              </Button>
              {courseError && (
                <Typography variant="body2" color="error">
                  {courseError}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
        
        {selectedCourseId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Course Tree
            </Typography>
            <Box sx={{ pl: 1 }}>
              {modules.map((mod) => (
                <Box key={mod.id} sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {`> ${mod.title}`}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {(sectionsByModule[mod.id] || []).map((section) => (
                      <Box key={section.id} sx={{ mb: 0.5 }}>
                        <Typography variant="body2">
                          {`- ${section.title}`} {section.is_mandatory ? '(Mandatory)' : '(Optional)'}
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          {(activitiesBySection[section.id] || []).map((activity) => (
                            <Typography key={activity.id} variant="caption" color="text.secondary">
                              {`* ${activity.title}`} {activity.is_mandatory ? '(M)' : '(O)'}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Course Media & Attachments
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <Button variant="outlined" component="label">
                Upload Cover Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) =>
                    setCourseFiles((prev) => ({ ...prev, cover: e.target.files?.[0] }))
                  }
                />
              </Button>
              <Button variant="outlined" component="label">
                Upload Trailer Video
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  onChange={(e) =>
                    setCourseFiles((prev) => ({ ...prev, trailer: e.target.files?.[0] }))
                  }
                />
              </Button>
            </Stack>
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <TextField
                label="Attachment Title"
                value={attachmentForm.title}
                onChange={(e) => setAttachmentForm({ ...attachmentForm, title: e.target.value })}
              />
              <TextField
                select
                label="Visibility"
                value={attachmentForm.visibility}
                onChange={(e) => setAttachmentForm({ ...attachmentForm, visibility: e.target.value })}
              >
                <MenuItem value="ALL">All learners</MenuItem>
                <MenuItem value="TRAINING_ONLY">Training team only</MenuItem>
                <MenuItem value="MANAGERS_ONLY">Managers only</MenuItem>
              </TextField>
              <Button variant="outlined" component="label">
                Choose Attachment File
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    setAttachmentForm({ ...attachmentForm, file: e.target.files?.[0] || null })
                  }
                />
              </Button>
              <Button
                variant="contained"
                disabled={!selectedCourseId || !attachmentForm.file}
                onClick={() => {
                  if (!selectedCourseId || !attachmentForm.file) return;
                  createTrainingCourseAttachment({
                    course: selectedCourseId,
                    title: attachmentForm.title || 'Attachment',
                    visibility: attachmentForm.visibility,
                    file: attachmentForm.file,
                  }).then(() =>
                    fetchTrainingCourseAttachments(selectedCourseId).then((res) =>
                      setCourseAttachments(res.data.results || []),
                    ),
                  );
                }}
              >
                Upload Attachment
              </Button>
            </Stack>
          </Box>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <DataGrid
            autoHeight
            rows={courseAttachments}
            columns={[
              { field: 'title', headerName: 'Attachment', minWidth: 200, flex: 1.4 },
              { field: 'visibility', headerName: 'Visibility', minWidth: 160, flex: 0.8 },
            ]}
            pageSizeOptions={[25, 50, 100]}
            sx={{ minHeight: 180 }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Modules
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <Stack spacing={1}>
              {modules.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No modules added yet.
                </Typography>
              )}
              {modules.map((mod) => (
                <Paper key={mod.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                    <Box>
                      <Typography fontWeight={600}>{mod.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mod.module_number} - {mod.module_type}
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => setSelectedModuleId(mod.id)}>
                      Select
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              {selectedModuleId && (
                <Typography variant="caption" color="text.secondary">
                  Selected Module: {selectedModuleTitle.title} (Order: {selectedModuleTitle.order_index})
                </Typography>
              )}
              <TextField
                label="Title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Type"
                  value={moduleForm.module_type}
                  onChange={(e) => setModuleForm({ ...moduleForm, module_type: e.target.value })}
                >
                  <MenuItem value="INSTRUCTOR_LED">Instructor Led</MenuItem>
                  <MenuItem value="SELF_PACED">Self Paced</MenuItem>
                  <MenuItem value="BLENDED">Blended</MenuItem>
                </TextField>
                <TextField
                  label="Order"
                  type="number"
                  value={moduleForm.order_index}
                  onChange={(e) => setModuleForm({ ...moduleForm, order_index: Number(e.target.value) })}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Publish Start"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={moduleForm.publish_start_date}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, publish_start_date: e.target.value })
                  }
                />
                <TextField
                  label="Publish End"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={moduleForm.publish_end_date}
                  onChange={(e) =>
                    setModuleForm({ ...moduleForm, publish_end_date: e.target.value })
                  }
                />
              </Stack>
              <Button
                variant="contained"
                disabled={!selectedCourseId}
                onClick={() => {
                  if (!selectedCourseId) return;
                  if (!moduleForm.title || !moduleForm.publish_start_date) {
                    setModuleError('Module title and publish start date are required.');
                    return;
                  }
                  setModuleError('');
                  createTrainingModule({ ...moduleForm, course: selectedCourseId })
                    .then(() => fetchTrainingModules(selectedCourseId).then((res) => setModules(res.data.results || [])));
                }}
              >
                Add Module
              </Button>
              {moduleError && (
                <Typography variant="body2" color="error">
                  {moduleError}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Sections & Activities
        </Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <Stack spacing={1}>
              {!selectedModuleId && (
                <Typography variant="body2" color="text.secondary">
                  Select a module to add sections.
                </Typography>
              )}
              {selectedModuleId &&
                sections.map((section) => (
                  <Paper key={section.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between">
                      <Box>
                        <Typography fontWeight={600}>{section.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.section_type} - {section.is_mandatory ? 'Mandatory' : 'Optional'}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => setSelectedSectionId(section.id)}>
                        Select
                      </Button>
                    </Stack>
                  </Paper>
                ))}
            </Stack>
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              {selectedSectionId && (
                <Typography variant="caption" color="text.secondary">
                  Selected Section: {selectedSectionTitle.title} (Order: {selectedSectionTitle.sequence_order})
                </Typography>
              )}
              <TextField
                label="Title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={sectionForm.description}
                onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Type"
                  value={sectionForm.section_type}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })}
                >
                  <MenuItem value="READING">Reading</MenuItem>
                  <MenuItem value="ASSESSMENT">Assessment</MenuItem>
                  <MenuItem value="FEEDBACK">Feedback</MenuItem>
                  <MenuItem value="RECORDED">Recorded</MenuItem>
                </TextField>
                <TextField
                  label="Order"
                  type="number"
                  value={sectionForm.sequence_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, sequence_order: Number(e.target.value) })}
                />
              </Stack>
              <TextField
                select
                label="Completion"
                value={sectionForm.completion_mode}
                onChange={(e) => setSectionForm({ ...sectionForm, completion_mode: e.target.value })}
              >
                <MenuItem value="PER_SECTION">Per Section</MenuItem>
                <MenuItem value="PER_ACTIVITY">Per Activity</MenuItem>
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={sectionForm.is_mandatory}
                    onChange={(e) => setSectionForm({ ...sectionForm, is_mandatory: e.target.checked })}
                  />
                }
                label="Mandatory Section"
              />
              <Button
                variant="contained"
                disabled={!selectedModuleId}
                onClick={() => {
                  if (!selectedModuleId) return;
                  if (!sectionForm.title) {
                    setSectionError('Section title is required.');
                    return;
                  }
                  setSectionError('');
                  createTrainingSection({ ...sectionForm, module: selectedModuleId })
                    .then(() =>
                      fetchTrainingSections(selectedModuleId).then((res) => {
                        const updated = res.data.results || [];
                        setSections(updated);
                        setSectionsByModule((prev) => ({ ...prev, [selectedModuleId]: updated }));
                      }),
                    );
                }}
              >
                Add Section
              </Button>
              {sectionError && (
                <Typography variant="body2" color="error">
                  {sectionError}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box flex={1}>
            <Stack spacing={1}>
              {!selectedSectionId && (
                <Typography variant="body2" color="text.secondary">
                  Select a section to add activities.
                </Typography>
              )}
              {selectedSectionId &&
                subActivities.map((activity) => (
                  <Paper key={activity.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography fontWeight={600}>{activity.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.content_type} - {activity.is_mandatory ? 'Mandatory' : 'Optional'}
                    </Typography>
                  </Paper>
                ))}
            </Stack>
          </Box>
          <Box flex={1}>
            <Stack spacing={1.5}>
              <TextField
                label="Activity Title"
                value={subActivityForm.title}
                onChange={(e) => setSubActivityForm({ ...subActivityForm, title: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                minRows={2}
                value={subActivityForm.description}
                onChange={(e) => setSubActivityForm({ ...subActivityForm, description: e.target.value })}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Content Type"
                  value={subActivityForm.content_type}
                  onChange={(e) => setSubActivityForm({ ...subActivityForm, content_type: e.target.value })}
                >
                  <MenuItem value="PDF">PDF</MenuItem>
                  <MenuItem value="PPT">PowerPoint</MenuItem>
                  <MenuItem value="SCORM">SCORM</MenuItem>
                  <MenuItem value="VIDEO">Video</MenuItem>
                  <MenuItem value="ASSESSMENT">Assessment</MenuItem>
                  <MenuItem value="COVER">Cover Page</MenuItem>
                </TextField>
                <TextField
                  label="Order"
                  type="number"
                  value={subActivityForm.sequence_order}
                  onChange={(e) => setSubActivityForm({ ...subActivityForm, sequence_order: Number(e.target.value) })}
                />
              </Stack>
              <TextField
                label="External URL"
                value={subActivityForm.external_url}
                onChange={(e) => setSubActivityForm({ ...subActivityForm, external_url: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={subActivityForm.is_mandatory}
                    onChange={(e) => setSubActivityForm({ ...subActivityForm, is_mandatory: e.target.checked })}
                  />
                }
                label="Mandatory Activity"
              />
              <Button variant="outlined" component="label">
                Upload Activity File
                <input
                  type="file"
                  hidden
                  accept={getActivityAccept(subActivityForm.content_type)}
                  onChange={(e) => setSubActivityFile(e.target.files?.[0] || null)}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {subActivityForm.content_type === 'SCORM'
                  ? 'Upload a SCORM zip package with imsmanifest.xml and an HTML launch page.'
                  : subActivityForm.content_type === 'PPT'
                    ? 'Upload a PowerPoint file or provide an external presentation URL.'
                    : 'Upload the activity content file or provide an external URL.'}
              </Typography>
              <Button
                variant="contained"
                disabled={!selectedSectionId}
                onClick={() => {
                  if (!selectedSectionId) return;
                  if (!subActivityForm.title) {
                    setActivityError('Activity title is required.');
                    return;
                  }
                  setActivityError('');
                  createTrainingSubActivity({
                    ...subActivityForm,
                    section: selectedSectionId,
                    file: subActivityFile,
                  })
                    .then(() =>
                      fetchTrainingSubActivities(selectedSectionId).then((res) => {
                        const updated = res.data.results || [];
                        setSubActivities(updated);
                        setActivitiesBySection((prev) => ({ ...prev, [selectedSectionId]: updated }));
                      }),
                    );
                }}
              >
                Add Activity
              </Button>
              {activityError && (
                <Typography variant="body2" color="error">
                  {activityError}
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Assessment / Feedback Settings
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Attempts"
              type="number"
              value={assessmentForm.attempts_allowed}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, attempts_allowed: Number(e.target.value) })}
            />
            <TextField
              label="Passing Score"
              type="number"
              value={assessmentForm.passing_score}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_score: Number(e.target.value) })}
            />
            <TextField
              label="Time Limit (min)"
              type="number"
              value={assessmentForm.time_limit_minutes}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, time_limit_minutes: e.target.value })}
            />
          </Stack>
          <TextField
            select
            label="Scoring Mode"
            value={assessmentForm.scoring_mode}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, scoring_mode: e.target.value })}
          >
            <MenuItem value="SUM">Sum</MenuItem>
            <MenuItem value="AVERAGE">Average</MenuItem>
          </TextField>
          <TextField
            select
            label="Is Feedback"
            value={assessmentForm.is_feedback ? 'yes' : 'no'}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, is_feedback: e.target.value === 'yes' })}
          >
            <MenuItem value="no">No</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
          </TextField>
          <Typography variant="subtitle2">Questions</Typography>
          <Stack spacing={1}>
            {assessmentQuestions.map((q, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <TextField
                    label={`Question ${index + 1}`}
                    value={q.prompt || ''}
                    onChange={(e) => {
                      const next = [...assessmentQuestions];
                      next[index] = { ...next[index], prompt: e.target.value };
                      setAssessmentQuestions(next);
                    }}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      select
                      label="Type"
                      value={q.type || 'MCQ'}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        next[index] = { ...next[index], type: e.target.value };
                        setAssessmentQuestions(next);
                      }}
                    >
                      <MenuItem value="MCQ">Multiple Choice</MenuItem>
                      <MenuItem value="TRUE_FALSE">True/False</MenuItem>
                      <MenuItem value="SHORT">Short Answer</MenuItem>
                    </TextField>
                    <TextField
                      label="Points"
                      type="number"
                      value={q.points || 1}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        next[index] = { ...next[index], points: Number(e.target.value) };
                        setAssessmentQuestions(next);
                      }}
                    />
                  </Stack>
                  {(q.type || 'MCQ') !== 'SHORT' && (
                    <TextField
                      label="Options (comma separated)"
                      value={(q.options || []).join(', ')}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        const options = e.target.value
                          .split(',')
                          .map((opt) => opt.trim())
                          .filter(Boolean);
                        next[index] = { ...next[index], options };
                        setAssessmentQuestions(next);
                      }}
                    />
                  )}
                  {(q.type || 'MCQ') !== 'SHORT' && (
                    <TextField
                      label="Correct Answer"
                      value={q.correct || ''}
                      onChange={(e) => {
                        const next = [...assessmentQuestions];
                        next[index] = { ...next[index], correct: e.target.value };
                        setAssessmentQuestions(next);
                      }}
                    />
                  )}
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              onClick={() =>
                setAssessmentQuestions((prev) => [...prev, { prompt: '', type: 'MCQ', options: [], correct: '', points: 1 }])
              }
            >
              Add Question
            </Button>
          </Stack>
          <Button
            variant="contained"
            disabled={!selectedSectionId}
            onClick={() => {
              if (!selectedSectionId) return;
              const payload = {
                section: selectedSectionId,
                attempts_allowed: assessmentForm.attempts_allowed,
                passing_score: assessmentForm.passing_score,
                scoring_mode: assessmentForm.scoring_mode,
                time_limit_minutes: assessmentForm.time_limit_minutes || null,
                questions: assessmentQuestions,
                is_feedback: assessmentForm.is_feedback,
              };
              upsertTrainingAssessment(assessmentId, payload)
                .then((res) => {
                  if (!assessmentId) setAssessmentId(res.data.id);
                });
            }}
          >
            Save Assessment
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};






