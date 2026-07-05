import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const UPI_APPS = [
  { id: 'phonepe', label: 'PhonePe',  color: '#5f259f', emoji: '💜' },
  { id: 'gpay',    label: 'Google Pay', color: '#1a73e8', emoji: '💙' },
  { id: 'paytm',   label: 'Paytm',    color: '#002970', emoji: '🔵' },
  { id: 'upi',     label: 'Any UPI',  color: '#ff6b00', emoji: '💳' },
];

export default function MyProfile() {
  const { user } = useAuth();
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
      alert('✅ Payment details saved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">My Profile</span>
      </div>

      <div className="p-4 md:p-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border-t-4 border-purple-500">
            <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Role</div>
            <div className="text-xl font-bold text-gray-900">{myData?.role || '—'}</div>
            <div className="text-xs text-gray-400 mt-1">{myData?.email}</div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-t-4"
            style={{ borderTopColor: myData?.salaryStatus === 'PAID' ? '#22c55e' : '#ef4444' }}>
            <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Salary Status</div>
            <div className="text-xl font-bold" style={{ color: myData?.salaryStatus === 'PAID' ? '#15803d' : '#dc2626' }}>
              {myData?.salaryStatus === 'PAID' ? '✅ Paid' : '⚠️ Pending'}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-mono">₹{myData?.monthlySalary?.toLocaleString()}/month</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Payment Details</div>
          <p className="text-xs text-gray-400 mb-6">Add your UPI ID so admin can pay your salary directly.</p>

          <label className="text-xs text-gray-500 font-medium">UPI ID</label>
          <input placeholder="e.g. yourname@paytm" value={payForm.upiId}
            onChange={e => setPayForm(f => ({ ...f, upiId: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 mt-1 outline-none focus:border-purple-500" />

          <label className="text-xs text-gray-500 font-medium">Phone Number</label>
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

          <button onClick={savePaymentDetails} disabled={saving}
            className="w-full text-white text-sm py-3 rounded-xl font-semibold disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>
            {saving ? 'Saving...' : '💾 Save Payment Details'}
          </button>
        </div>
      </div>
    </div>
  );
}