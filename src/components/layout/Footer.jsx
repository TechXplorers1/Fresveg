import React from 'react';
import { Leaf, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-transparent to-brand-light/35 border-t border-brand/10 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="bg-gradient-to-br from-brand to-brand-dark text-white p-2 rounded-xl shadow-md">
                  <Leaf size={22} />
                </div>
                <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-transparent">FresVeg</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Premium, farm-fresh vegetables, fruits, and dairy products delivered directly to your door with love.
              </p>
            </div>
            
            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wider uppercase text-xs">Shop</h3>
               <ul className="space-y-3 text-sm font-semibold text-gray-500">
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Vegetables</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Fruits</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Dairy & Milk</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Bulk Orders</a></li>
               </ul>
            </div>

            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wider uppercase text-xs">Vendors</h3>
               <ul className="space-y-3 text-sm font-semibold text-gray-500">
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Become a Seller</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Seller Dashboard</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Bulk Selling</a></li>
                  <li><a href="#" className="hover:text-brand hover:translate-x-1 inline-block transform transition-all duration-200">Guidelines</a></li>
               </ul>
            </div>

            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wider uppercase text-xs">Connect</h3>
               <div className="flex space-x-3">
                  <a href="#" className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-brand hover:shadow-md hover:border-brand/20 transition-all duration-250"><Facebook size={16} /></a>
                  <a href="#" className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-brand hover:shadow-md hover:border-brand/20 transition-all duration-250"><Twitter size={16} /></a>
                  <a href="#" className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-brand hover:shadow-md hover:border-brand/20 transition-all duration-250"><Instagram size={16} /></a>
               </div>
            </div>
         </div>
         <div className="border-t border-gray-200/60 pt-8 text-center text-xs font-semibold text-gray-400">
            &copy; {new Date().getFullYear()} FresVeg. Crafted for visual excellence.
         </div>
      </div>
    </footer>
  );
}
