import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
        <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}