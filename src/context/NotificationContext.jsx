import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const defaultNotificationContext = {
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  addNotification: async () => {},
  role: 'customer'
};

const NotificationContext = createContext(defaultNotificationContext);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  return context || defaultNotificationContext;
};

const getSampleNotificationsByRole = () => {
  return [];
};

export const NotificationProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role || 'customer';
  
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const data = await api.getNotifications(user.uid);
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.warn('Error fetching notifications from PostgreSQL:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [user, role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    if (user && !String(id).startsWith('n-')) {
      try {
        await api.markNotificationRead(id);
      } catch (err) {
        console.error('Failed to mark notification read in PostgreSQL:', err);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (user) {
      try {
        await api.markAllNotificationsRead(user.uid);
      } catch (err) {
        console.error('Failed to mark all notifications read in PostgreSQL:', err);
      }
    }
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (user && !String(id).startsWith('n-')) {
      try {
        await api.deleteNotification(id);
      } catch (err) {
        console.error('Failed to delete notification in PostgreSQL:', err);
      }
    }
  };

  const addNotification = async (newNotif) => {
    const notifObj = {
      title: newNotif.title || 'New Notification',
      message: newNotif.message || '',
      type: newNotif.type || 'info',
      link: newNotif.link || '/profile'
    };

    if (user) {
      try {
        const created = await api.createNotification({ userId: user.uid, ...notifObj });
        setNotifications(prev => [created, ...prev]);
      } catch (err) {
        console.error('Failed to create notification in PostgreSQL:', err);
      }
    } else {
      setNotifications(prev => [{ id: `n-${Date.now()}`, ...notifObj, read: false, time: 'Just now', createdAt: new Date().toISOString() }, ...prev]);
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
