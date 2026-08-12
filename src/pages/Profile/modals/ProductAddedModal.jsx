import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ProductAddedModal({
    successModalData,
    setSuccessModalData
}) {
    if (!successModalData) return null;

    return (
        <React.Fragment>
            {/* Custom Success Popup Modal */}
            {successModalData && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 space-y-6 text-center animate-scale-up">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200/60">
                            <CheckCircle size={32} />
                        </div>

                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                                {successModalData.title || 'Success!'}
                            </h3>
                            <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed font-body">
                                {successModalData.message}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setSuccessModalData(null)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                            >
                                Okay, Great!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}
