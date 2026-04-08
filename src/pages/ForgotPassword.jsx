import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { APP_NAME, SENDER_EMAIL, APP_URL } from '../lib/email';
import { sendPasswordResetEmail } from '../lib/email';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ParticleBackground from '../components/ui/ParticleBackground';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);

  // Check rate limiting
  const checkRateLimit = () => {
    const data = localStorage.getItem('passwordResetLimit');
    if (!data) return true;
    const { count, resetTime } = JSON.parse(data);
    if (new Date() > new Date(resetTime)) {
      localStorage.removeItem('passwordResetLimit');
      return true;
    }
    if (count >= 3) {
      const remaining = Math.ceil((new Date(resetTime) - new Date()) / 60000);
      setRateLimit(remaining);
      return false;
    }
    return true;
  };

  const updateRateLimit = () => {
    const data = localStorage.getItem('passwordResetLimit');
    let count = 1;
    let resetTime = new Date(Date.now() + 60 * 60000).toISOString(); // 1 hour
    if (data) {
      const parsed = JSON.parse(data);
      count = parsed.count + 1;
    }
    localStorage.setItem('passwordResetLimit', JSON.stringify({ count, resetTime }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setRateLimit(null);

    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);
    try {
      // Use Supabase to generate reset token (but we'll send our own email via Resend)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/reset-password`,
      });

      if (error) throw error;

      // Also send our custom styled email via Resend (if configured)
      // This sends a better looking email alongside Supabase's default
      const resetLink = `${APP_URL}/reset-password`;
      await sendPasswordResetEmail({ toEmail: email, resetLink });

      updateRateLimit();
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
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
            <div style={{ 
              padding: 10, 
              borderRadius: 16, 
              background: 'rgba(0,224,192,0.08)', 
              border: '1px solid rgba(0,224,192,0.18)', 
              boxShadow: '0 0 24px rgba(0,224,192,0.15), 0 0 8px rgba(0,224,192,0.08)' 
            }}>
              <Mail size={40} color="var(--text-accent)" />
            </div>
          </div>
          <h1 className="text-[24px] font-semibold text-glow" style={{ color: 'var(--text-primary)' }}>
            {APP_NAME}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-hint)' }}>
            Reset your password
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

              {rateLimit && (
                <div className="p-3 rounded-lg text-[13px]"
                  style={{ 
                    background: 'rgba(224,112,80,0.08)', 
                    color: '#E07050', 
                    border: '1px solid rgba(224,112,80,0.2)' 
                  }}>
                  Too many attempts. Please try again in {rateLimit} minutes.
                </div>
              )}

              <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                Enter your email address and we'll send you a link to reset your password.
              </div>

              <Input 
                label="Email Address" 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                placeholder="you@example.com" 
                required 
              />

              <Button type="submit" className="w-full" disabled={loading || rateLimit}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link 
                to="/login" 
                className="flex items-center justify-center gap-1 text-[13px] transition-colors"
                style={{ color: 'var(--text-hint)' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-hint)'}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
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
                Check your email
              </h2>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                We've sent a password reset link to <strong>{email}</strong>. 
                The link will expire in 1 hour.
              </p>
              <div className="p-3 rounded-lg text-[11px]" 
                style={{ 
                  background: 'rgba(0,224,192,0.04)', 
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-hint)'
                }}>
                Didn't receive it? Check your spam folder or 
                <button 
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="ml-1 underline hover:no-underline"
                  style={{ color: 'var(--text-accent)' }}
                >
                  try again
                </button>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Return to Sign In
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-[11px]" style={{ color: 'var(--text-hint)' }}>
            Need help? Contact <a href={`mailto:support@justwhyus.com`} style={{ color: 'var(--text-accent)' }}>support@justwhyus.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
