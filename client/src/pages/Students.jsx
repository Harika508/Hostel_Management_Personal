import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

const avatarColors = ['#1a56db','#7c3aed','#0d9488','#b45309','#dc2626','#15803d','#9333ea','#0891b2'];

const TenantTooltip = ({ student, visible, x, y }) => {
  if (!visible) return null;
  const above = window.innerHeight - y < 240;
  return (
    <div className="pointer-events-none" style={{
      position: 'fixed', left: x + 12, top: above ? y - 220 : y + 16, zIndex: 9999, minWidth: '240px',
    }}>
      <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-xs">
        <div className="font-bold text-white text-sm mb-2">{student.name}</div>
        <div className="flex flex-col gap-1.5">
          {[
            ['Email',     student.email],
            ['Phone',     student.phone],
            ['Room',      student.bed?.room?.roomNumber],
            ['Bed',       student.bed?.bedLabel],
            ['Check-in',  student.checkInDate ? new Date(student.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null],
            ['Check-out', student.checkOutDate ? new Date(student.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null],
            ['Guardian',  student.guardianName],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-gray-400 w-16 flex-shrink-0">{label}</span>
              <span className="text-gray-200">{value || '—'}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16 flex-shrink-0">KYC</span>
            <span className={`font-semibold ${student.kycStatus === 'VERIFIED' ? 'text-green-400' : student.kycStatus === 'REJECTED' ? 'text-red-400' : 'text-amber-400'}`}>
              {student.kycStatus}
            </span>
          </div>
          {student.kycDocumentUrl && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-16 flex-shrink-0">ID Proof</span>
              <span className="text-green-400">✔ Uploaded</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 w-16 flex-shrink-0">Login</span>
            <span className={`font-semibold ${student.userId ? 'text-green-400' : 'text-gray-500'}`}>
              {student.userId ? '✔ Approved' : '— Not approved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Invite Link Modal ────────────────────────────────────────────────
const InviteLinkModal = ({ data, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(data.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">✅</div>
          <h2 className="text-lg font-bold text-gray-900">Login Approved!</h2>
          <p className="text-xs text-gray-400 mt-1">Share this invite link with the tenant</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
          <div className="text-xs text-gray-500 font-medium mb-1">Invite Link</div>
          <div className="text-xs text-blue-600 break-all font-mono">{data.inviteLink}</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-amber-700 font-semibold mb-1">⚠ Also share the Hostel Code</p>
          <p className="text-xs text-amber-600">The tenant will need both this link AND the hostel code to set their password. Find the hostel code in your profile or registration email.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={copy}
            className="flex-1 border border-blue-300 text-blue-600 bg-blue-50 rounded-lg py-2 text-sm font-medium hover:bg-blue-100">
            {copied ? '✔ Copied!' : '📋 Copy Link'}
          </button>
          <button onClick={onClose}
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const TenantRow = ({ s, i, checked, onCheck, kycConfig, onEdit, onApprove, onDisapprove, onDelete }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });

  // Determine login status from userId
  const isApproved = !!s.userId;

  return (
    <>
      <tr className={`border-b border-gray-50 ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
        onMouseMove={e => setTooltip({ visible: true, x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}>
        <td className="px-4 py-3">
          <input type="checkbox" checked={checked} onChange={() => onCheck(s.id)}
            className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
              {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-800">{s.name}</div>
              <div className="text-xs text-gray-400">{s.email}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {s.bed ? (
            <div>
              <div className="text-xs font-mono font-semibold text-gray-700">{s.bed.room?.roomNumber}</div>
              <div className="text-xs text-gray-400">{s.bed.bedLabel}</div>
            </div>
          ) : <span className="text-xs text-gray-400">Not assigned</span>}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {s.checkInDate ? new Date(s.checkInDate).toLocaleDateString('en-IN') : '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600">
          {s.checkOutDate ? new Date(s.checkOutDate).toLocaleDateString('en-IN') : '—'}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold px-2 py-1 rounded-full w-fit"
              style={{ backgroundColor: kycConfig[s.kycStatus]?.bg, color: kycConfig[s.kycStatus]?.color }}>
              {kycConfig[s.kycStatus]?.label}
            </span>
            {s.kycDocumentUrl
              ? <span className="text-xs text-green-600 font-medium">📎 ID uploaded</span>
              : <span className="text-xs text-gray-400">No ID proof</span>}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isApproved ? '✔ Approved' : '— Pending'}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={() => onEdit(s)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
            {isApproved
              ? <button onClick={() => onDisapprove(s)} className="text-xs font-medium text-red-500 hover:underline">Disapprove</button>
              : <button onClick={() => onApprove(s)} className="text-xs font-medium text-green-600 hover:underline">Approve</button>
            }
            <button onClick={() => onDelete(s.id)} className="text-xs font-medium text-red-400 hover:underline">Delete</button>
          </div>
        </td>
      </tr>
      <TenantTooltip student={s} visible={tooltip.visible} x={tooltip.x} y={tooltip.y} />
    </>
  );
};

const TenantModal = ({ form, setForm, kycFile, setKycFile, rooms, onSave, onClose, title }) => {
  const fileRef = useRef();
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium">Full Name *</label>
            <input autoFocus placeholder="e.g. Aisha Khan" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Email *</label>
            <input type="email" placeholder="tenant@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Phone</label>
            <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Assign Bed</label>
            <select value={form.bedId} onChange={e => setForm(f => ({ ...f, bedId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500">
              <option value="">No bed assigned</option>
              {rooms.flatMap(room => room.beds?.filter(b => b.status === 'VACANT').map(bed => (
                <option key={bed.id} value={bed.id}>{room.roomNumber} — {bed.bedLabel}</option>
              )) || [])}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Check-in Date</label>
            <input type="date" value={form.checkInDate} onChange={e => setForm(f => ({ ...f, checkInDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Check-out Date</label>
            <input type="date" value={form.checkOutDate} onChange={e => setForm(f => ({ ...f, checkOutDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Guardian Name</label>
            <input placeholder="Guardian name" value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Guardian Phone</label>
            <input placeholder="Guardian phone" value={form.guardianPhone} onChange={e => setForm(f => ({ ...f, guardianPhone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">KYC Status</label>
            <select value={form.kycStatus} onChange={e => setForm(f => ({ ...f, kycStatus: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500">
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">ID Type</label>
            <select value={form.idType || ''} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500">
              <option value="">Select ID type</option>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Driving License">Driving License</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-gray-500 font-medium">ID Proof Document</label>
          <div className="mt-1 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 transition flex items-center gap-3"
            style={{ borderColor: kycFile ? '#22c55e' : '#e5e7eb', backgroundColor: kycFile ? '#f0fdf4' : '#fafafa' }}
            onClick={() => fileRef.current.click()}>
            <span className="text-xl">{kycFile ? '✅' : '📄'}</span>
            <div className="flex-1 min-w-0">
              {kycFile ? (
                <>
                  <div className="text-xs font-semibold text-green-700 truncate">{kycFile.name}</div>
                  <div className="text-xs text-green-500">{(kycFile.size / 1024).toFixed(1)} KB — click to change</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-medium text-gray-600">Click to upload Aadhaar / ID proof</div>
                  <div className="text-xs text-gray-400">JPG, PNG or PDF — max 5MB</div>
                </>
              )}
            </div>
            {kycFile && (
              <button onClick={e => { e.stopPropagation(); setKycFile(null); }}
                className="text-xs text-red-400 hover:text-red-600 font-medium flex-shrink-0">Remove</button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={e => setKycFile(e.target.files[0] || null)} />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
        </div>
      </div>
    </div>
  );
};

const BulkUploadModal = ({ onClose, onSuccess }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);

  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['name','email','phone','guardianName','guardianPhone','checkInDate','checkOutDate','kycStatus'],
      ['Aisha Khan','aisha@example.com','9876543210','Rafi Khan','9876500000','2025-06-01','2026-05-31','PENDING'],
      ['Rahul Verma','rahul@example.com','9123456789','Suresh Verma','9123400000','2025-07-01','','VERIFIED'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tenants');
    XLSX.writeFile(wb, 'sample_tenants.xlsx');
  };

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      setPreview(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }));
    };
    reader.readAsBinaryString(file);
  };

  const handleUpload = async () => {
    setUploading(true); let count = 0;
    for (const row of preview) {
      try {
        await api.post('/students', { name: row.name, email: row.email, phone: String(row.phone || ''), guardianName: row.guardianName || '', guardianPhone: String(row.guardianPhone || ''), checkInDate: row.checkInDate || '', checkOutDate: row.checkOutDate || '', kycStatus: row.kycStatus || 'PENDING' });
        count++; setDone(count);
      } catch {}
    }
    setUploading(false);
    alert(`✅ ${count} of ${preview.length} tenants added!`);
    onSuccess(); onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Bulk Upload Tenants</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-700 mb-2">Upload an Excel file with tenant details.</p>
          <button onClick={downloadSample} className="text-xs font-semibold text-blue-600 underline">⬇ Download Sample Excel</button>
        </div>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 cursor-pointer hover:border-blue-400 transition"
          onClick={() => fileRef.current.click()}>
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
                {uploading ? `Uploading... ${done}/${preview.length}` : `Upload ${preview.length} Tenants`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const emptyForm = { name: '', email: '', phone: '', bedId: '', checkInDate: '', checkOutDate: '', guardianName: '', guardianPhone: '', kycStatus: 'PENDING', idType: '' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [kycFile, setKycFile] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState(new Set());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [studentsRes, roomsRes] = await Promise.all([api.get('/students'), api.get('/rooms')]);
      setStudents(studentsRes.data);
      setRooms(roomsRes.data);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.email) { alert('Name and email are required'); return; }
    try {
      const res = await api.post('/students', form);
      const newStudentId = res.data.id;
      if (kycFile && newStudentId) {
        const fd = new FormData(); fd.append('kyc', kycFile);
        await api.post(`/students/${newStudentId}/kyc`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowAdd(false); setForm(emptyForm); setKycFile(null); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add tenant'); }
  };

  const handleEdit = async () => {
    if (!form.name || !form.email) { alert('Name and email are required'); return; }
    try {
      await api.put(`/students/${editId}`, form);
      if (kycFile) {
        const fd = new FormData(); fd.append('kyc', kycFile);
        await api.post(`/students/${editId}/kyc`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowEdit(false); setEditId(null); setForm(emptyForm); setKycFile(null); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update tenant'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tenant?')) return;
    try {
      await api.delete(`/students/${id}`);
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
      fetchAll();
    } catch { alert('Failed to delete tenant'); }
  };

  // ── Approve login ──
  const handleApprove = async (student) => {
    if (!student.email) { alert('This tenant has no email. Please add an email first.'); return; }
    try {
      const res = await api.post(`/auth/approve/student/${student.id}`);
      setInviteData(res.data);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to approve login'); }
  };

  // ── Disapprove login ──
  const handleDisapprove = async (student) => {
    if (!window.confirm(`Disapprove login for ${student.name}?\nThey will not be able to log in until re-approved.`)) return;
    try {
      await api.post(`/auth/disapprove/student/${student.id}`);
      fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to disapprove login'); }
  };

  const openEdit = (s) => {
    setEditId(s.id); setKycFile(null);
    setForm({
      name: s.name, email: s.email, phone: s.phone || '',
      bedId: s.bedId || '', guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '', kycStatus: s.kycStatus,
      idType: s.idType || '',
      checkInDate: s.checkInDate ? s.checkInDate.split('T')[0] : '',
      checkOutDate: s.checkOutDate ? s.checkOutDate.split('T')[0] : '',
    });
    setShowEdit(true);
  };

  const filtered = students
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));

  const allChecked = filtered.length > 0 && filtered.every(s => selected.has(s.id));
  const someChecked = filtered.some(s => selected.has(s.id));

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const toggleOne = (id) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const downloadSelected = () => {
    const rows = filtered.filter(s => selected.has(s.id)).map(s => ({
      Name: s.name, Email: s.email, Phone: s.phone || '',
      Room: s.bed?.room?.roomNumber || '', Bed: s.bed?.bedLabel || '',
      'Check-in': s.checkInDate ? new Date(s.checkInDate).toLocaleDateString('en-IN') : '',
      'Check-out': s.checkOutDate ? new Date(s.checkOutDate).toLocaleDateString('en-IN') : '',
      'KYC Status': s.kycStatus, 'ID Type': s.idType || '',
      'Guardian Name': s.guardianName || '', 'Guardian Phone': s.guardianPhone || '',
      'Login Approved': s.userId ? 'Yes' : 'No',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tenants');
    XLSX.writeFile(wb, `tenants_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const kycConfig = {
    VERIFIED: { bg: '#dcfce7', color: '#15803d', label: '✔ Verified' },
    PENDING:  { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
    REJECTED: { bg: '#fee2e2', color: '#dc2626', label: '✘ Rejected' },
  };

  // Stats
  const approvedCount = students.filter(s => s.userId).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading tenants...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Tenants</span>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={downloadSelected}
              className="text-sm px-4 py-1.5 rounded-lg font-medium border border-green-300 text-green-700 bg-green-50 hover:bg-green-100">
              ⬇ Download {selected.size} Selected
            </button>
          )}
          <button onClick={() => setShowBulk(true)}
            className="text-sm px-4 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            📂 Bulk Upload
          </button>
          <button onClick={() => { setForm(emptyForm); setKycFile(null); setShowAdd(true); }}
            className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
            + Add Tenant
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg">{students.length} Total Tenants</div>
            <div className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
              {students.filter(s => s.kycStatus === 'PENDING').length} KYC Pending
            </div>
            <div className="bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
              {approvedCount} Login Approved
            </div>
            {someChecked && (
              <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg">{selected.size} Selected</div>
            )}
          </div>
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 w-64" />
        </div>

        {students.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="font-semibold text-gray-700 mb-1">No tenants yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add your first tenant to get started</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowBulk(true)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">📂 Bulk Upload</button>
              <button onClick={() => setShowAdd(true)} className="text-white text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: '#1a56db' }}>+ Add Tenant</button>
            </div>
          </div>
        ) : (
         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full" style={{ minWidth: '800px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f8f6' }}>
                  <th className="px-4 py-3 border-b border-gray-100 w-10">
                    <input type="checkbox" checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 cursor-pointer select-none"
                    onClick={() => setSortAsc(v => !v)}>
                    <div className="flex items-center gap-1">Tenant <span className="text-gray-400">{sortAsc ? '↑' : '↓'}</span></div>
                  </th>
                  {['Room/Bed','Check-in','Check-out','KYC Status','Login','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <TenantRow key={s.id} s={s} i={i} kycConfig={kycConfig}
                    checked={selected.has(s.id)} onCheck={toggleOne}
                    onEdit={openEdit}
                    onApprove={handleApprove}
                    onDisapprove={handleDisapprove}
                    onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>

      {showAdd && <TenantModal form={form} setForm={setForm} kycFile={kycFile} setKycFile={setKycFile} rooms={rooms} onSave={handleAdd} onClose={() => { setShowAdd(false); setKycFile(null); }} title="Add Tenant" />}
      {showEdit && <TenantModal form={form} setForm={setForm} kycFile={kycFile} setKycFile={setKycFile} rooms={rooms} onSave={handleEdit} onClose={() => { setShowEdit(false); setEditId(null); setKycFile(null); }} title="Save Changes" />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onSuccess={fetchAll} />}
      {inviteData && <InviteLinkModal data={inviteData} onClose={() => setInviteData(null)} />}
    </div>
  );
}