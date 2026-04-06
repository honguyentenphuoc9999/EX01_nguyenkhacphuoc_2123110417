import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Coffee, 
    CheckCircle2, 
    Clock, 
    RefreshCw, 
    User, 
    UserCheck, 
    XCircle, 
    Camera, 
    LayoutGrid, 
    Image as ImageIcon, 
    AlertCircle, 
    Send, 
    Search,
    History,
    Calendar
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';

// --- BỘ CẢM BIẾN ĐỌC ẢNH AN TOÀN ---
const safeParseImages = (data) => {
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [data];
    } catch (e) {
        return [data];
    }
};

// --- MODAL XEM CẬN CẢNH ẢNH (ZOOM) ---
const ImageGalleryModal = ({ images, onClose }) => {
    const [index, setIndex] = React.useState(0);
    const urls = safeParseImages(images);

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
            <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'white', border: 'none', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', fontSize: '24px' }}>×</button>
            <motion.img 
                key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                src={urls[index]} style={{ maxWidth: '90%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
            />
            {urls.length > 1 && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', overflowX: 'auto', padding: '10px', width: '100%', justifyContent: 'center' }}>
                    {urls.map((u, i) => (
                        <img 
                            key={i} src={u} onClick={() => setIndex(i)} 
                            style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: index === i ? '3px solid #3b82f6' : '1px solid white', cursor: 'pointer', transition: '0.2s' }} 
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

// --- MODAL TỪ CHỐI DỌN PHÒNG (REJECT) ---
const RejectionModal = ({ onConfirm, onClose }) => {
    const [reason, setReason] = React.useState('');

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
            <motion.div 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} 
                style={{ background: 'white', width: '100%', maxWidth: '420px', borderRadius: '28px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '20px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Chưa đạt yêu cầu?</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Hãy cho nhân viên biết lý do vì sao họ cần phải dọn lại phòng này.</p>
                <textarea 
                    value={reason} onChange={e => setReason(e.target.value)} 
                    placeholder="VD: Ga giường chưa phẳng, sàn nhà còn bụi..."
                    style={{ width: '100%', height: '100px', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#f1f5f9', fontWeight: '700', cursor: 'pointer' }}>Bỏ qua</button>
                    <button onClick={() => onConfirm(reason)} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Gửi thông báo</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MODAL CHỤP NHIỀU ẢNH ---
const ProofUploadModal = ({ task, onConfirm, onClose }) => {
    const [filePreviews, setFilePreviews] = React.useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreviews(prev => [...prev, reader.result]);
            reader.readAsDataURL(file);
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
            <motion.div 
                initial={{ y: 50, scale: 0.9 }} animate={{ y: 0, scale: 1 }}
                style={{ background: 'white', width: '100%', maxWidth: '520px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
                <div style={{ padding: '32px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ width: '70px', height: '70px', background: '#fdf4ff', color: '#d946ef', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Camera size={36} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Bằng chứng vệ sinh</h2>
                        <p style={{ color: '#64748b' }}>Phòng {task?.room?.roomNumber} - Hãy gửi ít nhất 2 ảnh chi tiết.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                        {filePreviews.map((p, i) => (
                            <div key={i} style={{ position: 'relative', height: '100px' }}>
                                <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                                <button onClick={() => setFilePreviews(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px' }}>×</button>
                            </div>
                        ))}
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', border: '2px dashed #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: '0.2s', color: '#94a3b8' }}>
                            <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            <Camera size={24} />
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button onClick={onClose} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Đóng lại</button>
                        <button 
                            disabled={filePreviews.length === 0}
                            onClick={() => onConfirm(JSON.stringify(filePreviews))} 
                            style={{ padding: '16px', borderRadius: '16px', border: 'none', background: filePreviews.length > 0 ? '#d946ef' : '#f1f5f9', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Gửi duyệt ({filePreviews.length} ảnh)
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const Toast = ({ message, type }) => (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} style={{ position: 'fixed', bottom: '30px', right: '30px', background: type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 15000, fontWeight: '700' }}>
        {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {message}
    </motion.div>
);

const Housekeeping = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'history'
    const [tasks, setTasks] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStaffMap, setSelectedStaffMap] = useState({});
    const [notification, setNotification] = useState(null);
    const [taskToUpload, setTaskToUpload] = useState(null);
    const [selectedImages, setSelectedImages] = useState(null);
    const [taskToReject, setTaskToReject] = useState(null);

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
            
            // CHỈ QUẢN LÝ MỚI ĐƯỢC TẢI DANH SÁCH NHÂN VIÊN
            const requests = [api.get('/HousekeepingTasks')];
            if (isAdmin) requests.push(api.get('/Staff'));

            const results = await Promise.all(requests);
            
            setTasks(results[0].data);
            if (isAdmin && results[1]) {
                setStaffList(results[1].data);
            }
        } catch (err) {
            // Không báo lỗi nếu chỉ là lỗi phân quyền danh mục phụ
            if (err.response?.status !== 403) {
                notify("Lỗi tải dữ liệu buồng phòng", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssignStaff = async (task) => {
        const staffId = selectedStaffMap[task.taskId];
        if (!staffId) return notify("Vui lòng chọn nhân viên!", "error");
        try {
            await api.put(`/HousekeepingTasks/${task.taskId}`, {
                ...task,
                assignedStaffId: staffId,
                status: 'InProgress'
            });
            notify("Đã giao việc thành công!");
            fetchData();
        } catch (err) {
            notify("Lỗi phân công", "error");
        }
    };

    const handleApproveTask = async (task) => {
        try {
            await api.put(`/HousekeepingTasks/${task.taskId}`, {
                ...task,
                status: 'Completed',
                notes: `Duyệt SẠCH bởi ${currentUser?.username}`
            });
            notify("Phòng đã sẵn sàng đón khách!");
            fetchData();
        } catch (err) {
            notify("Lỗi phê duyệt", "error");
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 0: case '0': case 'Pending': 
                return { bg: '#fef3c7', text: '#d97706', label: 'Chờ điều phối', icon: <Clock size={16}/> };
            case 1: case '1': case 'InProgress': 
                return { bg: '#eff6ff', text: '#3b82f6', label: 'Đang vệ sinh', icon: <RefreshCw size={16}/> };
            case 'UnderReview': 
                return { bg: '#fdf4ff', text: '#d946ef', label: 'Chờ duyệt', icon: <UserCheck size={16}/> };
            case 2: case '2': case 'Completed': 
                return { bg: '#dcfce7', text: '#166534', label: 'Đã hoàn tất', icon: <CheckCircle2 size={16}/> };
            default: 
                return { bg: '#f1f5f9', text: '#475569', label: 'Khác', icon: <Coffee size={16}/> };
        }
    };

    // --- LỌC DỮ LIỆU TÁCH BIỆT ---
    const allFiltered = tasks.filter(t => {
        const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
        const isMyTask = t.assignedStaffId && currentUser?.staffId && 
                         t.assignedStaffId.toString().toLowerCase() === currentUser.staffId.toString().toLowerCase();
        return isAdmin || isMyTask;
    });
    
    // Chỉ hiện các phòng đang xử lý
    const activeTasks = allFiltered.filter(t => t.status !== 2 && t.status !== '2' && t.status !== 'Completed');
    
    // Hiện lịch sử các phòng đã xong
    const historyTasks = allFiltered.filter(t => t.status === 2 || t.status === '2' || t.status === 'Completed')
        .sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Quản lý Buồng phòng</h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>Điều phối & Theo dõi lịch sử vệ sinh tiêu chuẩn 5 sao.</p>
                </div>
                <button onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'white', color: '#1e293b', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Làm mới dữ liệu
                </button>
            </div>

            {/* --- TAB CHUYÊN NGHIỆP --- */}
            <div style={{ display: 'flex', gap: '8px', background: '#e2e8f0', padding: '6px', borderRadius: '18px', width: 'fit-content', marginBottom: '32px' }}>
                <button 
                    onClick={() => setActiveTab('tasks')}
                    style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: activeTab === 'tasks' ? 'white' : 'transparent', color: activeTab === 'tasks' ? '#3b82f6' : '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'tasks' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <LayoutGrid size={18} /> Nhiệm vụ cần dọn ({activeTasks.length})
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: activeTab === 'history' ? 'white' : 'transparent', color: activeTab === 'history' ? '#3b82f6' : '#64748b', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'history' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}
                >
                    <History size={18} /> Lịch sử vệ sinh ({historyTasks.length})
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Đang tải...</div>
            ) : activeTab === 'tasks' ? (
                /* --- TAB 1: DANH SÁCH NHIỆM VỤ --- */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                    {activeTasks.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: '80px', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
                            <p style={{ color: '#64748b', fontWeight: '600' }}>Tất cả các phòng đã được vệ sinh sạch sẽ!</p>
                        </div>
                    ) : (
                        activeTasks.map(task => (
                            <motion.div key={task.taskId} layout style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155' }}>
                                            <Coffee size={24} />
                                        </div>
                                        <div style={{ padding: '6px 12px', borderRadius: '12px', ...getStatusInfo(task.status), fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {getStatusInfo(task.status).icon} {getStatusInfo(task.status).label.toUpperCase()}
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '4px' }}>Phòng {task.room?.roomNumber}</h3>
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Loại: {task.room?.roomType} | {task.notes}</p>

                                    {/* Hiển thị ảnh nếu có */}
                                    {task.proofPhotoUrl && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', height: '100px', overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                {safeParseImages(task.proofPhotoUrl).map((img, idx) => (
                                                    <div key={idx} onClick={() => setSelectedImages(task.proofPhotoUrl)} style={{ position: 'relative', cursor: 'pointer' }}>
                                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        {idx === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Search size={20} /></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Phần điều phối */}
                                    {task.status === 'Pending' || task.status === 0 ? (
                                        currentUser?.role === 'Admin' || currentUser?.role === 'Manager' ? (
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                                <select 
                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '14px' }}
                                                    onChange={e => setSelectedStaffMap(prev => ({...prev, [task.taskId]: e.target.value}))}
                                                >
                                                    <option value="">-- Phân công nhân viên --</option>
                                                    {staffList.map(s => <option key={s.staffId} value={s.staffId}>{s.fullName} ({s.position})</option>)}
                                                </select>
                                                <button onClick={() => handleAssignStaff(task)} style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Giao việc ngay</button>
                                            </div>
                                        ) : <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Đang chờ được phân công...</div>
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <UserCheck size={20} style={{ color: '#3b82f6' }} />
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>NHÂN VIÊN PHỤ TRÁCH</div>
                                                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{task.assignedStaff?.fullName || "Bí danh"}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nút hành động */}
                                    {(task.status === 'InProgress' || task.status === 1) && currentUser?.role === 'Housekeeper' && (
                                        <button onClick={() => setTaskToUpload(task)} style={{ width: '100%', background: '#d946ef', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '700', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Camera size={20}/> Hoàn tất & Chụp ảnh</button>
                                    )}

                                    {task.status === 'UnderReview' && (currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                                            <button onClick={() => setTaskToReject(task)} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>Chưa sạch</button>
                                            <button onClick={() => handleApproveTask(task)} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Đạt chuẩn</button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            ) : (
                /* --- TAB 2: LỊCH SỬ VỆ SINH --- */
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>NGÀY HOÀN TẤT</th>
                                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>PHÒNG</th>
                                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>NHÂN VIÊN</th>
                                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>BẰNG CHỨNG</th>
                                    <th style={{ padding: '20px 24px', color: '#64748b', fontWeight: '800', fontSize: '13px' }}>GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyTasks.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Chưa có lịch sử vệ sinh nào trong hệ thống.</td></tr>
                                ) : (
                                    historyTasks.map(task => (
                                        <tr key={task.taskId} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700' }}>
                                                    <Calendar size={16} style={{ color: '#64748b' }} />
                                                    {new Date(task.updatedAt || task.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{ background: '#3b82f6', color: 'white', padding: '4px 12px', borderRadius: '8px', fontWeight: '900', fontSize: '14px' }}>{task.room?.roomNumber}</span>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16}/></div>
                                                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{task.assignedStaff?.fullName || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                {task.proofPhotoUrl && (
                                                    <button onClick={() => setSelectedImages(task.proofPhotoUrl)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <ImageIcon size={16} /> Xem {safeParseImages(task.proofPhotoUrl).length} ảnh
                                                    </button>
                                                )}
                                            </td>
                                            <td style={{ padding: '20px 24px', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>{task.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {notification && <Toast message={notification.msg} type={notification.type} />}
                {selectedImages && <ImageGalleryModal images={selectedImages} onClose={() => setSelectedImages(null)} />}
                {taskToUpload && (
                    <ProofUploadModal 
                        task={taskToUpload}
                        onClose={() => setTaskToUpload(null)}
                        onConfirm={async (imgData) => {
                            try {
                                await api.put(`/HousekeepingTasks/${taskToUpload.taskId}`, { ...taskToUpload, status: 'UnderReview', proofPhotoUrl: imgData, notes: 'Đã hoàn tất dọn dẹp, chờ kiểm tra.' });
                                notify("Bằng chứng đã gửi, đang chờ duyệt!");
                                setTaskToUpload(null);
                                fetchData();
                            } catch (err) { notify("Lỗi khi gửi ảnh", "error"); }
                        }}
                    />
                )}
                {taskToReject && (
                    <RejectionModal 
                        onClose={() => setTaskToReject(null)}
                        onConfirm={async (reason) => {
                            try {
                                await api.put(`/HousekeepingTasks/${taskToReject.taskId}`, { ...taskToReject, status: 'InProgress', notes: `❌ Cần dọn lại: ${reason}` });
                                notify("Đã thông báo yêu cầu dọn lại.");
                                setTaskToReject(null);
                                fetchData();
                            } catch (err) { notify("Lỗi khi gửi yêu cầu", "error"); }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Housekeeping;
