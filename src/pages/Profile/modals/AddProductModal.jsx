import React from 'react';
import { X, Plus, Store, MapPin, Navigation, FileText, Loader2, Image as ImageIcon, Package, Tag, RefreshCw, Check } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';
import { SUB_CATEGORIES_MAP, STANDARD_UNITS as DEFAULT_UNITS } from '../constants/profileConstants';

export default function AddProductModal({
    showAddForm,
    setShowAddForm,
    newProduct,
    setNewProduct,
    handleAddProduct,
    isAddingProduct,
    vendorShops = [],
    categories = [],
    STANDARD_UNITS = DEFAULT_UNITS,
    selectedShopFilter,
    userProfile,
    user,
    handleInputChange,
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (!showAddForm) return null;

    const currentSubCategories = SUB_CATEGORIES_MAP[newProduct?.category] || [];

    return (
        <React.Fragment>
            {/* ── Add Product Form Modal ────────────────────────────────────────── */}
            {showAddForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setShowAddForm(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300 text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleAddProduct} className="flex flex-col h-full overflow-hidden">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600 border border-emerald-100/50 animate-pulse">
                                        <Plus size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Product</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Fill in the details to publish a new product in the marketplace</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200 cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-8 flex-1">
                                {/* Section: Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                        <Package size={16} /> Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className={inputCls} placeholder="E.g. Organic Red Tomatoes" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <select
                                                    required
                                                    name="shop"
                                                    value={newProduct.shop}
                                                    onChange={handleInputChange}
                                                    disabled={!!selectedShopFilter}
                                                    className={`${inputCls} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="">Select a shop...</option>
                                                    {vendorShops.length === 0 ? (
                                                        <option value={userProfile?.displayName || user?.displayName || 'My Vendor Shop'}>
                                                            {userProfile?.displayName || user?.displayName || 'My Vendor Shop'} (Default Shop)
                                                        </option>
                                                    ) : (
                                                        vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <select
                                                    required
                                                    name="category"
                                                    value={newProduct.category}
                                                    onChange={(e) => {
                                                        const selectedCat = e.target.value;
                                                        const subCatList = SUB_CATEGORIES_MAP[selectedCat] || [];
                                                        const firstSub = subCatList[0] || '';
                                                        setNewProduct(prev => ({
                                                            ...prev,
                                                            category: selectedCat,
                                                            subCategory: firstSub,
                                                            name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? firstSub : prev.name
                                                        }));
                                                    }}
                                                    className={`${inputCls} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="">Select category...</option>
                                                    {Object.keys(SUB_CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        {newProduct.category && currentSubCategories.length > 0 && (
                                            <div>
                                                <label className={labelCls}>Sub-Category <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <select
                                                        required
                                                        name="subCategory"
                                                        value={newProduct.subCategory}
                                                        onChange={(e) => {
                                                            const selectedSubCat = e.target.value;
                                                            setNewProduct(prev => ({
                                                                ...prev,
                                                                subCategory: selectedSubCat,
                                                                name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? selectedSubCat : prev.name
                                                            }));
                                                        }}
                                                        className={`${inputCls} appearance-none bg-white font-medium`}
                                                    >
                                                        <option value="">Select sub-category...</option>
                                                        {currentSubCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                <input type="number" step="0.01" name="mrp" value={newProduct.mrp} onChange={handleInputChange} className={inputCls} placeholder="6.50" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                <input required type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} className={inputCls} placeholder="4.99" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Quantity (e.g. 500g, 1 pack, 6 pcs)</label>
                                            <input type="text" name="netWeight" value={newProduct.netWeight} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="E.g. 500g, 1 pack, 6 pcs" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Unit (e.g. kg, box, gm, ml) <span className="text-emerald-600 font-bold">*</span></label>
                                            <select
                                                required
                                                name="unitSelect"
                                                value={STANDARD_UNITS.includes(newProduct.unit) ? newProduct.unit : 'Other'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'Other') {
                                                        setNewProduct({ ...newProduct, unit: '' });
                                                    } else {
                                                        setNewProduct({ ...newProduct, unit: val });
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

                                            {!STANDARD_UNITS.includes(newProduct.unit) && (
                                                <div className="mt-2.5 animate-fade-in">
                                                    <input
                                                        required
                                                        type="text"
                                                        name="unit"
                                                        value={newProduct.unit}
                                                        onChange={handleInputChange}
                                                        className={inputCls.replace('pl-10', 'px-4')}
                                                        placeholder="Enter custom unit (e.g. crate, bundle, jar, tray)"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelCls}>
                                                Available Stock / Inventory <span className="text-emerald-700 font-extrabold font-headings">(in {newProduct.unit ? newProduct.unit : 'units'})</span>
                                            </label>
                                            <div className="relative">
                                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                <input
                                                    type="number"
                                                    name="stockQuantity"
                                                    value={newProduct.stockQuantity}
                                                    onChange={handleInputChange}
                                                    className={`${inputCls} pr-20`}
                                                    placeholder={`E.g. 100 ${newProduct.unit || 'units'}`}
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 uppercase tracking-wider font-mono pointer-events-none shadow-2xs">
                                                    {newProduct.unit || 'units'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-3">
                                            <label className={labelCls}>Product Image <span className="text-slate-400 font-normal text-[11px]">(Optional - fallback image auto-assigned if empty)</span></label>
                                            <ImageUploadField
                                                value={newProduct.image}
                                                onChange={(val) => setNewProduct(prev => ({ ...prev, image: val }))}
                                                inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="https://images.unsplash.com/photo-..."
                                                accentColor="emerald"
                                                id="add-product-image"
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
                                            <select name="preference" value={newProduct.preference} onChange={handleInputChange} className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}>
                                                <option value="Vegetarian">Vegetarian</option>
                                                <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                <option value="Vegan">Vegan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Country of Origin</label>
                                            <input type="text" name="origin" value={newProduct.origin} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="India" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Max Shelf Life</label>
                                            <input type="text" name="shelfLife" value={newProduct.shelfLife} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="7 days" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Harvest / Freshness Date</label>
                                            <input type="text" name="harvestDate" value={newProduct.harvestDate} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Harvested Today" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                            <input type="text" name="organicCert" value={newProduct.organicCert} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="FSSAI-1002930492" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Storage & Handling Info</label>
                                            <input type="text" name="storageInfo" value={newProduct.storageInfo} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Keep refrigerated at 4°C" />
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
                                            <textarea name="description" value={newProduct.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Detailed description of the product..."></textarea>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Features & Details (one per line)</label>
                                            <textarea name="features" value={newProduct.features} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"></textarea>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Available Offers (one per line)</label>
                                            <textarea name="offers" value={newProduct.offers} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"></textarea>
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
                                        <textarea name="returnPolicy" value={newProduct.returnPolicy} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Returnable within 24 hours if damaged..."></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAddingProduct}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings cursor-pointer"
                                >
                                    {isAddingProduct ? 'Saving Product...' : 'Save Product to Marketplace'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
