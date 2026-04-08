// Beautiful branded email templates for Just Why Team
// All emails use dark teal theme with mint accent (#00E0C0)
// Sent via Supabase Edge Functions (keys are server-side)

import { supabase } from './supabase';

const APP_NAME = 'Just Why Team';
const APP_URL = 'https://team.justwhyus.com';
const SENDER_EMAIL = 'noreply@team.justwhyus.com';

// Brand colors
const COLORS = {
  bgDark: '#0A1A19',
  bgCard: '#0F2422',
  accent: '#00E0C0',
  text: '#E8F4F3',
  textMuted: '#7A9E9B',
  border: 'rgba(0,224,192,0.12)',
  error: '#E74C3C',
  success: '#2ECC71'
};

// Logo: hosted image (for email clients that block inline SVG)
// Triangle mark: simple inline SVG used as decorative accent beside the logo
const logoMark = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L28 28H4L16 4Z" fill="#00E0C0" fill-opacity="0.35"/>
  <path d="M16 10L24 26H8L16 10Z" fill="#00E0C0"/>
</svg>`;

// Full logo header block: hosted logo.svg image + triangle mark + app name text
const logoSvg = `
  <img src="${APP_URL}/logo.svg" width="40" height="40" alt="Just Why Team" style="display:inline-block;vertical-align:middle;border:0">
  ${logoMark}`;

// Email wrapper with brand styling
const emailWrapper = (content, subject) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: ${COLORS.bgDark};
      margin: 0;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: ${COLORS.bgCard};
      border: 1px solid ${COLORS.border};
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid ${COLORS.border};
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .logo img { display: inline-block; vertical-align: middle; }
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: ${COLORS.accent};
      letter-spacing: -0.5px;
      vertical-align: middle;
    }
    .content {
      padding: 40px 32px;
    }
    h1 {
      font-size: 28px;
      font-weight: 600;
      color: ${COLORS.text};
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    p {
      font-size: 15px;
      line-height: 1.7;
      color: ${COLORS.textMuted};
      margin: 0 0 24px 0;
    }
    strong {
      color: ${COLORS.text};
      font-weight: 500;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${COLORS.accent}, #00BFA0);
      color: ${COLORS.bgDark} !important;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 10px;
      text-decoration: none;
      margin: 8px 0;
      box-shadow: 0 4px 20px rgba(0,224,192,0.3);
    }
    .footer {
      padding: 24px 32px;
      border-top: 1px solid ${COLORS.border};
      background: rgba(0,0,0,0.2);
    }
    .footer-text {
      font-size: 12px;
      color: ${COLORS.textMuted};
      text-align: center;
      margin: 0;
    }
    .expiry-notice {
      font-size: 13px;
      color: ${COLORS.textMuted};
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid ${COLORS.border};
    }
    .link-fallback {
      font-size: 12px;
      color: ${COLORS.textMuted};
      word-break: break-all;
      margin-top: 16px;
    }
    .link-fallback a {
      color: ${COLORS.accent};
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .content { padding: 32px 24px; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        ${logoSvg}
        <span class="logo-text">${APP_NAME}</span>
      </div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p class="footer-text">
        ${APP_NAME} · ${APP_URL}<br>
        This is an automated message, please do not reply
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * EMAIL 1: INVITE EMAIL
 * Subject: You've been invited to Just Why Team
 */
export function generateInviteEmail({ inviteLink, invitedBy }) {
  const content = `
    <h1>You're invited</h1>
    <p><strong>${invitedBy}</strong> added you to <strong>${APP_NAME}</strong>.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteLink}" class="cta-button">Complete Registration &rarr;</a>
    </div>
    <div class="expiry-notice">
      Link expires in 7 days · One-time use only
    </div>
    <div class="link-fallback">
      If the button doesn't work, copy this link:<br>
      <a href="${inviteLink}">${inviteLink}</a>
    </div>
  `;
  
  return {
    subject: `You've been invited to ${APP_NAME}`,
    html: emailWrapper(content, `Invite to ${APP_NAME}`),
    text: `${invitedBy} invited you to join ${APP_NAME}.\n\nComplete your registration: ${inviteLink}\n\nThis link expires in 7 days and can only be used once.`
  };
}

/**
 * EMAIL 2: VERIFICATION CODE EMAIL
 * Subject: Your Just Why Team verification code
 * Two groups of 3 digits in styled boxes
 */
export function generateVerificationCodeEmail({ code, username }) {
  const codePart1 = code.slice(0, 3);
  const codePart2 = code.slice(3, 6);
  
  const content = `
    <h1>Verify your identity</h1>
    <p>Enter this code in ${APP_NAME}. It expires in 10 minutes.</p>
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <div style="
          background: rgba(0,224,192,0.08);
          border: 1px solid rgba(0,224,192,0.25);
          border-radius: 10px;
          padding: 20px 28px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 600;
          color: ${COLORS.accent};
          letter-spacing: 8px;
        ">${codePart1}</div>
        <div style="font-size: 24px; color: ${COLORS.textMuted};">·</div>
        <div style="
          background: rgba(0,224,192,0.08);
          border: 1px solid rgba(0,224,192,0.25);
          border-radius: 10px;
          padding: 20px 28px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 600;
          color: ${COLORS.accent};
          letter-spacing: 8px;
        ">${codePart2}</div>
      </div>
    </div>
    <p style="font-size: 14px; color: ${COLORS.textMuted};">
      This code was requested from ${APP_NAME}.<br>
      If you didn't request this, you can safely ignore this email.
    </p>
    <div class="expiry-notice" style="font-size: 13px;">
      This code expires in 10 minutes
    </div>
  `;
  
  return {
    subject: `Your ${APP_NAME} verification code`,
    html: emailWrapper(content, `Verification Code - ${APP_NAME}`),
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`
  };
}

/**
 * EMAIL 3: PASSWORD RESET EMAIL
 * Subject: Reset your Just Why Team password
 * Uses same styled code boxes as verification
 */
export function generatePasswordResetEmail({ code, username }) {
  const codePart1 = code.slice(0, 3);
  const codePart2 = code.slice(3, 6);
  
  const shieldSvg = `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin: 0 auto 24px; display: block;">
      <path d="M32 8L52 16V30C52 44 32 56 32 56C32 56 12 44 12 30V16L32 8Z" 
        stroke="${COLORS.accent}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 32L29 37L40 26" 
        stroke="${COLORS.accent}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  
  const content = `
    ${shieldSvg}
    <h1>Password reset requested</h1>
    <p>We received a request to reset the password for your account <strong>@${username}</strong>.</p>
    <p style="font-size: 14px; margin-bottom: 16px;">Enter this code to reset your password:</p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-flex; align-items: center; gap: 12px;">
        <div style="
          background: rgba(0,224,192,0.08);
          border: 1px solid rgba(0,224,192,0.25);
          border-radius: 10px;
          padding: 20px 28px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 600;
          color: ${COLORS.accent};
          letter-spacing: 8px;
        ">${codePart1}</div>
        <div style="font-size: 24px; color: ${COLORS.textMuted};">·</div>
        <div style="
          background: rgba(0,224,192,0.08);
          border: 1px solid rgba(0,224,192,0.25);
          border-radius: 10px;
          padding: 20px 28px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 48px;
          font-weight: 600;
          color: ${COLORS.accent};
          letter-spacing: 8px;
        ">${codePart2}</div>
      </div>
    </div>
    <div class="expiry-notice" style="font-size: 13px; margin-bottom: 16px;">
      This code expires in 10 minutes
    </div>
    <div style="background: rgba(0,0,0,0.2); border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="font-size: 13px; color: ${COLORS.textMuted}; margin: 0;">
        <strong style="color: ${COLORS.text};">Security notice:</strong> If you didn't request this password reset, your account is safe. No changes have been made. You can safely ignore this email.
      </p>
    </div>
  `;
  
  return {
    subject: `Reset your ${APP_NAME} password`,
    html: emailWrapper(content, `Password Reset - ${APP_NAME}`),
    text: `Reset your ${APP_NAME} password.\n\nYour reset code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, your account is safe. No changes have been made.`
  };
}

// ============================================================
// Frontend API — calls Supabase Edge Functions
// API keys never exposed in browser
// ============================================================

/**
 * Generate random 6-digit code and store in verification_codes table
 */
async function _generateAndStoreOTP(supabase, { userId, email, type }) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const { error } = await supabase
    .from('verification_codes')
    .insert({
      user_id: userId || null,
      email,
      code,
      type,
      used: false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  if (error) throw error;
  return code;
}

/**
 * Send invite email via Edge Function
 */
export async function sendInviteEmail({ toEmail, inviteLink, invitedBy }) {
  try {
    const { data, error } = await supabase.functions.invoke('send-invite-email', {
      body: { to: toEmail, inviteLink, invitedBy },
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send verification code email (registration confirm, 2FA fallback)
 * Generates code, stores in DB, sends branded email
 */
export async function sendVerificationCodeEmail({ toEmail, username, userId }) {
  const code = await _generateAndStoreOTP({ userId, email: toEmail, type: 'verify' });
  const emailData = generateVerificationCodeEmail({ code, username });
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: toEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    },
  });
  if (error) throw error;
  return { ...data, code };
}

/**
 * Send password reset OTP email
 * Generates code, stores in DB, sends branded email
 */
export async function sendPasswordResetEmail({ toEmail, username, userId }) {
  try {
    const code = await _generateAndStoreOTP({ userId, email: toEmail, type: 'reset' });
    const emailData = generatePasswordResetEmail({ code, username: username || toEmail.split('@')[0] });
    const { data, error } = await supabase.functions.invoke('send-otp-email', {
      body: {
        to: toEmail,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      },
    });
    if (error) throw error;
    return { ...data, code };
  } catch (error) {
    throw error;
  }
}

/**
 * Send OTP email (generic, for 2fa_fallback etc.)
 */
export async function sendOTPEmail({ toEmail, code, username, type }) {
  const emailData = type === 'reset'
    ? generatePasswordResetEmail({ code, username })
    : generateVerificationCodeEmail({ code, username });
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: toEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Verify OTP code against database
 */
export async function verifyOTPCode({ email, code, type }) {
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .eq('type', type)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired code. Request a new one.' };
  }

  await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', data.id);

  return { valid: true, userId: data.user_id };
}

/**
 * Generate random 6-digit code and store in database (public API)
 */
export async function generateAndStoreOTP({ userId, email, type }) {
  const code = await _generateAndStoreOTP(supabase, { userId, email, type });
  return { code };
}

/**
 * Delete user via Edge Function (requires admin privileges)
 */
export async function deleteUser(userId) {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });
  if (error) throw error;
  return data;
}

/**
 * Reset password via Edge Function
 */
export async function resetPassword(userId, newPassword) {
  const { data, error } = await supabase.functions.invoke('reset-password', {
    body: { userId, newPassword },
  });
  if (error) throw error;
  return data;
}

export { APP_NAME, APP_URL, SENDER_EMAIL };
