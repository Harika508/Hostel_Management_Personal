import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const mealColors = {
  Breakfast: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', dot: '#f59e0b' },
  Lunch:     { bg: '#dcfce7', border: '#22c55e', text: '#15803d', dot: '#22c55e' },
  Dinner:    { bg: '#ede9fe', border: '#7c3aed', text: '#6d28d9', dot: '#7c3aed' },
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_KEYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const MEALS = ['Breakfast','Lunch','Dinner'];

const defaultMenu = {
  Monday:    { Breakfast: 'Idli Sambar, Coffee', Lunch: 'Rice, Dal, Sabzi, Papad', Dinner: 'Chapati, Paneer Curry, Rice' },
  Tuesday:   { Breakfast: 'Poha, Tea', Lunch: 'Rice, Rajma, Salad', Dinner: 'Chapati, Dal Tadka, Rice' },
  Wednesday: { Breakfast: 'Upma, Coffee', Lunch: 'Rice, Sambar, Papad', Dinner: 'Chapati, Aloo Curry, Rice' },
  Thursday:  { Breakfast: 'Dosa, Chutney, Tea', Lunch: 'Rice, Chole, Salad', Dinner: 'Chapati, Mix Veg, Rice' },
  Friday:    { Breakfast: 'Bread Butter, Omelette, Tea', Lunch: 'Rice, Dal Fry, Papad', Dinner: 'Chapati, Palak Paneer, Rice' },
  Saturday:  { Breakfast: 'Puri Bhaji, Tea', Lunch: 'Biryani, Raita, Salad', Dinner: 'Chapati, Dal Makhani, Rice' },
  Sunday:    { Breakfast: 'Idli Vada, Coffee', Lunch: 'Special Thali, Sweet', Dinner: 'Chapati, Shahi Paneer, Rice' },
};

const statusConfig = {
  PAID:    { color: '#22c55e', bg: '#dcfce7', label: '✔ Paid' },
  PARTIAL: { color: '#f59e0b', bg: '#fef3c7', label: '◐ Partial' },
  UNPAID:  { color: '#ef4444', bg: '#fee2e2', label: '✘ Unpaid' },
};

const categoryOptions = [
  { value: 'FOOD',    label: '🍽 Food' },
  { value: 'ROOM',    label: '🛏 Room' },
  { value: 'STAFF',   label: '⚙ Staff' },
  { value: 'GENERAL', label: '💬 General' },
];

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className="text-2xl transition" style={{ color: s <= value ? '#f59e0b' : '#d1d5db' }}>★</button>
    ))}
  </div>
);

export default function StudentPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [myData, setMyData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mealPlan, setMealPlan] = useState({});
  const [mealPlanSaving, setMealPlanSaving] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [fbForm, setFbForm] = useState({ category: 'GENERAL', rating: 5, message: '' });
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const menu = (() => {
    try { return JSON.parse(localStorage.getItem('hostel_menu')) || defaultMenu; }
    catch { return defaultMenu; }
  })();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const payRes = await api.get('/payments/my');
        setPayments(payRes.data.payments || []);
        const studentId = payRes.data.student?.id || user?.studentId;
        if (studentId) {
          const [foodRes, planRes, fbRes] = await Promise.all([
            api.get(`/food/${studentId}`),
            api.get(`/mealplan/${studentId}`),
            api.get('/feedback/my'),
          ]);
          setMyData(foodRes.data);
          const planMap = {};
          (planRes.data || []).forEach(p => { planMap[p.day] = p; });
          setMealPlan(planMap);
          setFeedbacks(fbRes.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load your data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  const toggleMealPlan = async (dayKey, meal) => {
    const studentId = myData?.id || user?.studentId;
    if (!studentId) return;
    const field = meal.toLowerCase();
    const current = mealPlan[dayKey] || { breakfast: false, lunch: false, dinner: false };
    const newVal = !current[field];
    const updated = { ...current, [field]: newVal };
    setMealPlan(prev => ({ ...prev, [dayKey]: updated }));
    setMealPlanSaving(true);
    try {
      await api.put(`/mealplan/${studentId}`, {
        day: dayKey, breakfast: updated.breakfast, lunch: updated.lunch, dinner: updated.dinner,
      });
    } catch { alert('Failed to update meal plan'); }
    finally { setMealPlanSaving(false); }
  };

  const submitFeedback = async () => {
    if (!fbForm.message.trim()) { alert('Please write a message'); return; }
    setFbSubmitting(true);
    try {
      const res = await api.post('/feedback', fbForm);
      setFeedbacks(prev => [res.data, ...prev]);
      setFbForm({ category: 'GENERAL', rating: 5, message: '' });
      setFbSuccess(true);
      setTimeout(() => setFbSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setFbSubmitting(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading your portal...</div>
    </div>
  );

  const pendingPayments = payments.filter(p => p.status !== 'PAID');
const totalDue = pendingPayments.reduce((acc, p) => {
  const due = (p.amount + (p.gstAmount || 0) - (p.tdsAmount || 0)) - p.paidAmount;
  return acc + Math.max(0, due);
}, 0);
const totalPaid = payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  const tabs = [
    { key: 'home',     label: '🏠', fullLabel: 'Home' },
    { key: 'menu',     label: '🍽', fullLabel: 'Menu' },
    { key: 'meals',    label: '🍱', fullLabel: 'My Meals' },
    { key: 'payments', label: '💰', fullLabel: 'Payments' },
    { key: 'feedback', label: '💬', fullLabel: 'Feedback' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>

      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between" style={{ height: '52px' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: '#1a56db' }}>H</div>
          <span className="text-sm font-semibold text-gray-800">HostelOS</span>
          <span className="hidden sm:inline text-xs text-gray-300">|</span>
          <span className="hidden sm:inline text-xs text-gray-500">Tenant Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:inline">Hi, {user?.name}</span>
          <button onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg">
            Logout
          </button>
        </div>
      </div>

      {/* Tab bar — mobile friendly bottom-style tabs */}
      <div className="bg-white border-b border-gray-100 px-2">
        <div className="flex">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex flex-col items-center py-2 text-xs font-medium transition border-b-2"
              style={activeTab === tab.key
                ? { borderBottomColor: '#1a56db', color: '#1a56db' }
                : { borderBottomColor: 'transparent', color: '#9ca3af' }}>
              <span className="text-lg leading-tight">{tab.label}</span>
              <span className="text-xs mt-0.5 leading-tight">
                {tab.fullLabel}
                {tab.key === 'payments' && pendingPayments.length > 0 && (
                  <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1 font-bold">
                    {pendingPayments.length}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">{error}</div>}

      <div className="p-4 max-w-2xl mx-auto">

        {/* ── HOME ── */}
        {activeTab === 'home' && (
          <div>
            <h1 className="text-lg font-bold text-gray-900 mb-0.5">Welcome, {user?.name}! 👋</h1>
            <p className="text-xs text-gray-400 mb-4">{user?.hostelName}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">My Room</div>
                {myData?.bed ? (
                  <>
                    <div className="text-xl font-bold text-gray-900 font-mono">{myData.bed.room?.roomNumber}</div>
                    <div className="text-xs text-gray-500 mt-1">Bed: {myData.bed.bedLabel}</div>
                    <div className="text-xs text-gray-400">Floor {myData.bed.room?.floor}</div>
                  </>
                ) : <div className="text-xs text-gray-400">No room assigned yet</div>}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm"
                style={{ borderTop: `3px solid ${totalDue > 0 ? '#ef4444' : '#22c55e'}` }}>
                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Payments</div>
                {payments.length === 0 ? (
                  <div className="text-xs text-gray-400">No records yet</div>
                ) : totalDue > 0 ? (
                  <>
                    <div className="text-xl font-bold text-red-600 font-mono">₹{totalDue.toLocaleString()}</div>
                    <div className="text-xs text-red-400 mt-1">{pendingPayments.length} pending</div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-green-600">✔ Clear</div>
                    <div className="text-xs text-green-500 mt-1">₹{totalPaid.toLocaleString()} paid</div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-3">Today's Menu — {today}</div>
              <div className="flex flex-col gap-2">
                {MEALS.map(meal => (
                  <div key={meal} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: mealColors[meal].bg }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: mealColors[meal].dot }} />
                    <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: mealColors[meal].text }}>{meal}</span>
                    <span className="text-xs text-gray-700">{menu[today]?.[meal] || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MENU ── */}
        {activeTab === 'menu' && (
          <div>
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4 border-l-4 border-blue-500">
              <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Today — {today}</div>
              <div className="flex flex-col gap-2">
                {MEALS.map(meal => (
                  <div key={meal} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: mealColors[meal].dot }} />
                    <span className="text-xs font-semibold w-16 flex-shrink-0" style={{ color: mealColors[meal].text }}>{meal}</span>
                    <span className="text-xs text-gray-700">{menu[today]?.[meal] || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile-friendly card layout instead of table */}
            <div className="flex flex-col gap-3">
              {DAYS.map(day => (
                <div key={day} className="bg-white rounded-xl p-4 shadow-sm"
                  style={{ borderLeft: day === today ? '4px solid #1a56db' : '4px solid transparent' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-gray-800">{day}</span>
                    {day === today && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-medium">Today</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {MEALS.map(meal => (
                      <div key={meal} className="flex items-start gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: mealColors[meal].bg }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: mealColors[meal].dot }} />
                        <span className="text-xs font-semibold w-14 flex-shrink-0" style={{ color: mealColors[meal].text }}>{meal}</span>
                        <span className="text-xs text-gray-700">{menu[day]?.[meal] || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MY MEALS ── */}
        {activeTab === 'meals' && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-bold text-gray-800">Weekly Meal Plan</div>
              {mealPlanSaving && <span className="text-xs text-blue-500">Saving...</span>}
            </div>
            <p className="text-xs text-gray-400 mb-4">Tap to select meals per day. Admin sees your count.</p>

            {/* Mobile: each meal as a card with day buttons */}
            <div className="flex flex-col gap-4">
              {MEALS.map(meal => {
                const field = meal.toLowerCase();
                return (
                  <div key={meal} className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-3 py-2 flex items-center gap-2"
                      style={{ backgroundColor: mealColors[meal].bg }}>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
                      <span className="text-sm font-semibold" style={{ color: mealColors[meal].text }}>{meal}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 p-2">
                      {DAY_KEYS.map((dayKey, di) => {
                        const opted = mealPlan[dayKey]?.[field] || false;
                        return (
                          <button key={dayKey}
                            onClick={() => toggleMealPlan(dayKey, meal)}
                            className="flex flex-col items-center py-2 rounded-lg transition"
                            style={opted
                              ? { backgroundColor: mealColors[meal].dot, color: 'white' }
                              : { backgroundColor: '#f3f4f6', color: '#9ca3af' }}>
                            <span className="text-xs font-semibold">{DAYS[di].slice(0,1)}</span>
                            <span className="text-xs mt-0.5">{opted ? '✓' : '·'}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="px-3 pb-2 flex gap-1">
                      {DAY_KEYS.map((_, di) => (
                        <div key={di} className="flex-1 text-center">
                          <span className="text-xs text-gray-400">{DAYS[di].slice(0,3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-amber-400 flex items-center justify-center text-white text-xs font-bold">✓</div>
                <span className="text-xs text-gray-500">Taking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">·</div>
                <span className="text-xs text-gray-500">Not taking</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <div>
            {payments.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['PAID','PARTIAL','UNPAID'].map(status => {
                  const cfg = statusConfig[status];
                  const filtered = payments.filter(p => p.status === status);
                  const total = filtered.reduce((acc, p) => acc + p.amount, 0);
                  return (
                    <div key={status} className="bg-white rounded-xl p-3 shadow-sm" style={{ borderTop: `3px solid ${cfg.color}` }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-xl font-bold font-mono text-gray-900">{filtered.length}</div>
                      <div className="text-xs text-gray-400">₹{total.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {payments.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-semibold text-gray-700 text-sm">No payment records</h3>
                <p className="text-xs text-gray-400 mt-1">Your admin will add payment records</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {payments.map(p => {
                  const cfg = statusConfig[p.status] || statusConfig.UNPAID;
                  const totalDueP = p.amount + (p.gstAmount || 0) - (p.tdsAmount || 0);
                  const remaining = totalDueP - p.paidAmount;
                  return (
                    <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4" style={{ borderLeftColor: cfg.color }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            Due: {new Date(p.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          {p.status === 'PAID' && p.paidDate && (
                            <div className="text-xs text-green-600 mt-0.5">Paid on {new Date(p.paidDate).toLocaleDateString('en-IN')}</div>
                          )}
                        </div>
                        <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div className="flex items-end gap-3 flex-wrap">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Total</div>
                          <div className="text-xl font-bold font-mono text-gray-900">₹{totalDueP.toLocaleString()}</div>
                        </div>
                        {p.status === 'PARTIAL' && (
                          <>
                            <div><div className="text-xs text-gray-400 mb-0.5">Paid</div><div className="text-base font-bold font-mono text-green-600">₹{p.paidAmount.toLocaleString()}</div></div>
                            <div><div className="text-xs text-gray-400 mb-0.5">Remaining</div><div className="text-base font-bold font-mono text-red-500">₹{remaining.toLocaleString()}</div></div>
                          </>
                        )}
                      </div>
                      {p.status === 'PARTIAL' && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${Math.min((p.paidAmount / totalDueP) * 100, 100)}%` }} />
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{Math.round((p.paidAmount / totalDueP) * 100)}% paid</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {activeTab === 'feedback' && (
          <div>
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="text-sm font-bold text-gray-800 mb-1">Share Your Feedback</div>
              <p className="text-xs text-gray-400 mb-4">Help us improve by sharing your experience.</p>

              {fbSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
                  ✅ Feedback submitted!
                </div>
              )}

              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium">Category</label>
                <select value={fbForm.category} onChange={e => setFbForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500">
                  {categoryOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs text-gray-500 font-medium">Rating</label>
                <div className="mt-1">
                  <StarPicker value={fbForm.rating} onChange={v => setFbForm(f => ({ ...f, rating: v }))} />
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-500 font-medium">Message *</label>
                <textarea rows={3} placeholder="Write your feedback here..."
                  value={fbForm.message} onChange={e => setFbForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 outline-none focus:border-blue-500 resize-none" />
              </div>

              <button onClick={submitFeedback} disabled={fbSubmitting}
                className="w-full text-white text-sm py-2.5 rounded-lg font-medium disabled:opacity-50"
                style={{ backgroundColor: '#1a56db' }}>
                {fbSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>

            {feedbacks.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">My Previous Feedback</div>
                <div className="flex flex-col gap-3">
                  {feedbacks.map(f => (
                    <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                            {categoryOptions.find(c => c.value === f.category)?.label || f.category}
                          </span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <span key={s} className="text-xs" style={{ color: s <= f.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{f.message}</p>
                      <div className="mt-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          f.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                          f.status === 'READ' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {f.status === 'RESOLVED' ? '✔ Resolved' : f.status === 'READ' ? '● Read by admin' : '● Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}