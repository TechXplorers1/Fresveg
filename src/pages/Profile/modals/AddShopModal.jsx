import React from 'react';
import { Plus, X, Store, MapPin, Navigation, FileText, Loader2 } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

export default function AddShopModal({
    showAddShopForm,
    setShowAddShopForm,
    newShop,
    setNewShop,
    handleAddAdditionalShop,
    handleGetCurrentLocation,
    detectingShopLocation,
    isAddingShop,
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (!showAddShopForm) return null;

    return (
        <React.Fragment>
                {showAddShopForm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                    >
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleAddAdditionalShop} className="flex flex-col h-full overflow-hidden">

                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-605 border border-emerald-100 animate-pulse">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Shop</h2>
                                            <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Register a new shop branch to showcase your products</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <div>
                                        <label className={labelCls}>Shop Name</label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input required type="text" value={newShop.shopName} onChange={(e) => setNewShop({ ...newShop, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Shop Location <span className="text-emerald-605 font-bold">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input required type="text" value={newShop.location} onChange={(e) => setNewShop({ ...newShop, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                            <button
                                                type="button"
                                                onClick={() => handleGetCurrentLocation(setNewShop, newShop)}
                                                disabled={detectingShopLocation}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                                            >
                                                {detectingShopLocation ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                ) : (
                                                    <Navigation size={12} />
                                                )}
                                                {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 mt-1.5 flex items-start gap-1 font-body">
                                            <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address — customers see this on Google Maps when tracking their order.
                                        </p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>GST Number</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input required type="text" value={newShop.gstNumber} onChange={(e) => setNewShop({ ...newShop, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Shop Photo</label>
                                        <ImageUploadField
                                            value={newShop.image}
                                            onChange={(val) => setNewShop({ ...newShop, image: val })}
                                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            accentColor="emerald"
                                            id="add-new-shop-image"
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-all duration-200 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingShop}
                                        className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                                    >
                                        {isAddingShop ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            "Create Shop"
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}
        </React.Fragment>
    );
}
