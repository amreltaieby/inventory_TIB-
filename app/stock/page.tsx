'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getAdminPassword } from '../../lib/adminAuth';

export default function StockPage() {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('KG');
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ item: any; action: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionStep, setActionStep] = useState<{ item: any; action: string } | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [thresholdInput, setThresholdInput] = useState('');
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(() => { checkProfile(); fetchItems(); }, []);

  const checkProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/'; return; }
    const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    if (!data) window.location.href = '/set-username';
  };

  const fetchItems = async () => {
    const { data, error } = await supabase.from('items').select('*').order('name');
    if (!error) setItems(data);
  };

  const addNewItem = async () => {
    if (!newItemName || !newItemQty) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    if (!profile) return;
    const { error } = await supabase.from('items').insert({
      name: newItemName,
      quantity: Number(newItemQty),
      unit: newItemUnit,
      company_id: profile.company_id,
    });
    if (error) { alert('Insert failed: ' + error.message); return; }
    setNewItemName(''); setNewItemQty(''); fetchItems();
  };

  const adjustStock = async (item: any, direction: string) => {
    const amount = Number(amounts[item.id]);
    if (!amount || amount <= 0) { alert('Enter a valid amount first'); return; }
    const change = direction === 'add' ? amount : -amount;
    const newQuantity = Number(item.quantity) + change;
    if (newQuantity < 0) { alert('Not enough stock to remove that much'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();

    await supabase.from('items').update({ quantity: newQuantity }).eq('id', item.id);
    await supabase.from('transactions').insert({
      item_id: item.id,
      user_id: user.id,
      quantity_change: change,
      type: direction,
      company_id: profile?.company_id,
    });

    setAmounts({ ...amounts, [item.id]: '' });
    fetchItems();
  };

  const openAction = (item: any, action: string) => {
    setMenuOpenFor(null);
    setPendingAction({ item, action });
    setPasswordInput(''); setPasswordError('');
  };

  const confirmPassword = () => {
    if (passwordInput !== getAdminPassword()) { setPasswordError('Incorrect password.'); return; }
    if (pendingAction) {
      if (pendingAction.action === 'edit') setEditNameInput(pendingAction.item.name);
      if (pendingAction.action === 'threshold') setThresholdInput(pendingAction.item.low_threshold ?? '');
      setActionStep(pendingAction);
    }
    setPendingAction(null); setPasswordInput('');
  };

  const submitEditName = async () => {
    if (!actionStep) return;
    if (editNameInput.trim() && editNameInput !== actionStep.item.name) {
      await supabase.from('items').update({ name: editNameInput.trim() }).eq('id', actionStep.item.id);
      fetchItems();
    }
    setActionStep(null);
  };

  const submitThreshold = async () => {
    if (!actionStep) return;
    const num = thresholdInput.trim() === '' ? null : Number(thresholdInput);
    await supabase.from('items').update({ low_threshold: num }).eq('id', actionStep.item.id);
    fetchItems(); setActionStep(null);
  };

  const submitDelete = async () => {
    if (!actionStep) return;
    const { error } = await supabase.from('items').delete().eq('id', actionStep.item.id);
    if (error) alert('Delete failed: ' + error.message + ' (likely has transaction history)');
    else fetchItems();
    setActionStep(null);
  };

  let filteredItems = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  filteredItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'qty-asc') return Number(a.quantity) - Number(b.quantity);
    if (sortBy === 'qty-desc') return Number(b.quantity) - Number(a.quantity);
    return 0;
  });

  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${c.border}` };
  const td: React.CSSProperties = { padding: '7px 12px', fontSize: '13px', color: c.text };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh' }}>
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>Inventory</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text }} />
            <input placeholder="Qty" type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '13px', width: '80px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text }} />
            <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}
              style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text }}>
              <option value="KG">KG</option><option value="L">L</option><option value="Unit">Unit</option>
            </select>
            <button onClick={addNewItem} style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Add Item
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 32px 0' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input placeholder="Search items..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, maxWidth: '280px', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text }} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                title="Sort"
                style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, cursor: 'pointer' }}
              >
                ⇅
              </button>
              {sortMenuOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 30, minWidth: '160px', overflow: 'hidden' }}>
                  <button onClick={() => { setSortBy('name-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Name (A–Z)</button>
                  <button onClick={() => { setSortBy('name-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Name (Z–A)</button>
                  <button onClick={() => { setSortBy('qty-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Qty (Low–High)</button>
                  <button onClick={() => { setSortBy('qty-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Qty (High–Low)</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          <table style={{ background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '8px' }}>
            <thead>
              <tr>
                <th style={th}>Item</th>
                <th style={th}>Quantity</th>
                <th style={th}>Amount</th>
                <th style={th}></th>
                <th style={th}>Alert at</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => (
                <tr key={item.id} style={{ background: i % 2 === 1 ? c.rowAlt : 'transparent' }}>
                  <td style={{ ...td, fontWeight: 600 }}>{item.name}</td>
                  <td style={td}>{item.quantity} {item.unit}</td>
                  <td style={td}>
                    <input type="number" placeholder="Amount" value={amounts[item.id] || ''}
                      onChange={(e) => setAmounts({ ...amounts, [item.id]: e.target.value })}
                      style={{ width: '80px', padding: '5px 8px', fontSize: '12px', borderRadius: '5px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text }} />
                  </td>
                  <td style={td}>
                    <button onClick={() => adjustStock(item, 'add')} style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '5px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', marginRight: '6px' }}>Add</button>
                    <button onClick={() => adjustStock(item, 'remove')} style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '5px', background: '#dc2626', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                  </td>
                  <td style={{ ...td, color: c.subtext, fontSize: '12px' }}>{item.low_threshold ?? '—'}</td>
                  <td style={{ ...td, position: 'relative', textAlign: 'right' }}>
                    <button onClick={() => setMenuOpenFor(menuOpenFor === item.id ? null : item.id)}
                      style={{ padding: '4px 8px', borderRadius: '5px', background: 'transparent', color: c.text, border: `1px solid ${c.border}`, cursor: 'pointer', fontSize: '14px' }}>
                      ⋮
                    </button>
                    {menuOpenFor === item.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, background: c.cardBg, border: `1px solid ${c.border}`, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '160px', textAlign: 'left' }}>
                        <button onClick={() => openAction(item, 'threshold')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Set Alert Threshold</button>
                        <button onClick={() => openAction(item, 'edit')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Edit Name</button>
                        <button onClick={() => openAction(item, 'delete')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && <p style={{ color: c.subtext, fontSize: '13px', marginTop: '12px' }}>No items match your search.</p>}
        </div>
      </div>

      {pendingAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Admin permission required</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>Enter the admin password to continue.</p>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmPassword(); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            {passwordError && <p style={{ color: '#dc2626', fontSize: '12px' }}>{passwordError}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setPendingAction(null)} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmPassword} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {actionStep?.action === 'edit' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Edit item name</div>
            <input value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActionStep(null)} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitEditName} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {actionStep?.action === 'threshold' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Set alert threshold</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>Alert when quantity drops to this number or below.</p>
            <input type="number" value={thresholdInput} onChange={(e) => setThresholdInput(e.target.value)} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: `1px solid ${c.inputBorder}`, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActionStep(null)} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitThreshold} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {actionStep?.action === 'delete' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Delete "{actionStep.item.name}"?</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>This cannot be undone. Items with transaction history cannot be deleted.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setActionStep(null)} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: `1px solid ${c.border}`, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitDelete} style={{ padding: '7px 14px', fontSize: '13px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}