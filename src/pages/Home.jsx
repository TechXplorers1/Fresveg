import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Truck, Tag, Percent, Sprout, Box, MapPin, Star, Quote } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase';

export default function Home() {
  const [homeContent, setHomeContent] = useState({
    heroHeadline: "Fresh Organic Produce Directly From Farms",
    heroDescription: "Connect directly with local organic farmers. Freshly harvested vegetables, fruits, and pure dairy products delivered to your door in hours.",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    aboutHeadline: "About FresVeg",
    aboutText1: "We are committed to providing the freshest, highest quality produce directly from our farms to your table. Our mission is to support local farmers while delivering exceptional products that nourish your family.",
    aboutText2: "Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive only the best nature has to offer.",
    aboutImage: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80",
    promo1Title: "Fresh Fruit Harvest Box",
    promo1Desc: "Get a handpicked assortment of organic seasonal fruits including strawberries, apples, and oranges.",
    promo1Code: "FRUIT20",
    promo2Title: "Bulk Veggies Discount",
    promo2Desc: "Stock up your kitchen with potatoes, onions, tomatoes, and greens. Harvested fresh and shipped in bulk.",
    promo2Code: "BULK15"
  });

  useEffect(() => {
    const homeContentRef = ref(realtimeDb, 'homeContent');
    const unsubscribe = onValue(homeContentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setHomeContent(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

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
                     {homeContent.heroHeadline}
                  </h1>
                  <p className="text-gray-500 text-base sm:text-lg leading-relaxed max-w-xl">
                     {homeContent.heroDescription}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                     <Link to="/marketplace" className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-lg shadow-brand/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                        Explore Marketplace
                     </Link>
                     <Link to="/auth?redirect=profile" className="bg-white/70 hover:bg-white text-gray-800 border border-gray-200 px-8 py-4 rounded-full font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md">
                        Become a Vendor
                     </Link>
                  </div>
               </div>
               <div className="lg:col-span-5 relative flex justify-center">
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

      {/* Premium Special Offers & Deals */}
      <section className="py-12 relative">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-left mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
               <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                     Special Offers & Banners <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </h2>
                  <p className="text-gray-500 text-xs mt-1">Unlock discount coupons and deals direct from organic farms.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               {/* Offer 1 */}
               <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                  <div className="relative z-10 space-y-4">
                     <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Weekend Special
                     </span>
                     <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo1Title}</h3>
                     <p className="text-emerald-100 text-xs max-w-sm font-medium">{homeContent.promo1Desc}</p>
                     
                     <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                           <Tag size={13} className="text-emerald-300" />
                           <span className="text-xs font-black tracking-wide">Code: <span className="text-amber-300">{homeContent.promo1Code}</span></span>
                        </div>
                        <Link to="/marketplace" className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1">
                           Claim Offer <ArrowRight size={12} />
                        </Link>
                     </div>
                  </div>
               </div>

               {/* Offer 2 */}
               <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                  <div className="relative z-10 space-y-4">
                     <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider">
                        Flat 15% Off
                     </span>
                     <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo2Title}</h3>
                     <p className="text-amber-100 text-xs max-w-sm font-medium">{homeContent.promo2Desc}</p>
                     
                     <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                           <Percent size={13} className="text-amber-200" />
                           <span className="text-xs font-black tracking-wide">Code: <span className="text-amber-200">{homeContent.promo2Code}</span></span>
                        </div>
                        <Link to="/marketplace" className="bg-white text-amber-950 hover:bg-amber-50 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1">
                           Shop Now <ArrowRight size={12} />
                        </Link>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* Features */}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Premium Fresh</h3>
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

      {/* Supply Chain Journey */}
      <section className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Our Farm-to-Table Process</h2>
               <p className="text-gray-500 max-w-xl mx-auto text-sm">We maintain a clean, temperature-controlled, and highly efficient network to ship organic products from local soil directly to your shelf.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
               
               {/* Step 1 */}
               <div className="space-y-4 text-center group">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                     <Sprout size={28} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base font-extrabold text-gray-900">1. Fresh Harvest</h3>
                     <p className="text-gray-505 text-xs leading-relaxed px-4">Farmers pick organic produce only after you place your order to ensure peak flavor.</p>
                  </div>
               </div>

               {/* Step 2 */}
               <div className="space-y-4 text-center group">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                     <Box size={28} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base font-extrabold text-gray-900">2. Eco Packaging</h3>
                     <p className="text-gray-505 text-xs leading-relaxed px-4">Items are sorted and wrapped in plastic-free biodegradable packets to protect the planet.</p>
                  </div>
               </div>

               {/* Step 3 */}
               <div className="space-y-4 text-center group">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                     <Truck size={28} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base font-extrabold text-gray-900">3. Swift Transit</h3>
                     <p className="text-gray-505 text-xs leading-relaxed px-4">Delivery partners collect your box immediately and run optimized routes using maps.</p>
                  </div>
               </div>

               {/* Step 4 */}
               <div className="space-y-4 text-center group">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                     <MapPin size={28} />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-base font-extrabold text-gray-900">4. Doorstep Joy</h3>
                     <p className="text-gray-505 text-xs leading-relaxed px-4">Get contact-free drop off in under 4 hours, and scan farm codes for origin tracing.</p>
                  </div>
               </div>

            </div>
         </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 relative bg-gradient-to-b from-transparent to-brand-light/20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">What Our Customers Say</h2>
               <p className="text-gray-500 max-w-xl mx-auto text-sm">Read verified feedback from home cooks and families who enjoy fresh farm deliveries weekly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               
               {/* Testimonial 1 */}
               <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative">
                  <Quote className="absolute right-8 top-8 text-emerald-100" size={40} />
                  <div className="space-y-4 relative z-10">
                     <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                     </div>
                     <p className="text-gray-600 text-xs leading-relaxed italic">"The strawberries are exceptionally sweet and fresh, nothing like the supermarket ones. Plus, knowing it supports local farmers directly makes every order feel great."</p>
                  </div>
                  <div className="flex items-center gap-3.5 mt-6 border-t border-gray-100 pt-4">
                     <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="Sarah J." className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-gray-900 text-xs">Sarah J.</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Home Cook</p>
                     </div>
                  </div>
               </div>

               {/* Testimonial 2 */}
               <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative">
                  <Quote className="absolute right-8 top-8 text-emerald-100" size={40} />
                  <div className="space-y-4 relative z-10">
                     <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                     </div>
                     <p className="text-gray-600 text-xs leading-relaxed italic">"The bulk veggie box is a life saver for my meal prep. Everything stays crisp for over a week, and delivery is consistently quick. Highly recommended!"</p>
                  </div>
                  <div className="flex items-center gap-3.5 mt-6 border-t border-gray-100 pt-4">
                     <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" alt="David K." className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-gray-900 text-xs">David K.</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fitness Enthusiast</p>
                     </div>
                  </div>
               </div>

               {/* Testimonial 3 */}
               <div className="bg-white/70 backdrop-blur-md rounded-3xl p-8 border border-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left relative">
                  <Quote className="absolute right-8 top-8 text-emerald-100" size={40} />
                  <div className="space-y-4 relative z-10">
                     <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                     </div>
                     <p className="text-gray-600 text-xs leading-relaxed italic">"We booked a farm tour weekend slots via 'Visit Farms' link, and our kids absolutely loved picking fruits and seeing cows. A perfect weekend refreshment setup!"</p>
                  </div>
                  <div className="flex items-center gap-3.5 mt-6 border-t border-gray-100 pt-4">
                     <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" alt="Emma L." className="w-full h-full object-cover" />
                     </div>
                     <div>
                        <h4 className="font-extrabold text-gray-900 text-xs">Emma L.</h4>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Parent</p>
                     </div>
                  </div>
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
                     {homeContent.aboutHeadline} <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  </h2>
                  <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
                     <p>
                        {homeContent.aboutText1}
                     </p>
                     <p>
                        {homeContent.aboutText2}
                     </p>
                  </div>
                  <Link to="/marketplace" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide transition-all shadow-lg shadow-brand/10 hover:-translate-y-0.5 active:translate-y-0">
                     Shop Now <ArrowRight size={18} />
                  </Link>
               </div>
               <div className="relative flex justify-center">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-light rounded-full blur-3xl opacity-60"></div>
                  <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-10 max-w-md w-full hover:scale-101 transition-transform">
                     <img src={homeContent.aboutImage} alt="Farm Fresh Produce" className="w-full h-88 object-cover" />
                  </div>
               </div>
            </div>
         </div>
      </section>
   </div>
  );
}
