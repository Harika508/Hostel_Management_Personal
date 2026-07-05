import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂',  roles: ['ADMIN', 'STAFF'], key: 'dashboard' },
  { path: '/rooms',     label: 'Rooms',     icon: '⬜', roles: ['ADMIN', 'STAFF'], key: 'rooms' },
  { path: '/students',  label: 'Tenants',   icon: '👤', roles: ['ADMIN', 'STAFF'], key: 'students' },
  { path: '/payments',  label: 'Payments',  icon: '₹',  roles: ['ADMIN', 'STAFF'], key: 'payments' },
  { path: '/food',      label: 'Food',      icon: '🍽', roles: ['ADMIN', 'STAFF'], key: 'food' },
  { path: '/staff',     label: 'Staff',     icon: '⚙',  roles: ['ADMIN', 'STAFF'], key: 'staff' },
  { path: '/access',    label: 'Access',    icon: '🔐', roles: ['ADMIN', 'STAFF'], key: 'access' },
  { path: '/resources', label: 'Resources', icon: '🧰', roles: ['ADMIN', 'STAFF'], key: 'resources' },
  { path: '/feedback',  label: 'Feedback',  icon: '💬', roles: ['ADMIN', 'STAFF'], key: 'feedback' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); onClose?.(); };

  const navItems = allNavItems.filter(item => {
    if (!item.roles.includes(user?.role || '')) return false;
    // For STAFF, filter by permissions
    if (user?.role === 'STAFF' && user?.staffPermissions) {
      return user.staffPermissions.includes(item.key);
    }
    return true;
  });

  const roleColor = {
    ADMIN:   { bg: '#1a56db', label: 'Admin' },
    STAFF:   { bg: '#7c3aed', label: 'Staff' },
    STUDENT: { bg: '#0d9488', label: 'Tenant' },
  };
  const roleInfo = roleColor[user?.role] || { bg: '#6b7280', label: user?.role };

  return (
    <div className="flex flex-col w-64 flex-shrink-0"
      style={{ backgroundColor: '#0f1117', borderRight: '1px solid #ffffff10', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #ffffff10' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#1a56db' }}>H</div>
          <div>
            <div className="text-white font-semibold text-sm">HostelOS</div>
            <div className="text-gray-400 text-xs">{user?.hostelName || 'Management'}</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">✕</button>
        )}
      </div>

      {/* Hostel Code — visible to Admin only, used when approving staff/tenants */}
      {user?.role === 'ADMIN' && user?.hostelCode && (
        <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #ffffff10', backgroundColor: '#ffffff05' }}>
          <div className="text-gray-500 text-xs uppercase font-semibold tracking-wide mb-1">Hostel Code</div>
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-mono font-bold tracking-widest">{user.hostelCode}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(user.hostelCode); }}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
              title="Copy hostel code">
              📋
            </button>
          </div>
        </div>
      )}

      {/* Nav Items */}
      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4">
        {navItems.map(item => (
          <NavLink key={item.path} to={item.path} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition ${
                isActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }>
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Staff-only: My Profile / payment details — always visible regardless of permissions */}
        {user?.role === 'STAFF' && (
          <NavLink to="/my-profile" onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition ${
                isActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }>
            <span className="text-base w-5 text-center">💳</span>
            <span>My Payment</span>
          </NavLink>
        )}
      </nav>

      {/* User Info + Logout */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderTop: '1px solid #ffffff10', backgroundColor: '#0f1117' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: roleInfo.bg }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.name}</div>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block"
              style={{ backgroundColor: roleInfo.bg + '33', color: roleInfo.bg === '#1a56db' ? '#60a5fa' : roleInfo.bg === '#7c3aed' ? '#a78bfa' : '#2dd4bf' }}>
              {roleInfo.label}
            </span>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-xs text-gray-400 hover:text-white py-2 rounded-lg hover:bg-white/5 transition text-left px-2">
          ← Logout
        </button>
      </div>
    </div>
  );
}