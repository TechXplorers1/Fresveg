import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

const INITIAL_ACCOMMODATIONS = [
    'Farmhouse Guest Rooms',
    'Traditional Clay Huts',
    'Camping Tents under Stars',
    'Hammocks Under Banyan Trees',
    'Treehouse Canopy Stay'
];

const EXTRA_ACCOMMODATIONS = [
    'Luxury Eco Cottage',
    'River Stream Glamping Pod',
    'Wooden Bamboo Cabins',
    'Solar Powered Villa',
    'Heritage Farm Suite'
];

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
    const [manualTitleInput, setManualTitleInput] = useState('');
    const [showMoreAccommodations, setShowMoreAccommodations] = useState(false);

    if (!showAddStayModal) return null;

    const currentTitle = newStayForm.name || newStayForm.title || '';

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 text-left animate-scale-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                    {/* 1. Stay Title Section matching Crops/Produce UI Pattern from image */}
                    <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-left">
                        {/* Header */}
                        <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-600 font-headings">
                            <span>🛖 STAY TITLE / ACCOMMODATION TYPE *</span>
                        </div>

                        {/* Selected Stay Title Tag Display */}
                        {currentTitle && (
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs">
                                    🛖 {currentTitle}
                                    <button
                                        type="button"
                                        onClick={() => setNewStayForm(prev => ({ ...prev, name: '', title: '' }))}
                                        className="text-white hover:text-rose-200 font-black cursor-pointer text-sm leading-none"
                                        title="Clear title"
                                    >
                                        ×
                                    </button>
                                </span>
                            </div>
                        )}

                        {/* Manual Input Row with + Add Button */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={manualTitleInput}
                                onChange={(e) => setManualTitleInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (manualTitleInput.trim()) {
                                            setNewStayForm(prev => ({ ...prev, name: manualTitleInput.trim(), title: manualTitleInput.trim() }));
                                            setManualTitleInput('');
                                        }
                                    }
                                }}
                                placeholder="Type stay name and press Enter (e.g. Mud Huts, Camping Tents)..."
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-medium font-body flex-1"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (manualTitleInput.trim()) {
                                        setNewStayForm(prev => ({ ...prev, name: manualTitleInput.trim(), title: manualTitleInput.trim() }));
                                        setManualTitleInput('');
                                    }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                            >
                                + Add
                            </button>
                        </div>

                        {/* 2. Suggested Chips Section */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-headings">
                                    SUGGESTED STAY OPTIONS (CLICK TO SELECT):
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowMoreAccommodations(!showMoreAccommodations)}
                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                                >
                                    {showMoreAccommodations ? 'Show Less' : `+ Others (${EXTRA_ACCOMMODATIONS.length} more)`}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {(showMoreAccommodations ? [...INITIAL_ACCOMMODATIONS, ...EXTRA_ACCOMMODATIONS] : INITIAL_ACCOMMODATIONS).map((chip, idx) => {
                                    const isSelected = currentTitle.toLowerCase().trim() === chip.toLowerCase().trim();
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setNewStayForm(prev => ({ ...prev, name: '', title: '' }));
                                                } else {
                                                    setNewStayForm(prev => ({ ...prev, name: chip, title: chip }));
                                                }
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${isSelected
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                                                }`}
                                        >
                                            <span>{chip}</span>
                                            {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 3. Quantity of Rooms & Room Capacity (Guests) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                        <div>
                            <label className={labelCls}>Quantity of Rooms *</label>
                            <input
                                type="text"
                                value={newStayForm.roomQuantity || '1 Room'}
                                onChange={(e) => setNewStayForm({ ...newStayForm, roomQuantity: e.target.value })}
                                placeholder="E.g. 2 Rooms or 5 Huts"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {['1 Room', '2 Rooms', '3 Rooms', '4 Rooms', '5 Rooms', '10 Rooms'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setNewStayForm({ ...newStayForm, roomQuantity: opt })}
                                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold border transition-all cursor-pointer ${
                                            (newStayForm.roomQuantity || '1 Room') === opt
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={labelCls}>Room Capacity (Guests) *</label>
                            <input
                                type="text"
                                value={newStayForm.roomCapacity || '2 Persons'}
                                onChange={(e) => setNewStayForm({ ...newStayForm, roomCapacity: e.target.value })}
                                placeholder="E.g. 2 Persons or 4 Persons"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {['1 Person', '2 Persons', '3 Persons', '4 Persons', '5+ Persons'].map(cap => (
                                    <button
                                        key={cap}
                                        type="button"
                                        onClick={() => setNewStayForm({ ...newStayForm, roomCapacity: cap })}
                                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold border transition-all cursor-pointer ${
                                            (newStayForm.roomCapacity || '2 Persons') === cap
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400'
                                        }`}
                                    >
                                        {cap}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Stay / Accommodation Price */}
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
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {['Free', '500', '1000', '1500', '2000'].map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setNewStayForm({ ...newStayForm, price: p === 'Free' ? '' : p })}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                >
                                    {p === 'Free' ? 'Free' : `₹${p}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stay Photo */}
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

                    {/* 5. Short Description */}
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
