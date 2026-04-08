import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';

export function useChat(projectId, userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*, author:user_id(id, username, avatar_color)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `project_id=eq.${projectId}`,
      }, async (payload) => {
        const { data: enriched } = await supabase
          .from('chat_messages')
          .select('*, author:user_id(id, username, avatar_color)')
          .eq('id', payload.new.id)
          .single();
        if (enriched) setMessages(prev => [...prev, enriched]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  async function sendMessage(content) {
    const { error } = await supabase.from('chat_messages').insert({
      project_id: projectId,
      user_id: userId,
      content,
    });
    if (error) throw error;
    await logActivity(userId, projectId, 'post_chat_message', { preview: content.slice(0, 80) });
  }

  return { messages, loading, fetchMessages, sendMessage };
}
