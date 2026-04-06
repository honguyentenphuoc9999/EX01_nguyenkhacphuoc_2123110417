import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

const Guests = () => {
    const { user: currentUser } = useAuth();
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Guests');
            setGuests(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchGuests(); }, []);

    const executeDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.delete(`/Guests/${confirmDeleteId}`);
            setConfirmDeleteId(null);
            fetchGuests();
        } catch (err) { alert("Lỗi: " + (err.response?.data || "Thất bại")); }
    };

    const filteredGuests = guests.filter(g => 
        (g.fullName || g.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (g.phone || g.Phone || '').includes(searchTerm)
    );

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Quản lý Khách hàng</h1>
                <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', padding: '12px 24px', background: '#f1f5f9', borderRadius: '16px' }}>CHẾ ĐỘ GIÁM SÁT DỮ LIỆU TỰ ĐĂNG KÝ</div>
            </div>

            <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '32px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm khách theo tên hoặc SĐT..." style={{ padding: '16px 16px 16px 48px', width: '100%', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>HỒ SƠ KHÁCH HÀNG</th>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>SĐT / EMAIL</th>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>SỞ THÍCH / GHI CHÚ</th>
                            <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu hồ sơ...</td></tr>
                        ) : filteredGuests.map((guest) => (
                            <tr key={guest.guestId || guest.GuestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{guest.fullName || guest.FullName}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>ID: {guest.idNumber || guest.IdNumber || 'Cần xác minh CCCD'}</div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    {(guest.isVerified || guest.IsVerified) ? (
                                        <div style={{ color: '#0ea5e9', background: '#f0f9ff', padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>
                                            <ShieldCheck size={14} /> ĐÃ XÁC MINH
                                        </div>
                                    ) : (
                                        <div style={{ color: '#94a3b8', background: '#f8fafc', padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content', border: '1px solid #f1f5f9' }}>
                                            <ShieldAlert size={14} color="#f43f5e" /> CHƯA XÁC MINH
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600' }}>{guest.phone || guest.Phone}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{guest.email || guest.Email || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '12px', color: (guest.preferences || guest.Preferences) ? '#0f172a' : '#94a3b8', fontStyle: (guest.preferences || guest.Preferences) ? 'normal' : 'italic', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={guest.preferences || guest.Preferences}>
                                        {guest.preferences || guest.Preferences || 'Không có yêu cầu'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    {(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                                        <button onClick={() => setConfirmDeleteId(guest.guestId || guest.GuestId)} style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                                            <Trash2 size={14} /> XÓA HỒ SƠ
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {confirmDeleteId && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={() => setConfirmDeleteId(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}>
                            <div style={{ width: '60px', height: '60px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <AlertCircle size={30} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Xác nhận xóa khách hàng?</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Hành động này không thể hoàn tác. Các dữ liệu đặt phòng cũ vẫn được lưu trữ ẩn cho mục đích báo cáo.</p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Quay lại</button>
                                <button onClick={executeDelete} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Đồng ý xóa</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Guests;
