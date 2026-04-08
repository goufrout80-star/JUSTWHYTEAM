import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/activityLogger';

const ROLE_OPTIONS = [
  { name: 'Developer', desc: 'Build & ship code' },
  { name: 'Designer', desc: 'Craft visual experiences' },
  { name: 'Manager', desc: 'Lead and coordinate' },
  { name: 'Marketing', desc: 'Grow the brand' },
  { name: 'Sales', desc: 'Close deals' },
  { name: 'Video Editor', desc: 'Create visual content' },
  { name: 'Email Marketer', desc: 'Drive email campaigns' },
  { name: 'Tester', desc: 'Ensure quality' },
];

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

const LogoMark = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <path d="M16 4L28 28H4L16 4Z" fill="#00E0C0" fillOpacity="0.35"/>
    <path d="M16 10L24 26H8L16 10Z" fill="#00E0C0"/>
  </svg>
);

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
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validate() {
      try {
        const { data, error } = await supabase
          .from('invite_tokens').select('*').eq('token', token)
          .eq('used', false).gt('expires_at', new Date().toISOString()).single();
        if (error || !data) setTokenValid(false);
        else { setTokenValid(true); setTokenData(data); }
      } catch { setTokenValid(false); }
    }
    if (token) validate(); else setTokenValid(false);
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

  function toggleRole(name) {
    setRoles(prev => prev.includes(name) ? prev.filter(r => r !== name) : [...prev, name]);
  }
  function addCustomRole() {
    if (customRole.trim() && !roles.includes(customRole.trim())) {
      setRoles(prev => [...prev, customRole.trim()]);
      setCustomRole(''); setShowCustomInput(false);
    }
  }

  async function handleRegister() {
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setError(''); setLoading(true);
    try {
      const data = await signUp(email, password, username);
      if (data.user) {
        await new Promise(r => setTimeout(r, 1200));
        const colors = ['#534AB7','#E74C3C','#2ECC71','#F39C12','#3498DB','#9B59B6','#1ABC9C','#E67E22'];
        await supabase.from('profiles').update({
          roles, avatar_color: colors[Math.floor(Math.random() * colors.length)],
          must_change_password: false,
        }).eq('id', data.user.id);
        await supabase.from('invite_tokens').update({ used: true, used_by: data.user.id }).eq('id', tokenData.id);
        await logActivity(data.user.id, null, 'user_registered', { username });
        setDone(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const isValidUsername = (val) => /^[a-zA-Z0-9._]+$/.test(val) && val.length >= 3;
  const usernameError = username && !isValidUsername(username) ? '3+ chars, letters/numbers/dots/underscores' : null;
  const strength = getPasswordStrength(password);
  const strengthColors = ['', '#E05555', '#E09A20', '#00E0C0'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const s = {
    input: { width:'100%', padding:'11px 14px', borderRadius:10, fontSize:14, outline:'none', background:'rgba(0,224,192,0.04)', border:'1px solid rgba(0,224,192,0.14)', color:'#E8F4F3', fontFamily:'inherit', boxSizing:'border-box' },
    label: { display:'block', fontSize:11, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase', color:'#4A7A78', marginBottom:6 },
    back: { padding:'10px 16px', borderRadius:10, fontSize:13, border:'1px solid rgba(0,224,192,0.15)', background:'transparent', color:'#7A9E9B', cursor:'pointer', fontFamily:'inherit' },
    next: { flex:1, padding:'11px', borderRadius:10, fontSize:14, fontWeight:600, background:'linear-gradient(135deg,#4A7A78,#00E0C0)', color:'#071412', border:'none', cursor:'pointer', fontFamily:'inherit' },
  };

  if (tokenValid === null) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A1A19' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(0,224,192,0.15)', borderTopColor:'#00E0C0', animation:'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A1A19', padding:'0 16px' }}>
        <div style={{ textAlign:'center', maxWidth:360 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(224,85,85,0.1)', border:'1px solid rgba(224,85,85,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01" stroke="#E05555" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="#E05555" strokeWidth="1.5"/></svg>
          </div>
          <h1 style={{ fontSize:18, fontWeight:600, color:'#E8F4F3', margin:'0 0 8px' }}>Link no longer valid</h1>
          <p style={{ fontSize:13, color:'#4A7A78', lineHeight:1.6 }}>This registration link is invalid, expired, or already used. Ask your admin for a new one.</p>
        </div>
      </div>
    );
  }

  const StepDots = () => (
    <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:24 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ width:i===step?22:7, height:7, borderRadius:4, background:i===step?'#00E0C0':i<step?'rgba(0,224,192,0.35)':'rgba(0,224,192,0.1)', transition:'all 0.3s ease' }}/>
      ))}
    </div>
  );

  const renderStep = () => {
    if (done) return (
      <div style={{ textAlign:'center', padding:'8px 0' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(0,224,192,0.12)', border:'1px solid rgba(0,224,192,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 14l6 6 10-10" stroke="#00E0C0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 style={{ fontSize:20, fontWeight:700, color:'#E8F4F3', margin:'0 0 8px' }}>Welcome aboard!</h3>
        <p style={{ fontSize:13, color:'#7A9E9B' }}>Redirecting to your dashboard…</p>
      </div>
    );

    if (step === 0) return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={s.label}>Username</label>
          <div style={{ position:'relative' }}>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. john_doe" style={s.input} autoFocus />
            {usernameAvailable===true && !usernameError && <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" fill="rgba(0,224,192,0.15)"/><path d="M5 8.5l2.5 2.5 4.5-4.5" stroke="#00E0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
            {usernameAvailable===false && !usernameError && <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}><svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" fill="rgba(224,85,85,0.15)"/><path d="M5.5 5.5l6 6M11.5 5.5l-6 6" stroke="#E05555" strokeWidth="1.5" strokeLinecap="round"/></svg></span>}
          </div>
          {usernameError && <p style={{ fontSize:11, color:'#E05555', marginTop:4 }}>{usernameError}</p>}
          {usernameAvailable===false && !usernameError && <p style={{ fontSize:11, color:'#E05555', marginTop:4 }}>Username already taken</p>}
          {usernameAvailable===true && !usernameError && <p style={{ fontSize:11, color:'#00E0C0', marginTop:4 }}>Username available!</p>}
          <p style={{ fontSize:11, color:'#4A7A78', marginTop:5 }}>This is how your teammates will see you</p>
        </div>
        <button onClick={() => setStep(1)} disabled={!username || usernameAvailable===false || !!usernameError} style={{ ...s.next, opacity:(!username||usernameAvailable===false||!!usernameError)?0.45:1 }}>Continue →</button>
      </div>
    );

    if (step === 1) return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={s.label}>Your email</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="1.5" stroke="#4A7A78" strokeWidth="1.1"/><path d="M1 6l6.5 3.5L14 6" stroke="#4A7A78" strokeWidth="1.1"/></svg></span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ ...s.input, paddingLeft:34 }} autoFocus />
          </div>
          <div style={{ background:'rgba(224,160,50,0.07)', border:'1px solid rgba(224,160,50,0.2)', borderRadius:8, padding:'9px 12px', marginTop:10, display:'flex', gap:7, alignItems:'flex-start' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink:0, marginTop:1 }}><path d="M6.5 1L1 11.5h11L6.5 1z" stroke="#E09A20" strokeWidth="1.1" strokeLinejoin="round"/><path d="M6.5 5v3M6.5 9.5h.01" stroke="#E09A20" strokeWidth="1.1" strokeLinecap="round"/></svg>
            <span style={{ fontSize:11, color:'#E09A20', lineHeight:1.55 }}>Use a real email — we'll use it for security and notifications</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep(0)} style={s.back}>Back</button>
          <button onClick={() => setStep(2)} disabled={!email} style={{ ...s.next, opacity:!email?0.45:1 }}>Continue →</button>
        </div>
      </div>
    );

    if (step === 2) return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={s.label}>Password</label>
          <div style={{ position:'relative' }}>
            <input type={showPassword?'text':'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...s.input, paddingRight:40 }} autoFocus />
            <button type="button" onClick={() => setShowPassword(v=>!v)} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4A7A78', display:'flex' }}>
              {showPassword
                ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A7A78" strokeWidth="1.1"/><circle cx="8" cy="8" r="2" stroke="#4A7A78" strokeWidth="1.1"/><line x1="2" y1="2" x2="14" y2="14" stroke="#4A7A78" strokeWidth="1.1"/></svg>
                : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="#4A7A78" strokeWidth="1.1"/><circle cx="8" cy="8" r="2" stroke="#4A7A78" strokeWidth="1.1"/></svg>
              }
            </button>
          </div>
          {password && (
            <div style={{ marginTop:7 }}>
              <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                {[1,2,3].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=strength?strengthColors[strength]:'rgba(0,224,192,0.08)', transition:'background 0.3s' }}/>)}
              </div>
              {strength>0 && <span style={{ fontSize:11, color:strengthColors[strength] }}>{strengthLabels[strength]} password</span>}
            </div>
          )}
        </div>
        <div>
          <label style={s.label}>Confirm password</label>
          <div style={{ position:'relative' }}>
            <input type={showPassword?'text':'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your password" style={{ ...s.input, paddingRight:40 }} />
            {passwordsMatch && <span style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)' }}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M3 7.5l3.5 3.5 5.5-5.5" stroke="#00E0C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>}
          </div>
          {confirmPassword && !passwordsMatch && <p style={{ fontSize:11, color:'#E05555', marginTop:4 }}>Passwords don't match</p>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep(1)} style={s.back}>Back</button>
          <button onClick={() => setStep(3)} disabled={!password||!confirmPassword||!passwordsMatch} style={{ ...s.next, opacity:(!password||!confirmPassword||!passwordsMatch)?0.45:1 }}>Continue →</button>
        </div>
      </div>
    );

    if (step === 3) return (
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <p style={{ fontSize:13, color:'#7A9E9B', margin:0 }}>Select one or more roles</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {ROLE_OPTIONS.map(r => {
            const sel = roles.includes(r.name);
            return (
              <button key={r.name} type="button" onClick={() => toggleRole(r.name)} style={{ padding:'11px 10px', borderRadius:10, textAlign:'left', cursor:'pointer', background:sel?'rgba(0,224,192,0.08)':'rgba(0,224,192,0.02)', border:sel?'1px solid rgba(0,224,192,0.4)':'1px solid rgba(0,224,192,0.1)', boxShadow:sel?'0 0 10px rgba(0,224,192,0.1)':'none', transition:'all 0.2s', fontFamily:'inherit' }}>
                <div style={{ fontSize:13, fontWeight:600, color:sel?'#00E0C0':'#E8F4F3', marginBottom:2 }}>{r.name}</div>
                <div style={{ fontSize:11, color:'#4A7A78' }}>{r.desc}</div>
              </button>
            );
          })}
          <button type="button" onClick={() => setShowCustomInput(v=>!v)} style={{ padding:'11px 10px', borderRadius:10, textAlign:'left', cursor:'pointer', background:'rgba(0,224,192,0.01)', border:'1px dashed rgba(0,224,192,0.2)', transition:'all 0.2s', fontFamily:'inherit' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#7A9E9B' }}>+ Custom</div>
            <div style={{ fontSize:11, color:'#4A7A78' }}>Add your own</div>
          </button>
        </div>
        {showCustomInput && (
          <div style={{ display:'flex', gap:8 }}>
            <input value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="e.g. Copywriter" style={{ ...s.input, flex:1 }} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addCustomRole();} }} />
            <button onClick={addCustomRole} style={{ ...s.next, flex:'none', padding:'0 16px', whiteSpace:'nowrap', fontSize:13 }}>Add</button>
          </div>
        )}
        {roles.length>0 && <p style={{ fontSize:11, color:'#4A7A78' }}>Selected: {roles.join(', ')}</p>}
        {error && <p style={{ fontSize:13, color:'#E05555' }}>{error}</p>}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setStep(2)} style={s.back}>Back</button>
          <button onClick={handleRegister} disabled={loading||roles.length===0} style={{ ...s.next, opacity:(loading||roles.length===0)?0.5:1 }}>
            {loading ? <span style={{ display:'flex', alignItems:'center', gap:7, justifyContent:'center' }}><svg style={{ animation:'spin 0.8s linear infinite' }} width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="rgba(0,0,0,0.2)" strokeWidth="2"/><path d="M7.5 1.5a6 6 0 0 1 6 6" stroke="#071412" strokeWidth="2" strokeLinecap="round"/></svg>Creating…</span> : 'Join Just Why Team →'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Left: branded panel */}
      <div style={{ flex:'0 0 44%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(155deg,#0D2420 0%,#0A1A19 100%)', borderRight:'1px solid rgba(0,224,192,0.07)', position:'relative', overflow:'hidden', padding:'48px 40px' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle,rgba(0,224,192,0.055) 1px,transparent 1px)', backgroundSize:'26px 26px' }}/>
        <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', maxWidth:300 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20 }}>
            <LogoMark />
            <span style={{ fontSize:20, fontWeight:700, color:'#00E0C0', letterSpacing:'-0.4px' }}>Just Why Team</span>
          </div>
          <p style={{ fontSize:26, fontWeight:700, color:'#E8F4F3', lineHeight:1.3, margin:'0 0 12px' }}>Your team.<br/>Your workflow.</p>
          <p style={{ fontSize:13, color:'#4A7A78', margin:'0 0 44px', lineHeight:1.7 }}>A unified workspace for developers, designers, and everyone in between.</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7, justifyContent:'center' }}>
            {['🔒 Private Projects','💬 Real-time Chat','✓ Task Tracking'].map(f => (
              <div key={f} style={{ padding:'5px 13px', borderRadius:20, border:'1px solid rgba(0,224,192,0.18)', background:'rgba(0,224,192,0.04)', fontSize:11, color:'#7A9E9B' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0F2422', padding:'48px 32px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:390 }}>
          <p style={{ fontSize:11, color:'#4A7A78', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 4px' }}>Step {step+1} of 4</p>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#E8F4F3', margin:'0 0 20px' }}>
            {['Choose a username','Your email address','Create a password','Your roles'][step]}
          </h2>
          <StepDots />
          <div style={{ background:'rgba(0,0,0,0.12)', border:'1px solid rgba(0,224,192,0.09)', borderRadius:14, padding:'28px 24px' }}>
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
