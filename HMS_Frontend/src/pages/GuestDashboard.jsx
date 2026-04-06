import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Calendar, Star,
    ShieldCheck, MapPin,
    LogOut, Trash2, Heart,
    AlertCircle, X
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

const GuestDashboard = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    const cancelReasons = [
        "Thay đổi lịch trình đột xuất", "Tìm được giá phòng tốt hơn", "Sự cố sức khỏe / gia đình",
        "Nhầm lẫn thông tin đặt phòng", "Thời tiết không thuận lợi", "Thay đổi địa điểm du lịch",
        "Vấn đề về phương tiện di chuyển", "Bận việc đột xuất", "Đổi ý định (Không còn nhu cầu)",
        "Không còn phù hợp sở thích"
    ];

    const interestTags = [
        "Phòng yên tĩnh", "City View", "Tầng cao", "Gần thang máy", "Bồn tắm",
        "Thanh toán trả sau", "Nhận phòng sớm", "Ăn sáng tại phòng", "Không hút thuốc",
        "Gần trung tâm", "Cửa sổ lớn", "Giường đôi"
    ];

    const [selectedCancelReason, setSelectedCancelReason] = useState("");
    const [customCancelReason, setCustomCancelReason] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(null); // id của booking muốn hủy

    const [tempPrefs, setTempPrefs] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showToast, setShowToast] = useState("");

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => setShowToast(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/GuestPortal/profile');
            setProfile(res.data);
            const initialPrefs = res.data.preferences ? res.data.preferences.split(", ") : [];
            setTempPrefs(initialPrefs);

            const res2 = await api.get('/GuestPortal/reservations');
            setReservations(res2.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const togglePreference = (tag) => {
        if (tempPrefs.includes(tag)) {
            setTempPrefs(tempPrefs.filter(p => p !== tag));
        } else {
            if (tempPrefs.length >= 3) {
                return;
            }
            setTempPrefs([...tempPrefs, tag]);
        }
    };

    const savePreferences = async () => {
        setIsSaving(true);
        try {
            await api.post('/GuestPortal/preferences', tempPrefs);
            setProfile({ ...profile, preferences: tempPrefs.join(", ") });
            setShowToast("Sở thích của quý khách đã được HMS Royal ghi nhận!");
        } catch (err) { setShowToast("Lỗi: " + err.message); }
        setIsSaving(false);
    };

    const handleCancelRoom = async () => {
        const finalReason = selectedCancelReason === "Lý do khác" ? customCancelReason : selectedCancelReason;
        if (!finalReason) {
            setShowToast("Vui lòng chọn hoặc nhập lý do hủy phòng.");
            return;
        }
        try {
            await api.post(`/GuestPortal/reservations/${showCancelModal}/cancel`, `"${finalReason}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            setShowToast("HMS Royal đã nhận yêu cầu hủy phòng của quý khách.");
            setShowCancelModal(null);
            fetchProfile();
        } catch (err) { setShowToast("Lỗi: " + (err.response?.data?.message || err.message)); }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
                <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}>
                    <User size={32} />
                </div>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b' }}>Chào mừng trở lại, {profile?.fullName || 'Khách quý'}!</h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Khám phá không gian nghỉ dưỡng dành riêng cho bạn.</p>
                </div>
                <button onClick={logout} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '14px', border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>
                    <LogOut size={18} /> Đăng xuất
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '32px' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Reservations List */}
                    <div style={{ background: 'white', borderRadius: '32px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={22} color="#ec4899" /> Lịch sử đặt phòng
                        </h2>
                        {reservations.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                                <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                                <p>Bạn chưa có lịch sử lưu trú nào. Đặt phòng ngay để nhận ưu đãi!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {reservations.map(res => (
                                    <div key={res.reservationId} style={{ padding: '24px', border: '1px solid #f1f5f9', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ width: '56px', height: '56px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <MapPin color="#3b82f6" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>Phòng {res.roomNumber} - <span style={{ color: '#64748b' }}>{res.bookingCode}</span></div>
                                                <div style={{ fontSize: '13px', color: '#64748b' }}>{new Date(res.checkInDate).toLocaleDateString()} — {new Date(res.checkOutDate).toLocaleDateString()}</div>
                                                {(res.status === 4 || res.status === 5 || res.status === 'Cancelled' || res.status === 'NoShow') && (res.cancellationReason || res.CancellationReason) && (
                                                    <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px', fontStyle: 'italic' }}>
                                                        Lý do: {res.cancellationReason || res.CancellationReason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            {(() => {
                                                const s = res.status;
                                                // --- 🛡️ Robust Mapping: Xử lý cả định dạng Số và Chữ từ API ---
                                                const mapping = {
                                                    0: { label: 'Chờ xác nhận', color: '#2563eb', bg: '#eff6ff' },
                                                    'Pending': { label: 'Chờ xác nhận', color: '#2563eb', bg: '#eff6ff' },
                                                    1: { label: 'Đã xác nhận', color: '#8b5cf6', bg: '#f5f3ff' },
                                                    'Confirmed': { label: 'Đã xác nhận', color: '#8b5cf6', bg: '#f5f3ff' },
                                                    2: { label: 'Đã nhận phòng', color: '#16a34a', bg: '#f0fdf4' },
                                                    'CheckedIn': { label: 'Đã nhận phòng', color: '#16a34a', bg: '#f0fdf4' },
                                                    3: { label: 'Đã trả phòng', color: '#64748b', bg: '#f8fafc' },
                                                    'CheckedOut': { label: 'Đã trả phòng', color: '#64748b', bg: '#f8fafc' },
                                                    4: { label: 'Đã hủy', color: '#dc2626', bg: '#fef2f2' },
                                                    'Cancelled': { label: 'Đã hủy', color: '#dc2626', bg: '#fef2f2' },
                                                    5: { label: 'Vắng mặt', color: '#d97706', bg: '#fff7ed' },
                                                    'NoShow': { label: 'Vắng mặt', color: '#d97706', bg: '#fff7ed' }
                                                };
                                                const current = mapping[s] || mapping[0];
                                                return (
                                                    <div style={{
                                                        padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
                                                        background: current.bg, color: current.color, border: '1px solid currentColor', opacity: 0.9
                                                    }}>
                                                        {current.label}
                                                    </div>
                                                );
                                            })()}
                                            {(res.status === 0 || res.status === 1 || res.status === 'Pending' || res.status === 'Confirmed') && (
                                                <button onClick={() => setShowCancelModal(res.reservationId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6, padding: '8px' }}>
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Loyalty Card */}
                    <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '32px', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)' }}>
                        <Star size={80} style={{ position: 'absolute', top: '-10px', right: '-20px', opacity: 0.15 }} />
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, marginBottom: '24px' }}>Royal Member</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>{profile?.membershipLevel || 'Silver'}</div>
                        <div style={{ fontSize: '15px' }}>Số điểm tích lũy: <b>{profile?.loyaltyPoints || 0} PTS</b></div>
                    </div>

                    {/* Verification Status */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={20} color="#10b981" /> Trạng thái hồ sơ
                        </h3>
                        <div style={{ background: profile?.isVerified ? '#f0fdf4' : '#fff7ed', padding: '16px', borderRadius: '16px', border: profile?.isVerified ? '1px solid #dcfce7' : '1px solid #ffedd5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: profile?.isVerified ? '#166534' : '#9a3412', fontSize: '13px', fontWeight: '700' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: profile?.isVerified ? '#10b981' : '#f59e0b' }} />
                                {profile?.isVerified ? 'Danh tính đã được xác minh' : 'Hồ sơ chưa xác minh CCCD'}
                            </div>
                        </div>
                    </div>

                    {/* TikTok Style Preference Selector */}
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '32px', borderRadius: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Heart size={20} color="#ef4444" /> Sở thích của bạn
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                            {interestTags.map(tag => {
                                const isSelected = tempPrefs.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => togglePreference(tag)}
                                        style={{
                                            padding: '10px 18px', borderRadius: '100px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                                            background: isSelected ? '#3b82f6' : '#f1f5f9',
                                            color: isSelected ? 'white' : '#475569',
                                            border: isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                            opacity: (!isSelected && tempPrefs.length >= 3) ? 0.4 : 1
                                        }}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={savePreferences}
                            disabled={isSaving || JSON.stringify(tempPrefs.sort()) === JSON.stringify((profile?.preferences ? profile.preferences.split(", ") : []).sort())}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: (isSaving || JSON.stringify(tempPrefs.sort()) === JSON.stringify((profile?.preferences ? profile.preferences.split(", ") : []).sort())) ? 0.3 : 1
                            }}
                        >
                            {isSaving ? 'Đang lưu...' : 'Lưu tâm ý của tôi'}
                        </button>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>Chọn tối đa 3 sở thích ưu tiên nhất. HMS Royal sẽ chuẩn bị phòng theo ý bạn.</p>
                    </div>
                </div>
            </div>

            {/* Cancellation Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)' }} onClick={() => setShowCancelModal(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', background: 'white', width: '100%', maxWidth: '440px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '900' }}>Lý do hủy phòng? 😔</h2>
                                <button onClick={() => setShowCancelModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px', paddingRight: '8px' }}>
                                {cancelReasons.map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => { setSelectedCancelReason(reason); setCustomCancelReason(""); }}
                                        style={{ padding: '14px 18px', textAlign: 'left', borderRadius: '16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: selectedCancelReason === reason ? '#eff6ff' : 'white', border: selectedCancelReason === reason ? '2px solid #3b82f6' : '1px solid #e2e8f0', color: selectedCancelReason === reason ? '#1e40af' : '#475569' }}
                                    >{reason}</button>
                                ))}
                                <button
                                    onClick={() => setSelectedCancelReason("Lý do khác")}
                                    style={{ padding: '14px 18px', textAlign: 'left', borderRadius: '16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: selectedCancelReason === "Lý do khác" ? '#eff6ff' : 'white', border: selectedCancelReason === "Lý do khác" ? '2px solid #3b82f6' : '1px solid #e2e8f0', color: selectedCancelReason === "Lý do khác" ? '#1e40af' : '#475569' }}
                                >Lý do khác...</button>
                            </div>

                            {selectedCancelReason === "Lý do khác" && (
                                <textarea
                                    required
                                    placeholder="Vui lòng chia sẻ thêm lý do của bạn..."
                                    value={customCancelReason}
                                    onChange={(e) => setCustomCancelReason(e.target.value)}
                                    style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '24px', fontSize: '13px', outline: 'none' }}
                                />
                            )}

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowCancelModal(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Quay lại</button>
                                <button onClick={handleCancelRoom} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Xác nhận hủy</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* HMS Royal Toast - Premium Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        style={{
                            position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
                            zIndex: 9999, background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white', padding: '16px 32px', borderRadius: '100px',
                            boxShadow: '0 20px 40px rgba(37, 99, 235, 0.4)',
                            fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px'
                        }}
                    >
                        <ShieldCheck size={20} /> {showToast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GuestDashboard;
