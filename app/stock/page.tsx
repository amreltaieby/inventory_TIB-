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
  const [newItemPrice, setNewItemPrice] = useState('');
  const [qtyError, setQtyError] = useState(false);
  const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ item: any; action: string } | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionStep, setActionStep] = useState<{ item: any; action: string } | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [editUnitInput, setEditUnitInput] = useState('KG');
  const [thresholdInput, setThresholdInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(function () {
    checkProfile();
    fetchItems();
  }, []);

  const checkProfile = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const profileResult = await supabase.from('profiles').select('username, role, company_id').eq('id', user.id).single();
    const data = profileResult.data;
    if (!data) {
      window.location.href = '/set-username';
      return;
    }
    setRole(data.role);
    setCompanyId(data.company_id);
  };

  const fetchItems = async function () {
    const result = await supabase.from('items').select('*').order('name');
    if (!result.error) setItems(result.data);
  };

  const addNewItem = async function () {
    if (!newItemName || !newItemQty || Number(newItemQty) <= 0) {
      setQtyError(true);
      setTimeout(function () { setQtyError(false); }, 400);
      return;
    }
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;

    const insertData: any = { name: newItemName, quantity: Number(newItemQty), unit: newItemUnit, company_id: companyId };
    if (role === 'admin' && newItemPrice.trim() !== '') {
      insertData.price_per_unit = Number(newItemPrice);
    }
    const result = await supabase.from('items').insert(insertData).select().single();
    if (result.error) {
      alert('Insert failed: ' + result.error.message);
      return;
    }

    await supabase.from('transactions').insert({
      item_id: result.data.id,
      user_id: user.id,
      quantity_change: Number(newItemQty),
      type: 'add',
      company_id: companyId,
    });

    setNewItemName('');
    setNewItemQty('');
    setNewItemPrice('');
    fetchItems();
  };

  const adjustStock = async function (item: any, direction: string) {
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
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    await supabase.from('items').update({ quantity: newQuantity }).eq('id', item.id);
    await supabase.from('transactions').insert({ item_id: item.id, user_id: user.id, quantity_change: change, type: direction, company_id: companyId });
    const newAmounts = Object.assign({}, amounts);
    newAmounts[item.id] = '';
    setAmounts(newAmounts);
    fetchItems();
  };

  const openAction = function (item: any, action: string) {
    setMenuOpenFor(null);
    setPendingAction({ item: item, action: action });
    setPasswordInput('');
    setPasswordError('');
  };

  const confirmPassword = function () {
    if (passwordInput !== getAdminPassword()) {
      setPasswordError('Incorrect password.');
      return;
    }
    if (pendingAction) {
      if (pendingAction.action === 'edit') {
        setEditNameInput(pendingAction.item.name);
        setEditUnitInput(pendingAction.item.unit || 'KG');
      }
      if (pendingAction.action === 'threshold') {
        setThresholdInput(pendingAction.item.low_threshold != null ? pendingAction.item.low_threshold : '');
      }
      if (pendingAction.action === 'price') {
        setPriceInput(pendingAction.item.price_per_unit != null ? pendingAction.item.price_per_unit : '');
      }
      setActionStep(pendingAction);
    }
    setPendingAction(null);
    setPasswordInput('');
  };

  const submitEditName = async function () {
    if (!actionStep) return;
    const updates: any = {};
    if (editNameInput.trim() && editNameInput !== actionStep.item.name) updates.name = editNameInput.trim();
    if (editUnitInput !== actionStep.item.unit) updates.unit = editUnitInput;
    if (Object.keys(updates).length > 0) {
      await supabase.from('items').update(updates).eq('id', actionStep.item.id);
      fetchItems();
    }
    setActionStep(null);
  };

  const submitThreshold = async function () {
    if (!actionStep) return;
    const num = thresholdInput.trim() === '' ? null : Number(thresholdInput);
    await supabase.from('items').update({ low_threshold: num }).eq('id', actionStep.item.id);
    fetchItems();
    setActionStep(null);
  };

  const submitPrice = async function () {
    if (!actionStep) return;
    const num = priceInput.trim() === '' ? null : Number(priceInput);
    await supabase.from('items').update({ price_per_unit: num }).eq('id', actionStep.item.id);
    fetchItems();
    setActionStep(null);
  };

  const submitDelete = async function () {
    if (!actionStep) return;
    const result = await supabase.from('items').delete().eq('id', actionStep.item.id);
    if (result.error) {
      alert('Delete failed: ' + result.error.message + ' (likely has transaction history)');
    } else {
      fetchItems();
    }
    setActionStep(null);
  };

  const itemValue = function (item: any) {
    if (item.price_per_unit == null) return null;
    return Number(item.price_per_unit) * Number(item.quantity);
  };

  let filteredItems = items.filter(function (item) {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  filteredItems = filteredItems.slice().sort(function (a, b) {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
    if (sortBy === 'qty-asc') return Number(a.quantity) - Number(b.quantity);
    if (sortBy === 'qty-desc') return Number(b.quantity) - Number(a.quantity);
    return 0;
  });

  let stockValue = 0;
  filteredItems.forEach(function (it) {
    const v = itemValue(it);
    if (v) stockValue = stockValue + v;
  });
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh' }}>
        <div style={{ padding: '20px 32px', borderBottom: '1px solid ' + c.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>Inventory</div>
            {role === 'admin' && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext }}>Stock value: {stockValue.toLocaleString()} EGP</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input placeholder="Item name" value={newItemName} onChange={function (e) { setNewItemName(e.target.value); }}
              style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <input placeholder="Qty" type="number" value={newItemQty} onChange={function (e) { setNewItemQty(e.target.value); }}
              className={qtyError ? 'shake-error' : ''}
              style={{ padding: '7px 10px', fontSize: '13px', width: '80px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <select value={newItemUnit} onChange={function (e) { setNewItemUnit(e.target.value); }}
              style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }}>
              <option value="KG">KG</option>
              <option value="Ton">Ton</option>
              <option value="L">L</option>
              <option value="Unit">Unit</option>
            </select>
            {role === 'admin' && (
              <input placeholder={'Price per ' + newItemUnit} type="number" value={newItemPrice} onChange={function (e) { setNewItemPrice(e.target.value); }}
                style={{ padding: '7px 10px', fontSize: '13px', width: '120px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            )}
            <button onClick={addNewItem} style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Add Item
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 32px 0' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input placeholder="Search items..." value={searchTerm} onChange={function (e) { setSearchTerm(e.target.value); }}
              style={{ flex: 1, maxWidth: '280px', padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <div style={{ position: 'relative' }}>
              <button onClick={function () { setSortMenuOpen(!sortMenuOpen); }} title="Sort"
                style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, cursor: 'pointer' }}>
                sort
              </button>
              {sortMenuOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 30, minWidth: '160px', overflow: 'hidden' }}>
                  <button onClick={function () { setSortBy('name-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Name (A to Z)</button>
                  <button onClick={function () { setSortBy('name-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Name (Z to A)</button>
                  <button onClick={function () { setSortBy('qty-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Qty (Low to High)</button>
                  <button onClick={function () { setSortBy('qty-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Qty (High to Low)</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {filteredItems.length === 0 && <p style={{ color: c.subtext, fontSize: '13px' }}>No items match your search.</p>}
          {filteredItems.map(function (item) {
            const value = itemValue(item);
            return (
              <div key={item.id} style={{ marginBottom: '14px', padding: '14px', background: c.cardBg, borderRadius: '10px', boxShadow: theme === 'light' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <span style={{ minWidth: '120px', fontWeight: 'bold', color: c.text }}>{item.name}</span>
                  <span style={{ minWidth: '90px', fontWeight: 'bold', color: c.text }}>{item.quantity} {item.unit}</span>
                  {role === 'admin' && (
                    <span style={{ minWidth: '110px', color: c.subtext, fontSize: '13px' }}>
                      {value !== null ? value.toLocaleString() + ' EGP' : 'N/A'}
                    </span>
                  )}
                  <input type="number" placeholder="Amount" value={amounts[item.id] || ''} onChange={function (e) {
                    const newAmounts = Object.assign({}, amounts);
                    newAmounts[item.id] = e.target.value;
                    setAmounts(newAmounts);
                  }}
                    style={{ width: '90px', padding: '8px', borderRadius: '4px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
                  <button onClick={function () { adjustStock(item, 'add'); }} style={{ padding: '10px 18px', borderRadius: '6px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                  <button onClick={function () { adjustStock(item, 'remove'); }} style={{ padding: '10px 18px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Remove</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={function () { setMenuOpenFor(menuOpenFor === item.id ? null : item.id); }}
                      style={{ padding: '8px 12px', borderRadius: '6px', background: c.cardBg, color: c.text, border: '1px solid ' + c.border, cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>...</button>
                    {menuOpenFor === item.id && (
                      <div style={{ position: 'absolute', top: '110%', right: 0, background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '190px', textAlign: 'left' }}>
                        <button onClick={function () { openAction(item, 'threshold'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Set Alert Threshold</button>
                        {role === 'admin' && (
                          <button onClick={function () { openAction(item, 'price'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Set Price / {item.unit}</button>
                        )}
                        <button onClick={function () { openAction(item, 'edit'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>Edit Name / Quantity Type</button>
                        <button onClick={function () { openAction(item, 'delete'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {pendingAction && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Admin permission required</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>Enter the admin password to continue.</p>
            <input type="password" value={passwordInput} onChange={function (e) { setPasswordInput(e.target.value); }}
              onKeyDown={function (e) { if (e.key === 'Enter') confirmPassword(); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            {passwordError && <p style={{ color: '#dc2626', fontSize: '12px' }}>{passwordError}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={function () { setPendingAction(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmPassword} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'edit' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>Edit Name / Quantity Type</div>
            <label style={{ fontSize: '12px', color: c.subtext }}>Name</label>
            <input value={editNameInput} onChange={function (e) { setEditNameInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <label style={{ fontSize: '12px', color: c.subtext }}>Quantity Type</label>
            <select value={editUnitInput} onChange={function (e) { setEditUnitInput(e.target.value); }}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }}>
              <option value="KG">KG</option>
              <option value="Ton">Ton</option>
              <option value="L">L</option>
              <option value="Unit">Unit</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitEditName} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'threshold' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Set alert threshold</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>Alert when quantity drops to this number or below.</p>
            <input type="number" value={thresholdInput} onChange={function (e) { setThresholdInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitThreshold} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'price' && role === 'admin' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Set price per {actionStep.item.unit}</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>Price in EGP per unit of quantity.</p>
            <input type="number" value={priceInput} onChange={function (e) { setPriceInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitPrice} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'delete' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Delete "{actionStep.item.name}"?</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>This cannot be undone. Items with transaction history cannot be deleted.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitDelete} style={{ padding: '7px 14px', fontSize: '13px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
