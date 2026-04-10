import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Printer, 
    CheckCircle2, 
    AlertCircle, 
    QrCode, 
    Trash2, 
    X, 
    CreditCard, 
    ShieldCheck, 
    ExternalLink,
    Search,
    Clock
} from 'lucide-react';
import api from '../api/axios';

// --- MODAL THANH TOÁN VIETQR ---
const PaymentModal = ({ invoice, onClose, onConfirm }) => {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQr = async () => {
            try {
                const res = await api.get(`/Invoices/${invoice.invoiceId}/payment-info`);
                setQrData(res.data);
            } catch (err) {
                console.error("Lỗi lấy VietQR", err);
            } finally {
                setLoading(false);
            }
        };
        fetchQr();
    }, [invoice.invoiceId]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '900' }}>Thanh toán VietQR</h3>
                        <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer' }}><X size={18}/></button>
                    </div>

                    {!loading && qrData ? (
                        <>
                            <div style={{ background: '#f8fafc', padding: '32px', borderRadius: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                                <img src={qrData.qrUrl} style={{ width: '240px', height: '240px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} alt="VietQR" />
                            </div>
                            
                            <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px', marginBottom: '32px' }}>
                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '800' }}>SỐ TIỀN CẦN THANH TOÁN</div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(qrData.amount)}</div>
                            </div>

                            <button onClick={onConfirm} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <CheckCircle2 size={20}/> Tôi đã nhận được tiền
                            </button>
                        </>
                    ) : ( 
                        <div style={{ padding: '40px', color: '#94a3b8' }}>Đang khởi tạo mã QR thanh toán...</div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- MODAL IN HÓA ĐƠN ---
const PrintInvoiceModal = ({ invoice, onClose }) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.98)', zIndex: 3000, overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '60px', border: '1px solid #e2e8f0', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '60px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>HMS PHUOC PREMIER</h1>
                        <p style={{ color: '#64748b' }}>Hệ thống quản lý khách sạn chuyên nghiệp</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>HÓA ĐƠN GTGT</h2>
                        <p style={{ color: '#64748b' }}>Số: {invoice.invoiceNumber}</p>
                        <p style={{ color: '#64748b' }}>Ngày: {new Date(invoice.issuedAt).toLocaleString('vi-VN', { hour12: false })}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '40px' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>KHÁCH HÀNG & PHÒNG</div>
                    <p style={{ fontWeight: '700', fontSize: '18px' }}>Khách hàng: {invoice.folio?.reservation?.guest?.fullName || "Khách vãng lai"}</p>
                    <p style={{ fontWeight: '700', color: '#3b82f6' }}>Phòng lưu trú: {invoice.folio?.reservation?.room?.roomNumber || "N/A"}</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px', textAlign: 'left' }}>NỘI DUNG</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>THÀNH TIỀN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.folio?.charges?.map((charge, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 12px' }}>{charge.description}</td>
                                <td style={{ padding: '16px 12px', textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN').format(charge.totalAmount)} đ</td>
                            </tr>
                        ))}
                        <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '700' }}>VAT (10%)</td>
                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>{new Intl.NumberFormat('vi-VN').format(invoice.vatAmount)} đ</td>
                        </tr>
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                            <td style={{ padding: '16px 12px', fontWeight: '900', fontSize: '20px' }}>TỔNG CỘNG</td>
                            <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: '900', fontSize: '20px' }}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.totalAmount)}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', textAlign: 'center', marginTop: '60px' }}>
                    <div>
                        <p style={{ fontWeight: '700' }}>Người lập phiếu</p>
                        <p style={{ fontStyle: 'italic', fontSize: '12px' }}>(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div>
                        <p style={{ fontWeight: '700' }}>Khách hàng</p>
                        <p style={{ fontStyle: 'italic', fontSize: '12px' }}>(Ký và ghi rõ họ tên)</p>
                    </div>
                </div>

                <div className="no-print" style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Quay lại</button>
                    <button onClick={() => window.print()} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: '#0f172a', color: 'white', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Printer size={18}/> In Hóa đơn ngay
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePayment, setActivePayment] = useState(null);
    const [printInvoice, setPrintInvoice] = useState(null);

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

    const handleMarkAsPaid = async (id) => {
        try {
            await api.post(`/Invoices/${id}/mark-as-paid`);
            setActivePayment(null);
            fetchInvoices();
        } catch (err) {
            alert("Lỗi xác nhận thanh toán");
        }
    };

    const handleDelete = async (id) => {
        const reason = window.prompt("⚠️ CẢNH BÁO: Bạn đang xóa một hóa đơn tài chính!\nVui lòng nhập lý do xóa để lưu vào lịch sử (Audit Log):");
        if (!reason) return;
        
        try {
            await api.delete(`/Invoices/${id}/safety-delete?reason=${encodeURIComponent(reason)}`);
            fetchInvoices();
        } catch (err) {
            alert("Lỗi xóa: " + err.response?.data || "Lỗi không xác định");
        }
    };

    const getStatusStyle = (status) => {
        // Handle BOTH numeric (from DB) and string (after update) statuses
        if (status === 1 || status === 'Paid') return { bg: '#dcfce7', text: '#166534', label: 'Đã thanh toán' };
        return { bg: '#eff6ff', text: '#3b82f6', label: 'Chờ thanh toán' };
    };

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' }}>Tài chính & Hóa đơn</h1>
                    <p style={{ color: '#64748b' }}>Quản lý VietQR và in hóa đơn GTGT tiêu chuẩn.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '800' }}>DOANH THU ĐÃ THU</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981' }}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoices.filter(i => i.status === 'Paid' || i.status === 1).reduce((s,i) => s+i.totalAmount, 0))}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <th style={{ padding: '24px', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>HÓA ĐƠN</th>
                            <th style={{ padding: '24px', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>NGÀY LẬP</th>
                            <th style={{ padding: '24px', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>TỔNG TIỀN (VAT 10%)</th>
                            <th style={{ padding: '24px', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '24px', fontSize: '13px', color: '#64748b', fontWeight: '800' }}>HÀNH ĐỘNG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Đang tải hóa đơn tài chính...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có hóa đơn nào được lập.</td></tr>
                        ) : (
                            invoices.map((inv) => {
                                const currentStatus = inv.status !== undefined ? inv.status : inv.Status;
                                const style = getStatusStyle(currentStatus);
                                const isPaid = currentStatus === 'Paid' || currentStatus === 1 || String(currentStatus).toLowerCase() === 'paid';
                                return (
                                    <tr key={inv.invoiceId} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: '#f1f5f9', color: '#3b82f6', padding: '8px', borderRadius: '12px' }}><FileText size={20}/></div>
                                                <span style={{ fontWeight: '800', color: '#0f172a' }}>{inv.invoiceNumber}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px', color: '#0f172a', fontWeight: '700' }}>
                                            <div style={{ fontSize: '15px' }}>{new Date(inv.issuedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                                            <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <Clock size={12} />
                                                {new Date(inv.issuedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '16px' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.totalAmount)}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>GỐC: {new Intl.NumberFormat('vi-VN').format(inv.subTotal)}đ</div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                padding: '6px 14px', 
                                                borderRadius: '12px', 
                                                background: isPaid ? '#f0fdf4' : '#eff6ff', 
                                                color: isPaid ? '#10b981' : '#3b82f6', 
                                                border: `1px solid ${isPaid ? '#10b981' : '#3b82f6'}44`,
                                                fontWeight: '800', 
                                                fontSize: '12px' 
                                            }}>
                                                {isPaid ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                                                {isPaid ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {!isPaid && (
                                                    <button onClick={() => setActivePayment(inv)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                                        <QrCode size={16}/> Thanh toán
                                                    </button>
                                                )}
                                                {isPaid && (
                                                    <button onClick={() => setPrintInvoice(inv)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>
                                                        <Printer size={16}/> In Hóa đơn
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(inv.invoiceId)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {activePayment && (
                    <PaymentModal 
                        invoice={activePayment} 
                        onClose={() => setActivePayment(null)}
                        onConfirm={() => handleMarkAsPaid(activePayment.invoiceId)}
                    />
                )}
                {printInvoice && (
                    <PrintInvoiceModal 
                        invoice={printInvoice} 
                        onClose={() => setPrintInvoice(null)} 
                    />
                )}
            </AnimatePresence>

            <style>{`
                @media print {
                    @page { size: portrait; margin: 10mm; }
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .print-container { 
                        position: static !important;
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        border: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

export default Invoices;
