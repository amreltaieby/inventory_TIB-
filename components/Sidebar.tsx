'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    fetchAlertCount();
  }, []);

  const fetchAlertCount = async () => {
    const { data, error } = await supabase.from('items').select('*').not('low_threshold', 'is', null);
    if (!error && data) {
      const count = data.filter((item) => Number(item.quantity) <= Number(item.low_threshold)).length;
      setAlertCount(count);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{
      width: '200px',
      minHeight: '100vh',
      borderRight: '1px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      fontFamily: 'sans-serif',
    }}>
      <div style={{ padding: '0 20px', marginBottom: '30px', fontWeight: 'bold', fontSize: '18px' }}>
        Inventory
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <a href="/stock" style={navLinkStyle}>Inventory</a>
        <a href="/history" style={navLinkStyle}>Transaction History</a>
        <a href="/alerts" style={{ ...navLinkStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Alerts</span>
          {alertCount > 0 && (
            <span style={{
              background: '#dc2626',
              color: 'white',
              borderRadius: '999px',
              minWidth: '20px',
              height: '20px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 5px',
              marginRight: '20px',
            }}>
              {alertCount}
            </span>
          )}
        </a>
      </nav>

      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', maxWidth: '300px', textAlign: 'center' }}>
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
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  padding: '10px 20px',
  color: '#333',
  textDecoration: 'none',
  fontSize: '14px',
};