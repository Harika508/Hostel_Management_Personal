import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function TenantAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | error
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('No access token found in the link.');
      return;
    }

    api.post('/auth/tenant-access', { token })
      .then(res => {
        login(res.data.user, res.data.token);
        navigate('/student-portal', { replace: true });
      })
      .catch(err => {
        setStatus('error');
        setError(err.response?.data?.message || 'This access link is invalid or no longer active.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-96 text-center">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto mb-4" style={{ backgroundColor: '#1a56db' }}>H</div>

        {status === 'loading' && (
          <>
            <div className="text-sm text-gray-500">Logging you in...</div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Access Link Invalid</h2>
            <p className="text-sm text-gray-500 mb-5">{error}</p>
            <Link to="/login" className="text-sm font-medium" style={{ color: '#1a56db' }}>
              Go to Login Page →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}