import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut as LogOutIcon } from 'lucide-react';

export default function SignoutConfirmModal({
    showSignoutConfirm,
    setShowSignoutConfirm,
    handleConfirmLogout
}) {
    if (!showSignoutConfirm) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6 text-center animate-scale-up">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-rose-100">
                    <LogOutIcon size={30} className="ml-1" />
                </div>

                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                        Confirm Signout
                    </h3>
                    <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed font-body">
                        Are you sure you want to Signout?
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleConfirmLogout}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                    >
                        Yes, Signout
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowSignoutConfirm(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
