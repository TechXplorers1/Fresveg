import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Truck, ShoppingCart, Star, Search, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';

export default function Home() {
  const { addToCart } = useCart();
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

      {/* Premium Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-20 bg-gradient-to-b from-brand-light/30 to-transparent">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
               <div className="lg:col-span-7 space-y-6 text-left">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-500/20">
                     <Leaf size={12} className="text-brand" /> 100% Organic & Fresh
                  </span>
                  <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                     Fresh Organic Produce <br/>
                     <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">Directly From Farms</span>
                  </h1>
                  <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-xl">
                     Connect directly with local organic farmers. Freshly harvested vegetables, fruits, and pure dairy products delivered to your door in hours.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                     <a href="#marketplace" className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        Explore Marketplace
                     </a>
                     <Link to="/auth?redirect=profile" className="bg-white/70 hover:bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md">
                        Become a Vendor
                     </Link>
                  </div>
               </div>
               <div className="lg:col-span-5 relative flex justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-light rounded-full blur-3xl opacity-60 z-0"></div>
                  <div className="relative z-10 animate-float bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl max-w-sm sm:max-w-md overflow-hidden transition-all duration-500 hover:rotate-1">
                     <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80" alt="Fresh Organic Vegetables" className="rounded-2xl w-full h-80 object-cover shadow-inner" />
                     <div className="absolute bottom-10 left-10 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white shadow-xl flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">★</div>
                        <div className="text-left">
                           <p className="text-xs font-bold text-gray-900">4.9/5 Star Rating</p>
                           <p className="text-[10px] text-gray-400">From 10k+ happy customers</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Category Tiles */}
      <section className="py-12 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 tracking-tight flex items-center gap-2">
              Browse Categories <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
            </h2>

            <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x items-center">
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
      </section>      <section id="marketplace" className="py-16 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
               <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    Marketplace <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Discover premium organic produce from certified local vendors.</p>
               </div>
            </div>

            {/* Category buttons at top */}
            <div className="flex gap-2.5 mb-10 overflow-x-auto pb-3 scrollbar-hide snap-x">
               {['All', 'Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap scroll-snap-align-start ${activeCategory === cat ? 'bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/20' : 'bg-white/60 backdrop-blur-md text-gray-500 border border-gray-200/50 hover:border-brand/40 hover:text-brand'}`}>
                     {cat}
                  </button>
               ))}
            </div>

            {/* Main content with sidebar and products */}
            <div className="flex flex-col lg:flex-row gap-8">
               {/* Left Sidebar - Filters */}
               {showFilters && (
                 <div className="lg:w-76 flex-shrink-0">
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-emerald-950/[0.02] border border-white">
                      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                         <h3 className="text-base font-extrabold text-gray-900">Filters</h3>
                         <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowFilters(!showFilters)}
                              className="px-3 py-1.5 text-2xs font-extrabold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              Hide
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
                              className="px-3 py-1.5 text-2xs font-extrabold border border-brand/20 bg-brand-light text-brand rounded-xl hover:bg-brand hover:text-white transition-all"
                            >
                              Clear
                            </button>
                         </div>
                      </div>
                      
                      {/* Search */}
                      <div className="mb-6">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Search Products</label>
                         <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                               type="text"
                               placeholder="Type keyword..."
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-brand transition-all text-xs"
                            />
                         </div>
                      </div>

                      {/* Sort By */}
                      <div className="mb-6">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Sort By</label>
                         <div className="space-y-1.5">
                            <button onClick={() => setSortBy('none')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all ${sortBy === 'none' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Recommended</button>
                            <button onClick={() => setSortBy('price_asc')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all ${sortBy === 'price_asc' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Price: Low to High</button>
                            <button onClick={() => setSortBy('price_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all ${sortBy === 'price_desc' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Price: High to Low</button>
                            <button onClick={() => setSortBy('rating')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all ${sortBy === 'rating' ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-brand-light/30'}`}>Highest Rated</button>
                         </div>
                      </div>

                      {/* Price Range */}
                      <div className="mb-6">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Price Range</label>
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
                               />
                               <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Over $20</span>
                            </label>
                         </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-6">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Rating</label>
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
                               />
                               <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors flex items-center">
                                  <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 3.5 & above
                               </span>
                            </label>
                         </div>
                      </div>

                      {/* Brands */}
                      <div className="mb-6">
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Brands</label>
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
                               />
                               <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-brand transition-colors">Sunshine Produce</span>
                            </label>
                         </div>
                      </div>

                      {/* Discount */}
                      <div>
                         <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Discount</label>
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                 className="rounded border-gray-300 text-brand focus:ring-brand w-4 h-4" 
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
                                    <button
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(product);
                                       }}
                                       className="bg-brand-light text-brand hover:bg-brand hover:text-white p-2.5 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-brand/10 outline-none shadow-sm"
                                    >
                                       <ShoppingCart size={16} />
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
      </section>      {/* Features */}
      <section className="py-20 relative bg-emerald-500/5">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Why Choose FresVeg?</h2>
               <p className="text-gray-500 max-w-xl mx-auto text-sm">We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Leaf size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Farm Fresh</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Sourced directly from local farmers ensuring maximum freshness, nutritional value, and unbelievable taste.</p>
               </div>
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <Truck size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Fast Delivery</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Lightning fast delivery straight to your doorstep within hours of harvesting from the nearest farms.</p>
               </div>
               <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                     <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assured</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Rigorous quality checks at every step to ensure you get only the finest and safest selection of produce.</p>
               </div>
            </div>
         </div>
      </section>


      {/* About Section */}
      <section className="py-24">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div className="text-left space-y-6">
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                     About FresVeg <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </h2>
                  <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
                     <p>
                        We are committed to providing the freshest, highest quality produce directly from our farms to your table. 
                        Our mission is to support local farmers while delivering exceptional products that nourish your family.
                     </p>
                     <p>
                        Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive 
                        only the best nature has to offer.
                     </p>
                  </div>
                  <a href="#marketplace" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg shadow-brand/10 hover:-translate-y-0.5 active:translate-y-0">
                     Shop Now <ArrowRight size={18} />
                  </a>
               </div>
               <div className="relative flex justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-light rounded-full blur-3xl opacity-60"></div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-10 max-w-md w-full hover:scale-101 transition-transform">
                     <img src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80" alt="Farm Fresh Produce" className="w-full h-88 object-cover" />
                  </div>
               </div>
            </div>
         </div>
      </section>
   </div>
  );
}
