import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { logActivity } from '../lib/activityLogger';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function getLockoutData() {
  const data = localStorage.getItem('loginLockout');
  if (!data) return null;
  return JSON.parse(data);
}

function setLockoutData(attempts, lockedUntil = null) {
  localStorage.setItem('loginLockout', JSON.stringify({ attempts, lockedUntil }));
}

function clearLockoutData() {
  localStorage.removeItem('loginLockout');
}

function formatCountdown(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Login() {
  const { signIn, profile } = useAuth();
  const { workspace } = useWorkspace();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(null);

  const redirectTo = params.get('redirect') || '/dashboard';

  // Check for active lockout on mount
  useEffect(() => {
    const lockout = getLockoutData();
    if (lockout?.lockedUntil && new Date(lockout.lockedUntil) > new Date()) {
      startLockoutTimer(new Date(lockout.lockedUntil));
    }
  }, []);

  function startLockoutTimer(lockedUntil) {
    const updateTimer = () => {
      const remaining = lockedUntil - new Date();
      if (remaining <= 0) {
        clearLockoutData();
        setLockoutTimer(null);
        setError('');
        return;
      }
      setLockoutTimer(formatCountdown(remaining));
      setTimeout(updateTimer, 1000);
    };
    updateTimer();
  }

  useEffect(() => {
    if (profile) {
      if (profile.two_factor_enabled) navigate('/verify-2fa');
      else if (profile.must_change_password) navigate('/settings');
      else navigate(redirectTo);
    }
  }, [profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Check for active lockout
    const lockout = getLockoutData();
    if (lockout?.lockedUntil && new Date(lockout.lockedUntil) > new Date()) {
      setError(`Too many failed attempts. Try again in ${lockoutTimer || formatCountdown(new Date(lockout.lockedUntil) - new Date())}`);
      return;
    }

    setLoading(true);
    try {
      const data = await signIn(identifier, password);
      if (data.user) {
        clearLockoutData(); // Reset on successful login
        await logActivity(data.user.id, null, 'login', { identifier });
      }
    } catch (err) {
      // Track failed attempt
      const lockout = getLockoutData();
      const attempts = (lockout?.attempts || 0) + 1;

      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
        setLockoutData(attempts, lockedUntil.toISOString());
        startLockoutTimer(lockedUntil);
        setError(`Too many failed attempts. Try again in ${LOCKOUT_MINUTES}:00`);
      } else {
        setLockoutData(attempts);
        const remaining = MAX_ATTEMPTS - attempts;
        setError(`${err.message || 'Login failed'}. ${remaining} attempts remaining.`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <ParticleBackground />
      <div className="relative w-full max-w-sm fade-in" style={{ zIndex: 1 }}>
        <div className="text-center mb-8">
          <div className="float-anim inline-block mb-4">
            <div style={{ padding: 10, borderRadius: 16, background: 'rgba(0,224,192,0.08)', border: '1px solid rgba(0,224,192,0.18)', boxShadow: '0 0 24px rgba(0,224,192,0.15), 0 0 8px rgba(0,224,192,0.08)' }}>
              <img src="/logo.svg" alt="" width="40" height="40" />
            </div>
          </div>
          <h1 className="text-[24px] font-semibold text-glow" style={{ color: 'var(--text-primary)' }}>{workspace.name || 'Just Why Team'}</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-hint)' }}>Sign in to continue</p>
        </div>

        <div className="card p-6" style={{ boxShadow: '0 0 40px rgba(0,224,192,0.07), 0 20px 60px rgba(0,0,0,0.5)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || lockoutTimer) && (
              <div className="p-3 rounded-lg text-[13px]"
                style={{ background: 'rgba(224,85,85,0.08)', color: 'var(--status-overdue)', border: '1px solid rgba(224,85,85,0.2)' }}>
                {lockoutTimer ? `Too many failed attempts. Try again in ${lockoutTimer}` : error}
              </div>
            )}

            <Input label="Username or Email" type="text" value={identifier}
              onChange={e => setIdentifier(e.target.value)} placeholder="abdu or abdu@justwhyus.com" required />
            <Input label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg"
            style={{ background: 'rgba(0,224,192,0.04)', border: '1px solid var(--border-default)' }}>
            <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>
              Only admins can create accounts. Ask your admin for an invite link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
