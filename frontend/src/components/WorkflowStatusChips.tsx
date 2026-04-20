import { Chip, Stack } from '@mui/material';

interface WorkflowStatusChipsProps {
  steps: string[];
  current: string;
}

export const WorkflowStatusChips: React.FC<WorkflowStatusChipsProps> = ({
  steps,
  current,
}) => {
  const activeIndex = Math.max(steps.indexOf(current), 0);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {steps.map((step, index) => (
        <Chip
          key={step}
          label={step}
          size="small"
          color={index < activeIndex ? 'success' : index === activeIndex ? 'primary' : 'default'}
          variant={index === activeIndex ? 'filled' : 'outlined'}
          sx={{ mb: 0.5 }}
        />
      ))}
    </Stack>
  );
};
