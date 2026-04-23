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
      // Chỉ tự động Logout/Redirect nếu KHÔNG PHẢI là request đăng nhập
      // (Vì đăng nhập sai mật khẩu cũng trả về 401, không được redirect làm mất dữ liệu nhập)
      if (!error.config.url.includes('/Account/login')) {
          localStorage.removeItem('hms_token');
          localStorage.removeItem('hms_user');
          window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
