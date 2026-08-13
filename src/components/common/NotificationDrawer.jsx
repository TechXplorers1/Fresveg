import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell, X, CheckCheck, Trash2, Package, Truck, Sprout, Star,
  DollarSign, ShieldCheck, MapPin, Tag, ArrowRight, Sparkles
} from 'lucide-react';

const getNotifIcon = (type) => {
  switch (type) {
    case 'order':
    case 'delivery':
      return <Package size={16} className="text-emerald-600" />;
    case 'farm':
      return <Sprout size={16} className="text-emerald-600" />;
    case 'review':
      return <Star size={16} className="text-amber-500 fill-amber-500" />;
    case 'payment':
    case 'payout':
      return <DollarSign size={16} className="text-teal-600" />;
    case 'admin':
    case 'verified':
      return <ShieldCheck size={16} className="text-emerald-600" />;
    case 'location':
      return <MapPin size={16} className="text-rose-500" />;
    case 'offer':
      return <Tag size={16} className="text-purple-600" />;
    default:
      return <Bell size={16} className="text-emerald-600" />;
  }
};

export default function NotificationDrawer({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, role } = useNotifications();
  const navigate = useNavigate();

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleItemClick = (item) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getRoleTitle = () => {
    if (role === 'vendor') return 'Vendor Dashboard Alerts';
    if (role === 'delivery_person') return 'Delivery Partner Alerts';
    if (role === 'admin') return 'Admin System Alerts';
    return 'Customer Notifications';
  };

  return (
    <>
      {/* Bell Trigger Button */}
      {isMobile ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-between w-full px-4 py-2.5 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
              {unreadCount} new
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100/60 rounded-xl transition-all duration-200 cursor-pointer"
          title="Notifications"
        >
          <Bell size={21} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 py-0.5 text-2xs font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-bounce font-mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Notification Drawer Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in text-left">
          {/* Backdrop Click to Close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Drawer Container */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black font-headings text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-200 font-medium mt-0.5">
                  {getRoleTitle()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-bold text-emerald-200 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-headings"
                    title="Mark all as read"
                  >
                    <CheckCheck size={14} /> Read All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer font-headings ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 rounded-xl font-extrabold transition-all cursor-pointer font-headings ${
                  filter === 'unread'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm font-headings">
                      No notifications {filter === 'unread' ? 'unread' : 'yet'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      You're all caught up! Updates regarding orders, bookings, and alerts will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                      !n.read
                        ? 'bg-emerald-50/50 border-emerald-200/80 shadow-xs hover:border-emerald-300 hover:bg-emerald-50'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Unread Status Indicator */}
                    {!n.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-emerald-600 rounded-full shrink-0 animate-pulse" />
                    )}

                    {/* Notification Type Icon */}
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                      {getNotifIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4 text-left space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm font-headings leading-tight group-hover:text-emerald-700 transition-colors">
                          {n.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 font-medium font-body leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-bold font-mono">
                          {n.time}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-headings">
                          View details <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer absolute bottom-3 right-3"
                      title="Delete notification"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium text-[11px]">
                FresVeg Live Alerts System
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-extrabold text-slate-700 hover:text-slate-900 cursor-pointer font-headings"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
