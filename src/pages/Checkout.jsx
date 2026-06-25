import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, MapPin, Package, Banknote, CreditCard,
  Check, ShieldCheck, Zap, AlertTriangle, Loader, ChevronRight
} from 'lucide-react';

// ─── Razorpay Config ──────────────────────────────────────────────────────────
// ✅ Key ID is safe to use in frontend code
// 🚫 NEVER put key-secret here — it belongs only on a backend server
const RAZORPAY_KEY_ID = 'rzp_test_SYC9m4DXT1gjeY';

// Supported payment method icons shown in the Razorpay badge row
const RAZORPAY_METHODS = [
  { label: 'Cards',       color: '#1a73e8', abbr: 'CARD' },
  { label: 'UPI',         color: '#22c55e', abbr: 'UPI'  },
  { label: 'Net Banking', color: '#f59e0b', abbr: 'NB'   },
  { label: 'Wallets',     color: '#8b5cf6', abbr: 'PAY'  },
];

// ─── Load Razorpay Checkout.js SDK dynamically ────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Main Checkout Page ────────────────────────────────────────────────────────
export default function Checkout() {
  const { cartItems, address, getTotal, placeOrder } = useCart();
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=checkout');
    }
  }, [user, loading, navigate]);

  const [selectedPayment, setSelectedPayment] = React.useState('Cash on Delivery');
  const [isProcessing,    setIsProcessing]    = React.useState(false);
  const [rzpLoading,      setRzpLoading]      = React.useState(false);
  const [rzpError,        setRzpError]        = React.useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2/10 border-b-brand"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const PAYMENT_METHODS = [
    {
      id:   'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      desc: 'Pay cash when your order arrives',
    },
    {
      id:   'razorpay',
      name: 'Pay Online',
      icon: CreditCard,
      desc: 'Cards · UPI · Net Banking · Wallets via Razorpay',
    },
  ];

  // ── Handle COD ─────────────────────────────────────────────────────────────
  const handleConfirmCOD = async () => {
    if (!address) {
      alert('Please select a delivery address in the cart first.');
      navigate('/cart');
      return;
    }
    if (cartItems.length === 0) { navigate('/'); return; }

    try {
      setIsProcessing(true);
      const orderId = await placeOrder('Cash on Delivery');
      if (orderId) navigate(`/order/${orderId}`);
      else throw new Error('Empty order ID');
    } catch (err) {
      console.error('COD order failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Handle Razorpay Payment ────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    if (!address) {
      alert('Please select a delivery address in the cart first.');
      navigate('/cart');
      return;
    }
    if (cartItems.length === 0) { navigate('/'); return; }

    setRzpError('');
    setRzpLoading(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setRzpError('Could not load Razorpay. Please check your internet connection and try again.');
      setRzpLoading(false);
      return;
    }

    setRzpLoading(false);

    // Amount in paise (1 INR = 100 paise)
    const amountPaise = Math.round(getTotal() * 100);

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      amountPaise,
      currency:    'INR',
      name:        'FresVeg',
      description: `Order — ${cartItems.length} item(s) from FresVeg`,

      // ── Prefill customer details ──────────────────────────────────────────
      prefill: {
        name:    userProfile?.displayName || user?.displayName || '',
        email:   userProfile?.email       || user?.email       || '',
        contact: '',
      },

      notes: {
        delivery_address: address,
        ordered_by:       user?.uid || '',
        items_count:      cartItems.length,
      },

      // ── Branding ──────────────────────────────────────────────────────────
      theme: { color: '#16a34a' },   // FresVeg brand green

      // ── Enable all payment methods ────────────────────────────────────────
      // (Razorpay shows what's available on their end automatically)

      // ── Success handler ───────────────────────────────────────────────────
      handler: async function (response) {
        /**
         * response = {
         *   razorpay_payment_id: "pay_XXXXXXXXXX",
         *   razorpay_order_id:   "order_XXXXXXXXXX",  // if backend order created
         *   razorpay_signature:  "...",               // if backend order created
         * }
         *
         * ⚠️  Full signature verification requires a backend server.
         * For production, verify razorpay_signature on your server before
         * calling placeOrder(). Here we record the payment ID directly.
         */
        try {
          setIsProcessing(true);
          const paymentLabel = `Razorpay | pay_id: ${response.razorpay_payment_id}`;
          const orderId = await placeOrder(paymentLabel);

          if (orderId) {
            navigate(`/order/${orderId}`);
          } else {
            throw new Error('Empty order ID after payment');
          }
        } catch (err) {
          console.error('Order placement after Razorpay payment failed:', err);
          alert(
            `✅ Payment was successful!\n⚠️ But the order could not be saved.\n\nPlease contact support with:\nPayment ID: ${response.razorpay_payment_id}`
          );
        } finally {
          setIsProcessing(false);
        }
      },

      // ── Failure handler ───────────────────────────────────────────────────
      modal: {
        ondismiss: () => {
          console.log('Razorpay checkout closed by user.');
          setRzpError('');
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      const reason = response?.error?.description || 'Unknown reason';
      setRzpError(`Payment failed: ${reason}. Please try again.`);
      console.error('Razorpay payment.failed:', response.error);
    });

    rzp.open();
  };

  // ── Confirm button handler  ────────────────────────────────────────────────
  const handleConfirm = () => {
    if (selectedPayment === 'Cash on Delivery') {
      handleConfirmCOD();
    } else {
      handleRazorpayPayment();
    }
  };

  const canConfirm = cartItems.length > 0 && address && !isProcessing && !rzpLoading;
  const isRazorpay = selectedPayment === 'Pay Online';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-10 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          {[
            { label: 'Shopping Cart', desc: 'Manage items & location' },
            { label: 'Payment', desc: 'Choose checkout method' },
            { label: 'Live Tracking', desc: 'Monitor delivery status' }
          ].map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === 2;
            const isCompleted = stepNum < 2;
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
                    {isCompleted ? <Check size={18} /> : stepNum}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Order Summary */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Package className="text-emerald-600" size={18} />
            </div>
            <h2 className="text-xl font-bold font-headings text-slate-800">Order Summary</h2>
          </div>

          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl hover:bg-white/80 transition-all duration-300">
                <img src={item.image} alt={item.name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100/50 flex-shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-base text-slate-800 font-headings truncate">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × ₹{item.price}</p>
                </div>
                <p className="font-extrabold text-slate-800 text-base flex-shrink-0 font-sans">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Subtotal & Total */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Subtotal</span>
              <span>₹{getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Delivery Fee</span>
              <span className="text-emerald-600 font-semibold uppercase tracking-wider">FREE</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 mt-4">
              <span className="text-slate-700 font-bold text-sm">Total Amount Payable</span>
              <span className="text-2xl font-black text-emerald-800 font-sans">₹{getTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Address and Payment */}
        <div className="lg:col-span-5 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-emerald-600" size={18} />
                </div>
                <h2 className="text-lg font-bold font-headings text-slate-800">Delivery Address</h2>
              </div>
              <button
                onClick={() => navigate('/cart')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-wider"
              >
                Change
              </button>
            </div>
            <div className="p-4 bg-white/40 border border-slate-100 rounded-2xl">
              {address ? (
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line text-sm">{address}</p>
              ) : (
                <div className="text-center py-3">
                  <p className="text-rose-500 font-bold text-sm mb-2">No address selected!</p>
                  <button onClick={() => navigate('/cart')} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                    Go back to Cart & Choose Address
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CreditCard className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold font-headings text-slate-800">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedPayment === method.name;
                return (
                  <div key={method.id}>
                    <button
                      onClick={() => { setSelectedPayment(method.name); setRzpError(''); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/[0.02] shadow-md shadow-emerald-950/[0.01]'
                          : 'border-slate-100 hover:border-slate-200 bg-white/40 hover:bg-white/80'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <method.icon size={20} />
                      </div>
                      <div className="flex-grow">
                        <p className={`font-bold font-headings text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                          {method.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{method.desc}</p>
                      </div>
                      {isSelected ? (
                        <div className="bg-emerald-500 text-white p-1 rounded-full">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      ) : (
                        <ChevronRight size={14} className="text-slate-300" />
                      )}
                    </button>

                    {/* Razorpay Expanded Panel */}
                    {method.id === 'razorpay' && isSelected && (
                      <div className="mt-3 rounded-2xl border border-emerald-100/50 bg-gradient-to-br from-emerald-50/20 to-teal-50/20 p-4 space-y-4 shadow-inner">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                            All methods accepted
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {RAZORPAY_METHODS.map((m) => (
                              <div
                                key={m.label}
                                className="flex flex-col items-center gap-1.5 bg-white/70 backdrop-blur-md border border-slate-100 rounded-xl p-2.5 shadow-sm"
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black"
                                  style={{ backgroundColor: m.color }}
                                >
                                  {m.abbr}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight">
                                  {m.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Razorpay Trust Seal */}
                        <div className="flex items-center gap-2 bg-white/80 border border-slate-100 rounded-xl p-3">
                          <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-bold text-slate-800">Secured by Razorpay</p>
                            <p className="text-[10px] text-slate-400 leading-tight">256-bit SSL · PCI DSS Level 1 Certified</p>
                          </div>
                          <div className="bg-emerald-800 text-white text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider">
                            SECURE
                          </div>
                        </div>

                        {/* Amount Preview */}
                        <div className="flex items-center justify-between bg-emerald-800 text-white rounded-xl px-4 py-3 shadow-md shadow-emerald-950/20">
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-xs font-bold font-headings">Total to Pay Online</span>
                          </div>
                          <span className="text-lg font-black font-sans">₹{getTotal().toFixed(2)}</span>
                        </div>

                        {rzpError && (
                          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
                            <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-600 font-medium leading-relaxed">{rzpError}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirm / Pay Button */}
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`w-full py-4 px-4 rounded-2xl font-bold transition-all duration-300 mt-6 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                canConfirm
                  ? isRazorpay
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10 hover:shadow-emerald-900/20'
                    : 'bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-emerald-950/10 hover:shadow-emerald-950/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none'
              }`}
            >
              {isProcessing || rzpLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  {rzpLoading ? 'Loading Secure Gateway…' : 'Processing order…'}
                </>
              ) : isRazorpay ? (
                <>
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                  Pay ₹{getTotal().toFixed(2)} Securely
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm Order (COD)
                </>
              )}
            </button>

            {isRazorpay && (
              <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                Payments processed via Razorpay secure layers.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
