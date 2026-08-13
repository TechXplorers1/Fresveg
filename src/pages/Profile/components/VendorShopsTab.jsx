import React from 'react';
import { Store, Plus, MapPin, FileText, Loader2, ArrowLeft, Pencil, Trash2, Globe, Instagram, Facebook, Youtube, MessageCircle, Package, Star, Navigation, X, Check, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

const formatUpdatedTime = (ts) => {
    if (!ts) return '';
    try {
        const date = ts?.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '';
    }
};

export default function VendorShopsTab({
    isVendor,
    activeTab,
    vendorShops = [],
    showAddShopForm,
    setShowAddShopForm,
    shopSetup,
    setShopSetup,
    newShop,
    setNewShop,
    isSubmittingShop,
    handleShopSetup,
    handleAddAdditionalShop,
    handleEditShopClick,
    handleDeleteShop,
    editingShopIndex,
    setEditingShopIndex,
    editShopForm,
    setEditShopForm,
    handleUpdateShop,
    isUpdatingShop,
    deletingShopIndex,
    setDeletingShopIndex,
    viewingShopIndex,
    setViewingShopIndex,
    selectedShopFilter,
    setSelectedShopFilter,
    vendorProducts = [],
    handleOpenAddProductForShop,
    handleEditProductClick,
    handleDeleteProduct,
    handleGetCurrentLocation,
    detectingShopLocation,
    isAddingShop,
    EMPTY_SOCIAL_LINKS = { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (!isVendor || activeTab !== 'setup') return null;

    return (
        <React.Fragment>
                    {(isVendor && activeTab === 'setup') && (
                        <div className="space-y-8 animate-fade-in text-left">
                            {vendorShops.length === 0 ? (
                                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] max-w-xl mx-auto mt-8 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 p-4 rounded-3xl inline-block mb-4">
                                            <Store size={36} />
                                        </div>
                                        <h2 className="text-2xl font-bold font-headings text-slate-800">Set Up Your Shop</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body mt-1">Add your shop name so you can start adding products.</p>
                                    </div>
                                    <form onSubmit={handleShopSetup} className="space-y-4">
                                        <div>
                                            <label className={labelCls}>Shop Name</label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({ ...shopSetup, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Shop Location <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.location} onChange={(e) => setShopSetup({ ...shopSetup, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleGetCurrentLocation(setShopSetup, shopSetup)}
                                                    disabled={detectingShopLocation}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                >
                                                    {detectingShopLocation ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <Navigation size={11} />
                                                    )}
                                                    {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-emerald-600 mt-1.5 flex items-start gap-1 font-body">
                                                <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address (area + city + state) — this is shown to customers on Google Maps when they track their delivery.
                                            </p>
                                        </div>
                                        <div>
                                            <label className={labelCls}>GST Number</label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.gstNumber} onChange={(e) => setShopSetup({ ...shopSetup, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Shop Photo</label>
                                            <ImageUploadField
                                                value={shopSetup.image}
                                                onChange={(val) => setShopSetup({ ...shopSetup, image: val })}
                                                inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="https://images.unsplash.com/photo-..."
                                                accentColor="emerald"
                                                id="shop-setup-image"
                                            />
                                        </div>
                                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-headings">Social Media Links (Optional)</label>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instagram</label>
                                                    <input type="text" value={shopSetup.socialLinks?.instagram || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), instagram: e.target.value } }))} placeholder="https://instagram.com/yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Facebook</label>
                                                    <input type="text" value={shopSetup.socialLinks?.facebook || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), facebook: e.target.value } }))} placeholder="https://facebook.com/yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">YouTube</label>
                                                    <input type="text" value={shopSetup.socialLinks?.youtube || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), youtube: e.target.value } }))} placeholder="https://youtube.com/@yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                                                    <input type="text" value={shopSetup.socialLinks?.whatsapp || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Official Website</label>
                                                <input type="text" value={shopSetup.socialLinks?.website || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), website: e.target.value } }))} placeholder="https://yourshop.com" className={inputCls} />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingShop}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98] font-headings shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingShop ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    <span>Completing Setup...</span>
                                                </>
                                            ) : (
                                                "Complete Setup"
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="mt-8">
                                    {viewingShopIndex !== null ? (
                                        /* ── Shop Detail Page View ── */
                                        (() => {
                                            const shop = vendorShops[viewingShopIndex];
                                            if (!shop) return null;

                                            return (
                                                <div className="space-y-8 animate-fade-in">
                                                    <button
                                                        onClick={() => {
                                                            setViewingShopIndex(null);
                                                            setSelectedShopFilter(null);
                                                        }}
                                                        className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors font-headings"
                                                    >
                                                        <ArrowLeft size={16} /> Back to My Shops
                                                    </button>

                                                    <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/[0.02]">
                                                        <div className="h-56 w-full bg-gradient-to-r from-emerald-800 to-teal-950 relative flex items-center justify-center">
                                                            {shop.image ? (
                                                                <img src={shop.image} alt={shop.shopName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-white text-center">
                                                                    <Store size={48} className="mx-auto mb-2 opacity-80" />
                                                                    <p className="text-sm font-semibold tracking-wider uppercase opacity-80 font-headings">Fresh Produce Store</p>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => handleEditShopClick(shop, viewingShopIndex)}
                                                                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 font-headings"
                                                            >
                                                                <Pencil size={12} /> Edit Shop / Photo
                                                            </button>
                                                        </div>

                                                        <div className="p-6 md:p-8">
                                                            {editingShopIndex === viewingShopIndex ? (
                                                                <form onSubmit={handleUpdateShop} className="space-y-4 max-w-xl">
                                                                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-headings">Edit Shop Details</h3>
                                                                    <div>
                                                                        <label className={labelCls}>Shop Name</label>
                                                                        <div className="relative">
                                                                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>Location <span className="text-emerald-600 font-bold">*</span></label>
                                                                        <div className="relative">
                                                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                                                                disabled={detectingShopLocation}
                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                                            >
                                                                                {detectingShopLocation ? (
                                                                                    <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                                                ) : (
                                                                                    <Navigation size={10} />
                                                                                )}
                                                                                {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>GST Number</label>
                                                                        <div className="relative">
                                                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>Shop Photo</label>
                                                                        <ImageUploadField
                                                                            value={editShopForm.image}
                                                                            onChange={(val) => setEditShopForm({ ...editShopForm, image: val })}
                                                                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                                            placeholder="https://images.unsplash.com/..."
                                                                            accentColor="emerald"
                                                                            id="edit-shop-inline-image"
                                                                        />
                                                                    </div>
                                                                    {/* Social Media Links - Edit Shop / Photo inline form */}
                                                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                        <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 font-headings">
                                                                            <Globe size={13} className="text-emerald-600" /> Social Media Links (Optional)
                                                                        </label>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Instagram</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.instagram || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value } }))} placeholder="https://instagram.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Facebook</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.facebook || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value } }))} placeholder="https://facebook.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">YouTube</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.youtube || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value } }))} placeholder="https://youtube.com/@..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">WhatsApp</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.whatsapp || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Official Website</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.website || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), website: e.target.value } }))} placeholder="https://yourshop.com" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2 pt-1">
                                                                        <button type="submit" disabled={isUpdatingShop} className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black font-headings shadow-md active:scale-95 cursor-pointer">
                                                                            {isUpdatingShop ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                                            <span>{isUpdatingShop ? 'Saving...' : 'Save Shop Changes'}</span>
                                                                        </button>
                                                                        <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                                                    </div>
                                                                </form>
                                                            ) : deletingShopIndex === viewingShopIndex ? (
                                                                <div className="py-6 flex flex-col items-center justify-center text-center gap-2 max-w-md mx-auto">
                                                                    <Trash2 className="text-red-500 animate-bounce" size={32} />
                                                                    <h3 className="text-lg font-bold text-slate-800 font-headings">Delete {shop.shopName}?</h3>
                                                                    <p className="text-sm text-slate-400 font-medium font-body leading-relaxed">Deleting this shop will permanently remove it and all of its associated products. This action cannot be undone.</p>
                                                                    <div className="flex gap-3 mt-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleDeleteShop(viewingShopIndex);
                                                                                setViewingShopIndex(null);
                                                                                setSelectedShopFilter(null);
                                                                            }}
                                                                            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10"
                                                                        >
                                                                            Yes, Delete Shop
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeletingShopIndex(null)}
                                                                            className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                    <div className="space-y-4">
                                                                        <h2 className="text-3xl font-black text-slate-850 font-headings">{shop.shopName}</h2>
                                                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium font-body">
                                                                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-600" />{shop.location || 'No location set'}</span>
                                                                            <span className="flex items-center gap-1.5"><FileText size={16} className="text-slate-400" />GST: {shop.gstNumber}</span>
                                                                            {(shop.updatedAt || shop.createdAt) && (
                                                                                <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-mono">
                                                                                    <Clock size={13} className="text-emerald-600" />
                                                                                    Last Updated: {formatUpdatedTime(shop.updatedAt || shop.createdAt)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {/* Social Media Links - View Shop detail */}
                                                                        {shop.socialLinks && (shop.socialLinks.instagram || shop.socialLinks.facebook || shop.socialLinks.youtube || shop.socialLinks.whatsapp || shop.socialLinks.website) && (
                                                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-headings mr-1">Socials:</span>
                                                                                {shop.socialLinks.instagram && (
                                                                                    <a href={shop.socialLinks.instagram.startsWith('http') ? shop.socialLinks.instagram : `https://instagram.com/${shop.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform shadow-sm" title="Instagram">
                                                                                        <Instagram size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.facebook && (
                                                                                    <a href={shop.socialLinks.facebook.startsWith('http') ? shop.socialLinks.facebook : `https://facebook.com/${shop.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-600 text-white hover:scale-110 transition-transform shadow-sm" title="Facebook">
                                                                                        <Facebook size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.youtube && (
                                                                                    <a href={shop.socialLinks.youtube.startsWith('http') ? shop.socialLinks.youtube : `https://youtube.com/${shop.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-red-600 text-white hover:scale-110 transition-transform shadow-sm" title="YouTube">
                                                                                        <Youtube size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.whatsapp && (
                                                                                    <a href={shop.socialLinks.whatsapp.startsWith('http') ? shop.socialLinks.whatsapp : `https://wa.me/${shop.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-emerald-600 text-white hover:scale-110 transition-transform shadow-sm" title="WhatsApp">
                                                                                        <MessageCircle size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.website && (
                                                                                    <a href={shop.socialLinks.website.startsWith('http') ? shop.socialLinks.website : `https://${shop.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800 text-white hover:scale-110 transition-transform shadow-sm" title="Website">
                                                                                        <Globe size={14} />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeletingShopIndex(viewingShopIndex)}
                                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl transition-all border border-rose-100/50"
                                                                            title="Delete Shop"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        /* ── Shops List View ── */
                                        <div className="flex-1 w-full text-left">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-2xl font-bold text-slate-800 font-headings">My Shops ({vendorShops.length})</h2>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddShopForm(true)}
                                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.98] font-headings text-xs uppercase tracking-wider cursor-pointer"
                                                >
                                                    <Plus size={18} />
                                                    Add Shop
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {vendorShops.map((shop, i) => (
                                                    <div key={i} className="bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">
                                                        {editingShopIndex === i ? (
                                                            <form onSubmit={handleUpdateShop} className="space-y-3">
                                                                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2 font-headings">Editing Shop</p>
                                                                <div>
                                                                    <label className={labelCls}>Shop Name</label>
                                                                    <div className="relative">
                                                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>Location <span className="text-emerald-600 font-bold">*</span></label>
                                                                    <div className="relative">
                                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                                                            disabled={detectingShopLocation}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                                        >
                                                                            {detectingShopLocation ? (
                                                                                <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                                            ) : (
                                                                                <Navigation size={10} />
                                                                            )}
                                                                            {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-[10px] text-emerald-600 mt-1 flex items-start gap-1 font-body leading-relaxed">
                                                                        <Navigation size={10} className="mt-0.5 flex-shrink-0" /> Enter your full address so customers can see your shop on Google Maps when tracking orders.
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>GST Number</label>
                                                                    <div className="relative">
                                                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>Shop Photo</label>
                                                                    <ImageUploadField
                                                                        value={editShopForm.image}
                                                                        onChange={(val) => setEditShopForm({ ...editShopForm, image: val })}
                                                                        inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                                        placeholder="https://images.unsplash.com/..."
                                                                        accentColor="emerald"
                                                                        id="edit-shop-modal-image"
                                                                    />
                                                                </div>

                                                                {/* Social Media Links */}
                                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                    <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 font-headings">
                                                                        <Globe size={13} className="text-emerald-600" /> Social Media Links (Optional)
                                                                    </label>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Instagram</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.instagram || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value } }))} placeholder="https://instagram.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Facebook</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.facebook || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value } }))} placeholder="https://facebook.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">YouTube</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.youtube || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value } }))} placeholder="https://youtube.com/@..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">WhatsApp</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.whatsapp || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Official Website</label>
                                                                        <input type="text" value={editShopForm.socialLinks?.website || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), website: e.target.value } }))} placeholder="https://yourshop.com" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 pt-1">
                                                                    <button type="submit" disabled={isUpdatingShop} className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black font-headings shadow-md active:scale-95 cursor-pointer">
                                                                        {isUpdatingShop ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                                        <span>{isUpdatingShop ? 'Saving...' : 'Save Shop Changes'}</span>
                                                                    </button>
                                                                    <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                                                </div>
                                                            </form>
                                                        ) : deletingShopIndex === i ? (
                                                            /* ── Delete Confirmation ── */
                                                            <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                                                <Trash2 className="text-red-500 animate-bounce" size={24} />
                                                                <p className="text-sm font-bold text-slate-800 font-headings">Delete {shop.shopName}?</p>
                                                                <p className="text-[10px] text-slate-400 font-body">Deleting this shop will also hide its products. This cannot be undone.</p>
                                                                <div className="flex gap-2 mt-2">
                                                                    <button type="button" onClick={() => handleDeleteShop(i)} className="bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10">Yes, Delete</button>
                                                                    <button type="button" onClick={() => setDeletingShopIndex(null)} className="bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* ── Shop Card View ── */
                                                            <>
                                                                {/* Shop Header */}
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100/30">
                                                                            <Store size={14} className="text-emerald-600" />
                                                                        </div>
                                                                        <h3 className="font-extrabold text-slate-800 font-headings">{shop.shopName}</h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => handleEditShopClick(shop, i)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50" title="Edit Shop">
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                        <button onClick={() => setDeletingShopIndex(i)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50" title="Delete Shop">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Location row */}
                                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0 font-body">
                                                                        <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                                                                        <span className="truncate font-semibold">{shop.location || <span className="text-red-400 italic">No location set</span>}</span>
                                                                    </div>
                                                                    {shop.location && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-xs font-bold text-emerald-600 border border-emerald-250 px-2 py-1 rounded-lg hover:bg-emerald-50/50 transition-colors flex-shrink-0 font-headings"
                                                                        >
                                                                            <ExternalLink size={11} /> Maps
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                {/* Google Maps Embed Preview */}
                                                                {shop.location ? (
                                                                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner mb-3" style={{ height: '160px' }}>
                                                                        <iframe
                                                                            title={`Map for ${shop.shopName}`}
                                                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.shopName ? ' ' + shop.shopName : ''))}&output=embed&z=14`}
                                                                            width="100%"
                                                                            height="100%"
                                                                            style={{ border: 0 }}
                                                                            loading="lazy"
                                                                            referrerPolicy="no-referrer-when-downgrade"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-150 bg-rose-50/30 mb-3 py-5 px-3 text-center">
                                                                        <Navigation size={22} className="text-rose-300 mb-1" />
                                                                        <p className="text-xs font-bold text-rose-500 font-headings">Shop location not set</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5 font-body">Click the pencil icon to add your location so customers can track their orders.</p>
                                                                    </div>
                                                                )}

                                                                {/* GST & Last Updated */}
                                                                {/* Shop Social Media Links */}
                                                                {shop.socialLinks && (shop.socialLinks.instagram || shop.socialLinks.facebook || shop.socialLinks.youtube || shop.socialLinks.whatsapp || shop.socialLinks.website) && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 font-headings">Socials:</span>
                                                                        {shop.socialLinks.instagram && (
                                                                            <a href={shop.socialLinks.instagram.startsWith('http') ? shop.socialLinks.instagram : `https://instagram.com/${shop.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform" title="Instagram">
                                                                                <Instagram size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.facebook && (
                                                                            <a href={shop.socialLinks.facebook.startsWith('http') ? shop.socialLinks.facebook : `https://facebook.com/${shop.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-600 text-white hover:scale-110 transition-transform" title="Facebook">
                                                                                <Facebook size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.youtube && (
                                                                            <a href={shop.socialLinks.youtube.startsWith('http') ? shop.socialLinks.youtube : `https://youtube.com/${shop.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-red-600 text-white hover:scale-110 transition-transform" title="YouTube">
                                                                                <Youtube size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.whatsapp && (
                                                                            <a href={shop.socialLinks.whatsapp.startsWith('http') ? shop.socialLinks.whatsapp : `https://wa.me/${shop.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-600 text-white hover:scale-110 transition-transform" title="WhatsApp">
                                                                                <MessageCircle size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.website && (
                                                                            <a href={shop.socialLinks.website.startsWith('http') ? shop.socialLinks.website : `https://${shop.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-800 text-white hover:scale-110 transition-transform" title="Website">
                                                                                <Globe size={12} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-100 pb-3 font-body">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <FileText size={12} />
                                                                        <span>GST: {shop.gstNumber}</span>
                                                                    </div>
                                                                    {(shop.updatedAt || shop.createdAt) && (
                                                                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full font-mono">
                                                                            <Clock size={10} className="text-emerald-600" />
                                                                            <span>Updated {formatUpdatedTime(shop.updatedAt || shop.createdAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* View Shop Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setViewingShopIndex(i);
                                                                        setSelectedShopFilter(shop.shopName);
                                                                    }}
                                                                    className="w-full mt-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] font-headings"
                                                                >
                                                                    <Store size={12} /> View Shop
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
        </React.Fragment>
    );
}
