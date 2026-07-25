'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

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
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '360px', width: '100%', padding: '0 20px' }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#0f172a',
            textShadow: '2px 2px 6px rgba(0,0,0,0.2)',
            lineHeight: 1,
            marginBottom: '10px',
          }}>
            NOVIQ
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Noviq Inventory</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>Sign in to your account</div>
        </div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '10px', top: '9px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', color: '#64748b',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '4px' }}
          >
            Log in
          </button>
        </form>
        {message && <p style={{ color: '#dc2626', marginTop: '10px', fontSize: '13px' }}>{message}</p>}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#94a3b8' }}>
          Need help?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); handleSupportClick(); }} style={{ color: '#0f172a', fontWeight: 500 }}>
            Get support
          </a>
        </p>
      </div>
    </div>
  );
}