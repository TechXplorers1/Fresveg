import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProductCategoryCarousel component
 * Displays the horizontal scrolling carousel of product category tiles.
 */
export default function ProductCategoryCarousel({
  categoriesTilesRef,
  activeCategory,
  onCategoryClick,
  categoriesWithDetails = [],
  onScrollLeft,
  onScrollRight,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) {
  const allCategoriesList = [
    {
      name: 'All Categories',
      isAll: true,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'
    },
    ...categoriesWithDetails
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 font-headings">
            🥦 Product Categories
          </h2>
          {activeCategory !== 'All' && (
            <button
              type="button"
              onClick={() => onCategoryClick('All')}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer font-headings"
            >
              Clear ({activeCategory})
            </button>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onScrollLeft}
            className="w-8 h-8 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onScrollRight}
            className="w-8 h-8 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={categoriesTilesRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="flex gap-5 overflow-x-auto -mx-4 px-4 pt-3 pb-5 scrollbar-hide snap-x scroll-pl-4 scroll-pr-4 items-center select-none cursor-grab active:cursor-grabbing"
      >
        {allCategoriesList.map((cat, idx) => {
          const isAllTile = cat.isAll;
          const isSelected = isAllTile ? activeCategory === 'All' : activeCategory === cat.name;
          const displayName = isAllTile ? 'ALL' : cat.name;

          return (
            <button
              key={cat.name || idx}
              onClick={() => onCategoryClick(isAllTile ? 'All' : cat.name)}
              className={`flex-shrink-0 w-28 first:ml-2 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-emerald-600 bg-emerald-50/80 border-emerald-500 scale-102 shadow-md'
                  : ''
              }`}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm flex items-center justify-center bg-slate-100">
                <img
                  src={cat.image || '/cherry_tomatoes.png'}
                  alt={displayName}
                  data-no-modal="true"
                  className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300 no-modal"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80';
                  }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-gray-700 font-extrabold truncate max-w-[90px] text-center font-headings">
                {displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
