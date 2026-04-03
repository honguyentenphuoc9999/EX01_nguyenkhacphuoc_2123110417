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
        <Sidebar />
      </div>

      {/* Lớp phủ an toàn khi mở Menu */}
      {isSidebarOpen && (
        <div className="app-overlay" onClick={() => setIsSidebarOpen(false)} />
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
          transition: transform 0.3s ease;
          background: #0f172a;
        }

        .app-main {
          flex: 1;
          margin-left: 280px;
          padding: 32px;
          min-width: 0;
          transition: margin 0.3s ease;
        }

        .floating-menu-btn {
          display: none;
          position: fixed;
          top: 15px;
          right: 15px;
          z-index: 10001;
          background: #0f172a;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }

        /* XỬ LÝ CHO MÀN HÌNH NHỎ (TABLET & MOBILE) */
        @media (max-width: 1200px) {
          .app-sidebar {
            transform: translateX(-100%);
          }
          .app-sidebar.is-open {
            transform: translateX(0);
          }
          .app-main {
            margin-left: 0;
            padding: 20px;
            padding-top: 80px;
          }
          .floating-menu-btn {
            display: flex;
          }
          .app-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(4px);
            z-index: 9998;
          }
        }

        @media (max-width: 640px) {
          .app-main {
            padding: 16px;
            padding-top: 75px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
