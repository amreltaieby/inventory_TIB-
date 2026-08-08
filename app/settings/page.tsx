'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getLowStockMultiplier, setLowStockMultiplier } from '../../lib/settings';
import { getAdminPassword, setAdminPassword } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';

export default function SettingsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState('1.25');
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [changingLoginPassword, setChangingLoginPassword] = useState(false);
  const [loginCurrentPass, setLoginCurrentPass] = useState('');
  const [loginNewPass, setLoginNewPass] = useState('');
  const [loginConfirmPass, setLoginConfirmPass] = useState('');
  const [loginPassError, setLoginPassError] = useState('');
  const [loginPassSuccess, setLoginPassSuccess] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStatus, setResetStatus] = useState('');

  const { theme, toggleTheme } = useTheme();
  const c = getColors(theme);
  const { lang, setLang } = useLanguage();

  useEffect(function () {
    loadRole();
    setMultiplier(String(getLowStockMultiplier()));
  }, []);

  const loadRole = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) { window.location.href = '/login'; return; }
    const result = await supabase.from('profiles').select('role').eq('id', user.id).single();
    setRole(result.data ? result.data.role : 'employee');
  };

  const saveMultiplier = function () {
    const num = Number(multiplier);
    if (!num || num <= 1) {
      setErrorMsg('Enter a number greater than 1 (e.g. 1.25 means alert at 125% of the critical threshold)');
      return;
    }
    setErrorMsg('');
    setLowStockMultiplier(num);
    setSuccessOpen(true);
  };

  const submitPasswordChange = function () {
    setPassError('');
    if (!newPass || newPass.length < 6) { setPassError('New password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setPassError('New passwords do not match.'); return; }
    setAdminPassword(newPass);
    setChangingPassword(false);
    setNewPass(''); setConfirmPass('');
    alert('Admin password updated.');
  };

  const submitLoginPasswordChange = async function () {
    setLoginPassError('');
    if (!loginCurrentPass) { setLoginPassError('Enter your current password.'); return; }
    if (!loginNewPass || loginNewPass.length < 6) { setLoginPassError('New password must be at least 6 characters.'); return; }
    if (loginNewPass !== loginConfirmPass) { setLoginPassError('Passwords do not match.'); return; }

    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user || !user.email) { setLoginPassError('Could not verify current session.'); return; }

    const verifyResult = await supabase.auth.signInWithPassword({ email: user.email, password: loginCurrentPass });
    if (verifyResult.error) { setLoginPassError('Current password is incorrect.'); return; }

    const updateResult = await supabase.auth.updateUser({ password: loginNewPass });
    if (updateResult.error) { setLoginPassError(updateResult.error.message); return; }
    setLoginPassSuccess(true);
    setLoginCurrentPass(''); setLoginNewPass(''); setLoginConfirmPass('');
  };

  const closeLoginPasswordChange = function () {
    setChangingLoginPassword(false);
    setLoginCurrentPass(''); setLoginNewPass(''); setLoginConfirmPass('');
    setLoginPassError(''); setLoginPassSuccess(false);
  };

  const handleResetSubmit = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user || !user.email) { setResetStatus('No email on file.'); return; }
    const result = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/reset-password' });
    if (result.error) { setResetStatus('Error: ' + result.error.message); } else { setResetStatus('Check your email for a reset link.'); }
  };

  const closeForgot = function () {
    setForgotOpen(false);
    setResetStatus('');
  };

  const handleLogout = async function () {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (role === null) return null;
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: c.text, marginBottom: '28px' }}>Settings</h1>

          {role === 'admin' && (
            <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ marginTop: 0, color: c.text }}>Low Stock Threshold</h3>
              <p style={{ color: c.subtext, fontSize: '14px' }}>Controls how far above each item's critical threshold Low Stock starts. 1.25 means 125%.</p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="number" step="0.05" value={multiplier} onChange={function (e) { setMultiplier(e.target.value); }}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, width: '100px' }} />
                <button onClick={saveMultiplier} style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}>Save</button>
              </div>
              {errorMsg && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{errorMsg}</p>}
            </div>
          )}

          {role === 'admin' && (
            <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ marginTop: 0, color: c.text }}>Admin Action Password</h3>
              <p style={{ color: c.subtext, fontSize: '14px' }}>Required for editing, deleting, or setting alert thresholds on items.</p>
              {!changingPassword && (
                <div>
                  <p style={{ fontSize: '18px', letterSpacing: '4px', color: c.text }}>********</p>
                  <button onClick={function () { setChangingPassword(true); }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer' }}>Change Password</button>
                </div>
              )}
              {changingPassword && (
                <div>
                  <input type="password" placeholder="New password" value={newPass} onChange={function (e) { setNewPass(e.target.value); }}
                    style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
                  <input type="password" placeholder="Confirm new password" value={confirmPass} onChange={function (e) { setConfirmPass(e.target.value); }}
                    style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
                  {passError && <p style={{ color: '#dc2626', fontSize: '13px' }}>{passError}</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={submitPasswordChange} style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={function () { setChangingPassword(false); setNewPass(''); setConfirmPass(''); setPassError(''); }}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Change Login Password</h3>
            {!changingLoginPassword && (
              <button onClick={function () { setChangingLoginPassword(true); }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer' }}>Change Password</button>
            )}
            {changingLoginPassword && (
              <div>
                <input type="password" placeholder="Current password" value={loginCurrentPass} onChange={function (e) { setLoginCurrentPass(e.target.value); }}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
                <input type="password" placeholder="New password" value={loginNewPass} onChange={function (e) { setLoginNewPass(e.target.value); }}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
                <input type="password" placeholder="Confirm new password" value={loginConfirmPass} onChange={function (e) { setLoginConfirmPass(e.target.value); }}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
                {loginPassError && <p style={{ color: '#dc2626', fontSize: '13px' }}>{loginPassError}</p>}
                {loginPassSuccess && <p style={{ color: '#16a34a', fontSize: '13px' }}>Password updated.</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={submitLoginPasswordChange} style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}>Save</button>
                  <button onClick={closeLoginPasswordChange} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
            <p style={{ fontSize: '12px', color: c.subtext, marginTop: '10px' }}>
              Forgot your current password? <button onClick={function () { setForgotOpen(true); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontSize: '12px' }}>Reset via email</button>
            </p>
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Language</h3>
            <button onClick={function () { setLang(lang === 'en' ? 'ar' : 'en'); }}
              style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: c.sidebarButtonBg, color: c.text, cursor: 'pointer' }}>
              {lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            </button>
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Appearance</h3>
            <button onClick={toggleTheme} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: c.sidebarButtonBg, color: c.text, cursor: 'pointer' }}>
              {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Account</h3>
            <button onClick={function () { setShowConfirm(true); }}
              style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Log Out</button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '24px', borderRadius: '8px', maxWidth: '300px', textAlign: 'center' }}>
            <p style={{ marginTop: 0 }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Yes, Log Out</button>
              <button onClick={function () { setShowConfirm(false); }} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {successOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%', position: 'relative' }}>
            <button onClick={function () { setSuccessOpen(false); }} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: c.subtext }}>X</button>
            <div style={{ fontSize: '28px', color: '#16a34a', marginBottom: '4px' }}>OK</div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Threshold updated</div>
            <p style={{ fontSize: '13px', color: c.subtext }}>Low-stock threshold is now {(Number(multiplier) * 100).toFixed(0)}% of each item's critical threshold.</p>
            <button onClick={function () { setSuccessOpen(false); }} style={{ width: '100%', padding: '9px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>Continue</button>
          </div>
        </div>
      )}

      {forgotOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '24px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>Reset password via email</div>
            {resetStatus && <p style={{ fontSize: '13px', color: resetStatus.indexOf('Error') === 0 ? '#dc2626' : '#16a34a', marginBottom: '10px' }}>{resetStatus}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeForgot} style={{ padding: '8px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, borderRadius: '6px', cursor: 'pointer' }}>Close</button>
              <button onClick={handleResetSubmit} style={{ padding: '8px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send Reset Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}