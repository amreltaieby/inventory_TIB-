'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Login failed: ' + error.message);
      setFailed(true);
    } else {
      window.location.href = '/home';
    }
  };

  const handleSupportClick = () => {
    window.location.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=noviqsupportteam@gmail.com';
  };

  const handleResetSubmit = async () => {
    if (!resetEmail) {
      setResetStatus('Enter your email.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin + '/reset-password' });
    if (error) {
      setResetStatus('Error: ' + error.message);
    } else {
      setResetStatus('Check your email for a reset link.');
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setResetStatus('');
    setResetEmail('');
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    marginBottom: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    border: failed ? '1px solid #dc2626' : '1px solid #cbd5e1',
    background: failed ? '#fef2f2' : '#ffffff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <a href="/" style={{ position: 'fixed', top: '20px', left: '20px', fontSize: '26px', color: '#0f172a', textDecoration: 'none', zIndex: 200, lineHeight: 1 }}>←</a>
      <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: '#93c5fd', opacity: 0.35, filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: '-100px', right: '-60px', width: '380px', height: '380px', borderRadius: '50%', background: '#60a5fa', opacity: 0.3, filter: 'blur(70px)' }} />
      <div style={{ position: 'absolute', top: '30%', right: '10%', width: '200px', height: '200px', borderRadius: '50%', background: '#bfdbfe', opacity: 0.4, filter: 'blur(50px)' }} />

      <div style={{ maxWidth: '360px', width: '100%', padding: '0 20px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', fontWeight: 700, color: '#0f172a', textShadow: '2px 2px 6px rgba(0,0,0,0.2)', lineHeight: 1, marginBottom: '10px' }}>NOVIQ</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Noviq Inventory</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Sign in to your account</div>
        </div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: '40px' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <div style={{ textAlign: 'right', marginBottom: '10px' }}>
            <button type="button" onClick={() => setForgotOpen(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer', padding: 0 }}>Forgot password?</button>
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}>Log in</button>
        </form>
        {message && <p style={{ color: '#dc2626', marginTop: '10px', fontSize: '13px' }}>{message}</p>}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>Need help? <a href="#" onClick={(e) => { e.preventDefault(); handleSupportClick(); }} style={{ color: '#0f172a', fontWeight: 500 }}>Get support</a></p>
      </div>

      {forgotOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '10px', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>Reset your password</div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>Enter your email and we will send you a reset link.</p>
            <input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '10px' }} />
            {resetStatus && <p style={{ fontSize: '13px', color: resetStatus.indexOf('Error') === 0 ? '#dc2626' : '#16a34a', marginBottom: '10px' }}>{resetStatus}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeForgot} style={{ padding: '8px 14px', fontSize: '13px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>Close</button>
              <button onClick={handleResetSubmit} style={{ padding: '8px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send Reset Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}