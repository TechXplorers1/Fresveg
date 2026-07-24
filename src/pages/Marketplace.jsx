import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Star, Search, Filter, Plus, Minus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';

export default function Marketplace() {
   const { cartItems, addToCart, updateQuantity } = useCart();
   const { products, searchQuery, setSearchQuery } = useProducts();
   const navigate = useNavigate();
   const [activeCategory, setActiveCategory] = useState('All');
   const [sortBy, setSortBy] = useState('none');

   // Filter states
   const [priceRanges, setPriceRanges] = useState([]);
   const [ratingFilters, setRatingFilters] = useState([]);
   const [selectedBrands, setSelectedBrands] = useState([]);
   const [discountFilters, setDiscountFilters] = useState([]);
   const [showFilters, setShowFilters] = useState(true);

   // Reset search query when entering or leaving Marketplace page
   useEffect(() => {
      setSearchQuery('');
      return () => {
         setSearchQuery('');
      };
   }, [setSearchQuery]);

   // Refs & mouse drag state for category carousels
   const categoriesTilesRef = useRef(null);
   const categoryPillsRef = useRef(null);

   const [isMouseDownTiles, setIsMouseDownTiles] = useState(false);
   const [startXPointerTiles, setStartXPointerTiles] = useState(0);
   const [scrollLeftStartTiles, setScrollLeftStartTiles] = useState(0);

   const [isMouseDownPills, setIsMouseDownPills] = useState(false);
   const [startXPointerPills, setStartXPointerPills] = useState(0);
   const [scrollLeftStartPills, setScrollLeftStartPills] = useState(0);

   // Non-passive wheel listeners to convert vertical mouse wheel scrolling into horizontal carousel sliding
   useEffect(() => {
      const tilesEl = categoriesTilesRef.current;
      const pillsEl = categoryPillsRef.current;

      const onWheelTiles = (e) => {
         if (tilesEl && e.deltaY !== 0) {
            e.preventDefault();
            tilesEl.scrollLeft += e.deltaY * 1.2;
         }
      };

      const onWheelPills = (e) => {
         if (pillsEl && e.deltaY !== 0) {
            e.preventDefault();
            pillsEl.scrollLeft += e.deltaY * 1.2;
         }
      };

      if (tilesEl) tilesEl.addEventListener('wheel', onWheelTiles, { passive: false });
      if (pillsEl) pillsEl.addEventListener('wheel', onWheelPills, { passive: false });

      return () => {
         if (tilesEl) tilesEl.removeEventListener('wheel', onWheelTiles);
         if (pillsEl) pillsEl.removeEventListener('wheel', onWheelPills);
      };
   }, []);

   // Arrow button click scroll helper
   const scrollRow = (refEl, direction) => {
      if (refEl.current) {
         const scrollAmount = direction === 'left' ? -300 : 300;
         refEl.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
   };

   // Drag handlers for Browse Categories tiles
   const handleMouseDownTiles = (e) => {
      if (!categoriesTilesRef.current) return;
      setIsMouseDownTiles(true);
      setStartXPointerTiles(e.pageX - categoriesTilesRef.current.offsetLeft);
      setScrollLeftStartTiles(categoriesTilesRef.current.scrollLeft);
   };

   const handleMouseMoveTiles = (e) => {
      if (!isMouseDownTiles || !categoriesTilesRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoriesTilesRef.current.offsetLeft;
      const walk = (x - startXPointerTiles) * 1.5;
      categoriesTilesRef.current.scrollLeft = scrollLeftStartTiles - walk;
   };

   const handleMouseUpTiles = () => {
      setIsMouseDownTiles(false);
   };

   // Drag handlers for Category filter pills
   const handleMouseDownPills = (e) => {
      if (!categoryPillsRef.current) return;
      setIsMouseDownPills(true);
      setStartXPointerPills(e.pageX - categoryPillsRef.current.offsetLeft);
      setScrollLeftStartPills(categoryPillsRef.current.scrollLeft);
   };

   const handleMouseMovePills = (e) => {
      if (!isMouseDownPills || !categoryPillsRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoryPillsRef.current.offsetLeft;
      const walk = (x - startXPointerPills) * 1.5;
      categoryPillsRef.current.scrollLeft = scrollLeftStartPills - walk;
   };

   const handleMouseUpPills = () => {
      setIsMouseDownPills(false);
   };

   const handleCategoryClick = (category) => {
      setActiveCategory(category);
   };

   const filteredProducts = products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const vendorName = p.vendor || '';
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      // Price range filter
      const matchesPriceRange = priceRanges.length === 0 || priceRanges.some(range => {
         switch (range) {
            case 'under5': return p.price < 5;
            case '5to10': return p.price >= 5 && p.price < 10;
            case '10to20': return p.price >= 10 && p.price < 20;
            case 'over20': return p.price >= 20;
            default: return true;
         }
      });

      // Rating filter
      const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
         switch (rating) {
            case '4.5': return p.rating >= 4.5;
            case '4.0': return p.rating >= 4.0;
            case '3.5': return p.rating >= 3.5;
            default: return true;
         }
      });

      // Brand filter
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.vendor);

      // Discount filter
      const matchesDiscount = discountFilters.length === 0 || discountFilters.some(discount => {
         const discountPercent = Math.floor(Math.random() * 40); // Random discount for demo
         switch (discount) {
            case '10': return discountPercent >= 10;
            case '20': return discountPercent >= 20;
            case '30': return discountPercent >= 30;
            default: return true;
         }
      });

      return matchesCategory && matchesSearch && matchesPriceRange && matchesRating && matchesBrand && matchesDiscount;
   }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
   });

   return (
      <div className="flex flex-col min-h-screen py-12">

         {/* Category Tiles */}
         <section className="py-6 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  </h2>

                  {/* Navigation Controls for Mouse Users */}
                  <div className="flex items-center gap-2">
                     <button
                        type="button"
                        onClick={() => scrollRow(categoriesTilesRef, 'left')}
                        className="w-9 h-9 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Scroll Left"
                     >
                        <ChevronLeft size={18} />
                     </button>
                     <button
                        type="button"
                        onClick={() => scrollRow(categoriesTilesRef, 'right')}
                        className="w-9 h-9 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                        title="Scroll Right"
                     >
                        <ChevronRight size={18} />
                     </button>
                  </div>
               </div>

               <div
                  ref={categoriesTilesRef}
                  onMouseDown={handleMouseDownTiles}
                  onMouseMove={handleMouseMoveTiles}
                  onMouseUp={handleMouseUpTiles}
                  onMouseLeave={handleMouseUpTiles}
                  className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x items-center select-none cursor-grab active:cursor-grabbing"
               >
                  <button onClick={() => handleCategoryClick('Tomatoes')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="/cherry_tomatoes.png" alt="Tomatoes" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Tomatoes</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Potatoes')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="/sweet_potatoes.png" alt="Potatoes" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Potatoes</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Onions')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="/red_onions.png" alt="Onions" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Onions</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Brinjal')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="/fresh_brinjal.png" alt="Brinjal" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Brinjal</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Carrots')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80" alt="Carrots" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Carrots</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Spinach')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80" alt="Spinach" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Spinach</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Capsicum')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=200&q=80" alt="Capsicum" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Capsicum</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Broccoli')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=200&q=80" alt="Broccoli" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Broccoli</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Garlic')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80" alt="Garlic" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Garlic</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Apples')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=200&q=80" alt="Apples" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Apples</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Bananas')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80" alt="Bananas" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Bananas</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Strawberries')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80" alt="Strawberries" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Strawberries</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Oranges')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=200&q=80" alt="Oranges" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Oranges</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Milk')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80" alt="Milk" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Milk</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Butter')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="/salted_butter.png" alt="Butter" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Butter</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Cheese')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=200&q=80" alt="Cheese" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-700 font-bold">Cheese</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Yogurt')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?auto=format&fit=crop&w=200&q=80" alt="Yogurt" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Yogurt</span>
                  </button>
                  <button onClick={() => handleCategoryClick('Paneer')} className="flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start">
                     <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=200&q=80" alt="Paneer" className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300" />
                     </div>
                     <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold">Paneer</span>
                  </button>
               </div>
            </div>
         </section>

         {/* Product Marketplace Section */}
         <section id="marketplace" className="py-12 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                     <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        Marketplace <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                     </h2>
                     <p className="text-gray-500 text-sm mt-1">Discover premium organic produce from certified local vendors.</p>
                  </div>

                  {/* Top Marketplace Quick Search Bar */}
                  <div className="w-full md:w-80 relative group">
                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 group-focus-within:text-brand transition-colors" size={18} />
                     <input
                        type="text"
                        placeholder="Search products in marketplace..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 bg-white border-2 border-emerald-500/20 rounded-2xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all shadow-sm placeholder:text-gray-400 group-hover:border-emerald-500/40"
                     />
                     {searchQuery && (
                        <button
                           type="button"
                           onClick={() => setSearchQuery('')}
                           className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                           title="Clear search"
                        >
                           <X size={15} />
                        </button>
                     )}
                  </div>
               </div>



               {/* Main content with sidebar and products */}
               <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Sidebar - Filters */}
                  {showFilters && (
                     <div className="lg:w-76 flex-shrink-0 text-left lg:sticky lg:top-24 h-fit">
                        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-emerald-950/[0.02] border border-white max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2">
                           <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                              <h3 className="text-base font-extrabold text-gray-900">Filters</h3>
                              <div className="flex gap-2 items-center">
                                 <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="px-3 py-1.5 text-2xs font-extrabold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                                 >
                                    Hide
                                 </button>
                                 {(activeCategory !== 'All' || sortBy !== 'none' || searchQuery !== '' || priceRanges.length > 0 || ratingFilters.length > 0 || selectedBrands.length > 0 || discountFilters.length > 0) && (
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setPriceRanges([]);
                                          setRatingFilters([]);
                                          setSelectedBrands([]);
                                          setDiscountFilters([]);
                                          setSearchQuery('');
                                          setSortBy('none');
                                          setActiveCategory('All');
                                       }}
                                       className="px-3 py-1.5 text-2xs font-extrabold border border-brand/20 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all cursor-pointer"
                                    >
                                       Clear All
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* High-visibility Search Filter */}
                           <div className="mb-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-3.5 rounded-2xl border-2 border-emerald-500/30 shadow-sm focus-within:border-brand focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all">
                              <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2 flex items-center justify-between">
                                 <span className="flex items-center gap-1.5">
                                    <Search size={14} className="text-emerald-600" />
                                    Search Products
                                 </span>
                                 {searchQuery && (
                                    <button
                                       type="button"
                                       onClick={() => setSearchQuery('')}
                                       className="text-[10px] text-emerald-700 hover:text-red-600 font-bold underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </label>
                              <div className="relative group">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 group-focus-within:text-brand transition-colors" size={16} />
                                 <input
                                    type="text"
                                    placeholder="Search vegetables, fruits..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-white border border-emerald-300/70 rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all text-xs font-semibold text-gray-900 shadow-inner placeholder-gray-400"
                                 />
                                 {searchQuery && (
                                    <button
                                       type="button"
                                       onClick={() => setSearchQuery('')}
                                       className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                       title="Clear search"
                                    >
                                       <X size={14} />
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* Sort By */}
                           <div className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Sort By</label>
                                 {sortBy !== 'none' && (
                                    <button
                                       type="button"
                                       onClick={() => setSortBy('none')}
                                       className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <div className="space-y-1.5">
                                 <button onClick={() => setSortBy('none')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'none' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Recommended</button>
                                 <button onClick={() => setSortBy('price_asc')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'price_asc' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Price: Low to High</button>
                                 <button onClick={() => setSortBy('price_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'price_desc' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Price: High to Low</button>
                                 <button onClick={() => setSortBy('rating')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'rating' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Highest Rated</button>
                              </div>
                           </div>

                           {/* Price Range */}
                           <div className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Price Range</label>
                                 {priceRanges.length > 0 && (
                                    <button
                                       type="button"
                                       onClick={() => setPriceRanges([])}
                                       className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <div className="space-y-2.5">
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={priceRanges.includes('under5')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setPriceRanges([...priceRanges, 'under5']);
                                          } else {
                                             setPriceRanges(priceRanges.filter(r => r !== 'under5'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Under $5</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={priceRanges.includes('5to10')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setPriceRanges([...priceRanges, '5to10']);
                                          } else {
                                             setPriceRanges(priceRanges.filter(r => r !== '5to10'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">$5 - $10</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={priceRanges.includes('10to20')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setPriceRanges([...priceRanges, '10to20']);
                                          } else {
                                             setPriceRanges(priceRanges.filter(r => r !== '10to20'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">$10 - $20</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={priceRanges.includes('over20')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setPriceRanges([...priceRanges, 'over20']);
                                          } else {
                                             setPriceRanges(priceRanges.filter(r => r !== 'over20'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Over $20</span>
                                 </label>
                              </div>
                           </div>

                           {/* Rating */}
                           <div className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Rating</label>
                                 {ratingFilters.length > 0 && (
                                    <button
                                       type="button"
                                       onClick={() => setRatingFilters([])}
                                       className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <div className="space-y-2.5">
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={ratingFilters.includes('4.5')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setRatingFilters([...ratingFilters, '4.5']);
                                          } else {
                                             setRatingFilters(ratingFilters.filter(r => r !== '4.5'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors flex items-center">
                                       <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 4.5 & above
                                    </span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={ratingFilters.includes('4.0')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setRatingFilters([...ratingFilters, '4.0']);
                                          } else {
                                             setRatingFilters(ratingFilters.filter(r => r !== '4.0'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors flex items-center">
                                       <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 4.0 & above
                                    </span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={ratingFilters.includes('3.5')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setRatingFilters([...ratingFilters, '3.5']);
                                          } else {
                                             setRatingFilters(ratingFilters.filter(r => r !== '3.5'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors flex items-center">
                                       <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 3.5 & above
                                    </span>
                                 </label>
                              </div>
                           </div>

                           {/* Brands */}
                           <div className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Brands</label>
                                 {selectedBrands.length > 0 && (
                                    <button
                                       type="button"
                                       onClick={() => setSelectedBrands([])}
                                       className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <div className="space-y-2.5">
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={selectedBrands.includes('Green Valley Farm')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setSelectedBrands([...selectedBrands, 'Green Valley Farm']);
                                          } else {
                                             setSelectedBrands(selectedBrands.filter(b => b !== 'Green Valley Farm'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Green Valley Farm</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={selectedBrands.includes('Berry Farm')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setSelectedBrands([...selectedBrands, 'Berry Farm']);
                                          } else {
                                             setSelectedBrands(selectedBrands.filter(b => b !== 'Berry Farm'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Berry Farm</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={selectedBrands.includes('Happy Cows Dairy')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setSelectedBrands([...selectedBrands, 'Happy Cows Dairy']);
                                          } else {
                                             setSelectedBrands(selectedBrands.filter(b => b !== 'Happy Cows Dairy'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Happy Cows Dairy</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={selectedBrands.includes('Sunshine Produce')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setSelectedBrands([...selectedBrands, 'Sunshine Produce']);
                                          } else {
                                             setSelectedBrands(selectedBrands.filter(b => b !== 'Sunshine Produce'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Sunshine Produce</span>
                                 </label>
                              </div>
                           </div>

                           {/* Discount */}
                           <div className="mb-6">
                              <div className="flex justify-between items-center mb-3">
                                 <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Discount</label>
                                 {discountFilters.length > 0 && (
                                    <button
                                       type="button"
                                       onClick={() => setDiscountFilters([])}
                                       className="text-[10px] font-bold text-brand hover:underline cursor-pointer"
                                    >
                                       Clear
                                    </button>
                                 )}
                              </div>
                              <div className="space-y-2.5">
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={discountFilters.includes('10')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setDiscountFilters([...discountFilters, '10']);
                                          } else {
                                             setDiscountFilters(discountFilters.filter(d => d !== '10'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">10% or more</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={discountFilters.includes('20')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setDiscountFilters([...discountFilters, '20']);
                                          } else {
                                             setDiscountFilters(discountFilters.filter(d => d !== '20'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">20% or more</span>
                                 </label>
                                 <label className="flex items-center cursor-pointer group">
                                    <input
                                       type="checkbox"
                                       checked={discountFilters.includes('30')}
                                       onChange={(e) => {
                                          if (e.target.checked) {
                                             setDiscountFilters([...discountFilters, '30']);
                                          } else {
                                             setDiscountFilters(discountFilters.filter(d => d !== '30'));
                                          }
                                       }}
                                       className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4 cursor-pointer"
                                    />
                                    <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">30% or more</span>
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}

                  {/* Right Side - Products Grid */}
                  <div className="flex-1">
                     {!showFilters && (
                        <div className="mb-6 text-left">
                           <button
                              onClick={() => setShowFilters(true)}
                              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-brand/40 transition-colors shadow-sm"
                           >
                              Show Filters
                           </button>
                        </div>
                     )}
                     <div className="mb-4 text-left">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                           Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                           {activeCategory !== 'All' && ` in ${activeCategory}`}
                        </p>
                     </div>

                     {filteredProducts.length === 0 ? (
                        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-white shadow-md max-w-lg mx-auto">
                           <div className="text-gray-400 mb-4 bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto text-brand">
                              <Search size={24} />
                           </div>
                           <h3 className="text-base font-extrabold text-gray-900 mb-1">No products found</h3>
                           <p className="text-gray-500 text-xs mb-6 max-w-xs mx-auto">Try adjusting your filters or search terms to find fresh produce.</p>
                           <button
                              onClick={() => {
                                 setPriceRanges([]);
                                 setRatingFilters([]);
                                 setSelectedBrands([]);
                                 setDiscountFilters([]);
                                 setSearchQuery('');
                                 setSortBy('none');
                                 setActiveCategory('All');
                              }}
                              className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                           >
                              Clear All Filters
                           </button>
                        </div>
                     ) : (
                        <div className={`grid gap-6 ${showFilters ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                           {filteredProducts.map(product => (
                              <div
                                 key={product.id}
                                 onClick={() => {
                                    navigate(`/product/${product.id}`);
                                 }}
                                 role="button"
                                 tabIndex={0}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                       navigate(`/product/${product.id}`);
                                    }
                                 }}
                                 className="bg-white/70 backdrop-blur-md rounded-3xl overflow-hidden border border-white shadow-md hover:shadow-2xl hover:shadow-emerald-950/[0.04] hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                              >
                                 <div className="relative h-52 overflow-hidden bg-gray-50 flex items-center justify-center">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" />
                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-800 shadow-sm border border-emerald-100/40">
                                       {product.category}
                                    </div>
                                 </div>
                                 <div className="p-5 flex flex-col flex-1 text-left">
                                    <div className="flex justify-between items-start mb-1.5 gap-2">
                                       <h3 className="font-bold text-gray-900 leading-tight tracking-tight group-hover:text-brand transition-colors text-base line-clamp-1">{product.name}</h3>
                                       <div className="flex items-center text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg flex-shrink-0">
                                          <Star size={11} className="mr-0.5 fill-current" /> {product.rating}
                                       </div>
                                    </div>
                                    <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wide mb-4 truncate">{product.vendor}</p>
                                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100/50">
                                       <div>
                                          <span className="text-xl font-black text-gray-950">${product.price}</span>
                                          <span className="text-[11px] text-gray-400 font-semibold">/{product.unit}</span>
                                       </div>
                                       {(() => {
                                          const cartItem = cartItems.find(item => String(item.id) === String(product.id));
                                          return cartItem ? (
                                             <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl p-1 shadow-xs" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                   type="button"
                                                   onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                   className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-90 font-black"
                                                   title="Decrease quantity"
                                                >
                                                   <Minus size={11} strokeWidth={3} />
                                                </button>
                                                <span className="text-xs font-black text-slate-800 px-1 font-sans text-center min-w-[16px]">{cartItem.quantity}</span>
                                                <button
                                                   type="button"
                                                   onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                   className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-90 font-black"
                                                   title="Increase quantity"
                                                >
                                                   <Plus size={11} strokeWidth={3} />
                                                </button>
                                             </div>
                                          ) : (
                                             <button
                                                type="button"
                                                onClick={(e) => {
                                                   e.stopPropagation();
                                                   addToCart(product);
                                                }}
                                                className="bg-emerald-600 text-white hover:bg-emerald-700 p-2.5 rounded-xl transition-all duration-300 shadow-md shadow-emerald-900/10 active:scale-95 flex items-center justify-center"
                                                title="Add to Cart"
                                             >
                                                <ShoppingCart size={16} />
                                             </button>
                                          );
                                       })()}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </section>

      </div>
   );
}
