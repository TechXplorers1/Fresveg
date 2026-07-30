import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShieldCheck, Truck, Tag, Percent, Sprout, Box, MapPin, Star, Quote } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Home() {
   const { userProfile } = useAuth();
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
         <section className="py-8 sm:py-12 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="text-left mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                  <div>
                     <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 font-headings">
                        Special Offers & Banners <span className="w-2 h-2 rounded-full bg-brand"></span>
                     </h2>
                     <p className="text-gray-500 text-xs mt-1 font-body">Unlock discount coupons and deals direct from organic farms.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Offer 1 */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                     <div className="relative z-10 space-y-4">
                        <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono">
                           Weekend Special
                        </span>
                        <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo1Title}</h3>
                        <p className="text-emerald-100 text-xs max-w-sm font-medium font-body leading-relaxed">{homeContent.promo1Desc}</p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                           <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2">
                              <Tag size={13} className="text-emerald-300" />
                              <span className="text-xs font-black tracking-wide font-mono">Code: <span className="text-amber-300">{homeContent.promo1Code}</span></span>
                           </div>
                           <Link to="/marketplace" className="bg-white text-emerald-900 hover:bg-emerald-50 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 font-headings">
                              Claim Offer <ArrowRight size={12} />
                           </Link>
                        </div>
                     </div>
                  </div>

                  {/* Offer 2 */}
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 sm:p-8 text-left shadow-lg group hover:shadow-xl transition-all duration-300">
                     <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                     <div className="relative z-10 space-y-4">
                        <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono">
                           Flat 15% Off
                        </span>
                        <h3 className="text-2xl font-black font-headings leading-tight">{homeContent.promo2Title}</h3>
                        <p className="text-amber-100 text-xs max-w-sm font-medium font-body leading-relaxed">{homeContent.promo2Desc}</p>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                           <div className="bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2">
                              <Percent size={13} className="text-amber-200" />
                              <span className="text-xs font-black tracking-wide font-mono">Code: <span className="text-amber-200">{homeContent.promo2Code}</span></span>
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

         {/* ── About FresVeg Section ────────────────── */}
         <section className="py-16 sm:py-20 relative bg-emerald-500/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center text-left">

                  {/* Text Column on Left */}
                  <div className="lg:col-span-7 space-y-6">
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
                  <div className="lg:col-span-5 relative flex justify-center">
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

         {/* Our Farm-to-Table Process */}
         <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="text-center mb-16">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{homeContent.processTitle || "Our Farm-to-Table Process"}</h2>
                  <p className="text-gray-500 max-w-xl mx-auto text-sm">{homeContent.processSubtitle || "We maintain a clean, temperature-controlled, and highly efficient network to ship organic products from local soil directly to your shelf."}</p>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">

                  {/* Step 1 */}
                  <div className="space-y-4 text-center group">
                     <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <Sprout size={28} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-gray-900">{homeContent.process1Title || "1. Fresh Harvest"}</h3>
                        <p className="text-gray-505 text-xs leading-relaxed px-4">{homeContent.process1Desc || "Farmers pick organic produce only after you place your order to ensure peak flavor."}</p>
                     </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-4 text-center group">
                     <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <Box size={28} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-gray-900">{homeContent.process2Title || "2. Eco Packaging"}</h3>
                        <p className="text-gray-505 text-xs leading-relaxed px-4">{homeContent.process2Desc || "Items are sorted and wrapped in plastic-free biodegradable packets to protect the planet."}</p>
                     </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-4 text-center group">
                     <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <Truck size={28} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-gray-900">{homeContent.process3Title || "3. Swift Transit"}</h3>
                        <p className="text-gray-505 text-xs leading-relaxed px-4">{homeContent.process3Desc || "Delivery partners collect your box immediately and run optimized routes using maps."}</p>
                     </div>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-4 text-center group">
                     <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-inner flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                        <MapPin size={28} />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-base font-extrabold text-gray-900">{homeContent.process4Title || "4. Doorstep Joy"}</h3>
                        <p className="text-gray-505 text-xs leading-relaxed px-4">{homeContent.process4Desc || "Get contact-free drop off in under 4 hours, and scan farm codes for origin tracing."}</p>
                     </div>
                  </div>

               </div>
            </div>
         </section>

         {/* Why Choose FresVeg? */}
         <section className="py-20 relative bg-emerald-500/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="text-center mb-16">
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">{homeContent.whyTitle || "Why Choose FresVeg?"}</h2>
                  <p className="text-gray-500 max-w-xl mx-auto text-sm">{homeContent.whySubtitle || "We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors."}</p>
               </div>
               <div className="grid md:grid-cols-3 gap-8">
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

         {/* What Our Customers Say */}
         <section className="py-20 relative overflow-hidden bg-gradient-to-b from-transparent to-brand-light/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
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

               <div className="animate-scroll-marquee flex gap-6 px-4">
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
                        name: "Rajesh V. Patel",
                        role: "Local Restaurant Owner",
                        quote: "Ordering farm-fresh vegetables directly through FresVeg saved our kitchen over 20% on wholesale costs while improving our dish quality tremendously.",
                        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
                        rating: 5
                     },
                     {
                        name: "Anita Roy",
                        role: "Organic Living Advocate",
                        quote: "Pure cow ghee and raw honey jars from local farms are unbeatable in quality. You can taste the genuine purity in every single spoonful!",
                        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
                        rating: 5
                     },
                     {
                        name: "Michael Rodriguez",
                        role: "Daily Shopper",
                        quote: "The live order tracking map and rider contact details give me total peace of mind. Delivery always arrives right on time before breakfast!",
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
                        name: "Rajesh V. Patel",
                        role: "Local Restaurant Owner",
                        quote: "Ordering farm-fresh vegetables directly through FresVeg saved our kitchen over 20% on wholesale costs while improving our dish quality tremendously.",
                        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
                        rating: 5
                     },
                     {
                        name: "Anita Roy",
                        role: "Organic Living Advocate",
                        quote: "Pure cow ghee and raw honey jars from local farms are unbeatable in quality. You can taste the genuine purity in every single spoonful!",
                        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
                        rating: 5
                     },
                     {
                        name: "Michael Rodriguez",
                        role: "Daily Shopper",
                        quote: "The live order tracking map and rider contact details give me total peace of mind. Delivery always arrives right on time before breakfast!",
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
      </div>
   );
}
