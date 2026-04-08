const Dot = () => (
  <svg width="6" height="6"><circle cx="3" cy="3" r="3" fill="currentColor"/></svg>
);

const classMap = {
  done:     'badge-done',
  green:    'badge-done',
  progress: 'badge-progress',
  blue:     'badge-progress',
  pending:  'badge-pending',
  amber:    'badge-pending',
  gray:     'badge-pending',
  overdue:  'badge-overdue',
  red:      'badge-overdue',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
  purple:   'badge-done',
};

const statusMap = {
  pending: 'pending',
  in_progress: 'progress',
  completed: 'done',
  overdue: 'overdue',
  active: 'done',
  archived: 'pending',
};

const priorityMap = { high: 'high', medium: 'medium', low: 'low' };

export default function Badge({ children, color, status, priority, type, className = '' }) {
  const key = color
    || (status && statusMap[status])
    || (priority && priorityMap[priority])
    || 'pending';

  const label = children || status?.replace('_', ' ') || priority || type || '';

  return (
    <span className={`badge ${classMap[key] || 'badge-pending'} ${className}`}>
      <Dot />
      <span className="capitalize">{label}</span>
    </span>
  );
}
