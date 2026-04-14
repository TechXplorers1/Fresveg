import React from 'react';
import { Leaf, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-light/50 border-t border-brand/10 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-brand text-white p-1.5 rounded-lg shadow-sm">
                  <Leaf size={24} />
                </div>
                <span className="font-bold text-2xl tracking-tight text-brand-dark">FresVeg</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Premium, farm-fresh vegetables, fruits, and dairy products delivered directly to your door with love.
              </p>
            </div>
            
            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wide uppercase text-sm">Shop</h3>
               <ul className="space-y-3 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Vegetables</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Fruits</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Dairy & Milk</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Bulk Orders</a></li>
               </ul>
            </div>

            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wide uppercase text-sm">Vendors</h3>
               <ul className="space-y-3 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Become a Seller</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Seller Dashboard</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Bulk Selling</a></li>
                  <li><a href="#" className="hover:text-brand transition-colors hover:translate-x-1 inline-block transform duration-200">Guidelines</a></li>
               </ul>
            </div>

            <div>
               <h3 className="font-bold text-gray-900 mb-4 tracking-wide uppercase text-sm">Connect</h3>
               <div className="flex space-x-4">
                  <a href="#" className="p-2 bg-white rounded-full text-gray-400 hover:text-brand hover:shadow-md transition-all duration-200"><Facebook size={18} /></a>
                  <a href="#" className="p-2 bg-white rounded-full text-gray-400 hover:text-brand hover:shadow-md transition-all duration-200"><Twitter size={18} /></a>
                  <a href="#" className="p-2 bg-white rounded-full text-gray-400 hover:text-brand hover:shadow-md transition-all duration-200"><Instagram size={18} /></a>
               </div>
            </div>
         </div>
         <div className="border-t border-brand/10 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FresVeg. All rights reserved.
         </div>
      </div>
    </footer>
  );
}
