'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function StockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('KG');
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    checkProfile();
    fetchItems();
  }, []);

  const checkProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/';
      return;
    }
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    if (!data) {
      window.location.href = '/set-username';
    }
  };

  const fetchItems = async () => {
    const { data, error } = await supabase.from('items').select('*').order('name');
    if (!error) setItems(data);
  };

  const addNewItem = async () => {
    if (!newItemName || !newItemQty) return;
    const { error } = await supabase.from('items').insert({
      name: newItemName,
      quantity: Number(newItemQty),
      unit: newItemUnit,
    });
    if (error) {
      alert('Insert failed: ' + error.message);
      return;
    }
    setNewItemName('');
    setNewItemQty('');
    fetchItems();
  };

  const adjustStock = async (item: any, direction: string) => {
    const amount = Number(amounts[item.id]);
    if (!amount || amount <= 0) {
      alert('Enter a valid amount first');
      return;
    }
    const change = direction === 'add' ? amount : -amount;
    const newQuantity = Number(item.quantity) + change;

    if (newQuantity < 0) {
      alert('Not enough stock to remove that much');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('items').update({ quantity: newQuantity }).eq('id', item.id);

    await supabase.from('transactions').insert({
      item_id: item.id,
      user_id: user.id,
      quantity_change: change,
      type: direction,
    });

    setAmounts({ ...amounts, [item.id]: '' });
    fetchItems();
  };

  const deleteItem = async (item: any) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (error) {
      alert('Delete failed: ' + error.message + ' (likely has transaction history)');
      return;
    }
    fetchItems();
  };

  const editName = async (item: any) => {
    const newName = prompt('New name for this item:', item.name);
    if (!newName || newName === item.name) return;
    await supabase.from('items').update({ name: newName }).eq('id', item.id);
    fetchItems();
  };

  return (
    <div style={{ maxWidth: '750px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Stock</h1>
        <a href="/history" style={{ color: '#2563eb' }}>View History →</a>
      </div>

      <div style={{ background: '#f4f4f5', padding: '16px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Add New Item</h3>
        <input
          placeholder="Item name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          placeholder="Starting quantity"
          type="number"
          value={newItemQty}
          onChange={(e) => setNewItemQty(e.target.value)}
          style={{ marginRight: '8px', padding: '8px', width: '140px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <select
          value={newItemUnit}
          onChange={(e) => setNewItemUnit(e.target.value)}
          style={{ marginRight: '8px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="KG">KG</option>
          <option value="L">L</option>
        </select>
        <button onClick={addNewItem} style={{ padding: '8px 16px', borderRadius: '4px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}>
          Add Item
        </button>
      </div>

      {items.map((item) => (
        <div key={item.id} style={{ marginBottom: '14px', padding: '14px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '140px', fontWeight: 'bold' }}>{item.name}</span>
            <span style={{ width: '100px' }}>{item.quantity} {item.unit}</span>
            <input
              type="number"
              placeholder="Amount"
              value={amounts[item.id] || ''}
              onChange={(e) => setAmounts({ ...amounts, [item.id]: e.target.value })}
              style={{ width: '90px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              onClick={() => adjustStock(item, 'add')}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                background: '#16a34a',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Add
            </button>
            <button
              onClick={() => adjustStock(item, 'remove')}
              style={{
                padding: '10px 18px',
                borderRadius: '6px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => editName(item)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontSize: '13px' }}
            >
              Edit
            </button>
            <button
              onClick={() => deleteItem(item)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ccc', background: 'white', color: '#888', cursor: 'pointer', fontSize: '13px' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}