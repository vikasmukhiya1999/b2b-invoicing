import { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { login, register, getCurrentUser } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if token exists on load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp < currentTime) {
            localStorage.removeItem('token');
            setUser(null);
          } else {
            const response = await getCurrentUser();
            setUser(response.data.user);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const updateUserKyc = useCallback((kycData) => {
    if (user) {
      setUser(prev => ({
        ...prev,
        kycCompleted: true,
        kyc: kycData
      }));
    }
  }, [user]);

  const loginUser = useCallback(async (email, password) => {
    try {
      const response = await login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      // Redirect based on KYC status
      if (!user.kycCompleted) {
        navigate('/kyc');
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }, [navigate]);

  const registerUser = useCallback(async (userData) => {
    try {
      const response = await register(userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      navigate('/kyc');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }, [navigate]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(() => ({
    user,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    updateUserKyc,
    isAuthenticated: !!user
  }), [user, loading, loginUser, registerUser, logoutUser, updateUserKyc]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;