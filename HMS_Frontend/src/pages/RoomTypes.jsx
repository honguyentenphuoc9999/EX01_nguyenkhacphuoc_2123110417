import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Edit2, Trash2, Save, X, DollarSign, Maximize, Info } from 'lucide-react';
import api from '../api/axios';

const RoomTypes = () => {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ typeName: '', basePrice: 0, maxOccupancy: 2, description: '' });

    useEffect(() => { fetchRoomTypes(); }, []);

    const fetchRoomTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/RoomTypes');
            setRoomTypes(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalData.roomTypeId) {
                await api.put(`/RoomTypes/${modalData.roomTypeId}`, modalData);
            } else {
                await api.post('/RoomTypes', modalData);
            }
            alert("Lưu hạng phòng thành công!");
            fetchRoomTypes();
            setIsModalOpen(false);
        } catch (err) { alert("Lỗi khi lưu dữ liệu."); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa hạng phòng này?")) return;
        try {
            await api.delete(`/RoomTypes/${id}`);
            fetchRoomTypes();
        } catch (err) { alert("Không thể xóa hạng phòng đang có phòng thuộc về nó."); }
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={32} color="#3b82f6" /> Quản lý Hạng phòng
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Thiết lập bảng giá niêm yết và sức chứa cho từng loại phòng.</p>
                </div>
                <button onClick={() => { setModalData({ typeName: '', basePrice: 0, maxOccupancy: 2, description: '' }); setIsModalOpen(true); }} style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} /> Thêm Hạng phòng mới
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {roomTypes.map(rt => (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={rt.roomTypeId || rt.RoomTypeId} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{rt.typeName || rt.TypeName}</h3>
                                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Info size={14}/> {rt.description || rt.Description || 'Không có mô tả.'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setModalData(rt); setIsModalOpen(true); }} style={{ p: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(rt.roomTypeId || rt.RoomTypeId)} style={{ p: '8px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Giá niêm yết (Đêm)</div>
                                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {new Intl.NumberFormat('vi-VN').format(rt.basePrice || rt.BasePrice || 0)} <span style={{ fontSize: '14px' }}>₫</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Tối đa</div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Maximize size={16} color="#64748b" /> {rt.maxOccupancy || rt.MaxOccupancy || 0} Người
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>{modalData.roomTypeId ? 'Cập nhật' : 'Thêm mới'} Hạng phòng</h2>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Tên hạng phòng</label>
                                    <input required value={modalData.typeName} onChange={e => setModalData({...modalData, typeName: e.target.value})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} placeholder="VD: Deluxe Double" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Giá cơ bản (₫)</label>
                                        <input required type="number" value={modalData.basePrice} onChange={e => setModalData({...modalData, basePrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Người tối đa</label>
                                        <input required type="number" value={modalData.maxOccupancy} onChange={e => setModalData({...modalData, maxOccupancy: parseInt(e.target.value)})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Mô tả ngắn</label>
                                    <textarea value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', height: '100px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                                    <button type="submit" style={{ flex: 1, padding: '14px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Lưu thông tin</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RoomTypes;
