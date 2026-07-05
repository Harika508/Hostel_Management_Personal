import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS = ['Breakfast','Lunch','Dinner'];

const mealColors = {
  Breakfast: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', dot: '#f59e0b', bar: '#f59e0b' },
  Lunch:     { bg: '#dcfce7', border: '#22c55e', text: '#15803d', dot: '#22c55e', bar: '#22c55e' },
  Dinner:    { bg: '#ede9fe', border: '#7c3aed', text: '#6d28d9', dot: '#7c3aed', bar: '#7c3aed' },
};

const defaultMenu = {
  Monday:    { Breakfast: 'Idli Sambar, Coffee', Lunch: 'Rice, Dal, Sabzi, Papad', Dinner: 'Chapati, Paneer Curry, Rice' },
  Tuesday:   { Breakfast: 'Poha, Tea', Lunch: 'Rice, Rajma, Salad', Dinner: 'Chapati, Dal Tadka, Rice' },
  Wednesday: { Breakfast: 'Upma, Coffee', Lunch: 'Rice, Sambar, Papad', Dinner: 'Chapati, Aloo Curry, Rice' },
  Thursday:  { Breakfast: 'Dosa, Chutney, Tea', Lunch: 'Rice, Chole, Salad', Dinner: 'Chapati, Mix Veg, Rice' },
  Friday:    { Breakfast: 'Bread Butter, Omelette, Tea', Lunch: 'Rice, Dal Fry, Papad', Dinner: 'Chapati, Palak Paneer, Rice' },
  Saturday:  { Breakfast: 'Puri Bhaji, Tea', Lunch: 'Biryani, Raita, Salad', Dinner: 'Chapati, Dal Makhani, Rice' },
  Sunday:    { Breakfast: 'Idli Vada, Coffee', Lunch: 'Special Thali, Sweet', Dinner: 'Chapati, Shahi Paneer, Rice' },
};

const EditMenuModal = ({ day, meal, value, onChange, onClose, onSave }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50"
    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: mealColors[meal].bg, color: mealColors[meal].text }}>
          {meal[0]}
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Edit {meal}</h2>
          <p className="text-xs text-gray-400">{day}</p>
        </div>
      </div>
      <label className="text-xs text-gray-500 font-medium">Menu Items</label>
      <textarea autoFocus rows={3} placeholder="e.g. Idli Sambar, Coffee, Banana"
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 mb-4 outline-none focus:border-blue-500 resize-none" />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={onSave} className="flex-1 text-white rounded-lg py-2 text-sm font-medium" style={{ backgroundColor: '#1a56db' }}>Save</button>
      </div>
    </div>
  </div>
);

// ── Student View ─────────────────────────────────────────────────────
function StudentFoodView() {
  const [activeTab, setActiveTab] = useState('menu');
  const [myData, setMyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const menu = (() => {
    try { return JSON.parse(localStorage.getItem('hostel_menu')) || defaultMenu; }
    catch { return defaultMenu; }
  })();

  useEffect(() => {
    if (!user?.studentId) { setLoading(false); return; }
    api.get(`/food/${user.studentId}`)
      .then(r => setMyData(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const toggle = async (meal) => {
    if (!myData || !user?.studentId) return;
    const field = `meal${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
    const newVal = !myData[field];
    setSaving(true);
    try {
      await api.put(`/food/${user.studentId}`, { [field]: newVal });
      setMyData(prev => ({ ...prev, [field]: newVal }));
    } catch { alert('Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Food</span>
        {saving && <span className="text-xs text-blue-500">Saving...</span>}
      </div>

      <div className="px-6 pt-4">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1 w-fit">
          {[['menu','🍽 Weekly Menu'],['preferences','🍱 My Meal Plan']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="px-4 py-1.5 text-sm rounded-md font-medium transition"
              style={activeTab === key
                ? { backgroundColor: 'white', color: '#0f0f0f', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: '#888' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'menu' && (
        <div className="p-6">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-5 border-l-4 border-blue-500">
            <div className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">Today — {today}</div>
            <div className="flex flex-col gap-2">
              {MEALS.map(meal => (
                <div key={meal} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
                  <span className="text-xs font-semibold w-20" style={{ color: mealColors[meal].text }}>{meal}</span>
                  <span className="text-sm text-gray-700">{menu[today]?.[meal] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f6' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 w-28">Day</th>
                  {MEALS.map(meal => (
                    <th key={meal} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b border-gray-100"
                      style={{ color: mealColors[meal].text }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
                        {meal}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, i) => (
                  <tr key={day} style={{
                    borderBottom: i < DAYS.length - 1 ? '1px solid #f3f4f6' : 'none',
                    backgroundColor: day === today ? '#f0f7ff' : 'white',
                  }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-gray-700">{day}</span>
                      {day === today && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Today</span>
                      )}
                    </td>
                    {MEALS.map(meal => (
                      <td key={meal} className="px-4 py-3">
                        <div className="rounded-lg px-3 py-2"
                          style={{ backgroundColor: mealColors[meal].bg, border: `1px solid ${mealColors[meal].border}30` }}>
                          <span className="text-xs text-gray-700">{menu[day]?.[meal] || '—'}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="p-6 max-w-xl">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">My Meal Plan</div>
            <p className="text-xs text-gray-400 mb-4">Toggle which meals you want. Admin can see the updated counts.</p>
            <div className="flex flex-col gap-3">
              {MEALS.map(meal => {
                const field = `meal${meal}`;
                const opted = myData?.[field] || false;
                return (
                  <div key={meal} className="flex items-center justify-between p-4 rounded-xl border transition"
                    style={opted
                      ? { backgroundColor: mealColors[meal].bg, borderColor: mealColors[meal].border }
                      : { backgroundColor: '#f9f8f6', borderColor: '#e5e7eb' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: opted ? mealColors[meal].dot : '#d1d5db' }} />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{meal}</div>
                        <div className="text-xs text-gray-400">{menu[today]?.[meal] || 'See weekly menu'}</div>
                      </div>
                    </div>
                    <button onClick={() => toggle(meal.toLowerCase())}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition"
                      style={opted
                        ? { backgroundColor: mealColors[meal].dot, color: 'white' }
                        : { backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                      {opted ? '✔ Taking' : 'Not Taking'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin/Staff View ─────────────────────────────────────────────────
export default function Food() {
  const { user } = useAuth();

  if (user?.role === 'STUDENT') return <StudentFoodView />;

  const [activeTab, setActiveTab] = useState('menu');
  const [students, setStudents] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [menu, setMenu] = useState(() => {
    try {
      const saved = localStorage.getItem('hostel_menu');
      return saved ? JSON.parse(saved) : defaultMenu;
    } catch { return defaultMenu; }
  });

  useEffect(() => {
    localStorage.setItem('hostel_menu', JSON.stringify(menu));
  }, [menu]);

  useEffect(() => {
    Promise.all([
      api.get('/food'),
      api.get('/mealplan/summary'),
    ]).then(([foodRes, summaryRes]) => {
      setStudents(foodRes.data);
      setWeeklySummary(summaryRes.data.summary || []);
      setTotalStudents(summaryRes.data.totalStudents || 0);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const saveEdit = () => {
    setMenu(prev => ({
      ...prev,
      [editCell.day]: { ...prev[editCell.day], [editCell.meal]: editValue },
    }));
    setEditCell(null);
  };

  const total = (field) => students.filter(s => s[field]).length;
  const avatarColors = ['#1a56db', '#7c3aed', '#0d9488', '#b45309', '#dc2626', '#15803d'];

  // Format chart data — capitalize day names
  const chartData = weeklySummary.map(d => ({
    day: d.day.charAt(0) + d.day.slice(1).toLowerCase().slice(0, 2),
    Breakfast: d.breakfast,
    Lunch: d.lunch,
    Dinner: d.dinner,
  }));

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading food data...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Food Management</span>
        <div className="flex items-center gap-4">
          {MEALS.map(meal => (
            <div key={meal} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
              <span className="text-xs text-gray-500">{meal}:</span>
              <span className="text-xs font-bold" style={{ color: mealColors[meal].text }}>
                {total(`meal${meal}`)} / {students.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1 w-fit">
          {[['menu','🍽 Weekly Menu'],['overview','📊 Meal Overview']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className="px-4 py-1.5 text-sm rounded-md font-medium transition"
              style={activeTab === key
                ? { backgroundColor: 'white', color: '#0f0f0f', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                : { color: '#888' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Weekly Menu Tab ── */}
      {activeTab === 'menu' && (
        <div className="p-6">
          <p className="text-xs text-gray-400 mb-4">Click any meal cell to edit the menu item</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
  <table className="min-w-[700px] w-full">
              <thead>
                <tr style={{ backgroundColor: '#f9f8f6' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 w-28">Day</th>
                  {MEALS.map(meal => (
                    <th key={meal} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b border-gray-100"
                      style={{ color: mealColors[meal].text }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
                        {meal}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, i) => (
                  <tr key={day} className="hover:bg-gray-50 transition"
                    style={{ borderBottom: i < DAYS.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-gray-700">{day}</span>
                    </td>
                    {MEALS.map(meal => (
                      <td key={meal} className="px-4 py-3">
                        <div className="group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition"
                          style={{ backgroundColor: mealColors[meal].bg, border: `1px solid ${mealColors[meal].border}30` }}
                          onClick={() => { setEditCell({ day, meal }); setEditValue(menu[day][meal]); }}>
                          <span className="text-xs text-gray-700">{menu[day][meal]}</span>
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition ml-2"
                            style={{ color: mealColors[meal].text }}>✏️</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Meal Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="p-6">

          {/* Summary stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {MEALS.map(meal => (
              <div key={meal} className="bg-white rounded-xl p-4 shadow-sm"
                style={{ borderTop: `4px solid ${mealColors[meal].dot}` }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-1"
                  style={{ color: mealColors[meal].text }}>{meal}</div>
                <div className="text-3xl font-bold text-gray-900 font-mono">{total(`meal${meal}`)}</div>
                <div className="text-xs text-gray-400 mt-1">out of {students.length} tenants</div>
              </div>
            ))}
          </div>

          {/* Weekly bar chart */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Weekly Meal Count</h3>
                <p className="text-xs text-gray-400 mt-0.5">How many tenants opted for each meal per day</p>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
                {totalStudents} total tenants
              </div>
            </div>

            {chartData.length === 0 || chartData.every(d => d.Breakfast === 0 && d.Lunch === 0 && d.Dinner === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-600 mb-1">No meal plan data yet</h3>
                <p className="text-xs text-gray-400">Tenants need to set their weekly meal plan from their portal</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                    allowDecimals={false} domain={[0, totalStudents || 'auto']} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value, name) => [`${value} tenants`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                  <Bar dataKey="Breakfast" fill={mealColors.Breakfast.bar} radius={[4,4,0,0]} />
                  <Bar dataKey="Lunch" fill={mealColors.Lunch.bar} radius={[4,4,0,0]} />
                  <Bar dataKey="Dinner" fill={mealColors.Dinner.bar} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <span className="text-amber-500">ℹ️</span>
            <span className="text-xs text-amber-700 font-medium">
              Meal preferences are set by tenants from their own portal. Admin can only view them here.
            </span>
          </div>

          {/* Tenant table — read only */}
          {students.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">🍽</div>
              <h3 className="font-semibold text-gray-700 mb-1">No tenants yet</h3>
              <p className="text-sm text-gray-400">Add tenants first to manage meal preferences</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
  <table className="min-w-[600px] w-full">
                <thead>
                  <tr style={{ backgroundColor: '#f9f8f6' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Tenant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Room</th>
                    {MEALS.map(meal => (
                      <th key={meal} className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide border-b border-gray-100"
                        style={{ color: mealColors[meal].text }}>
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mealColors[meal].dot }} />
                          {meal}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition"
                      style={{ borderBottom: i < students.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: avatarColors[i % avatarColors.length] }}>
                            {s.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <span className="text-sm text-gray-800 font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-500">{s.bed?.room?.roomNumber || '—'}</span>
                      </td>
                      {['breakfast','lunch','dinner'].map(meal => {
                        const field = `meal${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
                        const MealKey = meal.charAt(0).toUpperCase() + meal.slice(1);
                        const opted = s[field];
                        return (
                          <td key={meal} className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                              style={opted
                                ? { backgroundColor: mealColors[MealKey].bg, color: mealColors[MealKey].text, border: `1px solid ${mealColors[MealKey].border}` }
                                : { backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb' }}>
                              {opted ? '✔ Yes' : '✗ No'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f9f8f6', borderTop: '2px solid #e5e7eb' }}>
                    <td className="px-4 py-3" colSpan={2}>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Opted In</span>
                    </td>
                    {['mealBreakfast','mealLunch','mealDinner'].map((field, i) => (
                      <td key={field} className="px-4 py-3 text-center">
                        <span className="text-sm font-bold" style={{ color: mealColors[MEALS[i]].text }}>
                          {total(field)} / {students.length}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {editCell && (
        <EditMenuModal day={editCell.day} meal={editCell.meal}
          value={editValue} onChange={setEditValue}
          onClose={() => setEditCell(null)} onSave={saveEdit} />
      )}
    </div>
  );
}