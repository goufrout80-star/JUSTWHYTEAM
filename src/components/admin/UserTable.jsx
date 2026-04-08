import { format } from 'date-fns';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const thClass = 'text-left py-2 px-3 text-[11px] font-medium uppercase tracking-[0.06em]';
const tdClass = 'py-2.5 px-3 text-[13px]';

export default function UserTable({ users, onToggleAdmin }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>User</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Email</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Roles</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Joined</th>
            <th className={thClass} style={{ color: 'var(--text-hint)' }}>Admin</th>
            <th className={`${thClass} text-right`} style={{ color: 'var(--text-hint)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="transition-colors"
              style={{ borderBottom: '1px solid var(--border-default)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td className={tdClass}>
                <div className="flex items-center gap-2">
                  <Avatar username={user.username} size="sm" />
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.username}</span>
                </div>
              </td>
              <td className={tdClass} style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
              <td className={tdClass}>
                <div className="flex flex-wrap gap-1">
                  {user.roles?.map(role => (
                    <Badge key={role} color="purple">{role}</Badge>
                  ))}
                </div>
              </td>
              <td className={`${tdClass} font-mono`} style={{ color: 'var(--text-hint)' }}>
                {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
              </td>
              <td className={tdClass}>
                <Badge color={user.is_admin ? 'green' : 'gray'}>
                  {user.is_admin ? 'Admin' : 'User'}
                </Badge>
              </td>
              <td className={`${tdClass} text-right`}>
                <Button size="sm" variant="ghost" onClick={() => onToggleAdmin?.(user)}>
                  {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
