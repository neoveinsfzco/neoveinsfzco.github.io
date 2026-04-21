import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { resolveBackendFileUrl } from '../api/config';
import {
  fetchTrainingCourseAttachments,
  fetchTrainingLearningPathCourses,
  fetchTrainingModules,
  fetchTrainingSections,
  fetchTrainingSubActivities,
  updateTrainingEnrollment,
} from '../api/training';

interface PdfLoadSuccess {
  numPages: number;
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const isVideoFile = (url?: string) =>
  !!url && ['.mp4', '.webm', '.ogg'].some((ext) => url.toLowerCase().endsWith(ext));

const isPdfFile = (url?: string) => !!url && url.toLowerCase().endsWith('.pdf');
const isPowerPointFile = (url?: string) =>
  !!url && ['.ppt', '.pptx', '.pps', '.ppsx'].some((ext) => url.toLowerCase().endsWith(ext));

const isLocalUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['127.0.0.1', 'localhost'].includes(parsed.hostname);
  } catch {
    return false;
  }
};

const getOfficeViewerUrl = (url?: string) =>
  url ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : '';

const getEmbeddedVideoUrl = (url?: string) => {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
    }

    if (host === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
    }

    if (host === 'vimeo.com') {
      const videoId = parsed.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }

    return url;
  } catch {
    return url;
  }
};

const isEmbeddableVideoUrl = (url?: string) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return [
      'youtube.com',
      'm.youtube.com',
      'youtu.be',
      'vimeo.com',
      'player.vimeo.com',
    ].includes(host);
  } catch {
    return false;
  }
};

export const TrainingCoursePage: React.FC = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get('enrollment');
  const [course, setCourse] = useState<any | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [sectionsByModule, setSectionsByModule] = useState<Record<number, any[]>>({});
  const [activitiesBySection, setActivitiesBySection] = useState<Record<number, any[]>>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [learningPathCourseIds, setLearningPathCourseIds] = useState<number[]>([]);
  const [activityReady, setActivityReady] = useState(false);
  const [pdfPages, setPdfPages] = useState(0);
  const [pdfHasUserScrolled, setPdfHasUserScrolled] = useState(false);
  const pdfScrollRef = useRef<HTMLDivElement | null>(null);
  const pdfEndRef = useRef<HTMLDivElement | null>(null);
  const lastVideoTimeRef = useRef(0);

  useEffect(() => {
    if (!courseId) return;
    api.get(`training/courses/${courseId}/`).then((res) => setCourse(res.data));
    fetchTrainingModules(Number(courseId)).then((res) => setModules(res.data.results || []));
    fetchTrainingCourseAttachments(Number(courseId)).then((res) =>
      setAttachments(res.data.results || []),
    );
    const loadEnrollment = async () => {
      if (enrollmentId) {
        const exact = await api.get(`training/enrollments/${enrollmentId}/`);
        setEnrollment(exact.data);
        if (exact.data.learning_path_id) {
          const pathCourses = await fetchTrainingLearningPathCourses(exact.data.learning_path_id);
          setLearningPathCourseIds(
            (pathCourses.data.results || [])
              .sort((a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0))
              .map((item: any) => item.course),
          );
        } else {
          setLearningPathCourseIds([]);
        }
        return;
      }
      const direct = await api.get('training/enrollments/', {
        params: { mine: 1, assignment_item__course: courseId },
      });
      const directItem = direct.data.results?.[0] || null;
      if (directItem) {
        setEnrollment(directItem);
        setLearningPathCourseIds([]);
        return;
      }
      const pathCourses = await api.get('training/learning-path-courses/', {
        params: { course: courseId },
      });
      const pathId = pathCourses.data.results?.[0]?.learning_path;
      if (!pathId) {
        setEnrollment(null);
        return;
      }
      const pathEnrollment = await api.get('training/enrollments/', {
        params: { mine: 1, assignment_item__learning_path: pathId },
      });
      const enrollmentRecord = pathEnrollment.data.results?.[0] || null;
      setEnrollment(enrollmentRecord);
      if (pathId) {
        const pathCourses = await fetchTrainingLearningPathCourses(pathId);
        setLearningPathCourseIds(
          (pathCourses.data.results || [])
            .sort((a: any, b: any) => (a.sequence_order || 0) - (b.sequence_order || 0))
            .map((item: any) => item.course),
        );
      }
    };
    loadEnrollment();
  }, [courseId, enrollmentId]);

  useEffect(() => {
    const loadSections = async () => {
      const next: Record<number, any[]> = {};
      for (const module of modules) {
        const res = await fetchTrainingSections(module.id);
        next[module.id] = res.data.results || [];
      }
      setSectionsByModule(next);
    };
    if (modules.length) {
      loadSections();
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
    setActivityReady(false);
    setPdfPages(0);
    setPdfHasUserScrolled(false);
    lastVideoTimeRef.current = 0;
  }, [selectedActivity?.id]);

  const attachmentItems = useMemo(
    () =>
      attachments.map((att) => ({
        ...att,
        url: resolveBackendFileUrl(att.file),
      })),
    [attachments],
  );

  const completedActivities = new Set<number>(enrollment?.progress?.completedActivities || []);
  const completedActivityTimestamps = enrollment?.progress?.completedActivityTimestamps || {};

  const allMandatoryActivityIds = Object.values(activitiesBySection)
    .flat()
    .filter((activity) => activity.is_mandatory)
    .map((activity) => activity.id);

  const isSectionCompleted = (sectionId: number) => {
    const activities = activitiesBySection[sectionId] || [];
    const mandatoryIds = activities.filter((a) => a.is_mandatory).map((a) => a.id);
    return mandatoryIds.every((id) => completedActivities.has(id));
  };

  const isModuleCompleted = (moduleId: number) => {
    const moduleSections = sectionsByModule[moduleId] || [];
    const mandatorySections = moduleSections.filter((section) => section.is_mandatory);
    return mandatorySections.every((section) => isSectionCompleted(section.id));
  };

  const isModuleOpen = (module: any) => {
    const orderedModules = modules
      .slice()
      .sort(
        (a, b) =>
          (a.order_index || 0) - (b.order_index || 0) || String(a.title || '').localeCompare(String(b.title || '')),
      );
    const index = orderedModules.findIndex((item) => item.id === module.id);
    if (index <= 0) return true;
    const previousModules = orderedModules.slice(0, index);
    return previousModules.every((item) => isModuleCompleted(item.id));
  };

  const isSectionOpen = (moduleId: number, section: any) => {
    const currentModule = modules.find((module) => module.id === moduleId);
    if (currentModule && !isModuleOpen(currentModule)) {
      return false;
    }
    const moduleSections = (sectionsByModule[moduleId] || [])
      .slice()
      .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
    const index = moduleSections.findIndex((s) => s.id === section.id);
    if (index <= 0) return true;
    const previousSections = moduleSections.slice(0, index);
    const mandatoryPrev = previousSections.filter((s) => s.is_mandatory);
    return mandatoryPrev.every((s) => isSectionCompleted(s.id));
  };

  const isActivityOpen = (sectionId: number, activity: any) => {
    const activities = (activitiesBySection[sectionId] || [])
      .slice()
      .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
    const index = activities.findIndex((a) => a.id === activity.id);
    if (index <= 0) return true;
    const prev = activities.slice(0, index).filter((a) => a.is_mandatory);
    return prev.every((a) => completedActivities.has(a.id));
  };

  const checkPdfCompletion = () => {
    const container = pdfScrollRef.current;
    const endMarker = pdfEndRef.current;
    if (!container) return;
    const threshold = 16;
    const requiresScroll = container.scrollHeight > container.clientHeight + threshold;
    if (requiresScroll && !pdfHasUserScrolled) {
      return;
    }
    const isAtBottomByScroll =
      container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    const isAtBottomByElement =
      !!endMarker &&
      endMarker.getBoundingClientRect().bottom <=
        container.getBoundingClientRect().bottom + threshold;
    if (isAtBottomByScroll || isAtBottomByElement) {
      setActivityReady(true);
    }
  };

  const activityUrl = resolveBackendFileUrl(selectedActivity?.file) || selectedActivity?.external_url || '';
  const activityIsVideo =
    selectedActivity?.content_type === 'VIDEO' || isVideoFile(activityUrl);
  const activityIsPdf =
    selectedActivity?.content_type === 'PDF' || isPdfFile(activityUrl);
  const activityIsPowerPoint =
    selectedActivity?.content_type === 'PPT' || isPowerPointFile(activityUrl);
  const activityIsScorm = selectedActivity?.content_type === 'SCORM';
  const activityUsesEmbeddedVideo =
    !!selectedActivity?.external_url && !selectedActivity?.file && isEmbeddableVideoUrl(selectedActivity.external_url);
  const embeddedVideoUrl = getEmbeddedVideoUrl(selectedActivity?.external_url);
  const powerPointViewerUrl =
    activityIsPowerPoint && activityUrl && !isLocalUrl(activityUrl)
      ? getOfficeViewerUrl(activityUrl)
      : '';
  const scormLaunchUrl = selectedActivity?.scorm_launch_url || '';
  const selectedActivityCompleted = !!selectedActivity && completedActivities.has(selectedActivity.id);
  const selectedActivityCompletedAt =
    selectedActivity && selectedActivityCompleted
      ? completedActivityTimestamps[String(selectedActivity.id)] ||
        completedActivityTimestamps[selectedActivity.id] ||
        enrollment?.completed_at ||
        null
      : null;

  useEffect(() => {
    if (!selectedActivity || activityIsVideo || activityIsPdf) return;
    const timer = window.setTimeout(() => setActivityReady(true), 15000);
    return () => window.clearTimeout(timer);
  }, [selectedActivity?.id, activityIsVideo, activityIsPdf]);

  if (!course) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading course...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack spacing={1}>
          <Typography variant="h5">{course.title}</Typography>
          <Typography variant="subtitle2">{course.course_number}</Typography>
          <Stack direction="row" spacing={1}>
            <Chip label={course.status} />
            <Chip label={course.delivery_type} />
            {course.category_name && <Chip label={course.category_name} />}
          </Stack>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {course.description || 'No description'}
          </Typography>
          {course.cover_image && (
            <Box sx={{ mt: 2 }}>
              <img
                src={resolveBackendFileUrl(course.cover_image)}
                alt="Course cover"
                style={{ maxWidth: '100%', borderRadius: 12 }}
              />
            </Box>
          )}
          {course.trailer_video && (
            <Box sx={{ mt: 2 }}>
              <a href={resolveBackendFileUrl(course.trailer_video)} target="_blank" rel="noreferrer">
                View Trailer Video
              </a>
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Attachments
        </Typography>
        <Stack spacing={1}>
          {attachmentItems.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No attachments uploaded.
            </Typography>
          )}
          {attachmentItems.map((att) => (
            <Stack key={att.id} direction="row" spacing={1} alignItems="center">
              <Typography>{att.title}</Typography>
              {att.url && (
                <a href={att.url} target="_blank" rel="noreferrer">
                  View
                </a>
              )}
            </Stack>
          ))}
        </Stack>
      </Paper>

      {modules.map((module) => {
        const moduleOpen = isModuleOpen(module);
        const moduleCompleted = isModuleCompleted(module.id);

        return (
          <Paper
            key={module.id}
            sx={{
              p: 3,
              mb: 2,
              opacity: moduleOpen ? 1 : 0.68,
              border: moduleOpen ? undefined : '1px dashed',
              borderColor: moduleOpen ? undefined : 'divider',
            }}
          >
            <Typography variant="h6">{module.title}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {module.module_number} - {module.module_type}
              </Typography>
              {moduleCompleted && <Chip size="small" color="success" label="Completed" />}
              {!moduleCompleted && moduleOpen && <Chip size="small" color="primary" label="Open" />}
              {!moduleOpen && <Chip size="small" variant="outlined" label="Locked" />}
            </Stack>
            <Typography sx={{ mt: 1 }}>{module.description || 'No description'}</Typography>
            {!moduleOpen && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Complete all mandatory items in previous modules to unlock this module.
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {(sectionsByModule[module.id] || [])
              .slice()
              .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
              .map((section) => (
                <Box key={section.id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">{section.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {section.section_type} - {section.completion_mode} -{' '}
                    {section.is_mandatory ? 'Mandatory' : 'Optional'}
                  </Typography>
                  <Stack sx={{ mt: 1 }} spacing={1}>
                    {(activitiesBySection[section.id] || [])
                      .slice()
                      .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0))
                      .map((activity) => (
                        <Paper key={activity.id} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography>{activity.title}</Typography>
                            <Chip
                              size="small"
                              label={activity.is_mandatory ? 'Mandatory' : 'Optional'}
                            />
                            {completedActivities.has(activity.id) && (
                              <Chip size="small" color="success" label="Completed" />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {activity.content_type}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1 }}
                            disabled={!isSectionOpen(module.id, section) || !isActivityOpen(section.id, activity)}
                            onClick={() => {
                              setSelectedActivity(activity);
                              setActivityReady(completedActivities.has(activity.id));
                            }}
                          >
                            Open Activity
                          </Button>
                          {!isSectionOpen(module.id, section) && (
                            <Typography variant="caption" color="text.secondary">
                              Complete previous mandatory sections to unlock.
                            </Typography>
                          )}
                          {isSectionOpen(module.id, section) && !isActivityOpen(section.id, activity) && (
                            <Typography variant="caption" color="text.secondary">
                              Complete previous mandatory activities to unlock.
                            </Typography>
                          )}
                        </Paper>
                      ))}
                  </Stack>
                </Box>
              ))}
          </Paper>
        );
      })}

      {selectedActivity && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6">Activity Viewer</Typography>
          <Typography variant="subtitle2">{selectedActivity.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedActivity.content_type}
          </Typography>
          <Divider sx={{ my: 2 }} />
          {activityIsVideo && activityUrl && !activityUsesEmbeddedVideo && (
            <video
              src={activityUrl}
              controls
              style={{ width: '100%', borderRadius: 12 }}
              controlsList="nodownload noplaybackrate"
              onTimeUpdate={(e) => {
                const current = (e.target as HTMLVideoElement).currentTime;
                if (current > lastVideoTimeRef.current) {
                  lastVideoTimeRef.current = current;
                }
              }}
              onSeeking={(e) => {
                const video = e.target as HTMLVideoElement;
                if (video.currentTime > lastVideoTimeRef.current + 1) {
                  video.currentTime = lastVideoTimeRef.current;
                }
              }}
              onEnded={() => setActivityReady(true)}
            />
          )}

          {activityIsVideo && activityUsesEmbeddedVideo && embeddedVideoUrl && (
            <Box
              sx={{
                height: 500,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <iframe
                title="embedded-video-content"
                src={embeddedVideoUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          )}

          {activityIsVideo && activityUsesEmbeddedVideo && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              External embedded videos cannot be end-tracked reliably across providers. Review the
              video, then mark it complete manually.
            </Typography>
          )}

          {!activityIsVideo && activityIsPdf && activityUrl && (
            <Box
              ref={pdfScrollRef}
              onScroll={() => {
                setPdfHasUserScrolled(true);
                checkPdfCompletion();
              }}
              sx={{
                height: 520,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                overflow: 'auto',
                p: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Document
                file={activityUrl}
                onLoadSuccess={(doc: PdfLoadSuccess) => setPdfPages(doc.numPages)}
                loading="Loading document..."
              >
                {Array.from({ length: pdfPages }, (_, index) => (
                  <Box
                    key={`page-wrap-${index + 1}`}
                    ref={index === pdfPages - 1 ? pdfEndRef : null}
                  >
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      width={900}
                      onRenderSuccess={() => {
                        window.requestAnimationFrame(() => {
                          checkPdfCompletion();
                        });
                      }}
                    />
                  </Box>
                ))}
              </Document>
            </Box>
          )}

          {!activityIsVideo && !activityIsPdf && activityIsPowerPoint && !!powerPointViewerUrl && (
            <Box
              sx={{
                height: 560,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <iframe
                title="powerpoint-content"
                src={powerPointViewerUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          )}

          {!activityIsVideo && !activityIsPdf && activityIsPowerPoint && !powerPointViewerUrl && !!activityUrl && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Local PowerPoint files cannot be rendered by Office Web Viewer from `localhost`.
                The app is opening the file in an embedded frame when the browser supports it.
              </Typography>
              <Box
                sx={{
                  height: 560,
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <iframe
                  title="powerpoint-local-content"
                  src={activityUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Box>
              <a href={activityUrl} target="_blank" rel="noreferrer">
                Open PowerPoint in a new tab
              </a>
            </Stack>
          )}

          {!activityIsVideo && !activityIsPdf && activityIsScorm && (
            <Stack spacing={1.5}>
              {!scormLaunchUrl && (
                <Typography variant="body2" color="error">
                  No SCORM launch page was detected for this zip package.
                </Typography>
              )}
              {!!scormLaunchUrl && (
                <Box
                  sx={{
                    height: 640,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                  }}
                >
                  <iframe
                    title="scorm-content"
                    src={scormLaunchUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </Box>
              )}
            </Stack>
          )}

          {!activityIsVideo && !activityIsPdf && !activityIsPowerPoint && !activityIsScorm && (
            <Box
              sx={{
                height: 500,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <iframe
                title="activity-content"
                src={selectedActivity.external_url || resolveBackendFileUrl(selectedActivity.file)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          )}

          {!activityIsVideo && !activityIsPdf && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Review the content fully before marking complete.
            </Typography>
          )}

          {selectedActivityCompleted ? (
            <Button variant="outlined" color="success" sx={{ mt: 2 }} disabled>
              {selectedActivityCompletedAt
                ? `Completed on ${new Date(String(selectedActivityCompletedAt)).toLocaleString()}`
                : 'Already Completed'}
            </Button>
          ) : (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={!activityReady || !enrollment}
              onClick={() => {
                if (!enrollment) return;
                const completionTimestamp = new Date().toISOString();
                const updated = new Set(enrollment.progress?.completedActivities || []);
                updated.add(selectedActivity.id);
                const updatedMandatoryCompleted = allMandatoryActivityIds.every((id) => updated.has(id));
                const completedCourses = new Set(enrollment.progress?.completedCourses || []);
                if (updatedMandatoryCompleted && courseId) {
                  completedCourses.add(Number(courseId));
                }
                const isLearningPathComplete =
                  learningPathCourseIds.length > 0 &&
                  learningPathCourseIds.every((id) => completedCourses.has(id));
                const payload = {
                  progress: {
                    ...(enrollment.progress || {}),
                    completedActivities: Array.from(updated),
                    completedActivityTimestamps: {
                      ...(enrollment.progress?.completedActivityTimestamps || {}),
                      [selectedActivity.id]: completionTimestamp,
                    },
                    completedCourses: Array.from(completedCourses),
                  },
                  status: updatedMandatoryCompleted
                    ? learningPathCourseIds.length > 0
                      ? isLearningPathComplete
                        ? 'COMPLETED'
                        : 'IN_PROGRESS'
                      : 'COMPLETED'
                    : 'IN_PROGRESS',
                };
                updateTrainingEnrollment(enrollment.id, payload).then((res) => {
                  setEnrollment(res.data);
                  setActivityReady(false);
                });
              }}
            >
              Mark Completed
            </Button>
          )}
          {!activityReady && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Complete the activity to unlock the button. Videos must finish; PDFs unlock after you
              scroll to the end.
            </Typography>
          )}
          {activityReady && !enrollment && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              This course is open in preview mode. Completion tracking requires an assigned enrollment.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};
