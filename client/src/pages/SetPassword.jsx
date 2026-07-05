import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ hostelCode: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!form.hostelCode.trim()) { setError('Please enter your hostel code'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, hostelCode: form.hostelCode.trim(), password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        setSuccess(true);
        setTimeout(() => {
          navigate(data.user.role === 'STUDENT' ? '/student-portal' : data.user.role === 'STAFF' ? '/dashboard' : '/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Failed to set password');
      }
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-4xl mb-3">❌</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Link</h2>
        <p className="text-sm text-gray-400 mb-4">This invite link is missing or invalid. Please ask your admin to resend.</p>
        <Link to="/login" className="text-sm font-medium" style={{ color: '#1a56db' }}>Go to Login</Link>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Account Activated!</h2>
        <p className="text-sm text-gray-400 mb-6">Taking you to your dashboard...</p>
        <div className="text-xs text-gray-300">Please wait</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center py-10" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#1a56db' }}>H</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">HostelOS</div>
            <div className="text-gray-400 text-xs">Set Your Password</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Activate Your Account</h1>
        <p className="text-xs text-gray-400 mb-6">Enter your hostel code and choose a password to access your dashboard.</p>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="text-xs text-gray-500 font-medium">Hostel Code *</label>
          <input
            placeholder="e.g. SUNRISE4829"
            value={form.hostelCode}
            onChange={e => setForm(f => ({ ...f, hostelCode: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500 font-mono uppercase tracking-widest"
            required
          />
          <p className="text-xs text-gray-400 mb-4 -mt-2">Ask your hostel admin for the hostel code</p>

          <label className="text-xs text-gray-500 font-medium">New Password *</label>
          <input
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500"
            required
          />

          <label className="text-xs text-gray-500 font-medium">Confirm Password *</label>
          <input
            type="password"
            placeholder="Repeat password"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 mt-1 outline-none focus:border-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}>
            {loading ? 'Setting Password...' : 'Set Password & Activate Account'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}