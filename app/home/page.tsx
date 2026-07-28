'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getLowStockMultiplier } from '../../lib/settings';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [lastAccessed, setLastAccessed] = useState<string | null>(null);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [inStockCount, setInStockCount] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(() => {
    loadData();
  }, []);

  const isTodayOrYesterday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    return sameDay(d, today) || sameDay(d, yesterday);
  };

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }

    const { data: profile } = await supabase.from('profiles').select('username, full_name, email, role').eq('id', user.id).single();
    if (!profile) { window.location.href = '/set-username'; return; }
    setUsername(profile.full_name || profile.username || (profile.email ? profile.email.split('@')[0] : 'there'));
    setRole(profile.role);

    const prevAccess = localStorage.getItem('lastAccessed');
    setLastAccessed(prevAccess);
    localStorage.setItem('lastAccessed', new Date().toISOString());

    const { data: tx } = await supabase
      .from('transactions')
      .select('id, quantity_change, type, timestamp, items(name)')
      .order('timestamp', { ascending: false });
    setRecentTx((tx || []).filter((t: any) => t.timestamp && isTodayOrYesterday(t.timestamp)));

    const { data: itemsData } = await supabase.from('items').select('*');
    setItems(itemsData || []);

    const { data: txForSince } = await supabase.from('transactions').select('item_id, timestamp').order('timestamp', { ascending: false });
    const lastTxMap: { [key: string]: string } = {};
    (txForSince || []).forEach((t: any) => { if (!lastTxMap[t.item_id]) lastTxMap[t.item_id] = t.timestamp; });

    const multiplier = getLowStockMultiplier();
    const alertsList: any[] = [];
    let inStock = 0;
    (itemsData || []).forEach((item: any) => {
      if (item.low_threshold === null || item.low_threshold === undefined) { inStock++; return; }
      const threshold = Number(item.low_threshold);
      const qty = Number(item.quantity);
      const since = lastTxMap[item.id] || item.created_at;
      if (qty <= threshold) alertsList.push({ name: item.name, level: 'Critical', since });
      else if (qty <= threshold * multiplier) alertsList.push({ name: item.name, level: 'Low stock', since });
      else inStock++;
    });

    setRecentAlerts(alertsList.filter((a) => a.since && isTodayOrYesterday(a.since)));
    setTotalAlerts(alertsList.length);
    setInStockCount(inStock);
  };

  const itemValue = (item: any) => {
    if (item.price_per_unit == null) return null;
    return Number(item.price_per_unit) * Number(item.quantity);
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid ' + c.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>Welcome, {username}</div>
            <div style={{ fontSize: '12px', color: c.subtext, marginTop: '2px' }}>
              Last accessed: {lastAccessed ? new Date(lastAccessed).toLocaleString() : 'First time'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ border: '1px solid #16a34a', background: theme === 'dark' ? 'rgba(22,163,74,0.1)' : '#f0fdf4', color: '#16a34a', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
              In Stock: {inStockCount}
            </div>
            <div style={{ border: '1px solid #dc2626', background: theme === 'dark' ? 'rgba(220,38,38,0.1)' : '#fef2f2', color: '#dc2626', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
              Alerts: {totalAlerts}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            <a href="/stock" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '8px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Inventory</a>
            <a href="/history" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '8px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Transactions</a>
            <a href="/alerts" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '8px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Alerts</a>
            <a href="/settings" style={{ flex: 1, padding: '18px', textAlign: 'center', borderRadius: '8px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, textDecoration: 'none', fontWeight: 600, fontSize: '13px' }}>Settings</a>
          </div>

          {role === 'admin' && items.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Stock Value
              </div>
              <div style={{ background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px' }}>
                {items.map((item, i) => {
                  const value = itemValue(item);
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: i > 0 ? '1px solid ' + c.border : 'none', fontSize: '13px' }}>
                      <span style={{ color: c.text }}>{item.name}</span>
                      <span style={{ minWidth: '90px', textAlign: 'right', color: value !== null ? c.text : c.subtext }}>
                        {value !== null ? value.toLocaleString() + ' EGP' : 'N/A'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Recent Activity
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + c.border, fontSize: '12px', fontWeight: 600, color: c.text }}>Additions / Removals</div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {recentTx.length === 0 && <div style={{ padding: '14px', fontSize: '13px', color: c.subtext }}>Nothing today or yesterday.</div>}
                {recentTx.map((t, i) => (
                  <div key={t.id} style={{ padding: '9px 14px', fontSize: '13px', borderTop: i > 0 ? '1px solid ' + c.border : 'none', color: t.type === 'add' ? '#16a34a' : '#dc2626' }}>
                    {t.type === 'add' ? 'Added' : 'Removed'} {Math.abs(t.quantity_change)} — {t.items?.name}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '280px', background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid ' + c.border, fontSize: '12px', fontWeight: 600, color: c.text }}>Alerts</div>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {recentAlerts.length === 0 && <div style={{ padding: '14px', fontSize: '13px', color: c.subtext }}>Nothing today or yesterday.</div>}
                {recentAlerts.map((a, i) => (
                  <div key={i} style={{ padding: '9px 14px', fontSize: '13px', borderTop: i > 0 ? '1px solid ' + c.border : 'none', color: a.level === 'Critical' ? '#dc2626' : '#d97706' }}>
                    {a.level} — {a.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}