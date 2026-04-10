import React, { useEffect, useState, useCallback } from 'react';
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

/* --- HMS PROGRESSIVE IMAGE SYSTEM --- */
const slideDown = {
    initial: { clipPath: 'inset(0 0 100% 0)' },
    animate: { clipPath: 'inset(0 0 0 0)' },
    transition: { duration: 0.8, ease: "easeOut" }
};

const compressImage = (base64Str, maxWidth = 800) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Nén 70% chất lượng
        };
    });
};

const ProgressiveImage = ({ src, style, onClick }) => {
    const [loaded, setLoaded] = useState(false);
    return (
        <div style={{ ...style, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }} onClick={onClick}>
            {!loaded && <div className="shimmer-hms" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer-hms 1.5s infinite linear' }} />}
            <motion.img 
                src={src} 
                onLoad={() => setLoaded(true)}
                initial="initial"
                animate={loaded ? "animate" : "initial"}
                variants={slideDown}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
            />
            <style>{`
                @keyframes shimmer-hms {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
};

const Toast = ({ message, type }) => (
    <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} style={{ position: 'fixed', bottom: '30px', right: '30px', background: type === 'success' ? '#10b981' : '#ef4444', color: 'white', padding: '16px 24px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 15000, fontWeight: '700' }}>
        {type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {message}
    </motion.div>
);

// --- HMS ULTRA PERSISTENCE & SPEED ---
const CACHE_KEY_TASKS = 'hms_hk_tasks_v2';
const CACHE_KEY_STAFF = 'hms_hk_staff_v2';

const Housekeeping = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('tasks');
    
    // 🚀 HMS GLOBAL CACHE: Giữ dữ liệu sống sót khi chuyển đổi các tính năng Quản lý
    const [tasks, setTasks] = useState(() => {
        if (window.hms_hk_cache) return window.hms_hk_cache;
        const saved = localStorage.getItem(CACHE_KEY_TASKS);
        return saved ? JSON.parse(saved) : [];
    });
    
    const [staffList, setStaffList] = useState(() => {
        if (window.hms_staff_cache) return window.hms_staff_cache;
        const saved = localStorage.getItem(CACHE_KEY_STAFF);
        return saved ? JSON.parse(saved) : [];
    });

    const [loading, setLoading] = useState(false); // Mặc định không hiện loading nếu đã có cache
    
    // Đồng bộ ngược ra Cache toàn cục mỗi khi state thay đổi
    useEffect(() => { 
        window.hms_hk_cache = tasks;
        window.hms_staff_cache = staffList;
    }, [tasks, staffList]);
    const [selectedStaffMap, setSelectedStaffMap] = useState({});
    const [notification, setNotification] = useState(null);
    const [taskToUpload, setTaskToUpload] = useState(null);
    const [selectedImages, setSelectedImages] = useState(null);
    const [taskToReject, setTaskToReject] = useState(null);

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // 🧠 SMART FINGERPRINT: Chỉ so sánh những thuộc tính nhẹ
    const getFingerprint = (data) => {
        if (!data || !Array.isArray(data)) return "";
        return data.map(item => `${item.taskId || item.staffId}-${item.updatedAt || ''}-${item.status || ''}`).join('|');
    };

    // 🛡️ HMS SAFE CACHE: Lưu Metadata + NHỚ LUÔN CẢ ẢNH (Vì đã nén nên lưu được nhiều)
    const saveToLocalSafely = (key, data) => {
        try {
            if (key === CACHE_KEY_TASKS) {
                // Thử lưu bản đầy đủ có ảnh trước (vì User yêu cầu F5 không mất)
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                localStorage.setItem(key, JSON.stringify(data));
            }
        } catch (e) {
            console.warn("HMS Storage Full: Đang chuyển sang chế độ lưu tiết kiệm...");
            try {
                // Nếu đầy bộ nhớ (5MB+), mới bắt đầu xóa bớt ảnh để lưu Metadata
                if (key === CACHE_KEY_TASKS) {
                    const leanData = data.map(({ proofPhotoUrl, ...rest }) => ({ ...rest }));
                    localStorage.setItem(key, JSON.stringify(leanData));
                }
            } catch (e2) { localStorage.clear(); }
        }
    };

    // 🚀 HMS SPEED: Tải ảnh riêng lẻ cho từng Task khi cần (Lazy Loading)
    const fetchTaskImages = async (taskId) => {
        try {
            const res = await api.get(`/HousekeepingTasks/${taskId}/images`);
            const photoUrl = res.data.proofPhotoUrl;
            if (photoUrl) {
                setTasks(prev => {
                    const updated = prev.map(t => t.taskId === taskId ? { ...t, proofPhotoUrl: photoUrl } : t);
                    saveToLocalSafely(CACHE_KEY_TASKS, updated);
                    return updated;
                });
                
                // Cập nhật memory cache
                if (window.hms_hk_cache) {
                    window.hms_hk_cache = window.hms_hk_cache.map(t => t.taskId === taskId ? { ...t, proofPhotoUrl: photoUrl } : t);
                }
            }
        } catch (err) { console.error("Lỗi tải ảnh lẻ:", err); }
    };

    const fetchData = useCallback(async (isBackground = false) => {
        if (!isBackground && tasks.length === 0) setLoading(true);
        try {
            const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
            
            // --- GIAI ĐOẠN 1: Tải Metadata (Không kèm ảnh) để hiện danh sách siêu tốc ---
            const metaResult = await api.get('/HousekeepingTasks?type=0&excludeImages=true');
            const taskMetaData = metaResult.data;

            setTasks(prevTasks => {
                const mergedData = taskMetaData.map(newTask => {
                    const oldTask = prevTasks.find(t => t.taskId === newTask.taskId);
                    if (oldTask && oldTask.proofPhotoUrl) {
                        return { ...newTask, proofPhotoUrl: oldTask.proofPhotoUrl };
                    }
                    return newTask;
                });
                saveToLocalSafely(CACHE_KEY_TASKS, mergedData);
                return mergedData;
            });

            if (isAdmin) {
                const staffResult = await api.get('/Staff');
                setStaffList(prevStaff => {
                    const staffData = staffResult.data;
                    if (getFingerprint(prevStaff) !== getFingerprint(staffData)) {
                        saveToLocalSafely(CACHE_KEY_STAFF, staffData);
                        return staffData;
                    }
                    return prevStaff;
                });
            }

            // --- GIAI ĐOẠN 2: Tự động tải ảnh lẻ cho 3-5 nhiệm vụ mới nhất (Không làm nghẽn) ---
            const currentTasksWithPhotos = tasks.filter(t => t.proofPhotoUrl?.length > 100).map(t => t.taskId);
            const urgentTasks = taskMetaData.slice(0, 5); // Ưu tiên 5 cái đầu tiên
            
            for (const t of urgentTasks) {
                if (!currentTasksWithPhotos.includes(t.taskId)) {
                    fetchTaskImages(t.taskId); // Tải song song từng cái một
                }
            }

        } catch (err) {
            console.error("Sync Error:", err);
            notify("Lỗi đồng bộ dữ liệu buồng phòng", "error");
        } finally {
            setLoading(false);
        }
    }, [tasks.length]);


    useEffect(() => {
        if (currentUser) {
            fetchData(true); // Chỉ fetch khi đã xác thực xong
        }
    }, [currentUser, fetchData]);

    const handleAssignStaff = async (task, optionalStaffId = null) => {
        const staffId = optionalStaffId || selectedStaffMap[task.taskId];
        if (!staffId) return notify("Vui lòng chọn nhân viên!", "error");
        
        const originalTaskId = task.taskId;
        const targetStaff = staffList.find(s => s.staffId === staffId);

        // 🚀 OPTIMISTIC UPDATE & PERSIST
        const newTasks = tasks.map(t => 
            t.taskId === originalTaskId 
            ? { ...t, assignedStaffId: staffId, status: 'InProgress', assignedStaff: targetStaff } 
            : t
        );
        setTasks(newTasks);
        saveToLocalSafely(CACHE_KEY_TASKS, newTasks);

        try {
            await api.put(`/HousekeepingTasks/${originalTaskId}`, {
                ...task,
                assignedStaffId: staffId,
                status: 'InProgress'
            });
            notify("Đã giao việc thành công!");
            fetchData(true);
        } catch (err) {
            notify("Lỗi phân công", "error");
            fetchData(); // Rollback
        }
    };

    const handleApproveTask = async (task) => {
        const originalTaskId = task.taskId;

        // 🚀 OPTIMISTIC UPDATE & PERSIST
        const newTasks = tasks.filter(t => t.taskId !== originalTaskId);
        setTasks(newTasks);
        saveToLocalSafely(CACHE_KEY_TASKS, newTasks);

        try {
            await api.put(`/HousekeepingTasks/${originalTaskId}`, {
                ...task,
                status: 'Completed',
                notes: `Duyệt SẠCH bởi ${currentUser?.username}`
            });
            notify("Phòng đã sẵn sàng đón khách!");
            fetchData(true);
        } catch (err) {
            notify("Lỗi phê duyệt", "error");
            fetchData();
        }
    };

    const handleConfirmDelivery = async (task) => {
        const originalTaskId = task.taskId;

        // 🚀 OPTIMISTIC UPDATE & PERSIST
        const newTasks = tasks.filter(t => t.taskId !== originalTaskId);
        setTasks(newTasks);
        saveToLocalSafely(CACHE_KEY_TASKS, newTasks);

        try {
            const orderIdMatch = task.notes?.match(/Đơn hàng ID: ([a-z0-9-]+)/i);
            const orderId = orderIdMatch ? orderIdMatch[1] : null;

            if (orderId) {
                await api.post(`/RoomService/${orderId}/confirm-delivery`);
                notify("Đã xác nhận giao hàng và cộng phí dịch vụ!");
            } else {
                await api.put(`/HousekeepingTasks/${originalTaskId}`, {
                    ...task,
                    status: 'Completed',
                    completedAt: new Date().toISOString()
                });
                notify("Đã hoàn thành bàn giao dịch vụ!");
            }
            fetchData(true);
        } catch (err) {
            notify("Lỗi xác nhận giao hàng", "error");
            fetchData();
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
            case 'Completed': 
                return { bg: '#dcfce7', text: '#166534', label: 'Đã hoàn tất', icon: <CheckCircle2 size={16}/> };
            case 5: case '5': case 'Delivery':
                return { bg: '#fae8ff', text: '#a21caf', label: 'Giao đồ / Dịch vụ', icon: <Send size={16}/> };
            default: 
                return { bg: '#f1f5f9', text: '#475569', label: 'Khác', icon: <Coffee size={16}/> };
        }
    };

    // --- XÁC ĐỊNH QUYỀN HẠN (Gia cố để tránh lỗi ReferenceError) ---
    const isManager = Boolean(currentUser?.role === 'Admin' || currentUser?.role === 'Manager');
    const isHousekeeper = Boolean(currentUser?.role === 'Housekeeper' || currentUser?.role === 3);
    const isAttendant = Boolean(currentUser?.role === 'RoomAttendant' || currentUser?.role === 6);

    // --- LỌC DỮ LIỆU: CHỈ HIỆN VIỆC DỌN DẸP TẠI TRANG NÀY ---
    const allFiltered = tasks.filter(t => {
        // Kiểm tra loại nhiệm vụ (Không hiện việc giao hàng tại đây)
        const isDeliveryTask = t.taskType === 5 || t.taskType === 'Delivery' || String(t.taskType) === '5';
        if (isDeliveryTask) return false;
        
        // Nhân viên chỉ thấy việc của mình HOẶC việc đang trống (Pending) chưa có ai nhận
        const isMyTask = t.assignedStaffId && currentUser?.staffId && 
                         t.assignedStaffId.toString().toLowerCase() === currentUser.staffId.toString().toLowerCase();
        const isUnassigned = !t.assignedStaffId || t.status === 'Pending' || t.status === 0;

        if (isManager) return true; // Quản lý thấy hết
        
        if (!isMyTask && !isUnassigned) return false; // Không phải của mình và cũng đã có người khác thì ẩn đi

        if (isHousekeeper && isDeliveryTask) return false; // Dọn phòng không thấy việc giao hàng
        if (isAttendant && !isDeliveryTask) return false; // Phục vụ phòng không thấy việc dọn dẹp

        return true;
    });
    
    // Chỉ hiện các phòng đang xử lý (Pending, InProgress, UnderReview)
    const activeTasks = allFiltered.filter(t => t.status !== 'Completed');
    
    // Hiện lịch sử các phòng đã xong
    const historyTasks = allFiltered.filter(t => t.status === 'Completed')
        .sort((a,b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>
                        {currentUser?.role === 'RoomAttendant' || currentUser?.role === 6 ? 'Hệ thống Phục vụ' : 'Hệ thống Buồng phòng'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px' }}>
                        {currentUser?.role === 'RoomAttendant' || currentUser?.role === 6 ? 'Giao đồ và phục vụ khách hàng nhanh chóng.' : 'Điều phối & Theo dõi lịch sử vệ sinh tiêu chuẩn 5 sao.'}
                    </p>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* --- CẢNH BÁO THIẾU NHÂN LỰC (Dựa trên yêu cầu USER) --- */}
                    {activeTasks.some(t => t.status === 'Pending' || t.status === 0) && 
                     staffList.filter(s => s.role === 3 || s.role === 'Housekeeper').length === 0 && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            style={{ background: '#fef2f2', border: '2px solid #ef4444', borderRadius: '20px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}
                        >
                            <div style={{ width: '56px', height: '56px', background: '#ef4444', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 style={{ color: '#991b1b', fontWeight: '900', fontSize: '18px' }}>⚠️ THIẾU NHÂN VIÊN DỌN PHÒNG</h3>
                                <p style={{ color: '#b91c1c', fontSize: '14px', fontWeight: '500' }}>Hiện có {activeTasks.filter(t => t.status === 'Pending' || t.status === 0).length} phòng đang chờ nhưng không có nhân viên Buồng phòng nào khả dụng.</p>
                            </div>
                        </motion.div>
                    )}

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
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>Loại: {task.room?.roomType?.typeName || "N/A"} | {task.notes}</p>

                                    {/* Hiển thị ảnh hoặc số lượng ảnh chờ tải */}
                                    {(task.proofPhotoUrl || task.proofPhotoCount > 0) && (
                                         <div style={{ marginBottom: '20px' }}>
                                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', height: '100px', overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                                 {task.proofPhotoUrl ? (
                                                     safeParseImages(task.proofPhotoUrl).map((img, idx) => (
                                                         <div key={idx} onClick={() => setSelectedImages(task.proofPhotoUrl)} style={{ position: 'relative', cursor: 'pointer', height: '100%' }}>
                                                             <ProgressiveImage src={img} style={{ width: '100%', height: '100%' }} />
                                                             {idx === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Search size={20} /></div>}
                                                         </div>
                                                     ))
                                                 ) : (
                                                     /* 🚀 PLACEHOLDER KHI CHƯA TẢI XONG ẢNH (SAU F5) */
                                                     <div 
                                                         onClick={(e) => { e.stopPropagation(); fetchTaskImages(task.taskId); }}
                                                         title="Nhấn để tải ảnh này ngay"
                                                         style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer', background: 'linear-gradient(45deg, #f8fafc, #f1f5f9)', transition: '0.3s' }}
                                                         onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                                                         onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                                                     >
                                                         <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d946ef', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                             {task.proofPhotoCount}
                                                         </div>
                                                         <div style={{ textAlign: 'left' }}>
                                                             <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>ẢNH BẰNG CHỨNG</div>
                                                             <div style={{ fontSize: '11px', color: '#64748b' }}>Nhấn để tải ảnh ngay...</div>
                                                         </div>
                                                         <ImageIcon size={20} style={{ color: '#cbd5e1', marginLeft: 'auto', marginRight: '16px' }} />
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                    )}

                                    {/* Phần điều phối */}
                                    {task.status === 'Pending' || task.status === 0 ? (
                                        currentUser?.role === 'Admin' || currentUser?.role === 'Manager' ? (
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                                <select 
                                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '14px', background: 'white' }}
                                                    value={selectedStaffMap[task.taskId] || task.assignedStaffId || ""}
                                                    onChange={e => setSelectedStaffMap(prev => ({...prev, [task.taskId]: e.target.value}))}
                                                >
                                                    <option value="">-- Phân công nhân viên --</option>
                                                    {staffList
                                                        .filter(s => {
                                                            const isDeliveryTask = task.taskType === 5 || task.taskType === 'Delivery' || task.taskType === '5';
                                                            const targetRole = isDeliveryTask ? 6 : 3; // 6: RoomAttendant, 3: Housekeeper
                                                            return s.role === targetRole || s.role === (isDeliveryTask ? 'RoomAttendant' : 'Housekeeper');
                                                        })
                                                        .map(s => (
                                                            <option key={s.staffId} value={s.staffId}>
                                                                {s.fullName} ({s.position})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <button onClick={() => handleAssignStaff(task)} style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Giao việc ngay</button>
                                            </div>
                                        ) : (
                                            (isAttendant && (task.status === 'Pending' || task.status === 0)) ? (
                                                <button 
                                                    onClick={() => handleAssignStaff({...task, taskId: task.taskId}, currentUser?.staffId)} 
                                                    style={{ width: '100%', background: '#a21caf', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    <Send size={18}/> Nhận đơn giao này
                                                </button>
                                            ) : <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Đang chờ được phân công...</div>
                                        )
                                    ) : (
                                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <UserCheck size={20} style={{ color: '#3b82f6' }} />
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '800' }}>NHÂN VIÊN PHỤ TRÁCH</div>
                                                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{task.assignedStaff?.fullName || "Bí danh"}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nút hành động dọn phòng */}
                                    {(task.status === 'InProgress' || task.status === 1) && (currentUser?.role === 'Housekeeper' || currentUser?.role === 3) && (
                                        <button onClick={() => setTaskToUpload(task)} style={{ width: '100%', background: '#d946ef', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '700', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Camera size={20}/> Hoàn tất & Chụp ảnh</button>
                                    )}

                                    {/* Nút hành động giao đồ/phục vụ */}
                                    {(task.status === 'InProgress' || task.status === 1) && (currentUser?.role === 'RoomAttendant' || currentUser?.role === 6) && (
                                        <button onClick={() => handleConfirmDelivery(task)} style={{ width: '100%', background: '#a21caf', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', fontWeight: '700', marginTop: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><CheckCircle2 size={20}/> Xác nhận đã giao</button>
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
                                                { (task.proofPhotoUrl || task.proofPhotoCount > 0) ? (
                                                    task.proofPhotoUrl ? (
                                                        <button onClick={() => setSelectedImages(task.proofPhotoUrl)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <ImageIcon size={16} /> Xem {safeParseImages(task.proofPhotoUrl).length} ảnh
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); fetchTaskImages(task.taskId); }}
                                                            style={{ border: 'none', background: '#fdf4ff', color: '#d946ef', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: '0.2s' }}
                                                            onMouseOver={e => e.currentTarget.style.background = '#fae8ff'}
                                                            onMouseOut={e => e.currentTarget.style.background = '#fdf4ff'}
                                                            title="Nhấn để tải ảnh phòng này"
                                                        >
                                                            <Clock size={16} /> {task.proofPhotoCount || "?"} ảnh... (Nhấn để tải)
                                                        </button>
                                                    )
                                                ) : (
                                                    <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', animation: 'pulse-hms 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                                                        <Clock size={12} /> Đang tải...
                                                        <style>{`
                                                            @keyframes pulse-hms {
                                                                0%, 100% { opacity: 1; }
                                                                50% { opacity: .5; }
                                                            }
                                                        `}</style>
                                                    </div>
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
                        onConfirm={async (imgArrayRaw) => {
                            const originalTaskId = taskToUpload.taskId;
                            notify("Đang nén ảnh và gửi đi...", "info");
                            
                            try {
                                const parsedImages = JSON.parse(imgArrayRaw);
                                // 🚀 COMPRESSION STEP: Giảm dung lượng ảnh trước khi gửi lên Server
                                const compressedImages = await Promise.all(
                                    parsedImages.map(img => compressImage(img))
                                );
                                const finalImageData = JSON.stringify(compressedImages);

                                // 🚀 OPTIMISTIC UPDATE & PERSIST
                                const newTasks = tasks.map(t => 
                                    t.taskId === originalTaskId 
                                    ? { ...t, status: 'UnderReview', proofPhotoUrl: finalImageData, notes: 'Đang gửi bằng chứng...' } 
                                    : t
                                );
                                setTasks(newTasks);
                                saveToLocalSafely(CACHE_KEY_TASKS, newTasks);
                                
                                setTaskToUpload(null); 

                                await api.put(`/HousekeepingTasks/${originalTaskId}`, { 
                                    ...taskToUpload, 
                                    status: 'UnderReview', 
                                    proofPhotoUrl: finalImageData, 
                                    notes: 'Đã hoàn tất dọn dẹp, chờ kiểm tra.' 
                                });
                                
                                fetchData(true);
                                notify("Bằng chứng đã được gửi thành công!");
                            } catch (err) { 
                                notify("Lỗi khi xử lý ảnh hoặc gửi tin!", "error"); 
                                fetchData();
                            }
                        }}
                    />
                )}
                {taskToReject && (
                    <RejectionModal 
                        onClose={() => setTaskToReject(null)}
                        onConfirm={async (reason) => {
                            const originalTaskId = taskToReject.taskId;

                            // 🚀 OPTIMISTIC UPDATE & PERSIST
                            const newTasks = tasks.map(t => 
                                t.taskId === originalTaskId 
                                ? { ...t, status: 'InProgress', notes: `❌ Cần dọn lại: ${reason}` } 
                                : t
                            );
                            setTasks(newTasks);
                            saveToLocalSafely(CACHE_KEY_TASKS, newTasks);

                            try {
                                setTaskToReject(null);
                                await api.put(`/HousekeepingTasks/${originalTaskId}`, { 
                                    ...taskToReject, 
                                    status: 'InProgress', 
                                    notes: `❌ Cần dọn lại: ${reason}` 
                                });
                                notify("Đã thông báo yêu cầu dọn lại.");
                                fetchData(true);
                            } catch (err) { 
                                notify("Lỗi khi gửi yêu cầu", "error"); 
                                fetchData();
                            }
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Housekeeping;
