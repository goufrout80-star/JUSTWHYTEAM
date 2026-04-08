import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { logActivity } from '../lib/activityLogger';
import { sendVerificationCodeEmail, verifyOTPCode } from '../lib/emails';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import OTPInput from '../components/ui/OTPInput';
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

function getPasswordStrength(pass) {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return Math.min(score, 3);
}

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  return local[0] + '***@' + domain;
}

function PasswordSection({ userId, mustChange, updateProfile }) {
  const { profile } = useAuth();
  // step: 0=idle, 1=code-sent, 2=code-verified → new password
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const userEmail = profile?.email || '';
  const strength = getPasswordStrength(newPass);
  const strengthColors = ['','#E05555','#E09A20','#00E0C0'];
  const strengthLabels = ['','Weak','Good','Strong'];
  const passMatch = newPass && confirm && newPass === confirm;

  async function handleSendCode() {
    setSending(true);
    try {
      await sendVerificationCodeEmail({ toEmail: userEmail, username: profile?.username, userId });
      setStep(1);
    } catch (err) { toast(err.message, 'error'); }
    finally { setSending(false); }
  }

  async function handleResend() {
    setOtpError(false); setOtpSuccess(false);
    try { await sendVerificationCodeEmail({ toEmail: userEmail, username: profile?.username, userId }); }
    catch { /* cooldown timer still resets */ }
  }

  async function handleVerifyCode(code) {
    setOtpError(false);
    const result = await verifyOTPCode({ email: userEmail, code, type: 'verify' });
    if (!result.valid) { setOtpError(result.error || 'Invalid or expired code.'); return; }
    setOtpSuccess(true);
    setTimeout(() => setStep(2), 600);
  }

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
      toast('Password updated successfully');
      setStep(0); setNewPass(''); setConfirm(''); setOtpSuccess(false);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  const inputStyle = { width:'100%', padding:'10px 13px', borderRadius:8, fontSize:13, outline:'none', background:'rgba(0,224,192,0.04)', border:'1px solid rgba(0,224,192,0.14)', color:'var(--text-primary)', fontFamily:'inherit', boxSizing:'border-box' };

  return (
    <Card>
      {mustChange && (
        <div className="p-3 rounded-lg mb-4" style={{ background:'rgba(224,85,85,0.08)', border:'1px solid rgba(224,85,85,0.2)' }}>
          <p className="text-[13px] font-medium" style={{ color:'var(--status-overdue)' }}>You must set a new password before continuing.</p>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-[13px]" style={{ color:'var(--text-secondary)' }}>
            To change your password, we'll send a verification code to your email for security.
          </p>
          <Button onClick={handleSendCode} disabled={sending}>
            {sending ? 'Sending…' : 'Send Verification Code'}
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="text-center pb-1">
            <p className="text-[13px]" style={{ color:'var(--text-secondary)' }}>
              We sent a 6-digit code to <strong style={{ color:'var(--text-primary)' }}>{maskEmail(userEmail)}</strong>
            </p>
            <p className="text-[12px] mt-1" style={{ color:'var(--text-hint)' }}>Expires in 10 minutes</p>
          </div>
          <OTPInput onComplete={handleVerifyCode} onResend={handleResend} error={otpError} success={otpSuccess} />
          {otpSuccess && <p className="text-center text-[12px]" style={{ color:'#00E0C0' }}>Verified! Setting up new password…</p>}
          <button onClick={() => setStep(0)} style={{ fontSize:12, color:'var(--text-hint)', background:'none', border:'none', cursor:'pointer', display:'block', margin:'0 auto' }}>← Cancel</button>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-[13px]" style={{ color:'var(--text-secondary)' }}>Identity verified. Enter your new password.</p>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.04em] mb-1" style={{ color:'var(--text-hint)' }}>New Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 8 characters" style={{ ...inputStyle, paddingRight:36 }} autoFocus />
              <button type="button" onClick={() => setShowPass(v=>!v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-hint)', display:'flex' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.1"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.1"/>{showPass && <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.1"/>}</svg>
              </button>
            </div>
            {newPass && (
              <div style={{ marginTop:5 }}>
                <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                  {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength?strengthColors[strength]:'rgba(0,224,192,0.08)', transition:'background 0.3s' }}/>)}
                </div>
                {strength>0 && <span style={{ fontSize:11, color:strengthColors[strength] }}>{strengthLabels[strength]} password</span>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.04em] mb-1" style={{ color:'var(--text-hint)' }}>Confirm Password</label>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat new password" style={{ ...inputStyle, paddingRight:36 }} />
              {passMatch && <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)' }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#00E0C0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            </div>
            {confirm && !passMatch && <p style={{ fontSize:11, color:'#E05555', marginTop:3 }}>Passwords don't match</p>}
          </div>
          <Button type="submit" disabled={loading || !passMatch}>{loading ? 'Updating…' : 'Update Password'}</Button>
        </form>
      )}
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
