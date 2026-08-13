import React, { useState } from 'react';
import { Bike, Navigation, MapPin, Store, Clock, ExternalLink, Check, ShoppingBag, ShieldCheck, Power, Phone, MessageCircle } from 'lucide-react';
import OrderTrackingMap from '../../../components/OrderTrackingMap';

export default function DeliveryOrdersTab({
    activeTab,
    orders = [],
    user,
    handleAcceptJob,
    handleMarkAsDelivered,
    isTrackingActive,
    toggleGpsTracking,
    deliveryMapRef
}) {
    const [viewedMaps, setViewedMaps] = useState({});

    if (activeTab !== 'delivery_jobs' && activeTab !== 'delivery_active' && activeTab !== 'delivery_completed') {
        return null;
    }

    return (
        <React.Fragment>
            {activeTab === 'delivery_jobs' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                                <Bike size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-headings text-slate-800">Available Delivery Jobs</h2>
                                <p className="text-xs text-slate-400 font-medium font-body">Claim pending requests from vendors nearby</p>
                            </div>
                        </div>
                        {/* Duty status toggle */}
                        <button
                            onClick={toggleGpsTracking}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs font-headings cursor-pointer ${isTrackingActive
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/10 animate-pulse'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                }`}
                        >
                            <Power size={14} />
                            {isTrackingActive ? 'GPS: Online & Sharing' : 'GPS: Offline'}
                        </button>
                    </div>

                    {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                            <Bike className="mx-auto text-slate-300 mb-4" size={56} />
                            <p className="text-slate-550 font-bold text-lg font-headings">All Quiet on the Delivery Front!</p>
                            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">There are no pending delivery requests right now. Vendors will request when orders are ready.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').map((order) => (
                                <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-xs">
                                    {/* Job Header */}
                                    <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-6">
                                            <div className="text-xs font-medium">
                                                <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5 font-headings">Ready At</p>
                                                <p className="text-slate-700 font-bold font-body">{new Date(order.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                            <div className="text-xs font-medium">
                                                <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5 font-headings">Order Total</p>
                                                <p className="text-emerald-600 font-extrabold font-body">₹{parseFloat(order.total).toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleAcceptJob(order.id)}
                                                disabled={!viewedMaps[order.id]}
                                                className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98] font-headings cursor-pointer ${viewedMaps[order.id]
                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10'
                                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                    }`}
                                                title={viewedMaps[order.id] ? 'Accept Delivery Job' : 'Please view route map below first to accept'}
                                            >
                                                <Check size={14} /> Accept Delivery order
                                            </button>
                                        </div>
                                    </div>

                                    {/* Job details */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Vendor shop details */}
                                            <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5 text-emerald-600 font-headings">
                                                        <Store size={16} /> Pickup From (Vendor)
                                                    </h4>
                                                    <p className="font-extrabold text-slate-700 text-sm font-headings">{order.items[0]?.vendor || 'Local Vendor'}</p>
                                                    <p className="text-xs text-slate-400 italic mt-1 leading-relaxed font-body">
                                                        {order.items[0]?.shopLocation || 'Shop Address Not Provided'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                                                    <span className="font-bold text-slate-800 font-mono text-xs">{order.vendorPhone || order.items?.[0]?.vendorPhone || '+91 98765 43210'}</span>
                                                    <div className="flex items-center gap-1">
                                                        <a
                                                            href={`tel:${order.vendorPhone || order.items?.[0]?.vendorPhone || '+919876543210'}`}
                                                            className="p-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 font-headings cursor-pointer"
                                                            title="Call Vendor"
                                                        >
                                                            <Phone size={10} /> Call Vendor
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${(order.vendorPhone || order.items?.[0]?.vendorPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 font-headings cursor-pointer"
                                                            title="WhatsApp Vendor"
                                                        >
                                                            <MessageCircle size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Customer address */}
                                            <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-1.5 text-blue-600 font-headings">
                                                        <MapPin size={16} /> Deliver To (Customer)
                                                    </h4>
                                                    <p className="font-extrabold text-slate-700 text-sm font-headings">{order.customerName}</p>
                                                    <p className="text-xs text-slate-400 italic mt-1 leading-relaxed line-clamp-2 font-body">
                                                        {order.address}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 bg-blue-50/50 p-2 rounded-xl border border-blue-100/50">
                                                    <span className="font-bold text-slate-800 font-mono text-xs">{order.customerPhone || '+91 98765 43210'}</span>
                                                    <div className="flex items-center gap-1">
                                                        <a
                                                            href={`tel:${order.customerPhone || '+919876543210'}`}
                                                            className="p-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 font-headings cursor-pointer"
                                                            title="Call Customer"
                                                        >
                                                            <Phone size={10} /> Call Customer
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${(order.customerPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 px-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1 font-headings cursor-pointer"
                                                            title="WhatsApp Customer"
                                                        >
                                                            <MessageCircle size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items preview */}
                                        <div className="mt-4 border-t border-slate-100 pt-4">
                                            <p className="text-xs font-black text-slate-405 uppercase mb-2 tracking-wider font-headings">Package Items ({order.items.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {order.items.map((item, idx) => (
                                                    <span key={idx} className="bg-slate-50 text-slate-600 text-xs px-3 py-1 rounded-full border border-slate-200 font-semibold font-body">
                                                        {item.name} x {item.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Interactive Route Map requirement */}
                                        <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setViewedMaps(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                                className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-3 px-4 rounded-xl border transition-all active:scale-[0.99] font-headings cursor-pointer ${viewedMaps[order.id]
                                                    ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                                                    : 'bg-indigo-50/50 border-indigo-150 text-indigo-700 hover:bg-indigo-50 shadow-xs'
                                                    }`}
                                            >
                                                <Navigation size={14} className={viewedMaps[order.id] ? 'text-emerald-600' : 'text-indigo-650'} />
                                                {viewedMaps[order.id] ? 'Hide Route Map' : 'View Route Map & Distance to Unlock Accept'}
                                            </button>

                                            {viewedMaps[order.id] && (
                                                <div className="w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                                                    <OrderTrackingMap
                                                        vendorLocation={order.items[0]?.shopLocation}
                                                        vendorName={order.items[0]?.vendor}
                                                        deliveryAddress={order.address}
                                                        deliveryBoyLocation={null}
                                                        deliveryBoyName={null}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'delivery_active' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in text-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 border border-amber-100/50">
                            <Navigation size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-headings text-slate-800">Active Delivery Job</h2>
                            <p className="text-xs text-slate-400 font-medium font-body">Real-time route tracking and delivery actions</p>
                        </div>
                    </div>

                    {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                            <Navigation className="mx-auto text-slate-350 mb-4" size={56} />
                            <p className="text-slate-550 font-bold text-lg font-headings">No Active Deliveries</p>
                            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">You don't have any active deliveries. Go to the "Available Jobs" tab to accept a job.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').map((order) => (
                                <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-xs">
                                    {/* Active header */}
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 font-headings">Active Order ID</p>
                                            <p className="font-extrabold tracking-tight text-sm font-mono uppercase">#{order.id.slice(-12)}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={toggleGpsTracking}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all border active:scale-[0.98] font-headings cursor-pointer ${isTrackingActive
                                                    ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white animate-pulse'
                                                    : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Power size={11} strokeWidth={2.5} />
                                                {isTrackingActive ? 'GPS Sharing: ON' : 'GPS Sharing: OFF (Turn ON!)'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Active Info details */}
                                    <div className="p-6 space-y-6">
                                        {/* Alert when GPS is OFF */}
                                        {!isTrackingActive && (
                                            <div className="bg-amber-50/70 border border-amber-100/50 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
                                                <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                                <div>
                                                    <p className="font-bold text-amber-900 font-headings">GPS location sharing is offline</p>
                                                    <p className="mt-0.5 text-slate-500 leading-relaxed font-body">Please click the button above to enable GPS sharing so the customer and vendor can track your location lively on the map.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Pickup Shop */}
                                            <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-emerald-600 font-headings">
                                                        <Store size={16} /> 1. Pickup From
                                                    </h4>
                                                    <p className="font-extrabold text-slate-700 text-sm font-headings">{order.items[0]?.vendor}</p>
                                                    <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                                        {order.items[0]?.shopLocation || 'Shop location not set'}
                                                    </p>
                                                    <div className="flex items-center justify-between gap-2 mt-3 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/60">
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase text-emerald-900 block font-headings">Vendor Phone</span>
                                                            <span className="font-bold text-slate-800 font-mono text-xs">{order.vendorPhone || order.items?.[0]?.vendorPhone || '+91 98765 43210'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <a
                                                                href={`tel:${order.vendorPhone || order.items?.[0]?.vendorPhone || '+919876543210'}`}
                                                                className="p-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 font-headings cursor-pointer"
                                                            >
                                                                <Phone size={11} /> Call Vendor
                                                            </a>
                                                            <a
                                                                href={`https://wa.me/${(order.vendorPhone || order.items?.[0]?.vendorPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 font-headings cursor-pointer"
                                                            >
                                                                <MessageCircle size={11} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                {order.items[0]?.shopLocation && (
                                                    <a
                                                        href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.items[0].shopLocation)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200/50 hover:bg-emerald-50 py-2.5 rounded-xl transition-all font-headings"
                                                    >
                                                        <ExternalLink size={12} /> Get Pickup Directions
                                                    </a>
                                                )}
                                            </div>

                                            {/* Delivery Address */}
                                            <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-blue-100 transition-all duration-300">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-blue-650 font-headings">
                                                        <MapPin size={16} /> 2. Deliver To
                                                    </h4>
                                                    <p className="font-extrabold text-slate-700 text-sm font-headings">{order.customerName}</p>
                                                    <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                                        {order.address}
                                                    </p>
                                                    <div className="flex items-center justify-between gap-2 mt-3 bg-blue-50/70 p-2.5 rounded-xl border border-blue-100/60">
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase text-blue-900 block font-headings">Customer Phone</span>
                                                            <span className="font-bold text-slate-800 font-mono text-xs">{order.customerPhone || '+91 98765 43210'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <a
                                                                href={`tel:${order.customerPhone || '+919876543210'}`}
                                                                className="p-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 font-headings cursor-pointer"
                                                            >
                                                                <Phone size={11} /> Call Customer
                                                            </a>
                                                            <a
                                                                href={`https://wa.me/${(order.customerPhone || '919876543210').replace(/[^0-9]/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 px-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 font-headings cursor-pointer"
                                                            >
                                                                <MessageCircle size={11} />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200/50 hover:bg-blue-50 py-2.5 rounded-xl transition-all font-headings"
                                                >
                                                    <ExternalLink size={12} /> Get Delivery Directions
                                                </a>
                                            </div>
                                        </div>

                                        {/* Order Summary & Earn Info */}
                                        <div className="bg-white/80 rounded-2xl border border-slate-100 shadow-xs p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-headings">Order Total Value</p>
                                                <p className="text-lg font-black text-slate-800 mt-0.5 font-body">₹{parseFloat(order.total).toFixed(2)}</p>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-4 py-2 rounded-xl text-right">
                                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest font-headings">Est. Earnings</p>
                                                <p className="text-lg font-black text-emerald-800 mt-0.5 font-body">₹40.00</p>
                                            </div>
                                        </div>

                                        {/* Delivered Action */}
                                        <button
                                            onClick={() => handleMarkAsDelivered(order.id)}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base font-headings cursor-pointer"
                                        >
                                            <Check size={20} strokeWidth={3} /> Complete Order & Mark as Delivered
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'delivery_completed' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in text-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                            <Check size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold font-headings text-slate-800">Completed Deliveries</h2>
                            <p className="text-xs text-slate-400 font-medium font-body">Your historical delivery performance and earnings</p>
                        </div>
                    </div>

                    {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                            <Check className="mx-auto text-slate-350 mb-4" size={56} />
                            <p className="text-slate-550 font-bold text-lg font-headings">No Completed Deliveries Yet</p>
                            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">Your completed delivery jobs will appear here once you fulfill them.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Earnings summary card */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/30 rounded-3xl p-6 flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Deliveries Fulfilled</h3>
                                    <p className="text-3xl font-black text-emerald-900 mt-1 font-body">{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length}</p>
                                </div>
                                <div className="text-right">
                                    <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Earnings</h3>
                                    <p className="text-3xl font-black text-emerald-900 mt-1 font-body">₹{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length * 40}.00</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').map((order) => (
                                    <div key={order.id} className="bg-white/45 border border-slate-100 hover:border-emerald-100 hover:shadow-md p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 text-xs font-semibold transition-all duration-300">
                                        <div>
                                            <p className="text-slate-700 font-bold text-sm font-headings">Delivered to {order.customerName}</p>
                                            <p className="text-slate-400 mt-0.5 font-medium font-body">Order ID: #{order.id.slice(-8).toUpperCase()} • {new Date(order.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border border-emerald-100/30 tracking-wider font-headings">Success</span>
                                            <span className="text-emerald-600 font-black text-sm font-headings">₹40.00 Earned</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </React.Fragment>
    );
}
