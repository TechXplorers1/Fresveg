import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Truck, ShoppingCart, Star, Search, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';

export default function Home() {
  const { addToCart } = useCart();
  const { products, searchQuery } = useProducts();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('none');
  
  // Filter states
  const [priceRanges, setPriceRanges] = useState([]);
  const [ratingFilters, setRatingFilters] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [discountFilters, setDiscountFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(true);

  const location = useLocation();

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    const marketplaceSection = document.getElementById('marketplace');
    if (marketplaceSection) {
      marketplaceSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (location.hash === '#marketplace') {
      const marketplaceSection = document.getElementById('marketplace');
      if (marketplaceSection) {
        marketplaceSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const vendorName = p.vendor || '';
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Price range filter
    const matchesPriceRange = priceRanges.length === 0 || priceRanges.some(range => {
      switch(range) {
        case 'under5': return p.price < 5;
        case '5to10': return p.price >= 5 && p.price < 10;
        case '10to20': return p.price >= 10 && p.price < 20;
        case 'over20': return p.price >= 20;
        default: return true;
      }
    });
    
    // Rating filter
    const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
      switch(rating) {
        case '4.5': return p.rating >= 4.5;
        case '4.0': return p.rating >= 4.0;
        case '3.5': return p.rating >= 3.5;
        default: return true;
      }
    });
    
    // Brand filter
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.vendor);
    
    // Discount filter (for now, we'll assume some products have discounts - this would need to be added to the data)
    const matchesDiscount = discountFilters.length === 0 || discountFilters.some(discount => {
      // This is a placeholder - in real app, products would have discount percentage
      const discountPercent = Math.floor(Math.random() * 40); // Random discount for demo
      switch(discount) {
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
    <div className="flex flex-col min-h-screen">

      {/* Category Tiles */}
      <section className="py-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h4 className="text-2xl py-1 md:text-4xl font-bold text-gray-900 mb-4">Category</h4>

            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x items-center">
               <button onClick={() => handleCategoryClick('Tomatoes')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="/cherry_tomatoes.png" alt="Tomatoes" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Tomatoes</span>
               </button>
               <button onClick={() => handleCategoryClick('Potatoes')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="/sweet_potatoes.png" alt="Potatoes" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Potatoes</span>
               </button>
               <button onClick={() => handleCategoryClick('Onions')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="/red_onions.png" alt="Onions" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Onions</span>
               </button>
               <button onClick={() => handleCategoryClick('Brinjal')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="/fresh_brinjal.png" alt="Brinjal" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Brinjal</span>
               </button>
               <button onClick={() => handleCategoryClick('Carrots')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80" alt="Carrots" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Carrots</span>
               </button>
               <button onClick={() => handleCategoryClick('Spinach')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80" alt="Spinach" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Spinach</span>
               </button>
               <button onClick={() => handleCategoryClick('Capsicum')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=200&q=80" alt="Capsicum" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Capsicum</span>
               </button>
               <button onClick={() => handleCategoryClick('Broccoli')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=200&q=80" alt="Broccoli" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Broccoli</span>
               </button>
               <button onClick={() => handleCategoryClick('Garlic')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80" alt="Garlic" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Garlic</span>
               </button>
               <button onClick={() => handleCategoryClick('Apples')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=200&q=80" alt="Apples" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Apples</span>
               </button>
               <button onClick={() => handleCategoryClick('Bananas')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80" alt="Bananas" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Bananas</span>
               </button>
               <button onClick={() => handleCategoryClick('Strawberries')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80" alt="Strawberries" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Strawberries</span>
               </button>
               <button onClick={() => handleCategoryClick('Oranges')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=200&q=80" alt="Oranges" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Oranges</span>
               </button>
               <button onClick={() => handleCategoryClick('Milk')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80" alt="Milk" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Milk</span>
               </button>
               <button onClick={() => handleCategoryClick('Butter')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="/salted_butter.png" alt="Butter" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Butter</span>
               </button>
               <button onClick={() => handleCategoryClick('Cheese')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=200&q=80" alt="Cheese" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Cheese</span>
               </button>
               <button onClick={() => handleCategoryClick('Yogurt')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?auto=format&fit=crop&w=200&q=80" alt="Yogurt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Yogurt</span>
               </button>
               <button onClick={() => handleCategoryClick('Paneer')} className="flex-shrink-0 w-28 flex flex-col items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-3 hover:shadow-xl transition-shadow group snap-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white">
                     <img src="https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=200&q=80" alt="Paneer" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-gray-700 font-semibold">Paneer</span>
               </button>
            </div>
         </div>
      </section>

      <section id="marketplace" className="py-15">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
               <div>
                  <h4 className="text-3xl md:text-4xl font-bold text-gray-900">Marketplace</h4>
                  <p className="text-gray-500 mt-1 max-w-2xl">Discover fresh produce from local vendors.</p>
               </div>
            </div>

            {/* Category buttons at top */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
               {['All', 'Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap scroll-snap-align-start ${activeCategory === cat ? 'bg-brand text-white shadow-md' : 'bg-white/70 backdrop-blur-md text-gray-600 border border-white/50 hover:border-brand/50 hover:text-brand'}`}>
                     {cat}
                  </button>
               ))}
            </div>

            {/* Main content with sidebar and products */}
            <div className="flex flex-col lg:flex-row gap-8">
               {/* Left Sidebar - Filters */}
               {showFilters && (
                 <div className="lg:w-80 flex-shrink-0">
                   <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/50">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                        <div className="flex gap-3">
                           <button
                             type="button"
                             onClick={() => setShowFilters(!showFilters)}
                             className="rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                           >
                             Hide Filters
                           </button>
                           <button
                             type="button"
                             onClick={() => {
                               setPriceRanges([]);
                               setRatingFilters([]);
                               setSelectedBrands([]);
                               setDiscountFilters([]);
                               setSearchQuery('');
                               setSortBy('none');
                             }}
                             className="rounded-full border border-brand bg-white px-4 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
                           >
                             Clear All
                           </button>
                        </div>
                     </div>
                     
                     {/* Search */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search Products</label>
                        <div className="relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                           <input
                              type="text"
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm"
                           />
                        </div>
                     </div>

                     {/* Sort By */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Sort By</label>
                        <div className="space-y-2">
                           <button onClick={() => setSortBy('none')} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${sortBy === 'none' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Recommended</button>
                           <button onClick={() => setSortBy('price_asc')} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${sortBy === 'price_asc' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Price: Low to High</button>
                           <button onClick={() => setSortBy('price_desc')} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${sortBy === 'price_desc' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Price: High to Low</button>
                           <button onClick={() => setSortBy('rating')} className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${sortBy === 'rating' ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-50'}`}>Highest Rated</button>
                        </div>
                     </div>

                     {/* Price Range */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
                        <div className="space-y-2">
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Under $5</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">$5 - $10</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">$10 - $20</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Over $20</span>
                           </label>
                        </div>
                     </div>

                     {/* Rating */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Rating</label>
                        <div className="space-y-2">
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700 flex items-center">
                                 <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" /> 4.5 & above
                              </span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700 flex items-center">
                                 <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" /> 4.0 & above
                              </span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700 flex items-center">
                                 <Star size={14} className="fill-yellow-400 text-yellow-400 mr-1" /> 3.5 & above
                              </span>
                           </label>
                        </div>
                     </div>

                     {/* Brands */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Brands</label>
                        <div className="space-y-2">
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Green Valley Farm</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Berry Farm</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Happy Cows Dairy</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">Sunshine Produce</span>
                           </label>
                        </div>
                     </div>

                     {/* Discount */}
                     <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Discount</label>
                        <div className="space-y-2">
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">10% or more</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">20% or more</span>
                           </label>
                           <label className="flex items-center">
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
                                className="rounded border-gray-300 text-brand focus:ring-brand" 
                              />
                              <span className="ml-2 text-sm text-gray-700">30% or more</span>
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
               )}

               {/* Right Side - Products Grid */}
               <div className="flex-1">
                  {!showFilters && (
                     <div className="mb-4">
                        <button 
                          onClick={() => setShowFilters(true)}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                        >
                          Show Filters
                        </button>
                     </div>
                  )}
                  <div className="mb-4">
                     <p className="text-sm text-gray-600">
                        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                        {activeCategory !== 'All' && ` in ${activeCategory}`}
                     </p>
                  </div>
                  
                  {filteredProducts.length === 0 ? (
                     <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                           <Search size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
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
                          className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition-colors"
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
                              className="bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/60 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
                           >
                              <div className="relative h-48 overflow-hidden bg-gray-100">
                                 <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                 <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm">
                                    {product.category}
                                 </div>
                              </div>
                              <div className="p-5">
                                 <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
                                    <div className="flex items-center text-xs font-semibold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded flex-shrink-0">
                                       <Star size={12} className="mr-0.5 fill-current" /> {product.rating}
                                    </div>
                                 </div>
                                 <p className="text-xs text-gray-500 mb-4 truncate">{product.vendor}</p>
                                 <div className="flex justify-between items-center mt-auto">
                                    <div>
                                       <span className="text-xl font-extrabold text-brand-dark">${product.price}</span>
                                       <span className="text-sm text-gray-500">/{product.unit}</span>
                                    </div>
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(product);
                                       }}
                                       className="bg-brand-light text-brand hover:bg-brand hover:text-white p-2 rounded-full transition-colors focus:ring-2 focus:ring-brand/50 outline-none"
                                    >
                                       <ShoppingCart size={18} />
                                    </button>
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

      {/* Features */}
      <section className="py-20 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose FresVeg?</h2>
               <p className="text-gray-600 max-w-2xl mx-auto">We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/50 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Leaf size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Farm Fresh</h3>
                  <p className="text-gray-600 leading-relaxed">Sourced directly from local farmers ensuring maximum freshness, nutritional value, and unbelievable taste.</p>
               </div>
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/50 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Truck size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
                  <p className="text-gray-600 leading-relaxed">Lightning fast delivery straight to your doorstep within hours of harvesting from the nearest farms.</p>
               </div>
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white/50 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm text-brand flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <ShieldCheck size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assured</h3>
                  <p className="text-gray-600 leading-relaxed">Rigorous quality checks at every step to ensure you get only the finest and safest selection of produce.</p>
               </div>
            </div>
         </div>
      </section>


      {/* About Section */}
      <section className="py-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">About FresVeg</h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                     We are committed to providing the freshest, highest quality produce directly from our farms to your table. 
                     Our mission is to support local farmers while delivering exceptional products that nourish your family.
                  </p>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                     Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive 
                     only the best nature has to offer.
                  </p>
                  <a href="#marketplace" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-full font-semibold transition-all">
                     Shop Now <ArrowRight size={20} />
                  </a>
               </div>
               <div className="relative">
                  <div className="rounded-2xl overflow-hidden shadow-2xl">
                     <img src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80" alt="Farm Fresh Produce" className="w-full h-96 object-cover" />
                  </div>
               </div>
            </div>
         </div>
      </section>
   </div>
  );
}
