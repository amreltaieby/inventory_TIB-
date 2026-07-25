'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getLowStockMultiplier, setLowStockMultiplier } from '../../lib/settings';
import { getAdminPassword, setAdminPassword } from '../../lib/adminAuth';

export default function SettingsPage() {
  const [multiplier, setMultiplier] = useState('1.25');
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [thresholdUnlocked, setThresholdUnlocked] = useState(false);
  const [thresholdPassword, setThresholdPassword] = useState('');
  const [thresholdPassError, setThresholdPassError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { theme, toggleTheme } = useTheme();
  const c = getColors(theme);

  useEffect(() => {
    setMultiplier(String(getLowStockMultiplier()));
  }, []);

  const saveMultiplier = () => {
    const num = Number(multiplier);
    if (!num || num <= 1) {
      setErrorMsg('Enter a number greater than 1 (e.g. 1.25 means alert at 125% of the critical threshold)');
      return;
    }
    setErrorMsg('');
    setLowStockMultiplier(num);
    setSuccessOpen(true);
  };

  const submitPasswordChange = () => {
    setPassError('');
    if (currentPass !== getAdminPassword()) {
      setPassError('Current password is incorrect.');
      return;
    }
    if (!newPass || newPass.length < 4) {
      setPassError('New password must be at least 4 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    setAdminPassword(newPass);
    setChangingPassword(false);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    alert('Admin password updated.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: c.text, marginBottom: '28px' }}>Settings</h1>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Low Stock Threshold</h3>
            <p style={{ color: c.subtext, fontSize: '14px' }}>
              Each item has its own critical threshold, set from the Inventory page. This controls how far above
              that number "Low Stock" starts — 1.25 means Low Stock begins at 125% of the critical threshold.
            </p>
            {!thresholdUnlocked ? (
              <div>
                <input
                  type="password"
                  placeholder="Enter admin password to edit"
                  value={thresholdPassword}
                  onChange={(e) => setThresholdPassword(e.target.value)}
                  style={{ display: 'block', width: '220px', padding: '8px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, marginBottom: '8px' }}
                />
                {thresholdPassError && <p style={{ color: '#dc2626', fontSize: '13px' }}>{thresholdPassError}</p>}
                <button
                  onClick={() => {
                    if (thresholdPassword === getAdminPassword()) {
                      setThresholdUnlocked(true);
                      setThresholdPassError('');
                    } else {
                      setThresholdPassError('Incorrect password.');
                    }
                  }}
                  style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  Unlock
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    step="0.05"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, width: '100px' }}
                  />
                  <button onClick={saveMultiplier} style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Save
                  </button>
                </div>
                {errorMsg && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{errorMsg}</p>}
              </div>
            )}
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Admin Password</h3>
            <p style={{ color: c.subtext, fontSize: '14px' }}>
              This password is required for editing item names, deleting items, or changing alert thresholds.
            </p>
            {!changingPassword && (
              <>
                <p style={{ fontSize: '18px', letterSpacing: '4px', color: c.text }}>••••••••</p>
                <button
                  onClick={() => setChangingPassword(true)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${c.border}`, background: c.cardBg, color: c.text, cursor: 'pointer' }}
                >
                  Change Password
                </button>
              </>
            )}
            {changingPassword && (
              <div>
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box' }}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box' }}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box' }}
                />
                {passError && <p style={{ color: '#dc2626', fontSize: '13px' }}>{passError}</p>}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={submitPasswordChange} style={{ padding: '8px 16px', borderRadius: '6px', background: '#000000', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button
                    onClick={() => { setChangingPassword(false); setCurrentPass(''); setNewPass(''); setConfirmPass(''); setPassError(''); }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: `1px solid ${c.border}`, background: c.cardBg, color: c.text, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Appearance</h3>
            <button
              onClick={toggleTheme}
              style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: c.sidebarButtonBg, color: c.text, cursor: 'pointer' }}
            >
              {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Account</h3>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '24px', borderRadius: '8px', maxWidth: '300px', textAlign: 'center' }}>
            <p style={{ marginTop: 0 }}>Are you sure you want to log out?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Yes, Log Out
              </button>
              <button onClick={() => setShowConfirm(false)} style={{ padding: '8px 16px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%', position: 'relative' }}>
            <button
              onClick={() => setSuccessOpen(false)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: c.subtext }}
            >
              ✕
            </button>
            <div style={{ fontSize: '28px', color: '#16a34a', marginBottom: '4px' }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Threshold updated</div>
            <p style={{ fontSize: '13px', color: c.subtext }}>
              Low-stock threshold is now {(Number(multiplier) * 100).toFixed(0)}% of each item's critical threshold.
            </p>
            <button
              onClick={() => setSuccessOpen(false)}
              style={{ width: '100%', padding: '9px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}