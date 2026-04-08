// Email Service - Client-side helper to call Supabase Edge Functions
// Note: In production, you should set up Row Level Security policies to control who can send emails

import { supabase } from './supabase';
import { 
  inviteEmailTemplate, 
  passwordResetTemplate, 
  welcomeEmailTemplate,
  APP_NAME,
  SENDER_EMAIL 
} from './emailTemplates';

/**
 * Send email via Supabase Edge Function
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content (optional)
 */
export async function sendEmailViaEdgeFunction({ to, subject, html, text }) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to, subject, html, text }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send invite email to new user
 * @param {string} email - Recipient email
 * @param {string} inviteLink - Registration link with token
 * @param {string} invitedBy - Name of admin who sent invite
 */
export async function sendInviteEmail(email, inviteLink, invitedBy = 'Admin') {
  const template = inviteEmailTemplate(inviteLink, invitedBy);
  return sendEmailViaEdgeFunction({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} resetLink - Password reset link
 */
export async function sendPasswordResetEmail(email, resetLink) {
  const template = passwordResetTemplate(resetLink);
  return sendEmailViaEdgeFunction({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * Send welcome email after registration
 * @param {string} email - User's email
 * @param {string} username - User's username
 */
export async function sendWelcomeEmail(email, username) {
  const template = welcomeEmailTemplate(username);
  return sendEmailViaEdgeFunction({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
}

/**
 * Send notification when user creates an invite (for logging/tracking)
 * This is called from the CreateUserModal component
 */
export async function notifyInviteCreated(inviteData) {
  console.log('[EmailService] Invite created:', inviteData);
  // In production, you might want to notify admins or log this to a table
  return { success: true };
}

export { APP_NAME, SENDER_EMAIL };
