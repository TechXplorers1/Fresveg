import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Smartphone, QrCode, CreditCard, Building2,
  CheckCircle2, XCircle, ArrowRight, Zap, RefreshCw, AlertCircle, Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function PhonePeSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const txnId = searchParams.get('txnId') || `MT${Date.now()}`;
  const orderId = searchParams.get('orderId') || `ORD-${Date.now()}`;
  const orderType = searchParams.get('type') || 'order';
  const amount = parseFloat(searchParams.get('amount') || '350.00');
  const isRateLimited = searchParams.get('rateLimited') === 'true';

  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'upi' | 'card' | 'nb'
  const [upiId, setUpiId] = useState('customer@ybl');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(299); // 5 mins countdown

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSimulateSuccess = async () => {
    try {
      setLoading(true);
      await api.simulatePhonePePayment({
        targetId: orderId,
        orderType,
        status: 'SUCCESS',
        transactionId: txnId
      });
      // Redirect to PhonePe status verification page
      navigate(`/payment/phonepe-status?status=SUCCESS&orderId=${orderId}&txnId=${txnId}&type=${orderType}`);
    } catch (err) {
      console.error('Simulation error:', err);
      alert('Error simulating payment: ' + err.message);
      setLoading(false);
    }
  };

  const handleSimulateFailure = async () => {
    try {
      setLoading(true);
      await api.simulatePhonePePayment({
        targetId: orderId,
        orderType,
        status: 'FAILED',
        transactionId: txnId
      });
      navigate(`/payment/phonepe-status?status=FAILED&orderId=${orderId}&txnId=${txnId}&type=${orderType}&reason=${encodeURIComponent('Payment declined by user in test simulator')}`);
    } catch (err) {
      console.error('Simulation failure error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Top PhonePe Branding Header */}
        <div className="bg-[#5f259f] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-[#5f259f] font-black flex items-center justify-center text-xl shadow-md">
              पे
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight font-headings">PhonePe</span>
                <span className="bg-purple-800/80 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-purple-400/40 text-purple-200">
                  Sandbox Testing
                </span>
              </div>
              <p className="text-[11px] text-purple-200">Official Payment Gateway Simulator</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-purple-200 uppercase font-mono block">Expires In</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Notice if Sandbox rate-limited */}
        {isRateLimited && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <p>
              <strong>Notice:</strong> PhonePe shared UAT test servers are currently rate-limited. This interactive simulator seamlessly mimics the live PhonePe checkout.
            </p>
          </div>
        )}

        {/* Order Info Strip */}
        <div className="bg-purple-50/60 px-6 py-3.5 border-b border-purple-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Merchant</span>
            <span className="text-sm font-bold text-slate-800 font-headings">FresVeg Organic Marketplace</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Total Payable</span>
            <span className="text-xl font-black text-[#5f259f] font-sans">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-center">
          {[
            { id: 'qr', label: 'UPI QR', icon: QrCode },
            { id: 'upi', label: 'UPI App', icon: Smartphone },
            { id: 'card', label: 'Cards', icon: CreditCard },
            { id: 'nb', label: 'NetBank', icon: Building2 },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-white text-[#5f259f] shadow-sm border border-purple-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#5f259f]' : 'text-slate-400'} />
                <span className="mt-1 text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-white border-2 border-dashed border-[#5f259f]/30 rounded-2xl shadow-inner mb-3">
                {/* Simulated SVG QR Code */}
                <div className="w-44 h-44 bg-slate-900 rounded-xl p-2 relative flex flex-col justify-between overflow-hidden">
                  <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full p-1 bg-white rounded-lg">
                    {/* QR Code Pattern blocks */}
                    <div className="col-span-2 row-span-2 bg-[#5f259f] rounded-xs border-2 border-white" />
                    <div className="col-span-2 row-span-1 bg-slate-800 rounded-xs" />
                    <div className="col-span-2 row-span-2 bg-[#5f259f] rounded-xs border-2 border-white" />
                    <div className="col-span-1 row-span-2 bg-slate-800 rounded-xs" />
                    <div className="col-span-2 row-span-2 bg-purple-900 rounded-xs flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">पे</span>
                    </div>
                    <div className="col-span-1 row-span-2 bg-slate-800 rounded-xs" />
                    <div className="col-span-2 row-span-2 bg-[#5f259f] rounded-xs border-2 border-white" />
                    <div className="col-span-2 row-span-1 bg-slate-800 rounded-xs" />
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-700">Scan and pay with any UPI App</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PhonePe · Google Pay · Paytm · BHIM</p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <ShieldCheck size={13} /> Encrypted Dynamic Merchant QR
              </div>
            </div>
          )}

          {activeTab === 'upi' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter your UPI ID / VPA</label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#5f259f] focus:ring-1 focus:ring-[#5f259f]"
                    placeholder="e.g. mobile@ybl or username@oksbi"
                  />
                  <Smartphone size={16} className="absolute right-3 top-3 text-slate-400" />
                </div>
              </div>
              <div className="flex gap-2">
                {['@ybl', '@ibl', '@axl', '@oksbi'].map(handle => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => setUpiId((prev) => prev.split('@')[0] + handle)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 rounded-lg text-[10px] font-bold text-slate-600 hover:text-[#5f259f] transition-all"
                  >
                    {handle}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">A payment collect request will be approved in test mode.</p>
            </div>
          )}

          {activeTab === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Number (Sandbox Test Card)</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    defaultValue="123"
                    maxLength={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'nb' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map(bank => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                      selectedBank === bank
                        ? 'border-[#5f259f] bg-purple-50 text-[#5f259f]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Metadata */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Transaction Ref:</span>
              <span className="font-mono font-bold text-slate-700 truncate max-w-[200px]">{txnId}</span>
            </div>
            <div className="flex justify-between">
              <span>FresVeg Order:</span>
              <span className="font-mono font-bold text-slate-700">{orderId}</span>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleSimulateSuccess}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#5f259f] to-indigo-700 hover:from-[#4e1e82] hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Simulate Payment Success (Pay ₹{amount.toFixed(2)})
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSimulateFailure}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle size={15} />
              Simulate Failure / Cancel
            </button>
          </div>

          {/* Footer Security Note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Lock size={12} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted Sandbox Session</span>
          </div>

        </div>

      </div>
    </div>
  );
}
