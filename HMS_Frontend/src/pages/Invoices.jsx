import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle2, AlertCircle, Filter, DollarSign } from 'lucide-react';
import api from '../api/axios';

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/Invoices');
            setInvoices(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch invoices', err);
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 0: return { bg: '#eff6ff', text: '#3b82f6', label: 'Chưa thanh toán' }; // Pending/Issued
            case 1: return { bg: '#dcfce7', text: '#166534', label: 'Đã thanh toán' }; // Paid
            default: return { bg: '#f1f5f9', text: '#475569', label: 'Khác' };
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Hóa đơn & Thanh toán</h1>
                    <p style={{ color: '#64748b' }}>Theo dõi lịch sử thu chi và trạng thái tài chính của khách sạn.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        <Filter size={18} /> Lọc kết quả
                    </button>
                    <button style={{ background: '#0f172a', color: 'white', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                        <Download size={18} /> Xuất báo cáo (CSV)
                    </button>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Tổng doanh thu (Tháng)</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>1,540,200,000 ₫</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Hóa đơn đang chờ</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>12 Hóa đơn</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Tỉ lệ thanh toán</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>98.5%</div>
                </div>
            </div>

            {/* Invoices List */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>MÃ HÓA ĐƠN</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>NGÀY LẬP</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>TỔNG TIỀN (VAT 10%)</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>Đang tải hóa đơn...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>Chưa có hóa đơn nào được phát hành.</td></tr>
                        ) : invoices.map((inv) => {
                            const style = getStatusStyle(inv.status);
                            return (
                                <tr key={inv.invoiceId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FileText size={20} color="#3b82f6" opacity={0.6} />
                                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{inv.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>
                                        {new Date(inv.issuedAt || Date.now()).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.totalAmount)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Gốc: {new Intl.NumberFormat('vi-VN').format(inv.subTotal)} + Thuế
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ 
                                            padding: '4px 10px', background: style.bg, color: style.text, 
                                            borderRadius: '20px', fontSize: '12px', fontWeight: '600', 
                                            display: 'inline-flex', alignItems: 'center', gap: '6px' 
                                        }}>
                                            {inv.status === 1 ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                                            {style.label}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button style={{ color: '#3b82f6', background: 'transparent', fontWeight: '600' }}>In hóa đơn</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Invoices;
