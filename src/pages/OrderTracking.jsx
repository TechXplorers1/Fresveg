import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, get, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import OrderTrackingMap from '../components/OrderTrackingMap';
import {
  ArrowLeft, Package, MapPin, Clock, CheckCircle, Truck,
  ShoppingBag, Store, CreditCard, Calendar, AlertCircle,
  Navigation, RefreshCw, Phone, MessageCircle
} from 'lucide-react';

// ─── Order Status Timeline config ────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'pending',     label: 'Order Placed',     icon: ShoppingBag, color: 'green'  },
  { key: 'confirmed',   label: 'Confirmed',         icon: CheckCircle, color: 'blue'   },
  { key: 'processing',  label: 'Packing',           icon: Package,     color: 'purple' },
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
    green:  { bg: 'bg-emerald-500',  light: 'bg-emerald-50',  text: 'text-emerald-600',  ring: 'ring-emerald-300'  },
    blue:   { bg: 'bg-blue-500',     light: 'bg-blue-50',     text: 'text-blue-600',     ring: 'ring-blue-300'   },
    purple: { bg: 'bg-purple-500',   light: 'bg-purple-50',   text: 'text-purple-600',   ring: 'ring-purple-300' },
    orange: { bg: 'bg-orange-500',   light: 'bg-orange-50',   text: 'text-orange-600',   ring: 'ring-orange-300' },
  };
  const c = isCompleted || isActive ? colorMap[step.color] : { bg: 'bg-slate-250', light: 'bg-slate-50', text: 'text-slate-400', ring: 'ring-slate-100' };

  return (
    <div className="flex items-start gap-5 relative">
      {/* Vertical line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-10 w-[2px] h-[calc(100%-12px)] -translate-x-1/2 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200'}`}
          style={{ minHeight: '44px' }}
        />
      )}
      {/* Circle Icon */}
      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
        isActive 
          ? `${c.bg} ring-4 ${c.ring} ring-offset-2 shadow-lg animate-pulse-glow` 
          : isCompleted 
          ? 'bg-emerald-650 text-white' 
          : 'bg-slate-100 border border-slate-200/50'
      }`}
      >
        <Icon size={16} className={isActive || isCompleted ? 'text-white' : 'text-slate-400'} strokeWidth={2} />
      </div>
      {/* Label */}
      <div className="mt-1 pb-6">
        <p className={`font-bold font-headings text-sm ${isActive ? 'text-emerald-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
          {step.label}
        </p>
        {isActive && (
          <span className="inline-flex mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100/30">
            Current Stage
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
async function geocodeAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'FresVegApp/1.0' },
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.warn('Geocoding failed for:', address, err);
  }
  return null;
}

export default function OrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedVendorLocation, setResolvedVendorLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Simulation states
  const [simulating, setSimulating] = useState(false);
  const [simIntervalId, setSimIntervalId] = useState(null);

  // Derived state values
  const currentStepIdx = getStepIndex(order?.status);
  const vendorName = order?.items?.[0]?.vendor || 'Shop Pickup';

  // Clean up simulator on unmount or status change
  useEffect(() => {
    return () => {
      if (simIntervalId) {
        clearInterval(simIntervalId);
      }
    };
  }, [simIntervalId]);

  const handleSimulateMovement = async () => {
    if (simulating) {
      if (simIntervalId) {
        clearInterval(simIntervalId);
        setSimIntervalId(null);
      }
      setSimulating(false);
      return;
    }

    if (!resolvedVendorLocation || !order?.address) {
      alert("Both vendor shop location and delivery address must be set to run simulation.");
      return;
    }

    setSimulating(true);
    const startCoords = await geocodeAddress(resolvedVendorLocation);
    // Stagger geocoding requests to prevent Nominatim rate-limiting
    await new Promise((r) => setTimeout(r, 1100));
    const endCoords = await geocodeAddress(order.address);

    if (!startCoords || !endCoords) {
      alert("Failed to geocode addresses for simulation. Please enter detailed locations.");
      setSimulating(false);
      return;
    }

    // Generate 15 steps along the line
    const totalSteps = 15;
    const path = [];
    for (let i = 0; i <= totalSteps; i++) {
      const fraction = i / totalSteps;
      const lat = startCoords.lat + (endCoords.lat - startCoords.lat) * fraction;
      const lng = startCoords.lon + (endCoords.lon - startCoords.lon) * fraction;
      path.push({ lat, lng });
    }

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep >= path.length) {
        clearInterval(interval);
        setSimIntervalId(null);
        setSimulating(false);
        alert("Delivery simulation completed!");
        return;
      }

      const point = path[currentStep];
      const newLoc = {
        lat: point.lat,
        lng: point.lng,
        timestamp: new Date().toISOString()
      };

      try {
        const dbRef = ref(realtimeDb, `orders/${orderId}/deliveryBoyLocation`);
        await set(dbRef, newLoc);
        console.log(`Simulation step ${currentStep + 1}/${path.length} updated:`, newLoc);
      } catch (err) {
        console.error("Simulation database update failed:", err);
      }

      currentStep++;
    }, 2000); // Update coordinates every 2 seconds

    setSimIntervalId(interval);
  };

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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#f8faf7] via-[#f2f8f0] to-[#eaf5e7]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-100 border-t-emerald-600"></div>
          <RefreshCw className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600 animate-pulse animate-spin" size={24} />
        </div>
        <p className="mt-4 text-emerald-800 font-semibold animate-pulse font-headings font-bold">Loading tracker details...</p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 bg-gradient-to-br from-[#f8faf7] via-[#f2f8f0] to-[#eaf5e7]">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl p-10 max-w-md text-center">
          <AlertCircle className="mx-auto text-rose-450 mb-4" size={52} />
          <h2 className="text-2xl font-bold font-headings text-slate-800 mb-2">Oops!</h2>
          <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">{error || 'This order could not be found.'}</p>
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm tracking-wide rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20 active:scale-[0.98]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-10 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          {[
            { label: 'Shopping Cart', desc: 'Manage items & location' },
            { label: 'Payment', desc: 'Choose checkout method' },
            { label: isDelivered ? 'Delivery Completed' : 'Live Tracking', desc: isDelivered ? 'Order received' : 'Monitor delivery status' }
          ].map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === 3;
            const isCompleted = stepNum < 3 || isDelivered;
            return (
              <div key={idx} className="flex-1 w-full flex items-center gap-4 relative">
                <div className="relative flex items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : isActive 
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/20 animate-pulse-glow' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle size={18} /> : stepNum}
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute left-12 w-24 lg:w-44 h-[2px] bg-slate-100">
                      <div className={`h-full bg-emerald-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
                <div>
                  <p className={`font-semibold text-sm font-headings transition-colors ${isActive ? 'text-emerald-800 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-headings">
              {isDelivered ? 'Delivery Completed' : 'Track Order'}
            </h1>
            {isDelivered && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-300 font-mono">
                Delivered
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Order ID: #{order.id.slice(-10).toUpperCase()}
          </p>
        </div>
        {/* Status badge */}
        {isDelivered ? (
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 self-start sm:self-auto shadow-md font-mono">
            <CheckCircle size={15} />
            Order Delivered Successfully
          </div>
        ) : (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 self-start sm:self-auto font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Live Tracking Active
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Timeline & Order Metadata */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Status Timeline */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 font-headings">Delivery Progress</h2>
                <p className="text-xs text-slate-450">
                  {isDelivered ? 'All delivery stages completed' : 'Updates automatically in real-time'}
                </p>
              </div>
            </div>
            <div className="pl-1">
              {STATUS_STEPS.map((step, idx) => (
                <TimelineStep
                  key={step.key}
                  step={step}
                  isActive={idx === currentStepIdx}
                  isCompleted={idx < currentStepIdx || (isDelivered && idx === STATUS_STEPS.length - 1)}
                  isLast={idx === STATUS_STEPS.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
            <h2 className="font-bold text-slate-800 font-headings flex items-center gap-2">
              <Package size={16} className="text-emerald-600" />
              Order Metadata
            </h2>
            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-center justify-between py-2 border-b border-slate-100/50">
                <span className="text-slate-400">Placed On</span>
                <span className="text-slate-700 font-bold">
                  {new Date(order.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100/50">
                <span className="text-slate-400">Payment Option</span>
                <span className="text-slate-700 font-bold uppercase tracking-wider">{order.paymentMethod || 'COD'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100/50">
                <span className="text-slate-400">Store / Vendor</span>
                <span className="text-slate-700 font-bold truncate max-w-[180px]">{vendorName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-slate-100/50 gap-2">
                <span className="text-slate-400">Vendor Contact Phone</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-700 font-mono font-bold">{order.vendorPhone || order.items?.[0]?.vendorPhone || '+91 98765 43210'}</span>
                  <a
                    href={`tel:${order.vendorPhone || order.items?.[0]?.vendorPhone || '+919876543210'}`}
                    className="p-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer font-headings"
                    title="Call Vendor"
                  >
                    <Phone size={10} /> Call
                  </a>
                  <a
                    href={`https://wa.me/${(order.vendorPhone || order.items?.[0]?.vendorPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer font-headings"
                    title="WhatsApp Vendor"
                  >
                    <MessageCircle size={10} />
                  </a>
                </div>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-slate-400 flex-shrink-0">Shipping Destination</span>
                <span className="text-slate-600 font-semibold text-right max-w-[200px] leading-relaxed italic">
                  {order.address}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between mt-4">
              <span className="font-bold text-emerald-800 text-sm font-headings">Total Cost Amount</span>
              <span className="text-2xl font-black text-emerald-800 font-sans">₹{parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Items (Only rendered in left column when order is STILL IN TRANSIT) */}
          {!isDelivered && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
              <h2 className="font-bold text-slate-800 font-headings flex items-center gap-2 mb-4">
                <ShoppingBag size={16} className="text-emerald-600" />
                Ordered Items ({order.items?.length || 0})
              </h2>
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-white/40 border border-slate-100 rounded-2xl p-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate font-headings">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Merchant: {item.vendor}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-850 px-2 py-0.5 rounded border border-emerald-100/30 font-sans">Qty: {item.quantity}</span>
                        <span className="text-xs font-bold text-slate-650">₹{item.price}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-slate-800 text-sm font-sans">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Delivery Completed View OR Live Map View */}
        <div className="lg:col-span-7 space-y-6">
          {isDelivered ? (
            <>
              {/* Delivery Completed Celebration Card */}
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-white/20 font-mono tracking-wider">
                      Verified Delivery
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black font-headings text-white mt-1 leading-tight">
                      Order Delivered Successfully!
                    </h2>
                    <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
                      Your 100% fresh organic harvest has been delivered to your shipping address.
                    </p>
                  </div>
                </div>

                {order.deliveryBoyName && (
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider font-headings">Delivered By Partner</p>
                        <p className="font-extrabold text-white text-sm mt-0.5 font-headings">{order.deliveryBoyName}</p>
                      </div>
                    </div>
                    <span className="bg-white text-emerald-800 text-xs font-black px-3 py-1 rounded-xl shadow-xs font-mono">
                      Completed
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/marketplace')}
                    className="flex-1 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer font-headings flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag size={15} /> Buy Organic Produce Again
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex-1 bg-emerald-900/60 hover:bg-emerald-950 text-white font-extrabold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider border border-white/20 transition-all active:scale-95 cursor-pointer font-headings flex items-center justify-center gap-1.5"
                  >
                    <Package size={15} /> View All Orders
                  </button>
                </div>
              </div>

              {/* Prominent High-Visibility Ordered Items Card (Placed Right at top when delivered) */}
              <div className="bg-white/80 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] text-left">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-lg text-slate-800 font-headings flex items-center gap-2">
                    <ShoppingBag size={20} className="text-emerald-600" />
                    Ordered Items Summary ({order.items?.length || 0})
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200/60 font-mono">
                    Total: ₹{parseFloat(order.total).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/60 rounded-2xl p-4 transition-all duration-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="flex-grow min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate font-headings">{item.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Merchant: <strong className="text-slate-700">{item.vendor}</strong></p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-extrabold bg-emerald-100/80 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 font-sans">
                            Qty: {item.quantity} × ₹{item.price}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-slate-900 text-base font-sans">₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Live Map View (Only shown when order is still in transit) */
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 font-headings">Live Delivery Route Map</h2>
                  <p className="text-xs text-slate-450">Estimated real-time travel progress</p>
                </div>
              </div>

              {/* Location lookup spinner */}
              {locationLoading && (
                <div className="flex items-center gap-2 mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-455 animate-pulse">
                  <div className="w-3 h-3 rounded-full border-2 border-emerald-550 border-t-transparent animate-spin" />
                  Looking up vendor coordinates on Nominatim...
                </div>
              )}

              <div className="rounded-2xl border border-slate-150 overflow-hidden shadow-inner relative">
                <OrderTrackingMap
                  vendorLocation={resolvedVendorLocation}
                  vendorName={vendorName}
                  deliveryAddress={order.address}
                  deliveryBoyLocation={order.deliveryBoyLocation}
                  deliveryBoyName={order.deliveryBoyName}
                />
              </div>

              {/* Developer Location Simulation Panel */}
              {order.status === 'dispatched' && (
                <div className="mt-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-indigo-100 flex items-center justify-center">
                      <Navigation size={14} className="text-indigo-650" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950 font-headings">Simulation Testing Panel</p>
                      <p className="text-[10px] text-slate-450">Test moving rider marker live on this device</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateMovement}
                    className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto text-white ${
                      simulating ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-900/10' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/10'
                    }`}
                  >
                    <RefreshCw size={12} className={simulating ? 'animate-spin' : ''} />
                    {simulating ? 'Stop Simulation' : 'Start Simulation'}
                  </button>
                </div>
              )}

              {/* Assigned Driver Details Card */}
              {order.deliveryBoyName && (
                <div className="mt-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-headings">Assigned Rider</p>
                      <p className="font-extrabold text-slate-805 text-sm mt-0.5 font-headings">{order.deliveryBoyName}</p>
                      <p className="text-xs text-slate-500 font-mono font-bold">{order.deliveryBoyPhone || '+91 98765 43210'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${order.deliveryBoyPhone || '+919876543210'}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer font-headings shadow-2xs"
                    >
                      <Phone size={12} /> Call Rider
                    </a>
                    <a
                      href={`https://wa.me/${(order.deliveryBoyPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer font-headings shadow-2xs"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>
              )}

              {/* Notice: vendor hasn't set location */}
              {!resolvedVendorLocation && !locationLoading && (
                <div className="mt-4 bg-amber-50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800 font-headings">Shop coordinates not set</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      The vendor has not marked their shop location. Real-time path distance metrics will activate once the store location details are registered by the shop.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Refresh tip */}
          {!isDelivered && (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
              <span>Updates automatically as shop updates delivery stages.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
