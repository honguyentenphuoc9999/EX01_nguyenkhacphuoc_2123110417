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
import GuestDashboard from './pages/GuestDashboard';
import Settings from './pages/Settings';
import Loyalty from './pages/Loyalty';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import Marketing from './pages/Marketing';
import Ota from './pages/Ota';
import DeliveryTasks from './pages/DeliveryTasks';

// Component Bảo vệ Tuyến đường
const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang xác thực...</div>;
    return user ? children : <Navigate to="/login" />;
};

const HomePage = () => {
    const { user } = useAuth();
    const role = String(user?.role || '').toLowerCase();
    const pos = String(user?.position || '').toLowerCase();
    
    if (role === 'housekeeper' || role === '3' || pos.includes('dọn phòng')) return <Navigate to="/housekeeping" />;
    if (role === 'roomattendant' || role === '6' || pos.includes('phục vụ') || pos.includes('attendant')) return <Navigate to="/delivery-tasks" />;
    if (role === 'guest') return <Navigate to="/guest-portal" />;
    return <Dashboard />;
};

// Component Bảo vệ theo Vai trò (Chỉ vai trò phù hợp mới được vào)
const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    const userRole = String(user?.role || '').toLowerCase();
    const userPos = String(user?.position || '').toLowerCase();
    
    let hasAccess = allowedRoles.some(r => String(r).toLowerCase() === userRole);
    
    // Fallback cho Phục vụ
    if (!hasAccess && allowedRoles.includes('RoomAttendant')) {
        if (userPos.includes('phục vụ') || userPos.includes('attendant') || userRole.includes('attendant')) {
            hasAccess = true;
        }
    }
    
    if (!hasAccess) {
        return <Navigate to="/dashboard" />; // Ném ngược về Trang Dashboard nếu không đủ quyền
    }
    return children;
};

const App = () => {
  return (
    <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                {/* Trang mặc định mở đầu tiên là trang Đặt phòng nội bộ công khai */}
                <Route path="/" element={<PublicBooking />} />
                
                <Route path="/login" element={<Login />} />
                
                {/* Tất cả các trang bên trong PrivateRoute đều dùng Layout chung */}
                <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                    {/* Trang chủ cho Nhân viên và Khách đã đăng nhập */}
                    <Route path="/dashboard" element={<RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist', 'Housekeeper', 'Guest', 'RoomAttendant', 6]}><HomePage /></RoleProtectedRoute>} />
                    
                    <Route path="/guests" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Guests />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/staff" element={
                        <RoleProtectedRoute allowedRoles={['Admin']}>
                            <Staff />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/invoices" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Invoices />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/housekeeping" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Housekeeper', 3]}>
                            <Housekeeping />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/delivery-tasks" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'RoomAttendant', 6]}>
                            <DeliveryTasks />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/reservations" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Reservations />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/room-types" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager']}>
                            <RoomTypes />
                        </RoleProtectedRoute>
                    } />
                    <Route path="/rooms" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Rooms />
                        </RoleProtectedRoute>
                    } />
                    
                    <Route path="/guest-portal" element={
                        <RoleProtectedRoute allowedRoles={['Guest']}>
                            <GuestDashboard />
                        </RoleProtectedRoute>
                    } />
                    
                    <Route path="/settings" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager']}>
                            <Settings />
                        </RoleProtectedRoute>
                    } />

                    <Route path="/loyalty" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Loyalty />
                        </RoleProtectedRoute>
                    } />

                    <Route path="/inventory" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager']}>
                            <Inventory />
                        </RoleProtectedRoute>
                    } />

                    <Route path="/services" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager', 'Receptionist']}>
                            <Services />
                        </RoleProtectedRoute>
                    } />

                    <Route path="/marketing" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager']}>
                            <Marketing />
                        </RoleProtectedRoute>
                    } />

                    <Route path="/ota" element={
                        <RoleProtectedRoute allowedRoles={['Admin', 'Manager']}>
                            <Ota />
                        </RoleProtectedRoute>
                    } />
                </Route>
                
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
