import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function VerifyTwoFA() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    if (code.length !== 6) return setError('Enter a 6-digit code');
    setError('');
    setLoading(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (!totp) throw new Error('No TOTP factor found');
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: totp.id, challengeId: challenge.id, code,
      });
      if (vErr) throw vErr;
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-8">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4">
            <rect width="24" height="24" rx="6" fill="var(--color-teal-300)"/>
            <rect x="7" y="10" width="10" height="8" rx="1.5" stroke="var(--text-accent)" strokeWidth="1.5"/>
            <path d="M9 10V7a3 3 0 016 0v3" stroke="var(--text-accent)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h1 className="text-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>Two-Factor Verification</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-hint)' }}>Enter the code from your authenticator app</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleVerify} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg text-[13px]"
                style={{ background: 'rgba(224,85,85,0.08)', color: 'var(--status-overdue)', border: '1px solid rgba(224,85,85,0.2)' }}>
                {error}
              </div>
            )}
            <Input label="6-digit code" value={code} onChange={e => setCode(e.target.value)}
              placeholder="000000" maxLength={6} className="text-center text-lg tracking-widest" />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
