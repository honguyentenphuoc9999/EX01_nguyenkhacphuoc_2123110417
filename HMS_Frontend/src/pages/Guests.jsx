import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Mail, Phone, Fingerprint, X, Save, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const GuestModal = ({ isOpen, onClose, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        idNumber: '',
        nationality: 'Vietnam',
    });

    const validateForm = () => {
        let newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Họ tên không được để trống";
        
        // Validation SĐT: Phải là 10 số
        if (!formData.phone.trim()) newErrors.phone = "Số điện thoại là bắt buộc";
        else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Số điện thoại phải bao gồm đúng 10 chữ số";
        
        // Validation CCCD: Phải là 12 số
        if (!formData.idNumber.trim()) newErrors.idNumber = "Số CMND/CCCD là bắt buộc";
        else if (!/^\d{12}$/.test(formData.idNumber)) newErrors.idNumber = "Mã CCCD phải bao gồm đúng 12 chữ số";

        if (!formData.nationality.trim()) newErrors.nationality = "Quốc tịch không được để trống";
        
        // Validation Email: Phải có đuôi @gmail.com
        if (formData.email) {
            if (!/^[a-zA-Z0-9_.+-]+@gmail\.com$/.test(formData.email)) {
                newErrors.email = "Hệ thống yêu cầu địa chỉ @gmail.com";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            // Chuẩn hóa dữ liệu trùng khớp 100% với Backend Model (Guest.cs)
            const payload = {
                FullName: formData.fullName,
                Phone: formData.phone, // Sửa từ PhoneNumber thành Phone
                Email: formData.email || null,
                IdNumber: formData.idNumber,
                Nationality: formData.nationality,
                DateOfBirth: new Date().toISOString(), // Mặc định nếu không có trong form
                GuestType: 0 // Regular
            };

            await api.post('/Guests', payload);
            alert("Đăng ký khách hàng thành công!");
            onRefresh();
            onClose();
            setFormData({ fullName: '', email: '', phone: '', idNumber: '', nationality: 'Vietnam' });
        } catch (err) {
            console.error(err);
            const serverMsg = err.response?.data?.errors 
                ? Object.values(err.response.data.errors).flat().join(', ')
                : (err.response?.data || "Lỗi khi đăng ký");
            alert("Lỗi từ máy chủ: " + serverMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '24px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserPlus size={20} /> Đăng ký khách mới
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Họ và tên khách hàng *</label>
                            <input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${errors.fullName ? '#ef4444' : '#e2e8f0'}`, background: '#f8fafc' }} />
                            {errors.fullName && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> {errors.fullName}</div>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Số điện thoại *</label>
                                <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${errors.phone ? '#ef4444' : '#e2e8f0'}`, background: '#f8fafc' }} />
                                {errors.phone && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.phone}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>CMND/CCCD *</label>
                                <input value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${errors.idNumber ? '#ef4444' : '#e2e8f0'}`, background: '#f8fafc' }} />
                                {errors.idNumber && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.idNumber}</div>}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Email</label>
                            <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`, background: '#f8fafc' }} placeholder="example@gmail.com" />
                            {errors.email && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.email}</div>}
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Quốc tịch *</label>
                            <input value={formData.nationality} onChange={(e) => setFormData({...formData, nationality: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: `1px solid ${errors.nationality ? '#ef4444' : '#e2e8f0'}`, background: '#f8fafc' }} />
                            {errors.nationality && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors.nationality}</div>}
                        </div>

                        <button disabled={loading} type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', border: 'none', cursor: 'pointer', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {loading ? 'Đang xác thực...' : <><Save size={18} /> Lưu hồ sơ khách</>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const Guests = () => {
    const [guests, setGuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { fetchGuests(); }, []);

    const fetchGuests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Guests');
            console.log("RAW GUESTS DATA:", res.data); // Dòng này để debug
            setGuests(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const filteredGuests = guests.filter(g => 
        (g.fullName || g.FullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (g.phone || g.Phone || '').includes(searchTerm) ||
        (g.idNumber || g.IdNumber || '').includes(searchTerm)
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Quản lý Khách hàng</h1>
                </div>
                <button onClick={() => setShowModal(true)} style={{ background: '#3b82f6', color: 'white', padding: '12px 20px', borderRadius: '10px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> Đăng ký khách mới
                </button>
            </div>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm khách hàng theo Tên, SĐT hoặc CMND..." style={{ padding: '14px 14px 14px 54px', width: '100%', maxWidth: '600px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }} />
            </div>

            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>KHÁCH HÀNG</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>LIÊN LẠC</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>QUỐC TỊCH</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700', textAlign: 'right' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredGuests.map((guest) => (
                            <tr key={guest.guestId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                            {(guest.fullName || guest.FullName || 'G').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{guest.fullName || guest.FullName}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                <Fingerprint size={12}/> ID: {guest.idNumber || guest.IdNumber || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>
                                        <Mail size={13} style={{ marginRight: '6px' }} /> 
                                        {guest.email || guest.Email || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#475569' }}>
                                        <Phone size={13} style={{ marginRight: '6px' }} /> 
                                        {guest.phone || guest.Phone || 'N/A'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                        {guest.nationality || guest.Nationality || 'Vietnam'}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <button style={{ color: '#3b82f6', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Chi tiết</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <GuestModal isOpen={showModal} onClose={() => setShowModal(false)} onRefresh={fetchGuests} />
        </div>
    );
};

export default Guests;
