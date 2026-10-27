import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, ArrowRight, ShoppingBag,
  Package, ShieldCheck, RefreshCw, Home, AlertTriangle, Calendar
} from 'lucide-react';
import { api } from '../services/api';

export default function PhonePeStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialStatus = searchParams.get('status') || 'PENDING';
  const orderId = searchParams.get('orderId') || '';
  const txnId = searchParams.get('txnId') || '';
  const orderType = searchParams.get('type') || 'order';
  const failureReason = searchParams.get('reason') || searchParams.get('message') || 'Transaction could not be completed';

  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(initialStatus === 'PENDING');
  const [pollCount, setPollCount] = useState(0);

  // Poll status if initially pending
  useEffect(() => {
    let timer;
    if (paymentStatus === 'PENDING' && txnId && pollCount < 5) {
      timer = setTimeout(async () => {
        try {
          const res = await api.getPhonePePaymentStatus(txnId);
          if (res.isPaid || res.status === 'SUCCESS' || res.record?.paymentStatus === 'paid') {
            setPaymentStatus('SUCCESS');
            setOrderDetails(res.record);
            setLoading(false);
          } else if (res.phonepe?.code === 'PAYMENT_ERROR') {
            setPaymentStatus('FAILED');
            setLoading(false);
          } else {
            setPollCount(prev => prev + 1);
          }
        } catch (e) {
          console.warn('Status poll error:', e);
          setPollCount(prev => prev + 1);
        }
      }, 2500);
    } else if (pollCount >= 5 && paymentStatus === 'PENDING') {
      setLoading(false);
    }
    return () => clearTimeout(timer);
  }, [paymentStatus, txnId, pollCount]);

  // Fetch final order/booking details if success
  useEffect(() => {
    if (paymentStatus === 'SUCCESS' && orderId) {
      if (orderType === 'farm_booking') {
        api.getFarmBookings().then(bookings => {
          const match = bookings.find(b => b.id === orderId);
          if (match) setOrderDetails(match);
        }).catch(() => {});
      } else {
        api.getOrderById(orderId).then(ord => {
          if (ord) setOrderDetails(ord);
        }).catch(() => {});
      }
    }
  }, [paymentStatus, orderId, orderType]);

  const isSuccess = paymentStatus === 'SUCCESS';
  const isFailed = paymentStatus === 'FAILED';
  const isPending = paymentStatus === 'PENDING';

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex items-center justify-center font-sans">
      <div className="w-full bg-white/85 backdrop-blur-md border border-white/80 p-8 sm:p-10 rounded-3xl shadow-2xl text-center relative overflow-hidden">
        
        {/* Subtle Decorative Gradient background */}
        <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-40 ${
          isSuccess ? 'bg-purple-400' : isFailed ? 'bg-rose-400' : 'bg-amber-400'
        }`} />

        {/* ── SUCCESS STATE ── */}
        {isSuccess && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            {/* Paystack Seal Badge */}
            <div className="inline-flex items-center gap-2 bg-sky-50 text-[#0aa5db] border border-sky-200/80 px-4 py-1.5 rounded-full text-xs font-bold font-headings shadow-xs">
              <span className="w-5 h-5 rounded-full bg-[#0aa5db] text-white flex items-center justify-center text-[10px] font-black">
                P
              </span>
              <span>Paid with Paystack Gateway</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Checkmark Icon */}
            <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 text-emerald-600">
              <CheckCircle size={44} className="stroke-[2.5]" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-headings tracking-tight">
                {orderType === 'farm_booking' ? '🌿 Farm Booking Confirmed!' : '📦 Payment Successful!'}
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                {orderType === 'farm_booking'
                  ? 'Your visit reservation has been received and confirmed by the farm host.'
                  : 'Your fresh harvest order has been received and will be packaged right away.'}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 text-left text-xs font-medium space-y-3 shadow-inner">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">FresVeg {orderType === 'farm_booking' ? 'Booking' : 'Order'} ID:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{orderId}</span>
              </div>
              {txnId && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Paystack Transaction Ref:</span>
                  <span className="font-mono font-bold text-[#0aa5db] text-xs truncate max-w-[220px]">{txnId}</span>
                </div>
              )}
              {orderDetails?.total && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-slate-800 text-sm font-sans">
                    ₦{parseFloat(orderDetails.total).toFixed(2)}
                  </span>
                </div>
              )}
              {orderDetails?.totalAmount && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-slate-800 text-sm font-sans">
                    ₦{parseFloat(orderDetails.totalAmount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Payment Status:</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] font-mono">
                  ✓ VERIFIED & PAID
                </span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {orderType === 'farm_booking' ? (
                <button
                  type="button"
                  onClick={() => navigate('/visit-farms')}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-headings"
                >
                  <Calendar size={16} /> View My Bookings
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/order/${orderId}`)}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-headings"
                >
                  <Package size={16} /> Track Live Delivery
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/marketplace')}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-headings shadow-xs"
              >
                <ShoppingBag size={16} className="text-emerald-600" /> Continue Shopping
              </button>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1 mt-2">
              <ShieldCheck size={13} className="text-emerald-500" />
              Automated invoice and notification dispatched to your registered account.
            </p>
          </div>
        )}

        {/* ── FAILED STATE ── */}
        {isFailed && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10 text-rose-600">
              <XCircle size={44} className="stroke-[2.5]" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-headings tracking-tight">
                Payment Not Completed
              </h1>
              <p className="text-rose-600 text-sm mt-1 max-w-md mx-auto font-medium">
                {failureReason}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                No money was deducted from your account. If amount was debited, it will be refunded automatically by your bank within 24-48 hours.
              </p>
            </div>

            {orderId && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-600 inline-block">
                Reference Order: <strong>{orderId}</strong>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(orderType === 'farm_booking' ? '/farm-checkout' : '/checkout')}
                className="flex-1 bg-gradient-to-r from-[#0aa5db] to-[#011b33] hover:from-[#0092c3] hover:to-[#011424] text-white font-bold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-900/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-headings"
              >
                <RefreshCw size={15} /> Try Again with Paystack
              </button>

              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-5 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-headings"
              >
                <ShoppingBag size={15} /> Return to Cart
              </button>
            </div>
          </div>
        )}

        {/* ── PENDING / VERIFYING STATE ── */}
        {isPending && (
          <div className="space-y-6 relative z-10 py-6">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10 text-amber-600">
              <Clock size={40} className="animate-spin" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-800 font-headings">
                Verifying Payment with Paystack...
              </h1>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                Please wait a moment while we receive confirmation from your bank and Paystack servers.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-600">
              Transaction ID: <strong>{txnId || 'Checking...'}</strong>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
            >
              <RefreshCw size={14} /> Refresh Status
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
