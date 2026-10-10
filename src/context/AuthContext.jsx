import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fresveg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fresveg_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Restore authenticated session from Keycloak via JWT token on App load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('fresveg_jwt_token');
      const refreshToken = localStorage.getItem('fresveg_refresh_token');

      if (token) {
        try {
          const profileData = await api.getAuthMe();
          if (profileData && profileData.uid) {
            const userObj = {
              uid: profileData.uid,
              email: profileData.email,
              displayName: profileData.displayName,
              photoURL: profileData.photoURL || '',
              role: profileData.role || 'customer'
            };
            setUser(userObj);
            setUserProfile(profileData);
            localStorage.setItem('fresveg_user', JSON.stringify(userObj));
            localStorage.setItem('fresveg_profile', JSON.stringify(profileData));
          } else {
            throw new Error('Incomplete profile');
          }
        } catch (err) {
          console.warn('Keycloak session expired or invalid, attempting refresh...', err.message);
          // Try refreshing token if available
          if (refreshToken) {
            try {
              const refreshRes = await api.refreshToken(refreshToken);
              if (refreshRes && refreshRes.token) {
                localStorage.setItem('fresveg_jwt_token', refreshRes.token);
                if (refreshRes.refreshToken) {
                  localStorage.setItem('fresveg_refresh_token', refreshRes.refreshToken);
                }
                const profileData = await api.getAuthMe();
                const userObj = {
                  uid: profileData.uid,
                  email: profileData.email,
                  displayName: profileData.displayName,
                  photoURL: profileData.photoURL || '',
                  role: profileData.role || 'customer'
                };
                setUser(userObj);
                setUserProfile(profileData);
                localStorage.setItem('fresveg_user', JSON.stringify(userObj));
                localStorage.setItem('fresveg_profile', JSON.stringify(profileData));
                setLoading(false);
                return;
              }
            } catch (refErr) {
              console.warn('Keycloak refresh token also expired:', refErr.message);
            }
          }
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Keycloak OIDC Login
  const login = async (email, password) => {
    try {
      const response = await api.loginUser(email, password);
      const { token, refreshToken, user: userObj } = response;

      localStorage.setItem('fresveg_jwt_token', token);
      if (refreshToken) {
        localStorage.setItem('fresveg_refresh_token', refreshToken);
      }
      localStorage.setItem('fresveg_user', JSON.stringify(userObj));
      localStorage.setItem('fresveg_profile', JSON.stringify(userObj));

      setUser(userObj);
      setUserProfile(userObj);

      return userObj;
    } catch (error) {
      console.error('Keycloak Login Error:', error);
      throw error;
    }
  };

  // Keycloak OIDC Register
  const register = async (email, password, displayName, role = 'customer') => {
    try {
      const response = await api.registerUser({
        email,
        password,
        displayName,
        role
      });
      const { token, refreshToken, user: userObj } = response;

      localStorage.setItem('fresveg_jwt_token', token);
      if (refreshToken) {
        localStorage.setItem('fresveg_refresh_token', refreshToken);
      }
      localStorage.setItem('fresveg_user', JSON.stringify(userObj));
      localStorage.setItem('fresveg_profile', JSON.stringify(userObj));

      setUser(userObj);
      setUserProfile(userObj);

      return userObj;
    } catch (error) {
      console.error('Keycloak Register Error:', error);
      throw error;
    }
  };

  // Phone OTP Stub for compatibility
  const sendPhoneOTP = async (phoneNumber) => {
    throw new Error('Phone authentication is disabled. Please sign up or log in using Email & Password.');
  };

  const verifyPhoneOTP = async (otp) => {
    throw new Error('Phone authentication is disabled. Please sign up or log in using Email & Password.');
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('fresveg_jwt_token');
    localStorage.removeItem('fresveg_refresh_token');
    localStorage.removeItem('fresveg_user');
    localStorage.removeItem('fresveg_profile');
    setUser(null);
    setUserProfile(null);
  };

  // Update Profile Data in PostgreSQL
  const updateProfile = async (newData) => {
    try {
      if (!user) return;

      const updatedProfile = await api.updateUserProfile(user.uid, {
        email: user.email,
        ...newData
      });

      const updatedUserObj = {
        ...user,
        displayName: updatedProfile.displayName || user.displayName,
        photoURL: updatedProfile.photoURL || user.photoURL
      };

      setUser(updatedUserObj);
      setUserProfile(updatedProfile);

      localStorage.setItem('fresveg_user', JSON.stringify(updatedUserObj));
      localStorage.setItem('fresveg_profile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating profile in PostgreSQL:', error);
      throw error;
    }
  };

  // Save User Role in PostgreSQL
  const saveRole = async (role) => {
    try {
      if (user) {
        await api.saveUserRole(user.uid, role);
        const newProfileData = {
          ...(userProfile || {}),
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role
        };
        setUserProfile(newProfileData);
        localStorage.setItem('fresveg_profile', JSON.stringify(newProfileData));
      }
    } catch (error) {
      console.error('Error saving role in PostgreSQL:', error);
      throw error;
    }
  };

  // Reload user profile from PostgreSQL
  const loadUserProfile = async (authUser = user) => {
    try {
      if (authUser && authUser.uid) {
        const profileData = await api.getUserProfile(authUser.uid);
        setUserProfile(profileData);
        localStorage.setItem('fresveg_profile', JSON.stringify(profileData));
      }
    } catch (error) {
      console.error('Error loading profile from PostgreSQL:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    sendPhoneOTP,
    verifyPhoneOTP,
    logout,
    updateProfile,
    saveRole,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
