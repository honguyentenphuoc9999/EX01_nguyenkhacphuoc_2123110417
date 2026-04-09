import { Rocket, Sparkles, Clock } from 'lucide-react';

const Services = () => {
    return (
        <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>Service & <span style={{ color: '#10b981' }}>Experience</span></h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Quản lý đặt bàn nhà hàng, lịch hẹn Spa & Laundry</p>
                </div>
                <button style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'not-allowed', opacity: 0.6, fontSize: '14px' }}>+ Coming Soon</button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
                        <div style={{ width: '120px', height: '120px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                            <Rocket size={60} strokeWidth={1.5} />
                        </div>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '40px', height: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                            <Sparkles size={20} />
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

export default Services;
