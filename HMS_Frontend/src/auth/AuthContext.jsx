import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Khôi phục Session khi tải trang
    const storedUser = localStorage.getItem('hms_user');
    const token = localStorage.getItem('hms_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/Account/login', { username, password });
      const { token, role, username: userName } = res.data;
      
      const sessionUser = { username: userName, role };
      
      localStorage.setItem('hms_token', token);
      localStorage.setItem('hms_user', JSON.stringify(sessionUser));
      
      setUser(sessionUser);
      return { success: true };
    } catch (err) {
      console.error('Login Failed', err);
      return { 
        success: false, 
        message: err.response?.data || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'Admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
