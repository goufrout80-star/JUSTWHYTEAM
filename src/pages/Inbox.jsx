import { useCallback } from 'react';
import { CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useInbox } from '../hooks/useInbox';
import { useRealtime } from '../hooks/useRealtime';
import { logActivity } from '../lib/activityLogger';
import NotificationItem from '../components/inbox/NotificationItem';
import Button from '../components/ui/Button';

export default function Inbox() {
  const { profile } = useAuth();
  const { notifications, loading, markAsRead, markAllAsRead, fetchNotifications } = useInbox(profile?.id);

  useRealtime('notifications', { column: 'user_id', value: profile?.id }, useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]));

  async function handleAction(notification, action) {
    if (notification.type === 'project_invitation') {
      const projectId = notification.metadata?.project_id;
      if (action === 'accept' && projectId) {
        await supabase.from('project_members').insert({
          project_id: projectId,
          user_id: profile.id,
          permission: notification.metadata?.permission || 'contributor',
        });
        await supabase.from('invitations')
          .update({ status: 'accepted' })
          .eq('project_id', projectId)
          .eq('invited_email', profile.email);
        await logActivity(profile.id, projectId, 'joined_project', {});
      } else if (action === 'decline' && projectId) {
        await supabase.from('invitations')
          .update({ status: 'declined' })
          .eq('project_id', projectId)
          .eq('invited_email', profile.email);
      }
    }
    await markAsRead(notification.id);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>Inbox</h1>
        {notifications.some(n => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck size={16} className="mr-1.5" /> Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onAction={handleAction}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}
