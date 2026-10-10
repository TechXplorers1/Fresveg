import React, { useState, useEffect } from 'react';
import {
    Sparkles, CheckCircle2, ShieldCheck, Calendar, Clock, Crown, Zap, AlertCircle,
    ArrowRight, Check, X, RefreshCw, Landmark, QrCode, Lock, ChevronRight, Compass,
    Star, Flame, HelpCircle, Copy, Printer, FileText, CheckCheck, CreditCard,
    Building2, Receipt, Phone, Mail, MapPin, ExternalLink
} from 'lucide-react';
import { api } from '../../../services/api';

const DEFAULT_PLANS = [
    {
        id: 'monthly',
        name: 'Monthly Starter',
        durationMonths: 1,
        days: 30,
        price: 499,
        originalPrice: 699,
        discount: '28% OFF',
        billingCycle: 'Billed monthly',
        badge: 'Flexible',
        popular: false,
        features: [
            'Display unlimited Paid & Free/Unpaid Farms',
            'Full visibility on Agritourism & Farm Tours directory',
            'Receive customer tour bookings & stay reservations',
            'Direct customer inquiries & contact calls/WhatsApp',
            'Verified Farm Host badge on farm profile',
            'Standard search ranking'
        ]
    },
    {
        id: 'quarterly',
        name: 'Quarterly Pro',
        durationMonths: 3,
        days: 90,
        price: 1299,
        originalPrice: 2097,
        discount: '38% OFF',
        monthlyEquivalent: 433,
        billingCycle: 'Billed every 3 months',
        badge: 'Most Popular',
        popular: true,
        features: [
            'Everything in Monthly Starter',
            'Priority search placement in Agritourism directory',
            '"Featured Farm" gold highlight badge',
            'Promote seasonal harvest, picking & festival tours',
            'Host multiple farm locations & activities',
            'Zero platform booking commission'
        ]
    },
    {
        id: 'half_yearly',
        name: 'Half-Yearly Master',
        durationMonths: 6,
        days: 180,
        price: 2299,
        originalPrice: 4194,
        discount: '45% OFF',
        monthlyEquivalent: 383,
        billingCycle: 'Billed every 6 months',
        badge: 'Best Value',
        popular: false,
        isBestValue: true,
        features: [
            'Everything in Quarterly Pro',
            'Top Homepage & Marketplace spotlight banner',
            'Verified Organic Agritourism Partner seal',
            'Maximum visibility across all search districts',
            'Dedicated seasonal farm video promotions',
            'Priority customer booking dispute resolution'
        ]
    }
];

const DEFAULT_BILLING_DETAILS = {
    companyName: 'FresVeg Technologies Private Limited',
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    billingAddress: '42, AgriTech Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    bankName: 'HDFC Bank Ltd',
    accountName: 'FresVeg Technologies Pvt Ltd',
    accountNumber: '50200088912345',
    ifscCode: 'HDFC0001234',
    accountType: 'Current Account',
    branch: 'Indiranagar, Bengaluru',
    upiId: 'fresveg.billing@hdfcbank'
};

export default function VendorFarmSubscriptionTab({
    user,
    userProfile,
    activeTab,
    onTabChange,
    onSubscriptionUpdated
}) {
    if (activeTab !== 'farm_subscription') return null;

    const [loading, setLoading] = useState(true);
    const [subStatus, setSubStatus] = useState(null);
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [billingInfo, setBillingInfo] = useState(DEFAULT_BILLING_DETAILS);
    const [billingHistory, setBillingHistory] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('demo'); // 'demo' | 'upi' | 'bank'
    const [utrNumber, setUtrNumber] = useState('');
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [copiedField, setCopiedField] = useState(null);

    const vendorIdentifier = user?.uid || user?.id || user?.email || userProfile?.email || '';

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2500);
    };

    const fetchSubscriptionData = async () => {
        if (!vendorIdentifier) return;
        setLoading(true);
        try {
            const [plansRes, statusRes, historyRes] = await Promise.all([
                api.getSubscriptionPlans().catch(err => {
                    console.warn('Could not load dynamic plans, using defaults:', err);
                    return { plans: DEFAULT_PLANS, billingDetails: DEFAULT_BILLING_DETAILS };
                }),
                api.getVendorSubscriptionStatus(vendorIdentifier).catch(err => {
                    console.warn('Could not load status:', err);
                    return null;
                }),
                api.getSubscriptionHistory(vendorIdentifier).catch(err => {
                    console.warn('Could not load history:', err);
                    return { history: [] };
                })
            ]);

            if (plansRes?.plans && plansRes.plans.length > 0) {
                setPlans(plansRes.plans);
            }
            if (plansRes?.billingDetails) {
                setBillingInfo(plansRes.billingDetails);
            }
            if (statusRes) {
                setSubStatus(statusRes);
            }
            if (historyRes?.history) {
                setBillingHistory(historyRes.history);
            }
        } catch (err) {
            console.error('Failed to load subscription data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptionData();
    }, [user, userProfile, vendorIdentifier]);

    const handleSelectPlan = (plan) => {
        setSelectedPlan(plan);
        setUtrNumber('');
        setErrorMessage('');
        setShowCheckoutModal(true);
    };

    const handleActivateSubscription = async () => {
        if (!selectedPlan) return;
        if (paymentMethod === 'upi' && !utrNumber.trim()) {
            setErrorMessage('Please enter the UPI Transaction Reference / UTR Number.');
            return;
        }

        setProcessing(true);
        setErrorMessage('');

        try {
            const payload = {
                vendorId: vendorIdentifier,
                planId: selectedPlan.id,
                paymentMethod: paymentMethod === 'demo' ? 'Instant Demo Activation' : 'Direct Bank / UPI',
                paymentReference: utrNumber.trim() || `ACT-${Date.now().toString().slice(-6)}`,
                paymentDetails: {
                    planName: selectedPlan.name,
                    amount: selectedPlan.price,
                    durationMonths: selectedPlan.durationMonths,
                    method: paymentMethod
                }
            };

            const res = await api.subscribeToFarmPlan(payload);
            if (res.success) {
                setSuccessMessage(`🎉 Successfully subscribed to ${selectedPlan.name}! All your farms are now published and live to customers.`);
                setShowCheckoutModal(false);
                await fetchSubscriptionData();
                if (onSubscriptionUpdated) {
                    onSubscriptionUpdated(res.subscription);
                }
                setTimeout(() => setSuccessMessage(''), 8000);
            } else {
                setErrorMessage(res.error || 'Failed to activate subscription. Please try again.');
            }
        } catch (err) {
            console.error('Subscription error:', err);
            setErrorMessage(err.message || 'Error processing subscription activation');
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to deactivate your subscription? Your farms will be hidden from customer view until renewed.')) {
            return;
        }
        setProcessing(true);
        try {
            await api.cancelFarmSubscription(vendorIdentifier);
            await fetchSubscriptionData();
            if (onSubscriptionUpdated) {
                onSubscriptionUpdated({ isActive: false });
            }
        } catch (err) {
            console.error('Cancel error:', err);
            alert('Failed to deactivate subscription: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const isActive = subStatus?.hasActiveSubscription;
    const currentSub = subStatus?.subscription || {};
    const farmCounts = subStatus?.farmCounts || { total: 0, free: 0, paid: 0 };

    // Calculate dates for checkout modal
    const getCheckoutDates = (months) => {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + (months * 30));
        return {
            startFormatted: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            endFormatted: end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        };
    };

    return (
        <div className="space-y-8 animate-fade-in text-left">
            {/* Header Notification Banner */}
            {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-md animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 size={18} />
                        </div>
                        <p className="text-xs font-bold font-headings">{successMessage}</p>
                    </div>
                    <button
                        onClick={() => onTabChange && onTabChange('farms')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all font-headings flex items-center gap-1 cursor-pointer"
                    >
                        View My Farms <ArrowRight size={12} />
                    </button>
                </div>
            )}

            {/* Current Subscription Status Neo Card */}
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden backdrop-blur-md transition-all duration-300 ${
                isActive
                    ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white border-emerald-500/30 shadow-emerald-950/20'
                    : 'bg-white/80 border-white/60 shadow-emerald-950/[0.03] text-slate-800'
            }`}>
                {/* Decorative background glow */}
                <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
                    isActive ? 'bg-emerald-500/20' : 'bg-amber-400/15'
                }`} />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-xl">
                        <div className="flex items-center gap-2.5">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 font-headings ${
                                isActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}>
                                {isActive ? (
                                    <>
                                        <Sparkles size={12} className="animate-pulse" /> Active Plan: {currentSub.planName || 'Subscribed'}
                                    </>
                                ) : (
                                    <>
                                        <Lock size={12} /> No Active Farm Plan
                                    </>
                                )}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                isActive ? 'text-emerald-200/70' : 'text-slate-400'
                            }`}>
                                Agritourism Listing Model
                            </span>
                        </div>

                        <h2 className={`text-2xl sm:text-3xl font-extrabold font-headings tracking-tight ${
                            isActive ? 'text-white' : 'text-slate-900'
                        }`}>
                            {isActive
                                ? 'Your Farms Are Live & Visible to Customers'
                                : 'Subscribe to Display Your Farms to Customers'}
                        </h2>

                        <p className={`text-xs sm:text-sm leading-relaxed ${
                            isActive ? 'text-slate-200/90' : 'text-slate-500 font-medium'
                        }`}>
                            {isActive
                                ? `Your paid and unpaid farms are published on the FresVeg Agritourism directory. Customers can discover your farm, book day visits, and reserve overnight stays.`
                                : `FresVeg requires vendors to maintain an active subscription plan (Monthly, 3 Months, or 6 Months) to display paid or unpaid farms to customers. Choose a plan below to activate your listings immediately.`}
                        </p>

                        {/* Counts summary */}
                        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-1.5">
                                <Compass size={14} className={isActive ? 'text-emerald-400' : 'text-emerald-600'} />
                                <span>{farmCounts.total} Total Farms Listed</span>
                            </div>
                            <span className={isActive ? 'text-white/30' : 'text-slate-300'}>•</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span>{farmCounts.paid} Paid Farms</span>
                            </div>
                            <span className={isActive ? 'text-white/30' : 'text-slate-300'}>•</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-teal-400' : 'bg-slate-400'}`} />
                                <span>{farmCounts.free} Free / Unpaid Farms</span>
                            </div>
                        </div>
                    </div>

                    {/* Right side stats / action box */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4">
                        {isActive ? (
                            <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-left lg:text-right min-w-[220px]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-300 mb-1 font-headings">
                                    Days Remaining
                                </p>
                                <p className="text-3xl font-extrabold font-mono text-white">
                                    {currentSub.daysRemaining || 0} <span className="text-xs font-normal text-emerald-200">days</span>
                                </p>
                                <p className="text-[11px] text-slate-300 mt-1 font-body">
                                    Valid until: {currentSub.endDate ? new Date(currentSub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>

                                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 justify-end">
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={processing}
                                        className="text-[11px] font-bold text-rose-300 hover:text-rose-100 hover:underline transition-all cursor-pointer"
                                    >
                                        Deactivate
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl text-left min-w-[220px]">
                                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs font-headings mb-1">
                                    <AlertCircle size={14} className="text-amber-600" /> Currently Hidden
                                </div>
                                <p className="text-[11px] text-slate-600 font-medium">
                                    Customers cannot see your farm listings until an active plan is taken.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Section Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
                <div>
                    <h3 className="text-lg font-bold font-headings text-slate-800 flex items-center gap-2">
                        <Crown size={18} className="text-amber-500" /> Select a Farm Display Subscription Plan
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                        Choose your billing duration. All plans unlock public customer visibility for both paid and unpaid farms.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100/60">
                    <ShieldCheck size={14} /> 100% Verified Host Protection
                </div>
            </div>

            {/* Plans Grid (1 Month, 3 Months, 6 Months) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan) => {
                    const isSelected = currentSub.planId === plan.id && isActive;
                    const isPopular = plan.popular;
                    const isBestValue = plan.isBestValue;

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 relative border ${
                                isPopular
                                    ? 'bg-white shadow-xl shadow-emerald-950/[0.06] border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.02] z-10'
                                    : 'bg-white/80 border-slate-200/80 shadow-md hover:shadow-xl hover:border-emerald-300'
                            }`}
                        >
                            {/* Badges */}
                            {plan.badge && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-headings shadow-sm ${
                                        isPopular
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                                            : isBestValue
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                                : 'bg-slate-800 text-white'
                                    }`}>
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div>
                                {/* Plan Header */}
                                <div className="border-b border-slate-100 pb-5 mb-5 text-left">
                                    <h4 className="text-lg font-bold font-headings text-slate-800">{plan.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium font-body mt-0.5">
                                        {plan.durationMonths === 1 ? '30 Days Full Access' : `${plan.durationMonths} Months (${plan.days} Days) Listing`}
                                    </p>

                                    {/* Price */}
                                    <div className="mt-4 flex items-baseline gap-2">
                                        <span className="text-3xl sm:text-4xl font-black font-headings text-slate-900">
                                            ₹{plan.price}
                                        </span>
                                        {plan.originalPrice && (
                                            <span className="text-sm font-bold text-slate-400 line-through">
                                                ₹{plan.originalPrice}
                                            </span>
                                        )}
                                        {plan.discount && (
                                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase font-headings">
                                                {plan.discount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                        {plan.monthlyEquivalent ? `Just ₹${plan.monthlyEquivalent}/month • ${plan.billingCycle}` : plan.billingCycle}
                                    </p>
                                </div>

                                {/* Features List */}
                                <div className="space-y-3 mb-6 text-left">
                                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-headings">
                                        What's Included
                                    </p>
                                    {plan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                                            <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check size={11} strokeWidth={3} />
                                            </div>
                                            <span className="leading-snug">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Plan CTA */}
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-headings active:scale-98 ${
                                        isPopular
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/15'
                                            : isBestValue
                                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-900/15'
                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                    }`}
                                >
                                    <CreditCard size={14} />
                                    {isSelected ? 'Renew / Extend Plan' : `Subscribe & View Billing (${plan.durationMonths} Mo${plan.durationMonths > 1 ? 's' : ''})`}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Why Subscription Policy FAQ Box */}
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                <h4 className="text-base font-bold font-headings text-slate-800 mb-4 flex items-center gap-2">
                    <HelpCircle size={18} className="text-emerald-600" /> How Farm Display Subscription Works
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                        <p className="font-bold text-slate-800 font-headings flex items-center gap-1.5">
                            <Compass size={14} className="text-emerald-600" /> 1. Paid & Unpaid Farms Covered
                        </p>
                        <p className="leading-relaxed font-body">
                            Whether you offer free agricultural farm walks or ticketed agritourism experiences with cottages and meals, one active subscription publishes all your farms.
                        </p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                        <p className="font-bold text-slate-800 font-headings flex items-center gap-1.5">
                            <Clock size={14} className="text-teal-600" /> 2. Seamless Extension
                        </p>
                        <p className="leading-relaxed font-body">
                            If you renew before your plan expires, new days are automatically added to your remaining balance. You never lose a single paid day.
                        </p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                        <p className="font-bold text-slate-800 font-headings flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-amber-600" /> 3. Verified Host Directory
                        </p>
                        <p className="leading-relaxed font-body">
                            Subscribed vendors get a verified badge, guaranteed customer booking notifications, and direct contact options on their listing cards.
                        </p>
                    </div>
                </div>
            </div>

            {/* Billing & Invoice History Section */}
            {billingHistory.length > 0 && (
                <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-900/[0.02]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div>
                            <h4 className="text-base font-bold font-headings text-slate-800 flex items-center gap-2">
                                <Receipt size={18} className="text-emerald-600" /> Billing & Subscription Invoice History
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                                Review your past subscription payments and tax invoices.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400 font-headings">
                                    <th className="py-3 px-4">Plan Name</th>
                                    <th className="py-3 px-4">Duration</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Payment Method / UTR</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {billingHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-800 font-headings">
                                            {item.planName}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600">
                                            {item.durationMonths} Month{item.durationMonths > 1 ? 's' : ''} ({item.days} Days)
                                        </td>
                                        <td className="py-3.5 px-4 font-bold font-mono text-slate-900">
                                            ₹{item.amount}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <p className="font-semibold text-slate-700">{item.paymentMethod}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{item.paymentReference}</p>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-headings ${
                                                item.status === 'active'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : item.status === 'expired'
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : 'bg-rose-100 text-rose-800'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <button
                                                onClick={() => setSelectedInvoice(item)}
                                                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer font-headings"
                                            >
                                                <FileText size={13} /> View Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Comprehensive Billing & Checkout Modal */}
            {showCheckoutModal && selectedPlan && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-scale-up text-left max-h-[92vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                                <h3 className="text-xl font-bold font-headings text-slate-900 flex items-center gap-2">
                                    <CreditCard size={20} className="text-emerald-600" />
                                    Subscription Billing & Tax Invoice
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Complete payment to display paid & unpaid farms to customers.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                {errorMessage}
                            </div>
                        )}

                        {/* Vendor Account Summary */}
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-5 text-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-headings mb-0.5">
                                        Vendor Account
                                    </p>
                                    <p className="font-bold text-slate-800 font-headings">{userProfile?.display_name || user?.displayName || user?.email || 'Registered Vendor'}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email || userProfile?.email}</p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-headings bg-emerald-100 text-emerald-800">
                                    Verified Host
                                </span>
                            </div>
                        </div>

                        {/* Order Summary & Tax Invoice Breakdown Box */}
                        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 mb-5 text-xs">
                            <div className="flex justify-between font-semibold text-slate-700">
                                <span>Selected Plan:</span>
                                <span className="font-bold text-slate-900 font-headings">{selectedPlan.name} ({selectedPlan.durationMonths} Month{selectedPlan.durationMonths > 1 ? 's' : ''})</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Validity Coverage:</span>
                                <span className="font-medium text-slate-800">
                                    {getCheckoutDates(selectedPlan.durationMonths).startFormatted} → {getCheckoutDates(selectedPlan.durationMonths).endFormatted} ({selectedPlan.days} Days)
                                </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Farms Covered:</span>
                                <span className="font-semibold text-emerald-700">All Paid & Unpaid Farms ({farmCounts.total} listed)</span>
                            </div>

                            <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Plan Base Amount:</span>
                                    <span className="font-mono">₹{(selectedPlan.price / 1.18).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>GST (18% inclusive):</span>
                                    <span className="font-mono">₹{(selectedPlan.price - (selectedPlan.price / 1.18)).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-slate-900 font-headings border-t border-slate-200/80 pt-2">
                                    <span>Total Billing Amount:</span>
                                    <span className="text-emerald-700 font-mono">₹{selectedPlan.price}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-3 mb-6">
                            <label className="text-xs font-bold text-slate-700 uppercase font-headings block">
                                Select Payment Method
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('demo')}
                                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        paymentMethod === 'demo'
                                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <Zap size={16} className={paymentMethod === 'demo' ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                            Instant
                                        </span>
                                    </div>
                                    <p className="font-bold text-xs text-slate-800 font-headings">1-Click Sandbox</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Activate immediately for testing</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                        paymentMethod === 'upi'
                                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <Landmark size={16} className={paymentMethod === 'upi' ? 'text-emerald-600' : 'text-slate-400'} />
                                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                            UPI / Bank
                                        </span>
                                    </div>
                                    <p className="font-bold text-xs text-slate-800 font-headings">Direct UPI / Bank Transfer</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Pay to FresVeg Bank with UTR</p>
                                </button>
                            </div>

                            {/* If UPI / Bank selected, show Bank/QR details & UTR field */}
                            {paymentMethod === 'upi' && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 animate-fade-in text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-white rounded-xl border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                                            <QrCode size={40} className="text-slate-700" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 font-headings">FresVeg Subscription Payment</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className="text-slate-600 text-[11px] font-mono font-bold">{billingInfo.upiId}</p>
                                                <button
                                                    onClick={() => handleCopy(billingInfo.upiId, 'modal_upi')}
                                                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                                >
                                                    {copiedField === 'modal_upi' ? <CheckCheck size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500">
                                                Bank: {billingInfo.bankName} • A/C: {billingInfo.accountNumber} • IFSC: {billingInfo.ifscCode}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-bold text-slate-700 block mb-1 font-headings">
                                            Enter 12-Digit Bank UTR / Reference ID:
                                        </label>
                                        <input
                                            type="text"
                                            value={utrNumber}
                                            onChange={(e) => setUtrNumber(e.target.value)}
                                            placeholder="e.g. UTR123456789012"
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCheckoutModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer font-headings"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleActivateSubscription}
                                disabled={processing}
                                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-headings disabled:opacity-50"
                            >
                                {processing ? (
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} /> Confirm & Activate Plan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Tax Invoice Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-scale-up text-left">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Receipt size={20} className="text-emerald-600" />
                                <h3 className="text-base font-bold font-headings text-slate-900">
                                    Tax Invoice Receipt
                                </h3>
                            </div>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <p className="font-black text-slate-900 font-headings text-sm">FresVeg Farm Subscriptions</p>
                                    <p className="text-slate-500 text-[11px]">Agritourism Listing Receipt</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 font-headings">Receipt ID</p>
                                    <p className="font-bold font-mono text-slate-800">{selectedInvoice.id}</p>
                                    <p className="text-[11px] text-slate-500">
                                        {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                                <p className="text-[10px] uppercase font-bold text-slate-400 font-headings">Vendor / Customer</p>
                                <p className="font-bold text-slate-800">{userProfile?.display_name || user?.displayName || user?.email}</p>
                                <p className="text-slate-500">{user?.email || userProfile?.email}</p>
                            </div>

                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-3 py-2 font-bold text-[11px] text-slate-700 flex justify-between">
                                    <span>Description</span>
                                    <span>Amount</span>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className="flex justify-between">
                                        <span>{selectedInvoice.planName} ({selectedInvoice.durationMonths} Month{selectedInvoice.durationMonths > 1 ? 's' : ''})</span>
                                        <span className="font-mono font-bold">₹{selectedInvoice.amount}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>Reference: {selectedInvoice.paymentReference}</span>
                                        <span>Method: {selectedInvoice.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-between font-black text-base text-slate-900 border-t border-slate-100">
                                <span>Total Paid:</span>
                                <span className="text-emerald-600 font-mono">₹{selectedInvoice.amount}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-headings"
                            >
                                <Printer size={14} /> Print Receipt
                            </button>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center cursor-pointer font-headings"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
