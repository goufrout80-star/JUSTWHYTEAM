// Application constants
// These are safe to commit - no secrets here

export const APP_NAME = 'Just Why Team';
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://team.justwhyus.com';
export const SENDER_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'noreply@team.justwhyus.com';
export const SUPPORT_EMAIL = 'support@justwhyus.com';

// Invite email template
export const INVITE_EMAIL_TEMPLATE = (inviteLink) => ({
  subject: `You've been invited to ${APP_NAME}`,
  body: `You have been invited to join ${APP_NAME}.

Click the link below to complete your registration.
This link expires in 7 days and can only be used once.

${inviteLink}

If you did not expect this email, ignore it.
— ${APP_NAME}`
});

// Email configuration for Supabase SMTP
export const SMTP_CONFIG = {
  senderEmail: SENDER_EMAIL,
  senderName: APP_NAME,
};
