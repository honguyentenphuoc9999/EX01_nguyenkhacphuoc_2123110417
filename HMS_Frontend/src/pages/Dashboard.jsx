import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CheckCircle, XCircle, Info, Clock, Plus, X, User, DollarSign, ListChecks, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';

const RoomModal = ({ roomId, onClose, onRefresh }) => {
    const [roomDetail, setRoomDetail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (roomId) fetchRoomDetail();
    }, [roomId]);

    const fetchRoomDetail = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/Dashboards/room-detail/${roomId}`);
            setRoomDetail(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        setLoading(true);
        try {
            if (action === 'Checkout') {
                await api.post(`/Reservations/checkout-by-room/${roomId}`);
                alert(`Check-out thành công cho phòng ${roomDetail.roomNumber}!`);
            } else if (action === 'Dọn xong') {
                const tasksRes = await api.get('/HousekeepingTasks');
                const task = tasksRes.data.find(t => t.roomId === roomId && t.status !== 2);
                if (task) {
                    await api.put(`/HousekeepingTasks/${task.taskId}`, { ...task, status: 2 });
                    alert(`Phòng ${roomDetail.roomNumber} đã dọn sạch!`);
                }
            }
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Lỗi: Hãy đảm bảo bạn đã gán tài khoản và chạy lại Backend.');
        }
        setLoading(false);
    };

    if (!roomDetail) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11000, padding: '20px' }}
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ background: '#0f172a', padding: '24px', color: 'white', position: 'relative' }}>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Phòng {roomDetail.roomNumber}</div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{roomDetail.roomTypeName}</h2>
                    <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Đang nạp dữ liệu thật...</div>
                ) : (
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Giá cơ bản</div>
                                <div style={{ fontWeight: '700', fontSize: '18px', color: '#3b82f6' }}>{new Intl.NumberFormat('vi-VN').format(roomDetail.basePrice)} ₫</div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tầng</div>
                                <div style={{ fontWeight: '700', fontSize: '18px' }}>1</div>
                            </div>
                        </div>

                        {/* Status UI */}
                        {roomDetail.status === 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <CheckCircle size={18} /> Phòng Trống Sạch - Sẵn sàng đón khách
                                </div>
                                <button onClick={() => alert('Chuyển tới trang Đặt phòng mới...')} style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <Plus size={20} /> Đặt phòng & Check-in
                                </button>
                            </div>
                        )}

                        {roomDetail.status === 2 && (
                            <div>
                                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                        <User size={20} />
                                        <div style={{ fontWeight: '700', fontSize: '16px' }}>Khách: {roomDetail.guestName}</div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', opacity: 0.9 }}>
                                        <span>Phí dịch vụ hiện tại:</span>
                                        <span style={{ fontWeight: '700' }}>{new Intl.NumberFormat('vi-VN').format(roomDetail.currentCharges)} ₫</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button style={{ flex: 1, background: 'white', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <DollarSign size={18} /> Ghi dịch vụ
                                    </button>
                                    <button onClick={() => handleAction('Checkout')} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <LogOut size={18} /> Trả phòng
                                    </button>
                                </div>
                            </div>
                        )}

                        {roomDetail.status === 1 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ background: '#fef9c3', color: '#854d0e', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <Clock size={20} /> Yêu cầu dọn dẹp
                                    </div>
                                    <p style={{ fontSize: '12px' }}>Lần cuối trả phòng: {new Date().toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => handleAction('Dọn xong')} style={{ width: '100%', background: '#10b981', color: 'white', padding: '16px', borderRadius: '12px', fontWeight: '700', fontSize: '16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <ListChecks size={20} /> Xác nhận Đã dọn xong
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const RoomCard = ({ room, onClick }) => {
    const getStatusColor = (status) => {
        switch(status) {
            case 0: return { bg: '#dcfce7', text: '#166534', icon: <CheckCircle size={16}/>, label: 'Trống sạch' };
            case 1: return { bg: '#fef9c3', text: '#854d0e', icon: <Clock size={16}/>, label: 'Đang bẩn' };
            case 2: return { bg: '#fee2e2', text: '#991b1b', icon: <Info size={16}/>, label: 'Đang ở' };
            default: return { bg: '#f1f5f9', text: '#475569', icon: <XCircle size={16}/>, label: 'Bảo trì' };
        }
    };
    const config = getStatusColor(room.status);

    return (
        <motion.div 
            onClick={() => onClick(room.roomId)}
            whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
            style={{ background: 'white', padding: '20px', borderRadius: '12px', border: `1px solid ${config.bg}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: '700' }}>Phòng {room.roomNumber}</span>
                <div style={{ background: config.bg, color: config.text, padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {config.icon} {config.label}
                </div>
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <LayoutDashboard size={14} /> {room.roomTypeName}
                </div>
                <div style={{ fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>{new Intl.NumberFormat('vi-VN').format(room.basePrice)} ₫</div>
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [stats, setStats] = useState({ totalRooms: 0, vacantRooms: 0, occupiedRooms: 0, monthlyRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [roomsRes, statsRes] = await Promise.all([
                api.get('/Rooms'),
                api.get('/Dashboards/stats')
            ]);
            setRooms(roomsRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Sơ đồ phòng (Real-time)</h1>
                    <p style={{ color: '#64748b' }}>Dữ liệu thực tế từ cơ sở dữ liệu khách sạn.</p>
                </div>
            </div>

            {/* Stats Grid - Dữ liệu thực tế 100% */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                {[
                    { label: 'Tổng số phòng', val: stats.totalRooms, color: '#3b82f6', roles: ['Admin', 'Manager', 'FrontDesk'] },
                    { label: 'Phòng trống sạch', val: stats.vacantRooms, color: '#10b981', roles: ['Admin', 'Manager', 'FrontDesk'] },
                    { label: 'Đang có khách', val: stats.occupiedRooms, color: '#ef4444', roles: ['Admin', 'Manager', 'FrontDesk'] },
                    { label: 'Doanh thu tháng này', val: new Intl.NumberFormat('vi-VN').format(stats.monthlyRevenue) + ' ₫', color: '#0f172a', roles: ['Admin', 'Manager'] }
                ].filter(s => s.roles.includes(user?.role)).map((s, idx) => (
                    <motion.div whileHover={{ scale: 1.02 }} key={idx} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>{s.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: s.color }}>{s.val}</div>
                    </motion.div>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Đang truy xuất SQL Server...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                    {rooms.map(r => <RoomCard key={r.roomId} room={r} onClick={setSelectedRoomId} />)}
                </div>
            )}

            <AnimatePresence>
                {selectedRoomId && (
                    <RoomModal roomId={selectedRoomId} onClose={() => setSelectedRoomId(null)} onRefresh={fetchDashboardData} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
