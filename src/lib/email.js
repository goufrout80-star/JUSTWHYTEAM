// Email sender — all emails routed via Supabase Edge Functions
// API keys (RESEND_API_KEY) are stored server-side in Supabase secrets, never in the browser

const APP_URL = import.meta.env.VITE_APP_URL || 'https://team.justwhyus.com';
const SENDER_EMAIL = 'noreply@team.justwhyus.com';
const APP_NAME = 'Just Why Team';

/**
 * Send invite email to new user
 * @param {Object} params
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.inviteLink - Full registration link with token
 * @param {string} params.invitedBy - Username of admin who sent invite
 */
export async function sendInviteEmail({ toEmail, inviteLink, invitedBy }) {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: { toEmail, inviteLink, invitedBy },
    });
    if (error) throw error;
    return { success: true, ...data };
  } catch (err) {
    console.error('[Email] Error sending invite:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send password reset OTP email via Edge Function
 * @param {Object} params
 * @param {string} params.toEmail - User's email
 * @param {string} params.code - 6-digit OTP code
 * @param {string} params.username - Username for personalisation
 */
export async function sendPasswordResetEmail({ toEmail, code, username }) {
  try {
    const { supabase } = await import('./supabase');
    const { data, error } = await supabase.functions.invoke('send-otp-email', {
      body: { toEmail, code, username, type: 'reset' },
    });
    if (error) throw error;
    return { success: true, ...data };
  } catch (err) {
    console.error('[Email] Error sending password reset:', err);
    return { success: false, error: err.message };
  }
}

export { APP_URL, SENDER_EMAIL, APP_NAME };
