import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const conditionConfig = {
  GOOD: { bg: '#dcfce7', color: '#15803d', label: '✔ Good' },
  DAMAGED: { bg: '#fee2e2', color: '#dc2626', label: '✘ Damaged' },
  UNDER_REPAIR: { bg: '#fef3c7', color: '#b45309', label: '🔧 Under Repair' },
  OUT_OF_STOCK: { bg: '#f3f4f6', color: '#6b7280', label: '— Out of Stock' },
};

const facilityStatusConfig = {
  AVAILABLE: { bg: '#dcfce7', color: '#15803d', label: '✔ Available' },
  IN_USE: { bg: '#fef3c7', color: '#b45309', label: '⏳ In Use' },
  MAINTENANCE: { bg: '#fee2e2', color: '#dc2626', label: '🔧 Maintenance' },
};

const priorityConfig = {
  LOW: { bg: '#f3f4f6', color: '#6b7280', label: 'Low' },
  MEDIUM: { bg: '#fef3c7', color: '#b45309', label: 'Medium' },
  HIGH: { bg: '#fee2e2', color: '#dc2626', label: 'High' },
};

const requestStatusConfig = {
  PENDING: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8', label: '🔨 In Progress' },
  RESOLVED: { bg: '#dcfce7', color: '#15803d', label: '✔ Resolved' },
};

// ── Inventory Modal ───────────────────────────────────────────────────
const InventoryModal = ({ form, setForm, onSave, onClose, title }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      <label className="text-xs text-gray-500 font-medium">Item Name *</label>
      <input autoFocus placeholder="e.g. Office Chair" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

      <label className="text-xs text-gray-500 font-medium">Category *</label>
      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="">Select category</option>
        {['Furniture', 'Appliance', 'Electronics', 'Bedding', 'Kitchen', 'Cleaning Supplies', 'Other'].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="text-xs text-gray-500 font-medium">Quantity *</label>
      <input type="number" placeholder="1" value={form.quantity}
        onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

      <label className="text-xs text-gray-500 font-medium">Condition</label>
      <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="GOOD">Good</option>
        <option value="DAMAGED">Damaged</option>
        <option value="UNDER_REPAIR">Under Repair</option>
        <option value="OUT_OF_STOCK">Out of Stock</option>
      </select>

      <label className="text-xs text-gray-500 font-medium">Notes</label>
      <textarea rows={2} placeholder="Optional notes" value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500 resize-none" />

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
      </div>
    </div>
  </div>
);

// ── Facility Modal ─────────────────────────────────────────────────────
const FacilityModal = ({ form, setForm, onSave, onClose, title }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      <label className="text-xs text-gray-500 font-medium">Facility Name *</label>
      <input autoFocus placeholder="e.g. Washing Machine" value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

      <label className="text-xs text-gray-500 font-medium">Type *</label>
      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="">Select type</option>
        {['Laundry', 'Gym', 'Common Hall', 'Study Room', 'WiFi', 'Water Cooler', 'Other'].map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <label className="text-xs text-gray-500 font-medium">Status</label>
      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="AVAILABLE">Available</option>
        <option value="IN_USE">In Use</option>
        <option value="MAINTENANCE">Maintenance</option>
      </select>

      <label className="text-xs text-gray-500 font-medium">Notes</label>
      <textarea rows={2} placeholder="Optional notes" value={form.notes}
        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500 resize-none" />

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
      </div>
    </div>
  </div>
);

// ── Request Modal ───────────────────────────────────────────────────────
const RequestModal = ({ form, setForm, onSave, onClose, title }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      <label className="text-xs text-gray-500 font-medium">Title *</label>
      <input autoFocus placeholder="e.g. Fan not working" value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

      <label className="text-xs text-gray-500 font-medium">Description *</label>
      <textarea rows={3} placeholder="Describe the issue" value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500 resize-none" />

      <label className="text-xs text-gray-500 font-medium">Category *</label>
      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500">
        <option value="">Select category</option>
        {['Electrical', 'Plumbing', 'Furniture', 'Kitchen Equipment', 'Cleaning Supplies', 'Security/Locks', 'Internet/WiFi', 'Other'].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="text-xs text-gray-500 font-medium">Room Number (optional)</label>
      <input placeholder="e.g. R-101" value={form.roomNumber}
        onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />

      <label className="text-xs text-gray-500 font-medium">Priority</label>
      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500">
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>

      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>{title}</button>
      </div>
    </div>
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────
export default function Resources() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || (user?.role === 'STAFF' && user?.staffRole === 'Manager');

  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showInvModal, setShowInvModal] = useState(false);
  const [showFacModal, setShowFacModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const emptyInvForm = { name: '', category: '', quantity: '1', condition: 'GOOD', notes: '' };
  const emptyFacForm = { name: '', type: '', status: 'AVAILABLE', notes: '' };
  const emptyReqForm = { title: '', description: '', category: '', roomNumber: '', priority: 'MEDIUM' };

  const [invForm, setInvForm] = useState(emptyInvForm);
  const [facForm, setFacForm] = useState(emptyFacForm);
  const [reqForm, setReqForm] = useState(emptyReqForm);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/resources/inventory'),
      api.get('/resources/facilities'),
      api.get('/resources/requests'),
    ]).then(([inv, fac, req]) => {
      setInventory(inv.data);
      setFacilities(fac.data);
      setRequests(req.data);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Inventory handlers ──
  const handleAddInventory = async () => {
    if (!invForm.name || !invForm.category) { alert('Name and category are required'); return; }
    try {
      await api.post('/resources/inventory', invForm);
      setShowInvModal(false); setInvForm(emptyInvForm); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to add item'); }
  };

  const openEditInventory = (item) => {
    setEditId(item.id);
    setInvForm({ name: item.name, category: item.category, quantity: String(item.quantity), condition: item.condition, notes: item.notes || '' });
    setShowInvModal(true);
  };

  const handleSaveInventory = async () => {
    if (editId) {
      try { await api.put(`/resources/inventory/${editId}`, invForm); setShowInvModal(false); setEditId(null); setInvForm(emptyInvForm); fetchAll(); }
      catch { alert('Failed to update item'); }
    } else {
      handleAddInventory();
    }
  };

  const handleDeleteInventory = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/resources/inventory/${id}`); fetchAll(); }
    catch { alert('Failed to delete item'); }
  };

  // ── Facility handlers ──
  const openEditFacility = (f) => {
    setEditId(f.id);
    setFacForm({ name: f.name, type: f.type, status: f.status, notes: f.notes || '' });
    setShowFacModal(true);
  };

  const handleSaveFacility = async () => {
    if (!facForm.name || !facForm.type) { alert('Name and type are required'); return; }
    try {
      if (editId) { await api.put(`/resources/facilities/${editId}`, facForm); }
      else { await api.post('/resources/facilities', facForm); }
      setShowFacModal(false); setEditId(null); setFacForm(emptyFacForm); fetchAll();
    } catch { alert('Failed to save facility'); }
  };

  const handleDeleteFacility = async (id) => {
    if (!window.confirm('Delete this facility?')) return;
    try { await api.delete(`/resources/facilities/${id}`); fetchAll(); }
    catch { alert('Failed to delete facility'); }
  };

  const quickStatusChange = async (id, status) => {
    try { await api.put(`/resources/facilities/${id}`, { status }); fetchAll(); }
    catch { alert('Failed to update status'); }
  };

  // ── Request handlers ──
  const handleSaveRequest = async () => {
    if (!reqForm.title || !reqForm.description || !reqForm.category) { alert('Title, description and category are required'); return; }
    try {
      await api.post('/resources/requests', reqForm);
      setShowReqModal(false); setReqForm(emptyReqForm); fetchAll();
    } catch { alert('Failed to raise request'); }
  };

  const handleRequestStatusChange = async (id, status) => {
    try { await api.put(`/resources/requests/${id}`, { status }); fetchAll(); }
    catch { alert('Failed to update status'); }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try { await api.delete(`/resources/requests/${id}`); fetchAll(); }
    catch { alert('Failed to delete request'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading resources...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Resources</span>
      </div>

      <div className="px-6 pt-4">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1 w-fit">
          {[['inventory', '📦 Inventory'], ['facilities', '🏢 Facilities'], ['requests', '🛠 Maintenance Requests']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="px-4 py-1.5 text-sm rounded-md font-medium transition"
              style={activeTab === key ? { backgroundColor: 'white', color: '#0f0f0f', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#888' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inventory Tab ── */}
      {activeTab === 'inventory' && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg">{inventory.length} Items</div>
            {canManage && (
              <button onClick={() => { setEditId(null); setInvForm(emptyInvForm); setShowInvModal(true); }}
                className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
                + Add Item
              </button>
            )}
          </div>

          {inventory.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold text-gray-700 mb-1">No inventory items yet</h3>
              {canManage && <p className="text-sm text-gray-400">Add your first item to start tracking</p>}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full" style={{ minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f6' }}>
                    {['Item', 'Category', 'Quantity', 'Condition', 'Notes', canManage ? 'Actions' : ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ backgroundColor: conditionConfig[item.condition]?.bg, color: conditionConfig[item.condition]?.color }}>
                          {conditionConfig[item.condition]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{item.notes || '—'}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditInventory(item)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDeleteInventory(item.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
        </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      )}

      {/* ── Facilities Tab ── */}

      {/* ── Facilities Tab ── */}
      {activeTab === 'facilities' && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg">{facilities.length} Facilities</div>
            {canManage && (
              <button onClick={() => { setEditId(null); setFacForm(emptyFacForm); setShowFacModal(true); }}
                className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
                + Add Facility
              </button>
            )}
          </div>

          {facilities.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-700 mb-1">No facilities yet</h3>
              {canManage && <p className="text-sm text-gray-400">Add facilities like laundry, gym, etc.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {facilities.map(f => (
                <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ backgroundColor: facilityStatusConfig[f.status]?.bg, color: facilityStatusConfig[f.status]?.color }}>
                      {facilityStatusConfig[f.status]?.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-3">{f.type}</div>
                  {f.notes && <div className="text-xs text-gray-500 mb-3">{f.notes}</div>}
                  {canManage && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                      <select value={f.status} onChange={e => quickStatusChange(f.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
                        <option value="AVAILABLE">Available</option>
                        <option value="IN_USE">In Use</option>
                        <option value="MAINTENANCE">Maintenance</option>
                      </select>
                      <button onClick={() => openEditFacility(f)} className="text-xs font-medium text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDeleteFacility(f.id)} className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Maintenance Requests Tab ── */}
      {activeTab === 'requests' && (
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <div className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                {requests.filter(r => r.status === 'PENDING').length} Pending
              </div>
              <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                {requests.filter(r => r.status === 'IN_PROGRESS').length} In Progress
              </div>
            </div>
            {!canManage && (
              <button onClick={() => { setReqForm(emptyReqForm); setShowReqModal(true); }}
                className="text-white text-sm px-4 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1a56db' }}>
                + Raise Request
              </button>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">🛠</div>
              <h3 className="font-semibold text-gray-700 mb-1">No requests yet</h3>
              <p className="text-sm text-gray-400">Raise a request if something needs fixing</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-800">{r.title}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: priorityConfig[r.priority]?.bg, color: priorityConfig[r.priority]?.color }}>
                          {priorityConfig[r.priority]?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{r.description}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: requestStatusConfig[r.status]?.bg, color: requestStatusConfig[r.status]?.color }}>
                      {requestStatusConfig[r.status]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span>📁 {r.category}</span>
                    {r.roomNumber && <span>🏠 {r.roomNumber}</span>}
                    <span>👤 {r.reportedByName} ({r.reportedByRole})</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  {canManage && r.status !== 'RESOLVED' && (
                    <div className="flex gap-2 pt-2 border-t border-gray-50">
                      {r.status === 'PENDING' && (
                        <button onClick={() => handleRequestStatusChange(r.id, 'IN_PROGRESS')}
                          className="text-xs font-medium text-blue-600 hover:underline">Mark In Progress</button>
                      )}
                      <button onClick={() => handleRequestStatusChange(r.id, 'RESOLVED')}
                        className="text-xs font-medium text-green-600 hover:underline">Mark Resolved</button>
                      <button onClick={() => handleDeleteRequest(r.id)}
                        className="text-xs font-medium text-red-500 hover:underline">Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showInvModal && <InventoryModal form={invForm} setForm={setInvForm} title={editId ? 'Save Changes' : 'Add Item'} onSave={handleSaveInventory} onClose={() => { setShowInvModal(false); setEditId(null); }} />}
      {showFacModal && <FacilityModal form={facForm} setForm={setFacForm} title={editId ? 'Save Changes' : 'Add Facility'} onSave={handleSaveFacility} onClose={() => { setShowFacModal(false); setEditId(null); }} />}
      {showReqModal && <RequestModal form={reqForm} setForm={setReqForm} title="Raise Request" onSave={handleSaveRequest} onClose={() => setShowReqModal(false)} />}
    </div>
  );
}