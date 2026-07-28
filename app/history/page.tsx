'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [whoFilter, setWhoFilter] = useState('');
  const [itemFilter, setItemFilter] = useState('');
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(() => {
    checkAuth();
    fetchHistory();

    const onFocus = () => fetchHistory();
    window.addEventListener('focus', onFocus);

    const channel = supabase
      .channel('history-transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) window.location.href = '/login';
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, quantity_change, type, timestamp, items(name, unit), profiles(username, full_name, email)')
      .order('timestamp', { ascending: false });
    if (error) {
      alert('Failed to load history: ' + error.message);
    } else {
      setTransactions(data || []);
    }
  };

  const getDisplayName = (p: any) => {
    if (!p) return 'Unknown';
    return p.full_name || p.username || (p.email ? p.email.split('@')[0] : 'Unknown');
  };

  const uniqueUsers = Array.from(new Set(transactions.map((t) => getDisplayName(t.profiles)).filter((n) => n !== 'Unknown')));
  const uniqueItems = Array.from(new Set(transactions.map((t) => t.items?.name).filter(Boolean)));

  const filteredTransactions = transactions.filter((t) => {
    if (t.timestamp) {
      const txDate = new Date(t.timestamp).toISOString().slice(0, 10);
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo && txDate > dateTo) return false;
    }
    if (whoFilter && getDisplayName(t.profiles) !== whoFilter) return false;
    if (itemFilter && t.items?.name !== itemFilter) return false;
    return true;
  });

  const groupLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const groups: { label: string; items: any[] }[] = [];
  filteredTransactions.forEach((t) => {
    const label = t.timestamp ? groupLabel(t.timestamp) : 'Unknown date';
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(t);
    else groups.push({ label, items: [t] });
  });

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: c.text, margin: 0 }}>History</h1>
            <button onClick={fetchHistory} title="Refresh"
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer', fontSize: '13px' }}>
              ⟳
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: c.subtext }}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <label style={{ fontSize: '13px', color: c.subtext }}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <select value={whoFilter} onChange={(e) => setWhoFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }}>
              <option value="">All users</option>
              {uniqueUsers.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={itemFilter} onChange={(e) => setItemFilter(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }}>
              <option value="">All items</option>
              {uniqueItems.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            {(dateFrom || dateTo || whoFilter || itemFilter) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setWhoFilter(''); setItemFilter(''); }}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.cardBg, color: c.text, cursor: 'pointer' }}>
                Clear filters
              </button>
            )}
          </div>

          {groups.length === 0 && <p style={{ color: c.subtext }}>No matching transactions.</p>}

          {groups.map((group) => (
            <div key={group.label} style={{ marginBottom: '24px' }}>
              <h3 style={{ color: c.subtext, marginBottom: '10px' }}>{group.label}</h3>
              {group.items.map((t) => {
                const isAdd = t.type === 'add';
                const rowColor = isAdd ? '#16a34a' : '#dc2626';
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.cardBg, borderRadius: '10px', padding: '14px 18px', marginBottom: '10px', boxShadow: theme === 'light' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                    <span style={{ fontWeight: 'bold', width: '150px', color: rowColor }}>{t.items?.name || 'Deleted item'}</span>
                    <span style={{ width: '220px', color: rowColor }}>{isAdd ? 'Added' : 'Removed'} {Math.abs(t.quantity_change)} {t.items?.unit}</span>
                    <span style={{ width: '110px', color: rowColor }}>{getDisplayName(t.profiles)}</span>
                    <span style={{ color: c.subtext, fontSize: '13px' }}>{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}