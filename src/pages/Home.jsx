import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Truck, Tag, Percent, Sprout, Box, MapPin, Star, Quote, Flame, Sparkles, ShoppingBag, Eye, TrendingUp, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { getProductSlug } from './ProductDetails';
import FarmToTableSnakeProcess from '../components/FarmToTableSnakeProcess';

export default function Home() {
   const navigate = useNavigate();
   const { userProfile } = useAuth();
   const { products = [] } = useProducts();
   const [selectedCategory, setSelectedCategory] = useState('all');

   const fallbackBestSellers = [
      { id: 1, name: 'Organic Red Tomatoes', price: 4.99, mrp: 6.99, unit: 'kg', category: 'Tomatoes', type: 'veggies', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.9 },
      { id: 32, name: 'Fresh Strawberries', price: 5.00, mrp: 7.25, unit: 'box', category: 'Strawberries', type: 'fruits', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.9 },
      { id: 5, name: 'Sweet Potatoes', price: 3.20, mrp: 4.50, unit: 'kg', category: 'Potatoes', type: 'veggies', image: '/sweet_potatoes.png', vendor: 'Root Essentials', rating: 4.8 },
      { id: 10, name: 'Farm Fresh Milk', price: 3.20, mrp: 4.20, unit: 'L', category: 'Milk', type: 'dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.9 },
      { id: 16, name: 'Fuji Apples', price: 4.00, mrp: 5.80, unit: 'kg', category: 'Apples', type: 'fruits', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.8 },
      { id: 12, name: 'Organic Butter', price: 4.50, mrp: 6.00, unit: '250g', category: 'Butter', type: 'dairy', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },
      { id: 18, name: 'Organic Bananas', price: 1.99, mrp: 2.99, unit: 'bunch', category: 'Bananas', type: 'fruits', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },
      { id: 20, name: 'Fresh Spinach', price: 2.00, mrp: 2.80, unit: 'bunch', category: 'Spinach', type: 'veggies', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.9 }
   ];

   // Top Offer Organic Markets Data
   const [selectedMarketFilter, setSelectedMarketFilter] = useState('all');
   const [publicShopsList, setPublicShopsList] = useState([]);

   const fallbackOfferMarkets = [
      {
         id: 'green-valley-farm',
         name: 'Green Valley Organic Store',
         location: 'Karjat, Maharashtra',
         distance: '3.5 km away',
         rating: 4.9,
         discountText: '35% OFF SPECIAL',
         offerTagline: 'Get 35% OFF on all fresh heirloom tomato & veggie baskets today!',
         tags: ['Fresh Veggies', 'Organic Dairy', 'Fast Delivery'],
         image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80'
      },
      {
         id: 'sunshine-produce',
         name: 'Sunshine Organic Market',
         location: 'Nashik, Maharashtra',
         distance: '14.2 km away',
         rating: 4.8,
         discountText: '30% OFF FRUITS',
         offerTagline: 'Flat 30% OFF on seasonal Alphonso mangoes & organic strawberries.',
         tags: ['Farm Fruits', 'Juices & Jams', 'Certified Organic'],
         image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80'
      },
      {
         id: 'root-essentials',
         name: 'Root Essentials Hub',
         location: 'Pune, Maharashtra',
         distance: '8.5 km away',
         rating: 4.8,
         discountText: '25% OFF BULK',
         offerTagline: 'Buy 2kg Sweet Potatoes & Onions and get 25% extra discount.',
         tags: ['Root Veggies', 'Bulk Boxes', 'Farm Direct'],
         image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80'
      },
      {
         id: 'orchard-farms-store',
         name: 'Orchard Berry & Honey Store',
         location: 'Mahabaleshwar, MH',
         distance: '4.8 km away',
         rating: 4.9,
         discountText: '30% OFF HONEY',
         offerTagline: 'Special 30% discount on raw forest honey & fresh berry preserves.',
         tags: ['Wild Honey', 'Berry Preserves', 'Hill Harvest'],
         image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80'
      }
   ];

   // Native IntersectionObserver to trigger scroll-reveal animations on scroll
   useEffect(() => {
      const observerCallback = (entries) => {
         entries.forEach(entry => {
            if (entry.isIntersecting) {
               entry.target.classList.add('reveal-visible');
            }
         });
      };

      const observerOptions = {
         threshold: 0.1,
         rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver(observerCallback, observerOptions);
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
   }, [selectedCategory, products]);

   const availableProducts = (products && products.length > 0) ? products : fallbackBestSellers;

   const displayedBestSellers = availableProducts.filter(p => {
      if (selectedCategory === 'all') return true;
      const catLower = (p.category || '').toLowerCase();
      if (selectedCategory === 'veggies') return catLower.includes('tomato') || catLower.includes('potato') || catLower.includes('spinach') || catLower.includes('onion') || catLower.includes('brinjal') || catLower.includes('carrot') || catLower.includes('broccoli') || p.type === 'veggies';
      if (selectedCategory === 'fruits') return catLower.includes('apple') || catLower.includes('banana') || catLower.includes('strawberry') || catLower.includes('orange') || p.type === 'fruits';
      if (selectedCategory === 'dairy') return catLower.includes('milk') || catLower.includes('butter') || catLower.includes('cheese') || catLower.includes('yogurt') || catLower.includes('paneer') || p.type === 'dairy';
      return true;
   }).slice(0, 8);
   const [homeContent, setHomeContent] = useState({
      // Hero
      heroHeadline: "Fresh fruits & Vegetables Directly From Farms",
      heroDescription: "Connect directly with local organic farmers. Freshly harvested vegetables, fruits, and pure dairy products delivered to your door in hours.",
      heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",

      // Special Offers & Banners
      promo1Title: "Fresh Fruit Harvest Box",
      promo1Desc: "Get a handpicked assortment of organic seasonal fruits including strawberries, apples, and oranges.",
      promo1Code: "FRUIT20",
      promo2Title: "Bulk Veggies Discount",
      promo2Desc: "Stock up your kitchen with potatoes, onions, tomatoes, and greens. Harvested fresh and shipped in bulk.",
      promo2Code: "BULK15",

      // Why Choose FresVeg?
      whyTitle: "Why Choose FresVeg?",
      whySubtitle: "We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors.",
      why1Title: "Premium Fresh",
      why1Desc: "Sourced directly from local farmers ensuring maximum freshness, nutritional value, and unbelievable taste.",
      why2Title: "Fast Delivery",
      why2Desc: "Lightning fast delivery straight to your doorstep within hours of harvesting from the nearest farms.",
      why3Title: "Quality Assured",
      why3Desc: "Rigorous quality checks at every step to ensure you get only the finest and safest selection of produce.",

      // Farm-to-Table Process
      processTitle: "Our Farm-to-Table Process",
      processSubtitle: "We maintain a clean, temperature-controlled, and highly efficient network to ship organic products from local soil directly to your shelf.",
      process1Title: "1. Fresh Harvest",
      process1Desc: "Farmers pick organic produce only after you place your order to ensure peak flavor.",
      process2Title: "2. Eco Packaging",
      process2Desc: "Items are sorted and wrapped in plastic-free biodegradable packets to protect the planet.",
      process3Title: "3. Swift Transit",
      process3Desc: "Delivery partners collect your box immediately and run optimized routes using maps.",
      process4Title: "4. Doorstep Joy",
      process4Desc: "Get contact-free drop off in under 4 hours, and scan farm codes for origin tracing.",

      // What Our Customers Say
      testimonialsTitle: "What Our Customers Say",
      testimonialsSubtitle: "Read verified feedback from home cooks and families who enjoy fresh farm deliveries weekly.",
      test1Quote: "The strawberries are exceptionally sweet and fresh, nothing like the supermarket ones. Plus, knowing it supports local farmers directly makes every order feel great.",
      test1Name: "Sarah J.",
      test1Role: "Home Cook",
      test2Quote: "The bulk veggie box is a life saver for my meal prep. Everything stays crisp for over a week, and delivery is consistently quick. Highly recommended!",
      test2Name: "David K.",
      test2Role: "Fitness Enthusiast",
      test3Quote: "We booked a farm tour weekend slots via 'Visit Farms' link, and our kids absolutely loved picking fruits and seeing cows. A perfect weekend refreshment setup!",
      test3Name: "Emma L.",
      test3Role: "Parent",

      // About FresVeg
      aboutHeadline: "About FresVeg",
      aboutText1: "We are committed to providing the freshest, highest quality produce directly from our farms to your table. Our mission is to support local farmers while delivering exceptional products that nourish your family.",
      aboutText2: "Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive only the best nature has to offer.",
      aboutImage: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80"
   });

   useEffect(() => {
      // Home content defaults set in state
   }, []);

   const activeOfferMarkets = (publicShopsList && publicShopsList.length > 0) ? publicShopsList : fallbackOfferMarkets;

   const displayedOfferMarkets = activeOfferMarkets.filter(m => {
      if (selectedMarketFilter === 'all') return true;
      if (selectedMarketFilter === 'high_discount') return (m.discountText || '').includes('35%') || (m.discountText || '').includes('30%');
      if (selectedMarketFilter === 'local') return (m.location || '').toLowerCase().includes('karjat') || (m.distance || '').includes('3.5');
      if (selectedMarketFilter === 'top_rated') return (m.rating || 0) >= 4.8;
      return true;
   }).slice(0, 4);

   return (
      <div className="flex flex-col min-h-screen">

         {/* Premium Hero Section */}
         {!homeContent.hiddenSections?.hero && (
            <section className="relative overflow-hidden pt-12 pb-14 lg:pt-16 lg:pb-20 bg-gradient-to-b from-brand-light/30 to-transparent">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="grid lg:grid-cols-12 gap-12 items-center">
                     <div className="lg:col-span-7 space-y-6 text-left reveal-on-scroll reveal-left">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-500/20">
                           <Leaf size={12} className="text-brand" /> 100% Organic & Fresh
                        </span>
                        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                           {homeContent.heroHeadline}
                        </h1>
                        <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-xl">
                           {homeContent.heroDescription}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                           {userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && (
                              <Link to="/marketplace" className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                 Explore Marketplace
                              </Link>
                           )}
                           {userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && (
                              <Link to="/auth?redirect=profile" className="bg-white/70 hover:bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md">
                                 Become a Vendor
                              </Link>
                           )}
                        </div>
                     </div>
                     <div className="lg:col-span-5 relative flex justify-center reveal-on-scroll reveal-right">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-brand-light rounded-full blur-3xl opacity-60 z-0"></div>
                        <div className="relative z-10 animate-float bg-white/60 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl max-w-sm sm:max-w-md overflow-hidden transition-all duration-500 hover:rotate-1">
                           <img src={homeContent.heroImage} alt="Fresh Organic Vegetables" className="rounded-2xl w-full h-80 object-cover shadow-inner" />
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
         )}

         {/* Premium Special Offers & Deals */}
         {!homeContent.hiddenSections?.specialOffers && userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && userProfile?.role !== 'delivery_boy' && (
            <section className="py-8 sm:py-12 relative">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-left mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 reveal-on-scroll">
                     <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 font-headings">
                           Special Offers & Banners <span className="w-2 h-2 rounded-full bg-brand"></span>
                        </h2>
                        <p className="text-gray-500 text-xs mt-1 font-body">Unlock discount coupons and deals direct from organic farms.</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                     {/* Offer 1 */}
                     <div className="relative rounded-3xl reveal-on-scroll reveal-left overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 space-y-4">
                           <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono">
                              Weekend Special
                           </span>
                           <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo1Title}</h3>
                           <p className="text-emerald-100 text-xs max-w-sm font-medium font-body leading-relaxed">{homeContent.promo1Desc}</p>

                           <div className="flex flex-wrap items-center gap-4 pt-2">
                              <div className="bg-white text-slate-900 shadow-md border border-white/40 px-4 py-2 rounded-2xl flex items-center gap-2">
                                 <Tag size={14} className="text-emerald-600 shrink-0" />
                                 <span className="text-xs font-extrabold font-headings text-slate-700">Code: <span className="bg-emerald-100 text-emerald-950 font-black font-mono px-2 py-0.5 rounded-lg border border-emerald-300/80 ml-1">{homeContent.promo1Code}</span></span>
                              </div>
                              <Link to="/marketplace" className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 font-headings">
                                 Claim Offer <ArrowRight size={12} />
                              </Link>
                           </div>
                        </div>
                     </div>

                     {/* Offer 2 */}
                     <div className="relative rounded-3xl reveal-on-scroll reveal-right overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 space-y-4">
                           <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono">
                              Flat 15% Off
                           </span>
                           <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo2Title}</h3>
                           <p className="text-amber-100 text-xs max-w-sm font-medium font-body leading-relaxed">{homeContent.promo2Desc}</p>

                           <div className="flex flex-wrap items-center gap-4 pt-2">
                              <div className="bg-white text-slate-900 shadow-md border border-white/40 px-4 py-2 rounded-2xl flex items-center gap-2">
                                 <Percent size={14} className="text-orange-600 shrink-0" />
                                 <span className="text-xs font-extrabold font-headings text-slate-700">Code: <span className="bg-amber-300 text-slate-950 font-black font-mono px-2 py-0.5 rounded-lg border border-amber-400/80 ml-1 shadow-2xs">{homeContent.promo2Code}</span></span>
                              </div>
                              <Link to="/marketplace" className="bg-white text-amber-950 hover:bg-amber-50 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 font-headings">
                                 Shop Now <ArrowRight size={12} />
                              </Link>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </section>
         )}

         {/* Best Selling Harvest & Marketplace Showcase Section */}
         {!homeContent.hiddenSections?.bestSelling && userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && userProfile?.role !== 'delivery_boy' && userProfile?.role !== 'admin' && (
            <section className="py-16 sm:py-20 relative overflow-hidden bg-gradient-to-b from-slate-50/50 via-emerald-50/20 to-transparent">
               {/* Ambient Background Glows */}
               <div className="absolute top-1/3 left-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
               <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 text-left reveal-on-scroll">
                     <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border border-emerald-500/20 font-mono">
                           <Flame size={14} className="text-amber-500 animate-bounce" /> Hot Sellers & Trending Harvest
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headings text-gray-900 tracking-tight">
                           Best Selling Organic Produce
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm font-body max-w-lg">
                           Directly harvested from local organic farms. Click any item to explore full product details & buy directly.
                        </p>
                     </div>

                     {/* Explore Marketplace Link */}
                     <Link
                        to="/marketplace"
                        className="group bg-white hover:bg-emerald-600 text-slate-800 hover:text-white border border-slate-200 hover:border-emerald-600 px-6 py-3 rounded-2xl font-bold text-xs shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-headings shrink-0 active:scale-95"
                     >
                        <span>Explore More Products</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </Link>
                  </div>

                  {/* Interactive Category Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 mb-8 text-left reveal-on-scroll">
                     {[
                        { id: 'all', label: '🔥 All Best Sellers' },
                        { id: 'veggies', label: '🥬 Fresh Veggies' },
                        { id: 'fruits', label: '🍎 Farm Fruits' },
                        { id: 'dairy', label: '🥛 Dairy & Honey' }
                     ].map(tab => (
                        <button
                           key={tab.id}
                           type="button"
                           onClick={() => setSelectedCategory(tab.id)}
                           className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 whitespace-nowrap cursor-pointer font-headings ${selectedCategory === tab.id
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 scale-105'
                              : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 hover:border-emerald-200'
                              }`}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>

                  {/* Animated Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {displayedBestSellers.map((product) => (
                        <div
                           key={product.id}
                           onClick={() => navigate(`/product/${getProductSlug(product)}`)}
                           className="group bg-white/90 reveal-on-scroll reveal-scale backdrop-blur-md rounded-3xl border border-slate-100/90 hover:border-emerald-200/90 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01] overflow-hidden flex flex-col justify-between cursor-pointer relative text-left"
                        >
                           {/* Product Image Container */}
                           <div className="relative h-52 sm:h-56 bg-slate-50 overflow-hidden">
                              <img
                                 src={product.image}
                                 alt={product.name}
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              />

                              {/* Badges Overlay */}
                              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                 <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1 font-mono">
                                    <Flame size={10} /> Best Seller
                                 </span>
                                 {product.mrp && product.mrp > product.price && (
                                    <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md font-mono">
                                       {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                                    </span>
                                 )}
                              </div>

                              {/* Rating Badge */}
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 font-mono">
                                 <Star size={11} className="fill-amber-400 text-amber-400" />
                                 {product.rating || '4.9'}
                              </div>

                              {/* Hover Quick View Overlay */}
                              <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                 <span className="bg-white text-emerald-900 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 font-headings">
                                    <Eye size={14} /> Quick View
                                 </span>
                              </div>
                           </div>

                           {/* Card Body */}
                           <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div>
                                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-headings">
                                    <Sprout size={12} className="text-emerald-600" />
                                    <span className="truncate">{product.vendor || 'Local Organic Farm'}</span>
                                 </div>
                                 <h3 className="font-extrabold text-slate-900 text-base font-headings line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                    {product.name}
                                 </h3>
                                 <p className="text-[11px] text-slate-400 font-medium font-body truncate mt-0.5">
                                    Category: {product.category || 'Organic Harvest'}
                                 </p>
                              </div>

                              {/* Pricing & CTA */}
                              <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between">
                                 <div>
                                    <div className="flex items-baseline gap-1.5">
                                       <span className="text-lg font-black text-slate-900 font-sans">
                                          ₹{parseFloat(product.price).toFixed(2)}
                                       </span>
                                       {product.mrp && product.mrp > product.price && (
                                          <span className="text-xs text-slate-400 line-through font-body">
                                             ₹{parseFloat(product.mrp).toFixed(2)}
                                          </span>
                                       )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold font-body">per {product.unit || 'kg'}</span>
                                 </div>

                                 <button
                                    type="button"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       navigate(`/product/${getProductSlug(product)}`);
                                    }}
                                    className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 font-headings active:scale-95 shadow-xs"
                                 >
                                    <span>Buy Now</span>
                                    <ArrowRight size={12} />
                                 </button>
                              </div>
                           </div>

                        </div>
                     ))}
                  </div>

               </div>
            </section>
         )}

         {/* ── Top Offer Organic Markets & Shops Section ── */}
         {!homeContent.hiddenSections?.topOfferMarkets && userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && userProfile?.role !== 'delivery_boy' && userProfile?.role !== 'admin' && (
         <section className="py-14 sm:py-20 bg-slate-50/60 relative border-t border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

               {/* Header Container */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                  <div className="space-y-2">
                     <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-500/20 font-headings">
                        <Tag size={13} className="text-emerald-600" /> TOP OFFERS & FEATURED MARKETS
                     </span>
                     <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-headings">
                        Top Offer Organic Markets & Shops
                     </h2>
                     <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl font-body">
                        Certified local organic shops offering direct harvest discount deals, seasonal produce bundles & fast local delivery.
                     </p>
                  </div>

                  <Link
                     to="/marketplace?tab=markets"
                     className="inline-flex items-center gap-2 bg-white hover:bg-emerald-600 text-slate-800 hover:text-white px-5 py-3 rounded-2xl border border-slate-200 text-xs font-black shadow-xs hover:shadow-md transition-all duration-300 font-headings shrink-0 cursor-pointer self-start md:self-auto"
                  >
                     <span>Explore More Markets</span>
                     <ArrowRight size={14} />
                  </Link>
               </div>

               {/* Market Filter Chips */}
               <div className="flex flex-wrap items-center gap-2 text-left">
                  {[
                     { id: 'all', label: '🏷️ All Offer Markets' },
                     { id: 'high_discount', label: '🔥 Up to 35% OFF' },
                     { id: 'local', label: '📍 Near You (Karjat/Local)' },
                     { id: 'top_rated', label: '⭐ Top Rated (4.8+)' }
                  ].map(chip => (
                     <button
                        key={chip.id}
                        type="button"
                        onClick={() => setSelectedMarketFilter(chip.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 font-headings cursor-pointer ${selectedMarketFilter === chip.id
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 scale-102'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                           }`}
                     >
                        {chip.label}
                     </button>
                  ))}
               </div>

               {/* Markets Cards Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                  {displayedOfferMarkets.map((market) => (
                     <div
                        key={market.id}
                        onClick={() => navigate(`/marketplace?tab=markets&shop=${market.id}`)}
                        className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-950/[0.05] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                     >
                        {/* Cover Image & Badges */}
                        <div className="relative h-44 overflow-hidden bg-slate-900">
                           <img
                              src={market.image}
                              alt={market.name}
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                           {/* Discount Badge */}
                           <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-md font-mono flex items-center gap-1">
                              <Tag size={11} /> {market.discountText}
                           </div>

                           {/* Rating Badge */}
                           <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm font-mono flex items-center gap-1">
                              <Star size={11} className="fill-amber-300" /> {market.rating}
                           </div>

                           {/* Market Title & Distance */}
                           <div className="absolute bottom-3 left-3 right-3 text-white">
                              <h3 className="font-black text-base font-headings leading-tight drop-shadow-sm text-white line-clamp-1">
                                 {market.name}
                              </h3>
                              <div className="flex items-center justify-between text-[11px] text-slate-200 font-medium mt-1">
                                 <span className="flex items-center gap-1 truncate text-slate-200">
                                    <MapPin size={11} className="text-emerald-400 shrink-0" /> {market.location}
                                 </span>
                                 <span className="bg-emerald-900/80 backdrop-blur-md text-emerald-300 font-extrabold px-2 py-0.5 rounded-md text-[10px] shrink-0 border border-emerald-500/30 font-mono">
                                    📍 {market.distance}
                                 </span>
                              </div>
                           </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                           <div className="space-y-2">
                              {/* Tags */}
                              <div className="flex flex-wrap gap-1.5">
                                 {market.tags.map((t, idx) => (
                                    <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/60 font-body">
                                       {t}
                                    </span>
                                 ))}
                              </div>

                              {/* Offer Banner Text */}
                              <p className="text-xs text-slate-600 font-semibold line-clamp-2 font-body bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl text-emerald-900">
                                 🎁 <span className="font-bold">{market.offerTagline}</span>
                              </p>
                           </div>

                           {/* Action Button */}
                           <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-slate-400 font-mono uppercase tracking-wider">Direct Harvest</span>
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/marketplace?tab=markets&shop=${market.id}`);
                                 }}
                                 className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1 font-headings active:scale-95 shadow-xs"
                              >
                                 <span>Visit Store</span>
                                 <ArrowRight size={12} />
                              </button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

            </div>
         </section>
         )}

         {/* About FresVeg Section */}
         {!homeContent.hiddenSections?.about && (
            <section className="py-16 sm:py-20 relative bg-emerald-500/5">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">

                     {/* Text Column on Left */}
                     <div className="lg:col-span-7 space-y-6 reveal-on-scroll reveal-left">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight font-headings flex items-center gap-2">
                           {homeContent.aboutHeadline || 'About FresVeg'} <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block"></span>
                        </h2>

                        <div className="space-y-4 text-gray-500 text-sm sm:text-base leading-relaxed font-body">
                           <p>
                              {homeContent.aboutText1 || 'We are committed to providing the freshest, highest quality produce directly from our farms to your table. Our mission is to support local farmers while delivering exceptional products that nourish your family.'}
                           </p>
                           <p>
                              {homeContent.aboutText2 || 'Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive only the best nature has to offer.'}
                           </p>
                        </div>

                        <div className="pt-2">
                           <Link
                              to="/marketplace"
                              className="bg-brand hover:bg-brand-dark text-white px-7 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2 font-headings"
                           >
                              Shop Now <ArrowRight size={16} />
                           </Link>
                        </div>
                     </div>

                     {/* Image Column on Right */}
                     <div className="lg:col-span-5 relative flex justify-center reveal-on-scroll reveal-right">
                        <div className="w-full h-72 sm:h-80 lg:h-96 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-white">
                           <img
                              src="https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80"
                              alt="About FresVeg Organic Farms"
                              className="w-full h-full object-cover"
                           />
                        </div>
                     </div>

                  </div>
               </div>
            </section>
         )}

         {/* Our Farm-to-Table Animated Snake Process */}
         {!homeContent.hiddenSections?.process && (
            <FarmToTableSnakeProcess homeContent={homeContent} />
         )}

         {/* Why Choose FresVeg? */}
         {!homeContent.hiddenSections?.whyChoose && (
            <section className="py-20 relative bg-emerald-500/5">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                     <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight reveal-on-scroll">{homeContent.whyTitle || "Why Choose FresVeg?"}</h2>
                     <p className="text-gray-500 max-w-xl mx-auto text-sm">{homeContent.whySubtitle || "We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors."}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-8 reveal-on-scroll">
                     <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <Leaf size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{homeContent.why1Title || "Premium Fresh"}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{homeContent.why1Desc || "Sourced directly from local farmers ensuring maximum freshness, nutritional value, and unbelievable taste."}</p>
                     </div>
                     <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <Truck size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{homeContent.why2Title || "Fast Delivery"}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{homeContent.why2Desc || "Lightning fast delivery straight to your doorstep within hours of harvesting from the nearest farms."}</p>
                     </div>
                     <div className="p-8 rounded-3xl bg-white/60 backdrop-blur-sm border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-dark shadow-md text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <ShieldCheck size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{homeContent.why3Title || "Quality Assured"}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{homeContent.why3Desc || "Rigorous quality checks at every step to ensure you get only the finest and safest selection of produce."}</p>
                     </div>
                  </div>
               </div>
            </section>
         )}

         {/* What Our Customers Say */}
         {!homeContent.hiddenSections?.testimonials && (
            <section className="py-20 relative overflow-hidden bg-gradient-to-b from-transparent to-brand-light/20">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 reveal-on-scroll">
                  <div className="text-center">
                     <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{homeContent.testimonialsTitle || "What Our Customers Say"}</h2>
                     <p className="text-gray-500 max-w-xl mx-auto text-sm">{homeContent.testimonialsSubtitle || "Read verified feedback from home cooks, families, and chef partners who enjoy fresh farm deliveries weekly."}</p>
                  </div>
               </div>

               {/* Scrolling Marquee Container */}
               <div className="relative w-full overflow-hidden py-4 group">
                  {/* Subtle gradient side masks for smooth edge fade */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#f5f9f4] to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#f5f9f4] to-transparent z-20 pointer-events-none"></div>

                  <div className="animate-scroll-marquee flex gap-6 px-4 reveal-on-scroll">
                     {[
                        {
                           name: homeContent.test1Name || "Sarah Jenkins",
                           role: homeContent.test1Role || "Home Chef & Foodie",
                           quote: homeContent.test1Quote || "The strawberries and organic spinach are exceptionally sweet and fresh! Plus, knowing it supports local farmers directly makes every order feel great.",
                           image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test2Name || "David K. Sharma",
                           role: homeContent.test2Role || "Fitness Enthusiast",
                           quote: homeContent.test2Quote || "The bulk veggie box is a life saver for my meal prep. Everything stays crisp for over a week, and delivery is consistently quick. Highly recommended!",
                           image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test3Name || "Emma L. Davis",
                           role: homeContent.test3Role || "Parent & Nutritionist",
                           quote: homeContent.test3Quote || "We booked a farm tour weekend slot via 'Visit Farms', and our kids absolutely loved picking fresh apples and seeing the cows. A perfect family weekend setup!",
                           image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test4Name || "Rajesh V. Patel",
                           role: homeContent.test4Role || "Local Restaurant Owner",
                           quote: homeContent.test4Quote || "Ordering farm-fresh vegetables directly through FresVeg saved our kitchen over 20% on wholesale costs while improving our dish quality tremendously.",
                           image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test5Name || "Anita Roy",
                           role: homeContent.test5Role || "Organic Living Advocate",
                           quote: homeContent.test5Quote || "Pure cow ghee and raw honey jars from local farms are unbeatable in quality. You can taste the genuine purity in every single spoonful!",
                           image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test6Name || "Michael Rodriguez",
                           role: homeContent.test6Role || "Daily Shopper",
                           quote: homeContent.test6Quote || "The live order tracking map and rider contact details give me total peace of mind. Delivery always arrives right on time before breakfast!",
                           image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
                           rating: 5
                        },
                        /* Duplicated array sequence to form 100% seamless infinite loop */
                        {
                           name: homeContent.test1Name || "Sarah Jenkins",
                           role: homeContent.test1Role || "Home Chef & Foodie",
                           quote: homeContent.test1Quote || "The strawberries and organic spinach are exceptionally sweet and fresh! Plus, knowing it supports local farmers directly makes every order feel great.",
                           image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test2Name || "David K. Sharma",
                           role: homeContent.test2Role || "Fitness Enthusiast",
                           quote: homeContent.test2Quote || "The bulk veggie box is a life saver for my meal prep. Everything stays crisp for over a week, and delivery is consistently quick. Highly recommended!",
                           image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test3Name || "Emma L. Davis",
                           role: homeContent.test3Role || "Parent & Nutritionist",
                           quote: homeContent.test3Quote || "We booked a farm tour weekend slot via 'Visit Farms', and our kids absolutely loved picking fresh apples and seeing the cows. A perfect family weekend setup!",
                           image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test4Name || "Rajesh V. Patel",
                           role: homeContent.test4Role || "Local Restaurant Owner",
                           quote: homeContent.test4Quote || "Ordering farm-fresh vegetables directly through FresVeg saved our kitchen over 20% on wholesale costs while improving our dish quality tremendously.",
                           image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test5Name || "Anita Roy",
                           role: homeContent.test5Role || "Organic Living Advocate",
                           quote: homeContent.test5Quote || "Pure cow ghee and raw honey jars from local farms are unbeatable in quality. You can taste the genuine purity in every single spoonful!",
                           image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
                           rating: 5
                        },
                        {
                           name: homeContent.test6Name || "Michael Rodriguez",
                           role: homeContent.test6Role || "Daily Shopper",
                           quote: homeContent.test6Quote || "The live order tracking map and rider contact details give me total peace of mind. Delivery always arrives right on time before breakfast!",
                           image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
                           rating: 5
                        }
                     ].map((test, index) => (
                        <div
                           key={index}
                           className="w-[320px] sm:w-[360px] shrink-0 bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative"
                        >
                           <Quote className="absolute right-6 top-6 text-emerald-100/80" size={36} />
                           <div className="space-y-3 relative z-10">
                              <div className="flex items-center gap-0.5 text-amber-400">
                                 {[...Array(test.rating)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                              </div>
                              <p className="text-gray-600 text-xs leading-relaxed italic font-body">"{test.quote}"</p>
                           </div>
                           <div className="flex items-center gap-3 mt-5 border-t border-slate-100 pt-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                                 <img src={test.image} alt={test.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                 <h4 className="font-extrabold text-gray-900 text-xs truncate font-headings">{test.name}</h4>
                                 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider truncate font-body">{test.role}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
         )}
      </div>
   );
}
