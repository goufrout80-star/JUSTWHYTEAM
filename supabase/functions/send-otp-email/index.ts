// Supabase Edge Function: send-otp-email
// Sends branded OTP verification / password-reset emails via Resend
// Deploy: supabase functions deploy send-otp-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'noreply@team.justwhyus.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Just Why Team';
const APP_URL = Deno.env.get('APP_URL') || 'https://team.justwhyus.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logoSvg = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L28 28H4L16 4Z" fill="#00E0C0" fill-opacity="0.35"/>
  <path d="M16 10L24 26H8L16 10Z" fill="#00E0C0"/>
</svg>`;

const codeBoxes = (code: string) => {
  const p1 = code.slice(0, 3);
  const p2 = code.slice(3, 6);
  const boxStyle = 'display:inline-block;font-size:44px;font-weight:700;font-family:monospace;color:#00E0C0;background:rgba(0,224,192,0.08);border:1px solid rgba(0,224,192,0.25);border-radius:10px;padding:14px 20px;letter-spacing:6px';
  return `
    <div style="text-align:center;margin:28px 0">
      <span style="${boxStyle}">${p1}</span>
      <span style="font-size:28px;color:rgba(0,224,192,0.3);margin:0 8px">&middot;</span>
      <span style="${boxStyle}">${p2}</span>
    </div>`;
};

function generateVerifyHtml(code: string, username: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your ${SENDER_NAME} verification code</title>
  <style>
    body{margin:0;padding:0;background:#0A1A19;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}
    .wrapper{max-width:520px;margin:40px auto;background:#0F2422;border:1px solid rgba(0,224,192,0.12);border-radius:14px;overflow:hidden}
    .header{padding:24px 32px;border-bottom:1px solid rgba(0,224,192,0.08);text-align:center;display:flex;align-items:center;justify-content:center;gap:10px}
    .logo-text{font-size:18px;font-weight:700;color:#00E0C0}
    .body{padding:36px 32px}
    h1{color:#E8F4F3;font-size:24px;font-weight:700;margin:0 0 10px}
    .sub{color:#7A9E9B;font-size:14px;line-height:1.7;margin:0 0 8px}
    .notice{color:#4A7A78;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center}
    .security{background:rgba(0,224,192,0.04);border:1px solid rgba(0,224,192,0.1);border-radius:8px;padding:14px 16px;font-size:12px;color:#4A7A78;line-height:1.6;margin-top:24px}
    .footer{padding:18px 32px;border-top:1px solid rgba(0,224,192,0.07);text-align:center;font-size:11px;color:#4A7A78}
    @media(max-width:600px){.wrapper{margin:0;border-radius:0}.body{padding:24px 16px}}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      ${logoSvg}
      <span class="logo-text">${SENDER_NAME}</span>
    </div>
    <div class="body">
      <h1>Verify your identity</h1>
      <p class="sub">Hi${username ? ` <strong style="color:#E8F4F3">@${username}</strong>` : ''}, enter this code in ${SENDER_NAME}. It expires in <strong style="color:#E8F4F3">10 minutes</strong>.</p>
      ${codeBoxes(code)}
      <p class="notice">Expires in 10 minutes</p>
      <div class="security">This code was requested from ${SENDER_NAME}. If you didn't request this, you can safely ignore this email — your account remains secure.</div>
    </div>
    <div class="footer">${SENDER_NAME} &middot; ${APP_URL} &middot; This is an automated message, do not reply</div>
  </div>
</body>
</html>`;
}

const shieldSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 4L6 10v12c0 8.284 6.148 15.472 14 17 7.852-1.528 14-8.716 14-17V10L20 4z" fill="rgba(0,224,192,0.12)" stroke="#00E0C0" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M14 20l4 4 8-8" stroke="#00E0C0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function generateResetHtml(code: string, username: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Reset your ${SENDER_NAME} password</title>
  <style>
    body{margin:0;padding:0;background:#0A1A19;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}
    .wrapper{max-width:520px;margin:40px auto;background:#0F2422;border:1px solid rgba(0,224,192,0.12);border-radius:14px;overflow:hidden}
    .header{padding:24px 32px;border-bottom:1px solid rgba(0,224,192,0.08);text-align:center;display:flex;align-items:center;justify-content:center;gap:10px}
    .logo-text{font-size:18px;font-weight:700;color:#00E0C0}
    .body{padding:36px 32px;text-align:center}
    h1{color:#E8F4F3;font-size:24px;font-weight:700;margin:16px 0 10px}
    .sub{color:#7A9E9B;font-size:14px;line-height:1.7;margin:0 0 4px;text-align:center}
    .label{color:#7A9E9B;font-size:12px;margin:0 0 4px}
    .expiry{color:#4A7A78;font-size:12px;margin:12px 0 0}
    .security-box{background:rgba(224,85,85,0.05);border:1px solid rgba(224,85,85,0.15);border-radius:8px;padding:14px 16px;font-size:12px;color:#7A9E9B;line-height:1.6;margin-top:24px;text-align:left}
    .footer{padding:18px 32px;border-top:1px solid rgba(0,224,192,0.07);text-align:center;font-size:11px;color:#4A7A78}
    @media(max-width:600px){.wrapper{margin:0;border-radius:0}.body{padding:24px 16px}}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      ${logoSvg}
      <span class="logo-text">${SENDER_NAME}</span>
    </div>
    <div class="body">
      ${shieldSvg}
      <h1>Password reset requested</h1>
      <p class="sub">We received a request to reset the password for${username ? ` <strong style="color:#E8F4F3">@${username}</strong>` : ' your account'}.</p>
      <p class="label">Enter this code to reset your password</p>
      ${codeBoxes(code)}
      <p class="expiry">This code expires in 10 minutes</p>
      <div class="security-box">If you didn't request this, your account is safe. No changes have been made. You can safely ignore this email.</div>
    </div>
    <div class="footer">${SENDER_NAME} &middot; ${APP_URL} &middot; This is an automated message, do not reply</div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { toEmail, code, username, type } = await req.json();

    if (!toEmail || !code || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: toEmail, code, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isReset = type === 'reset';
    const subject = isReset
      ? `Reset your ${SENDER_NAME} password`
      : `Your ${SENDER_NAME} verification code`;
    const html = isReset
      ? generateResetHtml(code, username || '')
      : generateVerifyHtml(code, username || '');
    const text = isReset
      ? `Reset your ${SENDER_NAME} password.\n\nYour code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, your account is safe.`
      : `Your ${SENDER_NAME} verification code: ${code}\n\nThis code expires in 10 minutes.`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: toEmail,
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error: ${errText}`);
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ success: true, messageId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[send-otp-email]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
