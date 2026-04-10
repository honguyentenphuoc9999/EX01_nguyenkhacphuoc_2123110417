import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, X } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Đóng sidebar khi đổi trang
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      
      {/* Nút bấm Menu linh hoạt */}
      <button 
        className="floating-menu-btn"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar - Sử dụng Transform để ẩn/hiện mượt mà */}
      <div className={`app-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Lớp phủ an toàn khi mở Menu - Hiệu ứng Glassmorphism */}
      {isSidebarOpen && (
        <div 
          className="app-overlay" 
          onClick={() => setIsSidebarOpen(false)} 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 9998,
            transition: 'opacity 0.3s'
          }}
        />
      )}

      {/* Vùng hiển thị nội dung chính */}
      <main className="app-main">
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        .app-sidebar {
          width: 280px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 9999;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: #0f172a;
          box-shadow: 20px 0 50px rgba(0,0,0,0.3);
        }

        .app-main {
          flex: 1;
          margin-left: 280px;
          padding: 32px;
          min-width: 0;
          transition: margin 0.4s ease;
        }

        .floating-menu-btn {
          display: none;
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 9000;
          background: white;
          color: #0f172a;
          border: none;
          padding: 12px;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
        }

        /* XỬ LÝ CHO MÀN HÌNH NHỎ (TABLET & MOBILE) */
        @media (max-width: 1200px) {
          .app-sidebar {
            width: 85%;
            max-width: 320px;
            transform: translateX(-100%);
            border-radius: 0 32px 32px 0;
          }
          .app-sidebar.is-open {
            transform: translateX(0);
          }
          .app-main {
            margin-left: 0;
            padding: 16px;
            padding-top: 85px;
          }
          .floating-menu-btn {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
