import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings as SettingsIcon, Home, Layers, Plus, 
    Edit2, Trash2, Save, X, DollarSign, 
    Maximize, Info, CheckCircle2 
} from 'lucide-react';
import api from '../api/axios';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('roomTypes');
    const [roomTypes, setRoomTypes] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [editType, setEditType] = useState('type'); // 'type' or 'room'

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rtRes, rRes] = await Promise.all([
                api.get('/RoomTypes'),
                api.get('/Rooms')
            ]);
            setRoomTypes(rtRes.data);
            setRooms(rRes.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleOpenModal = (type, data = null) => {
        setEditType(type);
        setModalData(data || (type === 'type' ? {
            typeName: '',
            basePrice: 0,
            maxOccupancy: 2,
            description: ''
        } : {
            roomNumber: '',
            floor: 1,
            roomTypeId: roomTypes[0]?.roomTypeId || '',
            status: 0
        }));
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editType === 'type') {
                if (modalData.roomTypeId) {
                    await api.put(`/RoomTypes/${modalData.roomTypeId}`, modalData);
                } else {
                    await api.post('/RoomTypes', modalData);
                }
            } else {
                if (modalData.roomId) {
                    await api.put(`/Rooms/${modalData.roomId}`, modalData);
                } else {
                    await api.post('/Rooms', modalData);
                }
            }
            alert("Lưu cấu hình thành công!");
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi lưu cấu hình.");
        }
    };

    const handleDelete = async (id, type) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa mục này?")) return;
        try {
            await api.delete(`/${type === 'type' ? 'RoomTypes' : 'Rooms'}/${id}`);
            fetchData();
        } catch (err) {
            alert("Không thể xóa. Mục này có thể đang được sử dụng trong một đơn đặt phòng.");
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SettingsIcon size={32} color="#3b82f6" /> Cấu hình Khách sạn
                </h1>
                <p style={{ color: '#64748b', marginTop: '8px' }}>Quản lý hạ tầng phòng nghỉ và chính sách giá niêm yết.</p>
            </div>

            {/* Tabs Selector */}
            <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content', marginBottom: '24px' }}>
                <button 
                    onClick={() => setActiveTab('roomTypes')}
                    style={{ 
                        padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', transition: '0.2s',
                        background: activeTab === 'roomTypes' ? 'white' : 'transparent',
                        color: activeTab === 'roomTypes' ? '#1e293b' : '#64748b',
                        boxShadow: activeTab === 'roomTypes' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <Layers size={18} /> Loại phòng
                </button>
                <button 
                    onClick={() => setActiveTab('rooms')}
                    style={{ 
                        padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', transition: '0.2s',
                        background: activeTab === 'rooms' ? 'white' : 'transparent',
                        color: activeTab === 'rooms' ? '#1e293b' : '#64748b',
                        boxShadow: activeTab === 'rooms' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <Home size={18} /> Danh sách Phòng
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'roomTypes' ? (
                    <motion.div key="types" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                            {roomTypes.map(rt => (
                                <div key={rt.roomTypeId} style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{rt.typeName}</h3>
                                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{rt.description || 'Không có mô tả.'}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleOpenModal('type', rt)} style={{ p: '8px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(rt.roomTypeId, 'type')} style={{ p: '8px', borderRadius: '8px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Giá niêm yết</div>
                                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{new Intl.NumberFormat('vi-VN').format(rt.basePrice)} ₫</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Sức chứa</div>
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{rt.maxOccupancy} Người</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => handleOpenModal('type')}
                                style={{ border: '2px dashed #cbd5e1', borderRadius: '24px', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#64748b', cursor: 'pointer', minHeight: '180px' }}
                            >
                                <Plus size={32} />
                                <span style={{ fontWeight: '700' }}>Thêm Loại phòng mới</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="rooms" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                         <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>SỐ PHÒNG</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>TẦNG</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>LOẠI PHÒNG</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>THAO TÁC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.map(r => (
                                        <tr key={r.roomId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: '700' }}>Phòng {r.roomNumber}</td>
                                            <td style={{ padding: '16px 24px' }}>Tầng {r.floor}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontSize: '12px', background: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>
                                                    {r.roomTypeName || 'Chưa phân loại'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleOpenModal('room', r)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(r.roomId, 'room')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button 
                                onClick={() => handleOpenModal('room')}
                                style={{ width: '100%', padding: '16px', border: 'none', background: '#f8fafc', color: '#3b82f6', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <Plus size={18} /> Thêm Phòng mới
                            </button>
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>{modalData?.roomId || modalData?.roomTypeId ? 'Cập nhật' : 'Thêm mới'} {editType === 'type' ? 'Loại phòng' : 'Phòng'}</h2>
                            
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {editType === 'type' ? (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Tên loại phòng</label>
                                            <input required value={modalData.typeName} onChange={e => setModalData({...modalData, typeName: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} placeholder="VD: Deluxe Double" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Giá cơ bản (₫)</label>
                                                <input required type="number" value={modalData.basePrice} onChange={e => setModalData({...modalData, basePrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Người tối đa</label>
                                                <input required type="number" value={modalData.maxOccupancy} onChange={e => setModalData({...modalData, maxOccupancy: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Mô tả ngắn</label>
                                            <textarea value={modalData.description} onChange={e => setModalData({...modalData, description: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', height: '80px' }} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Số phòng</label>
                                                <input required value={modalData.roomNumber} onChange={e => setModalData({...modalData, roomNumber: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Tầng</label>
                                                <input required type="number" value={modalData.floor} onChange={e => setModalData({...modalData, floor: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Chọn Loại phòng</label>
                                            <select required value={modalData.roomTypeId} onChange={e => setModalData({...modalData, roomTypeId: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                                                {roomTypes.map(rt => <option key={rt.roomTypeId} value={rt.roomTypeId}>{rt.typeName}</option>)}
                                            </select>
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
                                    <button type="submit" style={{ flex: 1, padding: '14px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Lưu cấu hình</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Settings;
