import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart2,
    Users,
    Calendar,
    FileText,
    Settings as SettingsIcon,
    LogOut,
    Sparkles,
    Layers,
    LayoutGrid,
    Users as StaffIcon,
    ShieldCheck,
    Gift,
    Box,
    Utensils,
    Megaphone,
    Globe,
    Send
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Sidebar = () => {
    const { user, logout } = useAuth();
    
    // --- 🇻🇳 VIỆT HÓA VAI TRÒ ---
    const getDisplayRole = () => {
        const roleMap = {
            'Admin': 'QUẢN TRỊ VIÊN',
            'Manager': 'QUẢN LÝ KHÁCH SẠN',
            'Receptionist': 'BỘ PHẬN LỄ TÂN',
            'Housekeeper': 'BỘ PHẬN BUỒNG PHÒNG',
            'RoomAttendant': 'NHÂN VIÊN PHỤC VỤ',
            '6': 'NHÂN VIÊN PHỤC VỤ',
            'Accountant': 'BỘ PHẬN KẾ TOÁN',
            'Technician': 'KỸ THUẬT VIÊN',
            'Guest': 'HỘI VIÊN VIP'
        };
        return user?.position || roleMap[user?.role] || user?.role || 'NHÂN VIÊN';
    };

    // Định nghĩa menu dựa theo Quyền Hạn (RBAC)
    const navItems = [
        { name: 'Tổng quan', icon: <BarChart2 size={22} />, path: '/dashboard', roles: ['Admin', 'Manager'] },
        { name: 'Cổng khách hàng', icon: <ShieldCheck size={22} />, path: '/guest-portal', roles: ['Guest'] },
        { name: 'Đặt phòng', icon: <Calendar size={22} />, path: '/reservations', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Khách hàng', icon: <Users size={22} />, path: '/guests', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Hóa đơn', icon: <FileText size={22} />, path: '/invoices', roles: ['Admin', 'Manager', 'Receptionist'] },
        { 
            name: 'Hệ thống Dọn dẹp', 
            icon: <Sparkles size={22} />, 
            path: '/housekeeping', 
            roles: ['Admin', 'Manager', 'Housekeeper', 3] 
        },
        { 
            name: 'Hệ thống Phục vụ', 
            icon: <Send size={22} />, 
            path: '/delivery-tasks', 
            roles: ['Admin', 'Manager', 'RoomAttendant', 'Room Attendant', 'Room_Attendant', 6, '6'] 
        },
        { name: 'Hạng phòng', icon: <Layers size={22} />, path: '/room-types', roles: ['Admin', 'Manager'] },
        { name: 'Danh sách Phòng', icon: <LayoutGrid size={22} />, path: '/rooms', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Nhân viên', icon: <StaffIcon size={22} />, path: '/staff', roles: ['Admin'] },
        { name: 'CRM & Loyalty', icon: <Gift size={22} />, path: '/loyalty', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Quản lý Kho', icon: <Box size={22} />, path: '/inventory', roles: ['Admin', 'Manager'] },
        { name: 'F&B & Dịch vụ', icon: <Utensils size={22} />, path: '/services', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Marketing', icon: <Megaphone size={22} />, path: '/marketing', roles: ['Admin', 'Manager'] },
        { name: 'Cổng OTA', icon: <Globe size={22} />, path: '/ota', roles: ['Admin', 'Manager'] },
    ];

    return (
        <div style={{ width: '280px', height: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: '32px 20px', position: 'sticky', top: 0 }}>
            <div style={{ padding: '0 12px', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={28} /> HMS ROYAL
                </h2>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Management System</div>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => {
                        const userRole = String(user?.role || '').toLowerCase();
                        const userPos = String(user?.position || '').toLowerCase();
                        
                        // Kiểm tra quyền: Theo Role chuẩn HOẶC Theo từ khóa trong chức vụ (fallback)
                        let isAllowed = item.roles.some(r => String(r).toLowerCase() === userRole);
                        
                        if (item.path === '/delivery-tasks' && !isAllowed) {
                            if (userPos.includes('phục vụ') || userPos.includes('attendant') || userRole.includes('attendant')) {
                                isAllowed = true;
                            }
                        }
                        
                        return isAllowed && (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : '#94a3b8',
                                    background: isActive ? '#1e293b' : 'transparent',
                                    fontWeight: isActive ? '700' : '500',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent'
                                })}
                            >
                                {item.icon}
                                {item.name}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1e293b50', borderRadius: '16px', marginBottom: '24px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: user?.role === 'Admin' ? '#ef4444' : '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f1f5f9' }}>{user?.fullName || user?.username}</div>
                        <div style={{ fontSize: '11px', color: user?.role === 'Admin' ? '#f87171' : '#3b82f6', fontWeight: '700', textTransform: 'uppercase' }}>{getDisplayRole()}</div>
                    </div>
                </div>
                <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none', background: '#fef2f205', color: '#f87171', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}>
                    <LogOut size={20} /> Đăng xuất
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
