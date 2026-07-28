'use client';

import { useState } from 'react';

export default function ConsultationPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', companyName: '', companyLocation: '' });
  const [status, setStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });

  const submit = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      setStatus('Please fill in first name, last name, and email.');
      return;
    }
    const res = await fetch('/api/consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    if (result.error) {
      setStatus('Error: ' + result.error);
    } else {
      setSubmitted(true);
    }
  };

  const inputStyle = { display: 'block', width: '100%', marginBottom: '10px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' as const, fontSize: '14px' };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Thank you</div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>We'll be in touch soon.</p>
          <a href="/" style={{ color: '#2563eb', fontSize: '14px' }}>Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '380px', width: '100%', padding: '0 20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '18px' }}>Request a Consultation</div>
        <input placeholder="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} style={inputStyle} />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} style={inputStyle} />
        <input placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} style={inputStyle} />
        <input placeholder="Contact number" value={form.phone} onChange={(e) => update('phone', e.target.value)} style={inputStyle} />
        <input placeholder="Company / Shop name" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} style={inputStyle} />
        <input placeholder="Company / Shop location" value={form.companyLocation} onChange={(e) => update('companyLocation', e.target.value)} style={inputStyle} />
        {status && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '10px' }}>{status}</p>}
        <button onClick={submit} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Submit
        </button>
      </div>
    </div>
  );
}