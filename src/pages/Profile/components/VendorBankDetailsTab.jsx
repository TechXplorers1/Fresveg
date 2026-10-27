import React, { useState, useEffect } from 'react';
import {
  Landmark, CreditCard, ShieldCheck, CheckCircle2, Copy, Check, Eye, EyeOff,
  QrCode, AlertCircle, Save, ArrowRight, Store, ExternalLink, HelpCircle,
  Building2, Sparkles, RefreshCw, UploadCloud, Info, CheckCheck
} from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

const POPULAR_BANKS = [
  'Access Bank',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Bank',
  'OPay Digital Services',
  'PalmPay',
  'Moniepoint Microfinance Bank',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank'
];

export default function VendorBankDetailsTab({
  activeTab,
  isVendor,
  userProfile,
  updateProfile,
  onSwitchToEarnings
}) {
  if (!isVendor || activeTab !== 'bank') return null;

  // Initial bank details state from userProfile
  const existingBank = userProfile?.bankDetails || {};

  const [formData, setFormData] = useState({
    accountHolderName: existingBank.accountHolderName || userProfile?.displayName || '',
    bankName: existingBank.bankName || 'Access Bank',
    accountNumber: existingBank.accountNumber || '',
    confirmAccountNumber: existingBank.accountNumber || '',
    ifscCode: existingBank.ifscCode || '',
    accountType: existingBank.accountType || 'Current',
    branchName: existingBank.branchName || '',
    upiId: existingBank.upiId || '',
    qrCodeUrl: existingBank.qrCodeUrl || '',
    acceptDirectPayments: existingBank.acceptDirectPayments !== false,
    paymentInstructions: existingBank.paymentInstructions || 'Please include your Order ID in the transfer remarks/reference for instant payment verification.'
  });

  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (userProfile?.bankDetails) {
      setFormData(prev => ({
        ...prev,
        ...userProfile.bankDetails,
        confirmAccountNumber: userProfile.bankDetails.accountNumber || prev.confirmAccountNumber
      }));
    }
  }, [userProfile]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!formData.accountHolderName.trim()) {
      setErrorMsg('Please enter the Account Holder Name as registered with your bank.');
      return;
    }
    if (!formData.bankName.trim()) {
      setErrorMsg('Please enter or select your Bank Name.');
      return;
    }
    if (!formData.accountNumber.trim()) {
      setErrorMsg('Please enter your Bank Account Number.');
      return;
    }
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      setErrorMsg('Account Number and Confirm Account Number do not match!');
      return;
    }
    if (!formData.ifscCode.trim()) {
      setErrorMsg('Please enter the Bank Sort Code / CBN Code (e.g., 044 for Access, 058 for GTBank).');
      return;
    }

    try {
      setIsSaving(true);
      const cleanBankData = {
        accountHolderName: formData.accountHolderName.trim(),
        bankName: formData.bankName.trim(),
        accountNumber: formData.accountNumber.trim(),
        ifscCode: formData.ifscCode.trim().toUpperCase(),
        accountType: formData.accountType,
        branchName: formData.branchName.trim(),
        upiId: formData.upiId.trim(),
        qrCodeUrl: formData.qrCodeUrl.trim(),
        acceptDirectPayments: Boolean(formData.acceptDirectPayments),
        paymentInstructions: formData.paymentInstructions.trim(),
        isVerified: true,
        updatedAt: new Date().toISOString()
      };

      await updateProfile({ bankDetails: cleanBankData });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save vendor bank details:', err);
      setIsSaving(false);
      setErrorMsg(err.message || 'Failed to update bank details. Please try again.');
    }
  };

  // Mask account number for preview (e.g. •••• •••• •••• 7291)
  const getMaskedAccount = (accNum) => {
    if (!accNum) return '•••• •••• •••• ••••';
    const trimmed = accNum.trim();
    if (trimmed.length <= 4) return trimmed;
    const last4 = trimmed.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  // Generated live UPI URL
  const upiPayUrl = formData.upiId
    ? `upi://pay?pa=${encodeURIComponent(formData.upiId)}&pn=${encodeURIComponent(formData.accountHolderName || 'Vendor')}&cu=NGN`
    : '';

  const liveQrCodeUrl = formData.qrCodeUrl || (formData.upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`
    : '');

  const labelCls = "text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1 tracking-wider";
  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all font-body text-slate-800 placeholder:text-slate-400";

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner flex-shrink-0">
              <Landmark size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-headings">Vendor Bank Account & Payouts</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 font-headings">
                  <ShieldCheck size={12} /> Direct Settlement
                </span>
              </div>
              <p className="text-xs text-emerald-100/70 font-medium font-body mt-1 max-w-xl leading-relaxed">
                Add your verified bank account and UPI details. When customers order your fresh produce, they can pay directly to your account with zero platform commission delays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer font-headings"
            >
              <Eye size={14} /> Preview Checkout UI
            </button>
          </div>
        </div>
      </div>

      {/* Shortcut Banner to Earnings & Settlement Ledger */}
      {onSwitchToEarnings && (
        <div className="bg-gradient-to-r from-purple-50 via-teal-50/50 to-emerald-50 p-4 rounded-2xl border border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              पे
            </div>
            <div>
              <p className="text-xs font-bold text-purple-950 font-headings">
                Looking for your PhonePe Commission & Disbursal Ledger?
              </p>
              <p className="text-[11px] text-purple-800/80 font-medium">
                Track order-by-order gross sales, 10% platform fee deduction, and net bank settlements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSwitchToEarnings}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold font-headings flex items-center gap-1.5 transition-all self-start sm:self-center cursor-pointer shadow-sm active:scale-95"
          >
            <span>View Earnings Ledger</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-scale-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-bold font-headings">
              Bank details saved successfully! Customers can now pay directly to your bank account at checkout.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">Saved in DB</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-shake">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Card Preview & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Virtual Metallic Card Preview & Quick Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-headings text-slate-800 flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" />
                Live Settlement Card
              </h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {formData.acceptDirectPayments ? 'PAYMENTS ACTIVE' : 'PAYMENTS PAUSED'}
              </span>
            </div>

            {/* Virtual Metallic Neo-Card */}
            <div className="relative aspect-[1.586/1] rounded-3xl p-6 bg-gradient-to-tr from-slate-950 via-emerald-950 to-teal-900 text-white shadow-2xl shadow-emerald-950/20 overflow-hidden border border-white/10 flex flex-col justify-between select-none">
              {/* Decorative radial sheen */}
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card Top: Bank Name & Chip */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80 font-mono block mb-0.5">
                    VERIFIED VENDOR SETTLEMENT
                  </span>
                  <h4 className="text-base font-black font-headings tracking-tight text-white drop-shadow-xs">
                    {formData.bankName || 'Your Bank Name'}
                  </h4>
                  <span className="text-[10px] text-emerald-200/60 font-body font-medium">
                    {formData.branchName || 'Branch / City'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* EMV Chip Visual */}
                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/60 shadow-xs flex items-center justify-center p-1">
                    <div className="w-full h-full border border-amber-900/30 rounded-xs grid grid-cols-2 gap-0.5 opacity-60"></div>
                  </div>
                  {/* Contactless waves */}
                  <span className="text-white/60 text-xs font-mono">(((•)))</span>
                </div>
              </div>

              {/* Card Middle: Masked Account Number */}
              <div className="relative z-10 my-3">
                <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest block mb-1">
                  ACCOUNT NUMBER ({formData.accountType?.toUpperCase() || 'CURRENT'})
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base sm:text-lg font-bold tracking-widest text-emerald-100">
                    {showAccountNumber
                      ? (formData.accountNumber || '•••• •••• •••• ••••')
                      : getMaskedAccount(formData.accountNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                    title={showAccountNumber ? "Hide Account Number" : "Show Account Number"}
                  >
                    {showAccountNumber ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {formData.accountNumber && (
                    <button
                      type="button"
                      onClick={() => handleCopy(formData.accountNumber, 'acc')}
                      className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Card Bottom: Holder Name, IFSC & UPI */}
              <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[8px] font-mono text-white/50 uppercase tracking-wider block">ACCOUNT HOLDER</span>
                  <p className="font-bold font-headings text-white text-xs truncate max-w-[150px]">
                    {formData.accountHolderName || 'Account Holder Name'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[8px] font-mono text-white/50 uppercase tracking-wider block">SORT CODE</span>
                  <p className="font-mono font-bold text-emerald-300 text-xs flex items-center gap-1 justify-end">
                    {formData.ifscCode || 'SORT CODE'}
                    {formData.ifscCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(formData.ifscCode, 'ifsc')}
                        className="text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Copy Sort Code"
                      >
                        {copiedField === 'ifsc' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* UPI & Quick QR Summary Box */}
            <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-900 uppercase font-headings text-[11px] flex items-center gap-1.5">
                  <QrCode size={14} className="text-emerald-600" /> UPI Instant Transfer
                </span>
                {formData.upiId && (
                  <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md font-mono">
                    CONNECTED
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-100">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 block font-medium">Virtual Payment Address (VPA)</span>
                  <span className="font-bold text-slate-800 font-mono truncate block">
                    {formData.upiId || 'Not provided yet'}
                  </span>
                </div>
                {formData.upiId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formData.upiId, 'upi')}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-all flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedField === 'upi' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'upi' ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {liveQrCodeUrl && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                  <img
                    src={liveQrCodeUrl}
                    alt="UPI QR Code Preview"
                    className="w-16 h-16 object-contain rounded-lg border border-slate-100 bg-white p-1 flex-shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs font-headings">Live QR Code Generated</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-body">
                      Customers scan this with GPay, PhonePe, or Paytm to transfer straight to your account.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Payments Toggle Notice */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="pr-4">
                <span className="font-bold text-xs text-slate-800 block font-headings">Accept Direct Bank Payments</span>
                <span className="text-[11px] text-slate-500 font-body">
                  When enabled, buyers see your bank details at checkout.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={formData.acceptDirectPayments}
                  onChange={(e) => setFormData({ ...formData, acceptDirectPayments: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Comprehensive Edit Form */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold font-headings text-slate-800">Bank Account Details</h3>
              <p className="text-xs text-slate-400 font-medium">Please enter accurate details to avoid failed customer transfers</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building2 size={18} />
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Account Holder Name */}
            <div>
              <label className={labelCls}>
                Account Holder Name <span className="text-emerald-600 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                className={inputCls}
                placeholder="Full name as it appears on bank passbook / statement"
              />
              <p className="text-[10px] text-slate-400 mt-1 font-body">
                Ensure this matches your registered bank account name for smooth transaction reconciliation.
              </p>
            </div>

            {/* Bank Name with Presets */}
            <div>
              <label className={labelCls}>
                Bank Name <span className="text-emerald-600 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className={inputCls}
                placeholder="E.g., Access Bank, GTBank, Zenith Bank"
              />
              {/* Quick Select Bank Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-headings mr-1">Quick Pick:</span>
                {POPULAR_BANKS.slice(0, 5).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, bankName: b })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-headings ${
                      formData.bankName === b
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Number & Confirm Account Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Account Number <span className="text-emerald-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\s+/g, '') })}
                  className={inputCls + " font-mono"}
                  placeholder="e.g. 0128945678 (10-digit NUBAN)"
                />
              </div>

              <div>
                <label className={labelCls}>
                  Confirm Account Number <span className="text-emerald-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.confirmAccountNumber}
                  onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value.replace(/\s+/g, '') })}
                  className={`${inputCls} font-mono ${
                    formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber
                      ? 'border-rose-300 bg-rose-50/30'
                      : ''
                  }`}
                  placeholder="Re-enter account number"
                />
                {formData.confirmAccountNumber && formData.accountNumber === formData.confirmAccountNumber && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1 font-body">
                    <CheckCheck size={12} /> Account numbers match
                  </p>
                )}
                {formData.confirmAccountNumber && formData.accountNumber !== formData.confirmAccountNumber && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1 font-body">
                    ⚠️ Numbers do not match!
                  </p>
                )}
              </div>
            </div>

            {/* Bank Sort Code / CBN Code & Account Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Bank Sort Code / CBN Code <span className="text-emerald-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  className={inputCls + " font-mono uppercase tracking-wider font-bold"}
                  placeholder="e.g. 044 (Access) or 058 (GTBank)"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-body">11-character bank branch code</p>
              </div>

              <div>
                <label className={labelCls}>Account Type</label>
                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  {['Current', 'Savings'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, accountType: type })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer font-headings ${
                        formData.accountType === type
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type} Account
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch Name / City */}
            <div>
              <label className={labelCls}>Branch Name & Location</label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className={inputCls}
                placeholder="e.g. Ikeja Branch, Lagos State, Nigeria"
              />
            </div>

            {/* UPI & QR Code Settings Divider */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-800 font-headings">
                  UPI & Instant Payment Gateway Setup
                </span>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full font-mono">
                  RECOMMENDED
                </span>
              </div>

              {/* UPI ID */}
              <div>
                <label className={labelCls}>UPI ID / VPA</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value.trim().toLowerCase() })}
                  className={inputCls + " font-mono font-bold text-emerald-800"}
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-body">
                  When provided, a dynamic QR code is instantly created for customers during checkout.
                </p>
              </div>

              {/* Custom QR Code Image Upload */}
              <div>
                <label className={labelCls}>Merchant UPI QR Code Image (Optional)</label>
                <ImageUploadField
                  value={formData.qrCodeUrl}
                  onChange={(val) => setFormData({ ...formData, qrCodeUrl: val })}
                  inputClassName={inputCls}
                  placeholder="Upload your GPay/PhonePe business QR code or paste image URL"
                  accentColor="emerald"
                  id="vendor-bank-qr-upload"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-body">
                  Leave empty to automatically generate a scan-to-pay QR code from your UPI ID above.
                </p>
              </div>

              {/* Payment Instructions for Customers */}
              <div>
                <label className={labelCls}>Instructions for Customers at Checkout</label>
                <textarea
                  rows={2}
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  className={inputCls}
                  placeholder="Instructions displayed to buyers when they transfer to your bank account"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl text-xs font-headings shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving Details…
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Bank Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Preview Modal: Shows What Customer Sees At Checkout */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  <Eye size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-headings text-slate-800">Checkout Payment Panel Preview</h4>
                  <p className="text-[10px] text-slate-400">This is how your bank details appear to buyers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/40 via-teal-50/20 to-slate-50 border border-emerald-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-emerald-900 font-headings flex items-center gap-1.5">
                  <Landmark size={14} className="text-emerald-600" /> Direct Transfer to {formData.bankName || 'Vendor Bank'}
                </span>
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Verified Seller
                </span>
              </div>

              {/* Bank fields box */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100/80 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Account Holder:</span>
                  <span className="font-bold text-slate-800">{formData.accountHolderName || 'Vendor Name'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="font-bold text-slate-800">{formData.bankName || 'Bank Name'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-mono font-bold text-emerald-800">{formData.accountNumber || '0128945678'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-400">Bank Sort Code / CBN Code:</span>
                  <span className="font-mono font-bold text-slate-800">{formData.ifscCode || '044'}</span>
                </div>
                {formData.upiId && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Transfer Tag / Note:</span>
                    <span className="font-mono font-bold text-emerald-700">{formData.upiId}</span>
                  </div>
                )}
              </div>

              {/* QR Preview if present */}
              {liveQrCodeUrl && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-emerald-100">
                  <img
                    src={liveQrCodeUrl}
                    alt="QR"
                    className="w-14 h-14 object-contain rounded-md border border-slate-100 p-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 font-headings">Scan to Pay via UPI</p>
                    <p className="text-[10px] text-slate-400">Google Pay · PhonePe · Paytm · BHIM</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {formData.paymentInstructions && (
                <p className="text-[10px] text-emerald-800 bg-emerald-100/50 p-2.5 rounded-xl border border-emerald-200/50 leading-relaxed font-body">
                  ℹ️ {formData.paymentInstructions}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
