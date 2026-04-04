import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Guests from './pages/Guests';
import Invoices from './pages/Invoices';
import Housekeeping from './pages/Housekeeping';
import Reservations from './pages/Reservations';
import Staff from './pages/Staff';
import RoomTypes from './pages/RoomTypes';
import Rooms from './pages/Rooms';
import PublicBooking from './pages/PublicBooking';

// Component Bảo vệ Tuyến đường
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang xác thực...</div>;
    return user ? children : <Navigate to="/login" />;
};

const HomePage = () => {
    const { user } = useAuth();
    if (user?.role === 'Housekeeping') return <Navigate to="/housekeeping" />;
    return <Dashboard />;
};

// Component Bảo vệ theo Vai trò (Chỉ vai trò phù hợp mới được vào)
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to="/" />; // Ném ngược về Trang chủ nếu không đủ quyền
    }
    return children;
};

const App = () => {
  return (
    <AuthProvider>
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Tất cả các trang bên trong PrivateRoute đều dùng Layout chung */}
                <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route path="/" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager']}><HomePage /></RoleProtectedRoute>} />
                    <Route path="/guests" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'FrontDesk']}><Guests /></RoleProtectedRoute>} />
                    <Route path="/staff" element={<RoleProtectedRoute allowedRoles={['Admin']}><Staff /></RoleProtectedRoute>} />
                    <Route path="/invoices" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'FrontDesk']}><Invoices /></RoleProtectedRoute>} />
                    <Route path="/housekeeping" element={<Housekeeping />} />
                    <Route path="/reservations" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'FrontDesk']}><Reservations /></RoleProtectedRoute>} />
                    <Route path="/room-types" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager']}><RoomTypes /></RoleProtectedRoute>} />
                    <Route path="/rooms" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'FrontDesk']}><Rooms /></RoleProtectedRoute>} />

                </Route>
                
                <Route path="/book" element={<PublicBooking />} />
                
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
