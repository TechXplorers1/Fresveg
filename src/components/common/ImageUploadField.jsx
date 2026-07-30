import React, { useRef } from 'react';

/**
 * ImageUploadField — Reusable component that lets users EITHER:
 *  1. Type / paste an image URL into the text input, OR
 *  2. Click "Choose File" to upload a local image file (converted to Base64 data URL)
 *
 * Props:
 *  - value          {string}   Current image URL or base64 data URL
 *  - onChange       {function} Called with new string value when URL typed or file chosen
 *  - placeholder    {string}   Placeholder text for the URL input
 *  - inputClassName {string}   Extra CSS classes for the text input
 *  - label          {string}   Optional label text (renders above if provided)
 *  - required       {boolean}  Marks the URL input as required
 *  - accentColor    {string}   Tailwind color stem for the Choose File button (default: 'emerald')
 *  - id             {string}   Optional id for the hidden file input
 */
export default function ImageUploadField({
    value = '',
    onChange,
    placeholder = 'https://images.unsplash.com/photo-...',
    inputClassName = '',
    label,
    required = false,
    accentColor = 'emerald',
    id,
}) {
    const fileInputRef = useRef(null);
    const uniqueId = id || `img-upload-${Math.random().toString(36).slice(2, 8)}`;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file (JPG, PNG, GIF, WEBP, etc.)');
            return;
        }

        // Warn if > 2MB (base64 can be large)
        if (file.size > 2 * 1024 * 1024) {
            const proceed = window.confirm(
                `This image is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large files may slow down the app. Continue?`
            );
            if (!proceed) return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result && onChange) {
                onChange(ev.target.result);
            }
        };
        reader.readAsDataURL(file);

        // Reset the file input so same file can be re-selected
        e.target.value = '';
    };

    const btnColors = {
        emerald: 'bg-emerald-600 hover:bg-emerald-700 ring-emerald-500/30',
        amber:   'bg-amber-600   hover:bg-amber-700   ring-amber-500/30',
        teal:    'bg-teal-600    hover:bg-teal-700    ring-teal-500/30',
        purple:  'bg-purple-600  hover:bg-purple-700  ring-purple-500/30',
        rose:    'bg-rose-600    hover:bg-rose-700    ring-rose-500/30',
        slate:   'bg-slate-700   hover:bg-slate-800   ring-slate-500/30',
        brand:   'bg-brand       hover:bg-brand-dark  ring-brand/30',
    };

    const btnCls = btnColors[accentColor] || btnColors.emerald;

    return (
        <div className="space-y-2">
            {/* Input row: URL text input + Choose File button */}
            <div className="flex items-center gap-2">
                {/* URL Text Input */}
                <input
                    type="text"
                    value={value}
                    required={required}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    placeholder={placeholder}
                    className={`flex-1 min-w-0 ${inputClassName}`}
                />

                {/* Choose File Button */}
                <label
                    htmlFor={uniqueId}
                    title="Upload a local image file"
                    className={`
                        shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold
                        cursor-pointer transition-all active:scale-95 shadow-sm
                        ${btnCls}
                    `}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    {/* Paperclip icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Choose File
                    <input
                        id={uniqueId}
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            {/* Live Preview Thumbnail */}
            {value && value.trim() && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 animate-fade-in">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                        <img
                            src={value}
                            alt="Preview"
                            className="max-w-full max-h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <span
                            className="text-slate-300 text-xl hidden items-center justify-center w-full h-full"
                            aria-hidden
                        >
                            🖼
                        </span>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-700">
                            {value.startsWith('data:') ? '📎 Local File Uploaded' : '🔗 Image URL Set'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {value.startsWith('data:')
                                ? `${(value.length * 0.75 / 1024).toFixed(0)} KB (base64)`
                                : value.length > 50
                                    ? value.slice(0, 47) + '...'
                                    : value}
                        </p>
                    </div>
                    {/* Clear button */}
                    <button
                        type="button"
                        onClick={() => onChange && onChange('')}
                        className="ml-auto text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-1 rounded-lg hover:bg-rose-50"
                        title="Clear image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
