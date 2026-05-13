export const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700',
  company: 'bg-amber-100 text-amber-700',
  candidate: 'bg-orange-100 text-orange-700',
};

export const STATUS_COLORS = {
  active: 'bg-orange-100 text-orange-700',
  inactive: 'bg-gray-100 text-gray-500',
  blocked: 'bg-red-100 text-red-600',
  pending: 'bg-yellow-100 text-yellow-700',
  open: 'bg-orange-100 text-orange-700',
  closed: 'bg-red-100 text-red-600',
  draft: 'bg-gray-100 text-gray-500',
  applied: 'bg-yellow-100 text-yellow-700',
  interviewing: 'bg-amber-100 text-amber-700',
  offered: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  hired: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
};

export const EXPERIENCE_LEVELS = [
  { value: 'any', label: 'Any' },
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5+', label: '5+ years' },
];

export const JOB_LEVELS = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

export const INTERVIEW_TYPES = [
  { value: 'phone', label: 'Phone' },
  { value: 'video', label: 'Video Call' },
  { value: 'onsite', label: 'On-site' },
];

export const SUBMISSION_STATUS = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
];

export const DATE_RANGES = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
];
