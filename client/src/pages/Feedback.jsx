import React, { useState, useEffect } from 'react';
import api from '../services/api';

const categoryColors = {
  FOOD:    { bg: '#fef3c7', color: '#b45309', label: '🍽 Food' },
  ROOM:    { bg: '#eff6ff', color: '#1d4ed8', label: '🛏 Room' },
  STAFF:   { bg: '#f0fdf4', color: '#15803d', label: '⚙ Staff' },
  GENERAL: { bg: '#f5f3ff', color: '#6d28d9', label: '💬 General' },
};

const statusConfig = {
  UNREAD:   { bg: '#fee2e2', color: '#dc2626', label: '● Unread' },
  READ:     { bg: '#fef3c7', color: '#b45309', label: '● Read' },
  RESOLVED: { bg: '#dcfce7', color: '#15803d', label: '✔ Resolved' },
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#d1d5db', fontSize: '14px' }}>★</span>
    ))}
  </div>
);

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus)   params.append('status', filterStatus);
      const res = await api.get(`/feedback?${params.toString()}`);
      setFeedbacks(res.data);
    } catch { setError('Failed to load feedback'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFeedbacks(); }, [filterCategory, filterStatus]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/feedback/${id}/status`, { status });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    } catch { alert('Failed to update status'); }
  };

  const unreadCount = feedbacks.filter(f => f.status === 'UNREAD').length;
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '—';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>
      <div className="text-gray-400 text-sm">Loading feedback...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f3ef' }}>

      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 px-4 flex items-center justify-between" style={{ height: '52px' }}>
        <span className="text-sm font-semibold text-gray-800">Tenant Feedback</span>
        {unreadCount > 0 && (
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-semibold">
            {unreadCount} unread
          </span>
        )}
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

        {/* Summary cards — 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 shadow-sm border-t-4 border-blue-500">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Total</div>
            <div className="text-2xl font-bold text-gray-900 font-mono">{feedbacks.length}</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border-t-4 border-red-500">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Unread</div>
            <div className="text-2xl font-bold text-red-600 font-mono">{unreadCount}</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border-t-4 border-green-500">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Resolved</div>
            <div className="text-2xl font-bold text-gray-900 font-mono">
              {feedbacks.filter(f => f.status === 'RESOLVED').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm border-t-4 border-amber-500">
            <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-1">Avg Rating</div>
            <div className="text-2xl font-bold text-gray-900 font-mono">{avgRating}</div>
            <div className="text-xs text-amber-500 mt-0.5">★ out of 5</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white flex-1 min-w-0">
            <option value="">All Categories</option>
            <option value="FOOD">🍽 Food</option>
            <option value="ROOM">🛏 Room</option>
            <option value="STAFF">⚙ Staff</option>
            <option value="GENERAL">💬 General</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white flex-1 min-w-0">
            <option value="">All Status</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          {(filterCategory || filterStatus) && (
            <button onClick={() => { setFilterCategory(''); setFilterStatus(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg bg-white">
              Clear
            </button>
          )}
        </div>

        {/* Feedback list */}
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-700 mb-1">No feedback yet</h3>
            <p className="text-sm text-gray-400">Tenants can submit feedback from their portal</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {feedbacks.map(f => {
              const cat = categoryColors[f.category] || categoryColors.GENERAL;
              const sts = statusConfig[f.status] || statusConfig.UNREAD;
              const borderColor = f.status === 'UNREAD' ? '#ef4444' : f.status === 'RESOLVED' ? '#22c55e' : '#f59e0b';
              return (
                <div key={f.id} className="bg-white rounded-xl p-4 shadow-sm border-l-4"
                  style={{ borderLeftColor: borderColor }}>

                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-800 truncate">{f.student?.name}</span>
                        {f.student?.bed?.room && (
                          <span className="text-xs font-mono text-gray-400">Rm {f.student.bed.room.roomNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: cat.bg, color: cat.color }}>
                          {cat.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: sts.bg, color: sts.color }}>
                          {sts.label}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons — stacked */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {f.status !== 'READ' && f.status !== 'RESOLVED' && (
                        <button onClick={() => updateStatus(f.id, 'READ')}
                          className="text-xs font-medium text-amber-600 border border-amber-200 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 transition whitespace-nowrap">
                          Mark Read
                        </button>
                      )}
                      {f.status !== 'RESOLVED' && (
                        <button onClick={() => updateStatus(f.id, 'RESOLVED')}
                          className="text-xs font-medium text-green-600 border border-green-200 px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 transition whitespace-nowrap">
                          Resolve
                        </button>
                      )}
                      {f.status === 'RESOLVED' && (
                        <button onClick={() => updateStatus(f.id, 'UNREAD')}
                          className="text-xs font-medium text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition whitespace-nowrap">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <StarRating rating={f.rating} />

                  {/* Message */}
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{f.message}</p>

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(f.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}