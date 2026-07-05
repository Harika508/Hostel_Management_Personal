import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe',  color: '#5f259f', emoji: '💜' },
  { id: 'gpay',    label: 'Google Pay', color: '#1a73e8', emoji: '💙' },
  { id: 'paytm',   label: 'Paytm',    color: '#002970', emoji: '🔵' },
  { id: 'upi',     label: 'Any UPI',  color: '#ff6b00', emoji: '💳' },
];

// ── Warden Dashboard ────────────────────────────────────────────────
function WardenWidgets() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(console.error);
  }, []);
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-500">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Total Tenants</div>
        <div className="text-2xl font-bold text-gray-900 font-mono">{data.totalStudents ?? 0}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-amber-500">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">KYC Pending</div>
        <div className="text-2xl font-bold text-amber-600 font-mono">{data.pendingKyc ?? 0}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-purple-500">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Leaving This Week</div>
        <div className="text-2xl font-bold text-gray-900 font-mono">{data.leavingThisWeek ?? 0}</div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-green-500">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Vacant Beds</div>
        <div className="text-2xl font-bold text-gray-900 font-mono">{data.vacant ?? 0}</div>
      </div>
    </div>
  );
}

// ── Cook Dashboard ──────────────────────────────────────────────────
function CookWidgets() {
  const [summary, setSummary] = useState(null);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  useEffect(() => {
    api.get('/mealplan/summary').then(r => setSummary(r.data)).catch(console.error);
  }, []);
  const todayData = summary?.summary?.find(d => d.day === today);
  return (
    <div className="mb-4">
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Today's Meal Count</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Breakfast', value: todayData?.breakfast ?? 0, color: '#f59e0b', bg: '#fef3c7' },
            { label: 'Lunch', value: todayData?.lunch ?? 0, color: '#22c55e', bg: '#dcfce7' },
            { label: 'Dinner', value: todayData?.dinner ?? 0, color: '#7c3aed', bg: '#ede9fe' },
          ].map(meal => (
            <div key={meal.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: meal.bg }}>
              <div className="text-xs font-semibold mb-1" style={{ color: meal.color }}>{meal.label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: meal.color }}>{meal.value}</div>
              <div className="text-xs text-gray-400">tenants</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
        <p className="text-xs text-amber-700">👨‍🍳 Plan your cooking based on today's tenant meal preferences</p>
      </div>
    </div>
  );
}

// ── Security Dashboard ──────────────────────────────────────────────
function SecurityWidgets() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    api.get('/access').then(r => setLogs(r.data)).catch(console.error);
  }, []);
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.accessTime).toDateString() === today);
  const recentLogs = logs.slice(0, 5);
  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-500">
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Today</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{todayLogs.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-green-500">
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Entries</div>
          <div className="text-2xl font-bold text-green-600 font-mono">{todayLogs.filter(l => l.accessType === 'ENTRY').length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-amber-500">
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Exits</div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{todayLogs.filter(l => l.accessType === 'EXIT').length}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Recent Activity</div>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No access logs yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">{log.student?.name || '—'}</div>
                  <div className="text-xs text-gray-400">{new Date(log.accessTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${log.accessType === 'ENTRY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {log.accessType === 'ENTRY' ? '🚪 Entry' : '🚶 Exit'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cleaner Dashboard ───────────────────────────────────────────────
function CleanerWidgets() {
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    api.get('/rooms').then(r => setRooms(r.data)).catch(console.error);
  }, []);
  const totalBeds = rooms.reduce((a, r) => a + r.totalBeds, 0);
  const occupied = rooms.reduce((a, r) => a + r.occupiedBeds, 0);
  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-500">
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Total Rooms</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{rooms.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-green-500">
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Occupied Beds</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{occupied}/{totalBeds}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Room Occupancy</div>
        <div className="flex flex-col gap-2">
          {rooms.slice(0, 6).map(room => (
            <div key={room.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <span className="text-sm font-mono font-semibold text-gray-700">{room.roomNumber}</span>
                <span className="text-xs text-gray-400 ml-2">{room.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-600">{room.occupiedBeds}/{room.totalBeds} occupied</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Manager Dashboard ───────────────────────────────────────────────
function ManagerWidgets() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(console.error);
  }, []);
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {[
        { label: 'Total Beds', value: data.totalBeds ?? 0, color: '#3b82f6' },
        { label: 'Occupied', value: data.occupied ?? 0, color: '#22c55e' },
        { label: 'Total Tenants', value: data.totalStudents ?? 0, color: '#7c3aed' },
        { label: 'Pending Payments', value: `₹${data.pendingAmount ? (data.pendingAmount/1000).toFixed(1)+'k' : '0'}`, color: '#f59e0b' },
      ].map(card => (
        <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border-t-4" style={{ borderTopColor: card.color }}>
          <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">{card.label}</div>
          <div className="text-2xl font-bold text-gray-900 font-mono">{card.value}</div>
        </div>
      ))}
    </div>
  );
}

const ROLE_WIDGETS = {
  Warden: WardenWidgets,
  Cook: CookWidgets,
  Security: SecurityWidgets,
  Cleaner: CleanerWidgets,
  Manager: ManagerWidgets,
};

export default function StaffPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [myData, setMyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({ upiId: '', upiPhone: '', paymentMethod: 'gpay' });

  useEffect(() => {
    api.get('/staff/me')
      .then(r => {
        setMyData(r.data);
        setPayForm({
          upiId: r.data.upiId || '',
          upiPhone: r.data.upiPhone || '',
          paymentMethod: r.data.paymentMethod || 'gpay',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const savePaymentDetails = async () => {
    if (!payForm.upiId && !payForm.upiPhone) {
      alert('Please enter at least your UPI ID or phone number');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/staff/${myData.id}/payment-details`, payForm);
      alert('✅ Payment details saved! Admin will see these when paying your salary.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading your portal...</div>
    </div>
  );

  const tabs = [
    { key: 'home',    label: '🏠 Home' },
    { key: 'payment', label: '💳 My Payment' },
    { key: 'salary',  label: '💰 Salary History' },
  ];

  const RoleWidget = ROLE_WIDGETS[myData?.role];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#7c3aed' }}>H</div>
          <span className="text-sm font-semibold text-gray-800">HostelOS</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-500">Staff Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Hi, {user?.name}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">Logout</button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-3 text-sm font-medium transition border-b-2"
              style={activeTab === tab.key ? { borderBottomColor: '#7c3aed', color: '#7c3aed' } : { borderBottomColor: 'transparent', color: '#9ca3af' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        {activeTab === 'home' && (
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome, {user?.name}! 👋</h1>
            <p className="text-sm text-gray-400 mb-6">{user?.hostelName} — {myData?.role} Dashboard</p>

            {/* Role-specific widgets */}
            {RoleWidget ? <RoleWidget /> : (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-purple-500">
                  <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Role</div>
                  <div className="text-xl font-bold text-gray-900">{myData?.role || '—'}</div>
                  <div className="text-xs text-gray-400 mt-1">{myData?.email}</div>
                </div>
              </div>
            )}

            {/* Salary status — always shown */}
            <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 mb-4"
              style={{ borderTopColor: myData?.salaryStatus === 'PAID' ? '#22c55e' : '#ef4444' }}>
              <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Salary Status</div>
              <div className="text-xl font-bold" style={{ color: myData?.salaryStatus === 'PAID' ? '#15803d' : '#dc2626' }}>
                {myData?.salaryStatus === 'PAID' ? '✅ Paid' : '⚠️ Pending'}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-mono">₹{myData?.monthlySalary?.toLocaleString()}/month</div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Payment Details</div>
              {myData?.upiId || myData?.upiPhone ? (
                <div className="flex flex-col gap-2">
                  {myData.upiId && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-24">UPI ID</span>
                      <span className="text-sm font-mono text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">{myData.upiId}</span>
                    </div>
                  )}
                  {myData.upiPhone && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-24">Phone</span>
                      <span className="text-sm font-mono text-gray-800 bg-gray-50 px-3 py-1 rounded-lg">{myData.upiPhone}</span>
                    </div>
                  )}
                  <button onClick={() => setActiveTab('payment')} className="text-xs text-purple-600 hover:underline mt-1 text-left">Edit payment details →</button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">You haven't added your payment details yet.</p>
                  <button onClick={() => setActiveTab('payment')} className="text-white text-sm px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: '#7c3aed' }}>
                    + Add Payment Details
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">My Payment Details</div>
            <p className="text-xs text-gray-400 mb-6">Add your UPI ID or phone number so admin can pay your salary directly.</p>
            <label className="text-xs text-gray-500 font-medium">UPI ID</label>
            <input placeholder="e.g. yourname@paytm or 9876543210@ybl" value={payForm.upiId}
              onChange={e => setPayForm(f => ({ ...f, upiId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 mt-1 outline-none focus:border-purple-500" />
            <label className="text-xs text-gray-500 font-medium">Phone Number (linked to UPI)</label>
            <input placeholder="e.g. 9876543210" value={payForm.upiPhone}
              onChange={e => setPayForm(f => ({ ...f, upiPhone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 mt-1 outline-none focus:border-purple-500" />
            <label className="text-xs text-gray-500 font-medium">Preferred Payment App</label>
            <div className="grid grid-cols-4 gap-2 mt-2 mb-6">
              {UPI_APPS.map(app => (
                <button key={app.id} onClick={() => setPayForm(f => ({ ...f, paymentMethod: app.id }))}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition"
                  style={payForm.paymentMethod === app.id ? { borderColor: app.color, backgroundColor: app.color + '15' } : { borderColor: '#e5e7eb', backgroundColor: 'white' }}>
                  <span className="text-2xl">{app.emoji}</span>
                  <span className="text-xs font-medium" style={{ color: payForm.paymentMethod === app.id ? app.color : '#6b7280' }}>{app.label}</span>
                </button>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex gap-2">
              <span>ℹ️</span>
              <p className="text-xs text-amber-700">Your payment details will only be visible to the hostel admin.</p>
            </div>
            <button onClick={savePaymentDetails} disabled={saving}
              className="w-full text-white text-sm py-3 rounded-xl font-semibold disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>
              {saving ? 'Saving...' : '💾 Save Payment Details'}
            </button>
          </div>
        )}

        {activeTab === 'salary' && (
          <div>
            <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
              <div className="text-sm font-bold text-gray-800 mb-1">Current Month</div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <div className="text-3xl font-bold font-mono text-gray-900">₹{myData?.monthlySalary?.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Monthly Salary</div>
                </div>
                <span className={`text-sm font-bold px-4 py-2 rounded-xl ${myData?.salaryStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {myData?.salaryStatus === 'PAID' ? '✅ Paid' : '⚠️ Pending'}
                </span>
              </div>
              {myData?.salaryStatus === 'PAID' && myData?.salaryPaidDate && (
                <div className="text-xs text-green-600 mt-2">Paid on {new Date(myData.salaryPaidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              )}
              {myData?.txnRef && <div className="text-xs text-gray-400 mt-1 font-mono">Ref: {myData.txnRef}</div>}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700">Salary history across months will appear here as admin processes monthly payments.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}