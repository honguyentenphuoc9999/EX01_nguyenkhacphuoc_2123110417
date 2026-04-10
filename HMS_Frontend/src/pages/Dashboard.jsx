import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Users, Calendar, CreditCard, TrendingUp, 
    ArrowUpRight, ArrowDownRight, Clock, Box 
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ 
        monthlyRevenue: 0, 
        revenueTrend: "0%",
        occupancyRate: 0, 
        occupancyTrend: "0%",
        pendingAmount: 0, 
        pendingTrend: "0%",
        newGuests: 0,
        guestsTrend: "0%",
        recentEvents: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/Stats/dashboard');
                const data = res.data;
                setStats({
                    monthlyRevenue: data.monthlyRevenue,
                    revenueTrend: "+2.5%", // Giả lập xu hướng
                    occupancyRate: data.occupancyRate,
                    occupancyTrend: "+1.2%",
                    pendingAmount: data.outstandingAmount,
                    pendingTrend: "-0.5%",
                    newGuests: data.todayGuests,
                    guestsTrend: "+100%",
                    recentEvents: []
                });
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu Dashboard:", error);
            }
        };
        fetchDashboardData();
    }, []);

    const renderAdminDashboard = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <StatCard icon={<TrendingUp color="#10b981"/>} label="Doanh thu tháng" value={`${new Intl.NumberFormat('vi-VN').format(stats.monthlyRevenue)} ₫`} trend={stats.revenueTrend} />
            <StatCard icon={<Box color="#3b82f6"/>} label="Tỷ lệ lấp đầy" value={`${stats.occupancyRate}%`} trend={stats.occupancyTrend} />
            <StatCard icon={<CreditCard color="#f59e0b"/>} label="Tiền chưa thanh toán" value={`${new Intl.NumberFormat('vi-VN').format(stats.pendingAmount)} ₫`} trend={stats.pendingTrend} />
            <StatCard icon={<Users color="#8b5cf6"/>} label="Khách mới" value={`${stats.newGuests}`} trend={stats.guestsTrend} />
        </div>
    );

    const renderFrontDeskDashboard = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar color="#3b82f6" /> Hoạt động hôm nay
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <ActivityLine label="Check-in sắp tới" count={8} color="#10b981" />
                    <ActivityLine label="Check-out dự kiến" count={4} color="#ef4444" />
                    <ActivityLine label="Phòng cần chuẩn bị" count={6} color="#3b82f6" />
                </div>
            </div>
            <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Thông báo nội bộ</h3>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Không có thông báo mới từ Quản lý.</div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '40px' }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>Chào buổi sáng, {user?.fullName}! 👋</h1>
                <p style={{ color: '#64748b', marginTop: '4px', marginBottom: '40px' }}>
                    Hệ thống đang hoạt động với vai trò: <b style={{ color: user?.role === 'Admin' ? '#ef4444' : '#3b82f6' }}>{user?.role}</b>
                </p>
            </motion.div>

            {user?.role === 'Admin' || user?.role === 'Manager' ? renderAdminDashboard() : renderFrontDeskDashboard()}

            <div style={{ marginTop: '40px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>Sự kiện gần đây</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.recentEvents.length === 0 ? (
                        <div style={{ color: '#64748b' }}>Chưa có sự kiện nào gần đây.</div>
                    ) : (
                        stats.recentEvents.map((evt, idx) => {
                            const timeStr = new Date(evt.time).toLocaleString('vi-VN');
                            return (
                                <div key={idx} style={{ background: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '10px' }}><Clock size={16} color="#64748b" /></div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>{evt.message}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{timeStr} bởi {evt.user}</div>
                                        </div>
                                    </div>
                                    <button style={{ color: '#3b82f6', background: 'transparent', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>Chi tiết</button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend }) => (
    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
            <div style={{ color: trend.startsWith('+') ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {trend.startsWith('+') ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {trend}
            </div>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>{value}</div>
    </div>
);

const ActivityLine = ({ label, count, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px' }}>
        <span style={{ fontWeight: '600', color: '#475569' }}>{label}</span>
        <span style={{ background: color, color: 'white', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>{count}</span>
    </div>
);

export default Dashboard;
