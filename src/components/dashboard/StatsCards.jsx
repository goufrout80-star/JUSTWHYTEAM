import { FolderOpen, ListChecks, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatsCards({ stats }) {
  const items = [
    { label: 'Active Projects', value: stats.activeProjects, icon: FolderOpen },
    { label: 'Open Tasks', value: stats.openTasks, icon: ListChecks },
    { label: 'Completed', value: stats.completedThisWeek, icon: CheckCircle2 },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, overdue: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <div key={item.label} className="card flex items-center gap-3">
          <item.icon size={16} strokeWidth={1.5} style={{ color: item.overdue ? 'var(--status-overdue)' : 'var(--text-hint)' }} />
          <div>
            <p className="text-[26px] font-medium" style={{ color: item.overdue && item.value > 0 ? 'var(--status-overdue)' : 'var(--text-primary)' }}>{item.value}</p>
            <p className="text-[11px] uppercase tracking-[0.06em]" style={{ color: 'var(--text-hint)' }}>{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
