import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, get } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import OrderTrackingMap from '../components/OrderTrackingMap';
import {
  ArrowLeft, Package, MapPin, Clock, CheckCircle, Truck,
  ShoppingBag, Store, CreditCard, Calendar, AlertCircle,
  Navigation, RefreshCw
} from 'lucide-react';

// ─── Order Status Timeline config ────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',     label: 'Order Placed',     icon: ShoppingBag, color: 'green'  },
  { key: 'confirmed',   label: 'Confirmed',         icon: CheckCircle, color: 'blue'   },
  { key: 'processing',  label: 'Being Prepared',    icon: Package,     color: 'purple' },
  { key: 'dispatched',  label: 'Out for Delivery',  icon: Truck,       color: 'orange' },
  { key: 'delivered',   label: 'Delivered',         icon: Navigation,  color: 'green'  },
];

const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

function getStepIndex(status) {
  const idx = STATUS_ORDER.indexOf(status?.toLowerCase());
  return idx === -1 ? 0 : idx;
}

// ─── Timeline Step Component ──────────────────────────────────────────────────
function TimelineStep({ step, isActive, isCompleted, isLast }) {
  const Icon = step.icon;
  const colorMap = {
    green:  { bg: 'bg-green-500',  light: 'bg-green-100',  text: 'text-green-600',  ring: 'ring-green-300'  },
    blue:   { bg: 'bg-blue-500',   light: 'bg-blue-100',   text: 'text-blue-600',   ring: 'ring-blue-300'   },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-300' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-300' },
  };
  const c = isCompleted || isActive ? colorMap[step.color] : { bg: 'bg-gray-200', light: 'bg-gray-100', text: 'text-gray-400', ring: 'ring-gray-200' };

  return (
    <div className="flex items-start gap-4 relative">
      {/* Vertical line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-10 w-0.5 h-full -translate-x-1/2 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`}
          style={{ minHeight: '40px' }}
        />
      )}
      {/* Circle Icon */}
      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
        ${isActive ? `${c.bg} ring-4 ${c.ring} ring-offset-2 shadow-lg` : isCompleted ? c.bg : c.light}`}
      >
        <Icon size={18} className={isActive || isCompleted ? 'text-white' : c.text} strokeWidth={2.5} />
      </div>
      {/* Label */}
      <div className="mt-1.5 pb-8">
        <p className={`font-bold text-sm ${isActive ? c.text : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
          {step.label}
        </p>
        {isActive && (
          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>
            Current Status
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedVendorLocation, setResolvedVendorLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Realtime listener on this specific order
  useEffect(() => {
    if (!orderId) return;
    const orderRef = ref(realtimeDb, `orders/${orderId}`);
    const unsubscribe = onValue(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({ id: orderId, ...snapshot.val() });
        } else {
          setError('Order not found.');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching order:', err);
        setError('Failed to load order. Please check your connection.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [orderId]);

  // ── Fallback: look up vendor shop location from user profiles ───────────────
  // Runs when order loads; tries item.shopLocation first, then scans RTDB users
  useEffect(() => {
    if (!order) return;

    const primaryItem = order?.items?.[0];

    // ✅ Already stored in order item (new orders)
    if (primaryItem?.shopLocation) {
      setResolvedVendorLocation(primaryItem.shopLocation);
      return;
    }

    // 🔍 Fallback: scan all vendor profiles to find matching shop name (old orders)
    const vendorShopName = primaryItem?.vendor;
    if (!vendorShopName) return;

    setLocationLoading(true);
    const usersRef = ref(realtimeDb, 'users');
    get(usersRef)
      .then((snapshot) => {
        if (!snapshot.exists()) return;
        const users = snapshot.val();
        // Iterate all user profiles to find a shop whose name matches
        for (const uid of Object.keys(users)) {
          const profile = users[uid];
          const shops = profile.shops;
          if (!shops) continue;
          // shops can be an array or object (Firebase RTDB quirk)
          const shopList = Array.isArray(shops) ? shops : Object.values(shops);
          const match = shopList.find(
            (s) => s?.shopName && s.shopName.toLowerCase() === vendorShopName.toLowerCase()
          );
          if (match?.location) {
            setResolvedVendorLocation(match.location);
            break;
          }
        }
      })
      .catch((err) => console.warn('Could not look up vendor location:', err))
      .finally(() => setLocationLoading(false));
  }, [order]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  const primaryItem = order?.items?.[0];
  const vendorName = primaryItem?.vendor || 'Vendor';
  // resolvedVendorLocation is set by the useEffect above

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="w-14 h-14 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        <p className="text-gray-600 font-medium">Loading order details…</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-400 mb-4" size={52} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 mb-6">{error || 'This order could not be found.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-2xl font-bold transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-500 hover:text-green-700 font-semibold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:border-green-200 transition-all"
          >
            <ArrowLeft size={16} /> Back to Profile
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Track Order
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              #{order.id.slice(-10).toUpperCase()}
            </p>
          </div>
          {/* Live badge */}
          <div className="ml-auto flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Live Tracking
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column: Timeline + Order Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Timeline */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-2.5 rounded-full">
                  <Clock size={20} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Order Status</h2>
                  <p className="text-xs text-gray-500">Last updated in real-time</p>
                </div>
              </div>
              <div>
                {STATUS_STEPS.map((step, idx) => (
                  <TimelineStep
                    key={step.key}
                    step={step}
                    isActive={idx === currentStepIdx}
                    isCompleted={idx < currentStepIdx}
                    isLast={idx === STATUS_STEPS.length - 1}
                  />
                ))}
              </div>
            </div>

            {/* Order Meta Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package size={18} className="text-green-600" />
                Order Info
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={14} />
                    <span>Placed On</span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CreditCard size={14} />
                    <span>Payment</span>
                  </div>
                  <span className="font-semibold text-gray-800">{order.paymentMethod || 'COD'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Store size={14} />
                    <span>Vendor</span>
                  </div>
                  <span className="font-semibold text-gray-800 text-right max-w-[180px] truncate">{vendorName}</span>
                </div>
                <div className="flex items-start gap-2 py-2">
                  <div className="flex items-center gap-2 text-gray-500 flex-shrink-0 mt-0.5">
                    <MapPin size={14} />
                    <span>Ship To</span>
                  </div>
                  <span className="font-semibold text-gray-800 text-right ml-auto max-w-[200px] leading-snug text-xs italic">
                    {order.address}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-between mt-4">
                <span className="font-bold text-green-700">Order Total</span>
                <span className="text-2xl font-black text-green-700">₹{parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingBag size={18} className="text-green-600" />
                Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">Sold by: {item.vendor}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-green-600">Qty: {item.quantity}</span>
                        <span className="text-xs font-bold text-gray-700">₹{item.price}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-gray-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="lg:col-span-3 space-y-6">
            {/* Map Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-indigo-100 p-2.5 rounded-full">
                  <MapPin size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Live Location Tracking</h2>
                  <p className="text-xs text-gray-500">Route, distance &amp; estimated delivery time</p>
                </div>
              </div>

              {/* Vendor location lookup spinner */}
              {locationLoading && (
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
                  <div className="w-3 h-3 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                  Looking up vendor shop location…
                </div>
              )}

              <OrderTrackingMap
                vendorLocation={resolvedVendorLocation}
                vendorName={vendorName}
                deliveryAddress={order.address}
              />

              {/* Notice: vendor hasn't set location */}
              {!resolvedVendorLocation && !locationLoading && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-700">Shop location not set</p>
                    <p className="text-xs text-yellow-600 mt-0.5">
                      The vendor hasn't added their shop location yet. The map and distance will be available once the vendor updates their shop details.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh tip */}
            <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
              <RefreshCw size={12} />
              <span>This page updates automatically when the vendor changes your order status.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
