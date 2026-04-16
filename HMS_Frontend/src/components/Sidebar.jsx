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
    Send,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const Sidebar = ({ onClose }) => {
    const { user, logout } = useAuth();

    // --- 🇻🇳 VIỆT HÓA VAI TRÒ ---
    const getDisplayRole = () => {
        const roleMap = {
            'Admin': 'QUẢN TRỊ VIÊN',
            'Manager': 'QUẢN LÝ KHÁCH SẠN',
            'Receptionist': 'BỘ PHẬN LỄ TÂN',
            'Housekeeper': 'BỘ PHẬN BUỒNG PHÒNG',
            'RoomAttendant': 'NHÂN VIÊN PHỤC VỤ',
            'Accountant': 'BỘ PHẬN KẾ TOÁN',
            'Technician': 'KỸ THUẬT VIÊN',
            'Guest': 'HỘI VIÊN VIP'
        };
        return user?.position || roleMap[user?.role] || user?.role || 'NHÂN VIÊN';
    };

    const navItems = [
        { name: 'Tổng quan', icon: <BarChart2 size={22} />, path: '/dashboard', roles: ['Admin', 'Manager'] },
        { name: 'Cổng khách hàng', icon: <ShieldCheck size={22} />, path: '/guest-portal', roles: ['Guest'] },
        { name: 'Đặt phòng', icon: <Calendar size={22} />, path: '/reservations', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Khách hàng', icon: <Users size={22} />, path: '/guests', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Hội viên (Loyalty)', icon: <Gift size={22} />, path: '/loyalty', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Hóa đơn', icon: <FileText size={22} />, path: '/invoices', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Hệ thống Dọn dẹp', icon: <Sparkles size={22} />, path: '/housekeeping', roles: ['Admin', 'Manager', 'Housekeeper', 3] },
        { name: 'Hệ thống Phục vụ', icon: <Send size={22} />, path: '/delivery-tasks', roles: ['Admin', 'Manager', 'RoomAttendant', 6] },
        { name: 'Hạng phòng', icon: <Layers size={22} />, path: '/room-types', roles: ['Admin', 'Manager'] },
        { name: 'Danh sách Phòng', icon: <LayoutGrid size={22} />, path: '/rooms', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Nhân viên', icon: <StaffIcon size={22} />, path: '/staff', roles: ['Admin'] },
        { name: 'Quản lý Kho', icon: <Box size={22} />, path: '/inventory', roles: ['Admin', 'Manager'] },
        { name: 'F&B & Dịch vụ', icon: <Utensils size={22} />, path: '/services', roles: ['Admin', 'Manager', 'Receptionist'] },
        { name: 'Marketing', icon: <Megaphone size={22} />, path: '/marketing', roles: ['Admin', 'Manager'] },
        { name: 'Cài đặt', icon: <SettingsIcon size={22} />, path: '/settings', roles: ['Admin'] },
    ];

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '32px 24px',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            position: 'relative'
        }}>
            {/* Close button for mobile */}
            <button
                onClick={onClose}
                className="sidebar-close-btn"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    color: '#64748b',
                    padding: '8px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'none' // Controlled by CSS
                }}
            >
                <X size={24} />
            </button>

            <div style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-1px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <ShieldCheck size={28} />
                    </div>
                    HMS PREMIER
                </h2>
                <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '2px', paddingLeft: '46px' }}>
                    Royal Management
                </div>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {navItems.map((item) => {
                        const userRole = String(user?.role || '').toLowerCase();
                        const userPos = String(user?.position || '').toLowerCase();
                        let isAllowed = item.roles.some(r => String(r).toLowerCase() === userRole);
                        if (item.path === '/delivery-tasks' && !isAllowed) {
                            if (userPos.includes('phục vụ') || userPos.includes('attendant') || userRole.includes('attendant')) isAllowed = true;
                        }

                        return isAllowed && (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '14px 18px',
                                    borderRadius: '16px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : '#64748b',
                                    background: isActive ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 100%)' : 'transparent',
                                    fontWeight: isActive ? '700' : '600',
                                    fontSize: '14px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
                                })}
                            >
                                <span style={{ opacity: 0.9 }}>{item.icon}</span>
                                {item.name}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '32px' }}>
                {/* UPGRADED USER CARD */}
                <div style={{
                    padding: '20px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '20px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '16px',
                            background: user?.role === 'Admin' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                        }}>
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.fullName || user?.username}
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: '#3b82f6',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginTop: '2px'
                            }}>
                                {getDisplayRole()}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={logout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        padding: '16px', borderRadius: '18px', border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)', color: '#f87171',
                        cursor: 'pointer', fontWeight: '800', fontSize: '14px', transition: '0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                    <LogOut size={18} /> Đăng xuất hệ thống
                </button>
            </div>

            <style>{`
                @media (max-width: 1200px) {
                    .sidebar-close-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
