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
            if (scanner && scanner.getState() === 2) { // 2 is SCANNING state
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
                            const val = e.target.value.replace(/\D/g, ''); // Chặn mọi ký tự không phải số
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
                    Tiến hành trả phòng cho đơn <b style={{ color: '#0f172a' }}>{reservation.bookingCode || reservation.BookingCode}</b>. Hành động này sẽ tự động sinh hóa đơn (Invoice) và báo cáo dọn phòng.
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

        try {
            if (lowS === 'pending' || sVal === 0) {
                handleConfirm(id);
            } else if (lowS === 'confirmed' || sVal === 1) {
                setCheckInRes(res);
            } else if (lowS === 'checkedin' || sVal === 2) {
                setCheckOutRes(res);
            }
        } catch (err) {
            notify("Thao tác thất bại: " + (err.response?.data || "Lỗi hệ thống"), "error");
        }
    };

    const handleDelete = (res) => {
        setDeleteRes(res);
    };

    const handleConfirmCheckOut = async () => {
        if (!checkOutRes) return;
        const id = checkOutRes.reservationId || checkOutRes.ReservationId;
        try {
            await api.post(`Reservations/${id}/check-out`);
            notify("Check-out thành công!");
            setCheckOutRes(null);
            fetchReservations();
        } catch (err) {
            notify("Thao tác thất bại: " + (err.response?.data || "Lỗi hệ thống"), "error");
        }
    };

    const handleConfirmDelete = async (reason) => {
        const id = deleteRes?.reservationId || deleteRes?.ReservationId || deleteRes?.id;
        if (!id) {
            notify("Không tìm thấy mã định danh đơn hàng!", "error");
            return;
        }
        try {
            await api.delete(`Reservations/${id}?reason=${encodeURIComponent(reason)}`);
            notify("Đặt phòng đã được xóa thành công.");
            setDeleteRes(null);
            fetchReservations();
        } catch (err) { 
            const errorMsg = err.response?.data?.message || err.response?.data || err.message;
            notify("Lỗi khi xóa: " + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg), "error"); 
        }
    };

    const getStatusBadge = (res) => {
        const sVal = (res.status !== undefined ? res.status : res.Status);
        const lowS = String(sVal).toLowerCase();

        const statusMap = {
            'pending': { label: 'CHỜ DUYỆT', color: '#f59e0b', bg: '#fffbeb' },
            '0': { label: 'CHỜ DUYỆT', color: '#f59e0b', bg: '#fffbeb' },
            'confirmed': { label: 'ĐÃ XÁC NHẬN', color: '#10b981', bg: '#f0fdf4' },
            '1': { label: 'ĐÃ XÁC NHẬN', color: '#10b981', bg: '#f0fdf4' },
            'checkedin': { label: 'ĐANG Ở', color: '#3b82f6', bg: '#eff6ff' },
            '2': { label: 'ĐANG Ở', color: '#3b82f6', bg: '#eff6ff' },
            'checkedout': { label: 'ĐÃ TRẢ', color: '#64748b', bg: '#f1f5f9' },
            '3': { label: 'ĐÃ TRẢ', color: '#64748b', bg: '#f1f5f9' },
            'cancelled': { label: 'ĐÃ HỦY', color: '#ef4444', bg: '#fef2f2' },
            '4': { label: 'ĐÃ HỦY', color: '#ef4444', bg: '#fef2f2' },
            'noshow': { label: 'VẮNG MẶT', color: '#9d174d', bg: '#fdf2f8' },
            '5': { label: 'VẮNG MẶT', color: '#9d174d', bg: '#fdf2f8' }
        };
        const s = statusMap[lowS] || { label: 'KHÁC', color: '#94a3b8', bg: '#f8fafc' };
        
        // Giả lập trạng thái thanh toán
        const isPaid = (res.invoices || res.Invoices)?.some(i => (i.status === 1 || i.Status === 1 || String(i.status).toLowerCase() === 'paid'));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', color: s.color, background: s.bg, display: 'inline-block', width: 'fit-content' }}>
                    {s.label}
                </span>
                {(lowS !== 'checkedout' && lowS !== '3' && lowS !== 'cancelled' && lowS !== '4' && lowS !== 'noshow' && lowS !== '5') && (
                    <span style={{ fontSize: '10px', fontWeight: '700', color: isPaid ? '#10b981' : '#f43f5e' }}>
                        {isPaid ? '● ĐÃ THANH TOÁN' : '○ CHƯA THANH TOÁN'}
                    </span>
                )}
            </div>
        );
    };
    const activeReservations = reservations.filter(r => {
        const s = (r.status !== undefined ? r.status : r.Status);
        const lowS = String(s).toLowerCase();
        return lowS === 'pending' || lowS === '0' || lowS === 'confirmed' || lowS === '1' || lowS === 'checkedin' || lowS === '2';
    });

    const historyReservations = reservations.filter(r => {
        const s = (r.status !== undefined ? r.status : r.Status);
        const lowS = String(s).toLowerCase();
        return lowS === 'checkedout' || lowS === '3' || lowS === 'cancelled' || lowS === '4' || lowS === 'noshow' || lowS === '5';
    });

    const displayList = activeTab === 'active' ? activeReservations : historyReservations;

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Phòng & Đặt phòng</h1>
                <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', padding: '12px 24px', background: '#f1f5f9', borderRadius: '16px' }}>CHẾ ĐỘ GIÁM SÁT & VẬN HÀNH</div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => setActiveTab('active')} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'active' ? '#fff' : 'transparent', color: '#0f172a', fontWeight: '800', cursor: 'pointer', boxShadow: activeTab === 'active' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}>
                    Đang hoạt động ({activeReservations.length})
                </button>
                <button onClick={() => setActiveTab('history')} style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'history' ? '#fff' : 'transparent', color: '#64748b', fontWeight: '800', cursor: 'pointer', boxShadow: activeTab === 'history' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none' }}>
                    Lịch sử ({historyReservations.length})
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>MÃ ĐẶT / KHÁCH HÀNG</th>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>NGÀY Ở</th>
                            <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '800' }}>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</td></tr>
                        ) : displayList.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu</td></tr>
                        ) : displayList.map(res => {
                            const sVal = (res.status !== undefined ? res.status : res.Status);
                            const lowS = String(sVal).toLowerCase();
                            return (
                            <tr key={res.reservationId || res.ReservationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>{res.bookingCode || res.BookingCode}</div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                                        {res.guestName || res.guest?.fullName || res.GuestName} - Phòng {res.roomNumber || res.room?.roomNumber || res.RoomNumber}
                                    </div>
                                    {(lowS === 'cancelled' || lowS === '4' || lowS === 'noshow' || lowS === '5') && (res.cancellationReason || res.CancellationReason) && (
                                        <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px', fontStyle: 'italic', background: '#fef2f2', padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                            Lý do: {res.cancellationReason || res.CancellationReason}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '700' }}>
                                        {new Date(res.checkInDate || res.CheckInDate).toLocaleDateString()} — {new Date(res.checkOutDate || res.CheckOutDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    {getStatusBadge(res)}
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        {activeTab === 'active' && (
                                            <button 
                                                onClick={() => handleAction(res)} 
                                                style={{ 
                                                    padding: '8px 16px', 
                                                    background: (lowS === 'pending' || sVal === 0) ? '#3b82f6' : (lowS === 'confirmed' || sVal === 1) ? '#10b981' : '#f59e0b', 
                                                    color: 'white', 
                                                    borderRadius: '10px', 
                                                    border: 'none', 
                                                    fontSize: '12px', 
                                                    fontWeight: '800', 
                                                    cursor: 'pointer', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px' 
                                                }}
                                            >
                                                <ChevronRight size={16} /> 
                                                {(lowS === 'pending' || sVal === 0) ? 'XÁC NHẬN' : (lowS === 'confirmed' || sVal === 1) ? 'NHẬN PHÒNG' : 'TRẢ PHÒNG'}
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(res)} style={{ padding: '8px', borderRadius: '12px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}>
                                            <Trash2 size={16}/>
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
                    <motion.div initial={{ x: 100 }} animate={{ x: 0 }} exit={{ x: 100 }} style={{ position: 'fixed', bottom: 30, right: 30, background: notification.type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', zIndex: 20000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        {notification.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reservations;
