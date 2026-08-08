'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import { getAdminPassword } from '../../lib/adminAuth';
import { useLanguage } from '../../lib/LanguageContext';

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
  const [priceError, setPriceError] = useState(false);
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
  const [openJobs, setOpenJobs] = useState<any[]>([]);
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [showSelectJobPrompt, setShowSelectJobPrompt] = useState(false);
  const { theme } = useTheme();
  const c = getColors(theme);
  const { lang } = useLanguage();

  const t = lang === 'ar' ? {
    noJob: 'بدون طلب', inventory: 'المخزون', stockValue: 'قيمة المخزون',
    itemName: 'اسم الصنف', qty: 'الكمية', pricePer: 'السعر لكل ', addItem: 'إضافة صنف',
    sort: 'ترتيب', nameAZ: 'الاسم (أ-ي)', nameZA: 'الاسم (ي-أ)', qtyLow: 'الكمية (تصاعدي)', qtyHigh: 'الكمية (تنازلي)',
    noMatch: 'لا توجد أصناف مطابقة.', amount: 'الكمية', add: 'إضافة', remove: 'إزالة',
    setThreshold: 'تحديد حد التنبيه', setPrice: 'تحديد السعر / ', editName: 'تعديل الاسم / نوع الكمية', delete: 'حذف',
    adminRequired: 'مطلوب إذن المسؤول', enterPassword: 'أدخل كلمة مرور المسؤول للمتابعة.', cancel: 'إلغاء', confirm: 'تأكيد',
    name: 'الاسم', quantityType: 'نوع الكمية', save: 'حفظ',
    thresholdTitle: 'تحديد حد التنبيه', thresholdDesc: 'التنبيه عندما تصل الكمية إلى هذا الرقم أو أقل.',
    priceTitle: 'تحديد السعر لكل ', priceDesc: 'السعر بالجنيه المصري لكل وحدة كمية.',
    deleteConfirm: 'حذف', deleteWarn: 'لا يمكن التراجع عن هذا. لا يمكن حذف الأصناف التي لها سجل معاملات.',
    selectOrderFirst: 'اختر طلبًا أولاً', selectOrderDesc: 'يمكن إزالة المواد فقط عند اختيار طلب أعلاه.', ok: 'موافق',
  } : {
    noJob: 'No Job', inventory: 'Inventory', stockValue: 'Stock value',
    itemName: 'Item name', qty: 'Qty', pricePer: 'Price per ', addItem: 'Add Item',
    sort: 'sort', nameAZ: 'Name (A to Z)', nameZA: 'Name (Z to A)', qtyLow: 'Qty (Low to High)', qtyHigh: 'Qty (High to Low)',
    noMatch: 'No items match your search.', amount: 'Amount', add: 'Add', remove: 'Remove',
    setThreshold: 'Set Alert Threshold', setPrice: 'Set Price / ', editName: 'Edit Name / Quantity Type', delete: 'Delete',
    adminRequired: 'Admin permission required', enterPassword: 'Enter the admin password to continue.', cancel: 'Cancel', confirm: 'Confirm',
    name: 'Name', quantityType: 'Quantity Type', save: 'Save',
    thresholdTitle: 'Set alert threshold', thresholdDesc: 'Alert when quantity drops to this number or below.',
    priceTitle: 'Set price per ', priceDesc: 'Price in EGP per unit of quantity.',
    deleteConfirm: 'Delete', deleteWarn: 'This cannot be undone. Items with transaction history cannot be deleted.',
    selectOrderFirst: 'Select an order first', selectOrderDesc: 'Materials can only be removed while an order is selected above.', ok: 'OK',
  };

  useEffect(function () {
    initPage();
  }, []);

  const initPage = async function () {
    await checkProfile();
    fetchItems();
    fetchJobData();
  };

  const fetchJobData = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;

    const jobsResult = await supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false });
    setOpenJobs(jobsResult.data || []);

    const selResult = await supabase.from('active_job_selections').select('job_id').eq('user_id', user.id).maybeSingle();
    setActiveJobId(selResult.data ? selResult.data.job_id : null);
  };

  const selectJob = async function (jobId: number | null) {
    if (!companyId) return;
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    const result = await supabase.from('active_job_selections').upsert({ user_id: user.id, job_id: jobId, company_id: companyId });
    if (result.error) { alert('Could not switch order: ' + result.error.message); return; }
    setActiveJobId(jobId);
  };

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

    if (role === 'admin' && newItemPrice.trim() !== '' && Number(newItemPrice) <= 0) {
      setPriceError(true);
      setTimeout(function () { setPriceError(false); }, 400);
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
    if (direction === 'remove' && !activeJobId) {
      setShowSelectJobPrompt(true);
      return;
    }
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
    const txData: any = { item_id: item.id, user_id: user.id, quantity_change: change, type: direction, company_id: companyId };
    if (direction === 'remove') {
      txData.job_id = activeJobId;
      txData.locked_price = item.price_per_unit != null ? item.price_per_unit : null;
    }
    await supabase.from('transactions').insert(txData);
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 32px', borderBottom: '1px solid ' + c.border }}>
          <button onClick={function () { selectJob(null); }}
            style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid ' + c.border, background: activeJobId === null ? c.text : c.cardBg, color: activeJobId === null ? c.pageBg : c.text, cursor: 'pointer' }}>
            {t.noJob}
          </button>
          {openJobs.map(function (job) {
            const active = activeJobId === job.id;
            return (
              <button key={job.id} onClick={function () { selectJob(job.id); }}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid ' + c.border, background: active ? c.text : c.cardBg, color: active ? c.pageBg : c.text, cursor: 'pointer' }}>
                {job.name}
              </button>
            );
          })}
        </div>

        <div style={{ padding: '20px 32px', borderBottom: '1px solid ' + c.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>{t.inventory}</div>
            {role === 'admin' && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext }}>{t.stockValue}: {stockValue.toLocaleString()} EGP</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input placeholder={t.itemName} value={newItemName} onChange={function (e) { setNewItemName(e.target.value); }}
              style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            <input placeholder={t.qty} type="number" value={newItemQty} onChange={function (e) { setNewItemQty(e.target.value); }}
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
              <input placeholder={t.pricePer + newItemUnit} type="number" value={newItemPrice} onChange={function (e) { setNewItemPrice(e.target.value); }}
              className={priceError ? 'shake-error' : ''}
                style={{ padding: '7px 10px', fontSize: '13px', width: '120px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            )}
            <button onClick={addNewItem} style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {t.addItem}
            </button>
          </div>
        </div>

        <div style={{ padding: '16px 32px 0' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <button onClick={function () { setSortMenuOpen(!sortMenuOpen); }} title="Sort"
                style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, cursor: 'pointer' }}>
                {t.sort}
              </button>
              {sortMenuOpen && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 30, minWidth: '160px', overflow: 'hidden' }}>
                  <button onClick={function () { setSortBy('name-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.nameAZ}</button>
                  <button onClick={function () { setSortBy('name-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.nameZA}</button>
                  <button onClick={function () { setSortBy('qty-asc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.qtyLow}</button>
                  <button onClick={function () { setSortBy('qty-desc'); setSortMenuOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.qtyHigh}</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {filteredItems.length === 0 && <p style={{ color: c.subtext, fontSize: '13px' }}>{t.noMatch}</p>}
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
                  <input type="number" placeholder={t.amount} value={amounts[item.id] || ''} onChange={function (e) {
                    const newAmounts = Object.assign({}, amounts);
                    newAmounts[item.id] = e.target.value;
                    setAmounts(newAmounts);
                  }}
                    style={{ width: '90px', padding: '8px', borderRadius: '4px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
                  <button onClick={function () { adjustStock(item, 'add'); }} style={{ padding: '10px 18px', borderRadius: '6px', background: '#16a34a', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{t.add}</button>
                  <button onClick={function () { adjustStock(item, 'remove'); }} style={{ padding: '10px 18px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{t.remove}</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={function () { setMenuOpenFor(menuOpenFor === item.id ? null : item.id); }}
                      style={{ padding: '8px 12px', borderRadius: '6px', background: c.cardBg, color: c.text, border: '1px solid ' + c.border, cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}>...</button>
                    {menuOpenFor === item.id && (
                      <div style={{ position: 'absolute', top: '110%', right: 0, background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 50, minWidth: '190px', textAlign: 'left' }}>
                        <button onClick={function () { openAction(item, 'threshold'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.setThreshold}</button>
                        {role === 'admin' && (
                          <button onClick={function () { openAction(item, 'price'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.setPrice}{item.unit}</button>
                        )}
                        <button onClick={function () { openAction(item, 'edit'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: c.text, cursor: 'pointer', fontSize: '13px' }}>{t.editName}</button>
                        <button onClick={function () { openAction(item, 'delete'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '13px' }}>{t.delete}</button>
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
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{t.adminRequired}</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>{t.enterPassword}</p>
            <input type="password" value={passwordInput} onChange={function (e) { setPasswordInput(e.target.value); }}
              onKeyDown={function (e) { if (e.key === 'Enter') confirmPassword(); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            {passwordError && <p style={{ color: '#dc2626', fontSize: '12px' }}>{passwordError}</p>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={function () { setPendingAction(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>{t.cancel}</button>
              <button onClick={confirmPassword} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'edit' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '10px' }}>{t.editName}</div>
            <label style={{ fontSize: '12px', color: c.subtext }}>{t.name}</label>
            <input value={editNameInput} onChange={function (e) { setEditNameInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <label style={{ fontSize: '12px', color: c.subtext }}>{t.quantityType}</label>
            <select value={editUnitInput} onChange={function (e) { setEditUnitInput(e.target.value); }}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }}>
              <option value="KG">KG</option>
              <option value="Ton">Ton</option>
              <option value="L">L</option>
              <option value="Unit">Unit</option>
            </select>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>{t.cancel}</button>
              <button onClick={submitEditName} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'threshold' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{t.thresholdTitle}</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>{t.thresholdDesc}</p>
            <input type="number" value={thresholdInput} onChange={function (e) { setThresholdInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>{t.cancel}</button>
              <button onClick={submitThreshold} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'price' && role === 'admin' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{t.priceTitle}{actionStep.item.unit}</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>{t.priceDesc}</p>
            <input type="number" value={priceInput} onChange={function (e) { setPriceInput(e.target.value); }} autoFocus
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>{t.cancel}</button>
              <button onClick={submitPrice} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {actionStep && actionStep.action === 'delete' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{t.deleteConfirm} "{actionStep.item.name}"?</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>{t.deleteWarn}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setActionStep(null); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>{t.cancel}</button>
              <button onClick={submitDelete} style={{ padding: '7px 14px', fontSize: '13px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t.deleteConfirm}</button>
            </div>
          </div>
        </div>
      )}

      {showSelectJobPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '300px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{t.selectOrderFirst}</div>
            <p style={{ fontSize: '12px', color: c.subtext }}>{t.selectOrderDesc}</p>
            <button onClick={function () { setShowSelectJobPrompt(false); }} style={{ width: '100%', padding: '9px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
              {t.ok}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}