import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, Search, Mail, Phone, 
    Shield, Trash2, Edit2, Filter, 
    CheckCircle, XCircle 
} from 'lucide-react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const Staff = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', role: 2 });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get('/Staff');
            setStaff(res.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setErrors({}); // Xóa lỗi cũ
        
        // --- 🛡️ VALIDATION FRONTEND ---
        let newErrors = {};
        const nameRegex = /^[a-zA-ZÀ-ỹ\s]+$/;
        const phoneRegex = /^\d{10}$/;

        if (!formData.fullName) newErrors.fullName = "Họ và tên không được để trống";
        else if (!nameRegex.test(formData.fullName)) newErrors.fullName = "Tên chỉ được chứa chữ cái";

        if (!formData.email) newErrors.email = "Email là bắt buộc";
        if (formData.phone && !phoneRegex.test(formData.phone)) newErrors.phone = "Số điện thoại phải đủ 10 số";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const payload = { 
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                role: parseInt(formData.role) 
            };

            if (editingStaff) {
                await api.put(`/Staff/${editingStaff.staffId || editingStaff.StaffId}`, payload);
            } else {
                await api.post("/Staff", payload);
            }
            
            setIsModalOpen(false);
            setEditingStaff(null);
            setFormData({ fullName: '', email: '', phone: '', role: 2 });
            fetchStaff();
        } catch (err) { 
            if (err.response?.status === 400 && err.response.data?.errors) {
                // Mapping lỗi từ Backend DataAnnotations
                setErrors(err.response.data.errors);
            } else {
                setErrors({ general: err.response?.data?.message || "Lỗi hệ thống khi lưu" });
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
        try {
            await api.delete(`/Staff/${id}`);
            fetchStaff();
        } catch (err) { alert(err.response?.data?.message || "Lỗi khi xóa"); }
    };

    const handleEdit = async (staffMember) => {
        try {
            const id = staffMember.staffId || staffMember.StaffId;
            const res = await api.get(`/Staff/${id}`);
            const realData = res.data;
            const rawRole = realData.role !== undefined ? realData.role : realData.Role;
            
            setEditingStaff(realData); 
            setFormData({ 
                fullName: realData.fullName || realData.FullName || '', 
                email: realData.email || realData.Email || '', 
                phone: realData.phone || realData.Phone || '', 
                role: typeof rawRole === 'number' ? rawRole : 2 
            }); 
            setIsModalOpen(true); 
        } catch (err) {
            alert("Lỗi khi lấy thông tin chi tiết: " + (err.response?.data?.message || err.message));
        }
    };

    const ROLE_MAP = {
        0: 'Admin',
        1: 'Manager',
        2: 'Receptionist',
        3: 'Housekeeper',
        4: 'Accountant',
        5: 'Technician'
    };

    const getRoleColor = (roleInput) => {
        const role = typeof roleInput === 'number' ? ROLE_MAP[roleInput] : roleInput;
        const colors = {
            'Admin': { bg: '#fee2e2', text: '#ef4444', label: 'Quản trị viên' },
            'Manager': { bg: '#fef3c7', text: '#d97706', label: 'Quản lý' },
            'Receptionist': { bg: '#dcfce7', text: '#16a34a', label: 'Lễ tân' },
            'Housekeeper': { bg: '#e0f2fe', text: '#0284c7', label: 'Dọn phòng' },
            'Accountant': { bg: '#f3e8ff', text: '#9333ea', label: 'Kế toán' },
            'Technician': { bg: '#ffedd5', text: '#ea580c', label: 'Kỹ thuật' }
        };
        return colors[role] || { bg: '#f3f4f6', text: '#4b5563', label: role || 'Nhân viên' };
    };

    const filteredStaff = staff.filter(s => {
        const nameMatch = (s.fullName || s.FullName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const rawRole = s.role !== undefined ? s.role : s.Role;
        const roleStr = typeof rawRole === 'number' ? ROLE_MAP[rawRole] : rawRole;
        const roleMatch = roleFilter === 'All' || roleStr === roleFilter;
        return nameMatch && roleMatch;
    });

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={36} color="#3b82f6" /> Quản lý Nhân sự
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>Admin có quyền quản lý toàn bộ nhân viên từ các bộ phận.</p>
                </div>
                <button 
                    onClick={() => { setEditingStaff(null); setFormData({ fullName: '', email: '', phone: '', role: 'Receptionist' }); setIsModalOpen(true); }}
                    style={{ background: '#3b82f6', color: 'white', padding: '14px 28px', borderRadius: '16px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}
                >
                    <Plus size={20} /> Thêm nhân viên mới
                </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên nhân viên..." 
                        style={{ width: '100%', padding: '16px 16px 16px 52px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '18px', fontSize: '15px' }} 
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '0 16px', border: '1px solid #e2e8f0', borderRadius: '18px' }}>
                    <Filter size={18} color="#64748b" />
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '16px 8px', border: 'none', background: 'transparent', fontWeight: '700', color: '#475569', cursor: 'pointer' }}>
                        <option value="All">Tất cả bộ phận</option>
                        <option value="Admin">Hệ quản trị (Admin)</option>
                        <option value="Manager">Cấp Quản lý</option>
                        <option value="Receptionist">Tổ Lễ tân</option>
                        <option value="Housekeeper">Tổ Dọn phòng</option>
                        <option value="Accountant">Kế toán</option>
                        <option value="Technician">Kỹ thuật viên</option>
                    </select>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '24px', fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Nhân viên</th>
                            <th style={{ padding: '24px', fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Liên hệ</th>
                            <th style={{ padding: '24px', fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Vai trò / Bộ phận</th>
                            <th style={{ padding: '24px', fontSize: '12px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.map((person) => {
                            const rawRole = person.role !== undefined ? person.role : person.Role;
                            return (
                                <tr key={person.staffId || person.StaffId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s hover:bg-slate-50' }}>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px' }}>
                                                {(person.fullName || person.FullName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#1e293b' }}>{person.fullName || person.FullName}</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {(person.staffId || person.StaffId || '').substring(0,8)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}><Mail size={14} color="#94a3b8" /> {person.email || person.Email}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}><Phone size={14} color="#94a3b8" /> {person.phone || person.Phone}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '24px' }}>
                                        <span style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', background: getRoleColor(rawRole).bg, color: getRoleColor(rawRole).text }}>
                                            {getRoleColor(rawRole).label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(person)} style={{ padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Edit2 size={16} color="#475569" /></button>
                                            <button onClick={() => handleDelete(person.staffId || person.StaffId)} style={{ padding: '8px', background: '#fee2e2', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} color="#ef4444" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={{ position: 'relative', background: 'white', width: '100%', maxWidth: '500px', borderRadius: '32px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', marginBottom: '8px' }}>{editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h2>
                            <p style={{ color: '#64748b', marginBottom: '24px' }}>Thiết lập thông tin cá nhân và vai trò trong khách sạn.</p>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {errors.general && (
                                    <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '14px', fontSize: '13px', fontWeight: '700', border: '1px solid #fee2e2' }}>
                                        ⚠️ {errors.general}
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Họ và tên *</label>
                                    <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Vd: Nguyễn Khắc Phước" style={{ width: '100%', padding: '14px', border: errors.fullName ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', outline: 'none', transition: 'border-color 0.2s focus:border-blue-500' }} />
                                    {errors.fullName && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>{errors.fullName}</div>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Email</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Vd: phuoc@gmail.com" style={{ width: '100%', padding: '14px', border: errors.email ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', outline: 'none' }} />
                                        {errors.email && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>{errors.email}</div>}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Số điện thoại</label>
                                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Vd: 0987123456" style={{ width: '100%', padding: '14px', border: errors.phone ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '14px', outline: 'none' }} />
                                        {errors.phone && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>{errors.phone}</div>}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Bộ phận / Vai trò *</label>
                                    <select value={formData.role} onChange={e => setFormData({...formData, role: parseInt(e.target.value)})} style={{ width: '100%', padding: '14px', border: '1px solid #e2e8f0', borderRadius: '14px', background: 'white', cursor: 'pointer', outline: 'none' }}>
                                        <option value={0}>Quản trị hệ thống (Admin)</option>
                                        <option value={1}>Quản lý chuyên môn</option>
                                        <option value={2}>Bộ phận Lễ tân</option>
                                        <option value={3}>Bộ phận Dọn phòng</option>
                                        <option value={4}>Bộ phận Kế toán</option>
                                        <option value={5}>Cán bộ Kỹ thuật</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>Hủy</button>
                                    <button type="submit" style={{ flex: 1, padding: '16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)', transition: 'all 0.2s' }}>Lưu thông tin</button>
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
