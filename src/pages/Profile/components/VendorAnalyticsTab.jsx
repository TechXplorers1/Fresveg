import React from 'react';
import { BarChart2, TrendingUp, DollarSign, Store, Compass, Users, Package, ShoppingBag, Calendar, CheckCircle } from 'lucide-react';

export default function VendorAnalyticsTab({
    activeTab,
    isVendor,
    vendorShops = [],
    vendorFarms = [],
    vendorProducts = [],
    orders = [],
    incomingFarmBookings = []
}) {
    if (activeTab !== 'analytics' || !isVendor) return null;
    // 1. Calculate Market / Shops Sales & Revenue
    const completedShopOrders = orders.filter(o => o.status === 'delivered');
    const totalShopSalesRevenue = completedShopOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const totalShopOrdersCount = orders.length;

    // 2. Calculate Farm Bookings & Produce Sales Revenue
    const confirmedFarmBookings = incomingFarmBookings.filter(b => b.status === 'confirmed' || !b.status);
    const vendorFarmBookingsRevenue = confirmedFarmBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount || b.costPerPerson) || 0), 0);
    const vendorTotalVisitorsCount = confirmedFarmBookings.reduce((sum, b) => sum + (Number(b.visitorsCount) || 1), 0);
    const vendorFarmBookingsCount = confirmedFarmBookings.length;

    // Combined total revenue across both Market & Farm
    const grandTotalRevenue = totalShopSalesRevenue + vendorFarmBookingsRevenue;

    return (
        <div className="space-y-8 animate-fade-in text-left">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold">
                        <BarChart2 size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black font-headings text-white">Analytics & Revenue Dashboard</h2>
                        <p className="text-xs text-slate-300 font-medium font-body">Combined earnings performance across all your registered shops and organic farms</p>
                    </div>
                </div>
            </div>

            {/* Combined Grand Total Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Combined Revenue */}
                <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Total Combined Earnings</span>
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 font-sans">₹{grandTotalRevenue.toFixed(2)}</h3>
                        <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                            <TrendingUp size={12} /> Combined Market & Farm Income
                        </p>
                    </div>
                </div>

                {/* Market Shops Revenue */}
                <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Market Shop Revenue</span>
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                            <Store size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 font-sans">₹{totalShopSalesRevenue.toFixed(2)}</h3>
                        <p className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-0.5">
                            <span>{totalShopOrdersCount} Total Customer Orders</span>
                        </p>
                    </div>
                </div>

                {/* Farm Tour & Visit Revenue */}
                <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Farm Visits Revenue</span>
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                            <Compass size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 font-sans">₹{vendorFarmBookingsRevenue.toFixed(2)}</h3>
                        <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-0.5">
                            <span>{vendorFarmBookingsCount} Confirmed Visits</span>
                        </p>
                    </div>
                </div>

                {/* Total Visitors & Guests */}
                <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-3xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Farm Guests Hosted</span>
                        <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
                            <Users size={18} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 font-sans">{vendorTotalVisitorsCount}</h3>
                        <p className="text-[11px] text-teal-600 font-bold flex items-center gap-1 mt-0.5">
                            <span>Visitors across {vendorFarms.length} Farms</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed 2-Column Analytics: Market vs Farms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* 🛒 Market & Shops Analytics Card */}
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-7 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Store size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg font-headings">Market & Shop Analytics</h3>
                            <p className="text-xs text-slate-400 font-medium">Performance metrics for your registered shops</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Shops Registered</span>
                            <p className="text-xl font-black text-slate-800 mt-1">{vendorShops.length} Active Shop{vendorShops.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Catalog Products</span>
                            <p className="text-xl font-black text-slate-800 mt-1">{vendorProducts.length} Items Listed</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider font-headings">Recent Customer Orders</h4>
                        {orders.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                                No shop orders placed yet.
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                                {orders.slice(0, 5).map(order => (
                                    <div key={order.id} className="bg-white/80 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800 line-clamp-1">{order.customerName}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(order.timestamp).toLocaleDateString()} • {order.items.length} items</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-emerald-700 font-mono">₹{parseFloat(order.total).toFixed(2)}</span>
                                            <span className="block text-[9px] font-extrabold text-emerald-600 uppercase">{order.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 🚜 Farm & Agritourism Analytics Card */}
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-7 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                            <Compass size={20} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg font-headings">Farm & Agritourism Analytics</h3>
                            <p className="text-xs text-slate-400 font-medium">Visit booking metrics for your organic farms</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Farms Listed</span>
                            <p className="text-xl font-black text-amber-900 mt-1">{vendorFarms.length} Farm Spot{vendorFarms.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60">
                            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Visit Bookings</span>
                            <p className="text-xl font-black text-amber-900 mt-1">{vendorFarmBookingsCount} Booked Slots</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider font-headings">Upcoming Scheduled Farm Visits</h4>
                        {incomingFarmBookings.length === 0 ? (
                            <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                                No farm visits booked yet.
                            </div>
                        ) : (
                            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                                {incomingFarmBookings.slice(0, 5).map(b => (
                                    <div key={b.id} className="bg-white/80 p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-bold text-slate-800 line-clamp-1">{b.customerName}</p>
                                            <p className="text-[10px] text-slate-400">{b.farmName} • {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-amber-700 font-mono">{b.isFree ? 'FREE' : `₹${b.totalAmount || b.costPerPerson}`}</span>
                                            <span className="block text-[9px] font-extrabold text-teal-600 uppercase">{b.visitorsCount} Guest{b.visitorsCount !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
