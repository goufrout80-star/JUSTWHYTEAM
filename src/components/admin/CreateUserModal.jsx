import { useState } from 'react';
import { Copy, Check, Mail, Send, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../lib/activityLogger';
import { sendInviteEmail } from '../../lib/emailService';
import { APP_NAME } from '../../lib/constants';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function CreateUserModal({ onClose }) {
  const { profile } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!username.trim()) return setError('Enter a username hint (optional)');
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('invite_tokens')
        .insert({ created_by: profile.id, email: email || null })
        .select()
        .single();
      if (err) throw err;
      const base = window.location.origin;
      const link = `${base}/register/${data.token}`;
      setInviteLink(link);
      await logActivity(profile.id, null, 'invite_user', { username_hint: username, email: email || null });
      
      // Auto-send email if provided
      if (email) {
        await handleSendEmail(link);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail(link) {
    if (!email) {
      setEmailError('Please enter an email address');
      return;
    }
    setSendingEmail(true);
    setEmailError('');
    try {
      const result = await sendInviteEmail(email, link, profile.username);
      if (result.success) {
        setEmailSent(true);
      } else {
        setEmailError('Failed to send email. You can still share the link manually.');
      }
    } catch (err) {
      setEmailError('Email service temporarily unavailable. Share the link manually.');
    } finally {
      setSendingEmail(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {!inviteLink ? (
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <p className="text-[13px]" style={{ color: 'var(--status-overdue)' }}>{error}</p>}
          
          <Input label="Username (hint for user)" value={username}
            onChange={e => setUsername(e.target.value)} placeholder="e.g. john_doe" required />
          
          <div className="space-y-1">
            <Input 
              label="Email (optional)" 
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="user@example.com" />
            {emailError && <p className="text-[11px]" style={{ color: 'var(--status-overdue)' }}>{emailError}</p>}
          </div>
          
          <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(0,224,192,0.04)', border: '1px solid var(--border-default)' }}>
            <p className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-hint)' }}>
              <Mail size={12} />
              {email ? 'A professional invite email will be sent automatically.' : 'Leave email empty to share the link manually via WhatsApp, Slack, etc.'}
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin mr-1" /> : <Send size={16} className="mr-1" />}
              {loading ? 'Creating...' : email ? 'Send Invite' : 'Generate Link'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {emailSent ? (
              <>
                <Check size={20} color="var(--status-done)" />
                <p className="text-[14px] font-medium" style={{ color: 'var(--status-done)' }}>Invite email sent to {email}!</p>
              </>
            ) : (
              <>
                <Check size={20} color="var(--status-done)" />
                <p className="text-[14px] font-medium" style={{ color: 'var(--status-done)' }}>Invite link created!</p>
              </>
            )}
          </div>
          
          {!emailSent && email && (
            <div className="p-3 rounded-lg" style={{ background: 'rgba(224,112,80,0.06)', border: '1px solid rgba(224,112,80,0.15)' }}>
              <p className="text-[12px]" style={{ color: 'var(--text-hint)' }}>
                Email not sent automatically. You can send it manually or copy the link below.
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={inviteLink}
              className="flex-1 px-3 py-2 rounded-lg text-[12px] font-mono"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-accent)' }} />
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          
          <div className="p-3 rounded-lg" style={{ background: 'rgba(0,224,192,0.04)', border: '1px solid var(--border-default)' }}>
            <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>
              <strong>Expires in 7 days</strong> • Can only be used once • Links to {APP_NAME}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}
