import { Target, Zap, Clock, Sparkles } from 'lucide-react';

const Marketing = () => {
    return (
        <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', color: '#1e293b', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a' }}>Marketing <span style={{ color: '#10b981' }}>Automation</span></h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Tăng trưởng doanh thu qua Email, SMS và phân khúc khách hàng thông minh</p>
                </div>
                <button style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'not-allowed', opacity: 0.6, fontSize: '14px' }}>
                    + Coming Soon
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
                        <div style={{ width: '140px', height: '140px', background: 'white', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                            <Target size={70} strokeWidth={1.2} />
                        </div>
                        <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', width: '50px', height: '50px', background: '#10b981', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)' }}>
                            <Zap size={24} fill="currentColor" />
                        </div>
                    </div>

                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginBottom: '12px' }}>TÍNH NĂNG ĐANG <span style={{ color: '#10b981' }}>PHÁT TRIỂN</span></h2>
                    <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '15px' }}>
                        Chúng tôi đang nỗ lực hoàn thiện hệ thống điều phối dịch vụ Khách sạn để mang lại trải nghiệm quản lý đẳng cấp nhất. Hãy cùng chờ đón nhé!
                    </p>
                    
                    <div style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', borderRadius: '100px', border: '1px solid #e2e8f0', color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                        <Clock size={16} /> Dự kiến hoàn thành: 2026+
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Marketing;
