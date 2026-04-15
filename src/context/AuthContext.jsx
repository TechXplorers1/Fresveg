import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, realtimeDb } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(result.user, { displayName });
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const sendPhoneOTP = async (phoneNumber) => {
    try {
      // Validate phone number format
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1)');
      }
      if (phoneNumber.length < 10) {
        throw new Error('Phone number is too short');
      }
      
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        },
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      return result;
    } catch (error) {
      console.error('Phone OTP Error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Invalid phone number. Please check the format and country code.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.message && error.message.includes('Phone authentication is not enabled')) {
        throw new Error('Phone authentication is not enabled. Please contact support or use email instead.');
      }
      throw error;
    }
  };

  const verifyPhoneOTP = async (otp) => {
    try {
      const result = await confirmationResult.confirm(otp);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (newData) => {
    try {
      if (user) {
        await updateFirebaseProfile(user, newData);
        // Firebase will trigger onAuthStateChanged, updating the user state
      }
    } catch (error) {
      throw error;
    }
  };

  const saveRole = async (role) => {
    try {
      if (user) {
        await set(ref(realtimeDb, `users/${user.uid}`), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role,
          createdAt: new Date().toISOString()
        });
        // Reload profile after saving
        await loadUserProfile();
      }
    } catch (error) {
      console.error('Error saving role:', error);
      throw error;
    }
  };

  const loadUserProfile = async (authUser = user) => {
    try {
      if (authUser) {
        const userRef = ref(realtimeDb, `users/${authUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
        } else {
          // If no profile exists, create a basic one
          setUserProfile({
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            role: 'customer', // default role
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set basic profile from Firebase Auth if DB fails
      if (authUser) {
        setUserProfile({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          role: 'customer',
          createdAt: new Date().toISOString()
        });
      }
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
