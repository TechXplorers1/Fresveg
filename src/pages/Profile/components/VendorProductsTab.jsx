import React, { useState } from 'react';
import { Package, Plus, Search, Filter, Pencil, Trash2, Tag, Check, ArrowRight, Star, Store, ImageIcon, X } from 'lucide-react';

export default function VendorProductsTab({
    isVendor,
    activeTab,
    vendorProducts = [],
    vendorShops = [],
    selectedShopFilter,
    setSelectedShopFilter,
    setShowAddForm,
    handleOpenAddProductForShop,
    handleEditProductClick,
    handleDeleteProduct,
    updateProduct,
    navigate
}) {
    const [deletingProductId, setDeletingProductId] = useState(null);

    if (!isVendor || activeTab !== 'my_products') return null;

    const onAddClick = () => {
        if (handleOpenAddProductForShop) {
            const defaultShopName = vendorShops[0]?.shopName || '';
            handleOpenAddProductForShop(defaultShopName);
        } else {
            setShowAddForm(true);
        }
    };

    return (
        <React.Fragment>
            {activeTab === 'my_products' && (
                <div className="space-y-8 animate-fade-in text-left">
                    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-extrabold font-headings text-slate-800 flex items-center gap-2">
                                    <Package className="text-emerald-600" size={22} />
                                    {selectedShopFilter ? `Products at ${selectedShopFilter}` : 'My Products'} ({vendorProducts.length})
                                </h2>
                                <p className="text-xs text-slate-450 font-body mt-0.5">Manage catalog pricing, stock levels, and publish new products.</p>
                            </div>

                            <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                {selectedShopFilter && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedShopFilter(null)}
                                        className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] font-headings cursor-pointer"
                                    >
                                        <X size={12} /> Show All Shops
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onAddClick}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 font-headings"
                                >
                                    <Plus size={16} /> Add Products
                                </button>
                            </div>
                        </div>

                        {vendorProducts.length === 0 ? (
                            <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <Package className="mx-auto text-slate-350 mb-4" size={48} />
                                <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No products yet</h3>
                                <p className="text-sm text-slate-550 font-body mb-4">Get started by adding your first product to your shop.</p>
                                <button
                                    type="button"
                                    onClick={onAddClick}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5 cursor-pointer font-headings"
                                >
                                    <Plus size={16} /> Add Products
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {vendorProducts.map(product => (
                                    <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">
                                        {deletingProductId === product.id ? (
                                            <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                                                <Trash2 className="text-rose-500 animate-bounce" size={32} />
                                                <p className="text-sm font-bold text-slate-800 font-headings">Delete <span className="text-emerald-600">{product.name}</span>?</p>
                                                <p className="text-xs text-slate-405 font-body">This cannot be undone.</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md font-headings cursor-pointer">Yes, Delete</button>
                                                    <button onClick={() => setDeletingProductId(null)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all font-headings cursor-pointer">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-44 overflow-hidden bg-slate-50 flex items-center justify-center relative group">
                                                    {product.image
                                                        ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                        : <ImageIcon className="text-slate-300" size={48} />
                                                    }
                                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-305">
                                                        <button
                                                            onClick={() => handleEditProductClick(product)}
                                                            className="bg-white/90 backdrop-blur-sm text-emerald-600 hover:bg-emerald-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors cursor-pointer"
                                                            title="Edit Product"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingProductId(product.id)}
                                                            className="bg-white/90 backdrop-blur-sm text-rose-550 hover:bg-rose-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors cursor-pointer"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="text-[10px] font-black text-emerald-600 mb-1.5 uppercase tracking-wider font-headings">{product.category}</div>
                                                    <h3 className="font-bold text-slate-800 mb-1 truncate font-headings text-sm">{product.name}</h3>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="font-extrabold text-slate-900 text-base font-body">₹{parseFloat(product.price).toFixed(2)}</div>
                                                        <div className="bg-slate-50 text-slate-405 px-2.5 py-1 rounded-full text-[10px] font-semibold truncate max-w-[120px] flex items-center gap-1 border border-slate-100 font-body">
                                                            <Store size={10} /> {product.vendor}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
