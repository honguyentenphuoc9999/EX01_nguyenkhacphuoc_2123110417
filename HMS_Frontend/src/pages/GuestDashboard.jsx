import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Calendar, Star,
    ShieldCheck, MapPin,
    LogOut, Trash2, Heart,
    AlertCircle, X, Search, ArrowRight,
    Wifi, Coffee, Users, CheckCircle2,
    Utensils, ShoppingBag, Plus, Minus
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

const GuestDashboard = () => {
    const { logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [serviceLoading, setServiceLoading] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [viewingRoomType, setViewingRoomType] = useState(null);
    const [specificRooms, setSpecificRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedSpecificRoom, setSelectedSpecificRoom] = useState(null);
    const [selectedRoomDetail, setSelectedRoomDetail] = useState(null);
    const [cart, setCart] = useState({});
    const [menuItems, setMenuItems] = useState([]);

    const [searchData, setSearchData] = useState({ 
        checkIn: new Date().toISOString().split('T')[0], 
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
        guests: 2 
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [isFlipped, setIsFlipped] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        
        // Thêm tính năng con quay hồi chuyển (Gyroscope) cho điện thoại
        const handleOrientation = (event) => {
            if (!cardRef.current) return;
            const beta = event.beta;    // -180 đến 180 (Nghiêng tới/lui)
            const gamma = event.gamma;  // -90 đến 90 (Nghiêng trái/phải)
            
            if (beta === null || gamma === null) return;

            // Xoay 3D dựa trên góc nghiêng thực tế của điện thoại
            let rotateX = -(beta - 45) / 1.5; 
            let rotateY = gamma / 1.5;
            
            rotateX = Math.max(-25, Math.min(25, rotateX));
            rotateY = Math.max(-25, Math.min(25, rotateY));
            
            cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            cardRef.current.style.boxShadow = `${-rotateY * 2}px ${rotateX * 2}px 50px rgba(0,0,0,0.3)`;
            
            const glare = cardRef.current.querySelector('.holo-glare');
            if (glare) {
                glare.style.opacity = '1';
                const x = 50 + rotateY * 2;
                const y = 50 - rotateX * 2;
                glare.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.7), transparent 60%)`;
            }
        };

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.DeviceOrientationEvent) {
                window.removeEventListener('deviceorientation', handleOrientation);
            }
        };
    }, []);


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

            const [res2, res3, res4] = await Promise.all([
                api.get('/GuestPortal/reservations'),
                api.get('/RoomTypes'),
                api.get('/Inventory/sale-menu')
            ]);
            setReservations(res2.data);
            setRoomTypes(res3.data);
            setMenuItems(res4.data);
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

    const handleSearchRooms = async () => {
        try {
            const res = await api.get(`/RoomTypes?checkIn=${searchData.checkIn}&checkOut=${searchData.checkOut}`);
            setRoomTypes(res.data);
            setShowToast("Đã cập nhật số lượng phòng theo ngày!");
        } catch (err) { console.error(err); }
    };

    const handleViewRoomType = async (rt) => {
        setViewingRoomType(rt);
        setLoadingRooms(true);
        try {
            const res = await api.get(`/PublicBooking/AvailableRoomsInType/${rt.roomTypeId || rt.RoomTypeId}?checkIn=${searchData.checkIn}&checkOut=${searchData.checkOut}`);
            setSpecificRooms(res.data);
        } catch (err) { console.error(err); }
        setLoadingRooms(false);
    };

    const handleQuickBook = async () => {
        if (!selectedType) return;
        setBookingLoading(true);
        try {
            await api.post('/GuestPortal/quick-book', {
                roomTypeId: selectedType.roomTypeId || selectedType.RoomTypeId,
                checkIn: searchData.checkIn,
                checkOut: searchData.checkOut,
                numberOfGuests: parseInt(searchData.guests),
                assignedRoomId: selectedSpecificRoom?.roomId
            });
            setShowToast("Chúc mừng! Đặt phòng nhanh thành công.");
            setSelectedType(null);
            fetchProfile();
        } catch (err) {
            setShowToast("Lỗi đặt phòng: " + (err.response?.data || err.message));
        }
        setBookingLoading(false);
    };

    const handleOrderService = async () => {
        const orderText = Object.entries(cart)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => `${qty}x ${menuItems.find(m => (m.itemId || m.ItemId) === id).itemName}`)
            .join(", ");
        
        if (!orderText) {
            setShowToast("Vui lòng chọn ít nhất một món!");
            return;
        }

        const total = Object.entries(cart).reduce((sum, [id, qty]) => {
            const item = menuItems.find(m => (m.itemId || m.ItemId) === id);
            return sum + (item.sellingPrice * qty);
        }, 0);

        const currentRes = reservations.find(r => (r.status === 2 || String(r.status).toLowerCase() === 'checkedin'));
        if (!currentRes) {
            setShowToast("Bạn chỉ có thể gọi món khi đã nhận phòng (Checked-in)!");
            return;
        }

        setServiceLoading(true);
        try {
            await api.post('/RoomService/Order', {
                ReservationId: currentRes.reservationId || currentRes.ReservationId,
                RoomId: currentRes.roomId || currentRes.RoomId,
                OrderItems: orderText,
                TotalAmount: total,
                Notes: "Khách gọi từ Dashboard"
            });
            setShowToast("Đã gửi đơn gọi món! Nhân viên sẽ giao đến phòng bạn ngay.");
            setCart({});
        } catch (err) {
            setShowToast("Lỗi gọi món: " + (err.response?.data || err.message));
        }
        setServiceLoading(false);
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

    const getNights = () => {
        const start = new Date(searchData.checkIn);
        const end = new Date(searchData.checkOut);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', padding: isMobile ? '16px' : '40px', fontFamily: 'Inter, sans-serif' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '24px', marginBottom: isMobile ? '32px' : '48px' }}>
                <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}>
                    <User size={28} />
                </div>
                <div>
                    <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#1e293b' }}>Chào mừng trở lại, {profile?.fullName || 'Khách quý'}!</h1>
                    <p style={{ color: '#64748b', fontSize: '13px' }}>Khám phá không gian nghỉ dưỡng dành riêng cho bạn.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.8fr) 1fr', gap: isMobile ? '20px' : '32px' }}>
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* --- NEW: QUICK BOOKING SECTION (ĐẶT PHÒNG NHANH) --- */}
                    <div style={{ background: 'white', borderRadius: '32px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Calendar size={24} color="#3b82f6" /> Đặt kỳ nghỉ tiếp theo
                            </h2>
                        </div>
                        
                        {/* Search Bar Inline */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.2fr 0.8fr 1fr', gap: '12px', background: '#f8fafc', padding: isMobile ? '12px' : '16px', borderRadius: '20px', marginBottom: isMobile ? '20px' : '32px', border: '1px solid #f1f5f9' }}>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Nhận phòng</label>
                                <input type="date" min={new Date().toISOString().split('T')[0]} value={searchData.checkIn} onChange={e => {
                                    const newCin = e.target.value;
                                    const cout = new Date(searchData.checkOut);
                                    if (new Date(newCin) >= cout) {
                                        const newCout = new Date(newCin);
                                        newCout.setDate(newCout.getDate() + 1);
                                        setSearchData({...searchData, checkIn: newCin, checkOut: newCout.toISOString().split('T')[0]});
                                    } else {
                                        setSearchData({...searchData, checkIn: newCin});
                                    }
                                }} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Trả phòng</label>
                                <input type="date" min={new Date(new Date(searchData.checkIn).getTime() + 86400000).toISOString().split('T')[0]} value={searchData.checkOut} onChange={e => setSearchData({...searchData, checkOut: e.target.value})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Số khách</label>
                                <select value={searchData.guests} onChange={e => setSearchData({...searchData, guests: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', background: 'white' }}>
                                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Khách</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={handleSearchRooms} style={{ width: '100%', height: '42px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
                                    Tìm phòng
                                </button>
                            </div>
                        </div>

                        {/* Room Types Grid - Optimized layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {roomTypes.filter(rt => (rt.maxOccupancy || rt.MaxOccupancy) >= searchData.guests).map(rt => (
                                <motion.div 
                                    key={rt.roomTypeId || rt.RoomTypeId} 
                                    whileHover={{ y: -8 }}
                                    style={{ background: 'white', borderRadius: '28px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 10px 15px -10px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}
                                >
                                    <div style={{ height: '180px', position: 'relative' }}>
                                        <img 
                                            src={rt.imageUrl || rt.ImageUrl || `https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=60&sig=${rt.typeName || rt.TypeName}`} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            alt={rt.typeName || rt.TypeName}
                                        />
                                        <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '12px', fontWeight: '900', color: '#10b981', fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            {(() => {
                                                const level = profile?.membershipLevel || 'Bronze';
                                                const rates = { 'Royal': 0.25, 'Diamond': 0.20, 'Platinum': 0.15, 'Gold': 0.10, 'Silver': 0.05, 'Bronze': 0 };
                                                const discount = rates[level] || 0;
                                                const basePrice = rt.basePrice || rt.BasePrice || 0;
                                                const finalPrice = basePrice * (1 - discount);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        {discount > 0 && <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '600', marginBottom: '-2px' }}>{new Intl.NumberFormat('vi-VN').format(basePrice)}₫</span>}
                                                        <span>{new Intl.NumberFormat('vi-VN').format(finalPrice)}₫</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px', color: '#1e293b' }}>{rt.typeName || rt.TypeName}</h3>
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                           <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14}/> {rt.maxOccupancy} người</span>
                                           <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Wifi size={14}/> Wifi 5</span>
                                           {(rt.availableRooms > 0 || rt.AvailableRooms > 0) ? (
                                                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', padding: '4px 10px', borderRadius: '10px' }}>
                                                    <CheckCircle2 size={12} /> Còn {rt.availableRooms || rt.AvailableRooms} phòng
                                                </span>
                                           ) : (
                                                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '800', background: '#fef2f2', padding: '4px 10px', borderRadius: '10px' }}>Hết phòng</span>
                                           )}
                                        </div>
                                        <button 
                                            onClick={() => handleViewRoomType(rt)}
                                            style={{ 
                                                width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #3b82f6', 
                                                color: '#3b82f6', background: 'white', fontWeight: '800', fontSize: '13px', 
                                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#3b82f6'; }}
                                        >
                                            Xem danh sách phòng <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* --- NEW: ROOM SERVICE (F&B) --- */}
                    <div style={{ background: '#0f172a', borderRadius: '32px', padding: '32px', color: 'white', border: '1px solid #1e293b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Utensils size={24} color="#f59e0b" /> Dịch vụ phòng 24/7
                            </h2>
                            <ShoppingBag size={24} color={Object.values(cart).some(q => q > 0) ? "#10b981" : "#475569"} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                            {menuItems.map(item => (
                                <div key={item.itemId || item.ItemId} style={{ background: '#1e293b', borderRadius: '20px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '32px', textAlign: 'center' }}>{item.category === 0 ? '🍔' : '🧼'}</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>{item.itemName}</div>
                                        <div style={{ color: '#f59e0b', fontWeight: '900', fontSize: '12px' }}>{new Intl.NumberFormat('vi-VN').format(item.sellingPrice)}₫</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', background: '#0f172a', padding: '6px', borderRadius: '12px' }}>
                                        <button onClick={() => setCart(p => ({...p, [item.itemId || item.ItemId]: Math.max(0, (p[item.itemId || item.ItemId] || 0) - 1)}))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Minus size={14}/></button>
                                        <span style={{ fontWeight: '900', minWidth: '20px', textAlign: 'center' }}>{cart[item.itemId || item.ItemId] || 0}</span>
                                        <button onClick={() => setCart(p => ({...p, [item.itemId || item.ItemId]: (p[item.itemId || item.ItemId] || 0) + 1}))} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer' }}><Plus size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {Object.values(cart).some(q => q > 0) && (
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                onClick={handleOrderService}
                                disabled={serviceLoading}
                                style={{ width: '100%', padding: '16px', borderRadius: '18px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }}
                            >
                                {serviceLoading ? "ĐANG GỬI ĐƠN..." : "ĐẶT MÓN NGAY"}
                            </motion.button>
                        )}
                    </div>

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
                                    <div key={res.reservationId} style={{ padding: isMobile ? '20px' : '24px', border: '1px solid #f1f5f9', borderRadius: '24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '20px' : '0' }}>
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
                    {/* Loyalty Card - Styled by Membership Level */}
                    {(() => {
                        let level = profile?.membershipLevel || 'Bronze';
                        
                        // HMS Fallback: Tự động tính toán lại mức hạng dựa trên số điểm thực tế dưới Frontend
                        // để xử lý các tài khoản cũ chưa kịp được UpdateTier dưới Backend.
                        const pts = profile?.loyaltyPoints || 0;
                        if (pts >= 50000) level = 'Royal';
                        else if (pts >= 25000) level = 'Diamond';
                        else if (pts >= 10000) level = 'Platinum';
                        else if (pts >= 3000) level = 'Gold';
                        else if (pts >= 1000) level = 'Silver';
                        else level = 'Bronze';

                        const styles = {
                            'Royal': {
                                gradient: 'linear-gradient(135deg, #7e22ce, #a855f7, #ec4899, #8b5cf6)',
                                shadow: '0 20px 40px rgba(168, 85, 247, 0.4)',
                                badge: 'THÀNH VIÊN HOÀNG GIA',
                                main: 'Hạng Hoàng Gia'
                            },
                            'Diamond': {
                                gradient: 'linear-gradient(135deg, #0891b2, #06b6d4, #3b82f6, #06b6d4)',
                                shadow: '0 20px 40px rgba(6, 182, 212, 0.4)',
                                badge: 'THÀNH VIÊN KIM CƯƠNG',
                                main: 'Hạng Kim Cương'
                            },
                            'Platinum': {
                                gradient: 'linear-gradient(135deg, #0f172a, #334155, #64748b, #334155)',
                                shadow: '0 20px 40px rgba(15, 23, 42, 0.4)',
                                badge: 'THÀNH VIÊN BẠCH KIM',
                                main: 'Hạng Bạch Kim'
                            },
                            'Gold': {
                                gradient: 'linear-gradient(135deg, #b45309, #f59e0b, #fbbf24, #f59e0b)',
                                shadow: '0 20px 40px rgba(245, 158, 11, 0.4)',
                                badge: 'THÀNH VIÊN VÀNG',
                                main: 'Hạng Vàng'
                            },
                            'Silver': {
                                gradient: 'linear-gradient(135deg, #64748b, #94a3b8, #cbd5e1, #94a3b8)',
                                shadow: '0 20px 40px rgba(148, 163, 184, 0.4)',
                                badge: 'THÀNH VIÊN BẠC',
                                main: 'Hạng Bạc'
                            },
                            'Bronze': {
                                gradient: 'linear-gradient(135deg, #9a3412, #ea580c, #f97316, #ea580c)',
                                shadow: '0 20px 40px rgba(234, 88, 12, 0.4)',
                                badge: 'THÀNH VIÊN ĐỒNG',
                                main: 'Hạng Đồng'
                            }
                        };
                        const s = styles[level] || styles['Bronze'];

                        return (
                            <>
                                <style>{`
                                  .holo-container {
                                    perspective: 1200px;
                                    margin-bottom: 32px;
                                  }
                                  .holo-card-3d {
                                    transform-style: preserve-3d;
                                    transition: transform 0.1s ease-out, box-shadow 0.1s ease-out;
                                    position: relative;
                                    width: 100%;
                                    min-height: 200px;
                                    border-radius: 20px;
                                  }
                                  .holo-flip-wrapper {
                                    display: grid;
                                    transform-style: preserve-3d;
                                    transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                                    width: 100%;
                                    height: 100%;
                                  }
                                  .holo-flip-wrapper.is-flipped {
                                    transform: rotateY(180deg);
                                  }
                                  .holo-face {
                                    grid-area: 1 / 1;
                                    position: relative;
                                    background: ${s.gradient};
                                    padding: 32px;
                                    border-radius: 20px;
                                    color: white;
                                    backface-visibility: hidden;
                                    -webkit-backface-visibility: hidden;
                                    transform-style: preserve-3d;
                                    box-shadow: 0 15px 35px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.2);
                                  }
                                  .holo-back {
                                    transform: rotateY(180deg);
                                  }
                                  /* Lớp viền/nhũ lấp lánh (Overlay) */
                                  .holo-foil {
                                    position: absolute;
                                    top: 0; left: 0; right: 0; bottom: 0;
                                    border-radius: 20px;
                                    background: linear-gradient(
                                        115deg, 
                                        transparent 0%, 
                                        rgba(255,255,255,0.1) 15%, 
                                        rgba(255,255,255,0.8) 25%, 
                                        rgba(255,255,255,0.1) 35%, 
                                        transparent 45%,
                                        rgba(255,255,255,0.4) 55%,
                                        transparent 70%
                                    );
                                    background-size: 250% 250%;
                                    mix-blend-mode: color-dodge;
                                    opacity: 0;
                                    pointer-events: none;
                                    transition: opacity 0.3s ease-out;
                                    z-index: 10;
                                  }
                                  /* Lớp ngũ sắc mờ ảo khi chiếu sáng */
                                  .holo-iridescent {
                                    position: absolute;
                                    inset: 0;
                                    border-radius: 20px;
                                    opacity: 0;
                                    mix-blend-mode: overlay;
                                    pointer-events: none;
                                    transition: opacity 0.3s ease-out;
                                    z-index: 9;
                                  }
                                  /* Trên mobile, auto-shimmer */
                                  @media (max-width: 768px) {
                                    .holo-foil {
                                        opacity: 0.5;
                                        animation: foilMobile 5s ease infinite;
                                    }
                                  }
                                  @keyframes foilMobile {
                                    0% { background-position: 0% 50%; opacity: 0.2; }
                                    50% { background-position: 100% 50%; opacity: 0.6; }
                                    100% { background-position: 0% 50%; opacity: 0.2; }
                                  }
                                `}</style>

                                <div 
                                    className="holo-container"
                                    onClick={() => setIsFlipped(!isFlipped)}
                                    style={{ cursor: 'pointer' }}
                                    onMouseMove={(e) => {
                                        const container = e.currentTarget;
                                        const card = container.querySelector('.holo-card-3d');
                                        if (!card) return;
                                        const rect = container.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;
                                        
                                        const centerX = rect.width / 2;
                                        const centerY = rect.height / 2;
                                        
                                        // Độ nghiêng sâu hơn (Max 25 độ)
                                        const rotateX = ((y - centerY) / centerY) * -25;
                                        const rotateY = ((x - centerX) / centerX) * 25;

                                        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
                                        card.style.boxShadow = `${-rotateY * 1.5}px ${rotateX * 1.5}px 50px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.4)`;
                                        
                                        const foils = card.querySelectorAll('.holo-foil');
                                        const iridescents = card.querySelectorAll('.holo-iridescent');
                                        if (foils.length > 0 && iridescents.length > 0) {
                                            foils.forEach(f => f.style.opacity = '1');
                                            iridescents.forEach(i => i.style.opacity = '1');
                                            
                                            // Tính tỷ lệ phần trăm (0-100)
                                            const bgPosX = (x / rect.width) * 100;
                                            const bgPosY = (y / rect.height) * 100;
                                            
                                            foils.forEach(f => f.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`);
                                            iridescents.forEach(i => i.style.background = `radial-gradient(circle at ${bgPosX}% ${bgPosY}%, rgba(255,200,255,0.6), rgba(200,255,255,0.6), rgba(255,255,200,0.6), transparent 70%)`);
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const container = e.currentTarget;
                                        const card = container.querySelector('.holo-card-3d');
                                        if (!card) return;
                                        card.style.transform = 'rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                                        card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.2)';
                                        const foils = card.querySelectorAll('.holo-foil');
                                        const iridescents = card.querySelectorAll('.holo-iridescent');
                                        foils.forEach(f => f.style.opacity = '0');
                                        iridescents.forEach(i => i.style.opacity = '0');
                                    }}
                                    onTouchMove={(e) => {
                                        if(e.touches.length > 0) {
                                            const touch = e.touches[0];
                                            const container = e.currentTarget;
                                            const card = container.querySelector('.holo-card-3d');
                                            if(!card) return;
                                            const rect = container.getBoundingClientRect();
                                            const x = touch.clientX - rect.left;
                                            const y = touch.clientY - rect.top;

                                            const centerX = rect.width / 2;
                                            const centerY = rect.height / 2;

                                            let rotateX = ((y - centerY) / centerY) * -20;
                                            let rotateY = ((x - centerX) / centerX) * 20;

                                            rotateX = Math.max(-20, Math.min(20, rotateX));
                                            rotateY = Math.max(-20, Math.min(20, rotateY));

                                            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                                            
                                            const foils = card.querySelectorAll('.holo-foil');
                                            if (foils.length > 0) {
                                                foils.forEach(f => {
                                                    f.style.opacity = '1';
                                                    const bgPosX = (x / rect.width) * 100;
                                                    const bgPosY = (y / rect.height) * 100;
                                                    f.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
                                                });
                                            }
                                        }
                                    }}
                                    onTouchEnd={(e) => {
                                        const container = e.currentTarget;
                                        const card = container.querySelector('.holo-card-3d');
                                        if(!card) return;
                                        card.style.transform = 'rotateX(0) rotateY(0)';
                                        const foils = card.querySelectorAll('.holo-foil');
                                        foils.forEach(f => f.style.opacity = '0');
                                    }}
                                >
                                    <div 
                                        ref={cardRef}
                                        className="holo-card-3d" 
                                        id="holoCard"
                                    >
                                        <div className={`holo-flip-wrapper ${isFlipped ? 'is-flipped' : ''}`}>
                                            
                                            {/* MẶT TRƯỚC */}
                                            <div className="holo-face holo-front">
                                                <div className="holo-foil"></div>
                                                <div className="holo-iridescent"></div>
                                                
                                                <Star size={100} style={{ position: 'absolute', top: '-15px', right: '-25px', opacity: 0.15, transform: 'translateZ(20px)' }} />
                                                
                                                <div style={{ position: 'relative', transform: 'translateZ(60px)', zIndex: 20 }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.9, marginBottom: '24px' }}>
                                                        {s.badge}
                                                    </div>
                                                    <div style={{ fontSize: '38px', fontWeight: '900', marginBottom: '8px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                                        {s.main}
                                                    </div>
                                                    <div style={{ fontSize: '15px' }}>
                                                        Số điểm tích lũy: <b style={{ fontSize: '18px', textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>{(profile?.loyaltyPoints || 0).toLocaleString()} PTS</b>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '12px', opacity: 0.6, transform: 'translateZ(30px)' }}>
                                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                                                        Nhấn để xem / Click to flip ⟳
                                                    </motion.div>
                                                </div>
                                            </div>

                                            {/* MẶT SAU */}
                                            <div className="holo-face holo-back">
                                                <div className="holo-foil"></div>
                                                <div className="holo-iridescent"></div>
                                                
                                                <div style={{ position: 'relative', transform: 'translateZ(40px)', zIndex: 20 }}>
                                                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '8px' }}>
                                                        Thông tin Hội Viên / Member Profile
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '11px', opacity: 0.7 }}>Họ Tên / Full Name:</div>
                                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>{profile?.fullName || 'Khách hàng'}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '11px', opacity: 0.7 }}>CCCD/CMND / ID Card:</div>
                                                            <div style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '1px' }}>{profile?.identityCard || profile?.cccd || '■■■■ ■■■ ■■■'}</div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <div>
                                                                <div style={{ fontSize: '11px', opacity: 0.7 }}>Số đt / Phone:</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{profile?.phone || 'Chưa cập nhật'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '11px', opacity: 0.7 }}>Email:</div>
                                                                <div style={{ fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || 'Chưa cập nhật'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

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

            {/* --- NEW: THÊM MODAL DANH SÁCH PHÒNG CỤ THỂ CHỌN THEO LOẠI --- */}
            <AnimatePresence>
                {viewingRoomType && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '10px' : '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setViewingRoomType(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#f8fafc', borderRadius: '32px', padding: isMobile ? '24px' : '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>
                                        {selectedRoomDetail ? `Chi tiết phòng ${selectedRoomDetail.roomNumber}` : `Chọn phòng thuộc hạng: ${viewingRoomType.typeName}`}
                                    </h2>
                                    {!selectedRoomDetail && <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Sắp nhận phòng vào: {searchData.checkIn} — Trả phòng: {searchData.checkOut}</p>}
                                </div>
                                <button onClick={() => {
                                    if (selectedRoomDetail) setSelectedRoomDetail(null);
                                    else setViewingRoomType(null);
                                }} style={{ background: '#e2e8f0', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={20}/>
                                </button>
                            </div>

                            {selectedRoomDetail ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {(selectedRoomDetail.imageUrls && JSON.parse(selectedRoomDetail.imageUrls).length > 0) ? (
                                            JSON.parse(selectedRoomDetail.imageUrls).map((img, idx) => (
                                                <img key={idx} src={img} style={{ width: '300px', height: '200px', objectFit: 'cover', borderRadius: '16px', border: '1px solid #e2e8f0' }} alt={`Room ${idx}`} />
                                            ))
                                        ) : (
                                            <img src={`https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=60`} style={{ width: '400px', height: '250px', objectFit: 'cover', borderRadius: '16px' }} alt="Placeholder" />
                                        )}
                                    </div>
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Phòng {selectedRoomDetail.roomNumber}</h3>
                                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                                    {selectedRoomDetail.isAvailable ? (
                                                        <span style={{ fontSize: '13px', background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '8px', fontWeight: '800' }}>● Còn trống ngày này</span>
                                                    ) : (
                                                        <span style={{ fontSize: '13px', background: '#fef2f2', color: '#dc2626', padding: '6px 12px', borderRadius: '8px', fontWeight: '800' }}>■ Đã có khách đặt</span>
                                                    )}
                                                    <span style={{ fontSize: '13px', background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontWeight: '800' }}>Hạng: {viewingRoomType.typeName}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{new Intl.NumberFormat('vi-VN').format(viewingRoomType.basePrice || viewingRoomType.BasePrice)}<span style={{fontSize: '14px', color: '#64748b'}}>₫/đêm</span></div>
                                            </div>
                                        </div>
                                        <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '24px' }}>
                                            Đây là góc nhìn chi tiết của phòng {selectedRoomDetail.roomNumber}. HMS Royal luôn đảm bảo phòng vật lý này được trang bị đầy đủ tiện nghi tiêu chuẩn tốt nhất để quý khách có một kỳ nghỉ hoàn hảo.
                                        </p>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <button onClick={() => setSelectedRoomDetail(null)} style={{ flex: 1, padding: '16px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>Quay lại danh sách</button>
                                            <button 
                                                disabled={!selectedRoomDetail.isAvailable}
                                                onClick={() => {
                                                    setSelectedSpecificRoom(selectedRoomDetail);
                                                    setSelectedRoomDetail(null);
                                                    setSelectedType(viewingRoomType);
                                                    setViewingRoomType(null);
                                                }}
                                                style={{ flex: 1.5, padding: '16px', background: selectedRoomDetail.isAvailable ? '#3b82f6' : '#cbd5e1', color: selectedRoomDetail.isAvailable ? 'white' : '#94a3b8', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: selectedRoomDetail.isAvailable ? 'pointer' : 'not-allowed' }}
                                            >
                                                {selectedRoomDetail.isAvailable ? "Quyết định đặt phòng này" : "Phòng đang bận"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : loadingRooms ? (
                                <div style={{ textAlign: 'center', padding: '60px' }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} />
                                    <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '600' }}>Đang tải danh sách phòng chi tiết...</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(220px, 1fr))`, gap: '16px' }}>
                                    {specificRooms.map(room => (
                                        <div key={room.roomId} style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: room.isAvailable ? '2px solid #3b82f6' : '2px solid #e2e8f0', opacity: room.isAvailable ? 1 : 0.6, position: 'relative' }}>
                                            <div style={{ height: '140px', background: '#f1f5f9' }}>
                                                <img 
                                                    src={(room.imageUrls && JSON.parse(room.imageUrls).length > 0) ? JSON.parse(room.imageUrls)[0] : `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=60`} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    alt={room.roomNumber}
                                                />
                                            </div>
                                            <div style={{ padding: '16px' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>Phòng {room.roomNumber}</div>
                                                {room.isAvailable ? (
                                                    <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>● Còn trống</span>
                                                ) : (
                                                    <span style={{ fontSize: '12px', background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '8px', fontWeight: '800' }}>■ Đã có người</span>
                                                )}
                                                
                                                <button 
                                                    onClick={() => setSelectedRoomDetail(room)}
                                                    style={{ width: '100%', padding: '12px', background: 'white', color: '#3b82f6', border: '2px solid #e0f2fe', borderRadius: '12px', fontWeight: '800', marginTop: '16px', cursor: 'pointer', transition: '0.2s' }}
                                                >
                                                    Xem chi tiết phòng
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {specificRooms.length === 0 && (
                                        <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Hiện tại không có phòng vật lý thuộc hạng này.</div>
                                    )}
                                </div>
                            )}
                            
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => {
                                        setSelectedSpecificRoom(null); // Tự động chọn
                                        setSelectedType(viewingRoomType);
                                        setViewingRoomType(null);
                                    }}
                                    style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Bỏ qua, hãy tự động xếp phòng cho tôi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Booking Confirmation Modal */}
            <AnimatePresence>
                {selectedType && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' }} onClick={() => setSelectedType(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'relative', width: '100%', maxWidth: '440px', background: 'white', borderRadius: '32px', padding: '32px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <div style={{ width: '64px', height: '64px', background: '#f0fdf4', color: '#10b981', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '900' }}>Xác nhận đặt phòng</h2>
                                <p style={{ color: '#64748b', fontSize: '14px' }}>Kỳ nghỉ đẳng cấp đang chờ đón quý khách.</p>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>Hạng phòng:</span>
                                    <span style={{ fontWeight: '800', fontSize: '13px' }}>{selectedType.typeName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b', fontSize: '13px' }}>Thời gian:</span>
                                    <span style={{ fontWeight: '800', fontSize: '13px' }}>{getNights()} đêm</span>
                                </div>
                                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#1e293b', fontWeight: '800' }}>Tổng cộng:</span>
                                    <span style={{ textAlign: 'right' }}>
                                        {(() => {
                                            const level = profile?.membershipLevel || 'Bronze';
                                            const rates = { 'Royal': 0.25, 'Diamond': 0.20, 'Platinum': 0.15, 'Gold': 0.10, 'Silver': 0.05, 'Bronze': 0 };
                                            const discount = rates[level] || 0;
                                            const originalPrice = getNights() * selectedType.basePrice;
                                            const finalPrice = originalPrice * (1 - discount);
                                            return (
                                                <>
                                                    {discount > 0 && <div style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>{new Intl.NumberFormat('vi-VN').format(originalPrice)}₫</div>}
                                                    <div style={{ fontWeight: '900', fontSize: '20px', color: '#10b981' }}>{new Intl.NumberFormat('vi-VN').format(finalPrice)}₫</div>
                                                </>
                                            );
                                        })()}
                                    </span>
                                </div>
                            </div>
                            
                            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginBottom: '24px' }}>
                                Thông tin người đặt: <b>{profile?.fullName}</b> ({profile?.phone}) <br/>
                                <span style={{ color: '#10b981' }}>✨ Dữ liệu hội viên đã được tự động áp dụng.</span>
                            </p>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setSelectedType(null)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Quay lại</button>
                                <button 
                                    onClick={handleQuickBook} 
                                    disabled={bookingLoading}
                                    style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer', opacity: bookingLoading ? 0.5 : 1 }}
                                >
                                    {bookingLoading ? "Đang xử lý..." : "Xác nhận đặt"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
