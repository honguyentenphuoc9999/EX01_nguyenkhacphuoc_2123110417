import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Plus, Edit2, Trash2, Box, Info, X, Save } from 'lucide-react';
import api from '../api/axios';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ roomNumber: '', floor: 1, roomTypeId: '' });

    useEffect(() => {
        fetchRooms();
        fetchRoomTypes();
    }, []);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Rooms');
            setRooms(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchRoomTypes = async () => {
        try {
            const res = await api.get('/RoomTypes');
            setRoomTypes(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (modalData.roomId) {
                await api.put(`/Rooms/${modalData.roomId}`, modalData);
            } else {
                await api.post('/Rooms', modalData);
            }
            alert("Lưu thông tin phòng thành công!");
            fetchRooms();
            setIsModalOpen(false);
        } catch (err) { alert("Lỗi khi lưu dữ liệu. Kiểm tra xem số phòng đã tồn tại chưa?"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa phòng này?")) return;
        try {
            await api.delete(`/Rooms/${id}`);
            fetchRooms();
        } catch (err) { alert("Không thể xóa phòng đang có lịch đặt."); }
    };

    const getRoomTypeById = (id) => {
        if (!id) return 'Chưa xác định';
        const type = roomTypes.find(rt => (rt.roomTypeId || rt.RoomTypeId) === id);
        return type ? (type.typeName || type.TypeName) : 'Chưa xác định';
    };

    const getStatusColor = (status) => {
        // Hỗ trợ cả trường hợp status là một giá trị hoặc nằm trong object
        const s = typeof status === 'object' ? status.status : status;
        switch (s) {
            case 0: return { bg: '#eff6ff', text: '#3b82f6', label: 'Trống' };
            case 1: return { bg: '#fef2f2', text: '#ef4444', label: 'Đã đặt' };
            case 2: return { bg: '#fefce8', text: '#ca8a04', label: 'Bận' };
            default: return { bg: '#f8fafc', text: '#64748b', label: 'Trống' };
        }
    };

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LayoutGrid size={32} color="#3b82f6" /> Quản lý Danh sách Phòng
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Quản lý chi tiết từng số phòng, vị trí tầng và hạng phòng tương ứng.</p>
                </div>
                <button onClick={() => { setModalData({ roomNumber: '', floor: 1, roomTypeId: roomTypes[0]?.roomTypeId || roomTypes[0]?.RoomTypeId || '' }); setIsModalOpen(true); }} style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} /> Thêm Phòng mới
                </button>
            </div>


            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>SỐ PHÒNG / TẦNG</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>HẠNG PHÒNG</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '20px 24px', fontSize: '12px', color: '#64748b', fontWeight: '700', textAlign: 'right' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && rooms.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center' }}>Đang tải danh sách phòng...</td></tr>
                        ) : rooms.map(room => (
                            <tr key={room.roomId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#f1f5f9', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                                            {room.roomNumber || room.RoomNumber}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>Phòng {room.roomNumber || room.RoomNumber}</div>
                                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tầng {room.floor || room.Floor}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569' }}>
                                        <Box size={16} color="#3b82f6" /> {room.roomTypeName || room.RoomTypeName || 'Chưa xác định'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', background: getStatusColor(room.status !== undefined ? room.status : room.Status).bg, color: getStatusColor(room.status !== undefined ? room.status : room.Status).text }}>
                                        {getStatusColor(room.status !== undefined ? room.status : room.Status).label}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                        <button onClick={() => { setModalData(room); setIsModalOpen(true); }} style={{ p: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(room.roomId)} style={{ p: '8px', border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '450px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>{modalData.roomId ? 'Cập nhật' : 'Thêm mới'} Phòng</h2>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Số phòng *</label>
                                        <input required value={modalData.roomNumber} onChange={e => setModalData({ ...modalData, roomNumber: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} placeholder="VD: 101" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Tầng *</label>
                                        <input required type="number" value={modalData.floor} onChange={e => setModalData({ ...modalData, floor: parseInt(e.target.value) })} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Hạng phòng áp dụng *</label>
                                    <select required value={modalData.roomTypeId} onChange={e => setModalData({ ...modalData, roomTypeId: e.target.value })} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                                        <option value="">-- Chọn hạng phòng --</option>
                                        {roomTypes.map(rt => <option key={rt.roomTypeId} value={rt.roomTypeId}>{rt.typeName}</option>)}
                                    </select>
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

export default Rooms;
