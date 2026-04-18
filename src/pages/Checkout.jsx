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
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [selectedPayment, setSelectedPayment] = React.useState('Cash on Delivery');
  const [isProcessing,    setIsProcessing]    = React.useState(false);
  const [rzpLoading,      setRzpLoading]      = React.useState(false);
  const [rzpError,        setRzpError]        = React.useState('');

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto text-green-500" size={64} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Checkout</h1>
          <p className="text-gray-600">Review your order and confirm payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Order Summary ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Package className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>

            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <img src={item.image} alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-bold text-gray-900 flex-shrink-0">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>₹{getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between items-center text-xl font-black pt-2 border-t border-gray-100">
                <span>Total</span>
                <span className="text-green-600">₹{getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="text-green-600" size={22} />
                  <h2 className="text-lg font-semibold">Delivery Address</h2>
                </div>
                <button
                  onClick={() => navigate('/cart')}
                  className="text-xs font-bold text-gray-400 hover:text-green-600 transition-colors uppercase tracking-widest"
                >
                  Change
                </button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                {address ? (
                  <p className="text-gray-900 font-medium leading-relaxed whitespace-pre-line text-sm">{address}</p>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-red-500 font-bold text-sm mb-1">No address selected!</p>
                    <button onClick={() => navigate('/cart')} className="text-green-600 text-sm font-bold hover:underline">
                      Go back to Cart →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5">
                <CreditCard className="text-green-600" size={22} />
                <h2 className="text-lg font-semibold">Payment Method</h2>
              </div>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = selectedPayment === method.name;
                  return (
                    <div key={method.id}>
                      <button
                        onClick={() => { setSelectedPayment(method.name); setRzpError(''); }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group
                          ${isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-100 hover:border-gray-200 bg-gray-50/60'
                          }`}
                      >
                        <div className={`p-3 rounded-xl transition-colors flex-shrink-0
                          ${isSelected ? 'bg-green-600 text-white' : 'bg-white text-gray-400 group-hover:text-green-600'}`}>
                          <method.icon size={22} />
                        </div>
                        <div className="text-left flex-grow">
                          <p className={`font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                            {method.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                        </div>
                        {isSelected
                          ? <div className="bg-green-500 text-white p-1 rounded-full flex-shrink-0">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          : <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                        }
                      </button>

                      {/* ── Razorpay expanded panel ───────────────────────── */}
                      {method.id === 'razorpay' && isSelected && (
                        <div className="mt-3 mx-1 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 space-y-4">

                          {/* Accepted methods */}
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
                              All payment methods accepted
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                              {RAZORPAY_METHODS.map((m) => (
                                <div
                                  key={m.label}
                                  className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm"
                                >
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-black"
                                    style={{ backgroundColor: m.color }}
                                  >
                                    {m.abbr}
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                                    {m.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Razorpay trust badge */}
                          <div className="flex items-center gap-2 bg-white/70 border border-blue-100 rounded-xl px-3 py-2.5">
                            <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-700">Secured by Razorpay</p>
                              <p className="text-[11px] text-gray-400">256-bit SSL · PCI DSS Level 1 certified</p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-wide">
                                RAZORPAY
                              </div>
                            </div>
                          </div>

                          {/* Amount preview */}
                          <div className="flex items-center justify-between bg-green-600 text-white rounded-xl px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Zap size={16} />
                              <span className="text-sm font-bold">Amount to Pay</span>
                            </div>
                            <span className="text-xl font-black">₹{getTotal().toFixed(2)}</span>
                          </div>

                          {/* Error message */}
                          {rzpError && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-red-600 font-medium">{rzpError}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Confirm / Pay Button ─────────────────────────────────── */}
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                className={`w-full py-4 px-4 rounded-2xl font-black transition-all mt-6 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2
                  ${canConfirm
                    ? isRazorpay
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isProcessing || rzpLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    {rzpLoading ? 'Loading Razorpay…' : 'Processing…'}
                  </>
                ) : isRazorpay ? (
                  <>
                    <Zap size={18} />
                    Pay ₹{getTotal().toFixed(2)} with Razorpay
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Order (Cash on Delivery)
                  </>
                )}
              </button>

              {/* Razorpay mode notice */}
              {isRazorpay && (
                <p className="text-center text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck size={11} className="text-green-500" />
                  You'll be redirected to Razorpay's secure payment page
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
