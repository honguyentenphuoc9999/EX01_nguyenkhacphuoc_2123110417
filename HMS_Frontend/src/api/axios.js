import axios from 'axios';

const api = axios.create({
  baseURL: 'https://phuocnguyen-001-site1.mtempurl.com/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors (like 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 🛡️ HMS SAFETY GATE: Kiểm tra kỹ xem có phải là request LOGIN không
      // Chúng ta kiểm tra cả trong url và data để chắc chắn
      const isLoginPath = error.config?.url?.toLowerCase().includes('login');
      
      if (!isLoginPath) {
          // Chỉ redirect khi không phải trang login (Token hết hạn khi đang dùng các trang khác)
          localStorage.removeItem('hms_token');
          localStorage.removeItem('hms_user');
          window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
