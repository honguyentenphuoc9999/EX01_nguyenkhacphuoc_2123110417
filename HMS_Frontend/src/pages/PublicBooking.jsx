import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Users, Search, 
    ArrowRight, Star, Coffee, 
    Wifi, MapPin, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

const PublicBooking = () => {
    const { user } = useAuth();
    const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState(null);

    // Xử lý Responsive đơn giản bằng JS
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [searchData, setSearchData] = useState({ 
        checkIn: new Date().toISOString().split('T')[0], 
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
        guests: 1 
    });

    const [guestInfo, setGuestInfo] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
    const [accountExists, setAccountExists] = useState(null); // null: chưa check, true: cũ, false: mới
    const [hasProfile, setHasProfile] = useState(false); // Đã có hồ sơ Guests
    const [vipInfo, setVipInfo] = useState({ tier: 'None', discountRate: 0 }); // 💎 HMS VIP
    const [searchErrors, setSearchErrors] = useState({});
    const [errors, setErrors] = useState({});
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const fetchRoomTypes = async (cin, cout) => {
        setLoading(true);
        try {
            const checkInDate = cin || searchData.checkIn;
            const checkOutDate = cout || searchData.checkOut;
            const url = `/RoomTypes?checkIn=${checkInDate}&checkOut=${checkOutDate}`;
            const res = await api.get(url);
            setRoomTypes(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    useEffect(() => {
        fetchRoomTypes(); // Tải dữ liệu ban đầu cho ngày hôm nay
    }, []);

    const handleCheckAvailability = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];
        if (searchData.checkIn < today) newErrors.checkIn = "Ngày nhận phòng không thể ở quá khứ!";
        if (searchData.checkOut <= searchData.checkIn) newErrors.checkOut = "Ngày trả phòng phải sau ngày nhận ít nhất 1 đêm!";
        
        if (Object.keys(newErrors).length > 0) {
            setSearchErrors(newErrors);
            return false;
        }
        setSearchErrors({});
        fetchRoomTypes(searchData.checkIn, searchData.checkOut);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        // 🛡️ BƯỚC 1: Kiểm tra SĐT & Lấy Ưu đãi VIP
        if (accountExists === null) {
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(guestInfo.phone)) {
                setErrors({ phone: "Số điện thoại phải đúng 10 chữ số!" });
                return;
            }
            setSubmitting(true);
            try {
                const res = await api.get(`/PublicBooking/CheckAccount/${guestInfo.phone}`);
                const { exists, hasProfile, fullName, tier, discountRate } = res.data;
                setAccountExists(exists);
                setHasProfile(hasProfile);
                setVipInfo({ tier, discountRate }); // 💎 Lưu thông tin VIP
                
                if (hasProfile && fullName) {
                    setGuestInfo(prev => ({ ...prev, fullName: fullName }));
                }
                setErrors({});
            } catch (err) {
                setErrors({ phone: "Không thể kiểm tra tài khoản. Vui lòng thử lại!" });
            }
            setSubmitting(false);
            return;
        }

        // 🛡️ BƯỚC 2: Validate Thông tin & Mật khẩu
        if (!guestInfo.fullName.trim()) newErrors.fullName = "Vui lòng nhập tên!";
        if (!guestInfo.password) newErrors.password = "Vui lòng nhập mật khẩu!";
        
        if (accountExists === false) {
            if (guestInfo.password !== guestInfo.confirmPassword) 
                newErrors.confirmPassword = "Mật khẩu xác nhận không khớp!";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);
        try {
            const res = await api.post('/PublicBooking/Submit', {
                FullName: guestInfo.fullName,
                Phone: guestInfo.phone,
                Email: guestInfo.email,
                RoomTypeId: selectedType.roomTypeId || selectedType.RoomTypeId,
                CheckInDate: searchData.checkIn,
                CheckOutDate: searchData.checkOut,
                GuestCount: parseInt(searchData.guests),
                Password: guestInfo.password,
                ConfirmPassword: guestInfo.confirmPassword
            });
            // Thành công: Chuyển thẳng về Dashboard người dùng
            window.location.href = res.data.redirect;
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || "Lỗi khi gửi yêu cầu. Vui lòng thử lại!" });
            setSubmitting(false);
        }
    };

    const getNights = () => {
        const start = new Date(searchData.checkIn);
        const end = new Date(searchData.checkOut);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header / Hero */}
            <div style={{ 
                height: '400px', 
                background: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                padding: '0 20px',
                position: 'relative' // Quan trọng để đặt nút tuyệt đối
            }}>
                {/* Nút Đăng nhập góc trên phải */}
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}
                    >
                        Quý khách đã có tài khoản? Đăng nhập
                    </button>
                </div>

                <motion.h1 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: isMobile ? '32px' : '48px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: '1.2' }}
                >
                    HMS PHUOC PREMIER
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ fontSize: isMobile ? '15px' : '18px', color: '#cbd5e1', maxWidth: '600px', marginTop: '12px' }}
                >
                    Trải nghiệm sự sang trọng bậc nhất giữa lòng thành phố. Đặt phòng ngay để nhận ưu đãi 20%.
                </motion.p>
            </div>

            {/* Khung Tìm kiếm (Thanh Search "nổi") */}
            <div style={{ maxWidth: '1000px', margin: '-50px auto 40px', background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '16px', alignItems: 'flex-end', position: 'relative', zIndex: 10, width: isMobile ? '90%' : 'auto' }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ngày nhận phòng</label>
                    <input type="date" value={searchData.checkIn} onChange={e => setSearchData({...searchData, checkIn: e.target.value})} style={{ width: '100%', padding: '14px', border: searchErrors.checkIn ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '12px' }} />
                    {searchErrors.checkIn && <span style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{searchErrors.checkIn}</span>}
                </div>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ngày trả phòng</label>
                    <input type="date" value={searchData.checkOut} onChange={e => setSearchData({...searchData, checkOut: e.target.value})} style={{ width: '100%', padding: '14px', border: searchErrors.checkOut ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '12px' }} />
                    {searchErrors.checkOut && <span style={{ color: '#ef4444', fontSize: '10px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{searchErrors.checkOut}</span>}
                </div>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Số lượng khách</label>
                    <select value={searchData.guests} onChange={e => setSearchData({...searchData, guests: parseInt(e.target.value)})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Người</option>)}
                    </select>
                </div>
                <button 
                    onClick={handleCheckAvailability}
                    style={{ height: '52px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Search size={20} /> Kiểm tra phòng trống
                </button>
            </div>

            {/* Danh sách Hạng phòng */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#1e293b' }}>Chọn hạng phòng của bạn</h2>
                    <div style={{ width: '60px', height: '4px', background: '#3b82f6', margin: '16px auto', borderRadius: '2px' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '280px' : '380px'}, 1fr))`, gap: '32px' }}>
                    {roomTypes
                        .filter(rt => (rt.maxOccupancy || rt.MaxOccupancy) >= searchData.guests) // Lọc phòng chứa được số khách
                        .map(rt => (
                        <motion.div 
                            key={rt.roomTypeId || rt.RoomTypeId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}
                        >
                            <div style={{ height: '240px', background: '#f1f5f9', position: 'relative' }}>
                                <img src={rt.imageUrl || rt.ImageUrl || `https://images.unsplash.com/photo-1590490360182-c33d597353a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60&sig=${rt.typeName || rt.TypeName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={rt.typeName || rt.TypeName} />
                                <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'white', padding: '6px 12px', borderRadius: '10px', fontWeight: '800', fontSize: '18px', color: '#10b981' }}>
                                    {new Intl.NumberFormat('vi-VN').format(rt.basePrice || rt.BasePrice)} <span style={{ fontSize: '12px' }}>₫/đêm</span>
                                </div>
                                <div style={{ 
                                    position: 'absolute', 
                                    bottom: '16px', 
                                    left: '16px', 
                                    background: (rt.availableRooms || rt.AvailableRooms) > 3 ? 'rgba(16, 185, 129, 0.9)' : (rt.availableRooms || rt.AvailableRooms) > 0 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.9)', 
                                    color: 'white', 
                                    padding: '6px 14px', 
                                    borderRadius: '8px', 
                                    fontSize: '12px', 
                                    fontWeight: '800',
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>
                                    HIỆN TẠI CÒN {(rt.availableRooms || rt.AvailableRooms)} / {(rt.roomCount || rt.RoomCount)} PHÒNG
                                </div>
                            </div>
                            <div style={{ padding: isMobile ? '20px' : '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>{rt.typeName || rt.TypeName}</h3>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                                    </div>
                                </div>
                                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                    {rt.description || rt.Description || "Tận hưởng không gian hiện đại và tiện nghi đẳng cấp 5 sao."}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                    <Feature icon={<Wifi size={14}/>} label="Wifi miễn phí" />
                                    <Feature icon={<Coffee size={14}/>} label="Bữa sáng miễn phí" />
                                    <Feature icon={<Users size={14}/>} label={`Tối đa ${rt.maxOccupancy} người`} />
                                    <Feature icon={<CheckCircle2 size={14}/>} label="Dịch vụ 24/7" />
                                </div>

                                {isAdminOrManager ? (
                                    <div style={{ width: '100%', padding: '16px', background: '#fee2e2', color: '#dc2626', borderRadius: '14px', fontWeight: '800', textAlign: 'center', border: '1px solid #fecaca', fontSize: '12px' }}>
                                        CHẾ ĐỘ GIÁM SÁT - KHÔNG THỂ ĐẶT ĐƠN
                                    </div>
                                ) : (
                                    <button onClick={() => setSelectedType(rt)} style={{ width: '100%', padding: '16px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        Đặt phòng ngay <ArrowRight size={18} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    
                    {roomTypes.filter(rt => (rt.maxOccupancy || rt.MaxOccupancy) >= searchData.guests).length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏘️</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Đoàn của bạn quá đông?</h3>
                            <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 24px' }}>
                                Hiện không có hạng phòng nào chứa đủ {searchData.guests} người. Bạn có muốn chia đoàn thành nhiều phòng nhỏ hơn không?
                            </p>
                            <button onClick={() => setSearchData({...searchData, guests: 2})} style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                Thử đặt 2 người/phòng
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Đặt phòng */}
            <AnimatePresence>
                {selectedType && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '10px' : '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }} onClick={() => { setSelectedType(null); setErrors({}); }} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '95%' : '500px', background: 'white', borderRadius: isMobile ? '24px' : '32px', padding: isMobile ? '24px' : '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '900', marginBottom: '8px' }}>Xác nhận đặt phòng</h2>
                            <p style={{ color: '#64748b', marginBottom: isMobile ? '20px' : '32px', fontSize: '14px' }}>Quý khách đang đặt hạng phòng: <b>{selectedType.typeName || selectedType.TypeName}</b></p>
                            
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '15px' : '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Số điện thoại liên hệ *</label>
                                    <input 
                                        required 
                                        disabled={accountExists !== null || submitting}
                                        value={guestInfo.phone} 
                                        onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} 
                                        placeholder="Nhập SĐT (10 số)" 
                                        style={{ width: '100%', padding: '16px', border: errors.phone ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', background: accountExists !== null ? '#f8fafc' : 'white' }} 
                                    />
                                    {errors.phone && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{errors.phone}</span>}
                                </div>

                                {accountExists !== null && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Họ và tên *</label>
                                            <input required value={guestInfo.fullName} onChange={e => setGuestInfo({...guestInfo, fullName: e.target.value})} placeholder="Nhập tên đầy đủ" style={{ width: '100%', padding: '16px', border: errors.fullName ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px' }} />
                                            {errors.fullName && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{errors.fullName}</span>}
                                        </div>

                                        {accountExists === false && (
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Địa chỉ Email *</label>
                                                <input type="email" required value={guestInfo.email} onChange={e => setGuestInfo({...guestInfo, email: e.target.value})} placeholder="khachhang@gmail.com" style={{ width: '100%', padding: '16px', border: errors.email ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px' }} />
                                                {errors.email && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{errors.email}</span>}
                                            </div>
                                        )}

                                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: accountExists ? '#0369a1' : (hasProfile ? '#1e40af' : '#15803d'), border: accountExists ? '1px solid #e0f2fe' : (hasProfile ? '1px solid #bfdbfe' : '1px solid #dcfce7') }}>
                                            {accountExists ? "👋 Chào mừng quý khách trở lại! Vui lòng nhập mật khẩu để tiếp tục." : 
                                             (hasProfile ? `👋 Chào mừng ${guestInfo.fullName} quay trở lại! Bạn đã có hồ sơ, hãy tạo mật khẩu Portal để đặt phòng online.` : 
                                              "✨ Chào mừng hội viên mới! Vui lòng tạo mật khẩu cho tài khoản Royal của bạn.")
                                            }
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>{accountExists ? "Mật khẩu của bạn *" : "Tạo mật khẩu mới *"}</label>
                                            <div style={{ position: 'relative' }}>
                                                <input 
                                                    type={showPass ? "text" : "password"} 
                                                    required 
                                                    value={guestInfo.password} 
                                                    onChange={e => setGuestInfo({...guestInfo, password: e.target.value})} 
                                                    placeholder="********" 
                                                    style={{ width: '100%', padding: '16px', paddingRight: '48px', border: errors.password ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px' }} 
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowPass(!showPass)} 
                                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                            {errors.password && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{errors.password}</span>}
                                        </div>

                                        {accountExists === false && (
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Xác nhận mật khẩu *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type={showPass ? "text" : "password"} 
                                                        required 
                                                        value={guestInfo.confirmPassword} 
                                                        onChange={e => setGuestInfo({...guestInfo, confirmPassword: e.target.value})} 
                                                        placeholder="********" 
                                                        style={{ width: '100%', padding: '16px', paddingRight: '48px', border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px' }} 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowPass(!showPass)} 
                                                        style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {errors.confirmPassword && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '600', display: 'block' }}>{errors.confirmPassword}</span>}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {vipInfo.discountRate > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '16px', borderRadius: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}
                                    >
                                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' }}>
                                            <Star fill="white" size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.9 }}>ƯU ĐÃI HỘI VIÊN {vipInfo.tier.toUpperCase()}</div>
                                            <div style={{ fontSize: '14px', fontWeight: '800' }}>Giảm giá ngay {vipInfo.discountRate * 100}% cho đặt phòng này!</div>
                                        </div>
                                    </motion.div>
                                )}

                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '16px', marginTop: '4px' }}>
                                    <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '700' }}>TỔNG THANH TOÁN (DỰ KIẾN):</div>
                                    {vipInfo.discountRate > 0 && (
                                        <div style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600' }}>
                                            {new Intl.NumberFormat('vi-VN').format(getNights() * (selectedType.basePrice || selectedType.BasePrice || 0))} ₫
                                        </div>
                                    )}
                                    <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#166534', marginTop: '4px' }}>
                                        {new Intl.NumberFormat('vi-VN').format(getNights() * (selectedType.basePrice || selectedType.BasePrice || 0) * (1 - vipInfo.discountRate))} <span style={{ fontSize: '14px' }}>₫</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600', marginTop: '4px' }}>Dành cho {getNights()} đêm / {searchData.guests} người</div>
                                </div>
                                {errors.submit && <span style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', fontWeight: '700' }}>{errors.submit}</span>}
                                
                                <button type="submit" disabled={submitting} style={{ padding: '18px', background: submitting ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', marginTop: '12px' }}>
                                    {submitting ? "Đang xử lý..." : (accountExists === null ? "Tiếp tục" : (accountExists ? "Đăng nhập & Đặt phòng" : "Đăng ký & Đặt phòng"))}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Thành công (Thay thế alert) */}
            <AnimatePresence>
                {bookingSuccess && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(12px)' }} />
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '32px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ width: '80px', height: '80px', background: '#f0fdf4', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '12px' }}>Đặt phòng thành công!</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                                Cảm ơn quý khách đã tin tưởng HMS ROYAL. Yêu cầu của bạn đã được ghi nhận.
                            </p>
                            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '32px', textAlign: 'left' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Mã đặt phòng</span>
                                    <span style={{ fontSize: '18px', color: '#1e293b', fontWeight: '800' }}>{bookingSuccess.bookingCode}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Tổng tiền dự kiến</span>
                                    <span style={{ fontSize: '18px', color: '#10b981', fontWeight: '800' }}>{new Intl.NumberFormat('vi-VN').format(bookingSuccess.totalPrice)} ₫</span>
                                </div>
                            </div>
                            
                            {bookingSuccess.accountInfo && (
                                <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '20px', marginBottom: '32px', textAlign: 'left', border: '1px solid #bae6fd' }}>
                                    <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '800', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>Tài khoản Portal của bạn:</span>
                                    <div style={{ fontSize: '13px', color: '#0c4a6e', fontWeight: '600', lineHeight: '1.6' }}>{bookingSuccess.accountInfo}</div>
                                    <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '8px' }}>Hãy đăng nhập ngay để tích điểm và nhận ưu đãi!</div>
                                </div>
                            )}
                            <button 
                                onClick={() => setBookingSuccess(null)}
                                style={{ width: '100%', padding: '16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                Hoàn tất
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Feature = ({ icon, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' }}>
        <div style={{ color: '#3b82f6' }}>{icon}</div>
        {label}
    </div>
);

export default PublicBooking;
