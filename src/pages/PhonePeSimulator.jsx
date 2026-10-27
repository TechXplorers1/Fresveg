import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Smartphone, CreditCard, Building2,
  CheckCircle2, XCircle, Zap, RefreshCw, AlertCircle, Lock,
  Copy, Check, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function PhonePeSimulator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const txnId = searchParams.get('txnId') || `PSTK_${Date.now()}`;
  const orderId = searchParams.get('orderId') || `ORD-${Date.now()}`;
  const orderType = searchParams.get('type') || 'order';
  const amount = parseFloat(searchParams.get('amount') || '350.00');
  const isRateLimited = searchParams.get('rateLimited') === 'true';

  const [activeTab, setActiveTab] = useState('transfer'); // 'transfer' | 'card' | 'ussd' | 'mobile'
  const [selectedBank, setSelectedBank] = useState('GTBank (*737#)');
  const [selectedMobile, setSelectedMobile] = useState('OPay');
  const [cardNumber, setCardNumber] = useState('5061 •••• •••• 9821');
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(599); // 10 mins countdown

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

  const handleCopyAcc = () => {
    navigator.clipboard.writeText('0124892011');
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2500);
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
      // Redirect to payment status verification page
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
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Top Paystack Nigeria Branding Header */}
        <div className="bg-[#011b33] px-6 py-5 text-white flex items-center justify-between border-b-2 border-[#0aa5db]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0aa5db] text-white font-black flex items-center justify-center text-xl shadow-md">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight font-headings text-white">paystack</span>
                <span className="bg-[#0aa5db]/20 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-[#0aa5db]/40 text-[#00c3f7]">
                  Nigeria Sandbox
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Secured Nigerian Payment Gateway</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Expires In</span>
            <span className="font-mono font-bold text-amber-300 text-sm">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Notice if Sandbox rate-limited or simulated */}
        {isRateLimited && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <p>
              <strong>Notice:</strong> Paystack sandbox environment active. All transactions use test tokens with no real charge.
            </p>
          </div>
        )}

        {/* Order Info Strip */}
        <div className="bg-sky-50/70 px-6 py-3.5 border-b border-sky-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Merchant</span>
            <span className="text-sm font-bold text-slate-800 font-headings">FresVeg Organic Nigeria</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">Amount Due</span>
            <span className="text-xl font-black text-[#0aa5db] font-sans">₦{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1 text-center">
          {[
            { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
            { id: 'card',     label: 'Debit Card',    icon: CreditCard },
            { id: 'ussd',     label: 'USSD Code',     icon: Smartphone },
            { id: 'mobile',   label: 'OPay / PalmPay', icon: Zap },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-white text-[#0aa5db] shadow-sm border border-sky-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={16} className={active ? 'text-[#0aa5db]' : 'text-slate-400'} />
                <span className="mt-1 text-[11px] truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: INSTANT NIGERIAN BANK TRANSFER */}
          {activeTab === 'transfer' && (
            <div className="space-y-4 text-left">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Bank Name:</span>
                  <span className="text-xs font-black text-slate-800 font-headings">Wema Bank / FresVeg Checkout</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Account Number (NUBAN):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-[#0aa5db]">0124892011</span>
                    <button
                      type="button"
                      onClick={handleCopyAcc}
                      className="px-2 py-0.5 rounded-md bg-sky-100 hover:bg-sky-200 text-[#011b33] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAcc ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      {copiedAcc ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Beneficiary:</span>
                  <span className="text-xs font-bold text-slate-700">FresVeg Technologies Nigeria</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-medium">Amount:</span>
                  <span className="text-base font-black text-emerald-700 font-mono">₦{amount.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 Open your Nigerian banking app (Access, GTBank, Zenith, Kuda, etc.) and transfer exactly <strong>₦{amount.toFixed(2)}</strong>. This virtual account expires in 10 minutes.
              </p>
            </div>
          )}

          {/* TAB 2: DEBIT CARD (VERVE, MASTERCARD, VISA) */}
          {activeTab === 'card' && (
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Accepted Cards</span>
                <span className="font-bold text-slate-600">Verve · Mastercard · Visa</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Number (Sandbox Test Card)</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 outline-none focus:border-[#0aa5db]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    defaultValue="09/28"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    defaultValue="123"
                    maxLength={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Protected by 3D Secure OTP authentication.</span>
              </div>
            </div>
          )}

          {/* TAB 3: USSD CODE */}
          {activeTab === 'ussd' && (
            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Bank USSD</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'GTBank (*737#)',
                  'Zenith Bank (*966#)',
                  'First Bank (*894#)',
                  'UBA (*919#)',
                  'Access Bank (*901#)',
                  'Fidelity Bank (*770#)'
                ].map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      selectedBank === b
                        ? 'border-[#0aa5db] bg-sky-50 text-[#0aa5db]'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Dial USSD on your phone:</span>
                <span className="font-mono font-black text-slate-900 text-sm tracking-wider">
                  {selectedBank.includes('737') ? '*737*50*350*1248#' : selectedBank.includes('966') ? '*966*000*350#' : '*894*000*350#'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: OPAY / PALMPAY / KUDA */}
          {activeTab === 'mobile' && (
            <div className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">Choose Mobile Money Wallet</label>
              <div className="grid grid-cols-3 gap-2">
                {['OPay', 'PalmPay', 'Kuda Bank'].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedMobile(w)}
                    className={`p-3 rounded-2xl border text-center text-xs font-bold transition-all cursor-pointer ${
                      selectedMobile === w
                        ? 'border-[#0aa5db] bg-sky-50 text-[#0aa5db] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                A push payment authorization prompt will be simulated for your {selectedMobile} account.
              </p>
            </div>
          )}

          {/* Transaction Metadata */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Paystack Reference:</span>
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
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0aa5db] to-[#011b33] hover:from-[#0092c3] hover:to-[#011424] text-white font-bold text-sm shadow-lg shadow-sky-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Simulate Payment Success (Pay ₦{amount.toFixed(2)})
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
            <span>256-Bit SSL Encrypted Paystack Nigeria Sandbox</span>
          </div>

        </div>

      </div>
    </div>
  );
}
