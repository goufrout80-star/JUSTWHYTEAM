import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';

const thClass = 'text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]';
const tdClass = 'py-2.5 px-3 text-[13px]';

export default function ErrorTable({ errors, users = [] }) {
  const [expanded, setExpanded] = useState(null);
  const getUser = (userId) => users.find(u => u.id === userId);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th className="w-8"></th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Timestamp</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>User</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Page</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Error</th>
          </tr>
        </thead>
        <tbody>
          {errors.map(err => {
            const user = getUser(err.user_id);
            const isExpanded = expanded === err.id;
            return (
              <tr key={err.id} className="cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--border-default)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => setExpanded(isExpanded ? null : err.id)}>
                <td className="py-2.5 px-2" style={{ color: 'var(--text-hint)' }}>
                  {isExpanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
                </td>
                <td className={`${tdClass} whitespace-nowrap font-mono`} style={{ color: 'var(--text-hint)' }}>
                  {format(new Date(err.created_at), 'MMM d, HH:mm')}
                </td>
                <td className={`${tdClass} font-medium`} style={{ color: 'var(--text-primary)' }}>
                  {user?.username || '-'}
                </td>
                <td className={tdClass} style={{ color: 'var(--text-secondary)' }}>{err.page}</td>
                <td className={`${tdClass} max-w-sm truncate`} style={{ color: 'var(--status-overdue)' }}>{err.error_message}</td>
              </tr>
            );
          })}
          {expanded && errors.find(e => e.id === expanded) && (
            <tr>
              <td colSpan={5} className="px-6 py-3" style={{ background: 'var(--bg-elevated)' }}>
                <pre className="text-[11px] whitespace-pre-wrap font-mono max-h-40 overflow-auto" style={{ color: 'var(--text-secondary)' }}>
                  {errors.find(e => e.id === expanded)?.stack_trace || 'No stack trace available'}
                </pre>
              </td>
            </tr>
          )}
          {errors.length === 0 && (
            <tr><td colSpan={5} className="py-8 text-center text-[13px]" style={{ color: 'var(--text-hint)' }}>No errors logged</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
