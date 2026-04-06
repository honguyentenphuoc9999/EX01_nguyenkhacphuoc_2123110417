import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building2, CreditCard, User, MapPin, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

const Settings = () => {
    const [settings, setSettings] = useState({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        hotelAddress: '',
        hotelPhone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notif, setNotif] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/SystemSettings');
                setSettings(res.data);
            } catch (err) {
                console.error("Lỗi tải cài đặt", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/SystemSettings', settings);
            setNotif({ msg: "Đã cập nhật cấu hình hệ thống thành công!", type: 'success' });
            setTimeout(() => setNotif(null), 3000);
        } catch (err) {
            setNotif({ msg: "Lỗi khi lưu cài đặt", type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải cấu hình...</div>;

    return (
        <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Cài đặt Hệ thống</h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Quản lý thông tin thanh toán VietQR và hồ sơ khách sạn.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                    <form onSubmit={handleSave} style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '12px', borderRadius: '16px' }}><CreditCard size={24}/></div>
                            <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Thông tin Thanh toán VietQR</h2>
                        </div>

                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>TÊN NGÂN HÀNG (VIẾT TẮT)</label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                                    <input 
                                        value={settings.bankName} 
                                        onChange={e => setSettings({...settings, bankName: e.target.value.toUpperCase()})}
                                        placeholder="Ví dụ: VCB, MB, TCB..."
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                    />
                                </div>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>* Sử dụng tên viết tắt chuẩn của Napas để sinh mã QR chính xác.</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>SỐ TÀI KHOẢN NHẬN TIỀN</label>
                                <div style={{ position: 'relative' }}>
                                    <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                                    <input 
                                        value={settings.accountNumber} 
                                        onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>TÊN CHỦ TÀI KHOẢN (KHÔNG DẤU)</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8' }} />
                                    <input 
                                        value={settings.accountHolder} 
                                        onChange={e => setSettings({...settings, accountHolder: e.target.value.toUpperCase()})}
                                        style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                    />
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '8px 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>SỐ ĐIỆN THOẠI KHÁCH SẠN</label>
                                    <input 
                                        value={settings.hotelPhone} 
                                        onChange={e => setSettings({...settings, hotelPhone: e.target.value})}
                                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>ĐỊA CHỈ KHÁCH SẠN</label>
                                    <input 
                                        value={settings.hotelAddress} 
                                        onChange={e => setSettings({...settings, hotelAddress: e.target.value})}
                                        style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '15px' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={saving}
                            style={{ width: '100%', marginTop: '32px', background: '#0f172a', color: 'white', padding: '16px', borderRadius: '18px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                        >
                            {saving ? 'Đang lưu...' : <><Save size={20}/> Lưu tất cả cài đặt</>}
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#fef3c7', padding: '32px', borderRadius: '32px', border: '1px solid #fde68a' }}>
                            <ShieldCheck size={40} style={{ color: '#d97706', marginBottom: '16px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#92400e', marginBottom: '8px' }}>Lưu ý Bảo mật</h3>
                            <p style={{ color: '#b45309', fontSize: '14px', lineHeight: '1.6' }}>Thông tin ngân hàng này sẽ được dùng để tạo mã VietQR cho khách hàng. Hãy chắc chắn Số tài khoản là mã số nhận tiền chính xác của khách sạn.</p>
                        </div>
                        
                        <div style={{ background: '#f0fdf4', padding: '32px', borderRadius: '32px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#15803d', marginBottom: '12px' }}>TRẠNG THÁI VIETQR</h3>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', color: '#166534', fontWeight: '700' }}>
                                <CheckCircle2 size={18} /> Đang hoạt động
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {notif && (
                <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '16px 32px', borderRadius: '20px', fontWeight: '700', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 10000 }}>
                    {notif.msg}
                </div>
            )}
        </div>
    );
};

export default Settings;
