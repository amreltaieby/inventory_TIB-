'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';

export default function AlertsPage() {
  const [lowItems, setLowItems] = useState<any[]>([]);

  useEffect(() => {
    fetchLowItems();
  }, []);

  const fetchLowItems = async () => {
    const { data, error } = await supabase.from('items').select('*').not('low_threshold', 'is', null);
    if (!error && data) {
      const filtered = data.filter((item) => Number(item.quantity) <= Number(item.low_threshold));
      setLowItems(filtered);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px', flex: 1 }}>
        <h1>Alerts</h1>

        {lowItems.length === 0 && <p style={{ color: '#666' }}>No low-stock alerts right now.</p>}

        {lowItems.map((item) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px', marginBottom: '10px', borderRadius: '8px',
            background: '#fef2f2', border: '1px solid #fecaca',
          }}>
            <span style={{ fontWeight: 'bold' }}>{item.name}</span>
            <span style={{ color: '#dc2626' }}>
              {item.quantity} {item.unit} left (alert below {item.low_threshold})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}