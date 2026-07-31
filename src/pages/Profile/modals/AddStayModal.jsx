import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Loader2 } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

export default function AddStayModal({
    showAddStayModal,
    setShowAddStayModal,
    editingStayIndex,
    setEditingStayIndex,
    newStayForm,
    setNewStayForm,
    handleSaveStay,
    isSubmitting = false,
    labelCls,
    inputCls
}) {
    if (!showAddStayModal) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-base">
                            🛖
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 font-headings">
                                {editingStayIndex !== null ? 'Edit Stay Accommodation' : 'Add Stay Accommodation'}
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium">Add stay options like rooms, mud huts, tents, or cottages</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setShowAddStayModal(false); setEditingStayIndex(null); }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSaveStay} className="space-y-4 text-left">
                    {/* Stay Name */}
                    <div>
                        <label className={labelCls}>Stay Option / Room Name <span className="text-amber-600 font-bold">*</span></label>
                        <input
                            required
                            type="text"
                            value={newStayForm.name}
                            onChange={(e) => setNewStayForm({ ...newStayForm, name: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-4')}
                            placeholder="E.g. Farmhouse Guest Room, Eco Mud Hut, Glamping Tent"
                        />
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                            {['Farmhouse Room', 'Rustic Mud Hut', 'Camping Tent', 'Treehouse Stay', 'Luxury Villa', 'Glamping Pod'].map((preset, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setNewStayForm(prev => ({ ...prev, name: preset }))}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                >
                                    + {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stay Price per Night */}
                    <div>
                        <label className={labelCls}>Stay Price per Night (₹) <span className="text-slate-400 font-normal text-[11px]">(Leave blank if free)</span></label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={newStayForm.price}
                                onChange={(e) => setNewStayForm({ ...newStayForm, price: e.target.value })}
                                className={inputCls}
                                placeholder="E.g. 1500"
                            />
                        </div>
                    </div>

                    {/* Stay Photo (ImageUploadField) */}
                    <div>
                        <label className={labelCls}>Stay Photo</label>
                        <ImageUploadField
                            value={newStayForm.image}
                            onChange={(val) => setNewStayForm({ ...newStayForm, image: val })}
                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                            placeholder="https://images.unsplash.com/photo-..."
                            accentColor="amber"
                            id="stay-photo-modal-input"
                        />
                    </div>

                    {/* Short Description */}
                    <div>
                        <label className={labelCls}>Description / Amenities <span className="text-slate-400 font-normal text-[11px]">(Optional)</span></label>
                        <textarea
                            rows="2"
                            value={newStayForm.description}
                            onChange={(e) => setNewStayForm({ ...newStayForm, description: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-4') + ' py-2 resize-none'}
                            placeholder="E.g. Cozy air-conditioned room with private veranda facing organic fields..."
                        />
                    </div>

                    {/* Modal Buttons */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => { setShowAddStayModal(false); setEditingStayIndex(null); }}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                editingStayIndex !== null ? 'Update Stay' : '+ Save Stay'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
