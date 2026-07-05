import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useReactToPrint } from 'react-to-print';

const COLUMNS = [
  { key: 'UNPAID',  label: 'Unpaid',  dot: '#ef4444', border: '#ef444433', tag: '#ef4444' },
  { key: 'PARTIAL', label: 'Partial', dot: '#f59e0b', border: '#f59e0b33', tag: '#f59e0b' },
  { key: 'PAID',    label: 'Paid',    dot: '#22c55e', border: '#22c55e33', tag: '#22c55e' },
];

function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + convert(n%100000) : '');
    return convert(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + convert(n%10000000) : '');
  };
  return convert(Math.floor(num));
}

// ── Cash Payment Modal ───────────────────────────────────────────────
const CashPaymentModal = ({ payment, onClose, onSuccess }) => {
  const gst = payment.gstAmount || 0;
  const tds = payment.tdsAmount || 0;
  const totalDue = payment.amount + gst - tds;
  const remaining = totalDue - payment.paidAmount;
  const [cashAmount, setCashAmount] = useState(String(remaining.toFixed(2)));
  const [cashDate, setCashDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const amt = parseFloat(cashAmount);
    if (!amt || amt <= 0) { alert('Enter a valid amount'); return; }
    setSaving(true);
    try {
      const newPaid = parseFloat((payment.paidAmount + amt).toFixed(2));
      const newStatus = newPaid >= totalDue ? 'PAID' : 'PARTIAL';
      await api.put(`/payments/${payment.id}`, {
        paidAmount: newPaid,
        status: newStatus,
        txnRef: `CASH-${cashDate.replace(/-/g,'')}${notes ? '-' + notes.slice(0,20) : ''}`,
        paidDate: cashDate,
      });
      alert(`✅ Cash payment of ₹${amt.toLocaleString()} recorded!\nStatus: ${newStatus}`);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="text-3xl mb-2">💵</div>
          <h2 className="text-lg font-bold text-gray-900">Record Cash Payment</h2>
          <p className="text-xs text-gray-400 mt-1">{payment.student?.name}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-500">Base Rent</span>
            <span className="text-xs font-mono text-gray-700">₹{payment.amount.toLocaleString()}</span>
          </div>
          {gst > 0 && <div className="flex justify-between mb-1"><span className="text-xs text-amber-600">+ GST</span><span className="text-xs font-mono text-amber-600">₹{gst.toLocaleString()}</span></div>}
          {tds > 0 && <div className="flex justify-between mb-1"><span className="text-xs text-red-500">− TDS</span><span className="text-xs font-mono text-red-500">₹{tds.toLocaleString()}</span></div>}
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
            <span className="text-xs font-semibold text-gray-700">Total Due</span>
            <span className="text-sm font-bold font-mono text-gray-900">₹{totalDue.toLocaleString()}</span>
          </div>
          {payment.paidAmount > 0 && <div className="flex justify-between mt-1"><span className="text-xs text-gray-500">Already Paid</span><span className="text-xs font-mono text-green-600">₹{payment.paidAmount.toLocaleString()}</span></div>}
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
            <span className="text-xs font-semibold text-red-600">Remaining</span>
            <span className="text-base font-bold font-mono text-red-600">₹{remaining.toLocaleString()}</span>
          </div>
        </div>
        <label className="text-xs text-gray-500 font-medium">Cash Amount Received (₹) *</label>
        <input autoFocus type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 mb-3 outline-none focus:border-green-500" />
        <label className="text-xs text-gray-500 font-medium">Date of Payment</label>
        <input type="date" value={cashDate} onChange={e => setCashDate(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 mb-3 outline-none focus:border-green-500" />
        <label className="text-xs text-gray-500 font-medium">Notes (optional)</label>
        <input placeholder="e.g. Hand delivered by guardian" value={notes} onChange={e => setNotes(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 mb-4 outline-none focus:border-green-500" />
        {parseFloat(cashAmount) > 0 && (
          <div className={`rounded-xl p-3 mb-4 text-xs font-medium ${parseFloat(cashAmount) >= remaining ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
            {parseFloat(cashAmount) >= remaining
              ? '✅ This will mark the payment as fully PAID'
              : `⚠ Partial — still remaining ₹${(remaining - parseFloat(cashAmount)).toLocaleString()}`}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#22c55e' }}>
            {saving ? 'Saving...' : '💵 Confirm Cash'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Receipt Component ────────────────────────────────────────────────
const ReceiptDoc = React.forwardRef(({ payment, org }, ref) => {
  const student = payment.student;
  const baseRent = payment.amount || 0;
  const gstAmt = payment.gstAmount || 0;
  const tdsAmt = payment.tdsAmount || 0;
  const totalDue = baseRent + gstAmt - tdsAmt;
  const paidAmt = payment.paidAmount || 0;
  const remaining = totalDue - paidAmt;
  const isFullyPaid = paidAmt >= totalDue;
  const isCash = payment.txnRef?.startsWith('CASH-');
  const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '720px', margin: 'auto', color: '#0f0f0f', backgroundColor: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '3px solid #1a56db' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a56db' }}>{org?.hostelName || 'HostelOS'}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{org?.address}{org?.city ? `, ${org.city}` : ''}</div>
          {org?.gstin && <div style={{ fontSize: '11px', color: '#374151', marginTop: '2px' }}>GSTIN: <strong>{org.gstin}</strong></div>}
          {org?.pan && <div style={{ fontSize: '11px', color: '#374151' }}>PAN: <strong>{org.pan}</strong></div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', color: '#111827' }}>RENT RECEIPT</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Receipt No: <strong>RCP-{String(payment.id).padStart(4,'0')}-{new Date().getFullYear()}</strong></div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Date: <strong>{payment.paidDate
            ? new Date(payment.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Period: <strong>{new Date(payment.dueDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong></div>
          {/* Payment status badge */}
          <div style={{ marginTop: '6px' }}>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
              backgroundColor: isFullyPaid ? '#dcfce7' : '#fef3c7',
              color: isFullyPaid ? '#15803d' : '#b45309',
            }}>
              {isFullyPaid ? '✔ FULLY PAID' : `⚠ PARTIAL — ₹${fmt(remaining)} PENDING`}
            </span>
          </div>
        </div>
      </div>

      {/* Tenant & Hostel Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Billed To (Tenant)</div>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{student?.name || '—'}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Phone: {student?.phone || '—'}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Room: <strong style={{ fontFamily: 'monospace' }}>{student?.bed?.room?.roomNumber || '—'}</strong> &nbsp; Bed: <strong style={{ fontFamily: 'monospace' }}>{student?.bed?.bedLabel || '—'}</strong></div>
        </div>
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Billed By (Hostel)</div>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>{org?.hostelName || '—'}</div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>{org?.address}{org?.city ? `, ${org.city}` : ''}</div>
          {org?.gstin && <div style={{ fontSize: '11px', color: '#6b7280' }}>GSTIN: {org.gstin}</div>}
        </div>
      </div>

      {/* Amounts Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1a56db', color: 'white' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px' }}>#</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>SAC</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px' }}>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: '12px' }}>1</td>
            <td style={{ padding: '9px 12px' }}>Rent / Accommodation Charges</td>
            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#9ca3af', fontSize: '11px' }}>997212</td>
            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(baseRent)}</td>
          </tr>
          {gstAmt > 0 && (
            <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fffbeb' }}>
              <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: '12px' }}>2</td>
              <td style={{ padding: '9px 12px', color: '#92400e' }}>+ GST (on Rent)</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', color: '#9ca3af', fontSize: '11px' }}>997212</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#92400e' }}>{fmt(gstAmt)}</td>
            </tr>
          )}
          {tdsAmt > 0 && (
            <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff1f2' }}>
              <td style={{ padding: '9px 12px', color: '#9ca3af', fontSize: '12px' }}>3</td>
              <td style={{ padding: '9px 12px', color: '#dc2626' }}>− TDS Deduction u/s 194I</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', color: '#9ca3af', fontSize: '11px' }}>—</td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>({fmt(tdsAmt)})</td>
            </tr>
          )}
          {/* Net Payable */}
          <tr style={{ backgroundColor: '#eff6ff' }}>
            <td colSpan={3} style={{ padding: '12px', fontWeight: 'bold', fontSize: '14px', color: '#1e3a8a' }}>Net Amount Payable</td>
            <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '17px', color: '#1a56db' }}>₹{fmt(totalDue)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount Paid */}
      <div style={{ backgroundColor: isFullyPaid ? '#f0fdf4' : '#fefce8', border: `1px solid ${isFullyPaid ? '#bbf7d0' : '#fde68a'}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: isFullyPaid ? '#15803d' : '#b45309' }}>
              {isFullyPaid ? '✔ Amount Received / Fully Paid' : '⚠ Amount Received (Partial Payment)'}
            </div>
            {isCash && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Mode: 💵 Cash</div>}
            {payment.txnRef && <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Ref: <strong style={{ fontFamily: 'monospace' }}>{payment.txnRef}</strong></div>}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: isFullyPaid ? '#15803d' : '#b45309' }}>₹{fmt(paidAmt)}</div>
        </div>
        {!isFullyPaid && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>Balance Remaining</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', color: '#dc2626' }}>₹{fmt(remaining)}</span>
          </div>
        )}
      </div>

      {/* Amount in Words */}
      <div style={{ backgroundColor: '#f0f7ff', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', border: '1px solid #bfdbfe' }}>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>Amount Paid in Words: </span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1d4ed8' }}>Rupees {numberToWords(Math.round(paidAmt))} Only</span>
      </div>

      {/* Bank Details */}
      {(org?.bankName || org?.bankAccount) && (
        <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '14px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Bank Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {org.bankName && <div><span style={{ fontSize: '11px', color: '#9ca3af' }}>Bank: </span><span style={{ fontSize: '12px', fontWeight: '600' }}>{org.bankName}</span></div>}
            {org.bankAccount && <div><span style={{ fontSize: '11px', color: '#9ca3af' }}>A/C: </span><span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{org.bankAccount}</span></div>}
            {org.bankIfsc && <div><span style={{ fontSize: '11px', color: '#9ca3af' }}>IFSC: </span><span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{org.bankIfsc}</span></div>}
            {org.bankBranch && <div><span style={{ fontSize: '11px', color: '#9ca3af' }}>Branch: </span><span style={{ fontSize: '12px' }}>{org.bankBranch}</span></div>}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>This is a computer-generated receipt.</div>
          <div style={{ fontSize: '10px', color: '#d1d5db', marginTop: '4px' }}>Generated by HostelOS · {new Date().toLocaleString('en-IN')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ height: '40px' }}></div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '6px', fontSize: '11px', color: '#6b7280', minWidth: '160px' }}>Authorized Signature</div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{org?.hostelName}</div>
        </div>
      </div>
    </div>
  );
});

// ── Receipt Modal ────────────────────────────────────────────────────
const ReceiptModal = ({ payment, org, onClose }) => {
  const printRef = useRef();
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Receipt-${payment.student?.name}-${new Date().getFullYear()}` });
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">Rent Receipt</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
              🖨 Print / Save PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl px-2">×</button>
          </div>
        </div>
        <ReceiptDoc ref={printRef} payment={payment} org={org} />
      </div>
    </div>
  );
};

// ── Payment Modal (GST & TDS as %) ───────────────────────────────────
const PaymentModal = ({ form, setForm, students, onSave, onClose, title }) => {
  const base = parseFloat(form.amount) || 0;
  const gstPct = parseFloat(form.gstPct) || 0;
  const tdsPct = parseFloat(form.tdsPct) || 0;
  const gstAmt = parseFloat((base * gstPct / 100).toFixed(2));
  const tdsAmt = parseFloat((base * tdsPct / 100).toFixed(2));
  const totalDue = parseFloat((base + gstAmt - tdsAmt).toFixed(2));
  const paid = parseFloat(form.paidAmount) || 0;

  let autoStatus = 'UNPAID', statusColor = '#ef4444', statusBg = '#fee2e2';
  if (paid >= totalDue && totalDue > 0) { autoStatus = 'PAID'; statusColor = '#15803d'; statusBg = '#dcfce7'; }
  else if (paid > 0) { autoStatus = 'PARTIAL'; statusColor = '#b45309'; statusBg = '#fef3c7'; }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

        <label className="text-xs text-gray-500 font-medium">Tenant *</label>
        <select autoFocus value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
          <option value="">Select tenant</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label className="text-xs text-gray-500 font-medium">Base Rent Amount (₹) *</label>
        <input type="number" placeholder="e.g. 8500" value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">GST % <span className="text-gray-400">(optional)</span></label>
            <div className="relative mt-1">
              <input type="number" placeholder="e.g. 18" value={form.gstPct}
                onChange={e => setForm(f => ({ ...f, gstPct: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 pr-8" />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
            </div>
            {gstAmt > 0 && <div className="text-xs text-amber-600 mt-1">= ₹{gstAmt.toLocaleString()}</div>}
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">TDS % <span className="text-gray-400">(optional)</span></label>
            <div className="relative mt-1">
              <input type="number" placeholder="e.g. 10" value={form.tdsPct}
                onChange={e => setForm(f => ({ ...f, tdsPct: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 pr-8" />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
            </div>
            {tdsAmt > 0 && <div className="text-xs text-red-500 mt-1">= ₹{tdsAmt.toLocaleString()}</div>}
          </div>
        </div>

        {/* Live Total Calculation */}
        {base > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
            <div className="text-xs text-gray-500 mb-2 font-semibold">Calculation Breakdown</div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Base Rent</span>
              <span className="font-mono">₹{base.toLocaleString()}</span>
            </div>
            {gstAmt > 0 && (
              <div className="flex justify-between text-xs text-amber-600 mb-1">
                <span>+ GST ({gstPct}%)</span>
                <span className="font-mono">₹{gstAmt.toLocaleString()}</span>
              </div>
            )}
            {tdsAmt > 0 && (
              <div className="flex justify-between text-xs text-red-500 mb-1">
                <span>− TDS ({tdsPct}%)</span>
                <span className="font-mono">₹{tdsAmt.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-blue-200 pt-2 mt-1">
              <span className="text-sm font-bold text-blue-700">Total Payable</span>
              <span className="text-sm font-bold text-blue-700 font-mono">₹{totalDue.toLocaleString()}</span>
            </div>
          </div>
        )}

        <label className="text-xs text-gray-500 font-medium">Amount Already Paid (₹)</label>
        <input type="number" placeholder="0 if not paid yet" value={form.paidAmount}
          onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

        <label className="text-xs text-gray-500 font-medium">Transaction Reference</label>
        <input placeholder="e.g. UPI/TXN123456" value={form.txnRef}
          onChange={e => setForm(f => ({ ...f, txnRef: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

        <label className="text-xs text-gray-500 font-medium">Due Date *</label>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

        {totalDue > 0 && (
          <div className="mb-4 p-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: statusBg }}>
            <span className="text-xs font-medium" style={{ color: statusColor }}>
              {autoStatus === 'PAID' ? '✅ Will be marked as PAID' :
               autoStatus === 'PARTIAL' ? `⚠ Partial — ₹${(totalDue - paid).toLocaleString()} still remaining` :
               '❌ Will be marked as UNPAID'}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: statusColor, color: 'white' }}>
              {autoStatus}
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
        </div>
      </div>
    </div>
  );
};

// ── Settings Modal ───────────────────────────────────────────────────
// ── Settings Modal ────────────────────────────────────────────────────
const SettingsModal = ({ org, onClose, onSave }) => {
  const [form, setForm] = useState({
    gstin: org?.gstin || '', pan: org?.pan || '',
    bankName: org?.bankName || '', bankAccount: org?.bankAccount || '',
    bankIfsc: org?.bankIfsc || '', bankBranch: org?.bankBranch || '',
    address: org?.address || '', city: org?.city || '',
    reminderDaysBefore: org?.reminderDaysBefore ?? 3,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await api.put('/auth/organization', form); alert('✅ Settings saved!'); onSave(form); onClose(); }
    catch { alert('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleTestReminders = async () => {
    setTesting(true);
    try {
      const res = await api.post('/auth/test-reminders');
      alert(`✅ ${res.data.message}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run test reminders');
    } finally { setTesting(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Hostel Tax & Bank Details</h2>
        <p className="text-xs text-gray-400 mb-5">These details appear on all receipts.</p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><label className="text-xs text-gray-500 font-medium">GSTIN</label><input placeholder="e.g. 29AABCS1429B1ZB" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500 font-mono" /></div>
          <div><label className="text-xs text-gray-500 font-medium">PAN</label><input placeholder="e.g. AABCS1429B" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500 font-mono" /></div>
          <div><label className="text-xs text-gray-500 font-medium">Address</label><input placeholder="Street address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" /></div>
          <div><label className="text-xs text-gray-500 font-medium">City</label><input placeholder="e.g. Anantapur" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" /></div>
        </div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Bank Details</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div><label className="text-xs text-gray-500 font-medium">Bank Name</label><input placeholder="e.g. State Bank of India" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" /></div>
          <div><label className="text-xs text-gray-500 font-medium">Account Number</label><input placeholder="e.g. 123456789012" value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500 font-mono" /></div>
          <div><label className="text-xs text-gray-500 font-medium">IFSC Code</label><input placeholder="e.g. SBIN0001234" value={form.bankIfsc} onChange={e => setForm(f => ({ ...f, bankIfsc: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500 font-mono" /></div>
          <div><label className="text-xs text-gray-500 font-medium">Branch Name</label><input placeholder="e.g. Anantapur Main" value={form.bankBranch} onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" /></div>
        </div>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Payment Reminder Settings</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
          <label className="text-xs text-gray-600 font-medium">Send email reminder how many days before due date?</label>
          <div className="flex items-center gap-2 mt-2">
            <input type="number" min="0" max="30" value={form.reminderDaysBefore}
              onChange={e => setForm(f => ({ ...f, reminderDaysBefore: e.target.value }))}
              className="w-20 border border-amber-300 rounded-lg px-3 py-2 text-sm text-center font-mono outline-none focus:border-amber-500" />
            <span className="text-xs text-gray-600">day(s) before due date</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tenants also get an overdue alert automatically on the due date itself. Runs daily at 9:00 AM.
          </p>
        </div>

        <button onClick={handleTestReminders} disabled={testing}
          className="w-full text-xs text-amber-700 border border-amber-300 bg-white rounded-lg py-2 font-medium hover:bg-amber-50 disabled:opacity-50 mb-6">
          {testing ? 'Running...' : '🧪 Send Test Reminders Now'}
        </button>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50" style={{ backgroundColor: '#1a56db' }}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Payments Component ──────────────────────────────────────────
export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [cashPayment, setCashPayment] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [org, setOrg] = useState(null);

  const emptyForm = { studentId: '', amount: '', gstPct: '', tdsPct: '', paidAmount: '', txnRef: '', dueDate: '' };
  const [form, setForm] = useState(emptyForm);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/payments'), api.get('/students'), api.get('/auth/me')])
      .then(([p, s, me]) => {
        setPayments(p.data);
        setStudents(s.data);
        setOrg({ hostelName: me.data.hostelName, ...me.data.organization });
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Calculate GST/TDS amounts from percentages
  const calcAmounts = (f) => {
    const base = parseFloat(f.amount) || 0;
    const gstPct = parseFloat(f.gstPct) || 0;
    const tdsPct = parseFloat(f.tdsPct) || 0;
    const gstAmt = parseFloat((base * gstPct / 100).toFixed(2));
    const tdsAmt = parseFloat((base * tdsPct / 100).toFixed(2));
    const totalDue = parseFloat((base + gstAmt - tdsAmt).toFixed(2));
    const paid = parseFloat(f.paidAmount) || 0;
    let status = 'UNPAID';
    if (paid >= totalDue && totalDue > 0) status = 'PAID';
    else if (paid > 0) status = 'PARTIAL';
    return { gstAmt, tdsAmt, totalDue, status };
  };

  const handleAdd = async () => {
    if (!form.studentId || !form.amount || !form.dueDate) { alert('Tenant, amount and due date are required'); return; }
    const { gstAmt, tdsAmt, status } = calcAmounts(form);
    try {
      await api.post('/payments', {
        studentId: Number(form.studentId),
        amount: parseFloat(form.amount),
        paidAmount: parseFloat(form.paidAmount) || 0,
        gstAmount: gstAmt,
        tdsAmount: tdsAmt,
        txnRef: form.txnRef || null,
        dueDate: form.dueDate,
        status,
      });
      setShowAdd(false); setForm(emptyForm); fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add payment'); }
  };

  const openEdit = (p) => {
    setEditId(p.id);
    // Back-calculate percentages from stored amounts
    const base = p.amount || 0;
    const gstPct = base > 0 && p.gstAmount ? parseFloat(((p.gstAmount / base) * 100).toFixed(2)) : 0;
    const tdsPct = base > 0 && p.tdsAmount ? parseFloat(((p.tdsAmount / base) * 100).toFixed(2)) : 0;
    setForm({
      studentId: p.studentId,
      amount: String(p.amount),
      gstPct: gstPct ? String(gstPct) : '',
      tdsPct: tdsPct ? String(tdsPct) : '',
      paidAmount: String(p.paidAmount),
      txnRef: p.txnRef || '',
      dueDate: p.dueDate?.split('T')[0] || '',
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!form.amount || !form.dueDate) { alert('Amount and due date required'); return; }
    const { gstAmt, tdsAmt, status } = calcAmounts(form);
    try {
      await api.put(`/payments/${editId}`, {
        amount: parseFloat(form.amount),
        paidAmount: parseFloat(form.paidAmount) || 0,
        gstAmount: gstAmt,
        tdsAmount: tdsAmt,
        txnRef: form.txnRef || null,
        dueDate: form.dueDate,
        status,
      });
      setShowEdit(false); setEditId(null); fetchData();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update'); }
  };

  const handleRemind = async (id) => {
    try { await api.post(`/payments/remind/${id}`); alert('Reminder sent!'); }
    catch { alert('Failed to send reminder'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading payments...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Payments</span>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)}
            className="text-sm px-4 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            ⚙ Tax & Bank Settings
          </button>
          <button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
            + Add Payment
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        {!org?.gstin && !org?.bankAccount && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-xs text-amber-700">⚠ Add your GSTIN and bank details to include them on receipts.</span>
            <button onClick={() => setShowSettings(true)} className="text-xs text-amber-700 font-semibold underline">Setup now →</button>
          </div>
        )}

        {payments.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-semibold text-gray-700 mb-1">No payments yet</h3>
            <p className="text-sm text-gray-400">Add tenants first, then create payment records</p>
          </div>
        )}

        {payments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => {
              const cards = payments.filter(p => p.status === col.key);
              return (
                <div key={col.key} className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#0f1117', border: '1px solid #ffffff15' }}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #ffffff10' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }} />
                      <span className="text-sm font-semibold text-white">{col.label}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-gray-400" style={{ backgroundColor: '#ffffff10' }}>{cards.length}</span>
                  </div>

                  <div className="p-3 flex flex-col gap-3 min-h-40">
                    {cards.length === 0 && <p className="text-center text-gray-600 text-xs mt-10">No payments</p>}
                    {cards.map(p => {
                      const gst = p.gstAmount || 0;
                      const tds = p.tdsAmount || 0;
                      const totalDue = p.amount + gst - tds;
                      const remaining = totalDue - p.paidAmount;
                      const isCash = p.txnRef?.startsWith('CASH-');
                      return (
                        <div key={p.id} className="rounded-lg p-3" style={{ backgroundColor: '#1a1f2e', border: `1px solid ${col.border}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-white">{p.student?.name}</span>
                            <div className="flex items-center gap-1.5">
                              {isCash && <span className="text-xs text-green-400">💵</span>}
                              <span className="text-xs font-bold" style={{ color: col.tag }}>{col.key}</span>
                            </div>
                          </div>
                          <div className="text-base font-bold text-white font-mono mb-1">
                            {col.key === 'PARTIAL'
                              ? <>₹{p.paidAmount.toLocaleString()} <span className="text-sm text-gray-400">/ ₹{totalDue.toLocaleString()}</span></>
                              : <>₹{totalDue.toLocaleString()}</>}
                          </div>
                          {(gst > 0 || tds > 0) && (
                            <div className="text-xs mb-1">
                              <span className="text-gray-500">Base ₹{p.amount.toLocaleString()}</span>
                              {gst > 0 && <span className="text-amber-400 ml-1">+GST ₹{gst.toLocaleString()}</span>}
                              {tds > 0 && <span className="text-red-400 ml-1">-TDS ₹{tds.toLocaleString()}</span>}
                            </div>
                          )}
                          {col.key === 'PARTIAL' && (
                            <div className="text-xs text-red-400 font-semibold mb-1">Still due: ₹{remaining.toLocaleString()}</div>
                          )}
                          <div className="text-xs text-gray-400 mb-2">
                            Due {new Date(p.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex gap-3 pt-1 border-t flex-wrap" style={{ borderColor: '#ffffff10' }}>
                            <button onClick={() => openEdit(p)} className="text-xs font-medium" style={{ color: '#60a5fa' }}>Edit</button>
                            <button onClick={() => handleRemind(p.id)} className="text-xs font-medium text-yellow-400">Remind</button>
                            {(col.key === 'UNPAID' || col.key === 'PARTIAL') && (
                              <button onClick={() => setCashPayment(p)} className="text-xs font-medium text-green-400">💵 Cash</button>
                            )}
                            <button onClick={() => setReceiptPayment(p)} className="text-xs font-medium text-green-400">🧾 Receipt</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAdd && <PaymentModal form={form} setForm={setForm} students={students} title="Add Payment" onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {showEdit && <PaymentModal form={form} setForm={setForm} students={students} title="Save Changes" onSave={handleEdit} onClose={() => { setShowEdit(false); setEditId(null); }} />}
      {showSettings && <SettingsModal org={org} onClose={() => setShowSettings(false)} onSave={updated => setOrg(prev => ({ ...prev, ...updated }))} />}
      {receiptPayment && <ReceiptModal payment={receiptPayment} org={org} onClose={() => setReceiptPayment(null)} />}
      {cashPayment && <CashPaymentModal payment={cashPayment} onClose={() => setCashPayment(null)} onSuccess={fetchData} />}
    </div>
  );
}