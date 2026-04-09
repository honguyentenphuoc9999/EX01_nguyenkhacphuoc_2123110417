import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeRole = (role) => {
    const roleMap = {
        0: 'Admin',
        1: 'Manager',
        2: 'Receptionist',
        3: 'Housekeeper',
        4: 'Accountant',
        5: 'Technician',
        6: 'RoomAttendant',
        'Guest': 'Guest'
    };
    return roleMap[role] || role;
  };

  useEffect(() => {
    // Khôi phục Session khi tải trang
    const storedUser = localStorage.getItem('hms_user');
    const token = localStorage.getItem('hms_token');
    
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      parsedUser.role = normalizeRole(parsedUser.role);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/Account/login', { username, password });
      const { token, role, username: userName, fullName, position, staffId } = res.data;
      
      const sessionUser = { 
        username: userName, 
        role: normalizeRole(role), 
        fullName: fullName || userName,
        position: position || role,
        staffId: staffId 
      };
      
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
