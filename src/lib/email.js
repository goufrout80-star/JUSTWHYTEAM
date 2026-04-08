// Custom email sender using Resend API
// We handle all emails ourselves - Supabase email confirmations are DISABLED

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || import.meta.env.RESEND_API_KEY;
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
  if (!RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${SENDER_EMAIL}>`,
        to: toEmail,
        subject: `${invitedBy} invited you to ${APP_NAME}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${APP_NAME}</title>
          </head>
          <body style="margin:0;padding:0;background:#0A192F;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">
            <div style="max-width:520px;margin:40px auto;background:#112240;border:1px solid rgba(0,224,192,0.12);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
              <div style="padding:32px;border-bottom:1px solid rgba(0,224,192,0.08);text-align:center">
                <div style="font-size:24px;font-weight:700;color:#00E0C0;letter-spacing:-0.5px">${APP_NAME}</div>
              </div>
              <div style="padding:40px 32px">
                <h2 style="color:#E6F1FF;font-size:22px;font-weight:600;margin:0 0 16px">
                  You've been invited! 🎉
                </h2>
                <p style="color:#8892B0;font-size:15px;line-height:1.7;margin:0 0 24px">
                  <strong style="color:#00E0C0">${invitedBy}</strong> invited you to join 
                  <strong style="color:#E6F1FF">${APP_NAME}</strong>. 
                  Click the button below to complete your registration.
                </p>
                <div style="text-align:center;margin:32px 0">
                  <a href="${inviteLink}" 
                     style="display:inline-block;background:linear-gradient(135deg,#00E0C0,#00BFA0);color:#0A192F;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 20px rgba(0,224,192,0.3)">
                    Complete Registration
                  </a>
                </div>
                <div style="background:rgba(0,224,192,0.05);border:1px solid rgba(0,224,192,0.15);border-radius:8px;padding:16px;margin:24px 0">
                  <p style="color:#8892B0;font-size:13px;margin:0;line-height:1.6">
                    <strong style="color:#E6F1FF">⏰ Expires in 7 days</strong><br>
                    This link can only be used once. If you did not expect this email, you can safely ignore it.
                  </p>
                </div>
                <p style="color:#5A6A8F;font-size:12px;margin:24px 0 0;line-height:1.6">
                  Button not working? Copy and paste this link:<br>
                  <a href="${inviteLink}" style="color:#00E0C0;word-break:break-all">${inviteLink}</a>
                </p>
              </div>
              <div style="padding:20px 32px;border-top:1px solid rgba(0,224,192,0.08);background:rgba(17,34,64,0.5)">
                <p style="color:#5A6A8F;font-size:11px;margin:0;text-align:center">
                  Sent from ${APP_NAME} · ${APP_URL}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${invitedBy} invited you to join ${APP_NAME}.\n\nComplete your registration: ${inviteLink}\n\nThis link expires in 7 days and can only be used once.`
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Email] Resend API error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('[Email] Invite sent successfully:', data.id);
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error('[Email] Error sending invite:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send password reset email
 * @param {Object} params
 * @param {string} params.toEmail - User's email
 * @param {string} params.resetLink - Password reset link
 */
export async function sendPasswordResetEmail({ toEmail, resetLink }) {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${APP_NAME} <${SENDER_EMAIL}>`,
        to: toEmail,
        subject: `Reset your ${APP_NAME} password`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="margin:0;padding:0;background:#0A192F;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif">
            <div style="max-width:520px;margin:40px auto;background:#112240;border:1px solid rgba(0,224,192,0.12);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
              <div style="padding:32px;border-bottom:1px solid rgba(0,224,192,0.08);text-align:center">
                <div style="font-size:24px;font-weight:700;color:#00E0C0;letter-spacing:-0.5px">${APP_NAME}</div>
              </div>
              <div style="padding:40px 32px">
                <h2 style="color:#E6F1FF;font-size:22px;font-weight:600;margin:0 0 16px">
                  Password Reset Request 🔐
                </h2>
                <p style="color:#8892B0;font-size:15px;line-height:1.7;margin:0 0 24px">
                  We received a request to reset your password. Click the button below to set a new password. If you didn't request this, you can safely ignore this email.
                </p>
                <div style="text-align:center;margin:32px 0">
                  <a href="${resetLink}" 
                     style="display:inline-block;background:linear-gradient(135deg,#00E0C0,#00BFA0);color:#0A192F;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 20px rgba(0,224,192,0.3)">
                    Reset Password
                  </a>
                </div>
                <div style="background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.2);border-radius:8px;padding:16px;margin:24px 0">
                  <p style="color:#E74C3C;font-size:13px;margin:0;line-height:1.6">
                    <strong>⏰ Expires in 1 hour</strong><br>
                    For security reasons, this link expires in 1 hour.
                  </p>
                </div>
                <p style="color:#5A6A8F;font-size:12px;margin:24px 0 0;line-height:1.6">
                  Button not working? Copy and paste this link:<br>
                  <a href="${resetLink}" style="color:#00E0C0;word-break:break-all">${resetLink}</a>
                </p>
              </div>
              <div style="padding:20px 32px;border-top:1px solid rgba(0,224,192,0.08);background:rgba(17,34,64,0.5)">
                <p style="color:#5A6A8F;font-size:11px;margin:0;text-align:center">
                  Sent from ${APP_NAME} Security Team · ${APP_URL}
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Reset your ${APP_NAME} password.\n\nClick this link to reset: ${resetLink}\n\nThis link expires in 1 hour.`
      })
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message };
    return { success: true, messageId: data.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export { RESEND_API_KEY, APP_URL, SENDER_EMAIL, APP_NAME };
