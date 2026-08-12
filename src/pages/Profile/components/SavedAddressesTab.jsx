import React from 'react';
import { MapPin, Plus, X, Search, Locate, Loader2, Pencil, Trash2, User, Calendar, Navigation, RefreshCw } from 'lucide-react';

export default function SavedAddressesTab({
    activeTab,
    showAddressForm,
    setShowAddressForm,
    editingAddressId,
    setEditingAddressId,
    newAddress,
    setNewAddress,
    handleAddressInputChange,
    handleAddAddress,
    handleEditAddressClick,
    handleDeleteAddress,
    isSavingAddress,
    isGeocodingAddress = false,
    handleDetectLocation,
    handleLocateTypedAddress,
    profileMapContainerRef,
    savedAddresses = [],
    userProfile,
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (activeTab !== 'addresses') return null;

    const toggleAddressForm = () => {
        if (showAddressForm) {
            setShowAddressForm(false);
            if (setEditingAddressId) setEditingAddressId(null);
        } else {
            setShowAddressForm(true);
        }
    };

    return (
        <React.Fragment>
            {activeTab === 'addresses' && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in text-left">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-headings text-slate-800">
                                    {editingAddressId ? 'Edit Address' : 'My Saved Addresses'}
                                </h2>
                                <p className="text-xs text-slate-400 font-medium font-body">
                                    {editingAddressId ? 'Update your address details below' : 'Manage your delivery locations'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={toggleAddressForm}
                            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] self-start sm:self-auto font-headings cursor-pointer"
                        >
                            {showAddressForm ? <X size={14} /> : <Plus size={14} />}
                            {showAddressForm ? 'Cancel' : 'Add New Address'}
                        </button>
                    </div>

                    {showAddressForm && (
                        <form onSubmit={handleAddAddress} className="bg-slate-50/50 backdrop-blur border border-slate-100 p-6 rounded-3xl mb-8 space-y-4 max-w-4xl">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                {/* Left Column: Form Fields */}
                                <div className="lg:col-span-7 space-y-4">
                                    {/* Location Services Banner */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl gap-3">
                                        <div className="flex items-center gap-2">
                                            <Navigation size={18} className={`text-emerald-600 ${isGeocodingAddress ? 'animate-spin' : ''}`} />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-808 font-headings">Location Services</p>
                                                <p className="text-[10px] text-slate-400 font-body">Detecting details automatically via GPS reverse geocoding</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                type="button"
                                                disabled={isGeocodingAddress}
                                                onClick={handleDetectLocation}
                                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto font-headings cursor-pointer"
                                            >
                                                <RefreshCw size={12} className={isGeocodingAddress ? 'animate-spin' : ''} />
                                                {isGeocodingAddress ? 'Detecting...' : 'Auto-Detect GPS'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLocateTypedAddress}
                                                className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto font-headings cursor-pointer"
                                                title="Geocode fields and update pin"
                                            >
                                                <MapPin size={12} />
                                                Locate Address
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className={labelCls}>Label (e.g. Home, Office)</label>
                                            <input required type="text" name="label" value={newAddress.label} onChange={handleAddressInputChange} className={inputCls} placeholder="Home" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelCls}>
                                                Street Address <span className="text-[10px] text-gray-400 font-normal">(Include Door/Flat/Plot No. if missing)</span>
                                            </label>
                                            <input required type="text" name="street" value={newAddress.street} onChange={handleAddressInputChange} className={inputCls} placeholder="e.g. Door No. 45, Main St" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>City</label>
                                            <input required type="text" name="city" value={newAddress.city} onChange={handleAddressInputChange} className={inputCls} placeholder="Mumbai" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>State</label>
                                            <input required type="text" name="state" value={newAddress.state} onChange={handleAddressInputChange} className={inputCls} placeholder="Maharashtra" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>ZIP Code</label>
                                            <input required type="text" name="zipCode" value={newAddress.zipCode} onChange={handleAddressInputChange} className={inputCls} placeholder="400001" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Country</label>
                                            <input required type="text" name="country" value={newAddress.country} onChange={handleAddressInputChange} className={inputCls} placeholder="India" />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSavingAddress}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 font-headings cursor-pointer"
                                    >
                                        {isSavingAddress ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            editingAddressId ? 'Update Address' : 'Save Address'
                                        )}
                                    </button>
                                </div>

                                {/* Right Column: Interactive Map */}
                                <div className="lg:col-span-5 flex flex-col min-h-[300px]">
                                    <label className={labelCls}>Pin Location on Map</label>
                                    <div
                                        ref={profileMapContainerRef}
                                        id="profile-address-map"
                                        className="w-full flex-grow rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative"
                                        style={{ minHeight: '300px', zIndex: 1 }}
                                    />
                                    <p className="text-[10px] text-slate-405 mt-2 font-body">
                                        ℹ️ Drag the green marker or click on the map to pinpoint your location precisely. The fields will update automatically.
                                    </p>
                                </div>

                            </div>
                        </form>
                    )}

                    {savedAddresses.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                            <MapPin className="mx-auto text-slate-350 mb-4" size={48} />
                            <p className="text-slate-500 font-bold text-sm font-headings">No addresses saved yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {savedAddresses.map((addr) => (
                                <div key={addr.id} className="bg-white/70 hover:bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-1 rounded-md uppercase tracking-wider font-headings">
                                                {addr.label || 'Other'}
                                            </span>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => handleEditAddressClick(addr)}
                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all p-1.5 rounded-xl border border-slate-100 cursor-pointer"
                                                    title="Edit Address"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAddress(addr.id)}
                                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all p-1.5 rounded-xl border border-slate-100 cursor-pointer"
                                                    title="Delete Address"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-sm font-bold text-slate-800 font-headings leading-snug break-words">{addr.street}</p>
                                        <p className="text-xs text-slate-500 font-medium font-body mt-1 break-words">{addr.city}, {addr.state} - {addr.zipCode}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black font-headings">{addr.country}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Role Based Stats */}
            {userProfile?.role === 'customer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 mt-6">
                    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <User className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 font-headings">Account Type</h3>
                                <p className="text-sm text-gray-500 font-body">Customer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm font-body">You can browse and purchase fresh products from our vendors.</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <Calendar className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 font-headings">Member Since</h3>
                                <p className="text-sm text-gray-500 font-body">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}</p>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm font-body">Welcome to our fresh farm marketplace platform!</p>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
