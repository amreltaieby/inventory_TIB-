'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getLowStockMultiplier } from '../../lib/settings';

export default function AlertsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [snoozeOpenFor, setSnoozeOpenFor] = useState<string | null>(null);
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const { data: itemsData } = await supabase.from('items').select('*').not('low_threshold', 'is', null);
    const { data: txData } = await supabase.from('transactions').select('item_id, timestamp').order('timestamp', { ascending: false });
    const lastTxMap: { [key: string]: string } = {};
    (txData || []).forEach((tx: any) => { if (!lastTxMap[tx.item_id]) lastTxMap[tx.item_id] = tx.timestamp; });
    const now = new Date();
    const categorized = (itemsData || []).map((item: any) => {
      const threshold = Number(item.low_threshold);
      const qty = Number(item.quantity);
      const lowStockCeiling = threshold * getLowStockMultiplier();
      const snoozedUntil = item.snoozed_until ? new Date(item.snoozed_until) : null;
      const isSnoozed = !!(snoozedUntil && snoozedUntil > now);
      let status = 'ok';
      if (qty <= threshold) { status = 'critical'; } else if (qty <= lowStockCeiling) { status = 'low'; }
      return { ...item, status: status, isSnoozed: isSnoozed, since: lastTxMap[item.id] || item.created_at };
    });
    setItems(categorized);
  };

  const snoozeItem = async (item: any, days: number) => {
    const until = new Date();
    until.setDate(until.getDate() + days);
    await supabase.from('items').update({ snoozed_until: until.toISOString() }).eq('id', item.id);
    setSnoozeOpenFor(null);
    fetchAlerts();
  };

  const unsnoozeItem = async (item: any) => {
    await supabase.from('items').update({ snoozed_until: null }).eq('id', item.id);
    fetchAlerts();
  };

  const safeItems = items.filter(function (i) { return i && i.status; });
  const critical = safeItems.filter(function (i) { return i.status === 'critical' && !i.isSnoozed; });
  const low = safeItems.filter(function (i) { return i.status === 'low' && !i.isSnoozed; });
  const inStock = safeItems.filter(function (i) { return i.status === 'ok' && !i.isSnoozed; });
  const snoozed = safeItems.filter(function (i) { return i.isSnoozed; }).sort(function (a, b) { return new Date(a.snoozed_until).getTime() - new Date(b.snoozed_until).getTime(); });
  const totalActive = critical.length + low.length;

  const summaryCard = function (label: string, count: number, bg: string, border: string, text: string) {
    return (
      <div style={{ background: theme === 'dark' ? c.cardBg : bg, border: '1.5px solid ' + border, color: text, borderRadius: '10px', padding: '16px', flex: 1, minWidth: '110px' }}>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>{label}</div>
        <div style={{ fontSize: '26px', fontWeight: 'bold' }}>{count}</div>
      </div>
    );
  };

  const AlertItemCard = function (props: { item: any }) {
    const item = props.item;
    const isCritical = item.status === 'critical';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', marginBottom: '10px', borderRadius: '10px', background: theme === 'dark' ? c.cardBg : (isCritical ? '#fef2f2' : '#fffbeb'), border: isCritical ? '1px solid #dc2626' : '1px solid #ca8a04' }}>
        <div>
          <div style={{ fontWeight: 'bold', color: c.text }}>{item.name}</div>
          <div style={{ fontSize: '13px', color: c.subtext }}>{item.quantity} {item.unit} left (alert below {item.low_threshold})</div>
          <div style={{ fontSize: '12px', color: c.subtext, marginTop: '4px' }}>Since {item.since ? new Date(item.since).toLocaleString() : 'item creation'}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setSnoozeOpenFor(snoozeOpenFor === item.id ? null : item.id)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer', fontSize: '13px' }}>Snooze</button>
          {snoozeOpenFor === item.id && (
            <div style={{ position: 'absolute', top: '110%', right: 0, background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: '8px', zIndex: 10, whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '12px', color: c.subtext, marginBottom: '6px', padding: '0 4px' }}>Snooze for:</div>
              <button onClick={() => snoozeItem(item, 1)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>1 day</button>
              <button onClick={() => snoozeItem(item, 2)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>2 days</button>
              <button onClick={() => snoozeItem(item, 3)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>3 days</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: c.text, marginBottom: '28px' }}>Alerts</h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {summaryCard('Critical', critical.length, '#fef2f2', '#dc2626', theme === 'dark' ? '#f87171' : '#dc2626')}
            {summaryCard('Low Stock', low.length, '#fffbeb', '#ca8a04', theme === 'dark' ? '#fbbf24' : '#ca8a04')}
            {summaryCard('In Stock', inStock.length, '#f0fdf4', '#16a34a', theme === 'dark' ? '#4ade80' : '#16a34a')}
            {summaryCard('Snoozed', snoozed.length, '#f4f4f5', '#71717a', c.subtext)}
          </div>
          <div style={{ marginBottom: '28px' }}>
            {summaryCard('Total Active Alerts', totalActive, '#eff6ff', '#2563eb', theme === 'dark' ? '#60a5fa' : '#2563eb')}
          </div>
          {critical.length > 0 && (
            <div>
              <h3 style={{ color: theme === 'dark' ? '#f87171' : '#dc2626', marginBottom: '10px' }}>Critical</h3>
              {critical.map(function (item) { return <AlertItemCard key={item.id} item={item} />; })}
            </div>
          )}
          {low.length > 0 && (
            <div>
              <h3 style={{ color: theme === 'dark' ? '#fbbf24' : '#ca8a04', marginTop: '24px', marginBottom: '10px' }}>Low Stock</h3>
              {low.map(function (item) { return <AlertItemCard key={item.id} item={item} />; })}
            </div>
          )}
          {critical.length === 0 && low.length === 0 && <p style={{ color: c.subtext }}>No active alerts right now.</p>}
          {snoozed.length > 0 && (
            <div>
              <h3 style={{ color: c.subtext, marginTop: '32px', marginBottom: '10px' }}>Snoozed</h3>
              {snoozed.map(function (item) {
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', marginBottom: '10px', borderRadius: '10px', background: c.cardBg, border: '1px solid ' + c.border, opacity: 0.75 }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: c.text }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: c.subtext }}>{item.quantity} {item.unit} — snoozed until {new Date(item.snoozed_until).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => unsnoozeItem(item)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer', fontSize: '13px' }}>Unsnooze</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}