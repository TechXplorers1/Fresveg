import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, realtimeDb } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';

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
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Force browserLocalPersistence so Firebase Auth session is persisted across browser refreshes
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('Firebase persistence setup:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userObj = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        };
        setUser(userObj);
        try {
          localStorage.setItem('fresveg_user', JSON.stringify(userObj));
        } catch (e) {}
        await loadUserProfile(firebaseUser);
      } else {
        setUser(null);
        setUserProfile(null);
        try {
          localStorage.removeItem('fresveg_user');
          localStorage.removeItem('fresveg_profile');
        } catch (e) {}
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      };
      setUser(userObj);
      try {
        localStorage.setItem('fresveg_user', JSON.stringify(userObj));
      } catch (e) {}
      await loadUserProfile(result.user);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateFirebaseProfile(result.user, { displayName });
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName,
        photoURL: result.user.photoURL
      };
      setUser(userObj);
      try {
        localStorage.setItem('fresveg_user', JSON.stringify(userObj));
      } catch (e) {}
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const sendPhoneOTP = async (phoneNumber) => {
    try {
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must include country code (e.g., +1)');
      }
      if (phoneNumber.length < 10) {
        throw new Error('Phone number is too short');
      }
      
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
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
      const userObj = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      };
      setUser(userObj);
      try {
        localStorage.setItem('fresveg_user', JSON.stringify(userObj));
      } catch (e) {}
      await loadUserProfile(result.user);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      try {
        localStorage.removeItem('fresveg_user');
        localStorage.removeItem('fresveg_profile');
      } catch (e) {}
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      localStorage.removeItem('fresveg_user');
      localStorage.removeItem('fresveg_profile');
      throw error;
    }
  };

  const updateProfile = async (newData) => {
    try {
      if (!user) return;

      const authData = {};
      if (newData.displayName) authData.displayName = newData.displayName;
      if (newData.photoURL) authData.photoURL = newData.photoURL;

      if (Object.keys(authData).length > 0 && auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, authData);
      }

      const userRef = ref(realtimeDb, `users/${user.uid}`);
      await update(userRef, newData);

      // Mirror public shop info to publicShops/{uid} so Marketplace can read it
      // without being blocked by the restricted users/ node permissions
      if (newData.shops) {
        const shopsArray = Array.isArray(newData.shops)
          ? newData.shops
          : Object.values(newData.shops);
        const publicShopData = shopsArray.map(s => ({
          shopName: s.shopName || '',
          image: s.image || '',
          location: s.location || '',
          gstNumber: s.gstNumber || '',
          socialLinks: s.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
          updatedAt: s.updatedAt || s.createdAt || new Date().toISOString()
        }));
        const publicRef = ref(realtimeDb, `publicShops/${user.uid}`);
        await set(publicRef, publicShopData);
      }

      await loadUserProfile(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const saveRole = async (role) => {
    try {
      if (user) {
        const userRef = ref(realtimeDb, `users/${user.uid}`);
        const newProfileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: role,
          createdAt: new Date().toISOString()
        };
        await set(userRef, newProfileData);
        setUserProfile(newProfileData);
        try {
          localStorage.setItem('fresveg_profile', JSON.stringify(newProfileData));
        } catch (e) {}
        await loadUserProfile(user);
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
        let profileData;
        if (snapshot.exists()) {
          profileData = snapshot.val();
        } else {
          profileData = {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            role: 'customer',
            createdAt: new Date().toISOString()
          };
        }
        setUserProfile(profileData);
        try {
          localStorage.setItem('fresveg_profile', JSON.stringify(profileData));
        } catch (e) {}
      } else {
        setUserProfile(null);
        try {
          localStorage.removeItem('fresveg_profile');
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      if (authUser) {
        const fallbackProfile = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          role: 'customer',
          createdAt: new Date().toISOString()
        };
        setUserProfile(fallbackProfile);
        try {
          localStorage.setItem('fresveg_profile', JSON.stringify(fallbackProfile));
        } catch (e) {}
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
