import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, 
    CheckCircle2, 
    Clock, 
    RefreshCw, 
    UserCheck, 
    LayoutGrid, 
    History,
    Calendar,
    Utensils,
    Package,
    ImageIcon
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

const Toast = ({ message, type }) => (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} style={{ position: 'fixed', bottom: '30px', right: '30px', background: type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 11000, fontWeight: '700' }}>
        {type === 'success' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
        {message}
    </motion.div>
);

const CACHE_KEY_DELIVERY = 'hms_delivery_data_v1';

const DeliveryTasks = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('tasks');
    
    // 🚀 HMS GLOBAL CACHE: Giữ dữ liệu sống sót khi chuyển đổi các tính năng Quản lý
    const [tasks, setTasks] = useState(() => {
        if (window.hms_delivery_cache) return window.hms_delivery_cache;
        const saved = localStorage.getItem(CACHE_KEY_DELIVERY);
        return saved ? JSON.parse(saved) : [];
    });

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);

    // Đồng bộ ngược ra Cache toàn cục
    useEffect(() => { 
        window.hms_delivery_cache = tasks;
    }, [tasks]);

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const getFingerprint = (data) => {
        if (!data || !Array.isArray(data)) return "";
        return data.map(item => `${item.taskId}-${item.updatedAt || ''}-${item.status || ''}`).join('|');
    };

    const saveToLocalSafely = (key, data) => {
        try {
            // Loại bỏ ảnh nặng khi lưu localStorage để tránh tràn bộ nhớ
            const leanData = data.map(({ proofPhotoUrl, ...rest }) => ({ ...rest, hasImages: !!proofPhotoUrl }));
            localStorage.setItem(key, JSON.stringify(leanData));
        } catch (e) { localStorage.removeItem(key); }
    };

    const fetchData = useCallback(async (isBackground = false) => {
        if (!isBackground && tasks.length === 0) setLoading(true);
        try {
            // --- GIAI ĐOẠN 1: Tải Metadata rút gọn (Siêu nhanh) ---
            const metaRes = await api.get('/HousekeepingTasks?type=5&excludeImages=true');
            const metaData = metaRes.data;

            setTasks(prevTasks => {
                // Hợp nhất để không làm mất ảnh đang có trong máy
                const merged = metaData.map(newTask => {
                    const old = prevTasks.find(t => t.taskId === newTask.taskId);
                    return (old && old.proofPhotoUrl) ? { ...newTask, proofPhotoUrl: old.proofPhotoUrl } : newTask;
                });

                if (getFingerprint(merged) !== getFingerprint(prevTasks) || prevTasks.length === 0) {
                    saveToLocalSafely(CACHE_KEY_DELIVERY, merged);
                    return merged;
                }
                return prevTasks;
            });

            setLoading(false);

            // --- GIAI ĐOẠN 2: Tải dữ liệu đầy đủ (Chỉ khi có thay đổi thực sự) ---
            const currentPrint = getFingerprint(tasks);
            if (getFingerprint(metaData) === currentPrint && tasks.length > 0 && !isBackground) return;

            const fullRes = await api.get('/HousekeepingTasks?type=5&excludeImages=false');
            if (getFingerprint(fullRes.data) !== getFingerprint(tasks)) {
                setTasks(fullRes.data);
            }

        } catch (err) {
            console.error("Sync error:", err);
        } finally {
            setLoading(false);
        }
    }, [tasks.length]);

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (task, action) => {
        try {
            if (action === 'claim') {
                await api.put(`/HousekeepingTasks/${task.taskId}`, { ...task, assignedStaffId: currentUser?.staffId, status: 'InProgress' });
                notify("Đã nhận đơn! Hãy chuẩn bị đồ ngay.");
            } else if (action === 'complete') {
                const orderIdMatch = task.notes?.match(/Đơn hàng ID: ([a-z0-9-]+)/i);
                const orderId = orderIdMatch ? orderIdMatch[1] : null;

                if (orderId) {
                    await api.post(`/RoomService/${orderId}/confirm-delivery`);
                    notify("Giao hàng thành công!");
                } else {
                    await api.put(`/HousekeepingTasks/${task.taskId}`, { ...task, status: 'Completed', completedAt: new Date().toISOString() });
                    notify("Đã giao xong.");
                }
            }
            fetchData(true);
        } catch (err) {
            notify("Thao tác thất bại", "error");
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 0: case 'Pending': case '0': return { bg: '#fef3c7', text: '#d97706', label: 'Chờ xử lý', icon: <Clock size={16}/> };
            case 1: case 'InProgress': case '1': return { bg: '#eff6ff', text: '#3b82f6', label: 'Đang đi giao', icon: <RefreshCw size={16}/> };
            case 4: case 'Cancelled': return { bg: '#fef2f2', text: '#ef4444', label: 'Đã hủy đơn', icon: <Package size={16} /> };
            case 'Completed': return { bg: '#dcfce7', text: '#166534', label: 'Đã giao xong', icon: <CheckCircle2 size={16}/> };
            default: return { bg: '#f1f5f9', text: '#475569', label: 'Khác', icon: <Package size={16}/> };
        }
    };

    const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled' && t.status !== 4);
    const historyTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Cancelled' || t.status === 4).sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Hệ thống Phục vụ Phòng</h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Quản lý yêu cầu ăn uống và cung cấp dịch vụ tận phòng khách.</p>
                </div>
                <button onClick={() => fetchData()} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'white', color: '#1e293b', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Làm mới
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '18px', width: 'fit-content', marginBottom: '32px' }}>
                <button onClick={() => setActiveTab('tasks')} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: activeTab === 'tasks' ? 'white' : 'transparent', color: activeTab === 'tasks' ? '#3b82f6' : '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGrid size={18} /> Đang phục vụ ({activeTasks.length})
                </button>
                <button onClick={() => setActiveTab('history')} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: activeTab === 'history' ? 'white' : 'transparent', color: activeTab === 'history' ? '#3b82f6' : '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={18} /> Đã hoàn tất ({historyTasks.length})
                </button>
            </div>

            {loading && tasks.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontWeight: '700' }}><RefreshCw className="animate-spin" style={{ margin: '0 auto 12px' }} /> Đang tải dữ liệu...</div> : (
                activeTab === 'tasks' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                        {activeTasks.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontWeight: '700' }}>Tất cả các đơn đã được phục vụ!</div> : 
                            activeTasks.map(task => (
                                <motion.div key={task.taskId} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ padding: '4px 12px', borderRadius: '10px', ...getStatusInfo(task.status), fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {getStatusInfo(task.status).icon} {getStatusInfo(task.status).label.toUpperCase()}
                                        </div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Phòng {task.room?.roomNumber}</h3>
                                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', marginBottom: '24px', minHeight: '60px', border: '1px solid #f1f5f9', color: '#1e293b', lineHeight: '1.6' }}>
                                        <Utensils size={16} style={{ marginBottom: '8px', color: '#3b82f6' }} />
                                        <div style={{ fontWeight: '600' }}>{task.notes}</div>
                                    </div>

                                    {task.status === 'Pending' || task.status === 0 ? (
                                        !isManager ? (
                                            <button onClick={() => handleAction(task, 'claim')} style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}>Bắt đầu đi giao</button>
                                        ) : (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '14px', fontStyle: 'italic', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>Đang chờ nhân viên nhận đơn...</div>
                                        )
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                                                <UserCheck size={20} />
                                                <span style={{ fontWeight: '800', fontSize: '14px' }}>{task.assignedStaff?.fullName || "Bí danh"} đang đi giao...</span>
                                            </div>
                                            {(currentUser?.staffId === task.assignedStaffId) && (
                                                <button onClick={() => handleAction(task, 'complete')} style={{ width: '100%', background: '#10b981', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><CheckCircle2 size={20}/> Xác nhận đã giao tận tay</button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        }
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>PHÒNG</th>
                                    <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>HOÀN TẤT LÚC</th>
                                    <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>NHÂN VIÊN</th>
                                    <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>DỊCH VỤ / GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyTasks.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: '700' }}>Chưa có đơn hàng nào hoàn tất.</td></tr>
                                ) : (
                                    historyTasks.map(task => (
                                        <tr key={task.taskId} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                            <td style={{ padding: '20px' }}><span style={{ background: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '8px', fontWeight: '900' }}>{task.room?.roomNumber}</span></td>
                                            <td style={{ padding: '20px', color: '#0f172a', fontWeight: '600', fontSize: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} style={{ color: '#64748b' }} />
                                                    {task.updatedAt ? new Date(task.updatedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={14}/></div>
                                                    {task.assignedStaff?.fullName}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px', fontSize: '14px', color: '#475569', fontStyle: 'italic' }}>{task.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            <AnimatePresence>
                {notification && <Toast message={notification.msg} type={notification.type} />}
            </AnimatePresence>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default DeliveryTasks;
