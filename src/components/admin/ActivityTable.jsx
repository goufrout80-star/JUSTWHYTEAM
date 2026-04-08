import { format } from 'date-fns';

const thClass = 'text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]';
const tdClass = 'py-2.5 px-3 text-[13px]';

export default function ActivityTable({ logs, users = [] }) {
  const getUser = (userId) => users.find(u => u.id === userId);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Timestamp</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>User</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Action</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Metadata</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const user = getUser(log.user_id);
            return (
              <tr key={log.id} className="transition-colors"
                style={{ borderBottom: '1px solid var(--border-default)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className={`${tdClass} whitespace-nowrap font-mono`} style={{ color: 'var(--text-hint)' }}>
                  {format(new Date(log.created_at), 'MMM d, HH:mm')}
                </td>
                <td className={`${tdClass} font-medium`} style={{ color: 'var(--text-primary)' }}>
                  {user?.username || log.user_id?.slice(0, 8) || '-'}
                </td>
                <td className={tdClass}>
                  <span className="badge badge-progress">{log.action?.replace(/_/g, ' ')}</span>
                </td>
                <td className={`${tdClass} max-w-xs truncate font-mono text-[11px]`} style={{ color: 'var(--text-hint)' }}>
                  {JSON.stringify(log.metadata)}
                </td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr><td colSpan={4} className="py-8 text-center text-[13px]" style={{ color: 'var(--text-hint)' }}>No activity logs</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
