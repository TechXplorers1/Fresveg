import React from 'react';
import { Package, Truck, Check, Clock, MapPin, Shield, Bike, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CustomerOrdersTab({
    activeTab,
    orders = [],
    user,
    userProfile,
    isVendor = false,
    loadingOrders = false,
    handleUpdateOrderStatus,
    navigate
}) {
    if (activeTab !== 'orders') return null;

    return (
        <React.Fragment>
            {activeTab === 'orders' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] mb-8 animate-fade-in text-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-headings text-slate-800">{userProfile?.role === 'vendor' ? 'Customer Orders' : 'My Orders'}</h2>
                            <p className="text-xs text-slate-400 font-medium">
                                {userProfile?.role === 'vendor'
                                    ? 'Manage orders for your products'
                                    : 'Track your recent purchases and delivery status'}
                            </p>
                        </div>
                    </div>

                    {loadingOrders ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-600"></div>
                            <p className="text-xs font-semibold text-emerald-850 animate-pulse font-headings mt-4">Loading your orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                            <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-550 font-bold text-sm font-headings">No orders found.</p>
                            {userProfile?.role === 'customer' && (
                                <button onClick={() => navigate('/')} className="mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all font-headings cursor-pointer">
                                    Start Shopping
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden">
                                    {/* Order Header */}
                                    <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                            <div className="text-xs font-medium">
                                                <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5 font-headings">Order Placed</p>
                                                <p className="text-slate-700 font-bold font-body">{new Date(order.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-xs font-medium">
                                                <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5 font-headings">Total Amount</p>
                                                <p className="text-emerald-600 font-extrabold font-body">₹{parseFloat(order.total).toFixed(2)}</p>
                                            </div>
                                            <div className="text-xs font-medium">
                                                <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5 font-headings">Order ID</p>
                                                <p className="text-slate-700 font-mono font-bold uppercase">#{order.id.slice(-8)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-emerald-50 text-emerald-805 border border-emerald-100/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-headings">
                                                <Clock size={10} /> {order.status}
                                            </span>
                                            <button
                                                onClick={() => navigate(`/order/${order.id}`)}
                                                className="flex items-center gap-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 text-slate-750 hover:text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs active:scale-[0.98] font-headings cursor-pointer"
                                            >
                                                <ArrowRight size={10} /> Track
                                            </button>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            {/* Item List */}
                                            <div className="md:col-span-8 space-y-4">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4">
                                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-2xl border border-slate-100 flex-shrink-0" />
                                                        <div className="flex-grow min-w-0">
                                                            <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{item.name}</h4>
                                                            <p className="text-[10px] text-slate-405 font-semibold font-body">Sold by: {item.vendor}</p>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <p className="text-xs font-bold text-emerald-600 font-body">Qty: {item.quantity}</p>
                                                                <p className="text-xs font-bold text-slate-500 font-body">₹{item.price}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Shipping Info */}
                                            <div className="md:col-span-4 bg-white/50 p-4 rounded-2xl border border-slate-100/85 flex flex-col justify-center">
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider font-headings">Shipping Destination</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3 font-body">
                                                            {order.address}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vendor Controls */}
                                    {isVendor && (
                                        <div className="bg-emerald-500/[0.015] border-t border-slate-105 px-6 py-4 flex items-center justify-between gap-4">
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 font-headings">
                                                <Shield size={14} className="text-emerald-600" /> Vendor Controls
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 font-headings cursor-pointer"
                                                    >
                                                        <Check size={14} /> Confirm Order
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 font-headings cursor-pointer"
                                                    >
                                                        <Package size={14} /> Start Packing
                                                    </button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <>
                                                        {order.deliveryStatus === 'requested' ? (
                                                            <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-amber-100 font-headings">
                                                                <Clock size={12} className="animate-pulse" /> Awaiting Delivery Acceptance
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'processing', { deliveryStatus: 'requested' })}
                                                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 font-headings cursor-pointer"
                                                            >
                                                                <Bike size={14} /> Request Dispatch Rider
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {order.status === 'dispatched' && (
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full uppercase font-headings">
                                                        <Bike size={12} /> Dispatched Rider: {order.deliveryBoyName || 'Assigned'}
                                                    </div>
                                                )}
                                                {order.status === 'delivered' && (
                                                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-emerald-100 font-headings">
                                                        <Check size={14} /> Delivered Successfully
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </React.Fragment>
    );
}
