import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';

const avatarColors = ['#1a56db','#7c3aed','#0d9488','#b45309','#dc2626','#15803d'];

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe',    color: '#5f259f', emoji: '💜' },
  { id: 'gpay',    label: 'Google Pay', color: '#1a73e8', emoji: '💙' },
  { id: 'paytm',   label: 'Paytm',     color: '#002970', emoji: '🔵' },
  { id: 'upi',     label: 'Any UPI',   color: '#ff6b00', emoji: '💳' },
];

const DEFAULT_PERMISSIONS = {
  Warden:   ['dashboard','rooms','students','access','feedback'],
  Cook:     ['dashboard','food'],
  Security: ['dashboard','access'],
  Cleaner:  ['dashboard'],
  Manager:  ['dashboard','rooms','students','food','access','feedback'],
  Other:    ['dashboard'],
};

const ALL_PAGES = [
  { key: 'dashboard', label: '⌂ Dashboard' },
  { key: 'rooms',     label: '⬜ Rooms' },
  { key: 'students',  label: '👤 Tenants' },
  { key: 'food',      label: '🍽 Food' },
  { key: 'access',    label: '🔐 Access' },
  { key: 'feedback',  label: '💬 Feedback' },
];

// ── Permissions Modal ─────────────────────────────────────────────────
const PermissionsModal = ({ staffMember, onClose, onSave }) => {
  const defaultPerms = DEFAULT_PERMISSIONS[staffMember.role] || ['dashboard'];
  const currentPerms = (() => {
    if (staffMember.permissions) {
      try { return JSON.parse(staffMember.permissions); } catch {}
    }
    return defaultPerms;
  })();

  const [perms, setPerms] = useState(currentPerms);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  };

  const resetToDefault = () => setPerms(defaultPerms);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/staff/${staffMember.id}/permissions`, { permissions: perms });
      onSave();
      onClose();
    } catch { alert('Failed to save permissions'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#7c3aed' }}>
            {staffMember.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{staffMember.name}</h2>
            <p className="text-xs text-gray-400">{staffMember.role} — Page Access Control</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 mt-3">
          <p className="text-xs text-blue-600">
            Default for <strong>{staffMember.role}</strong>: {defaultPerms.join(', ')}
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {ALL_PAGES.map(page => {
            const isDefault = defaultPerms.includes(page.key);
            const isChecked = perms.includes(page.key);
            return (
              <label key={page.key}
                className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition"
                style={isChecked
                  ? { backgroundColor: '#eff6ff', borderColor: '#1a56db' }
                  : { backgroundColor: '#f9f8f6', borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={isChecked} onChange={() => toggle(page.key)}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm text-gray-700">{page.label}</span>
                </div>
                {isDefault && <span className="text-xs text-blue-500 font-medium">default</span>}
              </label>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={resetToDefault}
            className="text-xs text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
            Reset Default
          </button>
          <button onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pay Salary Modal ──────────────────────────────────────────────────
const PaySalaryModal = ({ data, onClose, onMarkPaid }) => {
  const [txnRef, setTxnRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { staffMember } = data;
  const upi = staffMember.upiId || (staffMember.upiPhone ? staffMember.upiPhone + '@ybl' : null);
  const amount = staffMember.monthlySalary;
  const app = staffMember.paymentMethod || 'upi';
  const appInfo = UPI_APPS.find(a => a.id === app) || UPI_APPS[3];

  const handleConfirm = async () => {
    setPaying(true);
    try { await onMarkPaid(staffMember.id, txnRef); }
    finally { setPaying(false); }
  };

  const copyUPI = () => {
    navigator.clipboard.writeText(upi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">💳</div>
          <h2 className="text-lg font-bold text-gray-900">Pay Salary</h2>
          <p className="text-xs text-gray-400 mt-1">{staffMember.name} — {staffMember.role}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Amount</span>
            <span className="text-xl font-bold font-mono text-gray-900">₹{amount.toLocaleString()}</span>
          </div>
          {staffMember.upiPhone && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">Phone</span>
              <span className="text-sm font-mono text-gray-800">{staffMember.upiPhone}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Pay via</span>
            <span className="text-sm font-semibold" style={{ color: appInfo.color }}>{appInfo.emoji} {appInfo.label}</span>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 font-medium">UPI ID to pay</div>
            <div className="text-sm font-mono text-gray-800 mt-0.5">{upi}</div>
          </div>
          <button onClick={copyUPI} className="text-xs text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0 ml-2"
            style={{ backgroundColor: copied ? '#22c55e' : '#1a56db' }}>
            {copied ? '✔ Copied!' : '📋 Copy'}
          </button>
        </div>
        {upi && (
          <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 font-medium mb-3">Scan to pay with any UPI app</p>
            <QRCodeSVG value={`upi://pay?pa=${upi}&pn=${encodeURIComponent(staffMember.name)}&am=${amount}&tn=Salary`}
              size={160} bgColor="#ffffff" fgColor="#0f1117" level="M" />
            <p className="text-xs text-gray-400 mt-2">Open PhonePe / GPay / Paytm → Scan QR</p>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-700 font-medium">💡 How to pay:</p>
          <p className="text-xs text-amber-600 mt-1">1. Open PhonePe / GPay / Paytm on your phone</p>
          <p className="text-xs text-amber-600">2. Send ₹{amount.toLocaleString()} to <strong>{upi}</strong></p>
          <p className="text-xs text-amber-600">3. Enter the transaction reference below</p>
        </div>
        <label className="text-xs text-gray-500 font-medium">Transaction Reference (optional)</label>
        <input placeholder="e.g. T2506091234567" value={txnRef} onChange={e => setTxnRef(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 mb-4 outline-none focus:border-blue-500" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} disabled={paying}
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#22c55e' }}>
            {paying ? 'Saving...' : '✅ Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Salary Calendar Modal ─────────────────────────────────────────────
const SalaryCalendarModal = ({ staffList, onClose }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(year, i, 1).toLocaleString('en-IN', { month: 'short' })
  );
  const paidMap = {};
  staffList.forEach(s => {
    if (s.salaryStatus === 'PAID' && s.salaryPaidDate) {
      const d = new Date(s.salaryPaidDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!paidMap[s.id]) paidMap[s.id] = new Set();
      paidMap[s.id].add(key);
    }
  });
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">💰 Salary Calendar</h2>
            <p className="text-xs text-gray-400 mt-0.5">Monthly payment history</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm">‹</button>
            <span className="text-sm font-bold text-gray-800">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 text-sm">›</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">×</button>
          </div>
        </div>
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-green-100 border border-green-300" /><span className="text-xs text-gray-500">Paid</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-50 border border-red-200" /><span className="text-xs text-gray-500">Unpaid</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" /><span className="text-xs text-gray-500">Future</span></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full" style={{ minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9f8f6' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 sticky left-0 bg-gray-50 min-w-36">Staff</th>
                {months.map((m, idx) => (
                  <th key={m} className="text-center px-2 py-3 text-xs font-semibold border-b border-gray-100 min-w-14"
                    style={{ color: idx === now.getMonth() && year === now.getFullYear() ? '#1a56db' : '#6b7280', backgroundColor: idx === now.getMonth() && year === now.getFullYear() ? '#eff6ff' : '#f9f8f6' }}>
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map((s, si) => (
                <tr key={s.id} className="hover:bg-gray-50 border-b border-gray-50">
                  <td className="px-4 py-3 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: avatarColors[si % avatarColors.length] }}>
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-800">{s.name}</div>
                        <div className="text-xs text-gray-400 font-mono">₹{s.monthlySalary.toLocaleString()}/mo</div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: 12 }, (_, monthIdx) => {
                    const isFuture = year > now.getFullYear() || (year === now.getFullYear() && monthIdx > now.getMonth());
                    const isPaid = paidMap[s.id]?.has(`${year}-${monthIdx}`);
                    const isCurrent = year === now.getFullYear() && monthIdx === now.getMonth();
                    return (
                      <td key={monthIdx} className="px-2 py-3 text-center">
                        {isFuture ? (
                          <div className="w-8 h-8 rounded-lg mx-auto bg-gray-100 border border-gray-200" />
                        ) : isPaid ? (
                          <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-green-100 border border-green-300">
                            <span className="text-green-600 text-sm">✔</span>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center bg-red-50 border border-red-200"
                            style={isCurrent ? { borderColor: '#ef4444', backgroundColor: '#fee2e2' } : {}}>
                            <span className="text-red-400 text-xs">✘</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xs text-green-600 font-semibold mb-1">Paid</div>
            <div className="text-2xl font-bold text-green-700 font-mono">{staffList.filter(s => s.salaryStatus === 'PAID').length}</div>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <div className="text-xs text-red-600 font-semibold mb-1">Pending</div>
            <div className="text-2xl font-bold text-red-700 font-mono">{staffList.filter(s => s.salaryStatus === 'UNPAID').length}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-xs text-blue-600 font-semibold mb-1">Total Payroll</div>
            <div className="text-xl font-bold text-blue-700 font-mono">₹{staffList.reduce((a, s) => a + s.monthlySalary, 0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Staff Tooltip ─────────────────────────────────────────────────────
const StaffTooltip = ({ staff, x, y }) => {
  const above = window.innerHeight - y < 240;
  return ReactDOM.createPortal(
    <div className="pointer-events-none" style={{ position: 'fixed', left: x + 16, top: above ? y - 240 : y + 12, zIndex: 99999, minWidth: '220px' }}>
      <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '12px 14px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '11px', fontWeight: 'bold' }}>
            {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>{staff.name}</div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>{staff.role}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #1f2937', marginBottom: '8px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[['📧','Email', staff.email], ['📱','Phone', staff.phone], ['💰','Salary', staff.monthlySalary ? `₹${Number(staff.monthlySalary).toLocaleString()}/mo` : null]].map(([icon, label, value]) => value ? (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px' }}>{icon}</span>
              <span style={{ color: '#6b7280', fontSize: '11px', width: '42px', flexShrink: 0 }}>{label}</span>
              <span style={{ color: '#d1d5db', fontSize: '11px' }}>{value}</span>
            </div>
          ) : null)}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px' }}>💳</span>
            <span style={{ color: '#6b7280', fontSize: '11px', width: '42px', flexShrink: 0 }}>Status</span>
            <span style={{ fontSize: '11px', fontWeight: '600', color: staff.salaryStatus === 'PAID' ? '#4ade80' : '#f87171' }}>
              {staff.salaryStatus === 'PAID' ? '✔ Paid' : '⚠ Unpaid'}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Invite Link Modal ─────────────────────────────────────────────────
const InviteLinkModal = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(data.inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-lg font-bold text-gray-900">Login Approved!</h2>
          <p className="text-xs text-gray-400 mt-1">Share this invite link with the staff member</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
          <div className="text-xs text-gray-500 font-medium mb-1">Invite Link</div>
          <div className="text-xs text-blue-600 break-all font-mono">{data.inviteLink}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-700 font-semibold mb-1">⚠ Also share the Hostel Code</p>
          <p className="text-xs text-amber-600">The staff member will need both this link AND the hostel code to set their password.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={copy} className="flex-1 border border-blue-300 text-blue-600 bg-blue-50 rounded-lg py-2 text-sm font-medium hover:bg-blue-100">
            {copied ? '✔ Copied!' : '📋 Copy Link'}
          </button>
          <button onClick={onClose} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>Done</button>
        </div>
      </div>
    </div>
  );
};

// ── Mobile Staff Card ─────────────────────────────────────────────────
const StaffCard = ({ s, i, checked, onCheck, onEdit, onPermissions, onApprove, onDisapprove, onMarkPaid, onPayUPI, onDelete }) => {
  const isApproved = !!s.userId;
  const hasUPI = !!(s.upiId || s.upiPhone);
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${checked ? 'border-blue-500' : s.salaryStatus === 'PAID' ? 'border-green-400' : 'border-red-400'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={checked} onChange={() => onCheck(s.id)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer mt-1" />
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
            {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{s.name}</div>
            <div className="text-xs text-gray-400">{s.role}</div>
            {hasUPI && <div className="text-xs text-green-600">💳 UPI ready</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold font-mono text-gray-800">₹{s.monthlySalary.toLocaleString()}</div>
          <div className="text-xs text-gray-400">/month</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {s.email && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg truncate max-w-40">{s.email}</span>}
        {s.phone && <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">{s.phone}</span>}
      </div>

      <div className="flex gap-2 mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.salaryStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {s.salaryStatus === 'PAID' ? '✔ Paid' : '⚠ Unpaid'}
        </span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isApproved ? '✔ Approved' : '— Pending'}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap border-t border-gray-100 pt-3">
        {s.salaryStatus === 'UNPAID' && hasUPI && (
          <button onClick={() => onPayUPI(s)} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#7c3aed' }}>💳 Pay</button>
        )}
        {s.salaryStatus === 'UNPAID' && !hasUPI && (
          <button onClick={() => onMarkPaid(s.id, '')} className="text-xs font-medium text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg">Mark Paid</button>
        )}
        <button onClick={() => onEdit(s)} className="text-xs font-medium text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg">Edit</button>
        <button onClick={() => onPermissions(s)} className="text-xs font-medium text-purple-600 border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-lg">Perms</button>
        {isApproved
          ? <button onClick={() => onDisapprove(s)} className="text-xs font-medium text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg">Disapprove</button>
          : <button onClick={() => onApprove(s)} className="text-xs font-medium text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg">Approve</button>
        }
        <button onClick={() => onDelete(s.id)} className="text-xs font-medium text-red-400 border border-red-100 bg-red-50 px-3 py-1.5 rounded-lg">Delete</button>
      </div>
    </div>
  );
};

// ── Desktop Staff Row ─────────────────────────────────────────────────
const StaffRow = ({ s, i, checked, onCheck, onEdit, onPermissions, onApprove, onDisapprove, onMarkPaid, onPayUPI, onDelete }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const isApproved = !!s.userId;
  const hasUPI = !!(s.upiId || s.upiPhone);

  return (
    <>
      <tr className={`border-b border-gray-50 cursor-default ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
        onMouseMove={e => setTooltip({ visible: true, x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}>
        <td className="px-4 py-3">
          <input type="checkbox" checked={checked} onChange={() => onCheck(s.id)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              {hasUPI && <div className="text-xs text-green-600">💳 UPI ready</div>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{s.email || '—'}</td>
        <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{s.role}</span></td>
        <td className="px-4 py-3 text-sm text-gray-600">{s.phone || '—'}</td>
        <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-800">₹{s.monthlySalary.toLocaleString()}</td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.salaryStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {s.salaryStatus === 'PAID' ? `✔ Paid ${s.salaryPaidDate ? new Date(s.salaryPaidDate).toLocaleDateString('en-IN') : ''}` : '⚠ Unpaid'}
          </span>
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {isApproved ? '✔ Approved' : '— Pending'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {s.salaryStatus === 'UNPAID' && hasUPI && (
              <button onClick={() => onPayUPI(s)} className="text-xs font-semibold px-2 py-1 rounded-lg text-white" style={{ backgroundColor: '#7c3aed' }}>💳 Pay</button>
            )}
            {s.salaryStatus === 'UNPAID' && !hasUPI && (
              <button onClick={() => onMarkPaid(s.id, '')} className="text-xs font-medium text-green-600 hover:text-green-800">Mark Paid</button>
            )}
            <button onClick={() => onEdit(s)} className="text-xs font-medium text-blue-600 hover:text-blue-800">Edit</button>
            <button onClick={() => onPermissions(s)} className="text-xs font-medium text-purple-600 hover:text-purple-800">Perms</button>
            {isApproved
              ? <button onClick={() => onDisapprove(s)} className="text-xs font-medium text-red-500 hover:text-red-700">Disapprove</button>
              : <button onClick={() => onApprove(s)} className="text-xs font-medium text-green-600 hover:text-green-800">Approve</button>
            }
            <button onClick={() => onDelete(s.id)} className="text-xs font-medium text-red-400 hover:text-red-600">Delete</button>
          </div>
        </td>
      </tr>
      {tooltip.visible && <StaffTooltip staff={s} x={tooltip.x} y={tooltip.y} />}
    </>
  );
};

// ── Staff Modal ───────────────────────────────────────────────────────
const StaffModal = ({ form, setForm, onSave, onClose, title }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <label className="text-xs text-gray-500 font-medium">Full Name *</label>
      <input autoFocus placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
      <label className="text-xs text-gray-500 font-medium">Email *</label>
      <input type="email" placeholder="staff@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
      <label className="text-xs text-gray-500 font-medium">Role *</label>
      <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="">Select Role</option>
        {['Warden','Cook','Security','Cleaner','Manager','Other'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      <label className="text-xs text-gray-500 font-medium">Phone</label>
      <input placeholder="9876543210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
      <label className="text-xs text-gray-500 font-medium">Monthly Salary (₹) *</label>
      <input type="number" placeholder="e.g. 15000" value={form.monthlySalary} onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500" />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
      </div>
    </div>
  </div>
);

// ── Bulk Upload Modal ─────────────────────────────────────────────────
const BulkUploadModal = ({ onClose, onSuccess }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);
  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([['name','email','role','phone','monthlySalary'],['Ravi Kumar','ravi@hostel.com','Cook','9876543210','15000'],['Sunita Devi','sunita@hostel.com','Cleaner','9123456789','10000']]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Staff'); XLSX.writeFile(wb, 'sample_staff.xlsx');
  };
  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const wb = XLSX.read(ev.target.result, { type: 'binary' }); setPreview(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })); };
    reader.readAsBinaryString(file);
  };
  const handleUpload = async () => {
    setUploading(true); let count = 0;
    for (const row of preview) {
      try { await api.post('/staff', { name: row.name, email: row.email || '', role: row.role, phone: String(row.phone || ''), monthlySalary: Number(row.monthlySalary) || 0 }); count++; setDone(count); } catch {}
    }
    setUploading(false); alert(`✅ ${count} of ${preview.length} staff added!`); onSuccess(); onClose();
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Bulk Upload Staff</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-700 mb-2">Upload an Excel file with staff details.</p>
          <button onClick={downloadSample} className="text-xs font-semibold text-blue-600 underline">⬇ Download Sample Excel</button>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 cursor-pointer hover:border-blue-400 transition" onClick={() => fileRef.current.click()}>
          <div className="text-3xl mb-2">📂</div>
          <p className="text-sm text-gray-500">Click to select your Excel file (.xlsx)</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        </div>
        {preview.length > 0 && (
          <>
            <div className="text-xs text-gray-500 font-semibold mb-2">{preview.length} rows found — preview:</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
              <table className="w-full text-xs">
                <thead><tr className="bg-gray-50">{Object.keys(preview[0]).map(k => <th key={k} className="px-3 py-2 text-left font-semibold text-gray-500 border-b border-gray-100">{k}</th>)}</tr></thead>
                <tbody>{preview.slice(0,5).map((row,i) => <tr key={i} className="border-b border-gray-50">{Object.values(row).map((v,j) => <td key={j} className="px-3 py-2 text-gray-700">{String(v)}</td>)}</tr>)}</tbody>
              </table>
              {preview.length > 5 && <p className="text-xs text-gray-400 px-3 py-2">...and {preview.length - 5} more rows</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleUpload} disabled={uploading} className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60" style={{ backgroundColor: '#1a56db' }}>
                {uploading ? `Uploading... ${done}/${preview.length}` : `Upload ${preview.length} Staff`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Staff Component ──────────────────────────────────────────────
export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const emptyForm = { name: '', email: '', role: '', phone: '', monthlySalary: '' };
  const [form, setForm] = useState(emptyForm);

  const fetchStaff = () => {
    setLoading(true);
    api.get('/staff').then(r => setStaff(r.data)).catch(() => setError('Failed to load staff')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.role || !form.monthlySalary) { alert('Name, email, role and salary are required'); return; }
    try { await api.post('/staff', form); setShowModal(false); setForm(emptyForm); fetchStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to add staff'); }
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({ name: s.name, email: s.email || '', role: s.role, phone: s.phone || '', monthlySalary: String(s.monthlySalary) });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!form.name || !form.email || !form.role || !form.monthlySalary) { alert('Name, email, role and salary are required'); return; }
    try { await api.put(`/staff/${editId}`, form); setShowEdit(false); setEditId(null); setForm(emptyForm); fetchStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update staff'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try { await api.delete(`/staff/${id}`); setSelected(s => { const n = new Set(s); n.delete(id); return n; }); fetchStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleMarkPaid = async (id, txnRef) => {
    try { await api.put(`/staff/${id}/salary`, { txnRef }); setPayModal(null); fetchStaff(); }
    catch { alert('Failed to update salary status'); }
  };

  const handleApprove = async (staffMember) => {
    if (!staffMember.email) { alert('No email found. Please edit and add an email first.'); return; }
    try { const res = await api.post(`/auth/approve/staff/${staffMember.id}`); setInviteData(res.data); fetchStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve login'); }
  };

  const handleDisapprove = async (staffMember) => {
    if (!window.confirm(`Disapprove login for ${staffMember.name}?`)) return;
    try { await api.post(`/auth/disapprove/staff/${staffMember.id}`); fetchStaff(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to disapprove'); }
  };

  const sorted = [...staff].sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  const allChecked = sorted.length > 0 && sorted.every(s => selected.has(s.id));
  const someChecked = sorted.some(s => selected.has(s.id));
  const toggleAll = () => { if (allChecked) setSelected(new Set()); else setSelected(new Set(sorted.map(s => s.id))); };
  const toggleOne = (id) => { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const downloadSelected = () => {
    const rows = sorted.filter(s => selected.has(s.id)).map(s => ({
      Name: s.name, Email: s.email || '', Role: s.role, Phone: s.phone || '',
      'Monthly Salary': s.monthlySalary, 'Salary Status': s.salaryStatus,
      'UPI ID': s.upiId || '', 'UPI Phone': s.upiPhone || '',
      'Salary Paid Date': s.salaryPaidDate ? new Date(s.salaryPaidDate).toLocaleDateString('en-IN') : '',
      'Login Approved': s.userId ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');
    XLSX.writeFile(wb, `staff_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const totalSalary = staff.reduce((acc, s) => acc + s.monthlySalary, 0);
  const unpaidCount = staff.filter(s => s.salaryStatus === 'UNPAID').length;
  const upiReadyCount = staff.filter(s => s.upiId || s.upiPhone).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading staff...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Staff</span>
        <div className="flex gap-1.5 md:gap-2 items-center">
          {selected.size > 0 && (
            <button onClick={downloadSelected}
              className="text-xs md:text-sm px-2 md:px-4 py-1.5 rounded-lg font-medium border border-green-300 text-green-700 bg-green-50">
              ⬇ {selected.size}
            </button>
          )}
          <button onClick={() => setShowCalendar(true)}
            className="text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg font-medium border border-purple-300 text-purple-700 bg-purple-50">
            📅 <span className="hidden md:inline">Salary </span>Cal
          </button>
          <button onClick={() => setShowBulk(true)}
            className="text-xs md:text-sm px-2 md:px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600">
            📂 <span className="hidden md:inline">Bulk </span>Upload
          </button>
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }}
            className="text-white text-xs md:text-sm px-3 md:px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
            + Add
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        {staff.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border-t-4 border-blue-500">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Total Staff</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{staff.length}</div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border-t-4 border-purple-500">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Payroll</div>
              <div className="text-xl md:text-3xl font-bold text-gray-900 font-mono">₹{(totalSalary/1000).toFixed(0)}k</div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border-t-4 border-red-500">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Salary Pending</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{unpaidCount}</div>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border-t-4 border-green-500">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">UPI Ready</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{upiReadyCount}</div>
              <div className="text-xs text-gray-400 mt-1">of {staff.length}</div>
            </div>
          </div>
        )}

        {staff.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">👨‍💼</div>
            <h3 className="font-semibold text-gray-700 mb-1">No staff yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add your first staff member to get started</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowBulk(true)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">📂 Bulk Upload</button>
              <button onClick={() => setShowModal(true)} className="text-white text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: '#1a56db' }}>+ Add Staff</button>
            </div>
          </div>
        ) : (
          <>
            {someChecked && (
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl mb-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-700">{selected.size} selected</span>
                <button onClick={() => setSelected(new Set())} className="text-xs text-blue-500 hover:underline">Clear</button>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="flex flex-col gap-3 md:hidden">
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                <span className="text-xs text-gray-500">Select all</span>
                <button onClick={() => setSortAsc(v => !v)} className="ml-auto text-xs text-gray-500 border border-gray-200 bg-white px-3 py-1.5 rounded-lg">
                  Sort {sortAsc ? 'A→Z ↓' : 'Z→A ↑'}
                </button>
              </div>
              {sorted.map((s, i) => (
                <StaffCard key={s.id} s={s} i={i}
                  checked={selected.has(s.id)} onCheck={toggleOne}
                  onEdit={openEdit}
                  onPermissions={s => setPermModal(s)}
                  onApprove={handleApprove} onDisapprove={handleDisapprove}
                  onMarkPaid={handleMarkPaid} onPayUPI={s => setPayModal({ staffMember: s })} onDelete={handleDelete} />
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
              {someChecked && (
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-700">{selected.size} staff selected</span>
                  <button onClick={() => setSelected(new Set())} className="text-xs text-blue-500 hover:underline">Clear</button>
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f6' }}>
                    <th className="px-4 py-3 border-b border-gray-100 w-10">
                      <input type="checkbox" checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 cursor-pointer select-none"
                      onClick={() => setSortAsc(v => !v)}>
                      <div className="flex items-center gap-1">Staff Member <span className="text-gray-400">{sortAsc ? '↓' : '↑'}</span></div>
                    </th>
                    {['Email','Role','Phone','Monthly Salary','Salary Status','Login','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s, i) => (
                    <StaffRow key={s.id} s={s} i={i}
                      checked={selected.has(s.id)} onCheck={toggleOne}
                      onEdit={openEdit}
                      onPermissions={s => setPermModal(s)}
                      onApprove={handleApprove} onDisapprove={handleDisapprove}
                      onMarkPaid={handleMarkPaid} onPayUPI={s => setPayModal({ staffMember: s })} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && <StaffModal form={form} setForm={setForm} title="Add Staff" onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {showEdit && <StaffModal form={form} setForm={setForm} title="Save Changes" onSave={handleEdit} onClose={() => { setShowEdit(false); setEditId(null); }} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onSuccess={fetchStaff} />}
      {showCalendar && <SalaryCalendarModal staffList={staff} onClose={() => setShowCalendar(false)} />}
      {payModal && <PaySalaryModal data={payModal} onClose={() => setPayModal(null)} onMarkPaid={handleMarkPaid} />}
      {inviteData && <InviteLinkModal data={inviteData} onClose={() => setInviteData(null)} />}
      {permModal && <PermissionsModal staffMember={permModal} onClose={() => setPermModal(null)} onSave={fetchStaff} />}
    </div>
  );
}