import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, Plus, Search, Filter, CheckCircle2, 
  XCircle, Clock, ArrowRightLeft, User, DoorOpen, X, Camera
} from 'lucide-react';
import api from '../api/axios';

const BookingModal = ({ onClose, onRefresh }) => {
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const todayStr = new Date().toLocaleDateString('en-CA'); // Lấy YYYY-MM-DD chuẩn hệ thống
    const nextDayStr = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');

    const [formData, setFormData] = useState({
        guestId: '',
        roomIds: [], // Chuyển sang mảng để chọn nhiều phòng
        checkInDate: todayStr,
        checkOutDate: nextDayStr,
        specialRequests: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [gRes, rRes] = await Promise.all([api.get('/Guests'), api.get('/Rooms')]);
            setGuests(gRes.data);
            setRooms(rRes.data.filter(r => r.status === 0 || r.status === 1)); // Lấy phòng trống sạch/bẩn
        } catch (err) {
            console.error(err);
        }
    };

    const toggleRoomSelection = (roomId) => {
        setFormData(prev => ({
            ...prev,
            roomIds: prev.roomIds.includes(roomId)
                ? prev.roomIds.filter(id => id !== roomId)
                : [...prev.roomIds, roomId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.roomIds.length === 0) {
            alert("Vui lòng chọn ít nhất 1 phòng!");
            return;
        }
        setLoading(true);
        try {
            const resData = {
                guestId: formData.guestId,
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
                channel: 2, // WalkIn
                specialRequests: formData.specialRequests,
                roomIds: formData.roomIds
            };
            await api.post('/Reservations', resData);
            
            alert(`Tạo đặt phòng đoàn (${formData.roomIds.length} phòng) thành công!`);
            onRefresh();
            onClose();
        } catch (err) {
            console.error(err);
            alert(err.response?.data || "Lỗi khi tạo đặt phòng. Hãy kiểm tra lại lịch trống của phòng.");
        }
        setLoading(false);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: '20px' }}
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                style={{ background: 'white', width: '100%', maxWidth: '580px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ background: '#1e293b', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={20} /> Đặt phòng Đoàn / Walk-in
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Người đại diện / Công ty</label>
                            <select 
                                required
                                value={formData.guestId} 
                                onChange={(e) => setFormData({...formData, guestId: e.target.value})}
                                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
                            >
                                <option value="">-- Chọn khách hàng --</option>
                                {guests.map(g => {
                                    const gId = g.guestId || g.guestID || g.GuestId;
                                    const name = g.fullName || g.FullName;
                                    const phoneNum = g.phone || g.phoneNumber || g.Phone || 'N/A';
                                    return <option key={gId} value={gId}>{name} ({phoneNum})</option>
                                })}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Ngày nhận (14:00)</label>
                                <input type="date" value={formData.checkInDate} onChange={(e) => setFormData({...formData, checkInDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Ngày trả (12:00)</label>
                                <input type="date" value={formData.checkOutDate} onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                                Chọn danh sách phòng ({formData.roomIds.length} đã chọn)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '12px', background: '#f1f5f9', borderRadius: '12px' }}>
                                {rooms.map(r => {
                                    const rId = r.roomId || r.RoomId;
                                    const isSelected = formData.roomIds.includes(rId);
                                    return (
                                        <div 
                                            key={rId} 
                                            onClick={() => toggleRoomSelection(rId)}
                                            style={{ 
                                                padding: '10px 8px', borderRadius: '10px', border: '1px solid', fontSize: '12px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                                background: isSelected ? '#3b82f6' : 'white',
                                                color: isSelected ? 'white' : '#1e293b',
                                                borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                                                boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700' }}>Phòng {r.roomNumber || r.RoomNumber}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{r.roomTypeName || r.RoomTypeName}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Yêu cầu ghi chú</label>
                            <textarea value={formData.specialRequests} onChange={(e) => setFormData({...formData, specialRequests: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', height: '60px', fontSize: '13px' }} placeholder="VD: Công ty du lịch X, cần hóa đơn đỏ..." />
                        </div>

                        <button 
                            disabled={loading}
                            type="submit" 
                            style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer', marginTop: '8px' }}
                        >
                            {loading ? 'Đang kiểm tra lịch...' : 'Xác nhận Đặt đoàn'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const CheckInModal = ({ reservation, onClose, onRefresh, onNotify }) => {
    const [formData, setFormData] = useState({ idNumber: '', nationality: 'Vietnam', idCardImage: '' });
    const [preview, setPreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [localErrors, setLocalErrors] = useState({});

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                setFormData({ ...formData, idCardImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIdChange = (val) => {
        // Chỉ cho phép nhập số
        const numeric = val.replace(/\D/g, '').substring(0, 12);
        setFormData({ ...formData, idNumber: numeric });
        
        if (numeric.length !== 12) {
            setLocalErrors({ idNumber: "Số CCCD phải bao gồm đúng 12 chữ số." });
        } else {
            setLocalErrors({});
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.idNumber.length !== 12) {
            setLocalErrors({ idNumber: "Vui lòng nhập đúng 12 số CCCD." });
            return;
        }
        if (!formData.idCardImage) {
            onNotify("Vui lòng chụp ảnh hoặc tải tệp QR CCCD!", "error");
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/Reservations/${reservation.reservationId}/check-in`, formData);
            onNotify("Check-in thành công!", "success");
            onRefresh();
            onClose();
        } catch (err) {
            onNotify(err.response?.data?.message || "Lỗi khi Check-in", "error");
        }
        setSubmitting(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 12000, padding: '20px' }} onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                <div style={{ background: '#10b981', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}><DoorOpen size={20} /> Thủ tục Check-in (12 số CCCD)</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Yêu cầu thông tin pháp lý cho khách <b>{reservation.guestName}</b></p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Số CCCD (12 chữ số) *</label>
                            <input required value={formData.idNumber} onChange={e => handleIdChange(e.target.value)} placeholder="Nhập 12 chữ số CCCD" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${localErrors.idNumber ? '#ef4444' : '#e2e8f0'}` }} />
                            {localErrors.idNumber && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{localErrors.idNumber}</div>}
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Quốc tịch *</label>
                            <input required value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Chụp mặt trước CCCD / QR *</label>
                            <div style={{ position: 'relative', height: preview ? '180px' : '100px', border: '2px dashed #cbd5e1', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', cursor: 'pointer' }}>
                                {preview ? (
                                    <img src={preview} alt="CCCD Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <Camera size={32} color="#94a3b8" />
                                        <span style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Chụp hoặc tải ảnh lên</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                {preview && (
                                    <button type="button" onClick={() => setPreview(null)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}><X size={14}/></button>
                                )}
                            </div>
                        </div>

                        <button disabled={submitting || formData.idNumber.length !== 12 || !formData.idCardImage} type="submit" style={{ width: '100%', padding: '14px', background: submitting || formData.idNumber.length !== 12 || !formData.idCardImage ? '#94a3b8' : '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', marginTop: '10px', cursor: submitting || formData.idNumber.length !== 12 || !formData.idCardImage ? 'not-allowed' : 'pointer' }}>
                            {submitting ? "Đang xử lý..." : "Xác nhận & Hoàn tất nhận phòng"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const Toast = ({ message, type, onClose }) => (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} style={{ position: 'fixed', bottom: '30px', right: '30px', background: type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 15000, fontWeight: '700' }}>
        {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {message}
    </motion.div>
);

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [checkInRes, setCheckInRes] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [notification, setNotification] = useState(null);

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Reservations');
            setReservations(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCheckOut = async (id) => {
        if (!window.confirm("Xác nhận khách trả phòng và xuất hóa đơn?")) return;
        try {
            await api.post(`/Reservations/${id}/check-out`);
            notify("Check-out thành công! Hóa đơn đã được tạo.");
            fetchReservations();
        } catch (err) {
            notify(err.response?.data || "Lỗi khi Check-out", "error");
        }
    };

    const filtered = filterStatus === 'All' 
        ? reservations 
        : reservations.filter(r => r.status.toString() === filterStatus);

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Quản lý Đặt phòng</h1>
                    <p style={{ color: '#64748b' }}>Quản lý quy trình đón khách và đặt phòng walk-in.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)' }}
                >
                    <Plus size={20} /> Đặt phòng Mới
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '10px' }}>
                {['All', '0 (Chờ duyệt)', '1 (Xác nhận)', '2 (Đã vào)', '3 (Đã trả)'].map(s => (
                    <button 
                        key={s}
                        onClick={() => setFilterStatus(s.split(' ')[0])}
                        style={{ padding: '8px 16px', borderRadius: '10px', background: filterStatus === s.split(' ')[0] ? '#1e293b' : 'white', color: filterStatus === s.split(' ')[0] ? 'white' : '#64748b', border: '1px solid #e2e8f0', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Mã đặt / Khách hàng</th>
                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Ngày ở</th>
                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Trạng thái</th>
                            <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((res) => {
                            const rId = res.reservationId || res.reservationID || res.ReservationId;
                            const bCode = res.bookingCode || res.BookingCode;
                            const gName = res.guestName || res.GuestName;
                            const rNum = res.roomNumber || res.RoomNumber;
                            const cIn = res.checkInDate || res.CheckInDate;
                            const cOut = res.checkOutDate || res.CheckOutDate;
                            const status = res.status !== undefined ? res.status : res.Status;

                            return (
                                <tr key={rId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{bCode}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> {gName}</div>
                                            {rNum && rNum !== "Chưa gán" && (
                                                <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', border: '1px solid #dbeafe' }}>
                                                    Phòng {rNum}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} color="#3b82f6" /> {new Date(cIn).toLocaleDateString()}
                                            <ArrowRightLeft size={12} color="#94a3b8" />
                                            {new Date(cOut).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        {status === 2 ? (
                                            <div style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <CheckCircle2 size={14} /> Đang ở
                                            </div>
                                        ) : (
                                            <div style={{ background: '#fef9c3', color: '#854d0e', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                                <Clock size={14} /> Chờ đón
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        {(status === 1 || status === 0) && (
                                            <button onClick={() => setCheckInRes(res)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
                                                <DoorOpen size={16} /> Check-in
                                            </button>
                                        )}
                                        {status === 2 && (
                                            <button onClick={() => handleCheckOut(rId)} style={{ background: '#f97316', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)' }}>
                                                <ArrowRightLeft size={16} /> Check-out
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Không có đơn đặt phòng nào phù hợp.</div>}
            </div>

            <AnimatePresence>
                {showModal && <BookingModal onClose={() => setShowModal(false)} onRefresh={fetchReservations} />}
            </AnimatePresence>

            <AnimatePresence>
                {checkInRes && <CheckInModal reservation={checkInRes} onNotify={notify} onClose={() => setCheckInRes(null)} onRefresh={fetchReservations} />}
            </AnimatePresence>

            <AnimatePresence>
                {notification && <Toast message={notification.msg} type={notification.type} />}
            </AnimatePresence>
        </div>
    );
};

export default Reservations;
