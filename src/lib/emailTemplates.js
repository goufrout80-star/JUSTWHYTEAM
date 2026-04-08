// Professional HTML Email Templates for Just Why Team
// These templates work with Resend, SendGrid, or any SMTP provider

export const APP_NAME = 'Just Why Team';
export const APP_URL = 'https://team.justwhyus.com';
export const SENDER_EMAIL = 'noreply@team.justwhyus.com';
export const SUPPORT_EMAIL = 'support@justwhyus.com';

// Brand colors
const COLORS = {
  primary: '#00E0C0',
  primaryDark: '#00BFA0',
  background: '#0A192F',
  surface: '#112240',
  text: '#E6F1FF',
  textMuted: '#8892B0',
  error: '#E74C3C',
  success: '#2ECC71',
  warning: '#F39C12'
};

// Base email template wrapper
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${COLORS.background};
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${COLORS.surface};
      border-radius: 12px;
      overflow: hidden;
      margin-top: 40px;
      margin-bottom: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      margin-bottom: 16px;
    }
    .header h1 {
      color: #0A192F;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 30px;
      color: ${COLORS.text};
    }
    .content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
      color: ${COLORS.text};
    }
    .content strong {
      color: ${COLORS.primary};
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);
      color: #0A192F !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 20px rgba(0,224,192,0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .alert {
      background: rgba(0,224,192,0.1);
      border: 1px solid ${COLORS.primary};
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      font-size: 14px;
    }
    .alert-warning {
      background: rgba(243,156,18,0.1);
      border-color: ${COLORS.warning};
    }
    .footer {
      background: rgba(17,34,64,0.5);
      padding: 30px;
      text-align: center;
      border-top: 1px solid rgba(0,224,192,0.1);
    }
    .footer p {
      font-size: 13px;
      color: ${COLORS.textMuted};
      margin: 8px 0;
    }
    .footer a {
      color: ${COLORS.primary};
      text-decoration: none;
    }
    .social-links {
      margin-top: 20px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${COLORS.primary}, transparent);
      margin: 30px 0;
    }
    .code-box {
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      padding: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      letter-spacing: 4px;
      text-align: center;
      color: ${COLORS.primary};
      margin: 20px 0;
      border: 1px solid rgba(0,224,192,0.2);
    }
    @media (max-width: 600px) {
      .container {
        margin: 20px;
        border-radius: 8px;
      }
      .header, .content, .footer {
        padding: 24px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg class="logo" viewBox="0 0 60 60" fill="none">
        <circle cx="30" cy="30" r="28" stroke="#0A192F" stroke-width="2" fill="none"/>
        <path d="M20 30 L28 38 L40 22" stroke="#0A192F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h1>${APP_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p>Questions? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
      <p style="font-size: 11px; margin-top: 16px; opacity: 0.6;">
        This email was sent from ${SENDER_EMAIL}. If you didn't expect this email, please ignore it.
      </p>
    </div>
  </div>
</body>
</html>
`;

// 1. INVITE EMAIL TEMPLATE
export const inviteEmailTemplate = (inviteLink, invitedBy = 'Admin') => ({
  subject: `🎉 You've been invited to join ${APP_NAME}`,
  html: emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px; color: ${COLORS.text};">You're Invited!</h2>
    
    <p>Hello,</p>
    
    <p><strong>${invitedBy}</strong> has invited you to join <strong>${APP_NAME}</strong> — a modern workspace for teams to collaborate on projects.</p>
    
    <div class="divider"></div>
    
    <p style="text-align: center; font-size: 14px; color: ${COLORS.textMuted};">
      Click the button below to accept your invitation and complete your registration:
    </p>
    
    <p style="text-align: center;">
      <a href="${inviteLink}" class="button" style="color: #0A192F !important;">Accept Invitation</a>
    </p>
    
    <div class="alert">
      <strong>⚡ Important:</strong> This invitation link expires in <strong>7 days</strong> and can only be used once.
    </div>
    
    <p style="font-size: 14px; color: ${COLORS.textMuted};">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteLink}" style="color: ${COLORS.primary}; word-break: break-all;">${inviteLink}</a>
    </p>
    
    <p style="margin-top: 30px;">Welcome to the team!<br>— The ${APP_NAME} Team</p>
  `, `You've been invited to ${APP_NAME}`),
  text: `You've been invited to join ${APP_NAME}

${invitedBy} has invited you to join ${APP_NAME}.

Click this link to accept your invitation:
${inviteLink}

This link expires in 7 days and can only be used once.

If you didn't expect this email, please ignore it.
— The ${APP_NAME} Team`
});

// 2. PASSWORD RESET EMAIL TEMPLATE
export const passwordResetTemplate = (resetLink) => ({
  subject: `🔐 Reset your ${APP_NAME} password`,
  html: emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px; color: ${COLORS.text};">Password Reset Request</h2>
    
    <p>Hello,</p>
    
    <p>We received a request to reset your password for your <strong>${APP_NAME}</strong> account. If you made this request, click the button below to set a new password:</p>
    
    <p style="text-align: center;">
      <a href="${resetLink}" class="button" style="color: #0A192F !important;">Reset Password</a>
    </p>
    
    <div class="alert alert-warning">
      <strong>⏰ Time Limit:</strong> This reset link expires in <strong>1 hour</strong> for security reasons.
    </div>
    
    <div class="alert" style="background: rgba(231,76,60,0.1); border-color: ${COLORS.error};">
      <strong>🛡️ Security:</strong> If you didn't request this password reset, please ignore this email or contact support immediately if you're concerned about your account's security.
    </div>
    
    <p style="font-size: 14px; color: ${COLORS.textMuted};">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: ${COLORS.primary}; word-break: break-all;">${resetLink}</a>
    </p>
    
    <p style="margin-top: 30px;">Stay secure,<br>— The ${APP_NAME} Security Team</p>
  `, `Reset your ${APP_NAME} password`),
  text: `Reset your ${APP_NAME} password

We received a request to reset your password. Click this link to set a new password:
${resetLink}

This link expires in 1 hour.

If you didn't request this, please ignore this email.
— The ${APP_NAME} Security Team`
});

// 3. WELCOME EMAIL TEMPLATE (sent after registration)
export const welcomeEmailTemplate = (username) => ({
  subject: `🚀 Welcome to ${APP_NAME}, ${username}!`,
  html: emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px; color: ${COLORS.text};">Welcome aboard, ${username}!</h2>
    
    <p>Your account has been successfully created. You're now part of the <strong>${APP_NAME}</strong> workspace.</p>
    
    <div class="divider"></div>
    
    <h3 style="color: ${COLORS.text}; font-size: 18px;">Quick Start Guide:</h3>
    
    <p>🎯 <strong>Dashboard</strong> — View all your projects and tasks at a glance</p>
    <p>📁 <strong>Projects</strong> — Create and manage team projects</p>
    <p>✅ <strong>Tasks</strong> — Track work with status updates (Todo, In Progress, Done)</p>
    <p>👥 <strong>Collaboration</strong> — Work together with your team members</p>
    <p>🔔 <strong>Inbox</strong> — Stay updated with notifications and mentions</p>
    
    <div class="divider"></div>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/dashboard" class="button" style="color: #0A192F !important;">Go to Dashboard</a>
    </p>
    
    <div class="alert">
      <strong>💡 Pro Tip:</strong> Set up your profile and notification preferences in Settings to customize your experience.
    </div>
    
    <p style="margin-top: 30px;">Excited to have you on board!<br>— The ${APP_NAME} Team</p>
  `, `Welcome to ${APP_NAME}`),
  text: `Welcome to ${APP_NAME}, ${username}!

Your account has been successfully created.

Quick Start:
- Dashboard: View all your projects and tasks
- Projects: Create and manage team projects  
- Tasks: Track work with status updates
- Inbox: Stay updated with notifications

Get started: ${APP_URL}/dashboard

— The ${APP_NAME} Team`
});

// 4. PASSWORD CHANGED CONFIRMATION
export const passwordChangedTemplate = (username) => ({
  subject: `✅ Your ${APP_NAME} password has been changed`,
  html: emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px; color: ${COLORS.text};">Password Updated</h2>
    
    <p>Hello ${username},</p>
    
    <p>This is a confirmation that your password for <strong>${APP_NAME}</strong> was successfully changed.</p>
    
    <div class="alert" style="background: rgba(46,204,113,0.1); border-color: ${COLORS.success};">
      <strong>✅ Change Confirmed</strong><br>
      Time: ${new Date().toLocaleString()}<br>
      If you didn't make this change, please contact support immediately.
    </div>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/login" class="button" style="color: #0A192F !important;">Sign In</a>
    </p>
    
    <p>— The ${APP_NAME} Security Team</p>
  `, `Password changed for ${APP_NAME}`),
  text: `Password Updated

Hello ${username},

Your password for ${APP_NAME} was successfully changed on ${new Date().toLocaleString()}.

If you didn't make this change, contact support immediately at ${SUPPORT_EMAIL}.

— The ${APP_NAME} Security Team`
});

// 5. NEW DEVICE LOGIN ALERT (security notification)
export const newDeviceLoginTemplate = (username, deviceInfo, location) => ({
  subject: `⚠️ New login to your ${APP_NAME} account`,
  html: emailWrapper(`
    <h2 style="margin-top: 0; font-size: 22px; color: ${COLORS.text};">New Device Detected</h2>
    
    <p>Hello ${username},</p>
    
    <p>We noticed a new sign-in to your <strong>${APP_NAME}</strong> account:</p>
    
    <div class="alert alert-warning">
      <strong>📱 Device:</strong> ${deviceInfo}<br>
      <strong>📍 Location:</strong> ${location}<br>
      <strong>🕐 Time:</strong> ${new Date().toLocaleString()}
    </div>
    
    <p style="text-align: center;">
      <a href="${APP_URL}/settings" class="button" style="color: #0A192F !important;">Review Account</a>
    </p>
    
    <div class="alert" style="background: rgba(231,76,60,0.1); border-color: ${COLORS.error};">
      <strong>🚨 Not you?</strong> If you don't recognize this activity, change your password immediately and contact support.
    </div>
    
    <p>— The ${APP_NAME} Security Team</p>
  `, `New login to ${APP_NAME}`),
  text: `New login to your ${APP_NAME} account

Hello ${username},

New sign-in detected:
Device: ${deviceInfo}
Location: ${location}
Time: ${new Date().toLocaleString()}

If this wasn't you, secure your account: ${APP_URL}/settings

— The ${APP_NAME} Security Team`
});

// Helper function to send emails (to be used with Supabase Edge Functions or backend)
export async function sendEmail({ to, subject, html, text, from = SENDER_EMAIL }) {
  // This should be called from a server-side function (Supabase Edge Function, etc.)
  // Client-side code should NOT contain API keys
  const emailData = {
    from: `${APP_NAME} <${from}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  };
  
  console.log('[Email Template Ready]', { to, subject, from });
  return emailData;
}

// Export all templates
export default {
  inviteEmailTemplate,
  passwordResetTemplate,
  welcomeEmailTemplate,
  passwordChangedTemplate,
  newDeviceLoginTemplate,
  sendEmail,
  APP_NAME,
  APP_URL,
  SENDER_EMAIL,
  SUPPORT_EMAIL
};
