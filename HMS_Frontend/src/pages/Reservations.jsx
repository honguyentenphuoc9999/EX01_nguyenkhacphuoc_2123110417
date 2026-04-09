import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, LogOut, Trash2, ChevronRight, Calendar, User, History, CheckCircle, Clock, XCircle, CheckSquare
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';

const CheckInModal = ({ reservation, onClose, onRefresh, onNotify }) => {
    const [formData, setFormData] = useState({ idNumber: '', nationality: 'Vietnam', homeAddress: '', scannedFullName: '' });

    useEffect(() => {
        const scanner = new Html5Qrcode("reader-modal");
        scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, (data) => {
            const p = data.split('|');
            if (p.length >= 6) {
                setFormData({ idNumber: p[0], scannedFullName: p[2], homeAddress: p[5], nationality: 'Vietnam' });
                scanner.stop();
            }
        }).catch(err => console.error(err));
        return () => {
            if (scanner && scanner.getState() === 2) { 
                scanner.stop().catch(() => {});
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/Reservations/${reservation.reservationId || reservation.ReservationId}/check-in`, formData);
            onNotify("Check-in thành công!", "success");
            onRefresh();
            onClose();
        } catch (err) { onNotify("Lỗi check-in!", "error"); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '24px', overflowY: 'auto', maxHeight: '90vh' }}>
                <h3 style={{ fontWeight: '800', marginBottom: '16px' }}>Check-in CCCD: {reservation.guestName || reservation.GuestName}</h3>
                <div id="reader-modal" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', height: '250px', background: '#000' }}></div>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                    <input required placeholder="Họ tên từ QR" value={formData.scannedFullName} onChange={e => setFormData({...formData, scannedFullName: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                    <input 
                        required 
                        maxLength={12}
                        placeholder="Số CCCD (12 chữ số)" 
                        value={formData.idNumber} 
                        onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({...formData, idNumber: val});
                        }} 
                        style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                    />
                    <textarea required placeholder="Địa chỉ" value={formData.homeAddress} onChange={e => setFormData({...formData, homeAddress: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '60px' }} />
                    <button type="submit" style={{ padding: '14px', background: '#10b981', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '800' }}>Xác nhận Nhận phòng</button>
                    <button onClick={onClose} type="button" style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Đóng</button>
                </form>
            </motion.div>
        </motion.div>
    );
};

const DeleteModal = ({ reservation, onClose, onConfirm }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }} onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', background: 'white', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>Xác nhận xóa đặt phòng?</h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Hành động này sẽ xóa vĩnh viễn đơn <b style={{ color: '#0f172a' }}>{reservation.bookingCode || reservation.BookingCode}</b> khỏi danh sách hoạt động.</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Bỏ qua</button>
                    <button 
                        onClick={() => onConfirm("AdminDelete")} 
                        style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Xác nhận xóa
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const CheckOutModal = ({ reservation, onClose, onConfirm }) => {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(12px)' }} onClick={onClose} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', background: 'white', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>Xác nhận Trả phòng?</h2>
                <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>
                    Tiến hành trả phòng cho đơn <b style={{ color: '#0f172a' }}>{reservation.bookingCode || reservation.BookingCode}</b>. Sau khi trả phòng, trạng thái sẽ là <b>CHỜ THANH TOÁN</b>.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Bỏ qua</button>
                    <button 
                        onClick={() => onConfirm()} 
                        style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Trả phòng
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');
    const [checkInRes, setCheckInRes] = useState(null);
    const [checkOutRes, setCheckOutRes] = useState(null);
    const [deleteRes, setDeleteRes] = useState(null);
    const [notification, setNotification] = useState(null);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "Chưa có dữ liệu";
        return new Date(dateStr).toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await api.get('Reservations');
            setReservations(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => { fetchReservations(); }, []);

    const handleConfirm = async (id) => {
        try {
            await api.post(`Reservations/${id}/confirm`);
            notify("Đặt phòng đã được xác nhận!");
            fetchReservations();
        } catch (err) { notify("Lỗi xác nhận!", "error"); }
    };

    const handleAction = async (res) => {
        const sVal = (res.status !== undefined ? res.status : res.Status);
        const lowS = String(sVal).toLowerCase();
        const id = res.reservationId || res.ReservationId;
        if (lowS === 'pending' || sVal === 0) handleConfirm(id);
        else if (lowS === 'confirmed' || sVal === 1) setCheckInRes(res);
        else if (lowS === 'checkedin' || sVal === 2) setCheckOutRes(res);
    };

    const handleConfirmCheckOut = async () => {
        if (!checkOutRes) return;
        const id = checkOutRes.reservationId || checkOutRes.ReservationId;
        try {
            await api.post(`Reservations/${id}/check-out`);
            notify("Check-out vật lý thành công. Vui lòng kiểm tra mục thanh toán!");
            setCheckOutRes(null);
            fetchReservations();
        } catch (err) { notify("Lỗi: " + (err.response?.data || "Không thể trả phòng"), "error"); }
    };

    const handleConfirmDelete = async (reason) => {
        const id = deleteRes?.reservationId || deleteRes?.ReservationId;
        try {
            await api.delete(`Reservations/${id}?reason=${encodeURIComponent(reason)}`);
            notify("Đã xóa đơn đặt phòng.");
            setDeleteRes(null);
            fetchReservations();
        } catch (err) { notify("Lỗi xóa!", "error"); }
    };

    const getStatusBadge = (res) => {
        const sVal = (res.status !== undefined ? res.status : res.Status);
        const lowS = String(sVal).toLowerCase();
        const isPaid = (res.invoices || res.Invoices)?.some(i => {
            const st = i.status !== undefined ? i.status : i.Status;
            return st === 2 || st === 'Paid' || String(st).toLowerCase() === 'paid';
        });

        const statusMap = {
            'pending': { label: 'CHỜ DUYỆT', color: '#f59e0b', bg: '#fffbeb' },
            '0': { label: 'CHỜ DUYỆT', color: '#f59e0b', bg: '#fffbeb' },
            'confirmed': { label: 'ĐÃ XÁC NHẬN', color: '#10b981', bg: '#f0fdf4' },
            '1': { label: 'ĐÃ XÁC NHẬN', color: '#10b981', bg: '#f0fdf4' },
            'checkedin': { label: 'ĐANG Ở', color: '#3b82f6', bg: '#eff6ff' },
            '2': { label: 'ĐANG Ở', color: '#3b82f6', bg: '#eff6ff' },
            'checkedout': isPaid 
                ? { label: 'ĐÃ THANH TOÁN', color: '#10b981', bg: '#f0fdf4' } 
                : { label: 'CHỜ THANH TOÁN', color: '#f97316', bg: '#fff7ed' },
            '3': isPaid 
                ? { label: 'ĐÃ THANH TOÁN', color: '#10b981', bg: '#f0fdf4' } 
                : { label: 'CHỜ THANH TOÁN', color: '#f97316', bg: '#fff7ed' },
            'cancelled': { label: 'ĐÃ HỦY', color: '#ef4444', bg: '#fef2f2' },
            '4': { label: 'ĐÃ HỦY', color: '#ef4444', bg: '#fef2f2' },
            'noshow': { label: 'VẮNG MẶT', color: '#9d174d', bg: '#fdf2f8' },
            '5': { label: 'VẮNG MẶT', color: '#9d174d', bg: '#fdf2f8' }
        };
        const s = statusMap[lowS] || { label: 'KHÁC', color: '#94a3b8', bg: '#f8fafc' };
        
        return (
            <span style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
                {s.label}
            </span>
        );
    };

    const activeReservations = reservations.filter(r => {
        const s = (r.status !== undefined ? r.status : r.Status);
        const l = String(s).toLowerCase();
        const isPaid = (r.invoices || r.Invoices)?.some(i => {
            const st = i.status !== undefined ? i.status : i.Status;
            return st === 2 || st === 'Paid' || String(st).toLowerCase() === 'paid';
        });
        
        // Đang hoạt động bao gồm: Chờ duyệt, Đã xác nhận, Đang ở VÀ Đã trả phòng nhưng CHƯA THANH TOÁN
        const isActiveState = l === 'pending' || l === '0' || l === 'confirmed' || l === '1' || l === 'checkedin' || l === '2';
        const isWaitingPayment = (l === 'checkedout' || l === '3') && !isPaid;
        
        return isActiveState || isWaitingPayment;
    });

    const historyReservations = reservations.filter(r => {
        const s = (r.status !== undefined ? r.status : r.Status);
        const l = String(s).toLowerCase();
        const isPaid = (r.invoices || r.Invoices)?.some(i => {
            const st = i.status !== undefined ? i.status : i.Status;
            return st === 2 || st === 'Paid' || String(st).toLowerCase() === 'paid';
        });

        // Lịch sử bao gồm: Đã trả phòng + ĐÃ THANH TOÁN, Đã hủy, Vắng mặt
        const isPaidWork = (l === 'checkedout' || l === '3') && isPaid;
        const isFinalState = l === 'cancelled' || l === '4' || l === 'noshow' || l === '5';
        
        return isPaidWork || isFinalState;
    });

    const displayList = activeTab === 'active' ? activeReservations : historyReservations;

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Phòng & Đặt phòng</h1>
                <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '800', padding: '12px 24px', background: '#f1f5f9', borderRadius: '16px' }}>HỆ THỐNG QUẢN LÝ THỜI GIAN THỰC</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => setActiveTab('active')} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'active' ? '#fff' : 'transparent', color: '#0f172a', fontWeight: '800', cursor: 'pointer', boxShadow: activeTab === 'active' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                    Đang hoạt động & Chờ thanh toán ({activeReservations.length})
                </button>
                <button onClick={() => setActiveTab('history')} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'history' ? '#fff' : 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                    Lịch sử đã hoàn tất ({historyReservations.length})
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '24px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Hồ sơ đặt phòng</th>
                            <th style={{ padding: '24px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Thời gian Check-in/Out (GTS)</th>
                            <th style={{ padding: '24px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Tiến độ tài chính</th>
                            <th style={{ padding: '24px', textAlign: 'right', fontSize: '11px', color: '#64748b', fontWeight: '900', textTransform: 'uppercase' }}>Quản lý</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>Đang tải dữ liệu thời gian thực...</td></tr>
                        ) : displayList.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Hiện không có đơn hàng nào</td></tr>
                        ) : displayList.map(res => {
                            const sVal = (res.status !== undefined ? res.status : res.Status);
                            const lowS = String(sVal).toLowerCase();
                            return (
                            <tr key={res.reservationId || res.ReservationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '24px' }}>
                                    <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '15px' }}>{res.bookingCode || res.BookingCode}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                        {res.guestName || res.guest?.fullName || res.GuestName} 
                                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span> 
                                        <b>Phòng {res.roomNumber || res.room?.roomNumber || res.RoomNumber}</b>
                                    </div>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <LogIn size={14} color="#10b981" />
                                            <div>
                                                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '800' }}>
                                                    {(res.actualCheckIn || res.ActualCheckIn) ? "ĐÃ NHẬN PHÒNG LÚC:" : "DỰ KIẾN NHẬN:"}
                                                </span>
                                                <span style={{ fontWeight: '700', color: (res.actualCheckIn || res.ActualCheckIn) ? '#0f172a' : '#94a3b8' }}>
                                                    {formatDateTime(res.actualCheckIn || res.ActualCheckIn || res.checkInDate || res.CheckInDate)}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <LogOut size={14} color="#f43f5e" />
                                            <div>
                                                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', fontWeight: '800' }}>
                                                    {(res.actualCheckOut || res.ActualCheckOut) ? "ĐÃ TRẢ PHÒNG LÚC:" : "DỰ KIẾN TRẢ:"}
                                                </span>
                                                <span style={{ fontWeight: '700', color: (res.actualCheckOut || res.ActualCheckOut) ? '#0f172a' : '#94a3b8' }}>
                                                    {formatDateTime(res.actualCheckOut || res.ActualCheckOut || res.checkOutDate || res.CheckOutDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '24px' }}>
                                    {getStatusBadge(res)}
                                </td>
                                <td style={{ padding: '24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        {activeTab === 'active' && (lowS !== 'checkedout' && sVal !== 3) && (
                                            <button 
                                                onClick={() => handleAction(res)} 
                                                style={{ 
                                                    padding: '10px 20px', 
                                                    background: (lowS === 'pending' || sVal === 0) ? '#3b82f6' : (lowS === 'confirmed' || sVal === 1) ? '#10b981' : '#f59e0b', 
                                                    color: 'white', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
                                                }}
                                            >
                                                {(lowS === 'pending' || sVal === 0) ? 'XÁC NHẬN' : (lowS === 'confirmed' || sVal === 1) ? 'NHẬN PHÒNG' : 'TRẢ PHÒNG'}
                                                <ChevronRight size={16} /> 
                                            </button>
                                        )}
                                        <button onClick={() => setDeleteRes(res)} style={{ padding: '10px', borderRadius: '12px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {checkInRes && <CheckInModal reservation={checkInRes} onNotify={notify} onClose={() => setCheckInRes(null)} onRefresh={fetchReservations} />}
                {checkOutRes && <CheckOutModal reservation={checkOutRes} onClose={() => setCheckOutRes(null)} onConfirm={handleConfirmCheckOut} />}
                {deleteRes && <DeleteModal reservation={deleteRes} onClose={() => setDeleteRes(null)} onConfirm={handleConfirmDelete} />}
                {notification && (
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} style={{ position: 'fixed', bottom: 30, right: 30, background: notification.type === 'success' ? '#0f172a' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '20px', zIndex: 20000, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', fontWeight: '700' }}>
                        {notification.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reservations;
