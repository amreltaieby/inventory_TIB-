'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/ThemeContext';
import { getColors } from '../lib/theme';
import { getLowStockMultiplier } from '../lib/settings';

export default function Sidebar() {
  const [alertCount, setAlertCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const { theme } = useTheme();
  const c = getColors(theme);
  const pathname = usePathname();

  useEffect(() => {
    fetchAlertCount();
    fetchRole();

    const channel = supabase
      .channel('sidebar-items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchAlertCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlertCount = async () => {
    const { data, error } = await supabase.from('items').select('*').not('low_threshold', 'is', null);
    if (!error && data) {
      const multiplier = getLowStockMultiplier();
      const count = data.filter((item) => Number(item.quantity) <= Number(item.low_threshold) * multiplier).length;
      setAlertCount(count);
    }
  };

  const fetchRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    setRole(data?.role || null);
  };

  const linkStyle = function (active: boolean) {
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      textDecoration: 'none',
      color: active ? '#ffffff' : '#94a3b8',
      background: active ? c.sidebarButtonActive : 'transparent',
    } as React.CSSProperties;
  };

  const badgeStyle: React.CSSProperties = {
    background: '#dc2626',
    color: 'white',
    borderRadius: '999px',
    minWidth: '18px',
    height: '18px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
  };

  return (
    <div style={{
      width: collapsed ? '56px' : '200px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
      background: c.sidebarBg,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      transition: 'width 0.15s',
      borderRight: '1px solid #1e293b',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '0 4px' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: 'transparent', color: '#f1f5f9', border: 'none', borderRadius: '6px', width: '30px', height: '30px', fontSize: '15px', cursor: 'pointer', flexShrink: 0 }}
        >
          ☰
        </button>
        {!collapsed && <span style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9', letterSpacing: '0.02em' }}>NOVIQ</span>}
      </div>

      {!collapsed && (
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <a href="/home" style={linkStyle(pathname === '/home')}>
            <span>Home</span>
          </a>
          <a href="/stock" style={linkStyle(pathname === '/stock')}>
            <span>Inventory</span>
          </a>
          <a href="/history" style={linkStyle(pathname === '/history')}>
            <span>History</span>
          </a>
          <a href="/alerts" style={linkStyle(pathname === '/alerts')}>
            <span>Alerts</span>
            {alertCount > 0 && <span style={badgeStyle}>{alertCount}</span>}
          </a>
          <a href="/settings" style={linkStyle(pathname === '/settings')}>
            <span>Settings</span>
          </a>
          {role === 'admin' && (
            <a href="/admin-tools" style={linkStyle(pathname === '/admin-tools')}>
              <span>Admin Tools</span>
            </a>
          )}
        </nav>
      )}
    </div>
  );
}