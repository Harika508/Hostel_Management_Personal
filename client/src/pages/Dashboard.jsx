import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const priorityConfig = {
  LOW: { bg: '#f3f4f6', color: '#6b7280' },
  MEDIUM: { bg: '#fef3c7', color: '#b45309' },
  HIGH: { bg: '#fee2e2', color: '#dc2626' },
};

const requestStatusConfig = {
  PENDING: { bg: '#fef3c7', color: '#b45309', label: '⏳ Pending' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8', label: '🔨 In Progress' },
  RESOLVED: { bg: '#dcfce7', color: '#15803d', label: '✔ Resolved' },
};

// ── Shared mini request card used by role dashboards ──
const RequestMini = ({ r, onAdvance }) => (
  <div className="bg-white rounded-lg p-3 border border-gray-100">
    <div className="flex items-start justify-between mb-1">
      <span className="text-sm font-semibold text-gray-800">{r.title}</span>
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: requestStatusConfig[r.status]?.bg, color: requestStatusConfig[r.status]?.color }}>
        {requestStatusConfig[r.status]?.label}
      </span>
    </div>
    <p className="text-xs text-gray-500 mb-2">{r.description}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: priorityConfig[r.priority]?.bg, color: priorityConfig[r.priority]?.color }}>
          {r.priority}
        </span>
        {r.roomNumber && <span>🏠 {r.roomNumber}</span>}
      </div>
      {onAdvance && r.status !== 'RESOLVED' && (
        <button onClick={() => onAdvance(r)} className="text-xs font-medium text-blue-600 hover:underline">
          {r.status === 'PENDING' ? 'Start' : 'Mark Resolved'}
        </button>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const staffRole = user?.role === 'STAFF' ? (user?.staffRole || user?.role) : null;
  const isAdmin = user?.role === 'ADMIN';
  const isManager = staffRole === 'Manager';

  useEffect(() => {
    const calls = [api.get('/dashboard/stats').catch(() => ({ data: null }))];
    // Role-specific data fetches
    if (isAdmin || isManager || ['Cook','Cleaner','Security','Warden'].includes(staffRole)) {
      calls.push(api.get('/resources/requests').catch(() => ({ data: [] })));
    } else {
      calls.push(Promise.resolve({ data: [] }));
    }
    if (isAdmin || isManager || staffRole === 'Cook' || staffRole === 'Cleaner') {
      calls.push(api.get('/resources/inventory').catch(() => ({ data: [] })));
    } else {
      calls.push(Promise.resolve({ data: [] }));
    }
    if (isAdmin || isManager || staffRole === 'Security') {
      calls.push(api.get('/access').catch(() => ({ data: [] })));
    } else {
      calls.push(Promise.resolve({ data: [] }));
    }

    Promise.all(calls).then(([statsRes, reqRes, invRes, accessRes]) => {
      setStats(statsRes.data);
      setRequests(reqRes.data || []);
      setInventory(invRes.data || []);
      setAccessLogs(accessRes.data || []);
    }).finally(() => setLoading(false));
  }, [staffRole]);

  const advanceRequest = async (r) => {
    const nextStatus = r.status === 'PENDING' ? 'IN_PROGRESS' : 'RESOLVED';
    try {
      await api.put(`/resources/requests/${r.id}`, { status: nextStatus });
      setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: nextStatus } : x));
    } catch { alert('Failed to update request'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading dashboard...</div>
    </div>
  );

  const Topbar = ({ title }) => (
    <div className="bg-white border-b border-gray-200 flex items-center justify-between" style={{ height: '52px', paddingLeft: '52px', paddingRight: '16px' }}>
      <span className="text-sm font-semibold text-gray-800 md:pl-0" style={{ paddingLeft: '8px' }}>{title}</span>
      <span className="text-xs text-gray-400 truncate ml-2">{user?.hostelName}</span>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // COOK DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (staffRole === 'Cook') {
    const kitchenRequests = requests.filter(r => r.category === 'Kitchen Equipment' && r.status !== 'RESOLVED');
    const kitchenInventory = inventory.filter(i => i.category === 'Kitchen');
    const lowStock = kitchenInventory.filter(i => i.condition === 'OUT_OF_STOCK' || i.quantity <= 2);

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
        <Topbar title="Kitchen Dashboard" />
        <div className="p-4 md:p-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Hi {user?.name}! 🍳</h1>
          <p className="text-sm text-gray-400 mb-5">Today's meal counts and kitchen status</p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-amber-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Breakfast</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{stats?.mealBreakfast ?? '—'}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-green-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Lunch</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{stats?.mealLunch ?? '—'}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-purple-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Dinner</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{stats?.mealDinner ?? '—'}</div>
            </div>
          </div>

          <button onClick={() => navigate('/food')}
            className="w-full bg-white rounded-xl p-4 shadow-sm mb-5 flex items-center justify-between hover:bg-gray-50 transition">
            <span className="text-sm font-semibold text-gray-700">🍽 View Full Menu & Meal Plan</span>
            <span className="text-gray-400">→</span>
          </button>

          {lowStock.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <div className="text-sm font-semibold text-red-700 mb-2">⚠ Low Kitchen Stock</div>
              <div className="flex flex-col gap-1">
                {lowStock.map(item => (
                  <div key={item.id} className="text-xs text-red-600 flex justify-between">
                    <span>{item.name}</span><span className="font-mono">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Kitchen Equipment Issues</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-blue-600 hover:underline">View all →</button>
            </div>
            {kitchenRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No open kitchen issues 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {kitchenRequests.slice(0, 4).map(r => <RequestMini key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // CLEANER DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (staffRole === 'Cleaner') {
    const cleaningRequests = requests.filter(r => r.category === 'Cleaning Supplies' && r.status !== 'RESOLVED');
    const supplies = inventory.filter(i => i.category === 'Cleaning Supplies');
    const lowSupplies = supplies.filter(i => i.condition === 'OUT_OF_STOCK' || i.quantity <= 2);

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
        <Topbar title="Cleaning Dashboard" />
        <div className="p-4 md:p-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Hi {user?.name}! 🧹</h1>
          <p className="text-sm text-gray-400 mb-5">Cleaning supplies and sanitation requests</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Supplies Tracked</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{supplies.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-red-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Running Low</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{lowSupplies.length}</div>
            </div>
          </div>

          {lowSupplies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <div className="text-sm font-semibold text-red-700 mb-2">⚠ Restock Needed</div>
              <div className="flex flex-col gap-1">
                {lowSupplies.map(item => (
                  <div key={item.id} className="text-xs text-red-600 flex justify-between">
                    <span>{item.name}</span><span className="font-mono">{item.quantity} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Sanitation Requests</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-blue-600 hover:underline">View all →</button>
            </div>
            {cleaningRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No open cleaning issues 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cleaningRequests.slice(0, 4).map(r => <RequestMini key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // SECURITY DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (staffRole === 'Security') {
    const securityRequests = requests.filter(r => r.category === 'Security/Locks' && r.status !== 'RESOLVED');
    const recentLogs = [...accessLogs].sort((a,b) => new Date(b.accessTime) - new Date(a.accessTime)).slice(0, 6);

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
        <Topbar title="Security Dashboard" />
        <div className="p-4 md:p-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Hi {user?.name}! 🔐</h1>
          <p className="text-sm text-gray-400 mb-5">Gate activity and security issues</p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-blue-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Today's Access Events</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {accessLogs.filter(l => new Date(l.accessTime).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-t-4 border-red-400">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Open Security Issues</div>
              <div className="text-2xl font-bold text-gray-900 font-mono">{securityRequests.length}</div>
            </div>
          </div>

          <button onClick={() => navigate('/access')}
            className="w-full bg-white rounded-xl p-4 shadow-sm mb-5 flex items-center justify-between hover:bg-gray-50 transition">
            <span className="text-sm font-semibold text-gray-700">🔐 View Full Access Log</span>
            <span className="text-gray-400">→</span>
          </button>

          <div className="bg-white rounded-xl p-4 shadow-sm mb-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Recent Access Activity</h2>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No recent activity</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-xs border-b border-gray-50 pb-2 last:border-0">
                    <span className="text-gray-700 font-medium">{log.student?.name || 'Unknown'}</span>
                    <span className="font-mono text-gray-400">{log.nfcCardId}</span>
                    <span className="text-gray-400">{new Date(log.accessTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Gate / Lock Issues</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-blue-600 hover:underline">View all →</button>
            </div>
            {securityRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No open security issues 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {securityRequests.slice(0, 4).map(r => <RequestMini key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // WARDEN DASHBOARD
  // ══════════════════════════════════════════════════════════
  if (staffRole === 'Warden') {
    const roomRequests = requests.filter(r => ['Furniture','Electrical','Plumbing'].includes(r.category) && r.status !== 'RESOLVED');

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
        <Topbar title="Warden Dashboard" />
        <div className="p-4 md:p-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Hi {user?.name}! 🏠</h1>
          <p className="text-sm text-gray-400 mb-5">Tenant check-ins, rooms, and issues</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Tenants', value: stats?.totalStudents ?? 0, color: '#3b82f6' },
              { label: 'Occupied Beds', value: stats?.occupied ?? 0, color: '#22c55e' },
              { label: 'Vacant Beds', value: stats?.vacant ?? 0, color: '#f59e0b' },
              { label: 'KYC Pending', value: stats?.pendingKyc ?? 0, color: '#7c3aed' },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-xl p-3 shadow-sm" style={{ borderTop: `4px solid ${card.color}` }}>
                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{card.label}</div>
                <div className="text-2xl font-bold text-gray-900 font-mono">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button onClick={() => navigate('/students')}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition">
              <span className="text-xl">👤</span>
              <span className="text-sm font-semibold text-gray-700">Manage Tenants</span>
            </button>
            <button onClick={() => navigate('/rooms')}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition">
              <span className="text-xl">🛏</span>
              <span className="text-sm font-semibold text-gray-700">Manage Rooms</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Room-Level Issues</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-blue-600 hover:underline">View all →</button>
            </div>
            {roomRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No open room issues 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {roomRequests.slice(0, 4).map(r => <RequestMini key={r.id} r={r} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // ADMIN / MANAGER / DEFAULT DASHBOARD (original view)
  // ══════════════════════════════════════════════════════════
  const pendingRequests = requests.filter(r => r.status !== 'RESOLVED');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <Topbar title="Dashboard" />

      <div className="p-4 md:p-6">
        <div className="mb-5">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-sm text-gray-400 mt-1">{user?.hostelName} — Real-time overview</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
          {[
            { label: 'Total Beds', value: stats?.totalBeds ?? 0, sub: `${stats?.totalRooms ?? 0} rooms`, color: '#3b82f6' },
            { label: 'Occupied', value: stats?.occupied ?? 0, sub: `${stats?.totalBeds ? Math.round((stats.occupied / stats.totalBeds) * 100) : 0}% occupancy`, color: '#22c55e' },
            { label: 'Vacant', value: stats?.vacant ?? 0, sub: `${stats?.leavingSoon ?? 0} leaving soon`, color: '#f59e0b' },
            { label: 'Pending', value: `₹${stats?.pendingAmount ? (stats.pendingAmount / 1000).toFixed(1) + 'k' : '0'}`, sub: `${stats?.pendingPayments ?? 0} unpaid`, color: '#7c3aed' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl p-3 md:p-4 shadow-sm" style={{ borderTop: `4px solid ${card.color}` }}>
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1 md:mb-2 leading-tight">{card.label}</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{card.value}</div>
              <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between md:block">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide md:mb-2">Total Tenants</div>
            <div className="flex items-center gap-3 md:block">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{stats?.totalStudents ?? 0}</div>
              <div className="text-xs text-amber-500 md:mt-1">{stats?.pendingKyc ?? 0} KYC pending</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between md:block">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide md:mb-2">Leaving This Week</div>
            <div className="flex items-center gap-3 md:block">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{stats?.leavingThisWeek ?? 0}</div>
              <div className="text-xs text-gray-400 md:mt-1">Check-outs scheduled</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between md:block">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide md:mb-2">
              {isAdmin || isManager ? 'Open Maintenance Requests' : 'KYC Pending'}
            </div>
            <div className="flex items-center gap-3 md:block">
              <div className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">
                {isAdmin || isManager ? pendingRequests.length : (stats?.pendingKyc ?? 0)}
              </div>
              <div className="text-xs text-gray-400 md:mt-1">{isAdmin || isManager ? 'Need attention' : 'Need verification'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm mb-4">
          <h2 className="text-sm font-bold text-gray-700 mb-3 md:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[
              { label: 'Add Room', icon: '🛏', path: '/rooms', color: '#1a56db' },
              { label: 'Add Tenant', icon: '🏠', path: '/students', color: '#7c3aed' },
              { label: 'Add Payment', icon: '💰', path: '/payments', color: '#15803d' },
              { label: 'Add Staff', icon: '👨‍💼', path: '/staff', color: '#b45309' },
            ].map(action => (
              <button key={action.label} onClick={() => navigate(action.path)}
                className="flex items-center gap-2 md:gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition text-left">
                <span className="text-lg md:text-xl">{action.icon}</span>
                <span className="text-xs md:text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manager/Admin also see all open maintenance requests at a glance */}
        {(isAdmin || isManager) && (
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Open Maintenance Requests (All Categories)</h2>
              <button onClick={() => navigate('/resources')} className="text-xs text-blue-600 hover:underline">Manage →</button>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">All caught up! No open requests 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingRequests.slice(0, 6).map(r => <RequestMini key={r.id} r={r} onAdvance={advanceRequest} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}