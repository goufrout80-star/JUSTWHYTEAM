// Supabase Edge Function: send-invite-email
// Sends invite email via Resend API using server-side key
// Deploy: supabase functions deploy send-invite-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'noreply@team.justwhyus.com';
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Just Why Team';
const APP_URL = Deno.env.get('APP_URL') || 'https://team.justwhyus.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logoMark = `<svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 4L28 28H4L16 4Z" fill="#00E0C0" fill-opacity="0.35"/><path d="M16 10L24 26H8L16 10Z" fill="#00E0C0"/></svg>`;
const logoSvg = `<img src="${APP_URL}/logo.svg" width="38" height="38" alt="Just Why Team" style="display:inline-block;vertical-align:middle;border:0"> ${logoMark}`;

function generateInviteHtml(inviteLink: string, invitedBy: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>You're invited to ${SENDER_NAME}</title>
  <style>
    body{margin:0;padding:0;background:#0A1A19;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif}
    .wrapper{max-width:520px;margin:40px auto;background:#0F2422;border:1px solid rgba(0,224,192,0.12);border-radius:14px;overflow:hidden}
    .header{padding:28px 32px;border-bottom:1px solid rgba(0,224,192,0.08);text-align:center;display:flex;align-items:center;justify-content:center;gap:10px}
    .logo-text{font-size:20px;font-weight:700;color:#00E0C0;letter-spacing:-0.4px}
    .body{padding:40px 32px}
    h1{color:#E8F4F3;font-size:26px;font-weight:700;margin:0 0 12px;letter-spacing:-0.4px}
    .sub{color:#7A9E9B;font-size:15px;line-height:1.7;margin:0 0 32px}
    .sub strong{color:#E8F4F3}
    .cta{display:block;text-align:center;margin:0 0 24px}
    .cta a{display:inline-block;background:linear-gradient(135deg,#4A7A78,#00E0C0);color:#071412;font-weight:700;font-size:15px;padding:15px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.01em}
    .notice{background:rgba(0,224,192,0.05);border:1px solid rgba(0,224,192,0.15);border-radius:8px;padding:14px 16px;color:#7A9E9B;font-size:12px;text-align:center;margin:0 0 24px}
    .fallback{font-size:11px;color:#4A7A78;line-height:1.6}
    .fallback a{color:#00E0C0;word-break:break-all}
    .footer{padding:18px 32px;border-top:1px solid rgba(0,224,192,0.07);text-align:center;font-size:11px;color:#4A7A78}
    @media(max-width:600px){.wrapper{margin:0;border-radius:0}.body{padding:28px 20px}}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header" style="display:flex;align-items:center;justify-content:center;gap:10px">
      ${logoSvg}
      <span class="logo-text">${SENDER_NAME}</span>
    </div>
    <div class="body">
      <h1>You're invited</h1>
      <p class="sub"><strong>${invitedBy}</strong> added you to <strong>${SENDER_NAME}</strong>. Click below to complete your registration and join the team.</p>
      <div class="cta">
        <a href="${inviteLink}">Complete Registration &rarr;</a>
      </div>
      <div class="notice">Link expires in 7 days &middot; One-time use only</div>
      <p class="fallback">If the button doesn't work, copy this link:<br><a href="${inviteLink}">${inviteLink}</a></p>
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

    const { toEmail, inviteLink, invitedBy } = await req.json();

    if (!toEmail || !inviteLink || !invitedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: toEmail, inviteLink, invitedBy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: toEmail,
        subject: `You've been invited to ${SENDER_NAME}`,
        html: generateInviteHtml(inviteLink, invitedBy),
        text: `${invitedBy} added you to ${SENDER_NAME}.\n\nComplete your registration: ${inviteLink}\n\nLink expires in 7 days and is one-time use only.`,
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
    console.error('[send-invite-email]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
