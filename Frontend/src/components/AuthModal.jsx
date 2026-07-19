import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import { SiGoogle } from 'react-icons/si';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from '../firebase';

/* ─── Password Strength Helper ─── */
function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const levels = [
    { score: 0, label: '', color: 'transparent' },
    { score: 1, label: 'Weak', color: '#ef4444' },
    { score: 2, label: 'Fair', color: '#f97316' },
    { score: 3, label: 'Good', color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
  ];
  return levels[score];
}

/* ─── Floating Particle ─── */
function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="auth-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${5 + Math.random() * 6}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            opacity: 0.15 + Math.random() * 0.3,
          }}
        />
      ))}
    </div>
  );
}

/* ─── FloatingLabelInput ─── */
function FloatingInput({ label, type = 'text', value, onChange, icon, autoFocus, rightElement, error }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div style={{ position: 'relative', marginBottom: error ? '0.25rem' : '0' }}>
      {/* Label */}
      <label style={{
        position: 'absolute',
        left: icon ? '2.75rem' : '1rem',
        top: floated ? '0.35rem' : '50%',
        transform: floated ? 'translateY(0) scale(0.78)' : 'translateY(-50%) scale(1)',
        transformOrigin: 'left',
        color: focused ? '#00d2ff' : 'rgba(255,255,255,0.45)',
        fontSize: '0.92rem',
        fontWeight: 500,
        pointerEvents: 'none',
        transition: 'all 0.2s ease',
        zIndex: 2,
        background: floated ? 'transparent' : 'transparent',
      }}>
        {label}
      </label>

      {/* Icon */}
      {icon && (
        <div style={{
          position: 'absolute',
          left: '0.9rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? '#00d2ff' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.2s',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
        }}>
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        required
        style={{
          width: '100%',
          padding: floated ? '1.5rem 2.75rem 0.5rem' : '1rem 2.75rem',
          paddingLeft: icon ? '2.75rem' : '1rem',
          paddingRight: rightElement ? '2.75rem' : '1rem',
          background: focused
            ? 'rgba(0, 210, 255, 0.03)'
            : 'rgba(255,255,255,0.02)',
          border: `1px solid ${error ? '#ef4444' : focused ? '#00d2ff' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          color: '#ffffff',
          fontSize: '0.92rem',
          outline: 'none',
          transition: 'all 0.25s',
          boxSizing: 'border-box',
          boxShadow: focused
            ? `0 0 0 3px ${error ? 'rgba(239,68,68,0.1)' : 'rgba(0,210,255,0.08)'}`
            : 'none',
        }}
      />

      {/* Right element (eye icon, etc.) */}
      {rightElement && (
        <div style={{
          position: 'absolute',
          right: '0.9rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2,
        }}>
          {rightElement}
        </div>
      )}
    </div>
  );
}

/* ─── Main AuthModal ─── */
export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [mode, setMode] = useState('auth'); // 'auth' | 'forgot' | 'success'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const strength = getPasswordStrength(password);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode('auth');
      setEmail(''); setPassword(''); setName(''); setConfirmPassword('');
      setError(''); setFieldErrors({}); setLoading(false);
      setShowPassword(false); setShowConfirmPassword(false);
      setResetSent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /* ─── Validation ─── */
  const validate = () => {
    const errs = {};
    if (isSignUp && !name.trim()) errs.name = 'Name is required';
    if (!email.includes('@')) errs.email = 'Enter a valid email address';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (isSignUp && password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ─── Auth Submit ─── */
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await sendEmailVerification(cred.user);
        setMode('verify-email');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMode('success');
        setTimeout(() => { onClose(); }, 1800);
      }
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Invalid email or password';
      else if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered';
      else if (err.code === 'auth/invalid-email') msg = 'Invalid email address format';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Google ─── */
  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setMode('success');
      setTimeout(() => { onClose(); }, 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Forgot Password ─── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setFieldErrors({ email: 'Enter your email above first' }); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Switch mode ─── */
  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError(''); setFieldErrors({});
    setPassword(''); setConfirmPassword('');
  };

  /* ─── Icons ─── */
  const EmailIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>;
  const LockIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  const UserIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const EyeIcon = (open) => (
    <button type="button" onClick={() => open(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, display: 'flex', alignItems: 'center' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    </button>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(14px)',
      animation: 'modalFadeIn 0.3s ease', padding: '1rem',
    }}>
      {/* Card */}
      <div className="auth-modal-card" style={{
        width: '100%', maxWidth: '820px',
        borderRadius: '24px', position: 'relative', overflow: 'hidden',
        display: 'grid', gridTemplateColumns: '1.05fr 0.95fr',
        border: '1.5px solid transparent',
        background: 'linear-gradient(rgba(7,7,12,0.9),rgba(7,7,12,0.9)) padding-box, linear-gradient(135deg,#00d2ff,#8b5cf6,#ec4899) border-box',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'cardSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <Particles />

        {/* Glow orbs */}
        <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'350px', height:'350px', borderRadius:'50%', background:'#3b82f6', filter:'blur(100px)', opacity:0.08, zIndex:0, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'300px', height:'300px', borderRadius:'50%', background:'#8b5cf6', filter:'blur(80px)', opacity:0.1, zIndex:0, pointerEvents:'none' }} />

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:'1.25rem', right:'1.25rem', background:'none', border:'none', color:'rgba(255,255,255,0.35)', cursor:'pointer', zIndex:10, padding:'4px', transition:'color 0.2s', lineHeight:1 }} className="close-btn-hover">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* ── Left Brand Column ── */}
        <div style={{ padding:'3.5rem 3rem', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', zIndex:1, borderRight:'1px solid rgba(255,255,255,0.05)', overflow:'hidden' }}>
          {/* Animated background orbs */}
          <div className="auth-left-orb" style={{ width:220, height:220, background:'radial-gradient(circle, rgba(0,210,255,0.12), transparent 70%)', top:'-10%', left:'-20%', animationDuration:'7s' }} />
          <div className="auth-left-orb" style={{ width:180, height:180, background:'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)', bottom:'5%', right:'-15%', animationDuration:'9s', animationDelay:'2s' }} />
          {/* Subtle grid */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }} />
          <div style={{ marginBottom:'3.5rem' }}>
            <Logo height={36} showText={true} />
          </div>
          <h2 style={{ fontSize:'clamp(1.6rem,3vw,2.3rem)', fontWeight:800, lineHeight:1.15, color:'#ffffff', marginBottom:'0.85rem', fontFamily:"'Sora','Outfit',sans-serif", letterSpacing:'-0.02em' }}>
            {mode === 'forgot' ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'1rem', lineHeight:1.6 }}>
            {mode === 'forgot'
              ? 'Enter your email and we\'ll send a reset link.'
              : isSignUp
              ? 'Launch your workspace and automate workflows with AI.'
              : 'Sign in to your WorkPilot AI workspace node.'}
          </p>

          {/* Feature bullets */}
          {mode === 'auth' && (
            <div style={{ marginTop:'2.5rem', display:'flex', flexDirection:'column', gap:'0.85rem' }}>
              {['Personalized AI that learns your style', 'Zero-touch workflow automation', 'Enterprise-grade security'].map((feat, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'linear-gradient(135deg,#00d2ff,#8b5cf6)', flexShrink:0 }} />
                  <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.85rem' }}>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right Form Column ── */}
        <div style={{ padding:'3rem 2.75rem', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', zIndex:1 }}>

          {/* ── SUCCESS STATE ── */}
          {mode === 'success' && (
            <div style={{ textAlign:'center', animation:'successPop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg,#22c55e,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem', boxShadow:'0 0 30px rgba(34,197,94,0.4)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize:'1.4rem', fontWeight:800, color:'#ffffff', marginBottom:'0.5rem' }}>Node Active!</h3>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem' }}>Redirecting to your workspace...</p>
            </div>
          )}

          {/* ── VERIFY EMAIL STATE ── */}
          {mode === 'verify-email' && (
            <div style={{ textAlign:'center', animation:'successPop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              {/* Envelope icon */}
              <div style={{
                width:'72px', height:'72px', borderRadius:'50%',
                background:'linear-gradient(135deg,rgba(0,210,255,0.15),rgba(139,92,246,0.15))',
                border:'1.5px solid rgba(0,210,255,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 1.5rem',
                boxShadow:'0 0 30px rgba(0,210,255,0.15)'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#emailGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="emailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00d2ff"/>
                      <stop offset="100%" stopColor="#8b5cf6"/>
                    </linearGradient>
                  </defs>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>

              <h3 style={{ fontSize:'1.35rem', fontWeight:800, color:'#ffffff', marginBottom:'0.6rem' }}>
                Verify your email
              </h3>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.88rem', lineHeight:1.6, marginBottom:'0.5rem' }}>
                We sent a verification link to
              </p>
              <p style={{
                color:'#00d2ff', fontWeight:700, fontSize:'0.92rem',
                marginBottom:'2rem', wordBreak:'break-all'
              }}>
                {email}
              </p>

              {/* Check verification — reloads Firebase user and closes if verified */}
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await auth.currentUser?.reload();
                    if (auth.currentUser?.emailVerified) {
                      setMode('success');
                      setTimeout(() => onClose(), 1800);
                    } else {
                      setError("Email not verified yet. Please check your inbox.");
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ ...primaryBtnStyle(loading), marginBottom:'0.75rem' }}
                className="glow-btn"
              >
                {loading ? <span style={spinStyle} /> : "I've Verified My Email ✓"}
              </button>

              {/* Resend */}
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await sendEmailVerification(auth.currentUser);
                    setError('');
                    alert('Verification email resent! Check your inbox.');
                  } catch(err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={ghostBtnStyle}
              >
                Resend verification email
              </button>

              {error && <div style={{ ...errBannerStyle, marginTop:'1rem' }}>{error}</div>}

              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.78rem', marginTop:'1.25rem' }}>
                Wrong email?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut(auth);
                    setMode('auth');
                    setIsSignUp(true);
                    setError('');
                  }}
                  style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'0.78rem', textDecoration:'underline', padding:0 }}
                >
                  Start over
                </button>
              </p>
            </div>
          )}

          {/* ── FORGOT PASSWORD STATE ── */}
          {mode === 'forgot' && !resetSent && (
            <form onSubmit={handleForgotPassword} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <FloatingInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} icon={EmailIcon} autoFocus error={fieldErrors.email} />
              {fieldErrors.email && <span style={errStyle}>{fieldErrors.email}</span>}
              {error && <div style={errBannerStyle}>{error}</div>}
              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)} className="glow-btn">
                {loading ? <span style={spinStyle} /> : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => { setMode('auth'); setError(''); setFieldErrors({}); }} style={ghostBtnStyle}>
                ← Back to Sign In
              </button>
            </form>
          )}

          {resetSent && mode === 'forgot' && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📩</div>
              <h3 style={{ color:'#ffffff', fontWeight:700, marginBottom:'0.5rem' }}>Check your inbox!</h3>
              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem', marginBottom:'1.5rem' }}>We've sent a reset link to <strong style={{ color:'#00d2ff' }}>{email}</strong></p>
              <button type="button" onClick={() => { setMode('auth'); setResetSent(false); }} style={ghostBtnStyle}>← Back to Sign In</button>
            </div>
          )}

          {/* ── MAIN AUTH FORM ── */}
          {mode === 'auth' && (
            <form onSubmit={handleAuth} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Name — signup only */}
              {isSignUp && (
                <div>
                  <FloatingInput label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} icon={UserIcon} autoFocus error={fieldErrors.name} />
                  {fieldErrors.name && <span style={errStyle}>{fieldErrors.name}</span>}
                </div>
              )}

              {/* Email */}
              <div>
                <FloatingInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} icon={EmailIcon} autoFocus={!isSignUp} error={fieldErrors.email} />
                {fieldErrors.email && <span style={errStyle}>{fieldErrors.email}</span>}
              </div>

              {/* Password */}
              <div>
                <FloatingInput
                  label="Password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  icon={LockIcon} error={fieldErrors.password}
                  rightElement={EyeIcon(setShowPassword)}
                />
                {fieldErrors.password && <span style={errStyle}>{fieldErrors.password}</span>}

                {/* Password strength meter — signup only */}
                {isSignUp && password.length > 0 && (
                  <div style={{ marginTop:'0.5rem' }}>
                    <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)', transition:'background 0.3s' }} />
                      ))}
                    </div>
                    {strength.label && <span style={{ fontSize:'0.72rem', color: strength.color, fontWeight:600 }}>{strength.label}</span>}
                  </div>
                )}
              </div>

              {/* Confirm Password — signup only */}
              {isSignUp && (
                <div>
                  <FloatingInput
                    label="Confirm Password" type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    icon={LockIcon} error={fieldErrors.confirmPassword}
                    rightElement={EyeIcon(setShowConfirmPassword)}
                  />
                  {fieldErrors.confirmPassword && <span style={errStyle}>{fieldErrors.confirmPassword}</span>}
                </div>
              )}

              {/* Remember Me + Forgot Password row */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:'0.82rem', userSelect:'none' }}
                  onClick={() => setRememberMe(v => !v)}>
                  {/* Custom toggle switch */}
                  <div style={{
                    width:'34px', height:'18px', borderRadius:'99px',
                    background: rememberMe ? 'linear-gradient(135deg,#00d2ff,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${rememberMe ? 'transparent' : 'rgba(255,255,255,0.15)'}`,
                    position:'relative', transition:'all 0.25s', flexShrink:0,
                    boxShadow: rememberMe ? '0 0 10px rgba(0,210,255,0.3)' : 'none',
                  }}>
                    <div style={{
                      position:'absolute', top:'2px',
                      left: rememberMe ? '17px' : '2px',
                      width:'12px', height:'12px', borderRadius:'50%',
                      background:'#ffffff', transition:'left 0.25s',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.4)',
                    }} />
                  </div>
                  Remember me
                </label>
                {!isSignUp && (
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setFieldErrors({}); }} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'0.82rem', cursor:'pointer', padding:0, transition:'color 0.2s' }} className="forgot-hover">
                    Forgot Password?
                  </button>
                )}
              </div>

              {/* Global error */}
              {error && <div style={errBannerStyle} className="auth-shake">{error}</div>}

              {/* Submit */}
              <button type="submit" disabled={loading} style={primaryBtnStyle(loading)} className="glow-btn">
                {loading ? <span style={spinStyle} /> : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>

              {/* Divider */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'rgba(255,255,255,0.25)', fontSize:'0.72rem', letterSpacing:'0.08em', textTransform:'uppercase', margin:'0.25rem 0' }}>
                <div style={{ flex:1, borderTop:'1px dashed rgba(255,255,255,0.1)' }} />
                or continue with
                <div style={{ flex:1, borderTop:'1px dashed rgba(255,255,255,0.1)' }} />
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogle} disabled={loading} style={googleBtnStyle} className="glow-btn">
                <SiGoogle size={18} color="#4285F4" />
                Sign {isSignUp ? 'up' : 'in'} with Google
              </button>

              {/* Toggle */}
              <p style={{ textAlign:'center', fontSize:'0.84rem', color:'rgba(255,255,255,0.4)', margin:0 }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button type="button" onClick={switchMode} style={{ background:'none', border:'none', color:'#ffffff', fontWeight:700, cursor:'pointer', fontSize:'0.84rem', padding:0 }} className="toggle-auth">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cardSlideUp { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes successPop { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:scale(1) } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes authParticleFloat {
          0% { transform: translateY(0px) scale(1); opacity: 0.2; }
          50% { transform: translateY(-18px) scale(1.1); opacity: 0.5; }
          100% { transform: translateY(0px) scale(1); opacity: 0.2; }
        }
        @keyframes orbFloat {
          0%,100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .auth-particle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d2ff, #8b5cf6);
          animation: authParticleFloat linear infinite;
        }
        .auth-left-orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          animation: orbFloat ease-in-out infinite;
        }
        .close-btn-hover:hover { color: #ffffff !important; }
        .forgot-hover:hover { color: #ffffff !important; }
        .toggle-auth:hover { text-decoration: underline; }
        .glow-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0,210,255,0.22) !important; transform: translateY(-1px); }
        .glow-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-shake { animation: shake 0.4s ease; }
        @media (max-width: 680px) {
          .auth-modal-card { grid-template-columns: 1fr !important; }
          .auth-modal-card > div:first-child { display: none !important; }
          .auth-modal-card > div:last-child { padding: 2rem 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}

/* ─── Style constants ─── */
const errStyle = { color:'#ef4444', fontSize:'0.75rem', marginTop:'0.3rem', display:'block' };
const errBannerStyle = { color:'#ff6b6b', fontSize:'0.8rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', padding:'0.6rem 0.9rem', borderRadius:'8px' };
const primaryBtnStyle = (loading) => ({
  width:'100%', padding:'0.95rem', borderRadius:'999px', border:'1px solid transparent',
  color:'#ffffff', fontWeight:700, fontSize:'0.92rem', cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.7 : 1,
  background:'linear-gradient(rgba(8,8,12,0.8),rgba(8,8,12,0.8)) padding-box, linear-gradient(135deg,#00d2ff,#8b5cf6,#ec4899) border-box',
  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
  transition:'all 0.25s',
});
const googleBtnStyle = {
  width:'100%', padding:'0.9rem', borderRadius:'999px', border:'1px solid transparent',
  color:'#ffffff', fontWeight:600, fontSize:'0.9rem', cursor:'pointer',
  background:'linear-gradient(rgba(8,8,12,0.8),rgba(8,8,12,0.8)) padding-box, linear-gradient(135deg,#00d2ff,#8b5cf6,#ec4899) border-box',
  display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem',
  transition:'all 0.25s',
};
const ghostBtnStyle = {
  background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)',
  padding:'0.75rem', borderRadius:'10px', cursor:'pointer', fontSize:'0.88rem', width:'100%',
  transition:'all 0.2s',
};
const spinStyle = {
  display:'inline-block', width:'18px', height:'18px',
  border:'2px solid rgba(255,255,255,0.25)', borderRadius:'50%',
  borderTopColor:'#ffffff', animation:'spin 0.7s linear infinite',
};
