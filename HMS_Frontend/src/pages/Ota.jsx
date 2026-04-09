import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Ota = () => {
    const [configs, setConfigs] = useState([]);
    const [logs, setLogs] = useState([]);

    const fetchData = async () => {
        try {
            const resConfig = await api.get('/extra/ota/configs');
            const resLogs = await api.get('/extra/ota/sync-logs');
            setConfigs(resConfig.data);
            setLogs(resLogs.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async (channelName) => {
        try {
            await api.post(`/extra/ota/sync-reservations?channel=${channelName}`);
            await fetchData(); // Refresh data
            alert(`Đã hoàn thành đồng bộ dữ liệu từ ${channelName}`);
        } catch (err) { alert('Lỗi đồng bộ!'); }
    };

    return (
        <div style={{ padding: '30px', background: '#f8fafc', minHeight: '100vh' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', marginBottom: '30px' }}>
                OTA <span style={{ color: '#f59e0b' }}>Synchronization</span>
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                {/* Connection Configs */}
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Kênh kết nối</h2>
                    {configs.map(c => (
                            <div key={c.configId} style={{ background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: c.apiKey?.startsWith('AG') ? '#fef3c7' : '#e0f2fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: c.apiKey?.startsWith('AG') ? '#f59e0b' : '#3b82f6' }}>
                                        {c.apiKey?.startsWith('AG') ? 'AG' : 'BK'}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{c.apiKey?.startsWith('AG') ? 'Agoda' : 'Booking.com'}</h4>
                                        <span style={{ fontSize: '12px', color: c.isActive ? '#10b981' : '#ef4444' }}>
                                            {c.isActive ? '● Connected' : '○ Disconnected'}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleSync(c.apiKey?.startsWith('AG') ? 'Agoda' : 'Booking.com')}
                                            style={{ padding: '8px 16px', borderRadius: '10px', background: '#f1f5f9', border: 'none', fontWeight: '700', cursor: 'pointer', color: '#475569' }}>
                                            Đồng bộ ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                    ))}
                    <button style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '2px dashed #cbd5e1', background: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>+ Thêm kênh OTA</button>
                </div>

                {/* Sync Logs */}
                <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Lịch sử đồng bộ</h2>
                        <button onClick={fetchData} style={{ color: '#3b82f6', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Refresh</button>
                    </div>
                    {logs.map(log => (
                        <div key={log.logId} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <span style={{ fontWeight: '700' }}>{log.externalBookingCode}</span>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{log.action} - {new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                            <span style={{ color: log.isSuccess ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                {log.isSuccess ? 'Thành công' : 'Thất bại'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Ota;
