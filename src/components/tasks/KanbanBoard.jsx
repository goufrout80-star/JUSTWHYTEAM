import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

const columns = [
  { key: 'pending', label: 'Pending', color: 'var(--status-pending)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--status-progress)' },
  { key: 'completed', label: 'Completed', color: 'var(--status-done)' },
];

export default function KanbanBoard({ tasks, members = [], onUpdateTask }) {
  const getMember = (userId) => members.find(m => m.id === userId);

  function handleStatusChange(taskId, newStatus) {
    onUpdateTask?.(taskId, { status: newStatus });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="rounded-lg p-3"
            style={{ background: 'var(--bg-surface)', borderTop: `2px solid ${col.color}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{col.label}</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-hint)' }}>{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map(task => {
                const assignee = getMember(task.assigned_to);
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
                return (
                  <div key={task.id} className="rounded-lg p-3 space-y-2 transition-colors"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge priority={task.priority} />
                      <Badge type={task.type} />
                      {task.version && (
                        <span className="font-mono text-[10px] px-1 rounded" style={{ background: 'rgba(0,224,192,0.06)', color: 'var(--text-accent)' }}>v{task.version}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {task.deadline ? (
                        <span className="flex items-center gap-1 text-[11px]"
                          style={{ color: isOverdue ? 'var(--status-overdue)' : 'var(--text-hint)' }}>
                          <Calendar size={10} strokeWidth={1.5} />
                          {format(new Date(task.deadline), 'MMM d')}
                        </span>
                      ) : <span />}
                      {assignee && <Avatar username={assignee.username} size="sm" />}
                    </div>
                    {col.key !== 'completed' && (
                      <div className="flex gap-2 pt-1">
                        {col.key === 'pending' && (
                          <button onClick={() => handleStatusChange(task.id, 'in_progress')}
                            className="text-[11px] font-medium transition-colors"
                            style={{ color: 'var(--text-hint)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-accent)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}>
                            Start
                          </button>
                        )}
                        <button onClick={() => handleStatusChange(task.id, 'completed')}
                          className="text-[11px] font-medium transition-colors"
                          style={{ color: 'var(--text-hint)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--status-done)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}>
                          Complete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {colTasks.length === 0 && (
                <p className="text-[11px] text-center py-4" style={{ color: 'var(--text-hint)' }}>No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
