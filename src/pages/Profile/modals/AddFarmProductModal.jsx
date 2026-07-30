import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';
import { SUB_CATEGORIES_MAP, STANDARD_UNITS } from '../constants/profileConstants';

export default function AddFarmProductModal({
    showAddFarmProductModal,
    setShowAddFarmProductModal,
    editingModalProductIndex,
    setEditingModalProductIndex,
    newFarmProductForm,
    setNewFarmProductForm,
    handleSaveModalProduct,
    labelCls,
    inputCls
}) {
    if (!showAddFarmProductModal) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-base">
                            🧺
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 font-headings">
                                {editingModalProductIndex !== null ? 'Edit Farm Product' : 'Add Farm Product'}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">Add or customize product for direct purchase</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowAddFarmProductModal(false); setEditingModalProductIndex(null); }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSaveModalProduct} className="space-y-4">
                    {/* Product Name */}
                    <div>
                        <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                        <input
                            required
                            type="text"
                            value={newFarmProductForm.name}
                            onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, name: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-4')}
                            placeholder="E.g. Fresh Organic Strawberries"
                        />
                    </div>

                    {/* Category & Sub-Category Linked Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Category */}
                        <div>
                            <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                            <select
                                value={newFarmProductForm.category}
                                onChange={(e) => {
                                    const selectedCat = e.target.value;
                                    const subCatList = SUB_CATEGORIES_MAP[selectedCat] || [];
                                    const firstSub = subCatList[0] || '';
                                    setNewFarmProductForm(prev => ({
                                        ...prev,
                                        category: selectedCat,
                                        subCategory: firstSub,
                                        name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? firstSub : prev.name
                                    }));
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs transition-all bg-white font-body"
                            >
                                {Object.keys(SUB_CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Sub-Category */}
                        <div>
                            <label className={labelCls}>Sub-Category <span className="text-emerald-600 font-bold">*</span></label>
                            <select
                                value={newFarmProductForm.subCategory}
                                onChange={(e) => {
                                    const selectedSubCat = e.target.value;
                                    setNewFarmProductForm(prev => ({
                                        ...prev,
                                        subCategory: selectedSubCat,
                                        name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? selectedSubCat : prev.name
                                    }));
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs transition-all bg-white font-body"
                            >
                                {(SUB_CATEGORIES_MAP[newFarmProductForm.category || 'Vegetables'] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Cost / Price */}
                        <div>
                            <label className={labelCls}>Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                            <input
                                required
                                type="number"
                                min="1"
                                value={newFarmProductForm.price}
                                onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, price: e.target.value })}
                                className={inputCls.replace('pl-10', 'px-4')}
                                placeholder="120"
                            />
                        </div>

                        {/* Unit Select */}
                        <div>
                            <label className={labelCls}>Unit <span className="text-emerald-600 font-bold">*</span></label>
                            <select
                                value={newFarmProductForm.unit}
                                onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, unit: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs transition-all bg-white font-body"
                            >
                                {STANDARD_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                    </div>

                    {newFarmProductForm.unit === 'custom' && (
                        <div>
                            <label className={labelCls}>Custom Unit Name</label>
                            <input
                                type="text"
                                value={newFarmProductForm.customUnit || ''}
                                onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, customUnit: e.target.value })}
                                className={inputCls.replace('pl-10', 'px-4')}
                                placeholder="E.g. tray, basket, bunch"
                            />
                        </div>
                    )}

                    {/* Product Image URL */}
                    <div>
                        <label className={labelCls}>Product Image</label>
                        <ImageUploadField
                            value={newFarmProductForm.image}
                            onChange={(val) => setNewFarmProductForm({ ...newFarmProductForm, image: val })}
                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                            placeholder="https://images.unsplash.com/photo-..."
                            accentColor="emerald"
                            id="farm-product-image-input"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => { setShowAddFarmProductModal(false); setEditingModalProductIndex(null); }}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer"
                        >
                            {editingModalProductIndex !== null ? 'Update Product' : '+ Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
