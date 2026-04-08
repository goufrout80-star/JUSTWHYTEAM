import { supabase } from './supabase';

export async function logActivity(userId, projectId, action, metadata = {}) {
  try {
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      project_id: projectId,
      action,
      metadata,
      ip_address: '',
    });
    if (error) console.error('Activity log error:', error);
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}
