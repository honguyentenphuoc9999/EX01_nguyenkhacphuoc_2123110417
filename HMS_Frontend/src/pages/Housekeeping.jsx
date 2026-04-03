import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, CheckCircle2, Clock, MapPin, ClipboardList, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const Housekeeping = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/HousekeepingTasks');
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
            setLoading(false);
        }
    };

    const handleCompleteTask = async (task) => {
        if (!window.confirm(`Xác nhận đã dọn xong Phòng ${task.room?.roomNumber}?`)) return;
        
        try {
            // Chuẩn bị Body đầy đủ theo yêu cầu của Backend
            const updateBody = {
                ...task,
                status: 2, // Completed
                completedAt: new Date().toISOString(),
                notes: "Nêu có cập nhật ghi chú..."
            };

            await api.put(`/HousekeepingTasks/${task.taskId}`, updateBody);
            alert('Cập nhật thành công! Trạng thái phòng sẽ sớm được đồng bộ.');
            fetchTasks(); // Tải lại danh sách
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra khi cập nhật.');
        }
    };

    const getStatusInfo = (status) => {
        switch(status) {
            case 0: return { bg: '#fef9c3', text: '#854d0e', label: 'Đang chờ', icon: <Clock size={16}/> };
            case 1: return { bg: '#eff6ff', text: '#3b82f6', label: 'Đang làm', icon: <RefreshCw size={16}/> };
            case 2: return { bg: '#dcfce7', text: '#166534', label: 'Đã xong', icon: <CheckCircle2 size={16}/> };
            default: return { bg: '#f1f5f9', text: '#475569', label: 'Hủy', icon: <Coffee size={16}/> };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Quản lý Dọn phòng</h1>
                    <p style={{ color: '#64748b' }}>Theo dõi và điều phối công việc của bộ phận vệ sinh (Housekeeping).</p>
                </div>
                <button 
                    onClick={fetchTasks}
                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <RefreshCw size={18} /> Làm mới danh sách
                </button>
            </div>

            {/* Tasks Grid */}
            {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Đang tải danh sách công việc...</div>
            ) : tasks.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <ClipboardList size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                    <p style={{ color: '#64748b' }}>Hiện tại không có yêu cầu dọn phòng nào.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {tasks.map((task) => {
                        const style = getStatusInfo(task.status);
                        return (
                            <motion.div 
                                whileHover={{ scale: 1.01 }}
                                key={task.taskId} 
                                style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', position: 'relative' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '12px' }}>
                                        <Coffee color="#0f172a" />
                                    </div>
                                    <div style={{ background: style.bg, color: style.text, padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {style.icon} {style.label}
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                                    Phòng {task.room?.roomNumber || '???'} - {task.room?.roomTypeName || 'Deluxe'}
                                </h3>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>{task.notes || 'Dọn dẹp tổng quát sau trả phòng.'}</p>

                                <div style={{ display: 'flex', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '24px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                                    <Clock size={16} /> Lịch: {new Date(task.scheduledDate).toLocaleString('vi-VN')}
                                </div>

                                {task.status !== 2 && (
                                    <button 
                                        onClick={() => handleCompleteTask(task)}
                                        style={{ width: '100%', background: '#0f172a', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                    >
                                        <CheckCircle2 size={18} /> Hoàn tất dọn dẹp
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
