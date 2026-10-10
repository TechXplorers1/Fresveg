import React from 'react';
import { Star, X } from 'lucide-react';

/**
 * FarmReviewModal Component
 * Modal for submitting verified customer reviews and ratings with optional photo upload.
 */
export default function FarmReviewModal({
  showAddReviewModal,
  setShowAddReviewModal,
  newReviewForm,
  setNewReviewForm,
  handleSaveCustomerReview
}) {
  if (!showAddReviewModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity"
      onClick={() => setShowAddReviewModal(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
            ⭐ Leave a Verified Customer Review
          </h3>
          <button
            type="button"
            onClick={() => setShowAddReviewModal(false)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveCustomerReview} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
              Star Rating
            </label>
            <div className="flex items-center gap-2 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/80">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReviewForm({ ...newReviewForm, rating: star })}
                  className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    size={24}
                    className={star <= newReviewForm.rating ? 'fill-current text-amber-400' : 'text-slate-300'}
                  />
                </button>
              ))}
              <span className="text-xs font-black text-amber-900 ml-2 font-mono">
                {newReviewForm.rating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
              Your Review & Feedback *
            </label>
            <textarea
              required
              rows="3"
              value={newReviewForm.comment}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
              placeholder="Share your farm experience, fresh produce quality, or stay details..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body resize-none"
            ></textarea>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
              Attach Farm Visit Photo URL (Optional)
            </label>
            <input
              type="text"
              value={newReviewForm.photoUrl}
              onChange={(e) => setNewReviewForm({ ...newReviewForm, photoUrl: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddReviewModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
