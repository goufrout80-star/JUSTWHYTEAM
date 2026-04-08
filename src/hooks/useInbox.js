import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useInbox(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.is_read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  async function markAsRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    await fetchNotifications();
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    await fetchNotifications();
  }

  async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id);
    await fetchNotifications();
  }

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification };
}
