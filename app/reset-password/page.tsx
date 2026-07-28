'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) { setStatus('Password must be at least 4 characters.'); return; }
    if (newPassword !== confirmPassword) { setStatus('Passwords do not match.'); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setStatus('Error: ' + error.message); return; }
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', color: '#16a34a' }}>✓</div>
          <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px' }}>Password updated</div>
          <a href="/" style={{ color: '#2563eb', fontSize: '14px' }}>Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '340px', width: '100%', padding: '0 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '16px' }}>Set a new password</div>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
          {status && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{status}</p>}
          <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}