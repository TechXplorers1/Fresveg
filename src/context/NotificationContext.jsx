import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Initial role-specific sample notifications to ensure instantaneous rich experience
const getSampleNotificationsByRole = (role) => {
  const now = new Date();
  
  if (role === 'vendor') {
    return [
      {
        id: 'n-v1',
        title: '🛒 New Customer Order Received',
        message: 'Customer placed a new order for 5kg Organic Tomatoes (₹120). Please prepare items.',
        time: '5 mins ago',
        type: 'order',
        read: false,
        link: '/profile',
        createdAt: new Date(now.getTime() - 5 * 60000).toISOString()
      },
      {
        id: 'n-v2',
        title: '🌾 New Farm Visit Booking',
        message: '2 guests booked a visit slot at your Agritourism Spot for Aug 16, 2026.',
        time: '25 mins ago',
        type: 'farm',
        read: false,
        link: '/profile',
        createdAt: new Date(now.getTime() - 25 * 60000).toISOString()
      },
      {
        id: 'n-v3',
        title: '⭐ 5-Star Product Review',
        message: 'Received a 5-star rating on Fresh Tomatoes: "Super fresh, high quality harvest!"',
        time: '2 hours ago',
        type: 'review',
        read: true,
        link: '/profile',
        createdAt: new Date(now.getTime() - 120 * 60000).toISOString()
      },
      {
        id: 'n-v4',
        title: '💰 Monthly Payout Processed',
        message: 'Your vendor payout of ₹14,500 has been transferred to your registered account.',
        time: '1 day ago',
        type: 'payment',
        read: true,
        link: '/profile',
        createdAt: new Date(now.getTime() - 1440 * 60000).toISOString()
      }
    ];
  }

  if (role === 'delivery_person') {
    return [
      {
        id: 'n-d1',
        title: '🛵 New Delivery Order Assigned',
        message: 'Order #ORD-9824 is ready for pickup from Root Essentials Store.',
        time: '3 mins ago',
        type: 'delivery',
        read: false,
        link: '/profile',
        createdAt: new Date(now.getTime() - 3 * 60000).toISOString()
      },
      {
        id: 'n-d2',
        title: '📍 Landmark Updated',
        message: 'Customer updated delivery instructions: "Leave at front gate with security guard".',
        time: '20 mins ago',
        type: 'location',
        read: false,
        link: '/profile',
        createdAt: new Date(now.getTime() - 20 * 60000).toISOString()
      },
      {
        id: 'n-d3',
        title: '💰 Daily Delivery Earnings',
        message: '₹450 delivery payout credited for completing 6 delivery orders today.',
        time: '4 hours ago',
        type: 'payout',
        read: true,
        link: '/profile',
        createdAt: new Date(now.getTime() - 240 * 60000).toISOString()
      },
      {
        id: 'n-d4',
        title: '⚡ Peak Hours Bonus Alert',
        message: 'Earn +₹20 extra per order delivered between 6:00 PM and 9:00 PM today!',
        time: '1 day ago',
        type: 'bonus',
        read: true,
        link: '/profile',
        createdAt: new Date(now.getTime() - 1440 * 60000).toISOString()
      }
    ];
  }

  if (role === 'admin') {
    return [
      {
        id: 'n-a1',
        title: '🛡️ New Vendor Verification Requested',
        message: 'Vendor "Green Farms Organic" submitted business documents for verification.',
        time: '10 mins ago',
        type: 'admin',
        read: false,
        link: '/admin',
        createdAt: new Date(now.getTime() - 10 * 60000).toISOString()
      },
      {
        id: 'n-a2',
        title: '📊 Daily Revenue Milestone',
        message: 'Platform marketplace transactions crossed ₹50,000 threshold today!',
        time: '45 mins ago',
        type: 'analytics',
        read: false,
        link: '/admin',
        createdAt: new Date(now.getTime() - 45 * 60000).toISOString()
      },
      {
        id: 'n-a3',
        title: '🚨 Customer Support Request',
        message: 'Customer requested assistance regarding Order #ORD-8812 delivery delay.',
        time: '2 hours ago',
        type: 'support',
        read: true,
        link: '/admin',
        createdAt: new Date(now.getTime() - 120 * 60000).toISOString()
      },
      {
        id: 'n-a4',
        title: '✅ Agritourism Spot Verified',
        message: 'Mahabaleshwar Eco Farm verified and listed live on Visit Farms directory.',
        time: '1 day ago',
        type: 'verified',
        read: true,
        link: '/admin',
        createdAt: new Date(now.getTime() - 1440 * 60000).toISOString()
      }
    ];
  }

  // Customer / Default Sample Notifications
  return [
    {
      id: 'n-c1',
      title: '📦 Order Out for Delivery',
      message: 'Your order #ORD-9824 is out for delivery. Delivery partner is on the way!',
      time: '12 mins ago',
      type: 'order',
      read: false,
      link: '/profile',
      createdAt: new Date(now.getTime() - 12 * 60000).toISOString()
    },
    {
      id: 'n-c2',
      title: '🌾 Farm Booking Confirmed',
      message: 'Your farm visit to Karjat Agritourism Spot for 2 guests is confirmed.',
      time: '1 hour ago',
      type: 'farm',
      read: false,
      link: '/profile',
      createdAt: new Date(now.getTime() - 60 * 60000).toISOString()
    },
    {
      id: 'n-c3',
      title: '🏷️ Fresh Organic Offer',
      message: 'Get 20% OFF on fresh Alphonso Mangoes at Mahabaleshwar Farm Store.',
      time: '3 hours ago',
      type: 'offer',
      read: true,
      link: '/marketplace',
      createdAt: new Date(now.getTime() - 180 * 60000).toISOString()
    },
    {
      id: 'n-c4',
      title: '🌿 Welcome to FresVeg',
      message: 'Enjoy 100% fresh organic produce direct from local farms delivered to your door!',
      time: '1 day ago',
      type: 'welcome',
      read: true,
      link: '/marketplace',
      createdAt: new Date(now.getTime() - 1440 * 60000).toISOString()
    }
  ];
};

export const NotificationProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role || 'customer';
  
  const [notifications, setNotifications] = useState([]);

  // Sync with Firebase Realtime Database or set initial role sample notifications
  useEffect(() => {
    const initialSamples = getSampleNotificationsByRole(role);

    if (!user) {
      setNotifications(initialSamples);
      return;
    }

    const notifRef = ref(realtimeDb, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifArray = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(notifArray);
      } else {
        setNotifications(initialSamples);
      }
    });

    return () => unsubscribe();
  }, [user, role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    if (user) {
      try {
        const targetRef = ref(realtimeDb, `notifications/${user.uid}/${id}/read`);
        set(targetRef, true);
      } catch (err) {
        console.error('Failed to mark notification read in Firebase:', err);
      }
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      try {
        notifications.forEach(n => {
          if (!n.read) {
            const targetRef = ref(realtimeDb, `notifications/${user.uid}/${n.id}/read`);
            set(targetRef, true);
          }
        });
      } catch (err) {
        console.error('Failed to mark all notifications read in Firebase:', err);
      }
    }
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (user) {
      try {
        const targetRef = ref(realtimeDb, `notifications/${user.uid}/${id}`);
        remove(targetRef);
      } catch (err) {
        console.error('Failed to delete notification in Firebase:', err);
      }
    }
  };

  const addNotification = (newNotif) => {
    const notifObj = {
      title: newNotif.title || 'New Notification',
      message: newNotif.message || '',
      time: 'Just now',
      type: newNotif.type || 'info',
      read: false,
      link: newNotif.link || '/profile',
      createdAt: new Date().toISOString()
    };

    if (user) {
      try {
        const notifListRef = ref(realtimeDb, `notifications/${user.uid}`);
        const newRef = push(notifListRef);
        set(newRef, notifObj);
      } catch (err) {
        console.error('Failed to push notification to Firebase:', err);
      }
    } else {
      setNotifications(prev => [{ id: `n-${Date.now()}`, ...notifObj }, ...prev]);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      addNotification,
      role
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
