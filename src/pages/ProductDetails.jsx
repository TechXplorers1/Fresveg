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
      <nav className="flex text-sm text-gray-500 mb-8 font-medium">
        <Link to="/" className="hover:text-brand transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <span onClick={() => { navigate('/#marketplace') }} className="hover:text-brand transition-colors cursor-pointer">Marketplace</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column - Image Gallery */}
        <div className="lg:col-span-5">
           <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-hidden flex items-center justify-center min-h-[400px]">
                <img 
                   src={product.image || 'https://via.placeholder.com/500'} 
                   alt={product.name} 
                   className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={() => addToCart(product)}
                   className="flex-1 bg-white border-2 border-brand text-brand py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-light transition-colors shadow-sm"
                 >
                   <ShoppingCart size={20} />
                   Add to Cart
                 </button>
                 <button 
                   onClick={() => {
                     addToCart(product);
                     navigate('/checkout');
                   }}
                   className="flex-1 bg-brand text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-dark transition-colors shadow-sm"
                 >
                   <Zap size={20} />
                   Buy Now
                 </button>
              </div>
           </div>
        </div>

        {/* Right Column - Product Payload */}
        <div className="lg:col-span-7 space-y-8">
           
           {/* Section 1: Title & Core Specs */}
           <div className="pb-6 border-b border-gray-200">
             <div className="flex items-center gap-3 mb-3">
               <span className="bg-brand-light text-brand px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                 {product.category}
               </span>
               {isOrganic && (
                 <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                   <Leaf size={12} /> Organic
                 </span>
               )}
             </div>
             
             <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-yellow-400 bg-yellow-50 px-2 py-1 rounded-md">
                   <Star size={16} className="fill-current" />
                   <span className="ml-1 text-sm font-bold text-yellow-700">{product.rating || "5.0"} Rating</span>
                </div>
                <div className="text-sm text-gray-500 hover:text-brand cursor-pointer">
                   Verified Product
                </div>
             </div>

             <div className="flex flex-col">
               <span className="text-sm text-gray-500 line-through mb-1">M.R.P: ${(product.price * 1.25).toFixed(2)}</span>
               <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-gray-900">${parseFloat(product.price).toFixed(2)}</span>
                 <span className="text-lg text-gray-500 font-medium">/ {product.unit}</span>
               </div>
               <span className="text-green-600 font-bold text-sm mt-1">Inclusive of all taxes</span>
             </div>
           </div>

           {/* Sold By */}
           <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-2.5 rounded-full shadow-sm text-blue-500">
                    <Store size={24} />
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Sold By</p>
                    <p className="font-bold text-gray-900 text-lg">{product.vendor}</p>
                 </div>
              </div>
           </div>

           {/* Offers */}
           <div>
             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <BadgePercent className="text-brand" /> Available Offers
             </h3>
             <ul className="space-y-3">
               {displayOffers.map((offer, index) => (
                 <li key={index} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Tag className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-gray-600 italic font-medium">"{offer}"</p>
                 </li>
               ))}
             </ul>
           </div>

           {/* Features & Details */}
           <div>
             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Target className="text-brand" /> Features & Details
             </h3>
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed space-y-2">
               <ul className="list-disc pl-5 space-y-2">
                 {displayFeatures.map((feature, index) => (
                   <li key={index}>{feature}</li>
                 ))}
               </ul>
             </div>
           </div>

           {/* Description */}
           <div>
             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Info className="text-brand" /> Description
             </h3>
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
               <p>{displayDescription}</p>
             </div>
           </div>

           {/* Product Information */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Country of Origin</p>
                 <p className="font-bold text-gray-900">{product.origin || 'Not Specified'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Food Preference</p>
                 <p className="font-bold text-gray-900">{product.preference || 'Vegetarian'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Maximum Shelf Life</p>
                 <p className="font-bold text-gray-900">{product.shelfLife || 'Not Specified'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                 <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Unit / Net Weight</p>
                 <p className="font-bold text-gray-900">{product.netWeight || product.unit?.toUpperCase() || 'N/A'}</p>
              </div>
           </div>

           {/* Return Policy */}
           <div>
             <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <RefreshCw className="text-brand" /> Return Policy
             </h3>
             <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 shadow-sm text-sm text-gray-700 leading-relaxed">
               <p>{displayReturnPolicy}</p>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}
