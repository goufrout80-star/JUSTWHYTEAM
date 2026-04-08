import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { logActivity } from '../../lib/activityLogger';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function CreateUserModal({ onClose }) {
  const { profile } = useAuth();
  const [username, setUsername] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!username.trim()) return setError('Enter a username hint (optional)');
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('invite_tokens')
        .insert({ created_by: profile.id })
        .select()
        .single();
      if (err) throw err;
      const base = window.location.origin;
      setInviteLink(`${base}/register/${data.token}`);
      await logActivity(profile.id, null, 'invite_user', { username_hint: username });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            onChange={e => setUsername(e.target.value)} placeholder="e.g. john" />
          <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>
            A one-time registration link will be generated. Share it with the user via WhatsApp, email, or DM.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] font-medium" style={{ color: 'var(--status-done)' }}>Invite link created!</p>
          <div className="flex items-center gap-2">
            <input type="text" readOnly value={inviteLink}
              className="flex-1 px-3 py-2 rounded-lg text-[12px] font-mono"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-accent)' }} />
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>
            This link expires in 7 days and can only be used once.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </div>
  );
}
