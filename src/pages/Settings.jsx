import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { toast } from '../components/ui/Toast';

const ROLE_OPTIONS = ['Developer', 'Designer', 'Manager', 'Marketing', 'Sales', 'Video Editor', 'Email Marketer', 'Tester'];

export default function Settings() {
  const { profile, updateProfile, mustChangePassword, user } = useAuth();
  const [tab, setTab] = useState(mustChangePassword ? 'password' : 'profile');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {mustChangePassword && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)' }}>
          <p className="text-[13px] font-medium" style={{ color: 'var(--status-overdue)' }}>Please set your personal password before continuing.</p>
        </div>
      )}

      <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border-default)' }}>
        {['profile', 'email', 'password', '2fa'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-[13px] font-medium border-b-2 transition-colors capitalize -mb-px"
            style={{ borderColor: tab === t ? 'var(--text-accent)' : 'transparent', color: tab === t ? 'var(--text-accent)' : 'var(--text-hint)' }}>
            {t === '2fa' ? 'Two-Factor Auth' : t}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileSection profile={profile} updateProfile={updateProfile} />}
      {tab === 'email' && <EmailSection profile={profile} updateProfile={updateProfile} />}
      {tab === 'password' && <PasswordSection userId={user?.id} mustChange={mustChangePassword} updateProfile={updateProfile} />}
      {tab === '2fa' && <TwoFactorSection profile={profile} updateProfile={updateProfile} userId={user?.id} />}
    </div>
  );
}

function ProfileSection({ profile, updateProfile }) {
  const [form, setForm] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    avatar_color: profile?.avatar_color || '#534AB7',
    roles: profile?.roles || [],
  });
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleRole(r) {
    setForm(f => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter(x => x !== r) : [...f.roles, r] }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      toast('Profile updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
        <Input label="Display Name" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="How others see you" />
        <div className="space-y-1">
          <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Avatar Color</label>
          <input type="color" value={form.avatar_color} onChange={e => setForm(f => ({ ...f, avatar_color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer" style={{ border: '1px solid var(--border-default)' }} />
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Roles</label>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(r => (
              <button key={r} type="button" onClick={() => toggleRole(r)}
                className="px-3 py-1 rounded-full text-[11px] border transition-colors"
                style={form.roles.includes(r) ? { background: 'var(--color-teal-300)', color: '#0A1A19', borderColor: 'var(--color-teal-300)' } : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>{r}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Custom role"
              className="flex-1 px-3 py-1.5 rounded-lg text-[13px] outline-none"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customRole.trim()) { toggleRole(customRole.trim()); setCustomRole(''); } } }} />
          </div>
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Profile'}</Button>
      </form>
    </Card>
  );
}

function EmailSection({ profile, updateProfile }) {
  const [email, setEmail] = useState(profile?.email || '');
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ email });
      toast('Email updated');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <div className="p-3 rounded-lg" style={{ background: 'rgba(224,112,80,0.06)', border: '1px solid rgba(224,112,80,0.15)' }}>
          <p className="text-[11px]" style={{ color: '#E07050' }}>Use a real working email — we use it for notifications and account recovery.</p>
        </div>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Email'}</Button>
      </form>
    </Card>
  );
}

function PasswordSection({ userId, mustChange, updateProfile }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (newPass !== confirm) return toast('Passwords do not match', 'error');
    if (newPass.length < 8) return toast('Minimum 8 characters', 'error');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      if (mustChange) await updateProfile({ must_change_password: false });
      await logActivity(userId, null, 'password_changed', {});
      toast('Password updated');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      {mustChange && (
        <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)' }}>
          <p className="text-[13px] font-medium" style={{ color: 'var(--status-overdue)' }}>You must set a new password before continuing.</p>
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <Input label="Current Password" type="password" value={current} onChange={e => setCurrent(e.target.value)} />
        <Input label="New Password" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 8 characters" />
        <Input label="Confirm New Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</Button>
      </form>
    </Card>
  );
}

function TwoFactorSection({ profile, updateProfile, userId }) {
  const [enrolling, setEnrolling] = useState(false);
  const [factorData, setFactorData] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function startEnroll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setFactorData(data);
      setEnrolling(true);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  async function verifyEnroll() {
    if (code.length !== 6) return toast('Enter 6-digit code', 'error');
    setLoading(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factorData.id });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId: factorData.id, challengeId: challenge.id, code });
      if (vErr) throw vErr;
      await updateProfile({ two_factor_enabled: true });
      await logActivity(userId, null, '2fa_enabled', {});
      toast('2FA enabled successfully');
      setEnrolling(false);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  async function disable2FA() {
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const f of factors?.totp || []) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      await updateProfile({ two_factor_enabled: false });
      await logActivity(userId, null, '2fa_disabled', {});
      toast('2FA disabled');
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  if (profile?.two_factor_enabled && !enrolling) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--status-done)' }}>Two-Factor Authentication is enabled</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-hint)' }}>Your account has an extra layer of security.</p>
          </div>
          <Button variant="danger" size="sm" onClick={disable2FA} disabled={loading}>
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </div>
      </Card>
    );
  }

  if (enrolling && factorData) {
    return (
      <Card>
        <div className="space-y-4">
          <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Scan this QR code with your authenticator app:</p>
          <div className="flex justify-center">
            <QRCodeSVG value={factorData.totp.uri} size={200} />
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-hint)' }}>Manual entry code:</p>
            <code className="text-[11px] font-mono break-all" style={{ color: 'var(--text-accent)' }}>{factorData.totp.secret}</code>
          </div>
          <Input label="Enter 6-digit code" value={code} onChange={e => setCode(e.target.value)} placeholder="000000" maxLength={6} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEnrolling(false)}>Cancel</Button>
            <Button onClick={verifyEnroll} disabled={loading}>{loading ? 'Verifying...' : 'Verify & Enable'}</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-3">
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Two-Factor Authentication adds an extra layer of security to your account.</p>
        <Button onClick={startEnroll} disabled={loading}>{loading ? 'Setting up...' : 'Enable 2FA'}</Button>
      </div>
    </Card>
  );
}
