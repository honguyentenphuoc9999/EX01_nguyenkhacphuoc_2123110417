import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Plus, Search, Filter, MoreVertical, 
    Edit2, Trash2, Shield, User, Briefcase, 
    DollarSign, Calendar, X 
} from 'lucide-react';
import api from '../api/axios';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        employeeCode: '',
        department: '',
        position: '',
        role: 1, // Receptionist default
        baseSalary: 0,
        hireDate: new Date().toISOString().split('T')[0]
    });

    const rolesMap = {
        0: { label: 'Admin', color: '#ef4444', bg: '#fef2f2' },
        1: { label: 'Lễ tân', color: '#3b82f6', bg: '#eff6ff' },
        2: { label: 'Buồng phòng', color: '#10b981', bg: '#ecfdf5' },
        3: { label: 'Kế toán', color: '#8b5cf6', bg: '#f5f3ff' },
        4: { label: 'Kỹ thuật', color: '#f59e0b', bg: '#fffbeb' }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/Staff');
            setStaff(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleOpenModal = (s = null) => {
        if (s) {
            setEditingStaff(s);
            setFormData({
                fullName: s.fullName || '',
                employeeCode: s.employeeCode || '',
                department: s.department || '',
                position: s.position || '',
                role: s.role !== undefined ? s.role : 1,
                baseSalary: s.baseSalary || 0,
                hireDate: s.hireDate ? s.hireDate.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            setEditingStaff(null);
            setFormData({
                fullName: '',
                employeeCode: '',
                department: '',
                position: '',
                role: 1,
                baseSalary: 0,
                hireDate: new Date().toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Chuẩn bị dữ liệu theo chuẩn PascalCase của C#
            const payload = {
                FullName: formData.fullName,
                Department: formData.department,
                Position: formData.position,
                Role: formData.role,
                BaseSalary: parseFloat(formData.baseSalary),
                HireDate: new Date(formData.hireDate).toISOString()
            };

            // Chỉ gửi EmployeeCode nếu người dùng có nhập
            if (formData.employeeCode && formData.employeeCode.trim() !== "") {
                payload.EmployeeCode = formData.employeeCode;
            }

            if (editingStaff) {
                await api.put(`/Staff/${editingStaff.staffId}`, payload);
                alert("Cập nhật nhân viên thành công!");
            } else {
                await api.post('/Staff', payload);
                alert("Thêm nhân viên thành công!");
            }
            fetchStaff();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.errors 
                ? Object.values(err.response.data.errors).flat().join(', ')
                : "Không thể lưu thông tin nhân viên.";
            alert("Lỗi: " + msg);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?")) {
            try {
                await api.delete(`/Staff/${id}`);
                fetchStaff();
            } catch (err) {
                console.error(err);
                alert("Lỗi khi xóa nhân viên.");
            }
        }
    };

    const filteredStaff = staff.filter(s => 
        (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu nhân sự...</div>;

    return (
        <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>Quản lý Nhân viên</h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Hệ thống quản lý hồ sơ và phân quyền nhân sự khách sạn.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)' }}
                >
                    <Plus size={20} /> Thêm Nhân viên
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo mã số hoặc tên nhân viên..."
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Nhân viên</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Phân quyền / Bộ phận</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Vị trí</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Mức lương</th>
                                <th style={{ padding: '20px 24px', textAlign: 'right', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map((s) => {
                                const role = rolesMap[s.role] || rolesMap[1];
                                return (
                                    <tr key={s.staffId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e293b' }}>{s.fullName}</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.employeeCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: '800', background: role.bg, color: role.color, padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
                                                    {role.label}
                                                </span>
                                                <div style={{ fontSize: '13px', color: '#64748b' }}>{s.department}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Briefcase size={14} /> {s.position}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.baseSalary)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => handleOpenModal(s)}
                                                    style={{ p: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
                                                ><Edit2 size={16} /></button>
                                                <button 
                                                    onClick={() => handleDelete(s.staffId)}
                                                    style={{ p: '8px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer' }}
                                                ><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Adding/Editing */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '540px', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                        >
                            <div style={{ padding: '24px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{editingStaff ? 'Cập nhật Nhân viên' : 'Thêm Nhân viên mới'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Họ và tên</label>
                                        <input required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Mã nhân viên (Để trống để tự tạo)</label>
                                        <input value={formData.employeeCode} onChange={(e) => setFormData({...formData, employeeCode: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Phân quyền</label>
                                        <select value={formData.role} onChange={(e) => setFormData({...formData, role: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
                                            <option value={0}>Admin</option>
                                            <option value={1}>Lễ tân</option>
                                            <option value={2}>Buồng phòng</option>
                                            <option value={3}>Kế toán</option>
                                            <option value={4}>Kỹ thuật</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Bộ phận</label>
                                        <input value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="VD: Tiền sảnh" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Chức vụ</label>
                                        <input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} placeholder="VD: Trưởng ca" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Mức lương (VND)</label>
                                        <input type="number" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Ngày vào làm</label>
                                        <input type="date" value={formData.hireDate} onChange={(e) => setFormData({...formData, hireDate: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                                        <button type="submit" style={{ width: '100%', background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', border: 'none', cursor: 'pointer' }}>
                                            {editingStaff ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Staff;
