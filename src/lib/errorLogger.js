import { supabase } from './supabase';

export async function logError(userId, page, errorMessage, stackTrace = '') {
  try {
    const { error } = await supabase.from('errors_log').insert({
      user_id: userId,
      page,
      error_message: errorMessage,
      stack_trace: stackTrace,
    });
    if (error) console.error('Error log failed:', error);
  } catch (err) {
    console.error('Error logger failed:', err);
  }
}
