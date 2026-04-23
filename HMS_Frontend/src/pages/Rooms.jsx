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
        // Kiểm tra tối thiểu 1 ảnh
        const finalUrls = modalData.imageUrls || modalData.ImageUrls || '[]';
        const images = JSON.parse(finalUrls);
        if (images.length === 0) {
            alert("Vui lòng tải lên ít nhất 1 ảnh cho phòng.");
            return;
        }

        const payload = {
            roomNumber: modalData.roomNumber || modalData.RoomNumber,
            floor: modalData.floor || modalData.Floor || 1,
            roomTypeId: (modalData.roomTypeId || modalData.RoomTypeId) || null,
            status: modalData.status ?? modalData.Status ?? 0,
            imageUrls: finalUrls 
        };

        console.log("Payload sending:", payload);
        try {
            if (modalData.roomId) {
                await api.put(`/Rooms/${modalData.roomId}`, payload);
            } else {
                await api.post('/Rooms', payload);
            }
            alert("Lưu thông tin phòng thành công!");
            fetchRooms();
            setIsModalOpen(false);
        } catch (err) { 
            console.error("Save error details:", err.response);
            const msg = err.response?.data?.message || err.response?.data || err.message;
            const details = err.response?.data?.errors ? JSON.stringify(err.response.data.errors) : "";
            alert(`Lỗi khi ${modalData.roomId ? 'cập nhật' : 'thêm'} phòng: ${msg} ${details}`); 
        }
    };

    const handleImagesUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Giới hạn tối đa 3 ảnh
        const currentImages = JSON.parse(modalData.imageUrls || '[]');
        if (currentImages.length + files.length > 3) {
            alert("Tối đa chỉ được phép có 3 ảnh cho mỗi phòng.");
            return;
        }

        const newUrls = [...currentImages];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'yxyxbbvj'); // Preset Unsigned của bạn

            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/de0de4yum/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                newUrls.push(data.secure_url);
            } catch (err) {
                console.error("Lỗi upload Cloudinary", err);
            }
        }

        setModalData({ ...modalData, imageUrls: JSON.stringify(newUrls) });
    };

    const removeImage = (index) => {
        const images = JSON.parse(modalData.imageUrls || '[]');
        images.splice(index, 1);
        setModalData({ ...modalData, imageUrls: JSON.stringify(images) });
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

    const getStatusColor = (room) => {
        // HMS Rule: Hỗ trợ cả Số (2) và Chữ ("Occupied") + Tự động tìm cả "Status" và "status"
        const raw = room?.status ?? room?.Status ?? 0;
        const s = String(raw).toLowerCase();

        switch (raw) {
            case 0: case 'vacantclean': case '0':
                return { bg: '#eff6ff', text: '#3b82f6', label: 'Trống' };
            case 1: case 'vacantdirty': case '1':
                return { bg: '#fef2f2', text: '#ef4444', label: 'Chưa dọn' };
            case 2: case 'occupied': case '2':
                return { bg: '#fffbeb', text: '#d97706', label: 'Đang ở' };
            case 3: case 'reserved': case '3':
                return { bg: '#fdf2f8', text: '#db2777', label: 'Đã đặt' };
            default:
                // Hỗ trợ so sánh chuỗi dự phòng
                if (s.includes('occupied') || s === '2') return { bg: '#fffbeb', text: '#d97706', label: 'Đang ở' };
                if (s.includes('dirty') || s === '1') return { bg: '#fef2f2', text: '#ef4444', label: 'Chưa dọn' };
                return { bg: '#eff6ff', text: '#3b82f6', label: 'Trống' };
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ padding: isMobile ? '16px' : '32px' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '20px', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <LayoutGrid size={isMobile ? 24 : 32} color="#3b82f6" /> Danh sách Phòng
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px', fontSize: isMobile ? '13px' : '15px' }}>Quản lý chi tiết từng số phòng, vị trí tầng và hạng phòng.</p>
                </div>
                <button onClick={() => { setModalData({ roomNumber: '', floor: 1, roomTypeId: '' }); setIsModalOpen(true); }} style={{ width: isMobile ? '100%' : 'auto', background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Plus size={20} /> {isMobile ? 'Thêm phòng' : 'Thêm Phòng mới'}
                </button>
            </div>


            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '600px' : 'auto' }}>
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
                                            <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f1f5f9', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', overflow: 'hidden' }}>
                                                {room.imageUrls ? (
                                                    <img src={JSON.parse(room.imageUrls)[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Room" />
                                                ) : (
                                                    <Box size={20} color="#94a3b8" />
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>P.{room.roomNumber || room.RoomNumber}</div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Tầng {room.floor || room.Floor}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>
                                            <Box size={14} color="#3b82f6" /> {room.roomTypeName || room.RoomTypeName || 'Chưa xác định'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: getStatusColor(room).bg, color: getStatusColor(room).text }}>
                                            {getStatusColor(room).label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button onClick={() => {
                                                const normalizedRoom = {
                                                    ...room,
                                                    roomNumber: room.roomNumber || room.RoomNumber,
                                                    floor: room.floor || room.Floor,
                                                    roomTypeId: room.roomTypeId || room.RoomTypeId,
                                                    roomId: room.roomId || room.RoomId
                                                };
                                                setModalData(normalizedRoom);
                                                setIsModalOpen(true);
                                            }} style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(room.roomId)} style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ position: 'relative', width: '100%', maxWidth: '450px', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px' }}>{modalData.roomId ? 'Cập nhật' : 'Thêm mới'} Phòng</h2>

                            {/* Cloudinary Gallery Upload */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>Hình ảnh thực tế (Tối đa 3 ảnh Cloudinary)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                    {JSON.parse(modalData.imageUrls || '[]').map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Room" />
                                            <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                                        </div>
                                    ))}
                                    {JSON.parse(modalData.imageUrls || '[]').length < 3 && (
                                        <div onClick={() => document.getElementById('roomImages').click()} style={{ width: '100%', height: '100px', borderRadius: '12px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                                            <Plus size={20} color="#94a3b8" />
                                            <input id="roomImages" type="file" hidden multiple accept="image/*" onChange={handleImagesUpload} />
                                        </div>
                                    )}
                                </div>
                            </div>

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
