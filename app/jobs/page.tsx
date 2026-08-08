'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [formulaRows, setFormulaRows] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [hasUnpriced, setHasUnpriced] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newDue, setNewDue] = useState('');
  const [water, setWater] = useState('');
  const [productName, setProductName] = useState('');
  const [finishDate, setFinishDate] = useState('');
  const [pkgSize, setPkgSize] = useState('');
  const [pkgUnit, setPkgUnit] = useState('KG');
  const [pkgPrice, setPkgPrice] = useState('');
  const [stickerPrice, setStickerPrice] = useState('');
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(function () {
    init();
  }, []);

  const init = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) { window.location.href = '/login'; return; }
    const profileResult = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
    setCompanyId(profileResult.data ? profileResult.data.company_id : null);
    fetchJobs();
  };

  const fetchJobs = async function () {
    const result = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    const data = result.data || [];
    setJobs(data);
    if (data.length > 0 && selectedJobId === null) {
      selectJob(data[0].id);
    }
  };

  const selectJob = async function (jobId: number) {
    setSelectedJobId(jobId);

    const jobRow = jobs.find(function (j) { return j.id === jobId; });
    setWater(jobRow && jobRow.water != null ? String(jobRow.water) : '');
    setProductName(jobRow && jobRow.product_name ? jobRow.product_name : '');
    setFinishDate(jobRow && jobRow.finish_date ? jobRow.finish_date : '');

    const pkgResult = await supabase.from('job_packaging').select('*').eq('job_id', jobId).maybeSingle();
    const pkg = pkgResult.data;
    setPkgSize(pkg && pkg.packaging_size != null ? String(pkg.packaging_size) : '');
    setPkgUnit(pkg && pkg.packaging_unit ? pkg.packaging_unit : 'KG');
    setPkgPrice(pkg && pkg.packaging_price != null ? String(pkg.packaging_price) : '');
    setStickerPrice(pkg && pkg.sticker_price != null ? String(pkg.sticker_price) : '');

    const result = await supabase
      .from('transactions')
      .select('quantity_change, locked_price, items(name, unit)')
      .eq('job_id', jobId)
      .eq('type', 'remove');

    const rows = result.data || [];
    const grouped: { [key: string]: any } = {};
    let total = 0;
    let unpriced = false;

    rows.forEach(function (row: any) {
      const name = row.items ? row.items.name : 'Deleted item';
      const unit = row.items ? row.items.unit : '';
      const qty = Math.abs(Number(row.quantity_change));
      const price = row.locked_price;
      if (!grouped[name]) {
        grouped[name] = { name: name, unit: unit, qty: 0, cost: 0, hasUnpriced: false };
      }
      grouped[name].qty += qty;
      if (price != null) {
        grouped[name].cost += qty * Number(price);
        total += qty * Number(price);
      } else {
        grouped[name].hasUnpriced = true;
        unpriced = true;
      }
    });

    setFormulaRows(Object.values(grouped));
    setTotalCost(total);
    setHasUnpriced(unpriced);
  };

  const saveProductName = async function () {
    if (!selectedJobId) return;
    await supabase.from('jobs').update({ product_name: productName.trim() === '' ? null : productName.trim() }).eq('id', selectedJobId);
    fetchJobs();
  };

  const saveWater = async function () {
    if (!selectedJobId) return;
    await supabase.from('jobs').update({ water: water.trim() === '' ? null : Number(water) }).eq('id', selectedJobId);
    fetchJobs();
  };

  const saveFinishDate = async function () {
    if (!selectedJobId) return;
    await supabase.from('jobs').update({ finish_date: finishDate === '' ? null : finishDate }).eq('id', selectedJobId);
    fetchJobs();
  };

  const savePackaging = async function () {
    if (!selectedJobId) return;
    await supabase.from('job_packaging').upsert({
      job_id: selectedJobId,
      packaging_size: pkgSize.trim() === '' ? null : Number(pkgSize),
      packaging_unit: pkgUnit,
      packaging_price: pkgPrice.trim() === '' ? null : Number(pkgPrice),
      sticker_price: stickerPrice.trim() === '' ? null : Number(stickerPrice),
    });
  };

  const createJob = async function () {
    if (!newName.trim()) { alert('Order name is required.'); return; }
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    const result = await supabase.from('jobs').insert({
      name: newName.trim(),
      start_date: newStart || null,
      due_date: newDue || null,
      status: 'open',
      created_by: user.id,
      company_id: companyId,
    }).select().single();
    if (result.error) { alert('Failed: ' + result.error.message); return; }
    setNewName(''); setNewStart(''); setNewDue(''); setShowCreate(false);
    await fetchJobs();
    selectJob(result.data.id);
  };

  const closeJob = async function (jobId: number) {
    const confirmed = confirm('Close this order? It will stop appearing as selectable on the Inventory page.');
    if (!confirmed) return;
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId);
    fetchJobs();
  };

  const reopenJob = async function (jobId: number) {
    await supabase.from('jobs').update({ status: 'open' }).eq('id', jobId);
    fetchJobs();
  };

  const selectedJob = jobs.find(function (j) { return j.id === selectedJobId; });

  const totalMaterialQty = formulaRows.reduce(function (sum, r) { return sum + r.qty; }, 0);
  const waterNum = water.trim() === '' ? 0 : Number(water);
  const batchSize = totalMaterialQty + waterNum;

  const packagingQty = (batchSize > 0 && pkgSize.trim() !== '' && Number(pkgSize) > 0)
    ? batchSize / Number(pkgSize)
    : null;

  const packagingTotal = (packagingQty != null && pkgPrice.trim() !== '') ? packagingQty * Number(pkgPrice) : null;
  const stickerTotal = (packagingQty != null && stickerPrice.trim() !== '') ? packagingQty * Number(stickerPrice) : null;
  const finalOrderCost = totalCost + (packagingTotal || 0) + (stickerTotal || 0);

  const PIE_COLORS = ['#2563eb', '#0891b2', '#16a34a', '#eab308', '#f97316', '#dc2626', '#7c3aed', '#db2777'];

  const drawPieOnly = function (slices: { label: string; value: number }[]) {
    const total = slices.reduce(function (s, x) { return s + x.value; }, 0);
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx || total <= 0) return null;

    const cx = 150;
    const cy = 150;
    const r = 130;
    let startAngle = -Math.PI / 2;

    slices.forEach(function (slice, i) {
      const sliceAngle = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
      ctx.fill();
      startAngle += sliceAngle;
    });

    return canvas.toDataURL('image/png');
  };

  const downloadReport = function () {
    if (!selectedJob) return;
    const doc = new jsPDF();
    const companyNameForFooter = 'NOVIQ Inventory';

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedJob.name, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const sub = 'Start: ' + (selectedJob.start_date || 'N/A') + '   Due: ' + (selectedJob.due_date || 'N/A') + '   Finish: ' + (finishDate || 'N/A');
    doc.text(sub, 105, 25, { align: 'center' });

    const packagesProduced = packagingQty != null ? packagingQty : null;
    const costPerPackage = (packagesProduced != null && packagesProduced > 0) ? (finalOrderCost / packagesProduced) : null;
    const summaryLine = 'Batch size: ' + batchSize.toLocaleString()
      + '   |   Packages produced: ' + (packagesProduced != null ? packagesProduced.toFixed(2) : 'N/A')
      + '   |   Cost per package: ' + (costPerPackage != null ? costPerPackage.toFixed(2) + ' EGP' : 'N/A')
      + '   |   Packaging size: ' + (pkgSize || 'N/A') + ' ' + pkgUnit;
    doc.setFontSize(9);
    doc.text(summaryLine, 105, 31, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Materials', 105, 42, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    const materialsBody = formulaRows.map(function (r) {
      const pctFormula = batchSize > 0 ? ((r.qty / batchSize) * 100).toFixed(1) + '%' : '0%';
      const pctCost = totalCost > 0 && !r.hasUnpriced ? ((r.cost / totalCost) * 100).toFixed(1) + '%' : 'N/A';
      return [r.name, String(r.qty) + ' ' + r.unit, pctFormula, r.hasUnpriced ? 'N/A' : r.cost.toFixed(2) + ' EGP', pctCost];
    });
    if (waterNum > 0) {
      const waterPct = batchSize > 0 ? ((waterNum / batchSize) * 100).toFixed(1) + '%' : '0%';
      materialsBody.push(['Water', String(waterNum), waterPct, 'N/A', 'N/A']);
    }

    autoTable(doc, {
      startY: 46,
      head: [['Material', 'Amount', '% of Formula', 'Cost Contribution', 'Cost %']],
      body: materialsBody,
    });

    const afterMaterials = (doc as any).lastAutoTable.finalY + 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Cost Analysis', 105, afterMaterials, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    const costBody: any[] = [];
    formulaRows.forEach(function (r) {
      const pct = finalOrderCost > 0 && !r.hasUnpriced ? ((r.cost / finalOrderCost) * 100).toFixed(1) + '%' : 'N/A';
      costBody.push([r.name, r.hasUnpriced ? 'N/A' : r.cost.toFixed(2) + ' EGP', pct]);
    });
    costBody.push(['Packaging', packagingTotal != null ? packagingTotal.toFixed(2) + ' EGP' : 'N/A', (packagingTotal != null && finalOrderCost > 0) ? ((packagingTotal / finalOrderCost) * 100).toFixed(1) + '%' : 'N/A']);
    costBody.push(['Sticker', stickerTotal != null ? stickerTotal.toFixed(2) + ' EGP' : 'N/A', (stickerTotal != null && finalOrderCost > 0) ? ((stickerTotal / finalOrderCost) * 100).toFixed(1) + '%' : 'N/A']);
    costBody.push(['Final Order Cost', finalOrderCost.toFixed(2) + ' EGP', '100%']);

    autoTable(doc, {
      startY: afterMaterials + 4,
      head: [['Item', 'Contribution', 'Contribution %']],
      body: costBody,
    });

    let y = (doc as any).lastAutoTable.finalY + 16;

    const pie1Slices = formulaRows.map(function (r) { return { label: r.name, value: r.qty }; });
    if (waterNum > 0) pie1Slices.push({ label: 'Water', value: waterNum });
    const pie1Total = pie1Slices.reduce(function (s, x) { return s + x.value; }, 0);
    const pie1Img = drawPieOnly(pie1Slices);

    const materialsCostSum = formulaRows.reduce(function (s, r) { return s + (r.hasUnpriced ? 0 : r.cost); }, 0);
    const pie2Slices = [
      { label: 'Materials', value: materialsCostSum },
      { label: 'Packaging', value: packagingTotal || 0 },
      { label: 'Sticker', value: stickerTotal || 0 },
    ].filter(function (s) { return s.value > 0; });
    const pie2Total = pie2Slices.reduce(function (s, x) { return s + x.value; }, 0);
    const pie2Img = drawPieOnly(pie2Slices);

    if (y > 150) { doc.addPage(); y = 20; }

    if (pie1Img) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Formula Composition', 105, y, { align: 'center' });
      doc.addImage(pie1Img, 'PNG', 75, y + 4, 60, 60);
      y = y + 68;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      pie1Slices.forEach(function (slice, i) {
        const pct = ((slice.value / pie1Total) * 100).toFixed(1);
        doc.setFillColor(PIE_COLORS[i % PIE_COLORS.length]);
        doc.rect(80, y - 3, 4, 4, 'F');
        doc.text(slice.label + ': ' + slice.value + ' (' + pct + '%)', 87, y);
        y += 6;
      });
      y += 10;
    }

    if (y > 230) { doc.addPage(); y = 20; }

    if (pie2Img) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Cost Breakdown', 105, y, { align: 'center' });
      doc.addImage(pie2Img, 'PNG', 75, y + 4, 60, 60);
      y = y + 68;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      pie2Slices.forEach(function (slice, i) {
        const pct = ((slice.value / pie2Total) * 100).toFixed(1);
        doc.setFillColor(PIE_COLORS[i % PIE_COLORS.length]);
        doc.rect(80, y - 3, 4, 4, 'F');
        doc.text(slice.label + ': ' + slice.value.toFixed(2) + ' EGP (' + pct + '%)', 87, y);
        y += 6;
      });
      y += 14;
    }

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Signature: _______________________', 20, y);
    doc.text('Date: _______________________', 130, y);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('Page ' + i + ' of ' + pageCount + '  |  ' + companyNameForFooter, 105, 290, { align: 'center' });
    }

    doc.save(selectedJob.name + '-report.pdf');
  };
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '10px 32px', borderBottom: '1px solid ' + c.border, alignItems: 'center' }}>
          {jobs.map(function (job) {
            const active = selectedJobId === job.id;
            const closed = job.status === 'closed';
            return (
              <button key={job.id} onClick={function () { selectJob(job.id); }}
                style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid ' + c.border, background: active ? c.text : c.cardBg, color: active ? c.pageBg : (closed ? c.subtext : c.text), cursor: 'pointer', opacity: closed ? 0.7 : 1 }}>
                {job.name}{closed ? ' (closed)' : ''}
              </button>
            );
          })}
          <button onClick={function () { setShowCreate(true); }}
            style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid ' + c.border, background: c.cardBg, color: c.text, cursor: 'pointer' }}>
            + New Order
          </button>
        </div>

        <div style={{ padding: '20px 32px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: c.text, marginBottom: '20px' }}>Orders</h1>

          {!selectedJob && <p style={{ color: c.subtext }}>No orders yet. Create one to get started.</p>}

          {selectedJob && (
            <div>
              <div style={{ background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: c.text }}>{selectedJob.name}</div>
                    <div style={{ fontSize: '13px', color: c.subtext, marginTop: '4px' }}>
                      Status: {selectedJob.status}
                      {selectedJob.start_date ? ' | Start: ' + selectedJob.start_date : ''}
                      {selectedJob.due_date ? ' | Due: ' + selectedJob.due_date : ''}
                    </div>
                  </div>
                  {selectedJob.status === 'open' ? (
                    <button onClick={function () { closeJob(selectedJob.id); }}
                      style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer' }}>
                      Close Order
                    </button>
                  ) : (
                    <button onClick={function () { reopenJob(selectedJob.id); }}
                      style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '6px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer' }}>
                      Reopen Order
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Formula</div>
                  <input placeholder="Product name" value={productName} onChange={function (e) { setProductName(e.target.value); }} onBlur={saveProductName}
                    style={{ padding: '5px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, width: '160px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '13px', color: c.subtext }}>Batch size (auto): <b style={{ color: c.text }}>{batchSize.toLocaleString()}</b></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '13px', color: c.subtext }}>Water</label>
                    <input type="number" value={water} onChange={function (e) { setWater(e.target.value); }} onBlur={saveWater}
                      style={{ width: '100px', padding: '6px 8px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
                  </div>
                </div>
              </div>

              <div style={{ background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', overflow: 'hidden' }}>
                {formulaRows.length === 0 && waterNum === 0 && <div style={{ padding: '16px', fontSize: '13px', color: c.subtext }}>No materials removed for this order yet.</div>}
                {formulaRows.map(function (row, i) {
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: i > 0 ? '1px solid ' + c.border : 'none', fontSize: '13px' }}>
                      <span style={{ color: c.text }}>{row.name}</span>
                      <span style={{ color: c.subtext }}>{row.qty} {row.unit}</span>
                      <span style={{ color: c.text, minWidth: '100px', textAlign: 'right' }}>
                        {row.hasUnpriced ? 'partial (N/A)' : row.cost.toLocaleString() + ' EGP'}
                      </span>
                    </div>
                  );
                })}
                {waterNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid ' + c.border, fontSize: '13px' }}>
                    <span style={{ color: c.text }}>Water</span>
                    <span style={{ color: c.subtext }}>{waterNum}</span>
                    <span style={{ color: c.subtext, minWidth: '100px', textAlign: 'right' }}>N/A</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '14px', fontSize: '15px', fontWeight: 700, color: c.text }}>
                Materials cost: {totalCost.toLocaleString()} EGP{hasUnpriced ? ' (some materials unpriced)' : ''}
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600, color: c.subtext, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '28px', marginBottom: '10px' }}>
                Packaging &amp; Finishing
              </div>
              <div style={{ background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', padding: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '12px', color: c.subtext, display: 'block' }}>Packaging size</label>
                  <input type="number" value={pkgSize} onChange={function (e) { setPkgSize(e.target.value); }} onBlur={savePackaging}
                    style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, width: '110px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: c.subtext, display: 'block' }}>Unit</label>
                  <select value={pkgUnit} onChange={function (e) { setPkgUnit(e.target.value); savePackaging(); }}
                    style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }}>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: c.subtext, display: 'block' }}>Packaging price</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={pkgPrice} onChange={function (e) { setPkgPrice(e.target.value); }} onBlur={savePackaging}
                      style={{ padding: '7px 40px 7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, width: '130px' }} />
                    <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '12px', color: c.subtext }}>EGP</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: c.subtext, display: 'block' }}>Sticker price</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={stickerPrice} onChange={function (e) { setStickerPrice(e.target.value); }} onBlur={savePackaging}
                      style={{ padding: '7px 40px 7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, width: '130px' }} />
                    <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '12px', color: c.subtext }}>EGP</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: c.subtext, display: 'block' }}>Finish date</label>
                  <input type="date" value={finishDate} onChange={function (e) { setFinishDate(e.target.value); }} onBlur={saveFinishDate}
                    style={{ padding: '7px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
                </div>
              </div>

              {packagingQty != null && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: c.subtext }}>
                  Packages needed: {packagingQty.toFixed(2)} &nbsp;|&nbsp;
                  Packaging total: {packagingTotal != null ? packagingTotal.toLocaleString() + ' EGP' : 'N/A'} &nbsp;|&nbsp;
                  Sticker total: {stickerTotal != null ? stickerTotal.toLocaleString() + ' EGP' : 'N/A'}
                </div>
              )}

              <div style={{ marginTop: '16px', fontSize: '17px', fontWeight: 700, color: c.text }}>
                Final order cost: {finalOrderCost.toLocaleString()} EGP
              </div>

              <button onClick={downloadReport} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Download Report (PDF)
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: c.cardBg, color: c.text, padding: '20px', borderRadius: '10px', maxWidth: '320px', width: '100%' }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>New Order</div>
            <input placeholder="Order name" value={newName} onChange={function (e) { setNewName(e.target.value); }}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
            <label style={{ fontSize: '12px', color: c.subtext }}>Start date</label>
            <input type="date" value={newStart} onChange={function (e) { setNewStart(e.target.value); }}
              style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
            <label style={{ fontSize: '12px', color: c.subtext }}>Due date</label>
            <input type="date" value={newDue} onChange={function (e) { setNewDue(e.target.value); }}
              style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={function () { setShowCreate(false); }} style={{ padding: '7px 14px', fontSize: '13px', background: 'transparent', border: '1px solid ' + c.border, color: c.text, borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createJob} style={{ padding: '7px 14px', fontSize: '13px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}