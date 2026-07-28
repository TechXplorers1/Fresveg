import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ref, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import {
  CheckCircle, MapPin, Calendar, Users, Banknote, CreditCard,
  Check, ShieldCheck, Zap, AlertTriangle, Loader, ChevronRight, Tent
} from 'lucide-react';

// ─── Razorpay Config ───────────────────────────────────────────────────────────
const RAZORPAY_KEY_ID = 'rzp_test_SYC9m4DXT1gjeY';

const RAZORPAY_METHODS = [
  { label: 'Cards',       color: '#1a73e8', abbr: 'CARD' },
  { label: 'UPI',         color: '#22c55e', abbr: 'UPI'  },
  { label: 'Net Banking', color: '#f59e0b', abbr: 'NB'   },
  { label: 'Wallets',     color: '#8b5cf6', abbr: 'PAY'  },
];

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

// ─── Farm Booking Confirmation Page ───────────────────────────────────────────
export default function FarmCheckout() {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = React.useState(null);
  const [selectedPayment, setSelectedPayment] = React.useState('Cash on Delivery');
  const [isProcessing,    setIsProcessing]    = React.useState(false);
  const [rzpLoading,      setRzpLoading]      = React.useState(false);
  const [rzpError,        setRzpError]        = React.useState('');
  const [bookingSuccess,  setBookingSuccess]  = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=farm-checkout');
    }
  }, [user, loading, navigate]);

  React.useEffect(() => {
    const raw = sessionStorage.getItem('pendingFarmBooking');
    if (!raw) {
      navigate('/visit-farms');
      return;
    }
    try {
      setBooking(JSON.parse(raw));
    } catch {
      navigate('/visit-farms');
    }
  }, [navigate]);

  if (loading || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const PAYMENT_METHODS = [
    {
      id:   'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      desc: 'Pay cash at the farm on your visit day',
    },
    {
      id:   'razorpay',
      name: 'Pay Online',
      icon: CreditCard,
      desc: 'Cards · UPI · Net Banking · Wallets via Razorpay',
    },
  ];

  const commitBookingToFirebase = async (paymentMethod, paymentId = '') => {
    const bookingsRef = ref(realtimeDb, 'farmBookings');
    const newBookingRef = push(bookingsRef);
    const bookingId = newBookingRef.key;

    const finalBookingData = {
      ...booking,
      bookingId,
      paymentMethod,
      paymentId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    await set(newBookingRef, finalBookingData);
    return bookingId;
  };

  const handleConfirmCOD = async () => {
    try {
      setIsProcessing(true);
      await commitBookingToFirebase('Cash on Visit');
      sessionStorage.removeItem('pendingFarmBooking');
      setBookingSuccess(true);
    } catch (err) {
      console.error('Farm booking failed:', err);
      alert('Failed to confirm booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setRzpError('');
    setRzpLoading(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setRzpError('Could not load Razorpay. Please check your internet connection and try again.');
      setRzpLoading(false);
      return;
    }
    setRzpLoading(false);

    const amountPaise = Math.round(booking.totalAmount * 100);

    const options = {
      key:         RAZORPAY_KEY_ID,
      amount:      amountPaise,
      currency:    'INR',
      name:        'FresVeg',
      description: `Farm Visit — ${booking.farmName} · ${booking.visitorsCount} visitor(s)`,
      prefill: {
        name:    userProfile?.displayName || user?.displayName || '',
        email:   userProfile?.email       || user?.email       || '',
        contact: '',
      },
      notes: {
        farm_name:  booking.farmName,
        visit_date: booking.date,
        visitors:   booking.visitorsCount,
        booked_by:  user?.uid || '',
      },
      theme: { color: '#16a34a' },
      handler: async function (response) {
        try {
          setIsProcessing(true);
          const paymentLabel = `Razorpay | pay_id: ${response.razorpay_payment_id}`;
          await commitBookingToFirebase(paymentLabel, response.razorpay_payment_id);
          sessionStorage.removeItem('pendingFarmBooking');
          setBookingSuccess(true);
        } catch (err) {
          console.error('Booking placement after Razorpay payment failed:', err);
          alert(
            `Payment was successful!\nBut the booking could not be saved.\n\nPlease contact support with:\nPayment ID: ${response.razorpay_payment_id}`
          );
        } finally {
          setIsProcessing(false);
        }
      },
      modal: {
        ondismiss: () => { setRzpError(''); },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      const reason = response?.error?.description || 'Unknown reason';
      setRzpError(`Payment failed: ${reason}. Please try again.`);
    });
    rzp.open();
  };

  const handleConfirm = () => {
    if (selectedPayment === 'Cash on Delivery') {
      handleConfirmCOD();
    } else {
      handleRazorpayPayment();
    }
  };

  const canConfirm = !isProcessing && !rzpLoading;
  const isRazorpay = selectedPayment === 'Pay Online';

  // ── Success Screen ────────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl shadow-2xl shadow-emerald-950/[0.05] p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="text-emerald-500" size={42} />
          </div>
          <h1 className="text-2xl font-black font-headings text-slate-800 mb-2">Booking Confirmed!</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your visit to <span className="font-bold text-emerald-700">{booking.farmName}</span> has been successfully booked.
          </p>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Visit Date</p>
                <p className="font-bold text-slate-700">{booking.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users size={16} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Visitors</p>
                <p className="font-bold text-slate-700">{booking.visitorsCount} person(s)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Location</p>
                <p className="font-bold text-slate-700">{booking.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Zap size={16} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-xs">Total Paid</p>
                <p className="font-bold text-emerald-700 text-base">&#x20B9;{booking.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/visit-farms')}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
            >
              Browse More Farms
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all active:scale-95"
            >
              My Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-10 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          {[
            { label: 'Booking Details', desc: 'Select date & visitors' },
            { label: 'Payment', desc: 'Confirm your booking' },
            { label: 'Confirmation', desc: 'Visit slot secured!' }
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
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/20'
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
                  <p className="text-[11px] text-slate-400 font-normal">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booking Summary */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Tent className="text-emerald-600" size={18} />
            </div>
            <h2 className="text-xl font-bold font-headings text-slate-800">Booking Summary</h2>
          </div>

          {/* Farm Banner */}
          {booking.farmImage && (
            <div className="mb-5 rounded-2xl overflow-hidden h-40 border border-slate-100">
              <img
                src={booking.farmImage}
                alt={booking.farmName}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Booking Detail Card */}
          <div className="p-5 bg-white/40 border border-slate-100 rounded-2xl hover:bg-white/80 transition-all duration-300 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tent className="text-emerald-600" size={22} />
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-bold text-base text-slate-800 font-headings">{booking.farmName}</h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={11} /> {booking.location}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                  <Calendar size={13} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Visit Date</span>
                </div>
                <p className="font-bold text-slate-700 text-sm">{booking.date}</p>
              </div>
              <div className="bg-emerald-50/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                  <Users size={13} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Visitors</span>
                </div>
                <p className="font-bold text-slate-700 text-sm">{booking.visitorsCount} person(s)</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Visit Admission ({booking.visitorsCount || 1} Guests)</span>
              <span className="font-bold text-slate-700">&#x20B9;{(Number(booking.costPerPerson) || 0) * (Number(booking.visitorsCount) || 1)}</span>
            </div>
            {booking.includeStay && Number(booking.accommodationPrice) > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 font-medium">
                <span className="flex items-center gap-1 font-bold">🛖 Overnight Accommodation Stay</span>
                <span className="font-black">+&#x20B9;{booking.accommodationPrice}</span>
              </div>
            )}
          </div>

          {/* Subtotal & Total */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Subtotal</span>
              <span>&#x20B9;{booking.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 font-medium px-1">
              <span>Booking Fee</span>
              <span className="text-emerald-600 font-semibold uppercase tracking-wider">FREE</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50 mt-4">
              <span className="text-slate-700 font-bold text-sm">Total Amount Payable</span>
              <span className="text-2xl font-black text-emerald-800 font-sans">&#x20B9;{booking.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visitor Info & Payment */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visitor Details */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Users className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-lg font-bold font-headings text-slate-800">Visitor Information</h2>
            </div>
            <div className="p-4 bg-white/40 border border-slate-100 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Name</span>
                <span className="font-semibold text-slate-700">
                  {userProfile?.displayName || user?.displayName || 'Visitor'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold text-slate-700 truncate ml-4">
                  {user?.email || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Farm</span>
                <span className="font-semibold text-slate-700">{booking.farmName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Visit Date</span>
                <span className="font-semibold text-slate-700">{booking.date}</span>
              </div>
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

                        {/* Trust Seal */}
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
                          <span className="text-lg font-black font-sans">&#x20B9;{booking.totalAmount.toFixed(2)}</span>
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

            {/* Confirm Button */}
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
                  {rzpLoading ? 'Loading Secure Gateway…' : 'Confirming booking…'}
                </>
              ) : isRazorpay ? (
                <>
                  <Zap size={16} className="text-amber-300 fill-amber-300" />
                  Pay &#x20B9;{booking.totalAmount.toFixed(2)} Securely
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm Booking (Pay at Farm)
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
