import React from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

export default function AddGalleryModal({
    showAddGalleryModal,
    setShowAddGalleryModal,
    newGalleryForm,
    setNewGalleryForm,
    handleAddGalleryPhoto,
    labelCls,
    inputCls
}) {
    if (!showAddGalleryModal) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-base">
                            <ImageIcon size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 font-headings">Add Farm Photo</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Add photos of your fields, crops, or stays</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowAddGalleryModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleAddGalleryPhoto} className="space-y-4">
                    {/* Photo URL Input using ImageUploadField */}
                    <div>
                        <label className={labelCls}>Photo Image <span className="text-emerald-600 font-bold">*</span></label>
                        <ImageUploadField
                            value={newGalleryForm.url}
                            onChange={(val) => setNewGalleryForm({ ...newGalleryForm, url: val })}
                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                            placeholder="https://images.unsplash.com/photo-..."
                            accentColor="emerald"
                            id="gallery-photo-input"
                        />
                    </div>

                    {/* Photo Caption */}
                    <div>
                        <label className={labelCls}>Caption / Section Tag <span className="text-slate-400 font-normal text-[11px]">(Optional)</span></label>
                        <input
                            type="text"
                            value={newGalleryForm.caption}
                            onChange={(e) => setNewGalleryForm({ ...newGalleryForm, caption: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-4')}
                            placeholder="E.g. Strawberry Harvest, Guest Mud Hut, Sunset View"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowAddGalleryModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer"
                        >
                            + Add to Gallery
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
