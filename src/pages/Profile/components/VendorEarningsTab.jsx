import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Landmark, CheckCircle2, Clock,
  ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw,
  CreditCard, Receipt, ExternalLink, ArrowRight, Sparkles, Building2
} from 'lucide-react';
import { api } from '../../../services/api';

export default function VendorEarningsTab({
  activeTab,
  isVendor,
  user,
  userProfile,
  onSwitchToBank
}) {
  if (!isVendor || activeTab !== 'earnings') return null;

  const vendorId = user?.uid || userProfile?.id || userProfile?.email;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    commissionRate: 10,
    summary: {
      totalGross: 0,
      totalCommission: 0,
      totalPayout: 0,
      disbursedAmount: 0,
      pendingAmount: 0,
      orderCount: 0
    },
    bankDetails: {},
    payouts: []
  });
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchPayouts = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res = await api.getVendorPayouts(vendorId);
      if (res && res.success) {
        setData(res);
      }
    } catch (err) {
      console.warn('Notice loading vendor payouts:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [vendorId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayouts();
  };

  const activeBank = data.bankDetails?.accountNumber
    ? data.bankDetails
    : (userProfile?.bankDetails || {});

  const filteredPayouts = data.payouts.filter(p => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return p.status === 'pending';
    if (filterStatus === 'completed') return p.status === 'completed' || p.status === 'paid';
    return true;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {/* ─── Top Header Card ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Sparkles size={13} className="text-emerald-400" />
              <span>3-Tier PhonePe Marketplace Settlement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-headings tracking-tight text-white">
              Vendor Earnings & Payout Ledger
            </h2>
            <p className="text-emerald-100/70 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Customer payments flow to the company gateway, where platform fees are deducted, and the remaining net balance is automatically accounted for disbursal directly into your registered bank account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold font-headings transition-all backdrop-blur-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Ledger'}</span>
            </button>

            {onSwitchToBank && (
              <button
                onClick={onSwitchToBank}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-headings transition-all shadow-lg shadow-emerald-950/30 active:scale-95 cursor-pointer"
              >
                <Landmark size={14} />
                <span>Bank Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── 3-Step Flow Diagram Banner ─────────────────────────────────────── */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-bold text-xs shrink-0">
              पे
            </div>
            <div>
              <p className="font-bold text-white text-xs">1. Customer Pay-in</p>
              <p className="text-[11px] text-white/60">PhonePe PG / UPI</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold text-xs shrink-0">
              %{data.commissionRate || 10}
            </div>
            <div>
              <p className="font-bold text-white text-xs">2. FresVeg Commission</p>
              <p className="text-[11px] text-white/60">{data.commissionRate || 10}% platform fee deducted</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xs shrink-0">
              🏦
            </div>
            <div>
              <p className="font-bold text-white text-xs">3. Vendor Bank Disbursal</p>
              <p className="text-[11px] text-white/60">Remaining net balance to you</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-headings">
              ₹{data.summary.totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              From {data.summary.orderCount} paid orders
            </p>
          </div>
        </div>

        {/* Platform Commission Deducted */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Receipt size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-900 font-headings">
              ₹{data.summary.totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-purple-600 font-medium">
              {data.commissionRate}% FresVeg service charge
            </p>
          </div>
        </div>

        {/* Net Vendor Payout (Total Earned) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Net Vendor Share</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900 font-headings">
              ₹{data.summary.totalPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">
              Your 90% net earnings
            </p>
          </div>
        </div>

        {/* Pending Disbursal */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Disbursal</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-headings">
              ₹{data.summary.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              Disbursed so far: ₹{data.summary.disbursedAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Destination Bank Card ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-md border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Landmark size={24} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-headings">
                Registered Disbursal Bank Account
              </h3>
              {activeBank.accountNumber ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={11} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertCircle size={11} /> Bank Not Added
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              {activeBank.accountNumber ? (
                <>
                  <span className="font-semibold text-white">{activeBank.bankName || 'Bank'}</span> · Account:{' '}
                  <span className="font-mono text-emerald-300">
                    •••• {String(activeBank.accountNumber).slice(-4)}
                  </span>{' '}
                  · IFSC: <span className="font-mono text-slate-300">{activeBank.ifscCode || 'N/A'}</span>
                  {activeBank.upiId && (
                    <> · UPI: <span className="font-mono text-teal-300">{activeBank.upiId}</span></>
                  )}
                </>
              ) : (
                'Add your bank details so the company can disburse your sales payouts directly to your account.'
              )}
            </p>
          </div>
        </div>

        {onSwitchToBank && (
          <button
            onClick={onSwitchToBank}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold font-headings border border-white/10 transition-all shrink-0 cursor-pointer self-start md:self-center"
          >
            <span>{activeBank.accountNumber ? 'Update Bank Details' : 'Configure Bank Now'}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* ─── Payout Ledger Table ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-headings">
              Order Settlement Ledger
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Line-by-line accounting showing platform commission and net vendor payout
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({data.payouts.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({data.payouts.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Disbursed ({data.payouts.filter(p => p.status === 'completed' || p.status === 'paid').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw size={24} className="animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-medium">Loading payout ledger records...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700 font-headings">No Payout Records Yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When customers purchase products from your shop and pay via PhonePe, each order's commission deduction and net payout will be logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-4">Order & Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Order Gross</th>
                  <th className="py-3 px-4 text-right">FresVeg Fee ({data.commissionRate}%)</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4 text-center">Settlement Status</th>
                  <th className="py-3 px-4">Disbursal Ref / UTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayouts.map((p) => {
                  const isCompleted = p.status === 'completed' || p.status === 'paid';
                  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Recent';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 font-mono">#{p.orderId}</div>
                        <div className="text-[11px] text-slate-400">{dateStr}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">
                          <span className="font-headings font-bold">पे</span> {p.paymentMethod || 'PhonePe'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        ₹{p.orderAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold text-purple-600">
                        -₹{p.commissionAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 font-headings text-sm">
                        ₹{p.payoutAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 size={12} /> Disbursed to Bank
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                            <Clock size={12} /> Pending Disbursal
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {p.reference ? (
                          <div className="font-mono text-[11px] text-slate-600">
                            {p.reference}
                            {p.disbursedAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(p.disbursedAt).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Queued for payout</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
