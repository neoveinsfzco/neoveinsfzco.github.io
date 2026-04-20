import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { TrainingCatalogTab } from '../components/training/TrainingCatalogTab';
import { TrainingAssignedTab } from '../components/training/TrainingAssignedTab';
import { TrainingManagerTab } from '../components/training/TrainingManagerTab';
import { TrainingSettingsTab } from '../components/training/TrainingSettingsTab';
import { TrainingDesignTab } from '../components/training/TrainingDesignTab';
import { TrainingAssignmentsTab } from '../components/training/TrainingAssignmentsTab';
import { TrainingLearningPathTab } from '../components/training/TrainingLearningPathTab';

interface TrainingPageProps {
  selectedBuId: number | '';
}

const TAB_KEYS = ['catalog', 'assigned', 'design', 'learningpaths', 'assignments', 'manager', 'settings'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export const TrainingPage: React.FC<TrainingPageProps> = ({ selectedBuId }) => {
  const [tab, setTab] = useState<TabKey>('catalog');
  const tabs = useMemo(
    () => [
      { key: 'catalog', label: 'Catalog' },
      { key: 'assigned', label: 'Assigned Learnings' },
      { key: 'design', label: 'Course Builder' },
      { key: 'learningpaths', label: 'Learning Paths' },
      { key: 'assignments', label: 'Assignments' },
      { key: 'manager', label: 'Line Manager Status' },
      { key: 'settings', label: 'Training Settings' },
    ],
    [],
  );

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              Training & Learning
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Learning needs analysis, course design, assignments, and line manager visibility.
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={!selectedBuId}
            onClick={() => setTab('settings')}
          >
            New Course
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {tab === 'catalog' && <TrainingCatalogTab businessUnitId={selectedBuId} />}
        {tab === 'assigned' && <TrainingAssignedTab businessUnitId={selectedBuId} />}
        {tab === 'design' && <TrainingDesignTab businessUnitId={selectedBuId} />}
        {tab === 'learningpaths' && <TrainingLearningPathTab businessUnitId={selectedBuId} />}
        {tab === 'assignments' && <TrainingAssignmentsTab businessUnitId={selectedBuId} />}
        {tab === 'manager' && <TrainingManagerTab businessUnitId={selectedBuId} />}
        {tab === 'settings' && <TrainingSettingsTab businessUnitId={selectedBuId} />}
      </Box>
    </Box>
  );
};
