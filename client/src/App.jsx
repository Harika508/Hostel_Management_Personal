import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Food from './pages/Food';
import Staff from './pages/Staff';
import Access from './pages/Access';
import Resources from './pages/Resources';
import StudentPortal from './pages/StudentPortal';
import MyProfile from './pages/MyProfile';
import SetPassword from './pages/SetPassword';
import ForgotPassword from './pages/ForgotPassword';
import Feedback from './pages/Feedback';

const hideSidebarRoutes = ['/login', '/register', '/set-password', '/forgot-password'];

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hide = hideSidebarRoutes.includes(location.pathname) || user?.role === 'STUDENT';

  return (
    <div className="flex min-h-screen">
      {!hide && (
        <>
          <div className="hidden md:flex">
            <Sidebar />
          </div>
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="relative z-50">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}
          <button
            className="fixed top-3 left-3 z-30 md:hidden bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
            onClick={() => setSidebarOpen(true)}
          >
            <div className="w-5 h-0.5 bg-gray-700 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-700 mb-1"></div>
            <div className="w-5 h-0.5 bg-gray-700"></div>
          </button>
        </>
      )}
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
};

// Checks role AND staff permission for a given page key
const ProtectedRoute = ({ children, roles, permKey }) => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  if (!token || !user) return <Navigate to="/login" replace />;

  const hasRole = roles.includes(user.role);
  const hasPermission = user.role !== 'STAFF' || !permKey || (user.staffPermissions || []).includes(permKey);

  if (!hasRole || !hasPermission) {
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
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Layout>
      <Routes>
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={
          user?.role === 'STUDENT' ? <Navigate to="/student-portal" replace />
          : <Navigate to="/dashboard" replace />
        } />
        <Route path="/dashboard"  element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/rooms"      element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="rooms"><Rooms /></ProtectedRoute>} />
        <Route path="/students"   element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="students"><Students /></ProtectedRoute>} />
        <Route path="/payments"   element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="payments"><Payments /></ProtectedRoute>} />
        <Route path="/food"       element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="food"><Food /></ProtectedRoute>} />
        <Route path="/staff"      element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="staff"><Staff /></ProtectedRoute>} />
        <Route path="/access"     element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="access"><Access /></ProtectedRoute>} />
        <Route path="/resources"  element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="resources"><Resources /></ProtectedRoute>} />
        <Route path="/feedback"   element={<ProtectedRoute roles={['ADMIN','STAFF']} permKey="feedback"><Feedback /></ProtectedRoute>} />
        <Route path="/my-profile" element={<ProtectedRoute roles={['STAFF']}><MyProfile /></ProtectedRoute>} />
        <Route path="/student-portal" element={<ProtectedRoute roles={['STUDENT']}><StudentPortal /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;