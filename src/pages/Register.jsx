import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ROLE_OPTIONS = ['Developer', 'Designer', 'Manager', 'Marketing', 'Sales', 'Video Editor', 'Email Marketer', 'Tester'];

export default function Register() {
  const { token } = useParams();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [customRole, setCustomRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        // Strict token validation: must exist, not used, and not expired
        const { data, error } = await supabase
          .from('invite_tokens')
          .select('*')
          .eq('token', token)
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();
        
        if (error || !data) {
          console.error('Token validation failed:', error);
          setTokenValid(false);
        } else {
          setTokenValid(true);
          setTokenData(data);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenValid(false);
      }
    }
    if (token) validate();
    else setTokenValid(false);
  }, [token]);

  const checkUsername = useCallback(async (val) => {
    if (val.length < 2) { setUsernameAvailable(null); return; }
    const { data } = await supabase.from('profiles').select('id').eq('username', val).maybeSingle();
    setUsernameAvailable(!data);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (username) checkUsername(username); }, 400);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  function toggleRole(role) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  }

  function addCustomRole() {
    if (customRole.trim() && !roles.includes(customRole.trim())) {
      setRoles(prev => [...prev, customRole.trim()]);
      setCustomRole('');
    }
  }

  async function handleRegister() {
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setError('');
    setLoading(true);
    try {
      const data = await signUp(email, password, username);
      if (data.user) {
        await new Promise(r => setTimeout(r, 1500));
        const colors = ['#534AB7', '#E74C3C', '#2ECC71', '#F39C12', '#3498DB', '#9B59B6', '#1ABC9C', '#E67E22'];
        await supabase.from('profiles').update({
          roles,
          avatar_color: colors[Math.floor(Math.random() * colors.length)],
          must_change_password: false,
        }).eq('id', data.user.id);
        await supabase.from('invite_tokens').update({
          used: true, used_by: data.user.id,
        }).eq('id', tokenData.id);
        await logActivity(data.user.id, null, 'user_registered', { username });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-accent)' }} />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center max-w-sm fade-in">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01" stroke="var(--status-overdue)" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="var(--status-overdue)" strokeWidth="1.5"/></svg>
          </div>
          <h1 className="text-[18px] font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Link no longer valid</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-hint)' }}>This registration link is invalid, expired, or has already been used. Ask your admin for a new one.</p>
        </div>
      </div>
    );
  }

  const isValidUsername = (val) => /^[a-zA-Z0-9._]+$/.test(val) && val.length >= 3;
  const usernameError = username && !isValidUsername(username) ? 'Username: 3+ chars, letters/numbers/dots/underscores only, no spaces' : null;

  const steps = [
    <div key="username" className="space-y-4">
      <Input label="Pick your username" value={username} onChange={e => setUsername(e.target.value)} 
        placeholder="e.g. john_doe" 
        pattern="^[a-zA-Z0-9._]+$"
        title="3+ characters. Letters, numbers, dots (.) and underscores (_) only. No spaces."
        required />
      {usernameError && <p className="text-[11px]" style={{ color: 'var(--status-overdue)' }}>{usernameError}</p>}
      {usernameAvailable === false && !usernameError && <p className="text-[11px]" style={{ color: 'var(--status-overdue)' }}>Username taken</p>}
      {usernameAvailable === true && !usernameError && <p className="text-[11px]" style={{ color: 'var(--status-done)' }}>Available!</p>}
      <Button className="w-full" disabled={!username || usernameAvailable === false || usernameError} onClick={() => setStep(1)}>Next</Button>
    </div>,
    <div key="email" className="space-y-4">
      <Input label="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" required />
      <div className="p-3 rounded-lg" style={{ background: 'rgba(224,112,80,0.06)', border: '1px solid rgba(224,112,80,0.15)' }}>
        <p className="text-[11px]" style={{ color: '#E07050' }}>Use a real working email — we will use it for important features later.</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
        <Button className="flex-1" disabled={!email} onClick={() => setStep(2)}>Next</Button>
      </div>
    </div>,
    <div key="password" className="space-y-4">
      <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />
      <Input label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
        <Button className="flex-1" disabled={!password || !confirmPassword} onClick={() => setStep(3)}>Next</Button>
      </div>
    </div>,
    <div key="roles" className="space-y-4">
      <label className="block text-[11px] font-medium uppercase tracking-[0.04em]" style={{ color: 'var(--text-hint)' }}>Pick your roles</label>
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map(r => (
          <button key={r} type="button" onClick={() => toggleRole(r)}
            className="px-3 py-1.5 rounded-full text-[12px] border transition-colors"
            style={roles.includes(r) ? { background: 'var(--color-teal-300)', color: '#0A1A19', borderColor: 'var(--color-teal-300)' } : { background: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}>
            {r}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Custom role..."
          className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomRole(); } }} />
        <Button variant="secondary" size="sm" onClick={addCustomRole}>Add</Button>
      </div>
      {roles.length > 0 && <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>Selected: {roles.join(', ')}</p>}
      {error && <p className="text-[13px]" style={{ color: 'var(--status-overdue)' }}>{error}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
        <Button className="flex-1" disabled={loading || roles.length === 0} onClick={handleRegister}>
          {loading ? 'Creating account...' : 'Complete Registration'}
        </Button>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="" width="40" height="40" className="mx-auto mb-4" />
          <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>Create your account</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-hint)' }}>Step {step + 1} of 4</p>
          <div className="flex gap-1 mt-3 justify-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-1 w-8 rounded-full transition-colors" style={{ background: i <= step ? 'var(--text-accent)' : 'var(--border-default)' }} />
            ))}
          </div>
        </div>
        <div className="card p-6">
          {steps[step]}
        </div>
      </div>
    </div>
  );
}
