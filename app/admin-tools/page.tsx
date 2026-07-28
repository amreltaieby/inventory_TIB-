'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../lib/ThemeContext';
import { getColors } from '../../lib/theme';

export default function AdminToolsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [exportTable, setExportTable] = useState('items');
  const { theme } = useTheme();
  const c = getColors(theme);

  useEffect(function () {
    checkAccess();
  }, []);

  const checkAccess = async function () {
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const profileResult = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single();
    const data = profileResult.data;
    if (!data || data.role !== 'admin') {
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
    setCompanyId(data.company_id);
    fetchEmployees();
  };

  const fetchEmployees = async function () {
    const result = await supabase.from('profiles').select('*').eq('active', true).order('created_at', { ascending: false });
    setEmployees(result.data || []);
  };

  const createEmployee = async function () {
    if (!newEmail || !newPassword || !newFullName) {
      setCreateError('Email, password, and name are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const sessionResult = await supabase.auth.getSession();
    const token = sessionResult.data.session ? sessionResult.data.session.access_token : '';
    const res = await fetch('/api/admin/create-employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ email: newEmail, password: newPassword, fullName: newFullName }),
    });
    const result = await res.json();
    setCreating(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setNewEmail('');
    setNewPassword('');
    setNewFullName('');
    fetchEmployees();
  };

  const removeEmployee = async function (id: string, name: string) {
    const confirmed = confirm('Remove ' + name + '? If they have transaction history, they will be deactivated instead of deleted.');
    if (!confirmed) return;
    const sessionResult = await supabase.auth.getSession();
    const token = sessionResult.data.session ? sessionResult.data.session.access_token : '';
    const res = await fetch('/api/admin/remove-employee', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ userId: id }),
    });
    const result = await res.json();
    if (result.error) {
      alert('Failed: ' + result.error);
      return;
    }
    fetchEmployees();
  };

  const toCSV = function (rows: any[]) {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    rows.forEach(function (row) {
      const line = headers.map(function (h) {
        const val = row[h] === null || row[h] === undefined ? '' : row[h];
        return '"' + String(val).replace(/"/g, '""') + '"';
      }).join(',');
      lines.push(line);
    });
    return lines.join('\n');
  };

  const handleExport = async function () {
    const result = await supabase.from(exportTable).select('*');
    const data = result.data;
    if (!data || data.length === 0) {
      alert('No data to export.');
      return;
    }
    const csv = toCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportTable + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  if (authorized === null) {
    return null;
  }

  if (authorized === false) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, padding: '40px', color: c.text }}>Admin access only.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, background: c.pageBg, minHeight: '100vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: c.text, marginBottom: '28px' }}>Admin Tools</h1>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Add Employee</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input placeholder="Email" value={newEmail} onChange={function (e) { setNewEmail(e.target.value); }}
                style={{ flex: 1, minWidth: '160px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
              <input placeholder="Temporary password" value={newPassword} onChange={function (e) { setNewPassword(e.target.value); }}
                style={{ flex: 1, minWidth: '160px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
              <input placeholder="Full name" value={newFullName} onChange={function (e) { setNewFullName(e.target.value); }}
                style={{ flex: 1, minWidth: '160px', padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }} />
            </div>
            <button onClick={createEmployee} disabled={creating}
              style={{ marginTop: '10px', padding: '9px 18px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {creating ? 'Creating...' : 'Create Employee'}
            </button>
            {createError && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{createError}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: c.text }}>Employees ({employees.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {employees.map(function (emp) {
                return (
                  <div key={emp.id} style={{ background: c.cardBg, border: '1px solid ' + c.border, borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: c.text }}>
                        {emp.full_name || emp.username || 'Unnamed'} {emp.role === 'admin' ? '(Admin)' : ''}
                      </div>
                      <div style={{ fontSize: '12px', color: c.subtext }}>{emp.email}</div>
                      <div style={{ fontSize: '12px', color: c.subtext }}>
                        Created: {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '—'}
                      </div>
                    </div>
                    {emp.role !== 'admin' && (
                      <button onClick={function () { removeEmployee(emp.id, emp.full_name || emp.email); }}
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid ' + c.border, background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: c.cardBg, borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ marginTop: 0, color: c.text }}>Export Data to CSV</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={exportTable} onChange={function (e) { setExportTable(e.target.value); }}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid ' + c.inputBorder, background: c.inputBg, color: c.text }}>
                <option value="transactions">Transaction History</option>
                <option value="items">Items</option>
                <option value="profiles">Profiles</option>
              </select>
              <button onClick={handleExport} style={{ padding: '8px 16px', borderRadius: '6px', background: '#0f172a', color: 'white', border: 'none', cursor: 'pointer' }}>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}