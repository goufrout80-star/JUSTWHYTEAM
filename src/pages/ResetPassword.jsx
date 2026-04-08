import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_NAME } from '../lib/constants';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setValidSession(true);
      } else {
        // Try to exchange the recovery token from URL
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          setValidSession(true);
        } else {
          setValidSession(false);
        }
      }
    };
    checkSession();
  }, []);

  const validatePassword = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(pass)) return 'Password must contain at least one special character (!@#$%^&*)';
    return null;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      // Sign out after 3 seconds and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login?reset=success');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (validSession === null) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <ParticleBackground />
        <div className="text-center">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto" 
            style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--text-accent)' }} />
          <p className="mt-4 text-[13px]" style={{ color: 'var(--text-hint)' }}>Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (validSession === false) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <ParticleBackground />
        <div className="relative w-full max-w-sm fade-in" style={{ zIndex: 1 }}>
          <div className="card p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)' }}>
              <AlertCircle size={32} color="var(--status-overdue)" />
            </div>
            <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Invalid or Expired Link
            </h2>
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">Request New Link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <ParticleBackground />
      <div className="relative w-full max-w-sm fade-in" style={{ zIndex: 1 }}>
        <div className="text-center mb-8">
          <div className="float-anim inline-block mb-4">
            <div style={{ 
              padding: 10, 
              borderRadius: 16, 
              background: 'rgba(0,224,192,0.08)', 
              border: '1px solid rgba(0,224,192,0.18)', 
              boxShadow: '0 0 24px rgba(0,224,192,0.15), 0 0 8px rgba(0,224,192,0.08)' 
            }}>
              <Lock size={40} color="var(--text-accent)" />
            </div>
          </div>
          <h1 className="text-[24px] font-semibold text-glow" style={{ color: 'var(--text-primary)' }}>
            {APP_NAME}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-hint)' }}>
            Create a new password
          </p>
        </div>

        <div className="card p-6" style={{ boxShadow: '0 0 40px rgba(0,224,192,0.07), 0 20px 60px rgba(0,0,0,0.5)' }}>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg text-[13px] flex items-center gap-2"
                  style={{ 
                    background: 'rgba(224,85,85,0.08)', 
                    color: 'var(--status-overdue)', 
                    border: '1px solid rgba(224,85,85,0.2)' 
                  }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Your new password must be at least 8 characters and include uppercase, lowercase, number, and special character.
              </div>

              <div className="relative">
                <Input 
                  label="New Password" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] transition-colors"
                  style={{ color: 'var(--text-hint)' }}
                  onMouseEnter={e => e.target.style.color = 'var(--text-accent)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-hint)'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Input 
                label="Confirm New Password" 
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />

              <div className="space-y-1">
                <PasswordRequirement text="At least 8 characters" met={password.length >= 8} />
                <PasswordRequirement text="One uppercase letter" met={/[A-Z]/.test(password)} />
                <PasswordRequirement text="One lowercase letter" met={/[a-z]/.test(password)} />
                <PasswordRequirement text="One number" met={/[0-9]/.test(password)} />
                <PasswordRequirement text="One special character (!@#$%^&*)" met={/[!@#$%^&*]/.test(password)} />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ 
                  background: 'rgba(0,224,192,0.1)', 
                  border: '1px solid rgba(0,224,192,0.2)' 
                }}>
                <CheckCircle size={32} color="var(--status-done)" />
              </div>
              <h2 className="text-[18px] font-medium" style={{ color: 'var(--text-primary)' }}>
                Password Reset Successful
              </h2>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Your password has been updated. You'll be redirected to sign in shortly.
              </p>
              <Link to="/login">
                <Button className="w-full">Sign In Now</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordRequirement({ text, met }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div 
        className="w-4 h-4 rounded-full flex items-center justify-center"
        style={{ 
          background: met ? 'rgba(0,224,192,0.2)' : 'rgba(128,128,128,0.1)',
          border: `1px solid ${met ? 'var(--status-done)' : 'var(--border-default)'}`
        }}
      >
        {met && <CheckCircle size={10} color="var(--status-done)" />}
      </div>
      <span style={{ color: met ? 'var(--status-done)' : 'var(--text-hint)' }}>{text}</span>
    </div>
  );
}
