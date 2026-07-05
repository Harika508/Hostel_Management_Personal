import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch {
      setError('Server error. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        <div className="text-4xl mb-3">📧</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-sm text-gray-400 mb-6">
          If <strong>{email}</strong> is registered, we've sent a password reset link. It expires in 7 days.
        </p>
        <Link to="/login" className="text-sm font-medium" style={{ color: '#1a56db' }}>Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 w-96">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#1a56db' }}>H</div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">HostelOS</div>
            <div className="text-gray-400 text-xs">Reset Password</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
        <p className="text-xs text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="text-xs text-gray-500 font-medium">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm mb-4 mt-1 outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            style={{ backgroundColor: '#1a56db' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}