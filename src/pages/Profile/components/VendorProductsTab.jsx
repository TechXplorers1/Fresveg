import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Filter, Pencil, Trash2, Tag, Check, ArrowRight, Star, Store, ImageIcon, X, AlertTriangle, RefreshCw, TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

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
    updateProductStock,
    navigate
}) {
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Quick restock modal state
    const [restockModalProduct, setRestockModalProduct] = useState(null);
    const [restockAmount, setRestockAmount] = useState('50');
    const [isSavingStock, setIsSavingStock] = useState(false);

    const onAddClick = () => {
        if (handleOpenAddProductForShop) {
            const defaultShopName = vendorShops[0]?.shopName || '';
            handleOpenAddProductForShop(defaultShopName);
        } else {
            setShowAddForm(true);
        }
    };

    // Calculate Inventory KPIs
    const inventoryStats = useMemo(() => {
        const total = vendorProducts.length;
        let totalUnits = 0;
        let lowStock = 0;
        let outOfStock = 0;
        let totalSold = 0;

        vendorProducts.forEach(p => {
            const qty = p.stockQuantity !== undefined && p.stockQuantity !== null ? Number(p.stockQuantity) : 100;
            const initial = p.initialStock !== undefined && p.initialStock !== null ? Number(p.initialStock) : Math.max(qty, 100);
            totalUnits += qty;
            if (qty === 0) {
                outOfStock++;
            } else if (qty <= 20) {
                lowStock++;
            }
            totalSold += Math.max(0, initial - qty);
        });

        return {
            total,
            totalUnits,
            lowStock,
            outOfStock,
            totalSold,
            inStock: total - outOfStock
        };
    }, [vendorProducts]);

    // Filter products based on search, shop, and stock state
    const filteredProducts = useMemo(() => {
        return vendorProducts.filter(p => {
            // Search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchName = (p.name || '').toLowerCase().includes(query);
                const matchCat = (p.category || '').toLowerCase().includes(query);
                const matchShop = (p.vendor || '').toLowerCase().includes(query);
                if (!matchName && !matchCat && !matchShop) return false;
            }

            // Stock filter
            const qty = p.stockQuantity !== undefined && p.stockQuantity !== null ? Number(p.stockQuantity) : 100;
            if (stockFilter === 'in_stock' && qty <= 0) return false;
            if (stockFilter === 'low_stock' && (qty <= 0 || qty > 20)) return false;
            if (stockFilter === 'out_of_stock' && qty > 0) return false;

            return true;
        });
    }, [vendorProducts, searchQuery, stockFilter]);

    // Handle Quick Restock Submission
    const handleQuickRestockSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!restockModalProduct) return;
        const addQty = parseInt(restockAmount);
        if (isNaN(addQty) || addQty <= 0) {
            alert("Please enter a valid quantity greater than 0.");
            return;
        }

        setIsSavingStock(true);
        try {
            if (updateProductStock) {
                await updateProductStock(restockModalProduct.id, { delta: addQty });
            } else if (updateProduct) {
                const currentQty = restockModalProduct.stockQuantity !== undefined ? Number(restockModalProduct.stockQuantity) : 100;
                const newQty = currentQty + addQty;
                const currentInitial = restockModalProduct.initialStock !== undefined ? Number(restockModalProduct.initialStock) : 100;
                await updateProduct(restockModalProduct.id, {
                    ...restockModalProduct,
                    stockQuantity: newQty,
                    initialStock: Math.max(newQty, currentInitial)
                });
            }
            setRestockModalProduct(null);
            setRestockAmount('50');
        } catch (err) {
            console.error("Failed to restock product:", err);
            alert("Failed to update stock: " + (err.message || 'Please try again.'));
        } finally {
            setIsSavingStock(false);
        }
    };

    if (!isVendor || activeTab !== 'my_products') return null;

    return (
        <React.Fragment>
            {activeTab === 'my_products' && (
                <div className="space-y-8 animate-fade-in text-left">
                    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                        
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold font-headings text-slate-800 flex items-center gap-2">
                                    <Package className="text-emerald-600" size={24} />
                                    {selectedShopFilter ? `Products at ${selectedShopFilter}` : 'My Products & Inventory'} ({vendorProducts.length})
                                </h2>
                                <p className="text-xs text-slate-500 font-body mt-1">
                                    Track stock levels in real-time, view remaining quantities, restock items, and publish new inventory.
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
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

                        {/* ── Inventory KPI Summary Bar ── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                            {/* Card 1: Total Units Left */}
                            <div className="bg-gradient-to-br from-emerald-500/[0.08] to-teal-500/[0.03] border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                                    <Package size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Total Units Left</p>
                                    <h4 className="text-xl font-black text-slate-800 font-headings truncate">{inventoryStats.totalUnits.toLocaleString()}</h4>
                                    <p className="text-[10px] text-emerald-700 font-medium font-body mt-0.5 truncate">Across {inventoryStats.total} products</p>
                                </div>
                            </div>

                            {/* Card 2: In Stock */}
                            <div 
                                onClick={() => setStockFilter(stockFilter === 'in_stock' ? 'all' : 'in_stock')}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${stockFilter === 'in_stock' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white/80 border-slate-200/80 hover:border-emerald-300'}`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">In Stock Products</p>
                                    <h4 className="text-xl font-black text-emerald-700 font-headings">{inventoryStats.inStock}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium font-body mt-0.5 truncate">Ready for orders</p>
                                </div>
                            </div>

                            {/* Card 3: Low Stock Warning */}
                            <div 
                                onClick={() => setStockFilter(stockFilter === 'low_stock' ? 'all' : 'low_stock')}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${stockFilter === 'low_stock' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20' : 'bg-white/80 border-slate-200/80 hover:border-amber-300'}`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-headings">Low Stock (≤20)</p>
                                    <h4 className="text-xl font-black text-amber-700 font-headings">{inventoryStats.lowStock}</h4>
                                    <p className="text-[10px] text-amber-600/80 font-medium font-body mt-0.5 truncate">Needs restock soon</p>
                                </div>
                            </div>

                            {/* Card 4: Out of Stock */}
                            <div 
                                onClick={() => setStockFilter(stockFilter === 'out_of_stock' ? 'all' : 'out_of_stock')}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${stockFilter === 'out_of_stock' ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white/80 border-slate-200/80 hover:border-rose-300'}`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                                    <X size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 font-headings">Out of Stock (0)</p>
                                    <h4 className="text-xl font-black text-rose-700 font-headings">{inventoryStats.outOfStock}</h4>
                                    <p className="text-[10px] text-rose-600/80 font-medium font-body mt-0.5 truncate">Orders disabled</p>
                                </div>
                            </div>
                        </div>

                        {/* Search & Stock Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by product name, category, or shop..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs text-slate-800 placeholder:text-slate-400 font-body transition-all"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Stock Filter Pills */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                                <button
                                    onClick={() => setStockFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-headings cursor-pointer ${
                                        stockFilter === 'all'
                                            ? 'bg-slate-800 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    All ({vendorProducts.length})
                                </button>
                                <button
                                    onClick={() => setStockFilter('in_stock')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-headings cursor-pointer ${
                                        stockFilter === 'in_stock'
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                                >
                                    In Stock ({inventoryStats.inStock})
                                </button>
                                <button
                                    onClick={() => setStockFilter('low_stock')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-headings cursor-pointer ${
                                        stockFilter === 'low_stock'
                                            ? 'bg-amber-500 text-white shadow-sm'
                                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    }`}
                                >
                                    Low Stock ({inventoryStats.lowStock})
                                </button>
                                <button
                                    onClick={() => setStockFilter('out_of_stock')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-headings cursor-pointer ${
                                        stockFilter === 'out_of_stock'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    }`}
                                >
                                    Out of Stock ({inventoryStats.outOfStock})
                                </button>
                            </div>
                        </div>

                        {/* Products Grid */}
                        {vendorProducts.length === 0 ? (
                            <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                <Package className="mx-auto text-slate-350 mb-4" size={48} />
                                <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No products yet</h3>
                                <p className="text-sm text-slate-500 font-body mb-4">Get started by adding your first product to your shop with its available stock.</p>
                                <button
                                    type="button"
                                    onClick={onAddClick}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5 cursor-pointer font-headings"
                                >
                                    <Plus size={16} /> Add Products
                                </button>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-10 text-center">
                                <Filter className="mx-auto text-slate-350 mb-3" size={36} />
                                <h3 className="text-base font-bold font-headings text-slate-800 mb-1">No products match current filter</h3>
                                <p className="text-xs text-slate-500 font-body mb-3">Try clearing your search query or selecting "All" products.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setStockFilter('all'); }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer font-headings"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => {
                                    const stockQty = product.stockQuantity !== undefined && product.stockQuantity !== null ? Number(product.stockQuantity) : 100;
                                    const initStock = product.initialStock !== undefined && product.initialStock !== null ? Number(product.initialStock) : Math.max(stockQty, 100);
                                    const unit = product.unit || 'units';
                                    const stockPercent = initStock > 0 ? (stockQty / initStock) * 100 : 0;
                                    const soldCount = Math.max(0, initStock - stockQty);

                                    return (
                                        <div key={product.id} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between">
                                            {deletingProductId === product.id ? (
                                                <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                                                    <Trash2 className="text-rose-500 animate-bounce" size={32} />
                                                    <p className="text-sm font-bold text-slate-800 font-headings">Delete <span className="text-emerald-600">{product.name}</span>?</p>
                                                    <p className="text-xs text-slate-400 font-body">This cannot be undone.</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md font-headings cursor-pointer">Yes, Delete</button>
                                                        <button onClick={() => setDeletingProductId(null)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all font-headings cursor-pointer">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        {/* Product Image & Badges */}
                                                        <div className="h-44 overflow-hidden bg-slate-50 flex items-center justify-center relative group">
                                                            {product.image
                                                                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                : <ImageIcon className="text-slate-300" size={48} />
                                                            }

                                                            {/* Stock Badge Overlay */}
                                                            <div className="absolute top-2.5 left-2.5 pointer-events-none">
                                                                {stockQty === 0 ? (
                                                                    <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md font-headings">
                                                                        ⚠️ Out of Stock (0 left)
                                                                    </span>
                                                                ) : stockQty <= 20 ? (
                                                                    <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md font-headings animate-pulse">
                                                                        🔥 Only {stockQty} {unit} left!
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-emerald-700/90 text-white backdrop-blur-sm text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md font-mono">
                                                                        <Package size={11} /> {stockQty} / {initStock} {unit} left
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Actions overlay */}
                                                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                                <button
                                                                    onClick={() => handleEditProductClick(product)}
                                                                    className="bg-white/95 backdrop-blur-sm text-emerald-600 hover:bg-emerald-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors cursor-pointer"
                                                                    title="Edit Product"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingProductId(product.id)}
                                                                    className="bg-white/95 backdrop-blur-sm text-rose-500 hover:bg-rose-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors cursor-pointer"
                                                                    title="Delete Product"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="p-4">
                                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider font-headings truncate">
                                                                    {product.category}
                                                                </span>
                                                                <span className="bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-semibold truncate max-w-[120px] flex items-center gap-1 border border-slate-150 font-body">
                                                                    <Store size={10} className="shrink-0" /> {product.vendor}
                                                                </span>
                                                            </div>

                                                            <h3 className="font-bold text-slate-800 mb-1 truncate font-headings text-sm" title={product.name}>
                                                                {product.name}
                                                            </h3>

                                                            <div className="flex items-baseline justify-between mt-2">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="font-extrabold text-slate-900 text-base font-body">₦{parseFloat(product.price).toFixed(2)}</span>
                                                                    <span className="text-[11px] text-slate-400 font-semibold font-headings">/ {unit}</span>
                                                                </div>
                                                                {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                                                                    <span className="text-[11px] text-slate-400 line-through">₦{parseFloat(product.mrp).toFixed(2)}</span>
                                                                )}
                                                            </div>

                                                            {/* ── Stock Remaining Indicator & Progress Bar ── */}
                                                            <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5">
                                                                <div className="flex items-center justify-between text-xs font-headings">
                                                                    <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1">
                                                                        <Package size={12} className={stockQty === 0 ? "text-rose-500" : stockQty <= 20 ? "text-amber-500" : "text-emerald-600"} />
                                                                        Stock Left:
                                                                    </span>
                                                                    <span className={`font-mono text-xs font-black ${
                                                                        stockQty === 0 ? "text-rose-600" :
                                                                        stockQty <= 20 ? "text-amber-600" :
                                                                        "text-emerald-700"
                                                                    }`}>
                                                                        {stockQty} / {initStock} {unit} left
                                                                    </span>
                                                                </div>

                                                                {/* Visual Stock Progress Bar */}
                                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                                                    <div 
                                                                        className={`h-full transition-all duration-500 rounded-full ${
                                                                            stockPercent === 0 ? 'bg-rose-500 w-0' :
                                                                            stockPercent <= 20 ? 'bg-gradient-to-r from-amber-500 to-rose-500' :
                                                                            'bg-gradient-to-r from-emerald-500 to-teal-500'
                                                                        }`}
                                                                        style={{ width: `${Math.min(100, Math.max(0, stockPercent))}%` }}
                                                                    />
                                                                </div>

                                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium font-body pt-0.5">
                                                                    <span>{soldCount} {unit} ordered</span>
                                                                    <span className="font-semibold text-slate-500">{Math.round(stockPercent)}% remaining</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Footer: Quick Actions */}
                                                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setRestockModalProduct(product)}
                                                            className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 font-headings cursor-pointer"
                                                        >
                                                            <RefreshCw size={12} /> + Restock
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditProductClick(product)}
                                                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-95 font-headings cursor-pointer"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Quick Restock Modal ── */}
                    {restockModalProduct && (
                        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left animate-scale-in">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Package size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 text-base font-headings">Restock Product</h3>
                                            <p className="text-[11px] text-slate-400 font-body">Add more units to current inventory</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRestockModalProduct(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-150 flex items-center gap-3">
                                    {restockModalProduct.image ? (
                                        <img src={restockModalProduct.image} alt={restockModalProduct.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                                            <Package size={20} />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{restockModalProduct.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-body">
                                            <span>Current Stock: <strong className="text-emerald-700 font-mono font-bold">{restockModalProduct.stockQuantity ?? 100} {restockModalProduct.unit || 'units'}</strong> left</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 font-headings">
                                            Quantity to Add <span className="text-emerald-700">({restockModalProduct.unit || 'units'})</span>
                                        </label>
                                        
                                        {/* Quick Amount Selector Chips */}
                                        <div className="flex items-center gap-2 mb-2.5">
                                            {['25', '50', '100', '200'].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setRestockAmount(val)}
                                                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold font-headings border transition-all cursor-pointer ${
                                                        restockAmount === val
                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    +{val}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input
                                                type="number"
                                                min="1"
                                                value={restockAmount}
                                                onChange={(e) => setRestockAmount(e.target.value)}
                                                className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold text-slate-800"
                                                placeholder="Enter quantity to add..."
                                                required
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase font-mono pointer-events-none">
                                                {restockModalProduct.unit || 'units'}
                                            </span>
                                        </div>

                                        <p className="text-[11px] text-slate-500 mt-2 font-body">
                                            New total stock after restock: <strong className="text-emerald-700 font-bold">{(Number(restockModalProduct.stockQuantity ?? 100) + (parseInt(restockAmount) || 0))} {restockModalProduct.unit || 'units'}</strong>
                                        </p>
                                    </div>

                                    <div className="flex gap-2.5 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setRestockModalProduct(null)}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-headings"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSavingStock}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 cursor-pointer font-headings flex items-center justify-center gap-1.5"
                                        >
                                            {isSavingStock ? (
                                                <span>Updating Stock...</span>
                                            ) : (
                                                <>
                                                    <Check size={14} /> Confirm Restock
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </React.Fragment>
    );
}
