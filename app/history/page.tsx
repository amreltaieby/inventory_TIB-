'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, quantity_change, type, timestamp, items(name, unit), profiles(username)')
      .order('timestamp', { ascending: false });
    if (error) {
      console.log('History fetch error:', error);
      alert('Failed to load history: ' + error.message);
    } else {
      console.log('History data:', data);
      setTransactions(data);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>History</h1>
        <a href="/stock" style={{ color: '#2563eb' }}>← Back to Stock</a>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '8px' }}>Item</th>
            <th style={{ padding: '8px' }}>Change</th>
            <th style={{ padding: '8px' }}>Type</th>
            <th style={{ padding: '8px' }}>Who</th>
            <th style={{ padding: '8px' }}>When</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{t.items?.name || 'Deleted item'}</td>
              <td style={{ padding: '8px' }}>{t.quantity_change > 0 ? '+' : ''}{t.quantity_change} {t.items?.unit}</td>
              <td style={{ padding: '8px' }}>{t.type}</td>
              <td style={{ padding: '8px' }}>{t.profiles?.username || 'Unknown'}</td>
              <td style={{ padding: '8px' }}>{t.timestamp ? new Date(t.timestamp).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}