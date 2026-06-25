import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Target, ShieldCheck, Truck, Star, Info, Tag, ArrowLeft, Store, RefreshCw, BadgePercent, Leaf, Zap } from 'lucide-react';

export default function ProductDetails() {
  const { id } = useParams();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const foundProduct = products.find(p => String(p.id) === String(id));
    if (foundProduct) {
      setProduct(foundProduct);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-8 uppercase tracking-wider">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <span className="text-slate-300">/</span>
        <span onClick={() => navigate('/#marketplace')} className="hover:text-emerald-600 transition-colors cursor-pointer">Marketplace</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-bold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12">
        
        {/* Left Column - Image Gallery */}
        <div className="lg:col-span-5">
           <div className="sticky top-24 space-y-5">
              <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-xl shadow-emerald-950/[0.02] overflow-hidden flex items-center justify-center min-h-[350px] sm:min-h-[400px] group">
                <img 
                   src={product.image || 'https://via.placeholder.com/500'} 
                   alt={product.name} 
                   className="max-h-[320px] object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                   onClick={() => addToCart(product)}
                   className="flex-1 bg-white/80 border-2 border-emerald-600 text-emerald-600 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 hover:shadow-md transition-all active:scale-[0.98]"
                 >
                   <ShoppingCart size={18} />
                   Add to Cart
                 </button>
                 <button 
                   onClick={() => {
                     addToCart(product);
                     navigate('/checkout');
                   }}
                   className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-900/20 transition-all duration-300 active:scale-[0.98]"
                 >
                   <Zap size={18} className="text-amber-300 fill-amber-300" />
                   Buy Now
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column - Product Payload */}
        <div className="lg:col-span-7 space-y-8">
           
           {/* Section 1: Title & Core Specs */}
           <div className="pb-6 border-b border-slate-100">
             <div className="flex flex-wrap items-center gap-2 mb-4">
               <span className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                 {product.category}
               </span>
               {isOrganic && (
                 <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                   <Leaf size={10} /> Organic
                 </span>
               )}
             </div>
             
             <h1 className="text-3xl sm:text-4xl font-black text-slate-800 font-headings mb-3 leading-tight">{product.name}</h1>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-amber-500 bg-amber-500/[0.04] border border-amber-500/15 px-2.5 py-1 rounded-lg">
                   <Star size={14} className="fill-current" />
                   <span className="ml-1 text-xs font-bold text-amber-700">{product.rating || "5.0"} Rating</span>
                </div>
                <div className="text-xs font-bold text-slate-400 hover:text-emerald-600 cursor-pointer uppercase tracking-wider">
                   Verified Quality
                </div>
             </div>

             <div className="flex flex-col">
               <span className="text-xs text-slate-400 line-through mb-1">M.R.P: ₹{(product.price * 1.25).toFixed(2)}</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-4xl font-black text-slate-800 font-sans">₹{parseFloat(product.price).toFixed(2)}</span>
                 <span className="text-sm text-slate-400 font-semibold font-headings">/ {product.unit}</span>
               </div>
               <span className="text-emerald-600 font-bold text-xs mt-1.5 flex items-center gap-1">
                 <ShieldCheck size={14} /> Inclusive of all taxes
               </span>
             </div>
           </div>

           {/* Sold By */}
           <div className="bg-emerald-500/[0.02] border border-emerald-500/10 p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-emerald-600">
                    <Store size={22} />
                 </div>
                 <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-0.5">Sold By Vendor</p>
                    <p className="font-bold text-slate-800 text-lg font-headings">{product.vendor}</p>
                 </div>
              </div>
           </div>

           {/* Offers */}
           <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 font-headings">
               <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <BadgePercent size={16} />
               </div>
               Available Deals & Offers
             </h3>
             <ul className="space-y-3">
               {displayOffers.map((offer, index) => (
                 <li key={index} className="flex items-start gap-3 p-4 bg-white/40 border border-slate-100 rounded-2xl hover:bg-white/80 transition-all duration-300">
                    <Tag className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{offer}"</p>
                 </li>
               ))}
             </ul>
           </div>

           {/* Features & Details */}
           <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 font-headings">
               <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <Target size={16} />
               </div>
               Features & Organic Quality
             </h3>
             <div className="bg-white/40 border border-slate-100 p-6 rounded-3xl shadow-sm text-xs text-slate-600 leading-relaxed">
               <ul className="list-disc pl-5 space-y-2.5 font-medium">
                 {displayFeatures.map((feature, index) => (
                   <li key={index} className="marker:text-emerald-500">{feature}</li>
                 ))}
               </ul>
             </div>
           </div>

           {/* Description */}
           <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 font-headings">
               <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <Info size={16} />
               </div>
               Harvest & Freshness Description
             </h3>
             <div className="bg-white/40 border border-slate-100 p-6 rounded-3xl shadow-sm text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
               <p>{displayDescription}</p>
             </div>
           </div>

           {/* Product Information */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/40 border border-slate-100/85 p-4 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Origin</p>
                 <p className="font-bold text-slate-800 text-sm font-headings truncate">{product.origin || 'Local Farms'}</p>
              </div>
              <div className="bg-white/40 border border-slate-100/85 p-4 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Diet Type</p>
                 <p className="font-bold text-slate-800 text-sm font-headings truncate">{product.preference || '100% Veg'}</p>
              </div>
              <div className="bg-white/40 border border-slate-100/85 p-4 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Shelf Life</p>
                 <p className="font-bold text-slate-800 text-sm font-headings truncate">{product.shelfLife || '3-5 Days'}</p>
              </div>
              <div className="bg-white/40 border border-slate-100/85 p-4 rounded-2xl text-center shadow-sm">
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-1">Net Weight</p>
                 <p className="font-bold text-slate-800 text-sm font-headings truncate">{product.netWeight || product.unit?.toUpperCase() || 'N/A'}</p>
              </div>
           </div>

           {/* Return Policy */}
           <div>
             <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 font-headings">
               <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <RefreshCw size={16} />
               </div>
               Return & Freshness Guarantee Policy
             </h3>
             <div className="bg-amber-500/[0.03] border border-amber-500/10 p-6 rounded-3xl shadow-sm text-xs text-slate-700 leading-relaxed font-medium">
               <p>{displayReturnPolicy}</p>
             </div>
           </div>

         </div>
       </div>
     </div>
   );
 }
