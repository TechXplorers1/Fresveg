import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Landmark, CheckCircle2, Clock,
  ArrowUpRight, ShieldCheck, AlertCircle, RefreshCw,
  Receipt, Sliders, Send, ExternalLink, Check, Copy
} from 'lucide-react';
import { api } from '../../../services/api';

export default function AdminPayoutsTab({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({
    commissionRate: 10,
    totalVolumeProcessed: 0,
    totalPlatformCommission: 0,
    totalVendorShare: 0,
    totalDisbursed: 0,
    totalPendingDisbursal: 0,
    payoutCount: 0
  });
  const [payouts, setPayouts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Commission Settings state
  const [commissionInput, setCommissionInput] = useState('10');
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  // Disburse modal / inline state
  const [disbursingId, setDisbursingId] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingDisbursal, setIsSubmittingDisbursal] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, payRes, setRes] = await Promise.all([
        api.getAdminPayoutSummary().catch(() => null),
        api.getAllPayouts().catch(() => []),
        api.getCommissionSettings().catch(() => null)
      ]);

      if (sumRes && sumRes.success) {
        setSummary(sumRes);
      }
      if (Array.isArray(payRes)) {
        setPayouts(payRes);
      }
      if (setRes && setRes.defaultRate !== undefined) {
        setCommissionInput(String(setRes.defaultRate));
      }
    } catch (err) {
      console.error('Error loading admin payout data:', err);
      showToast?.('Failed to load payout data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSaveCommission = async (e) => {
    e?.preventDefault();
    const rate = parseFloat(commissionInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showToast?.('Commission rate must be between 0% and 100%', 'error');
      return;
    }

    try {
      setIsSavingCommission(true);
      const res = await api.updateCommissionSettings(rate);
      if (res && res.success) {
        showToast?.(`Platform commission rate updated to ${rate}%`);
        setSummary(prev => ({ ...prev, commissionRate: rate }));
      }
    } catch (err) {
      showToast?.(err.message || 'Failed to update commission rate', 'error');
    } finally {
      setIsSavingCommission(false);
    }
  };

  const handleDisburseClick = (payout) => {
    setDisbursingId(payout.id);
    const autoUtr = `PP_DISB_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    setUtrInput(autoUtr);
  };

  const handleConfirmDisbursal = async (payoutId) => {
    try {
      setIsSubmittingDisbursal(true);
      const res = await api.disbursePayout(payoutId, { utrNumber: utrInput.trim() });
      if (res && res.success) {
        showToast?.(res.message || 'Payout successfully marked as disbursed!');
        setDisbursingId(null);
        setUtrInput('');
        loadData();
      }
    } catch (err) {
      showToast?.(err.message || 'Failed to disburse payout', 'error');
    } finally {
      setIsSubmittingDisbursal(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredPayouts = payouts.filter(p => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return p.status === 'pending';
    if (filterStatus === 'completed') return p.status === 'completed' || p.status === 'paid';
    return true;
  });

  return (
    <div className="space-y-8 text-left animate-fade-in">
      {/* ─── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 font-headings flex items-center gap-2">
            <span>Platform Commission & Vendor Settlements</span>
            <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
              पे PhonePe Gateway
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Track customer payments collected through company PhonePe gateway, monitor 10% platform fees, and disburse vendor payouts.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-gray-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Ledger'}</span>
        </button>
      </div>

      {/* ─── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Processed Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Volume</span>
            <DollarSign size={16} className="text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 font-headings">
              ₦{summary.totalVolumeProcessed.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">{summary.payoutCount} total orders</p>
          </div>
        </div>

        {/* Company Commission Revenue */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50/40 p-5 rounded-2xl border border-purple-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Company Revenue</span>
            <Receipt size={16} className="text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-900 font-headings">
              ₦{summary.totalPlatformCommission.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-purple-600 font-medium">
              FresVeg {summary.commissionRate}% platform share
            </p>
          </div>
        </div>

        {/* Total Vendor Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Vendor Share</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-900 font-headings">
              ₦{summary.totalVendorShare.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">Net payable to sellers</p>
          </div>
        </div>

        {/* Disbursed to Bank */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Disbursed</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-headings">
              ₦{summary.totalDisbursed.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Completed bank payouts</p>
          </div>
        </div>

        {/* Pending Disbursal */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Disbursal</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-950 font-headings">
              ₦{summary.totalPendingDisbursal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">Awaiting bank settlement</p>
          </div>
        </div>
      </div>

      {/* ─── Platform Commission Configuration Card ────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSaveCommission} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900 font-headings flex items-center gap-2">
              <Sliders size={16} className="text-brand" />
              <span>Platform Commission Settings</span>
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              Percentage retained by FresVeg on every order paid through the PhonePe payment gateway before crediting the vendor's net payout balance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                className="w-28 pl-4 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-brand outline-none"
              />
              <span className="absolute right-3 top-2.5 text-sm font-bold text-slate-400">%</span>
            </div>

            <button
              type="submit"
              disabled={isSavingCommission}
              className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold font-headings shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingCommission ? 'Saving...' : 'Update Commission'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Disbursal Ledger & Management Table ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900 font-headings">
              Vendor Payout Queue & History
            </h4>
            <p className="text-xs text-slate-400">
              Review vendor gross sales, fee deductions, bank details, and disburse payments
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
              All ({payouts.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({payouts.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed ({payouts.filter(p => p.status === 'completed' || p.status === 'paid').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw size={24} className="animate-spin mx-auto text-brand" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading settlement ledger...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Landmark size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No Payout Records in This Filter</p>
            <p className="text-xs text-slate-400">
              When customer orders are placed and paid via PhonePe, vendor payouts will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Order & Vendor</th>
                  <th className="py-3 px-4 text-right">Gross Order</th>
                  <th className="py-3 px-4 text-right">Commission ({summary.commissionRate}%)</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4">Bank Details Snapshot</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Disbursal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayouts.map((p) => {
                  const isCompleted = p.status === 'completed' || p.status === 'paid';
                  const bank = p.bankDetails || {};
                  const isCurrentlyDisbursing = disbursingId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-mono">#{p.orderId}</div>
                          <div className="font-semibold text-slate-700">{p.vendorName || p.vendorId}</div>
                          {p.vendorEmail && (
                            <div className="text-[10px] text-slate-400">{p.vendorEmail}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          ₦{p.orderAmount.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-purple-700">
                          ₦{p.commissionAmount.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 font-headings text-sm">
                          ₦{p.payoutAmount.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4">
                          {bank.accountNumber ? (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="font-bold text-slate-800">{bank.bankName || 'Bank'}</div>
                              <div className="font-mono text-slate-600 flex items-center gap-1">
                                A/C: {bank.accountNumber}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(bank.accountNumber, `ac_${p.id}`)}
                                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                  title="Copy Account Number"
                                >
                                  {copiedText === `ac_${p.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                </button>
                              </div>
                              <div className="font-mono text-slate-500">Bank Code: {bank.ifscCode}</div>
                              {bank.upiId && (
                                <div className="text-[10px] text-teal-700 font-mono">UPI: {bank.upiId}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 text-[11px] font-semibold italic">
                              No bank details saved
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 size={12} /> Disbursed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isCompleted ? (
                            <div className="text-right">
                              <div className="font-mono text-[10px] text-slate-600">{p.reference || 'Disbursed'}</div>
                              {p.disbursedAt && (
                                <div className="text-[10px] text-slate-400">
                                  {new Date(p.disbursedAt).toLocaleDateString('en-NG')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDisburseClick(p)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Send size={12} />
                              <span>Disburse</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Inline Disbursal Confirmation Modal/Panel */}
                      {isCurrentlyDisbursing && (
                        <tr className="bg-emerald-50/60 border-t border-b border-emerald-200">
                          <td colSpan={7} className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <h5 className="font-bold text-emerald-950 font-headings text-xs">
                                  Confirm Disbursal of ₦{p.payoutAmount.toFixed(2)} to {p.vendorName || 'Vendor'}
                                </h5>
                                <p className="text-[11px] text-emerald-800">
                                  Destination: {bank.bankName || 'Bank'} A/C {bank.accountNumber || 'N/A'} (Bank Code: {bank.ifscCode || 'N/A'})
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={utrInput}
                                  onChange={(e) => setUtrInput(e.target.value)}
                                  placeholder="NIP Session ID / Transfer Reference"
                                  className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none w-52"
                                />

                                <button
                                  type="button"
                                  onClick={() => handleConfirmDisbursal(p.id)}
                                  disabled={isSubmittingDisbursal}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  {isSubmittingDisbursal ? 'Confirming...' : 'Mark Disbursed'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setDisbursingId(null)}
                                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
