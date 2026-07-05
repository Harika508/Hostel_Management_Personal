import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        // Redirect based on role
      if (data.user.role === 'STUDENT') {
          navigate('/student-portal');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-96">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#1a56db' }}>H</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">HostelOS</div>
            <div className="text-gray-400 text-xs">Management Platform</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <label className="text-xs text-gray-500 font-medium">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-3 mt-1 outline-none focus:border-blue-500"
            required
          />
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500 font-medium">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#1a56db' }}>
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4 mt-1 outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400">New hostel? </span>
          <Link to="/register" className="text-xs font-medium" style={{ color: '#1a56db' }}>
            Register here
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Demo: admin@hostel.com / demo123
        </p>
      </div>
    </div>
  );
}