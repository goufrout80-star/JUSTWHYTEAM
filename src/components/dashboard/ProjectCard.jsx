import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

export default function ProjectCard({ project, tasks = [], members = [] }) {
  const navigate = useNavigate();

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 'completed';

  return (
    <div className="card-interactive space-y-3" onClick={() => navigate(`/projects/${project.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <svg width="6" height="6" className="shrink-0"><circle cx="3" cy="3" r="3" fill={project.color || '#00E0C0'}/></svg>
          <h3 className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
        </div>
        <Badge status={isOverdue ? 'overdue' : project.status || 'active'}>
          {isOverdue ? 'Overdue' : project.status || 'Active'}
        </Badge>
      </div>

      {project.description && (
        <p className="text-[12px] line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
      )}

      {project.version && (
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,224,192,0.06)', color: 'var(--text-accent)' }}>
          v{project.version}
        </span>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--text-hint)' }}>
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {project.deadline && (
          <div className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-hint)' }}>
            <Calendar size={12} strokeWidth={1.5} />
            {format(new Date(project.deadline), 'MMM d, yyyy')}
          </div>
        )}
        <div className="flex -space-x-1.5">
          {members.slice(0, 4).map(m => (
            <Avatar key={m.id} username={m.username} size="sm" />
          ))}
          {members.length > 4 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-hint)', border: '1px solid var(--border-default)' }}>
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
