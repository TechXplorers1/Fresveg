import React from 'react';
import { X, Package, Tag, FileText, RefreshCw, Loader2, Sparkles, AlertCircle, Pencil, Store, Check } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';
import { CATEGORIES as DEFAULT_CATEGORIES, STANDARD_UNITS as DEFAULT_UNITS } from '../constants/profileConstants';

export default function EditProductModal({
    editingProductId,
    setEditingProductId,
    editProductForm,
    setEditProductForm,
    handleUpdateProduct,
    vendorShops = [],
    categories = DEFAULT_CATEGORIES,
    STANDARD_UNITS = DEFAULT_UNITS,
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (!editingProductId) return null;

    const CATEGORIES_LIST = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

    return (
        <React.Fragment>
            {/* ── Edit Product Popup Modal ────────────────────────────────────── */}
            {editingProductId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 overflow-y-auto"
                    onClick={() => setEditingProductId(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-auto flex flex-col transform transition-all scale-100 duration-300 border border-slate-100 relative text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                                    <Pencil size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-headings text-slate-800">Edit Product</h2>
                                    <p className="text-xs text-slate-400 font-medium font-body">Modify details, pricing, inventory & specifications for {editProductForm?.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingProductId(null)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateProduct} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">

                                {/* Section: Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                        <Package size={16} /> Basic Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* 1. Product Name * */}
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <input
                                                    required
                                                    type="text"
                                                    name="name"
                                                    value={editProductForm.name}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="E.g. Organic Red Tomatoes"
                                                />
                                            </div>
                                        </div>

                                        {/* 2. Which Shop? * */}
                                        <div>
                                            <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <select
                                                    required
                                                    name="shop"
                                                    value={editProductForm.shop}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, shop: e.target.value })}
                                                    className={`${inputCls} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="">Select a shop...</option>
                                                    {vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 3. Category * */}
                                        <div>
                                            <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <select
                                                    required
                                                    name="category"
                                                    value={editProductForm.category}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                                                    className={`${inputCls} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="">Select category...</option>
                                                    {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* 4. M.R.P. / Original Price (₹) */}
                                        <div>
                                            <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="mrp"
                                                    value={editProductForm.mrp}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, mrp: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="6.50"
                                                />
                                            </div>
                                        </div>

                                        {/* 5. Selling Price (₹) * */}
                                        <div>
                                            <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    name="price"
                                                    value={editProductForm.price}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="4.99"
                                                />
                                            </div>
                                        </div>

                                        {/* 6. Quantity (e.g. 500g, 1 pack) */}
                                        <div>
                                            <label className={labelCls}>Quantity (e.g. 500g, 1 pack, 6 pcs)</label>
                                            <input
                                                type="text"
                                                name="netWeight"
                                                value={editProductForm.netWeight}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, netWeight: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="E.g. 500g, 1 pack, 6 pcs"
                                            />
                                        </div>

                                        {/* 7. Unit (e.g. kg, box) * (Dropdown) */}
                                        <div>
                                            <label className={labelCls}>Unit (e.g. kg, box, gm, ml) <span className="text-emerald-600 font-bold">*</span></label>
                                            <select
                                                required
                                                name="unitSelect"
                                                value={STANDARD_UNITS.includes(editProductForm.unit) ? editProductForm.unit : 'Other'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setEditProductForm({ ...editProductForm, unit: '' });
                                                    } else {
                                                        setEditProductForm({ ...editProductForm, unit: val });
                                                    }
                                                }}
                                                className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                            >
                                                <option value="kg">KG</option>
                                                <option value="gm">gm (grams)</option>
                                                <option value="litre">litre (L)</option>
                                                <option value="ml">ml (millilitres)</option>
                                                <option value="BOX">BOX</option>
                                                <option value="Packet">Packet</option>
                                                <option value="Bunch">Bunch</option>
                                                <option value="Piece">Piece / Pcs</option>
                                                <option value="Dozen">Dozen</option>
                                                <option value="Other">Other...</option>
                                            </select>

                                            {!STANDARD_UNITS.includes(editProductForm.unit) && (
                                                <div className="mt-2.5 animate-fade-in">
                                                    <input
                                                        required
                                                        type="text"
                                                        name="unit"
                                                        value={editProductForm.unit}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, unit: e.target.value })}
                                                        className={inputCls.replace('pl-10', 'px-4')}
                                                        placeholder="Enter custom unit (e.g. crate, bundle, jar, tray)"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* 8. Available Stock / Inventory (Units / kg) */}
                                        <div>
                                            <label className={labelCls}>Available Stock / Inventory (in {editProductForm.unit || 'units'})</label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <input
                                                    type="number"
                                                    name="stockQuantity"
                                                    value={editProductForm.stockQuantity}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, stockQuantity: e.target.value })}
                                                    className={`${inputCls} pr-20`}
                                                    placeholder={`E.g. 100 ${editProductForm.unit || 'units'}`}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 uppercase tracking-wider font-mono pointer-events-none shadow-2xs">
                                                    {editProductForm.unit || 'units'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 9. Image URL * */}
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className={labelCls}>Product Image <span className="text-emerald-600 font-bold">*</span></label>
                                            <ImageUploadField
                                                value={editProductForm.image}
                                                onChange={(val) => setEditProductForm(prev => ({ ...prev, image: val }))}
                                                inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="https://example.com/image.jpg"
                                                required
                                                accentColor="emerald"
                                                id="edit-product-image"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Product Specifications */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                        <Check size={16} /> Product Specifications & Freshness
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div>
                                            <label className={labelCls}>Food Preference</label>
                                            <select
                                                name="preference"
                                                value={editProductForm.preference}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, preference: e.target.value })}
                                                className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                            >
                                                <option value="Vegetarian">Vegetarian</option>
                                                <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                <option value="Vegan">Vegan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Country of Origin</label>
                                            <input
                                                type="text"
                                                name="origin"
                                                value={editProductForm.origin}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, origin: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="India"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Max Shelf Life</label>
                                            <input
                                                type="text"
                                                name="shelfLife"
                                                value={editProductForm.shelfLife}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, shelfLife: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="7 days"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Harvest / Freshness Date</label>
                                            <input
                                                type="text"
                                                name="harvestDate"
                                                value={editProductForm.harvestDate}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, harvestDate: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="Harvested Today"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                            <input
                                                type="text"
                                                name="organicCert"
                                                value={editProductForm.organicCert}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, organicCert: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="FSSAI-1002930492"
                                            />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Storage & Handling Info</label>
                                            <input
                                                type="text"
                                                name="storageInfo"
                                                value={editProductForm.storageInfo}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, storageInfo: e.target.value })}
                                                className={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="Keep refrigerated at 4°C"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Details & Lists */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                        <FileText size={16} /> Details & Descriptions
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelCls}>Description</label>
                                            <textarea
                                                name="description"
                                                value={editProductForm.description}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                                                rows="3"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                placeholder="Detailed description of the product..."
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Features & Details (one per line)</label>
                                            <textarea
                                                name="features"
                                                value={editProductForm.features}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, features: e.target.value })}
                                                rows="3"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Available Offers (one per line)</label>
                                            <textarea
                                                name="offers"
                                                value={editProductForm.offers}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, offers: e.target.value })}
                                                rows="2"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Policies */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                        <RefreshCw size={16} /> Policies
                                    </h3>
                                    <div>
                                        <label className={labelCls}>Return Policy</label>
                                        <textarea
                                            name="returnPolicy"
                                            value={editProductForm.returnPolicy}
                                            onChange={(e) => setEditProductForm({ ...editProductForm, returnPolicy: e.target.value })}
                                            rows="2"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                            placeholder="Returnable within 24 hours if damaged..."
                                        ></textarea>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingProductId(null)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings cursor-pointer"
                                >
                                    Update Product Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
