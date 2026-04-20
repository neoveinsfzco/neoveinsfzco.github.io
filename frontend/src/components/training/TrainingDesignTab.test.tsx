/// <reference types="vitest/globals" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrainingDesignTab } from './TrainingDesignTab';
import * as trainingApi from '../../api/training';

vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({
    rows,
    onRowClick,
  }: {
    rows: Array<{ id: number; title?: string }>;
    onRowClick?: (params: { row: { id: number; title?: string } }) => void;
  }) => (
    <div data-testid="mock-data-grid">
      {rows.map((row) => (
        <button key={row.id} type="button" onClick={() => onRowClick?.({ row })}>
          {row.title ?? `row-${row.id}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../api/training', async () => {
  const actual = await vi.importActual('../../api/training');
  return {
    ...actual,
    fetchTrainingCourses: vi.fn(),
    fetchTrainingCategories: vi.fn(),
    fetchTrainingVendors: vi.fn(),
    fetchTrainingModules: vi.fn(),
    fetchTrainingSections: vi.fn(),
    fetchTrainingSubActivities: vi.fn(),
    fetchTrainingAssessments: vi.fn(),
    fetchTrainingCourseAttachments: vi.fn(),
    createTrainingCourse: vi.fn(),
    updateTrainingCourse: vi.fn(),
    createTrainingModule: vi.fn(),
    createTrainingSection: vi.fn(),
    createTrainingSubActivity: vi.fn(),
    createTrainingCourseAttachment: vi.fn(),
    upsertTrainingAssessment: vi.fn(),
  };
});

const mockedApi = vi.mocked(trainingApi, { partial: true }) as any;
const ok = (results: unknown[] = []) => Promise.resolve({ data: { results } }) as any;

describe('TrainingDesignTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedApi.fetchTrainingCourses.mockImplementation(() => ok());
    mockedApi.fetchTrainingCategories.mockImplementation(() => ok());
    mockedApi.fetchTrainingVendors.mockImplementation(() => ok());
    mockedApi.fetchTrainingModules.mockImplementation(() => ok());
    mockedApi.fetchTrainingSections.mockImplementation(() => ok());
    mockedApi.fetchTrainingSubActivities.mockImplementation(() => ok());
    mockedApi.fetchTrainingAssessments.mockImplementation(() => ok());
    mockedApi.fetchTrainingCourseAttachments.mockImplementation(() => ok());

    mockedApi.createTrainingCourse.mockResolvedValue({ data: {} });
    mockedApi.updateTrainingCourse.mockResolvedValue({ data: {} });
    mockedApi.createTrainingModule.mockResolvedValue({ data: {} });
    mockedApi.createTrainingSection.mockResolvedValue({ data: {} });
    mockedApi.createTrainingSubActivity.mockResolvedValue({ data: {} });
    mockedApi.createTrainingCourseAttachment.mockResolvedValue({ data: {} });
    mockedApi.upsertTrainingAssessment.mockResolvedValue({ data: {} });
  });

  it('shows BU selection message when no business unit is provided', () => {
    render(<TrainingDesignTab businessUnitId="" />);

    expect(screen.getByText(/select a business unit to design training courses/i)).toBeInTheDocument();
  });

  it('loads the course builder sections when business unit is provided', async () => {
    render(<TrainingDesignTab businessUnitId={1} />);

    expect(screen.getByText('Course Builder')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Sections & Activities')).toBeInTheDocument();
    expect(screen.getByText('Assessment / Feedback Settings')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedApi.fetchTrainingCourses).toHaveBeenCalledWith(1);
      expect(mockedApi.fetchTrainingCategories).toHaveBeenCalledWith(1);
      expect(mockedApi.fetchTrainingVendors).toHaveBeenCalledWith(1);
    });
  });

  it('validates required course fields before save', async () => {
    const user = userEvent.setup();
    render(<TrainingDesignTab businessUnitId={1} />);

    await user.click(screen.getByRole('button', { name: /save course/i }));

    expect(screen.getByText(/title and publish start date are required/i)).toBeInTheDocument();
    expect(mockedApi.createTrainingCourse).not.toHaveBeenCalled();
  });

  it('creates a course when required fields are entered', async () => {
    const user = userEvent.setup();
    render(<TrainingDesignTab businessUnitId={1} />);

    const titleInputs = screen.getAllByLabelText('Title');
    fireEvent.change(titleInputs[0], { target: { value: 'Safety Training 101' } });
    const publishStartInputs = screen.getAllByLabelText('Publish Start');
    fireEvent.change(publishStartInputs[0], { target: { value: '2026-04-14' } });
    await user.click(screen.getByRole('button', { name: /save course/i }));

    await waitFor(() => {
      expect(mockedApi.createTrainingCourse).toHaveBeenCalledTimes(1);
    });
  });
});
