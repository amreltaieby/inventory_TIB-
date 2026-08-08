'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [systemCode, setSystemCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async function () {
    if (!companyName || !adminEmail || !adminPassword || !systemCode) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await fetch('/api/platform/create-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: systemCode, companyName: companyName, adminEmail: adminEmail, adminPassword: adminPassword }),
    });
    const result = await res.json();
    setLoading(false);
    if (result.error) {
      if (result.error === 'Unauthorized') {
        setError('Incorrect system code.');
      } else {
        setError(result.error);
      }
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Company registered</div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>You can now log in with the admin account you created.</p>
          <a href="/login" style={{ color: '#2563eb', fontSize: '14px' }}>Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <a href="/" style={{ position: 'fixed', top: '20px', left: '20px', fontSize: '26px', color: '#0f172a', textDecoration: 'none' }}>&larr;</a>
      <div style={{ maxWidth: '380px', width: '100%', padding: '0 20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '18px' }}>Register Your Company</div>
        <input placeholder="Company name" value={companyName} onChange={function (e) { setCompanyName(e.target.value); }}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input placeholder="Admin email" value={adminEmail} onChange={function (e) { setAdminEmail(e.target.value); }}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input type="password" placeholder="Admin password" value={adminPassword} onChange={function (e) { setAdminPassword(e.target.value); }}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        <input type="password" placeholder="System code" value={systemCode} onChange={function (e) { setSystemCode(e.target.value); }}
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
        {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
        <button onClick={submit} disabled={loading}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </div>
  );
}