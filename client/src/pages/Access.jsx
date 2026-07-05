import React, { useState, useEffect } from 'react';
import api from '../services/api';

const avatarColors = ['#1a56db','#7c3aed','#0d9488','#b45309','#dc2626','#15803d'];

// ── Add Log Modal ────────────────────────────────────────────────────
const AddLogModal = ({ students, onClose, onSuccess }) => {
  const [form, setForm] = useState({ studentId: '', nfcCardId: '', accessType: 'ENTRY' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.studentId || !form.nfcCardId) { alert('Student and NFC Card ID are required'); return; }
    setSaving(true);
    try {
      await api.post('/access', form);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add log');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Access Log</h2>

        <label className="text-xs text-gray-500 font-medium">Tenant *</label>
        <select autoFocus value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
          <option value="">Select tenant</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label className="text-xs text-gray-500 font-medium">NFC Card ID *</label>
        <input placeholder="e.g. NFC-001 or card serial number" value={form.nfcCardId}
          onChange={e => setForm(f => ({ ...f, nfcCardId: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500 font-mono" />

        <label className="text-xs text-gray-500 font-medium">Access Type</label>
        <div className="flex gap-2 mt-1 mb-5">
          {['ENTRY', 'EXIT'].map(type => (
            <button key={type} onClick={() => setForm(f => ({ ...f, accessType: type }))}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
              style={form.accessType === type
                ? { backgroundColor: type === 'ENTRY' ? '#22c55e' : '#3b82f6', color: 'white' }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
              {type === 'ENTRY' ? '🚪 Entry' : '🚶 Exit'}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}>
            {saving ? 'Saving...' : 'Add Log'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Access() {
  const [logs, setLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);

  const fetchLogs = () => {
    Promise.all([api.get('/access'), api.get('/students')])
      .then(([logsRes, studentsRes]) => {
        setLogs(logsRes.data);
        setStudents(studentsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const formatTime = (dt) => {
    const d = new Date(dt);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    return isToday
      ? `Today, ${time}`
      : `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`;
  };

  const todayLogs = logs.filter(l => new Date(l.accessTime).toDateString() === new Date().toDateString());
  const entryCount = logs.filter(l => l.accessType === 'ENTRY').length;
  const exitCount = logs.filter(l => l.accessType === 'EXIT').length;

  const filtered = logs.filter(l => {
    const matchSearch = l.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.nfcCardId?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || l.accessType === filterType;
    return matchSearch && matchType;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading access logs...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Access Control</span>
        <button onClick={() => setShowAdd(true)}
          className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
          + Add Log
        </button>
      </div>

      <div className="p-4 md:p-6">

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Logs', value: logs.length, color: '#3b82f6', icon: '📋' },
            { label: "Today's Activity", value: todayLogs.length, color: '#7c3aed', icon: '📅' },
            { label: 'Total Entries', value: entryCount, color: '#22c55e', icon: '🚪' },
            { label: 'Total Exits', value: exitCount, color: '#f59e0b', icon: '🚶' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-3 md:p-4 shadow-sm" style={{ borderTop: `4px solid ${card.color}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{card.icon}</span>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide leading-tight">{card.label}</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="bg-white rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm flex-1 min-w-48">
            <span className="text-gray-400 text-sm">🔍</span>
            <input placeholder="Search by name or NFC card..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400" />
          </div>
          <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
            {['ALL', 'ENTRY', 'EXIT'].map(type => (
              <button key={type} onClick={() => setFilterType(type)}
                className="px-3 py-1.5 text-xs rounded-md font-medium transition"
                style={filterType === type
                  ? { backgroundColor: 'white', color: '#0f0f0f', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { color: '#888' }}>
                {type === 'ENTRY' ? '🚪 Entry' : type === 'EXIT' ? '🚶 Exit' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-5xl mb-3">🔐</div>
            <h3 className="font-semibold text-gray-700 mb-1">No access logs yet</h3>
            <p className="text-sm text-gray-400 mb-4">Logs appear when tenants scan their NFC cards</p>
            <button onClick={() => setShowAdd(true)}
              className="text-white text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
              + Add Manual Log
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-gray-400">No logs match your search</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f6' }}>
                    {['Tenant', 'Room', 'NFC Card', 'Access Time', 'Type', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log, i) => (
                    <tr key={log.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                            {log.student?.name?.split(' ').map(n => n[0]).join('').slice(0,2) || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                            {log.student?.name || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 whitespace-nowrap">
                        {log.student?.bed?.room?.roomNumber || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-900 text-green-400 px-2 py-0.5 rounded whitespace-nowrap">
                          {log.nfcCardId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatTime(log.accessTime)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                          log.accessType === 'ENTRY'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.accessType === 'ENTRY' ? '🚪 Entry' : '🚶 Exit'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400">
                Showing {filtered.length} of {logs.length} logs
                {filterType !== 'ALL' && ` · Filtered: ${filterType}`}
                {search && ` · Search: "${search}"`}
              </span>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddLogModal
          students={students}
          onClose={() => setShowAdd(false)}
          onSuccess={fetchLogs}
        />
      )}
    </div>
  );
}