import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';

export default function EditPhotoModal({
    showEditPhotoModal,
    setShowEditPhotoModal,
    photoToEdit,
    handleSaveEditedPhoto,
    isSubmitting = false,
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    const [url, setUrl] = useState('');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (photoToEdit) {
            setUrl(photoToEdit.url || photoToEdit.src || '');
            setCaption(photoToEdit.caption || photoToEdit.title || '');
        }
    }, [photoToEdit]);

    if (!showEditPhotoModal || !photoToEdit) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!url.trim()) {
            alert('Please enter or upload an image.');
            return;
        }
        handleSaveEditedPhoto({
            ...photoToEdit,
            url: url.trim(),
            caption: caption.trim() || 'Farm Photo'
        });
    };

    const CATEGORY_TAGS = [
        { label: '🌾 Crop & Harvest', tag: 'Organic Crop Harvest' },
        { label: '🍎 Fruit Orchard', tag: 'Fruit Orchard & Trees' },
        { label: '🐄 Livestock & Cattle', tag: 'Livestock & Farm Animals' },
        { label: '🛖 Stay & Clay Hut', tag: 'Eco Farm Stay & Huts' },
        { label: '🎈 Kids Activity', tag: 'Kids Play & Entertainments' },
        { label: '🌅 Farm Sunset View', tag: 'Farm Sunset & Scenic View' }
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-base">
                            <Pencil size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900 font-headings">Edit Photo Details</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Replace image file or update caption text</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowEditPhotoModal(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Live Preview of image being edited */}
                    {url && (
                        <div className="relative h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                            <img src={url} alt="Current Preview" className="max-h-full max-w-full object-contain" />
                            <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-xs">
                                Current Image
                            </span>
                        </div>
                    )}

                    {/* Image Upload / URL Input */}
                    <div>
                        <label className={labelCls}>Image URL or File Upload <span className="text-emerald-600 font-bold">*</span></label>
                        <ImageUploadField
                            value={url}
                            onChange={(val) => setUrl(val)}
                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                            placeholder="https://images.unsplash.com/photo-..."
                            accentColor="emerald"
                            id="edit-photo-input"
                        />
                    </div>

                    {/* Quick Category Chips */}
                    <div>
                        <label className={labelCls}>Select Category Tag</label>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {CATEGORY_TAGS.map((cat, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setCaption(cat.tag)}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer active:scale-95 ${
                                        caption === cat.tag
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Caption Input */}
                    <div>
                        <label className={labelCls}>Caption / Description</label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className={inputCls.replace('pl-10', 'px-4')}
                            placeholder="E.g. Strawberry Harvest, Guest Mud Hut, Sunset View"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setShowEditPhotoModal(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
