import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sendPasswordResetEmail, verifyOTPCode } from '../lib/emails';
import OTPInput from '../components/ui/OTPInput';
import ParticleBackground from '../components/ui/ParticleBackground';

const APP_NAME = 'Just Why Team';

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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=email, 1=code, 2=newpass
  const [email, setEmail] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [done, setDone] = useState(false);

  const s = {
    input: { width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14, outline:'none', background:'rgba(0,224,192,0.04)', border:'1px solid rgba(0,224,192,0.14)', color:'#E8F4F3', fontFamily:'inherit', boxSizing:'border-box' },
    btn: { width:'100%', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, background:'linear-gradient(135deg,#4A7A78,#00E0C0)', color:'#071412', border:'none', cursor:'pointer', fontFamily:'inherit' },
  };
  const strength = getPasswordStrength(newPass);
  const strengthColors = ['','#E05555','#E09A20','#00E0C0'];
  const strengthLabels = ['','Weak','Good','Strong'];
  const passMatch = newPass && confirmPass && newPass === confirmPass;

  async function handleSendCode(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail({ toEmail: email, username: email.split('@')[0] });
      setStep(1);
    } catch (err) {
      setError(err.message || 'Failed to send code. Try again.');
    } finally { setLoading(false); }
  }

  async function handleVerifyCode(code) {
    setOtpError(false);
    const result = await verifyOTPCode({ email, code, type: 'reset' });
    if (!result.valid) {
      setOtpError(result.error || 'Invalid or expired code.');
      return;
    }
    setOtpSuccess(true);
    setVerifiedUserId(result.userId);
    setTimeout(() => setStep(2), 700);
  }

  async function handleResend() {
    setOtpError(false); setOtpSuccess(false);
    try { await sendPasswordResetEmail({ toEmail: email, username: email.split('@')[0] }); }
    catch { /* silently fail — cooldown timer still resets */ }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!passMatch) return setError("Passwords don't match");
    if (newPass.length < 8) return setError('Password must be at least 8 characters');
    setError(''); setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally { setLoading(false); }
  }

  const LogoMark = () => (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <path d="M16 4L28 28H4L16 4Z" fill="#00E0C0" fillOpacity="0.35"/>
      <path d="M16 10L24 26H8L16 10Z" fill="#00E0C0"/>
    </svg>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <ParticleBackground />
      <div className="relative w-full max-w-sm fade-in" style={{ zIndex: 1 }}>

        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-block mb-3" style={{ padding:10, borderRadius:14, background:'rgba(0,224,192,0.08)', border:'1px solid rgba(0,224,192,0.18)', boxShadow:'0 0 20px rgba(0,224,192,0.12)' }}>
            <LogoMark />
          </div>
          <h1 className="text-[22px] font-semibold" style={{ color:'var(--text-primary)' }}>{APP_NAME}</h1>
          <p className="text-[13px] mt-1" style={{ color:'var(--text-hint)' }}>
            {step===0 && 'Reset your password'}
            {step===1 && 'Check your email'}
            {step===2 && 'Create a new password'}
          </p>
        </div>

        <div className="card p-6" style={{ boxShadow:'0 0 40px rgba(0,224,192,0.07),0 20px 60px rgba(0,0,0,0.5)' }}>

          {/* Step 0: Email */}
          {step === 0 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <p className="text-[13px]" style={{ color:'var(--text-secondary)' }}>
                Enter your email and we'll send you a 6-digit code to reset your password.
              </p>
              {error && <div className="p-3 rounded-lg text-[13px]" style={{ background:'rgba(224,85,85,0.08)', color:'#E05555', border:'1px solid rgba(224,85,85,0.2)' }}>{error}</div>}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', color:'#4A7A78', marginBottom:6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={s.input} />
              </div>
              <button type="submit" disabled={loading || !email} style={{ ...s.btn, opacity:(!email||loading)?0.5:1 }}>
                {loading ? 'Sending…' : 'Send Code'}
              </button>
              <div className="text-center">
                <Link to="/login" className="text-[12px]" style={{ color:'var(--text-hint)' }}>← Back to Sign In</Link>
              </div>
            </form>
          )}

          {/* Step 1: OTP code */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <div style={{ width:52, height:52, borderRadius:'50%', background:'rgba(0,224,192,0.1)', border:'1px solid rgba(0,224,192,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="14" rx="2" stroke="#00E0C0" strokeWidth="1.5"/><path d="M2 8l9 5 9-5" stroke="#00E0C0" strokeWidth="1.5"/></svg>
                </div>
                <p className="text-[13px]" style={{ color:'var(--text-secondary)' }}>
                  We sent a 6-digit code to <strong style={{ color:'var(--text-primary)' }}>{email}</strong>
                </p>
                <p className="text-[12px] mt-1" style={{ color:'var(--text-hint)' }}>Enter it below — it expires in 10 minutes</p>
              </div>
              <OTPInput
                onComplete={handleVerifyCode}
                onResend={handleResend}
                error={otpError}
                success={otpSuccess}
              />
              {otpSuccess && <p className="text-center text-[12px]" style={{ color:'#00E0C0' }}>Code verified! Redirecting…</p>}
              <div className="text-center">
                <button onClick={() => setStep(0)} className="text-[12px]" style={{ color:'var(--text-hint)', background:'none', border:'none', cursor:'pointer' }}>← Wrong email?</button>
              </div>
            </div>
          )}

          {/* Step 2: New password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {done ? (
                <div className="text-center space-y-3">
                  <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(0,224,192,0.12)', border:'1px solid rgba(0,224,192,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-9" stroke="#00E0C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-[15px] font-medium" style={{ color:'var(--text-primary)' }}>Password updated!</p>
                  <p className="text-[13px]" style={{ color:'var(--text-hint)' }}>Redirecting to login…</p>
                </div>
              ) : (
                <>
                  {error && <div className="p-3 rounded-lg text-[13px]" style={{ background:'rgba(224,85,85,0.08)', color:'#E05555', border:'1px solid rgba(224,85,85,0.2)' }}>{error}</div>}
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', color:'#4A7A78', marginBottom:6 }}>New password</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPass?'text':'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="At least 8 characters" style={{ ...s.input, paddingRight:40 }} autoFocus />
                      <button type="button" onClick={() => setShowPass(v=>!v)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4A7A78', display:'flex' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A7A78" strokeWidth="1.1"/><circle cx="8" cy="8" r="2" stroke="#4A7A78" strokeWidth="1.1"/>{showPass && <line x1="2" y1="2" x2="14" y2="14" stroke="#4A7A78" strokeWidth="1.1"/>}</svg>
                      </button>
                    </div>
                    {newPass && (
                      <div style={{ marginTop:6 }}>
                        <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                          {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength?strengthColors[strength]:'rgba(0,224,192,0.08)', transition:'background 0.3s' }}/>)}
                        </div>
                        {strength>0 && <span style={{ fontSize:11, color:strengthColors[strength] }}>{strengthLabels[strength]} password</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', color:'#4A7A78', marginBottom:6 }}>Confirm password</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPass?'text':'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repeat password" style={{ ...s.input, paddingRight:40 }} />
                      {passMatch && <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5l3.5 3.5 5.5-5.5" stroke="#00E0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
                    </div>
                    {confirmPass && !passMatch && <p style={{ fontSize:11, color:'#E05555', marginTop:4 }}>Passwords don't match</p>}
                  </div>
                  <button type="submit" disabled={loading || !passMatch} style={{ ...s.btn, opacity:(!passMatch||loading)?0.5:1 }}>
                    {loading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
