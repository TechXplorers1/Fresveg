import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { realtimeDb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Instagram, Facebook, Youtube, Globe, MessageCircle, ShoppingCart, Target, ShieldCheck, Truck, Star, Info, Tag, ArrowLeft, ArrowRight, Store, RefreshCw, BadgePercent, Leaf, Zap, Minus, Plus } from 'lucide-react';

export function getProductSlug(product) {
   if (!product) return '';
   const name = typeof product === 'string' ? product : (product.name || product.title || '');
   const cleanName = name
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
   return cleanName || (product.id ? String(product.id) : 'product');
}

export default function ProductDetails() {
   const { id } = useParams();
   const { products } = useProducts();
   const { addToCart, cartItems, updateQuantity } = useCart();
   const { user, userProfile } = useAuth();
   const navigate = useNavigate();
   const [product, setProduct] = useState(null);
   const [vendorSocialLinks, setVendorSocialLinks] = useState(null);
   const [showMoreInfo, setShowMoreInfo] = useState(false);
   const [activeInfoTab, setActiveInfoTab] = useState('all');

   useEffect(() => {
      if (!product?.vendor) return;
      const usersRef = ref(realtimeDb, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
         const data = snapshot.val();
         if (data) {
            Object.values(data).forEach(u => {
               if (u.shops && Array.isArray(u.shops)) {
                  const foundShop = u.shops.find(s => s.shopName?.trim().toLowerCase() === product.vendor?.trim().toLowerCase());
                  if (foundShop && foundShop.socialLinks) {
                     setVendorSocialLinks(foundShop.socialLinks);
                  }
               }
            });
         }
      });
      return () => unsubscribe();
   }, [product]);

   useEffect(() => {
      window.scrollTo(0, 0);
      const targetSlug = String(id || '').toLowerCase().trim();

      const foundProduct = products.find(p => {
         const pSlug = getProductSlug(p).toLowerCase();
         const pId = String(p.id).toLowerCase();
         const pNameSlug = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
         return pSlug === targetSlug || pId === targetSlug || pNameSlug === targetSlug || targetSlug.includes(pNameSlug) || pNameSlug.includes(targetSlug);
      });

      if (foundProduct) {
         setProduct(foundProduct);
      } else {
         const farmsRef = ref(realtimeDb, 'farms');
         onValue(farmsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
               Object.values(data).forEach(farmItem => {
                  const farmProds = farmItem.farmProducts || [];
                  if (Array.isArray(farmProds)) {
                     const match = farmProds.find(fp => {
                        const fpSlug = getProductSlug(fp).toLowerCase();
                        const fpId = String(fp.id || '').toLowerCase();
                        const fpNameSlug = String(fp.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return fpSlug === targetSlug || fpId === targetSlug || fpNameSlug === targetSlug || targetSlug.includes(fpNameSlug);
                     });
                     if (match) {
                        const isDeliv = match.isDeliverable !== false && match.fulfillmentType !== 'non_deliverable';
                        setProduct({
                           ...match,
                           id: match.id || id,
                           name: match.name,
                           price: Number(match.price) || 50,
                           unit: match.unit || 'kg',
                           category: match.category || 'Direct Harvest',
                           image: match.image || farmItem.image,
                           vendor: farmItem.farmName || farmItem.vendorName || 'Farm Direct',
                           vendorId: farmItem.vendorId || match.vendorId || '',
                           vendorEmail: farmItem.vendorEmail || match.vendorEmail || '',
                           rating: match.rating || 5.0,
                           description: match.description || `Fresh ${match.name} harvested directly from ${farmItem.farmName || 'our organic farm'}.`,
                           isDeliverable: isDeliv,
                           fulfillmentType: isDeliv ? 'deliverable' : 'non_deliverable'
                        });
                     }
                  }
               });
            }
         }, { onlyOnce: true });
      }
   }, [id, products]);

   if (!product) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <button onClick={() => navigate('/#marketplace')} className="text-brand font-medium flex items-center gap-2 hover:underline">
               <ArrowLeft size={20} /> Back to Marketplace
            </button>
         </div>
      );
   }

   // Generate dynamic mockup content based on category/name
   const isOrganic = product.name.toLowerCase().includes('organic');
   const dummyDescription = `The ${product.name} is sourced directly from certified farms to ensure maximum freshness and quality. Hand-picked at peak ripeness, this product guarantees exceptional taste and nutritional value.`;

   const displayDescription = product.description || dummyDescription;
   const displayOffers = (product.offers && product.offers.length > 0) ? product.offers : [
      "Bank Offer: Get 10% instant discount on FresVeg Credit Card, up to $20 on orders above $50.",
      "Partner Offer: Sign up for FresVeg Wallet and get a flat $5 cashback directly into your account!"
   ];
   const displayFeatures = (product.features && product.features.length > 0) ? product.features : [
      "Specially hand-picked to ensure maximum natural flavor and nutrient retention.",
      "Rigorous 5-step quality screening before being dispatched from the farm.",
      "Contains completely zero artificial colors, preservatives, or polishing waxes.",
      "Rich source of natural vitamins and dietary fibers."
   ];
   const displayReturnPolicy = product.returnPolicy || "This product is eligible for return within 48 hours of delivery. if the item is delivered in a damaged or defective condition, you may request a refund natively through the Marketplace application.";

   const cartItem = cartItems.find(item => String(item.id) === String(product.id));

   // ─── Shop Suggestions Logic ────────────────────────────────────────────────
   const sameShopProducts = products.filter(p => p.vendor === product.vendor && String(p.id) !== String(product.id));

   // If the same shop has fewer than 4 products, fill remaining slots with same-category or related products
   const categoryProducts = products.filter(p => p.category === product.category && String(p.id) !== String(product.id) && !sameShopProducts.some(sp => String(sp.id) === String(p.id)));

   const suggestedProducts = [...sameShopProducts, ...categoryProducts].slice(0, 4);

   return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen">
         {/* Breadcrumb Navigation */}
         <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3.5 uppercase tracking-wider">
            <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <span onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/#marketplace'); }} className="hover:text-emerald-600 transition-colors cursor-pointer">Marketplace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-bold">{product.name}</span>
         </nav>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-8">

            {/* Left Column - Image Gallery */}
            <div className="lg:col-span-5">
               <div className="sticky top-24 space-y-3.5">
                  <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-950/[0.02] overflow-hidden flex items-center justify-center min-h-[260px] sm:min-h-[300px] group">
                     <img
                        src={product.image || 'https://via.placeholder.com/500'}
                        alt={product.name}
                        className="max-h-[240px] sm:max-h-[280px] object-contain group-hover:scale-105 transition-transform duration-500"
                     />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                     {userProfile?.role === 'vendor' && Boolean(
                        (product.vendorId && String(product.vendorId) === String(user?.uid)) ||
                        (product.vendorEmail && user?.email && product.vendorEmail.toLowerCase() === user.email.toLowerCase()) ||
                        (product.vendor && userProfile.displayName && product.vendor.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase())
                     ) ? (
                        <div className="flex-1 bg-slate-100 border border-slate-200 text-slate-600 p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center">
                           <span>Owner View — You cannot order your own farm products.</span>
                        </div>
                     ) : product.isDeliverable === false || product.fulfillmentType === 'non_deliverable' ? (
                        <div className="flex-1 bg-amber-50 border-2 border-amber-300 text-amber-900 p-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 text-center font-headings">
                           <Store size={18} className="text-amber-600 shrink-0" />
                           <span>🚜 Farm Pickup Only: Visit Farm In-Person to Buy</span>
                        </div>
                     ) : (
                        <>
                           {cartItem ? (
                              <div className="flex-1 flex items-center justify-between bg-slate-50/50 border-2 border-slate-200/60 rounded-2xl p-1 font-bold h-[48px]">
                                 <button
                                    onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                    className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-emerald-600 hover:bg-slate-50 transition-all active:scale-[0.95]"
                                 >
                                    <Minus size={15} strokeWidth={3} />
                                 </button>
                                 <span className="text-slate-800 text-sm font-black font-sans px-3">{cartItem.quantity}</span>
                                 <button
                                    onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                    className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all active:scale-[0.95]"
                                 >
                                    <Plus size={15} strokeWidth={3} />
                                 </button>
                              </div>
                           ) : (
                              <button
                                 onClick={() => addToCart(product)}
                                 className="flex-1 bg-white/80 border-2 border-emerald-600 text-emerald-600 h-[48px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 hover:shadow-md transition-all active:scale-[0.98]"
                              >
                                 <ShoppingCart size={17} />
                                 Add to Cart
                              </button>
                           )}
                           <button
                              onClick={() => {
                                 if (!cartItem) {
                                    addToCart(product);
                                 }
                                 navigate('/checkout');
                              }}
                              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white h-[48px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-300 active:scale-[0.98]"
                           >
                              <Zap size={17} className="text-amber-300 fill-amber-300" />
                              Buy Now
                           </button>
                        </>
                     )}
                  </div>
               </div>
            </div>

            {/* Right Column - Product Payload */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-3.5">

               {/* Section 1: Title & Core Specs */}
               <div className="pb-3 border-b border-slate-100 text-left">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                     <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {product.category}
                     </span>
                     {product.isDeliverable === false || product.fulfillmentType === 'non_deliverable' ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-mono">
                           <Store size={11} /> 🚜 Farm Pickup Only (Non-Deliverable)
                        </span>
                     ) : (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-mono">
                           <Truck size={11} /> Home Delivery Available 🚚
                        </span>
                     )}
                     {isOrganic && (
                        <span className="bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                           <Leaf size={10} /> Organic
                        </span>
                     )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-headings mb-1.5 leading-tight">{product.name}</h1>

                  <div className="flex items-center gap-3 mb-2.5">
                     <div className="flex items-center text-amber-500 bg-amber-500/[0.04] border border-amber-500/15 px-2 py-0.5 rounded-lg">
                        <Star size={13} className="fill-current" />
                        <span className="ml-1 text-[11px] font-bold text-amber-700">{product.rating || "5.0"} Rating</span>
                     </div>
                     <div className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 cursor-pointer uppercase tracking-wider">
                        Verified Quality
                     </div>
                  </div>

                  <div className="flex flex-col">
                     <span className="text-[11px] text-slate-400 line-through mb-0.5">M.R.P: ₹{parseFloat(product.mrp || (product.price * 1.25)).toFixed(2)}</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-800 font-sans">₹{parseFloat(product.price).toFixed(2)}</span>
                        <span className="text-xs text-slate-400 font-semibold font-headings">/ {product.unit}</span>
                     </div>
                     <span className="text-emerald-600 font-bold text-[11px] mt-0.5 flex items-center gap-1">
                        <ShieldCheck size={13} /> Inclusive of all taxes
                     </span>
                  </div>
               </div>

               {/* Sold By */}
               <div
                  onClick={() => {
                     const shopSlug = (product.vendor || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                     navigate(`/marketplace?tab=markets&shop=${shopSlug}`);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-emerald-500/[0.02] border border-emerald-500/10 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-500/[0.06] hover:border-emerald-500/30 transition-all group shadow-2xs"
                  title={`View ${product.vendor} Shop Storefront`}
               >
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                        <Store size={18} />
                     </div>
                     <div className="text-left">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-0.5">Sold By Vendor / Shop</p>
                        <p className="font-bold text-slate-800 text-sm font-headings group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                           {product.vendor} <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">View Shop →</span>
                        </p>
                     </div>
                  </div>
               </div>

               {/* Quick Summary Highlights Bar */}
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                  <div className="bg-slate-50/80 border border-slate-200/60 p-2 sm:p-2.5 rounded-xl">
                     <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Origin</p>
                     <p className="font-extrabold text-slate-800 text-[11px] truncate">{product.origin || 'India'}</p>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-200/60 p-2 sm:p-2.5 rounded-xl">
                     <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Diet Type</p>
                     <p className="font-extrabold text-slate-800 text-[11px] truncate">{product.preference || 'Vegetarian'}</p>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-200/60 p-2 sm:p-2.5 rounded-xl">
                     <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Shelf Life</p>
                     <p className="font-extrabold text-slate-800 text-[11px] truncate">{product.shelfLife || '7 days'}</p>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-200/60 p-2 sm:p-2.5 rounded-xl">
                     <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Quantity</p>
                     <p className="font-extrabold text-slate-800 text-[11px] truncate">{product.netWeight || product.quantity || '1'}</p>
                  </div>
               </div>

               {/* Collapsible / Tabbed "More Info" Section */}
               <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs transition-all duration-300">
                  <button
                     type="button"
                     onClick={() => setShowMoreInfo(!showMoreInfo)}
                     className="w-full p-3 sm:p-3.5 flex items-center justify-between bg-slate-50/90 hover:bg-slate-100/90 transition-colors text-left cursor-pointer font-headings"
                  >
                     <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                           <Info size={16} />
                        </div>
                        <div>
                           <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm font-headings flex items-center gap-1.5 flex-wrap">
                              More Info
                              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                                 Deals, Features & Policies
                              </span>
                           </h3>
                           <p className="text-[11px] text-slate-500 font-medium">Click to view deals, features, harvest description & return policy</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-bold text-emerald-700 bg-white border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                           {showMoreInfo ? 'Hide Info ▲' : 'Show More Info ▼'}
                        </span>
                     </div>
                  </button>

                  {showMoreInfo && (
                     <div className="p-4 sm:p-5 border-t border-slate-200/80 space-y-4 text-left animate-fade-in bg-white/50">
                        {/* Quick Navigation Tabs inside More Info */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide border-b border-slate-100">
                           <button
                              type="button"
                              onClick={() => setActiveInfoTab('all')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeInfoTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              All Details
                           </button>
                           <button
                              type="button"
                              onClick={() => setActiveInfoTab('offers')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeInfoTab === 'offers' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              Deals & Offers
                           </button>
                           <button
                              type="button"
                              onClick={() => setActiveInfoTab('features')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeInfoTab === 'features' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              Features & Quality
                           </button>
                           <button
                              type="button"
                              onClick={() => setActiveInfoTab('harvest')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeInfoTab === 'harvest' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              Harvest Description
                           </button>
                           <button
                              type="button"
                              onClick={() => setActiveInfoTab('return')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${activeInfoTab === 'return' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                           >
                              Return Policy
                           </button>
                        </div>

                        {/* TAB 1: OFFERS */}
                        {(activeInfoTab === 'all' || activeInfoTab === 'offers') && (
                           <div>
                              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-headings">
                                 <BadgePercent size={15} className="text-emerald-600" /> Available Deals & Offers
                              </h4>
                              <ul className="space-y-2">
                                 {displayOffers.map((offer, index) => (
                                    <li key={index} className="flex items-start gap-2.5 p-3 bg-white border border-slate-100 rounded-xl shadow-2xs">
                                       <Tag className="text-emerald-500 flex-shrink-0 mt-0.5" size={14} />
                                       <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{offer}"</p>
                                    </li>
                                 ))}
                              </ul>
                           </div>
                        )}

                        {/* TAB 2: FEATURES */}
                        {(activeInfoTab === 'all' || activeInfoTab === 'features') && (
                           <div>
                              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-headings">
                                 <Target size={15} className="text-emerald-600" /> Features & Organic Quality
                              </h4>
                              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs text-[11px] text-slate-600 leading-relaxed">
                                 <ul className="list-disc pl-4 space-y-1.5 font-medium">
                                    {displayFeatures.map((feature, index) => (
                                       <li key={index} className="marker:text-emerald-500">{feature}</li>
                                    ))}
                                 </ul>
                              </div>
                           </div>
                        )}

                        {/* TAB 3: HARVEST & SPECS */}
                        {(activeInfoTab === 'all' || activeInfoTab === 'harvest') && (
                           <div className="space-y-3">
                              <div>
                                 <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-headings">
                                    <Info size={15} className="text-emerald-600" /> Harvest & Freshness Description
                                 </h4>
                                 <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-2xs text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                                    <p>{displayDescription}</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                 <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-2xs">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Origin</p>
                                    <p className="font-bold text-slate-800 text-[11px] font-headings truncate">{product.origin || 'India'}</p>
                                 </div>
                                 <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-2xs">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Diet Type</p>
                                    <p className="font-bold text-slate-800 text-[11px] font-headings truncate">{product.preference || 'Vegetarian'}</p>
                                 </div>
                                 <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-2xs">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Shelf Life</p>
                                    <p className="font-bold text-slate-800 text-[11px] font-headings truncate">{product.shelfLife || '7 days'}</p>
                                 </div>
                                 <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-center shadow-2xs">
                                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider mb-0.5">Quantity</p>
                                    <p className="font-bold text-slate-800 text-[11px] font-headings truncate">{product.netWeight || product.quantity || '1'}</p>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* TAB 4: RETURN POLICY */}
                        {(activeInfoTab === 'all' || activeInfoTab === 'return') && (
                           <div>
                              <h4 className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-headings">
                                 <RefreshCw size={15} className="text-emerald-600" /> Return & Freshness Guarantee Policy
                              </h4>
                              <div className="bg-amber-500/[0.04] border border-amber-500/15 p-4 rounded-xl shadow-2xs text-[11px] text-slate-700 leading-relaxed font-medium">
                                 <p>{displayReturnPolicy}</p>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </div>

            </div>
         </div>

         {/* ─── Suggested Products Section (Same Shop / Related) ───────────────── */}
         {suggestedProducts.length > 0 && (
            <div className="mt-8 sm:mt-10 border-t border-slate-200/80 pt-6 sm:pt-7 text-left">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                  <div>
                     <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <Store size={18} />
                        <span className="text-xs font-black uppercase tracking-wider font-headings">Shop Collection</span>
                     </div>
                     <h2 className="text-2xl font-black text-slate-800 font-headings">
                        More Products From <span className="text-emerald-700">{product.vendor}</span>
                     </h2>
                  </div>
                  <button
                     type="button"
                     onClick={() => {
                        const shopSlug = (product.vendor || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        navigate(`/marketplace?tab=markets&shop=${shopSlug}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                     }}
                     className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-headings active:scale-95 transition-all self-start sm:self-auto bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-100/50 cursor-pointer shadow-2xs"
                  >
                     Explore More Products <ArrowRight size={14} />
                  </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {suggestedProducts.map((item) => (
                     <div
                        key={item.id}
                        onClick={() => {
                           navigate(`/product/${getProductSlug(item)}`);
                           window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-4 shadow-sm hover:shadow-xl hover:shadow-emerald-950/[0.03] transition-all duration-300 flex flex-col group cursor-pointer"
                     >
                        <div className="relative h-40 bg-slate-50 rounded-2xl overflow-hidden mb-3 flex items-center justify-center p-3">
                           <img
                              src={item.image || 'https://via.placeholder.com/200'}
                              alt={item.name}
                              className="max-h-full object-contain group-hover:scale-108 transition-transform duration-300"
                           />
                           <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-emerald-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-slate-100">
                              {item.category}
                           </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                           <div>
                              <h4 className="font-bold text-slate-800 text-sm font-headings truncate group-hover:text-emerald-600 transition-colors mb-1">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 font-body"><Store size={10} className="text-emerald-600" />{item.vendor}</p>
                           </div>

                           <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                              <div>
                                 <span className="text-xs text-slate-400 line-through block">₹{parseFloat(item.mrp || (item.price * 1.25)).toFixed(2)}</span>
                                 <span className="font-black text-slate-800 text-base font-sans">₹{parseFloat(item.price).toFixed(2)}</span>
                                 <span className="text-[10px] text-slate-400 font-medium"> / {item.unit || 'kg'}</span>
                              </div>

                              {(() => {
                                 const itemCart = cartItems.find(c => String(c.id) === String(item.id));
                                 return itemCart ? (
                                    <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-xl p-1 shadow-xs" onClick={(e) => e.stopPropagation()}>
                                       <button
                                          type="button"
                                          onClick={() => updateQuantity(item.id, itemCart.quantity - 1)}
                                          className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-90 font-black"
                                       >
                                          <Minus size={12} strokeWidth={3} />
                                       </button>
                                       <span className="text-xs font-black text-slate-800 px-1 font-sans text-center min-w-[16px]">{itemCart.quantity}</span>
                                       <button
                                          type="button"
                                          onClick={() => updateQuantity(item.id, itemCart.quantity + 1)}
                                          className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all duration-200 active:scale-90 font-black"
                                       >
                                          <Plus size={12} strokeWidth={3} />
                                       </button>
                                    </div>
                                 ) : (
                                    <button
                                       type="button"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(item);
                                       }}
                                       className="bg-emerald-600 text-white hover:bg-emerald-700 p-2.5 rounded-xl transition-all duration-300 shadow-md shadow-emerald-900/10 active:scale-95 flex items-center justify-center"
                                       title="Add to Cart"
                                    >
                                       <ShoppingCart size={15} />
                                    </button>
                                 );
                              })()}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

      </div>
   );
}
