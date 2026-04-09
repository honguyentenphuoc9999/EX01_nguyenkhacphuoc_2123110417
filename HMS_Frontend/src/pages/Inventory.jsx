import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Edit3, Package, AlertTriangle, CheckCircle2, ShoppingCart } from 'lucide-react';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        itemCode: '', itemName: '', category: 0, unit: '',
        currentStock: 0, minimumStock: 5, unitCost: 0, sellingPrice: 0, 
        isForSale: false
    });

    useEffect(() => { fetchItems(); }, []);

    const handleEdit = (item) => {
        setIsEditing(true);
        setFormData({
            itemCode: item.itemCode,
            itemName: item.itemName,
            category: item.category,
            unit: item.unit,
            currentStock: 0, // Nhập thêm 0 khi sửa thông tin
            minimumStock: item.minimumStock,
            unitCost: item.unitCost,
            sellingPrice: item.sellingPrice,
            isForSale: item.isForSale
        });
        setShowModal(true);
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setFormData({
            itemCode: '', itemName: '', category: 0, unit: '',
            currentStock: 0, minimumStock: 5, unitCost: 0, sellingPrice: 0, 
            isForSale: false
        });
        setShowModal(true);
    };

    const fetchItems = async () => {
        try {
            const res = await api.get('/Inventory');
            setItems(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleSave = async () => {
        try {
            await api.post('/Inventory', formData);
            setShowModal(false);
            fetchItems();
            setFormData({
                itemCode: '', itemName: '', category: 0, unit: '',
                currentStock: 0, minimumStock: 5, unitCost: 0, sellingPrice: 0, 
                isForSale: false
            });
        } catch (err) { alert("Lỗi nhập kho!"); }
    };

    return (
        <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>Logistics & <span style={{ color: '#10b981' }}>Inventory</span></h1>
                    <p style={{ color: '#64748b' }}>Quản lý vật tư, buồng phòng và tiêu thụ minibar</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }}>Kiểm kê</button>
                    <button 
                        onClick={handleAddNew}
                        style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}
                    >+ Nhập kho mới</button>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ textAlign: 'left', padding: '16px', color: '#64748b' }}>MÃ ITEM</th>
                             <th style={{ textAlign: 'left', padding: '16px', color: '#64748b' }}>TÊN VẬT TƯ</th>
                             <th style={{ textAlign: 'left', padding: '16px', color: '#64748b' }}>PHÂN LOẠI</th>
                             <th style={{ textAlign: 'right', padding: '16px', color: '#64748b' }}>GIÁ NIÊM YẾT</th>
                             <th style={{ textAlign: 'left', padding: '16px', color: '#64748b' }}>TỒN KHO</th>
                             <th style={{ textAlign: 'left', padding: '16px', color: '#64748b' }}>TRẠNG THÁI</th>
                             <th style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>THAO TÁC</th>
                         </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu kho...</td></tr>
                        ) : items.map(item => (
                            <tr key={item.itemId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px', fontWeight: '700', color: '#3b82f6' }}>{item.itemCode}</td>
                                 <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>{item.itemName}</td>
                                 <td style={{ padding: '16px', color: '#64748b' }}>{item.category === 0 ? 'Minibar' : 'Amenity'}</td>
                                 <td style={{ padding: '16px', textAlign: 'right', fontWeight: '800', color: '#f59e0b' }}>
                                     {item.isForSale ? `${new Intl.NumberFormat('vi-VN').format(item.sellingPrice)}₫` : 'N/A'}
                                 </td>
                                 <td style={{ padding: '16px', fontWeight: '700' }}>{item.currentStock} {item.unit}</td>
                                 <td style={{ padding: '16px' }}>
                                     <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                                         background: item.currentStock <= item.minimumStock ? '#fee2e2' : '#dcfce7',
                                         color: item.currentStock <= item.minimumStock ? '#ef4444' : '#10b981' }}>
                                         {item.currentStock <= item.minimumStock ? 'CẦN NHẬP THÊM' : 'ỔN ĐỊNH'}
                                     </span>
                                 </td>
                                 <td style={{ padding: '16px', textAlign: 'center' }}>
                                     <button 
                                        onClick={() => handleEdit(item)}
                                        style={{ background: '#f1f5f9', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                     >
                                         <Edit3 size={18} />
                                     </button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>

             {showModal && (
                 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                     <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '500px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                         <h2 style={{ marginBottom: '24px', fontWeight: '900', color: '#0f172a' }}>
                             {isEditing ? `Chỉnh Sửa: ${formData.itemName}` : 'Phiếu Nhập Kho Mới'}
                         </h2>
                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>MÃ VẬT TƯ</label>
                                 <input placeholder="Hệ thống tự tạo..." disabled={isEditing} value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: isEditing ? '#f1f5f9' : 'white' }} />
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>TÊN SẢN PHẨM</label>
                                 <input placeholder="Tên vật tư..." value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>PHÂN LOẠI</label>
                                 <select value={formData.category} onChange={e => setFormData({...formData, category: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                     <option value={0}>Minibar / F&B</option>
                                     <option value={1}>Amenity (Đồ dùng)</option>
                                 </select>
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>ĐƠN VỊ TÍNH</label>
                                 <input placeholder="Chai, Cái, Gói..." value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>NHẬP THÊM (SỐ LƯỢNG)</label>
                                 <input type="number" placeholder="Nhập số lượng..." value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #10b981' }} />
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>GIÁ VỐN (VNĐ)</label>
                                 <input type="number" placeholder="Giá mua vào..." value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#f59e0b', marginBottom: '8px' }}>GIÁ NIÊM YẾT BÁN</label>
                                 <input type="number" placeholder="Giá bán cho khách..." value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: parseFloat(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #f59e0b' }} />
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                                     <input type="checkbox" checked={formData.isForSale} onChange={e => setFormData({...formData, isForSale: e.target.checked})} style={{ width: '18px', height: '18px' }} /> 
                                     <span style={{ color: formData.isForSale ? '#10b981' : '#64748b' }}>BÁN MÓN NÀY TRÊN MENU</span>
                                 </label>
                             </div>
                         </div>
                         <div style={{ display: 'flex', gap: '12px' }}>
                             <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Đóng</button>
                             <button onClick={handleSave} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: '700', cursor: 'pointer' }}>{isEditing ? 'Cập Nhật' : 'Lưu Kho'}</button>
                         </div>
                     </div>
                 </div>
             )}
         </div>
    );
};

export default Inventory;
