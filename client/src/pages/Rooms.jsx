import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

const statusColors = {
  OCCUPIED:     { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', dot: '#3b82f6' },
  VACANT:       { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', dot: '#22c55e' },
  LEAVING_SOON: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', dot: '#f59e0b' },
};

const BedChip = ({ status }) => (
  <div className="w-6 h-6 rounded-sm border" style={{
    backgroundColor: statusColors[status]?.bg || '#f3f4f6',
    borderColor: statusColors[status]?.border || '#e5e7eb',
  }} title={status} />
);

const BedTooltip = ({ bed, visible }) => {
  if (!visible) return null;
  const student = bed.student;
  const colors = statusColors[bed.status] || statusColors.VACANT;
  return (
    <div className="absolute z-50 bottom-full left-1/2 mb-2 pointer-events-none"
      style={{ transform: 'translateX(-50%)', minWidth: '160px' }}>
      <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs"
        style={{ border: `1px solid ${colors.border}40` }}>
        <div className="font-semibold mb-1" style={{ color: colors.dot }}>{bed.bedLabel}</div>
        {bed.status === 'VACANT' ? (
          <div className="text-green-400">Available</div>
        ) : (
          <>
            <div className="text-white font-medium mb-1">{student?.name || 'Occupied'}</div>
            {student?.checkInDate && (
              <div className="text-gray-400">In: {new Date(student.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            )}
            {student?.checkOutDate && (
              <div className="text-gray-400">Out: {new Date(student.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            )}
            {!student?.checkOutDate && <div className="text-gray-500">No checkout set</div>}
          </>
        )}
      </div>
      <div className="absolute left-1/2 top-full" style={{
        transform: 'translateX(-50%)', width: 0, height: 0,
        borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
        borderTop: '6px solid #111827',
      }} />
    </div>
  );
};

const BedCard = ({ bed }) => {
  const [hovered, setHovered] = useState(false);
  const colors = statusColors[bed.status] || statusColors.VACANT;
  const icon = bed.status === 'OCCUPIED' ? '🛏' : bed.status === 'LEAVING_SOON' ? '⚠️' : '✨';
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <BedTooltip bed={bed} visible={hovered} />
      <div className="rounded-lg p-2 text-center border cursor-pointer"
        style={{ backgroundColor: colors.bg, borderColor: colors.border }}>
        <div className="text-lg">{icon}</div>
        <div className="text-xs font-mono text-gray-600 truncate">{bed.bedLabel}</div>
      </div>
    </div>
  );
};

const AddRoomModal = ({ form, setForm, onSave, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl mx-4" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Room</h2>
      <label className="text-xs text-gray-500 font-medium">Room Number *</label>
      <input placeholder="e.g. R-101" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
      <label className="text-xs text-gray-500 font-medium">Room Name *</label>
      <input placeholder="e.g. Alpha Wing" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
      <label className="text-xs text-gray-500 font-medium">Floor *</label>
      <select value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="">Select Floor</option>
        {[1,2,3,4,5].map(f => <option key={f} value={f}>Floor {f}</option>)}
      </select>
      <label className="text-xs text-gray-500 font-medium">Total Beds *</label>
      <input placeholder="e.g. 4" type="number" min="1" max="20" value={form.totalBeds} onChange={e => setForm(f => ({ ...f, totalBeds: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500" />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>Add Room</button>
      </div>
    </div>
  </div>
);

const BulkUploadModal = ({ onClose, onSuccess }) => {
  const fileRef = useRef();
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(0);

  const downloadSample = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['roomNumber', 'name', 'floor', 'totalBeds'],
      ['R-101', 'Alpha Wing', '1', '4'],
      ['R-102', 'Beta Wing', '1', '3'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rooms');
    XLSX.writeFile(wb, 'sample_rooms.xlsx');
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
        await api.post('/rooms', { roomNumber: String(row.roomNumber), name: row.name, floor: String(row.floor), totalBeds: String(row.totalBeds) });
        count++; setDone(count);
      } catch {}
    }
    setUploading(false);
    alert(`✅ ${count} of ${preview.length} rooms added!`);
    onSuccess(); onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Bulk Upload Rooms</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-700 mb-2">Upload an Excel file with room details.</p>
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
              <button onClick={handleUpload} disabled={uploading}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: '#1a56db' }}>
                {uploading ? `Uploading... ${done}/${preview.length}` : `Upload ${preview.length} Rooms`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('floor');
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ roomNumber: '', name: '', floor: '', totalBeds: '' });

  const fetchRooms = () => {
    setLoading(true); setError('');
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => setError('Failed to load rooms')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleAdd = async () => {
    if (!form.roomNumber || !form.name || !form.floor || !form.totalBeds) { alert('All fields are required'); return; }
    try { await api.post('/rooms', form); setShowModal(false); setForm({ roomNumber: '', name: '', floor: '', totalBeds: '' }); fetchRooms(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to add room'); }
  };

  const floors = [...new Set(rooms.map(r => r.floor))].sort();
  const getRoomStatus = (room) => room.occupiedBeds === room.totalBeds ? 'OCCUPIED' : room.occupiedBeds === 0 ? 'VACANT' : 'LEAVING_SOON';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading rooms...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Rooms</span>
        <div className="flex gap-2">
          <button onClick={() => setShowBulk(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            📂 Upload
          </button>
          <button onClick={() => setShowModal(true)}
            className="text-white text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
            + Add Room
          </button>
        </div>
      </div>

      <div className="p-4">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        {/* Tab bar — scrollable on mobile */}
        <div className="overflow-x-auto mb-4">
          <div className="bg-gray-100 rounded-lg p-1 flex gap-1 w-fit min-w-full">
            {[['floor','Floor View'],['kanban','Kanban'],['bed','Bed Layout'],['table','Table View']].map(([key, label]) => (
              <button key={key} onClick={() => setView(key)}
                className="px-3 py-1.5 text-xs rounded-md font-medium transition whitespace-nowrap"
                style={view === key ? { backgroundColor: 'white', color: '#0f0f0f', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#888' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {rooms.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">🛏</div>
            <h3 className="font-semibold text-gray-700 mb-1">No rooms yet</h3>
            <p className="text-sm text-gray-400 mb-4">Add your first room to get started</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setShowBulk(true)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg">📂 Bulk Upload</button>
              <button onClick={() => setShowModal(true)} className="text-white text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: '#1a56db' }}>+ Add Room</button>
            </div>
          </div>
        )}

        {/* ── Floor View ── */}
        {view === 'floor' && rooms.length > 0 && (
          <div>
            {floors.map(floor => (
              <div key={floor} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-white text-xs font-bold">{floor}</div>
                  <span className="text-sm font-semibold text-gray-700">Floor {floor}</span>
                  <span className="text-xs text-gray-400">{rooms.filter(r => r.floor === floor).length} rooms</span>
                </div>
                {/* 1 col on mobile, 2 on sm, 3 on lg */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rooms.filter(r => r.floor === floor).map(room => {
                    const status = getRoomStatus(room);
                    const colors = statusColors[status];
                    return (
                      <div key={room.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4" style={{ borderLeftColor: colors.border }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-gray-500">{room.roomNumber}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>{status.replace('_', ' ')}</span>
                        </div>
                        <div className="font-semibold text-gray-800 mb-3">{room.name}</div>
                        <div className="flex gap-1 flex-wrap mb-3">
                          {room.beds?.map(bed => <BedChip key={bed.id} status={bed.status} />)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{room.occupiedBeds}/{room.totalBeds} beds</span>
                          <span style={{ color: colors.text }}>{room.vacantBeds} vacant</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Kanban View ── */}
        {view === 'kanban' && rooms.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-[600px]">
              {[{ key: 'VACANT', label: 'Vacant', dot: '#22c55e' }, { key: 'OCCUPIED', label: 'Occupied', dot: '#3b82f6' }, { key: 'LEAVING_SOON', label: 'Leaving Soon', dot: '#f59e0b' }].map(col => {
                const colRooms = rooms.filter(r => getRoomStatus(r) === col.key);
                return (
                  <div key={col.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex-1 min-w-[180px]">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dot }}></div>
                        <span className="text-sm font-semibold text-gray-800">{col.label}</span>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{colRooms.length}</span>
                    </div>
                    <div className="p-3 flex flex-col gap-2 min-h-40">
                      {colRooms.length === 0 && <p className="text-xs text-gray-400 text-center mt-6">No rooms</p>}
                      {colRooms.map(room => (
                        <div key={room.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-gray-500">{room.roomNumber}</span>
                            <span className="text-xs text-gray-400">Floor {room.floor}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-800 mb-2">{room.name}</div>
                          <div className="flex gap-1 flex-wrap">
                            {room.beds?.map(bed => <BedChip key={bed.id} status={bed.status} />)}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{room.occupiedBeds}/{room.totalBeds} occupied</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Bed Layout ── */}
        {view === 'bed' && rooms.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex gap-3 mb-4 text-xs flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-sm bg-blue-100 border border-blue-300 inline-block"></span>Occupied</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-sm bg-green-100 border border-green-300 inline-block"></span>Vacant</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-sm bg-amber-100 border border-amber-300 inline-block"></span>Leaving Soon</span>
            </div>
            <div className="flex flex-col gap-6">
              {rooms.map(room => (
                <div key={room.id}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-700 font-mono">{room.roomNumber}</span>
                    <span className="text-xs text-gray-400">{room.name}</span>
                    <span className="text-xs text-gray-400">· Floor {room.floor}</span>
                    <span className="text-xs text-gray-400">· {room.occupiedBeds}/{room.totalBeds} occupied</span>
                  </div>
                  {/* 4 cols on mobile, 8 on desktop */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {room.beds?.map(bed => <BedCard key={bed.id} bed={bed} />) || []}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Table View ── */}
        {view === 'table' && rooms.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-[600px] w-full">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f6' }}>
                  {['Room','Name','Floor','Total Beds','Occupied','Vacant','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  const status = getRoomStatus(room);
                  const colors = statusColors[status];
                  return (
                    <tr key={room.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{room.roomNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{room.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Floor {room.floor}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{room.totalBeds}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{room.occupiedBeds}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{room.vacantBeds}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>{status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddRoomModal form={form} setForm={setForm} onSave={handleAdd} onClose={() => setShowModal(false)} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onSuccess={fetchRooms} />}
    </div>
  );
}