import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2, UserPlus, MessageCircle, ListChecks, FolderOpen, AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';

const iconMap = {
  task_assigned: ListChecks,
  task_completed: CheckCircle2,
  announcement_reply: MessageCircle,
  project_invitation: FolderOpen,
  member_joined: UserPlus,
  default: AlertCircle,
};

export default function NotificationItem({ notification, onAction, onMarkRead }) {
  const Icon = iconMap[notification.type] || iconMap.default;
  const isUnread = !notification.is_read;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg transition-colors"
      style={{
        border: `1px solid ${isUnread ? 'var(--border-active)' : 'var(--border-default)'}`,
        background: isUnread ? 'rgba(0,224,192,0.03)' : 'var(--bg-surface)',
      }}>
      <div className="p-2 rounded-lg"
        style={{ background: isUnread ? 'rgba(0,224,192,0.1)' : 'var(--bg-elevated)', color: isUnread ? 'var(--text-accent)' : 'var(--text-hint)' }}>
        <Icon size={14} strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px]" style={{ color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isUnread ? 500 : 400 }}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-hint)' }}>{notification.body}</p>
        )}
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-hint)' }}>
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {notification.type === 'project_invitation' && notification.metadata?.status === 'pending' && (
          <>
            <Button size="sm" onClick={() => onAction?.(notification, 'accept')}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => onAction?.(notification, 'decline')}>Decline</Button>
          </>
        )}
        {notification.type === 'task_assigned' && (
          <Button size="sm" onClick={() => onAction?.(notification, 'accept')}>Accept</Button>
        )}
        {notification.type === 'task_completed' && (
          <>
            <Button size="sm" onClick={() => onAction?.(notification, 'approve')}>Approve</Button>
            <Button size="sm" variant="ghost" onClick={() => onAction?.(notification, 'request_changes')}>Changes</Button>
          </>
        )}
        {isUnread && (
          <button onClick={() => onMarkRead?.(notification.id)}
            className="text-[11px] transition-colors"
            style={{ color: 'var(--text-hint)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-hint)'}>
            Mark read
          </button>
        )}
      </div>
    </div>
  );
}
