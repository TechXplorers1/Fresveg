import React from 'react';
import { Star } from 'lucide-react';

/**
 * MarketplaceSidebarFilters component
 * Renders the filter sidebar containing:
 * - Sort options (Recommended, Price low-to-high, Price high-to-low, Highest Rated)
 * - Vitamins dropdown filter
 * - Price range checkboxes
 * - Rating checkboxes
 * - Discount percentage checkboxes
 */
export default function MarketplaceSidebarFilters({
  showFilters,
  setShowFilters,
  sortBy,
  setSortBy,
  selectedVitamin,
  setSelectedVitamin,
  priceRanges,
  setPriceRanges,
  ratingFilters,
  setRatingFilters,
  discountFilters,
  setDiscountFilters,
  onClearAll,
  hasActiveFilters
}) {
  return (
    <div className="w-full lg:w-56 shrink-0 text-left lg:sticky lg:top-24 h-fit">
      <div className="bg-white/70 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-xl shadow-emerald-950/[0.02] border border-white max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h3 className="text-base font-extrabold text-gray-900 font-headings">Filters</h3>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-1.5 text-[11px] font-extrabold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Hide
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 text-[11px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer font-headings"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">
              Sort By
            </label>
            {sortBy !== 'none' && (
              <button
                type="button"
                onClick={() => setSortBy('none')}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1.5 font-body">
            <button
              onClick={() => setSortBy('none')}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'none'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setSortBy('price-low')}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'price-low'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Price: Low to High
            </button>
            <button
              onClick={() => setSortBy('price-high')}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'price-high'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Price: High to Low
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                sortBy === 'rating'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Highest Rated
            </button>
          </div>
        </div>

        {/* Vitamins Dropdown */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings flex items-center gap-1">
              🧪 Vitamins
            </label>
            {selectedVitamin !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedVitamin('All')}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="font-body">
            <select
              value={selectedVitamin}
              onChange={(e) => setSelectedVitamin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-xs"
            >
              <option value="All">All Vitamins</option>
              <option value="Vitamin A">Vitamin A</option>
              <option value="Vitamin B">Vitamin B</option>
              <option value="Vitamin C">Vitamin C</option>
              <option value="Vitamin D">Vitamin D</option>
              <option value="Vitamin E">Vitamin E</option>
              <option value="Vitamin K">Vitamin K</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">
              Price Range
            </label>
            {priceRanges.length > 0 && (
              <button
                type="button"
                onClick={() => setPriceRanges([])}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2.5 font-body">
            {[
              { id: 'under5', label: 'Under ₹50' },
              { id: '5to10', label: '₹50 - ₹100' },
              { id: '10to20', label: '₹100 - ₹200' },
              { id: 'over20', label: 'Over ₹200' }
            ].map(({ id, label }) => (
              <label key={id} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={priceRanges.includes(id)}
                  onChange={(e) => {
                    if (e.target.checked) setPriceRanges([...priceRanges, id]);
                    else setPriceRanges(priceRanges.filter((r) => r !== id));
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">
              Rating
            </label>
            {ratingFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setRatingFilters([])}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2.5 font-body">
            {['4.5', '4.0', '3.5'].map((r) => (
              <label key={r} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ratingFilters.includes(r)}
                  onChange={(e) => {
                    if (e.target.checked) setRatingFilters([...ratingFilters, r]);
                    else setRatingFilters(ratingFilters.filter((item) => item !== r));
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors flex items-center">
                  <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> {r} & above
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">
              Discount
            </label>
            {discountFilters.length > 0 && (
              <button
                type="button"
                onClick={() => setDiscountFilters([])}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-2.5 font-body">
            {[
              { id: '10', label: '10% or more' },
              { id: '20', label: '20% or more' }
            ].map(({ id, label }) => (
              <label key={id} className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={discountFilters.includes(id)}
                  onChange={(e) => {
                    if (e.target.checked) setDiscountFilters([...discountFilters, id]);
                    else setDiscountFilters(discountFilters.filter((d) => d !== id));
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
