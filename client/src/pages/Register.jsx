import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    hostelName: '', city: '', address: '',
    adminName: '', email: '', password: '', confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hostelCode, setHostelCode] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostelName: form.hostelName, city: form.city, address: form.address,
          adminName: form.adminName, email: form.email, password: form.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHostelCode(data.user.hostelCode);
        login(data.user, data.token);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Show hostel code screen after successful registration
  if (hostelCode) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Hostel Registered!</h2>
        <p className="text-sm text-gray-500 mb-6">Save your hostel code — you'll need to share it with your tenants and staff so they can activate their accounts.</p>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-6">
          <div className="text-xs text-blue-500 font-semibold uppercase tracking-widest mb-2">Your Hostel Code</div>
          <div className="text-3xl font-black font-mono tracking-widest text-blue-700">{hostelCode}</div>
          <button
            onClick={() => { navigator.clipboard.writeText(hostelCode); alert('Copied!'); }}
            className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium underline">
            Copy to clipboard
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-left mb-6">
          <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Important</p>
          <p className="text-xs text-amber-600">Keep this code safe. Tenants and staff will need it to set their password when you approve their login.</p>
        </div>

        <button onClick={() => navigate('/dashboard')}
          className="w-full text-white rounded-lg py-3 text-sm font-semibold"
          style={{ backgroundColor: '#1a56db' }}>
          Go to Dashboard →
        </button>
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
            <div className="text-gray-400 text-xs">Management Platform</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Your Hostel</h1>
        <p className="text-xs text-gray-400 mb-6">Create your hostel account and get started</p>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Hostel Details</p>
            <label className="text-xs text-gray-500 font-medium">Hostel Name *</label>
            <input placeholder="e.g. Sunrise Hostel" value={form.hostelName}
              onChange={e => setForm(f => ({ ...f, hostelName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" required />
            <label className="text-xs text-gray-500 font-medium">City *</label>
            <input placeholder="e.g. Anantapur" value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" required />
            <label className="text-xs text-gray-500 font-medium">Address</label>
            <input placeholder="Full address" value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" />
          </div>

          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Admin Account</p>
            <label className="text-xs text-gray-500 font-medium">Your Name *</label>
            <input placeholder="e.g. Harini" value={form.adminName}
              onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" required />
            <label className="text-xs text-gray-500 font-medium">Email *</label>
            <input type="email" placeholder="admin@yourhostel.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" required />
            <label className="text-xs text-gray-500 font-medium">Password *</label>
            <input type="password" placeholder="Min 6 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 mt-1 outline-none focus:border-blue-500" required />
            <label className="text-xs text-gray-500 font-medium">Confirm Password *</label>
            <input type="password" placeholder="Repeat password" value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 mt-1 outline-none focus:border-blue-500" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}>
            {loading ? 'Creating Account...' : 'Register Hostel'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-xs text-gray-400">Already registered? </span>
          <Link to="/login" className="text-xs font-medium" style={{ color: '#1a56db' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}