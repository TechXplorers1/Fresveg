import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Camera, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import ImageUploadField from '../../../components/common/ImageUploadField';

const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
];

export default function MyDetailsTab({ activeTab }) {
    const { user, userProfile, updateProfile } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (user || userProfile) {
            setFullName(userProfile?.displayName || user?.displayName || '');
            setEmail(user?.email || userProfile?.email || '');
            setPhone(userProfile?.phone || userProfile?.phoneNumber || user?.phoneNumber || '');
            setPhotoURL(userProfile?.photoURL || user?.photoURL || '');
        }
    }, [user, userProfile]);

    if (activeTab !== 'details') return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setErrorMsg('');
        setSaveSuccess(false);

        try {
            await updateProfile({
                displayName: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                phoneNumber: phone.trim(),
                photoURL: photoURL.trim()
            });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err) {
            console.error('Failed to update details:', err);
            setErrorMsg(err.message || 'Failed to save details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const roleLabel = (userProfile?.role || 'customer').toUpperCase();
    const roleBadgeColor =
        userProfile?.role === 'vendor'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : userProfile?.role === 'delivery_person'
            ? 'bg-teal-50 text-teal-800 border-teal-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200';

    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in text-left max-w-4xl">
            {/* Tab Title Header */}
            <div className="flex items-center gap-3.5 mb-8 border-b border-slate-100 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100/60 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                    <User size={22} />
                </div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black font-headings text-slate-800">
                        My Profile & Account Details
                    </h2>
                    <p className="text-xs text-slate-400 font-medium font-body mt-0.5">
                        Manage your profile picture, personal information, and contact details
                    </p>
                </div>
            </div>

            {saveSuccess && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 font-headings animate-fade-in shadow-xs">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>Profile details updated successfully!</span>
                </div>
            )}

            {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 font-headings animate-fade-in">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* 1. Avatar Photo Section */}
                <div className="bg-slate-50/70 border border-slate-200/80 p-5 sm:p-6 rounded-2xl space-y-4">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block font-headings flex items-center gap-1.5">
                        <Camera size={14} className="text-emerald-600" /> Avatar Profile Photo
                    </label>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar Display */}
                        <div className="relative group shrink-0">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-1 shadow-lg overflow-hidden">
                                <div className="w-full h-full bg-slate-900 rounded-[12px] flex items-center justify-center text-white font-extrabold text-3xl font-headings overflow-hidden">
                                    {photoURL ? (
                                        <img src={photoURL} alt={fullName} className="w-full h-full object-cover" />
                                    ) : fullName ? (
                                        fullName.charAt(0).toUpperCase()
                                    ) : (
                                        <User size={36} className="text-emerald-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Input & Presets */}
                        <div className="flex-1 w-full space-y-3">
                            <ImageUploadField
                                value={photoURL}
                                onChange={(val) => setPhotoURL(val)}
                                label="Upload Photo or Paste Image URL"
                                inputClassName="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body"
                                placeholder="https://images.unsplash.com/photo-..."
                                accentColor="emerald"
                                id="my-details-avatar-input"
                            />

                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-headings mb-1.5">
                                    Or choose a fresh avatar preset:
                                </span>
                                <div className="flex items-center gap-2">
                                    {PRESET_AVATARS.map((url, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setPhotoURL(url)}
                                            className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                                photoURL === url
                                                    ? 'border-emerald-600 scale-110 shadow-md ring-2 ring-emerald-500/20'
                                                    : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Personal Information Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-headings mb-1.5 flex items-center gap-1.5">
                            <User size={13} className="text-emerald-600" /> Full Name
                        </label>
                        <input
                            required
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-headings"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email Address */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-headings mb-1.5 flex items-center gap-1.5">
                            <Mail size={13} className="text-emerald-600" /> Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-body"
                            placeholder="your.email@example.com"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-headings mb-1.5 flex items-center gap-1.5">
                            <Phone size={13} className="text-emerald-600" /> Contact Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Role Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block font-headings mb-1.5 flex items-center gap-1.5">
                            <Shield size={13} className="text-emerald-600" /> Account Role / Permission
                        </label>
                        <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between font-headings ${roleBadgeColor}`}>
                            <span className="font-extrabold text-xs tracking-wider">{roleLabel}</span>
                            <span className="text-[10px] font-bold opacity-80 uppercase font-mono">Verified Role</span>
                        </div>
                    </div>
                </div>

                {/* Save Changes Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-7 py-3 rounded-2xl text-xs font-extrabold font-headings transition-all duration-300 active:scale-95 shadow-lg shadow-emerald-900/15 flex items-center gap-2 cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={15} />
                                <span>Save Account Details</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
