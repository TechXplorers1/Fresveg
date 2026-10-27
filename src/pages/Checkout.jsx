import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, MapPin, Package, Banknote, CreditCard,
  Check, ShieldCheck, Zap, AlertTriangle, Loader, ChevronRight, Store, Phone, MessageCircle,
  Landmark, Copy, CheckCheck, QrCode, ArrowRight, ExternalLink, Info, Building2, Smartphone
} from 'lucide-react';
import { api } from '../services/api';

// ─── PhonePe Config ─────────────────────────────────────────────────────────
const PHONEPE_METHODS = [
  { label: 'PhonePe App', color: '#5f259f', abbr: 'पे' },
  { label: 'UPI QR Code',  color: '#16a34a', abbr: 'QR' },
  { label: 'GPay · Paytm', color: '#2563eb', abbr: 'UPI' },
  { label: 'Cards & NB',   color: '#d97706', abbr: 'CARD' },
];

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

  const [selectedPayment, setSelectedPayment] = React.useState('Paystack (Card, Transfer & USSD)');
  const [isProcessing,    setIsProcessing]    = React.useState(false);
  const [rzpLoading,      setRzpLoading]      = React.useState(false);
  const [rzpError,        setRzpError]        = React.useState('');
  const [phonePeLoading,  setPhonePeLoading]  = React.useState(false);
  const [phonePeError,    setPhonePeError]    = React.useState('');

  // ── Vendor Direct Bank Transfer State ─────────────────────────────────────────
  const [vendorBankDetails, setVendorBankDetails] = React.useState(null);
  const [loadingBankDetails, setLoadingBankDetails] = React.useState(false);
  const [utrNumber, setUtrNumber] = React.useState('');
  const [paymentNote, setPaymentNote] = React.useState('');
  const [copiedBankField, setCopiedBankField] = React.useState(null);

  const handleCopyBankField = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldName);
    setTimeout(() => setCopiedBankField(null), 2500);
  };

  // Fetch primary vendor's bank details for items in cart
  React.useEffect(() => {
    if (cartItems.length > 0) {
      const firstItem = cartItems[0];
      const vId = firstItem.vendorId || firstItem.vendor_id || null;
      const sName = firstItem.shopName || firstItem.farmName || firstItem.shop || firstItem.vendor || '';
      const vEmail = firstItem.vendorEmail || firstItem.vendor_email || '';

      setLoadingBankDetails(true);
      api.getVendorBankDetails({ vendorId: vId, shopName: sName, vendorEmail: vEmail })
        .then(res => {
          if (res && res.bankDetails) {
            setVendorBankDetails({
              ...res.bankDetails,
              vendorName: res.vendorName || firstItem.vendor || 'Verified Vendor',
              shopName: res.shopName || sName || 'Organic Store'
            });
          }
        })
        .catch(err => console.warn('Could not load vendor bank details:', err))
        .finally(() => setLoadingBankDetails(false));
    }
  }, [cartItems]);

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
      id:   'phonepe',
      name: 'PhonePe UPI & Online',
      icon: Smartphone,
      desc: 'Cards & Transfer, QR scan, Cards & Net Banking via PhonePe Gateway',
      badge: 'Fast & Secure',
      isPhonePe: true
    },
    {
      id:   'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      desc: 'Pay cash when your order arrives',
      badge: 'COD'
    },
    {
      id:   'vendor_bank',
      name: 'Direct Vendor Bank / UPI',
      icon: Landmark,
      desc: 'Transfer directly to Vendor Bank Account or scan UPI QR Code',
      badge: 'Zero Gateway Fees'
    },
    {
      id:   'razorpay',
      name: 'Pay Online (Razorpay)',
      icon: CreditCard,
      desc: 'Cards · Net Banking · Wallets via Razorpay',
      badge: 'Alternative Gateway'
    },
  ];

  // ── Handle PhonePe Payment ─────────────────────────────────────────────────
  const handlePhonePePayment = async () => {
    if (!address) {
      alert('Please select a delivery address in the cart first.');
      navigate('/cart');
      return;
    }
    if (cartItems.length === 0) { navigate('/'); return; }

    setPhonePeError('');
    setPhonePeLoading(true);

    try {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const firstItem = cartItems[0] || {};
      const customerPhone = userProfile?.phone || userProfile?.phoneNumber || user?.phoneNumber || '+234 802 345 6789';
      const vendorPhone = firstItem.vendorPhone || firstItem.phone || '+234 802 345 6789';

      const payload = {
        orderType: 'order',
        orderId,
        customerId: user?.uid || user?.id || 'guest',
        customerName: userProfile?.displayName || user?.displayName || 'Customer',
        customerEmail: user?.email || '',
        customerPhone,
        vendorPhone,
        items: cartItems,
        total: getTotal(),
        address
      };

      const res = await api.initiatePhonePePayment(payload);

      if (res && res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        throw new Error(res?.message || 'Could not initiate PhonePe payment.');
      }
    } catch (err) {
      console.error('PhonePe initiation error:', err);
      setPhonePeError(err.message || 'Failed to connect to PhonePe gateway. Please try again.');
      setPhonePeLoading(false);
    }
  };


  // ── Handle Vendor Direct Bank Transfer ─────────────────────────────────────
  const handleVendorBankPayment = async () => {
    if (!address) {
      alert('Please select a delivery address in the cart first.');
      navigate('/cart');
      return;
    }
    if (cartItems.length === 0) { navigate('/'); return; }

    if (!utrNumber.trim()) {
      alert('Please enter your Bank Transfer UTR / UPI Transaction Reference Number so the vendor can verify your payment.');
      return;
    }

    try {
      setIsProcessing(true);
      const paymentDetails = {
        paymentType: 'vendor_bank_transfer',
        utrNumber: utrNumber.trim(),
        vendorBank: vendorBankDetails ? {
          bankName: vendorBankDetails.bankName,
          accountHolderName: vendorBankDetails.accountHolderName,
          accountNumber: vendorBankDetails.accountNumber,
          ifscCode: vendorBankDetails.ifscCode,
          upiId: vendorBankDetails.upiId
        } : null,
        note: paymentNote.trim(),
        paidAt: new Date().toISOString()
      };

      const orderId = await placeOrder('Vendor Bank Transfer', paymentDetails, 'pending_verification');
      if (orderId) {
        navigate(`/order/${orderId}`);
      } else {
        throw new Error('Empty order ID returned');
      }
    } catch (err) {
      console.error('Vendor Bank order failed:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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

    // Amount in kobo (1 NGN = 100 kobo)
    const amountPaise = Math.round(getTotal() * 100);

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      amountPaise,
      currency: 'NGN',
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
    } else if (selectedPayment === 'Direct Vendor Bank Transfer') {
      handleVendorBankPayment();
    } else if (selectedPayment === 'Paystack (Card, Transfer & USSD)') {
      handlePhonePePayment();
    } else {
      handleRazorpayPayment();
    }
  };

  const isVendorBank = selectedPayment === 'Direct Vendor Bank Transfer';
  const isRazorpay = selectedPayment === 'Flutterwave (Alternative Online)' || selectedPayment === 'Pay Online';
  const isPhonePe = selectedPayment === 'Paystack (Card, Transfer & USSD)';
  const canConfirm = cartItems.length > 0 && address && !isProcessing && !rzpLoading && !phonePeLoading && (!isVendorBank || utrNumber.trim().length >= 4);


  // Extract unique vendor / shop details from items in cart
  const vendorInfoList = React.useMemo(() => {
    const vendorMap = new Map();
    cartItems.forEach(item => {
      const vName = item.vendorName || item.vendor || item.ownerName || 'Verified Vendor';
      const sName = item.shopName || item.farmName || item.storeName || item.vendorName || 'FresVeg Organic Partner Store';
      const loc = item.location || item.shopLocation || item.farmLocation || item.address || '';
      const phone = item.vendorPhone || item.phone || item.mobile || '+234 802 345 6789';
      const vendorId = item.vendorId || item.vendor_id || null;
      const key = `${sName}-${vName}`;
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { vendorName: vName, shopName: sName, location: loc, phone: phone, vendorId });
      }
    });
    return Array.from(vendorMap.values());
  }, [cartItems]);

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

          {/* Vendor & Shop Information Card */}
          {vendorInfoList.length > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 mb-6 text-left space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 font-headings">
                  <Store size={14} className="text-emerald-600" /> Vendor & Shop Details
                </span>
                <span className="bg-emerald-600 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md font-mono shadow-2xs">
                  Verified Seller
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                {vendorInfoList.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/80 p-3 rounded-xl border border-emerald-100/60 shadow-2xs">
                    <div>
                      <span className="font-extrabold text-slate-800 text-sm font-headings block">{v.shopName}</span>
                      <span className="text-[11px] text-slate-500 font-medium">Owner / Vendor: <strong className="text-slate-700">{v.vendorName}</strong></span>
                      {v.location && (
                        <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                          <MapPin size={11} className="text-emerald-600 shrink-0" /> {v.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <a
                        href={`tel:${v.phone || '+2348023456789'}`}
                        className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer font-headings"
                        title="Call Vendor"
                      >
                        <Phone size={11} /> {v.phone || '+234 802 345 6789'}
                      </a>
                      <a
                        href={`https://wa.me/${(v.phone || '919876543210').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all text-[11px] flex items-center gap-1 cursor-pointer font-headings"
                        title="WhatsApp Vendor"
                      >
                        <MessageCircle size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl hover:bg-white/80 transition-all duration-300">
                <img src={item.image} alt={item.name}
                  className="w-16 h-16 object-cover rounded-xl border border-slate-100/50 flex-shrink-0"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-base text-slate-800 font-headings truncate">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × ₦{item.price}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Store size={11} /> {item.shopName || item.farmName || item.vendorName || 'Organic Shop'}
                    </span>
                    {(item.location || item.address) && (
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <MapPin size={10} className="text-emerald-600" /> {item.location || item.address}
                      </span>
                    )}
                  </div>
                </div>
                <p className="font-extrabold text-slate-800 text-base flex-shrink-0 font-sans">
                  ₦{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Subtotal & Total */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Subtotal</span>
              <span>₦{getTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Delivery Fee</span>
              <span className="text-emerald-600 font-semibold uppercase tracking-wider">FREE</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 mt-4">
              <span className="text-slate-700 font-bold text-sm">Total Amount Payable</span>
              <span className="text-2xl font-black text-emerald-800 font-sans">₦{getTotal().toFixed(2)}</span>
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
                      onClick={() => { setSelectedPayment(method.name); setRzpError(''); setPhonePeError(''); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left cursor-pointer ${
                        isSelected
                          ? method.id === 'phonepe'
                            ? 'border-[#5f259f] bg-purple-50/40 animate-payment-heartbeat shadow-lg shadow-purple-900/10'
                            : 'border-emerald-500 bg-emerald-50/40 animate-payment-heartbeat shadow-lg shadow-emerald-500/10'
                          : method.id === 'phonepe'
                          ? 'border-purple-200/80 hover:border-[#5f259f] hover:animate-payment-heartbeat bg-white/40 hover:bg-purple-50/20'
                          : 'border-slate-200 hover:border-emerald-400 hover:animate-payment-heartbeat bg-white/40 hover:bg-white/80'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        isSelected
                          ? method.id === 'phonepe'
                            ? 'bg-[#5f259f] text-white animate-pulse'
                            : 'bg-emerald-600 text-white animate-pulse'
                          : method.id === 'phonepe'
                          ? 'bg-purple-50 text-[#5f259f]'
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {method.id === 'phonepe' ? (
                          <span className="font-black text-sm flex items-center justify-center w-5 h-5 leading-none">पे</span>
                        ) : (
                          <method.icon size={20} />
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold font-headings text-sm ${
                            isSelected
                              ? method.id === 'phonepe'
                                ? 'text-[#5f259f]'
                                : 'text-emerald-800'
                              : 'text-slate-800'
                          }`}>
                            {method.name}
                          </p>
                          {isSelected && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black font-headings uppercase tracking-widest animate-pulse ${
                              method.id === 'phonepe'
                                ? 'bg-purple-100 text-[#5f259f] border border-purple-300/60'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                            }`}>
                              Active Method
                            </span>
                          )}
                          {method.id === 'phonepe' && !isSelected && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-[#5f259f] border border-purple-200">
                              Cards & Transfer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{method.desc}</p>
                      </div>
                      {isSelected ? (
                        <div className={`text-white p-1 rounded-full relative flex items-center justify-center ${
                          method.id === 'phonepe' ? 'bg-[#5f259f]' : 'bg-emerald-500'
                        }`}>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            method.id === 'phonepe' ? 'bg-purple-400' : 'bg-emerald-400'
                          }`}></span>
                          <Check size={12} strokeWidth={3} className="relative z-10" />
                        </div>
                      ) : (
                        <ChevronRight size={14} className="text-slate-300" />
                      )}
                    </button>


                    {/* Vendor Direct Bank Transfer Expanded Panel */}
                    {method.id === 'vendor_bank' && isSelected && (
                      <div className="mt-3 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-slate-50 p-4 sm:p-5 space-y-4 shadow-sm text-left animate-fade-in">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <Landmark size={16} />
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-800 font-headings block">
                                {vendorBankDetails?.bankName || 'Vendor Bank Account'}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                Beneficiary: {vendorBankDetails?.accountHolderName || vendorInfoList[0]?.vendorName || 'Verified Vendor'}
                              </span>
                            </div>
                          </div>
                          <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full font-mono tracking-wider shadow-2xs">
                            Direct Settlement
                          </span>
                        </div>

                        {/* Bank Details Table */}
                        <div className="bg-white/95 p-3.5 rounded-2xl border border-emerald-100 space-y-2.5 text-xs shadow-2xs">
                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Bank Name</span>
                            <span className="font-bold text-slate-800">{vendorBankDetails?.bankName || 'Access Bank'}</span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Account Holder</span>
                            <span className="font-bold text-slate-800">{vendorBankDetails?.accountHolderName || vendorInfoList[0]?.vendorName || 'Vendor'}</span>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Account Number</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-emerald-800 text-sm tracking-wider">
                                {vendorBankDetails?.accountNumber || '0128945678'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBankField(vendorBankDetails?.accountNumber || '0128945678', 'acc')}
                                className="p-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer font-headings"
                                title="Copy Account Number"
                              >
                                {copiedBankField === 'acc' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                {copiedBankField === 'acc' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-400 font-medium">Bank Sort Code</span>
                            <div className="flex items-center gap-2 font-mono">
                              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                                {vendorBankDetails?.ifscCode || '044 (Access Bank)'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyBankField(vendorBankDetails?.ifscCode || '044 (Access Bank)', 'ifsc')}
                                className="p-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer font-headings"
                                title="Copy Bank Sort Code"
                              >
                                {copiedBankField === 'ifsc' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                {copiedBankField === 'ifsc' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-1">
                            <span className="text-slate-400 font-medium">Account Type & Branch</span>
                            <span className="font-medium text-slate-600 text-[11px]">
                              {vendorBankDetails?.accountType || 'Current'} Account {vendorBankDetails?.branchName ? `· ${vendorBankDetails.branchName}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* UPI Instant QR Code Box */}
                        <div className="bg-white/95 p-3.5 rounded-2xl border border-emerald-100 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-emerald-900 font-headings flex items-center gap-1.5">
                              <QrCode size={14} className="text-emerald-600" /> Direct Transfer / Scan to Pay
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">OPay · PalmPay · Kuda · All Nigerian Banks</span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                            <div className="bg-white p-1.5 rounded-xl border border-emerald-200/80 shadow-2xs flex-shrink-0">
                              <img
                                src={
                                  vendorBankDetails?.qrCodeUrl ||
                                  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                    `upi://pay?pa=${vendorBankDetails?.upiId || 'greenearth@accessbank'}&pn=${encodeURIComponent(vendorBankDetails?.accountHolderName || 'Vendor')}&am=${getTotal().toFixed(2)}&cu=NGN&tn=${encodeURIComponent('FresVeg Order')}`
                                  )}`
                                }
                                alt="Vendor UPI QR"
                                className="w-20 h-20 object-contain"
                              />
                            </div>

                            <div className="min-w-0 flex-grow text-center sm:text-left space-y-1.5">
                              <span className="text-[10px] text-slate-400 block font-medium">Vendor Bank Reference / Paystack Tag</span>
                              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                  {vendorBankDetails?.upiId || 'greenearth@accessbank'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyBankField(vendorBankDetails?.upiId || 'greenearth@accessbank', 'upi')}
                                  className="p-1 px-2 rounded-lg bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-800 font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer font-headings"
                                >
                                  {copiedBankField === 'upi' ? <Check size={10} /> : <Copy size={10} />}
                                  {copiedBankField === 'upi' ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 font-body">
                                Total to transfer: <strong className="text-emerald-800 font-sans">₦{getTotal().toFixed(2)}</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Vendor Instructions */}
                        {vendorBankDetails?.paymentInstructions && (
                          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                            <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed font-body">
                              <strong className="font-headings">Vendor Note:</strong> {vendorBankDetails.paymentInstructions}
                            </p>
                          </div>
                        )}

                        {/* Customer Payment Reference / UTR Input */}
                        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 space-y-2 shadow-2xs">
                          <label className="text-[11px] font-black uppercase text-slate-800 font-headings block">
                            Enter Bank Transfer Reference / NIP Session ID <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase tracking-wider outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:normal-case font-headings"
                            placeholder="e.g. 100004241024123456 or Transfer Ref"
                          />
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Enter NIP Session ID or reference from your bank app / USSD receipt</span>
                            {utrNumber.trim().length >= 4 && (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCheck size={12} /> Reference entered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PhonePe Expanded Panel */}
                    {method.id === 'phonepe' && isSelected && (
                      <div className="mt-3 rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/50 via-indigo-50/20 to-slate-50 p-4 space-y-4 shadow-inner text-left animate-fade-in">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold text-purple-900 uppercase tracking-widest font-headings flex items-center gap-1.5">
                              <Zap size={12} className="text-amber-500 fill-amber-500" />
                              Paystack Instant Payment Channels
                            </p>
                            <span className="bg-purple-100 text-[#5f259f] text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                              0% Surcharge
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {PHONEPE_METHODS.map((m) => (
                              <div
                                key={m.label}
                                className="flex flex-col items-center gap-1.5 bg-white/90 backdrop-blur-md border border-purple-100/80 rounded-xl p-2.5 shadow-xs"
                              >
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-black shadow-xs"
                                  style={{ backgroundColor: m.color }}
                                >
                                  {m.abbr}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight">
                                  {m.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PhonePe Trust Seal */}
                        <div className="flex items-center gap-2.5 bg-white/90 border border-purple-100 rounded-xl p-3 shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-[#5f259f] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                            पे
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-bold text-slate-800">Paystack Certified Gateway</p>
                            <p className="text-[10px] text-slate-400 leading-tight">Virtual Accounts · Verve / Mastercard · USSD (*737#) · OPay</p>
                          </div>
                          <div className="bg-[#5f259f] text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider">
                            SECURE
                          </div>
                        </div>

                        {/* Amount Preview */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-[#5f259f] to-indigo-800 text-white rounded-xl px-4 py-3 shadow-md shadow-purple-950/20">
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-amber-300 fill-amber-300" />
                            <span className="text-xs font-bold font-headings">Total Payable via Paystack</span>
                          </div>
                          <span className="text-lg font-black font-sans">₦{getTotal().toFixed(2)}</span>
                        </div>

                        {phonePeError && (
                          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3">
                            <AlertTriangle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-600 font-medium leading-relaxed">{phonePeError}</p>
                          </div>
                        )}
                      </div>
                    )}

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
                          <span className="text-lg font-black font-sans">₦{getTotal().toFixed(2)}</span>
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
              className={`w-full py-4 px-4 rounded-2xl font-bold transition-all duration-300 mt-6 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                canConfirm
                  ? isPhonePe
                    ? 'bg-gradient-to-r from-[#5f259f] to-indigo-700 hover:from-[#4e1e82] hover:to-indigo-800 text-white shadow-purple-900/20 hover:shadow-purple-900/30'
                    : isRazorpay
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10 hover:shadow-emerald-900/20'
                    : isVendorBank
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10 hover:shadow-emerald-900/20'
                    : 'bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white shadow-emerald-950/10 hover:shadow-emerald-950/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none'
              }`}
            >
              {isProcessing || rzpLoading || phonePeLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  {phonePeLoading ? 'Connecting to PhonePe Secure Gateway…' : rzpLoading ? 'Loading Secure Gateway…' : 'Processing order…'}
                </>
              ) : isPhonePe ? (
                <>
                  <span className="w-5 h-5 rounded-full bg-white text-[#5f259f] font-black text-xs flex items-center justify-center shadow-xs">पे</span>
                  Pay ₦{getTotal().toFixed(2)} with PhonePe
                </>
              ) : isRazorpay ? (
                <>
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                  Pay ₦{getTotal().toFixed(2)} Securely
                </>
              ) : isVendorBank ? (
                <>
                  <Landmark size={16} />
                  Confirm Order & Submit Bank Transfer (₦{getTotal().toFixed(2)})
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm Order (COD)
                </>
              )}
            </button>

            {isPhonePe && (
              <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-[#5f259f]" />
                Secured by PhonePe 256-bit bank grade encryption. Supports UPI, QR & Cards.
              </p>
            )}

            {isRazorpay && (
              <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                Payments processed via Razorpay secure layers.
              </p>
            )}

            {isVendorBank && (
              <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500" />
                Direct Bank Transfer: Vendor confirms order upon receiving payment in their bank account.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
