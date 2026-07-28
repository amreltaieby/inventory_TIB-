'use client';

import { useState } from 'react';

export default function PlatformAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const checkPassword = async () => {
    const res = await fetch('/api/platform/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setUnlocked(true);
      setPassError('');
    } else {
      setPassError('Incorrect password.');
    }
  };

  const createCompany = async () => {
    if (!companyName || !adminEmail || !adminPassword) {
      setCreateError('Company name, admin email, and admin password are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/platform/create-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, companyName, companyLocation, adminEmail, adminPassword }),
    });
    const result = await res.json();
    setCreating(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setSuccess(true);
    setCompanyName(''); setCompanyLocation(''); setAdminEmail(''); setAdminPassword('');
  };

  if (!unlocked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ maxWidth: '300px', width: '100%', padding: '0 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '12px' }}>Platform Admin</div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') checkPassword(); }}
            style={{ display: 'block', width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: '10px' }}
          />
          {passError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{passError}</p>}
          <button onClick={checkPassword} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '380px', width: '100%', padding: '0 20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Create New Company</div>

        {success && <p style={{ color: '#16a34a', fontSize: '13px', marginBottom: '10px' }}>Company created successfully.</p>}

        <input placeholder="Company / Shop name" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input placeholder="Location (optional)" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input placeholder="Admin email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input placeholder="Admin initial password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />

        {createError && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{createError}</p>}

        <button onClick={createCompany} disabled={creating} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          {creating ? 'Creating...' : 'Create Company'}
        </button>
      </div>
    </div>
  );
}