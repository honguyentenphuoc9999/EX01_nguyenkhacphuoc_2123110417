import React, { useState, useEffect } from 'react';
import { 
    Users, Star, Award, TrendingUp, Search, 
    Filter, MoreVertical, Plus, Minus, History, 
    ChevronRight, Gift, ShieldCheck, Mail, Phone,
    ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Loyalty = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [history, setHistory] = useState([]);
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustPoints, setAdjustPoints] = useState(0);
    const [adjustNote, setAdjustNote] = useState('');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/Loyalty');
            setAccounts(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchHistory = async (id) => {
        try {
            const res = await api.get(`/Loyalty/transactions/${id}`);
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleViewDetails = (acc) => {
        setSelectedAccount(acc);
        fetchHistory(acc.accountId);
    };

    const handleAdjustPoints = async () => {
        try {
            await api.post('/Loyalty/add-points', {
                accountId: selectedAccount.accountId,
                points: parseInt(adjustPoints),
                description: adjustNote
            });
            setShowAdjustModal(false);
            setAdjustPoints(0);
            setAdjustNote('');
            fetchAccounts(); // Refresh
            fetchHistory(selectedAccount.accountId);
        } catch (err) {
            alert('Lỗi khi điều chỉnh điểm');
        }
    };

    const getTierColor = (tier) => {
        const tVal = (typeof tier === 'string') ? tier : 
                    tier === 0 ? 'Bronze' : tier === 1 ? 'Silver' : tier === 2 ? 'Gold' : 
                    tier === 3 ? 'Platinum' : tier === 4 ? 'Diamond' : tier === 5 ? 'Royal' : 'Bronze';
        
        switch (tVal) {
            case 'Royal': return { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce', icon: <Award size={14} fill="#a855f7"/>, label: 'Hạng Hoàng Gia' };
            case 'Diamond': return { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490', icon: <ShieldCheck size={14} fill="#06b6d4"/>, label: 'Hạng Kim Cương' };
            case 'Platinum': return { bg: '#f1f5f9', border: '#334155', text: '#0f172a', icon: <ShieldCheck size={14} fill="#334155"/>, label: 'Hạng Bạch Kim' };
            case 'Gold': return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: <Award size={14} fill="#f59e0b"/>, label: 'Hạng Vàng' };
            case 'Silver': return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', icon: <Star size={14}/>, label: 'Hạng Bạc' };
            default: return { bg: '#fff7ed', border: '#ea580c', text: '#9a3412', icon: <Star size={14}/>, label: 'Hạng Đồng' };
        }
    };

    const filteredAccounts = accounts.filter(acc => 
        acc.guest?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.memberNumber?.includes(searchTerm)
    );

    return (
        <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>CRM & Loyalty</h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Hệ thống quản lý định danh hội viên 6 cấp bậc chuẩn quốc tế.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
                        <Gift size={20} /> Cấu hình đổi quà
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {[
                    { label: 'Tổng Hội viên', value: accounts.length, icon: <Users />, color: '#3b82f6' },
                    { label: 'Hạng VIP (Diamond+)', value: accounts.filter(a => a.tier >= 4 || a.tier === 'Diamond' || a.tier === 'Royal').length, icon: <ShieldCheck />, color: '#a855f7' },
                    { label: 'Tổng Điểm Lưu hành', value: accounts.reduce((sum, a) => sum + a.currentPoints, 0).toLocaleString(), icon: <Star />, color: '#f59e0b' },
                    { label: 'Điểm Tích lũy (30d)', value: '+45.2k', icon: <TrendingUp />, color: '#10b981' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                        key={i} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px' }}
                    >
                        <div style={{ width: '56px', height: '56px', background: `${stat.color}15`, color: stat.color, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                        <input 
                            type="text" 
                            placeholder="Tìm hội viên (Tên, Mã TV)..." 
                            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontWeight: '600' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>MÃ HỘI VIÊN</th>
                                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>KHÁCH HÀNG</th>
                                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>HẠNG THÀNH VIÊN</th>
                                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>ĐIỂM HIỆN TẠI</th>
                                <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>NGÀY THAM GIA</th>
                                <th style={{ padding: '20px 24px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Đang tải danh sách...</td></tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Không tìm thấy hội viên nào.</td></tr>
                            ) : filteredAccounts.map((acc) => {
                                const tier = getTierColor(acc.tier);
                                return (
                                    <tr key={acc.accountId} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' }} onClick={() => handleViewDetails(acc)}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ fontWeight: '800', color: '#3b82f6', background: '#eff6ff', padding: '6px 12px', borderRadius: '10px' }}>{acc.memberNumber}</span>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#64748b' }}>
                                                    {acc.guest?.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700', color: '#0f172a' }}>{acc.guest?.fullName}</p>
                                                    <p style={{ fontSize: '12px', color: '#64748b' }}>{acc.guest?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '10px', background: tier.bg, border: `1px solid ${tier.border}`, color: tier.text, width: 'fit-content' }}>
                                                {tier.icon}
                                                <span style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>{tier.label}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: '900' }}>
                                                <Star size={16} fill="#f59e0b" />
                                                {acc.currentPoints.toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', color: '#64748b', fontWeight: '600' }}>
                                            {new Date(acc.enrolledAt).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <ChevronRight size={20} color="#cbd5e1" />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sidebar Details Drawer */}
            <AnimatePresence>
                {selectedAccount && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedAccount(null)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
                        />
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '480px', background: 'white', zIndex: 1001, boxShadow: '-10px 0 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Profile Header */}
                            <div style={{ padding: '32px', background: '#0f172a', color: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900' }}>
                                        {selectedAccount.guest?.fullName?.charAt(0)}
                                    </div>
                                    <button onClick={() => setSelectedAccount(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>✕</button>
                                </div>
                                <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px' }}>{selectedAccount.guest?.fullName}</h1>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Member ID: {selectedAccount.memberNumber}</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>HẠNG HIỆN TẠI</p>
                                        <p style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {getTierColor(selectedAccount.tier).icon}
                                            {getTierColor(selectedAccount.tier).label}
                                        </p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>ĐIỂM TÍCH LŨY</p>
                                        <p style={{ fontWeight: '800', color: '#f59e0b' }}>{selectedAccount.currentPoints.toLocaleString()} PTS</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Area */}
                            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button onClick={() => setShowAdjustModal(true)} style={{ padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <MoreVertical size={16} /> Điều chỉnh điểm
                                </button>
                                <button style={{ padding: '12px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Gift size={16} /> Tặng voucher
                                </button>
                            </div>

                            {/* History Area */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <History size={18} /> Lịch sử giao dịch
                                </h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {history.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Chưa có biến động điểm.</p>
                                    ) : history.map((tx, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #f8fafc' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: tx.points > 0 ? '#f0fdf4' : '#fef2f2', color: tx.points > 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {tx.points > 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <p style={{ fontWeight: '700', color: '#1e293b' }}>{tx.description}</p>
                                                    <p style={{ fontWeight: '800', color: tx.points > 0 ? '#10b981' : '#ef4444' }}>{tx.points > 0 ? '+' : ''}{tx.points}</p>
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(tx.transactionDate).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Box */}
                            <div style={{ padding: '24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ flex: 1, padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={16} color="#64748b" />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedAccount.guest?.email}</span>
                                    </div>
                                    <div style={{ flex: 1, padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={16} color="#64748b" />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{selectedAccount.guest?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Manual Points Adjustment Modal */}
            <AnimatePresence>
                {showAdjustModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAdjustModal(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', width: '450px', background: 'white', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        >
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Điều chỉnh điểm</h2>
                            <p style={{ color: '#64748b', marginBottom: '32px' }}>Tăng hoặc giảm điểm của hội viên <b>{selectedAccount?.guest?.fullName}</b>.</p>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Số điểm (dùng dấu - để trừ)</label>
                                <input 
                                    type="number" 
                                    value={adjustPoints}
                                    onChange={(e) => setAdjustPoints(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontWeight: '800', fontSize: '20px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>Lý do điều chỉnh</label>
                                <textarea 
                                    placeholder="Ví dụ: Tặng quà sinh nhật, Bù điểm do sai sót..."
                                    value={adjustNote}
                                    onChange={(e) => setAdjustNote(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontWeight: '600', height: '100px', resize: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowAdjustModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#f1f5f9', color: '#64748b', fontWeight: '800', cursor: 'pointer' }}>Hủy bỏ</button>
                                <button onClick={handleAdjustPoints} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: '800', cursor: 'pointer' }}>Xác nhận lưu</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Loyalty;
