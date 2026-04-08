import { format } from 'date-fns';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

export default function TaskRow({ task, user, onToggle, showProject = false }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isCompleted ? 'opacity-50' : ''}`}
      style={{ border: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
      <button onClick={() => onToggle?.(task)} className="shrink-0 transition-colors"
        style={{ color: isCompleted ? 'var(--status-done)' : 'var(--text-hint)' }}>
        {isCompleted ? <CheckCircle2 size={16} strokeWidth={1.5} /> : <Circle size={16} strokeWidth={1.5} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-medium ${isCompleted ? 'line-through' : ''}`}
            style={{ color: isCompleted ? 'var(--text-hint)' : 'var(--text-primary)' }}>
            {task.title}
          </span>
          {showProject && task.projects && (
            <span className="text-[11px]" style={{ color: 'var(--text-hint)' }}>{task.projects.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.version && (
            <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(0,224,192,0.06)', color: 'var(--text-accent)' }}>v{task.version}</span>
          )}
          <Badge type={task.type} />
          {task.deadline && (
            <span className="flex items-center gap-0.5 text-[11px]"
              style={{ color: isOverdue ? 'var(--status-overdue)' : 'var(--text-hint)' }}>
              <Calendar size={10} strokeWidth={1.5} />
              {format(new Date(task.deadline), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <Badge priority={task.priority} />

      {user && <Avatar username={user.username} size="sm" />}
    </div>
  );
}
