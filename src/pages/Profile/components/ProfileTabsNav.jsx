import React from 'react';
import { Package, Store, Compass, Bike, CheckCircle, BarChart2 } from 'lucide-react';

export default function ProfileTabsNav({
    userProfile,
    isVendor,
    isDelivery,
    activeTab,
    setActiveTab,
    setSearchParams,
    shopsListLength,
    vendorFarmsLength,
    ordersLength
}) {
    return (
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-slate-200/80 shadow-sm overflow-x-auto scrollbar-hide">
            {/* Customer / Default Tab: My Orders */}
            <button
                onClick={() => {
                    setActiveTab('orders');
                    setSearchParams({});
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                    activeTab === 'orders'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
                <Package size={16} /> My Orders
            </button>

            {/* Vendor Tabs */}
            {isVendor && (
                <>
                    <button
                        onClick={() => {
                            setActiveTab('analytics');
                            setSearchParams({ tab: 'analytics' });
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                            activeTab === 'analytics'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <BarChart2 size={16} /> Analytics & Revenue
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('shops');
                            setSearchParams({ tab: 'shops' });
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                            activeTab === 'shops'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Store size={16} /> My Shops ({shopsListLength})
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('farms');
                            setSearchParams({ tab: 'farms' });
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                            activeTab === 'farms'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Compass size={16} /> My Farms ({vendorFarmsLength})
                    </button>
                </>
            )}

            {/* Delivery Boy Tabs */}
            {isDelivery && (
                <>
                    <button
                        onClick={() => {
                            setActiveTab('delivery_assigned');
                            setSearchParams({ tab: 'delivery_assigned' });
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                            activeTab === 'delivery_assigned'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <Bike size={16} /> Assigned Jobs
                    </button>

                    <button
                        onClick={() => {
                            setActiveTab('delivery_completed');
                            setSearchParams({ tab: 'delivery_completed' });
                        }}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer font-headings ${
                            activeTab === 'delivery_completed'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <CheckCircle size={16} /> Completed Jobs
                    </button>
                </>
            )}
        </div>
    );
}
