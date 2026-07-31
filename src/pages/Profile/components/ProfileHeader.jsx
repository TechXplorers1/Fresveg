import React, { useState } from 'react';
import { User, LogOut as LogOutIcon, Shield, Camera, Pencil, X, Check, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../context/AuthContext';
import ImageUploadField from '../../../components/common/ImageUploadField';

export default function ProfileHeader({
    userProfile,
    user,
    roleLabel,
    handleSignoutClick
}) {
    const { updateProfile } = useAuth();
    const [showEditPhotoModal, setShowEditPhotoModal] = useState(false);
    const [photoInput, setPhotoInput] = useState(userProfile?.photoURL || user?.photoURL || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenEditPhoto = () => {
        setPhotoInput(userProfile?.photoURL || user?.photoURL || '');
        setShowEditPhotoModal(true);
    };

    const handleSavePhoto = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateProfile({ photoURL: photoInput });
            setShowEditPhotoModal(false);
        } catch (err) {
            console.error('Failed to update profile photo:', err);
            alert('Failed to update profile photo: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const currentPhoto = userProfile?.photoURL || user?.photoURL;
    const displayName = userProfile?.displayName || user?.displayName || 'User Profile';

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-emerald-500/20 text-left mb-8 animate-fade-in">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-5">
                    {/* Avatar Container with Edit Overlay */}
                    <div className="relative group shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-xl shrink-0 overflow-hidden">
                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-emerald-400 font-extrabold text-2xl font-headings overflow-hidden">
                                {currentPhoto ? (
                                    <img src={currentPhoto} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    userProfile?.displayName ? displayName.charAt(0).toUpperCase() : <User size={30} />
                                )}
                            </div>
                        </div>
                        {/* Quick Camera Edit Button */}
                        <button
                            type="button"
                            onClick={handleOpenEditPhoto}
                            className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900 transition-all hover:scale-110 cursor-pointer"
                            title="Edit Profile Photo"
                        >
                            <Camera size={13} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-3xl font-black font-headings text-white tracking-tight">
                                {displayName}
                            </h1>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 font-mono">
                                <Shield size={12} /> {roleLabel}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 font-medium font-body">
                            {user?.email || userProfile?.email}
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenEditPhoto}
                            className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1 cursor-pointer pt-0.5 font-headings"
                        >
                            <Pencil size={11} /> Choose Profile Photo
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button
                        onClick={handleSignoutClick}
                        className="bg-white/10 hover:bg-rose-600/80 text-white border border-white/20 hover:border-rose-500 px-4 py-2.5 rounded-2xl text-xs font-bold font-headings transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <LogOutIcon size={16} /> Signout
                    </button>
                </div>
            </div>

            {/* Profile Photo Upload Modal */}
            {showEditPhotoModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up text-slate-800" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-base">
                                    <Camera size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 font-headings">
                                        Update Profile Photo
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Choose a local file or enter image URL</p>
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

                        <form onSubmit={handleSavePhoto} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-headings">
                                    Profile Image (File or URL)
                                </label>
                                <ImageUploadField
                                    value={photoInput}
                                    onChange={(val) => setPhotoInput(val)}
                                    inputClassName="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs font-body"
                                    placeholder="https://images.unsplash.com/photo-..."
                                    accentColor="emerald"
                                    id="profile-header-photo-input"
                                />
                            </div>

                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditPhotoModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer font-headings"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Save Photo</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
