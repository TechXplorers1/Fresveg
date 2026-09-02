import React from 'react';
import { 
  Leaf, Facebook, Instagram, ShieldCheck, Truck, Clock, Heart, ChevronUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-100 relative overflow-hidden border-t-4 border-emerald-600 mt-auto pt-16 pb-12">
      {/* Decorative background glow accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">


        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-900/40">
                <Leaf size={22} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white font-headings">FresVeg</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed font-body">
              Premium, farm-fresh vegetables, fruits, and organic dairy products delivered directly to your door with love.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-white mb-4 tracking-wider uppercase text-xs font-headings">Shop Category</h3>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400 font-body">
              <li><Link to="/marketplace?category=Vegetables" className="hover:text-emerald-400 transition-colors">Vegetables</Link></li>
              <li><Link to="/marketplace?category=Fruits" className="hover:text-emerald-400 transition-colors">Fruits</Link></li>
              <li><Link to="/marketplace?category=Dairy" className="hover:text-emerald-400 transition-colors">Dairy & Milk</Link></li>
              <li><Link to="/marketplace" className="hover:text-emerald-400 transition-colors">Bulk Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-extrabold text-white mb-4 tracking-wider uppercase text-xs font-headings">Vendors & Partners</h3>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-400 font-body">
              <li><Link to="/auth" className="hover:text-emerald-400 transition-colors">Become a Seller</Link></li>
              <li><Link to="/profile" className="hover:text-emerald-400 transition-colors">Seller Dashboard</Link></li>
              <li><Link to="/visit-farms" className="hover:text-emerald-400 transition-colors">Visit Organic Farms</Link></li>
              <li><Link to="/marketplace" className="hover:text-emerald-400 transition-colors">Guidelines & Safety</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-extrabold text-white mb-4 tracking-wider uppercase text-xs font-headings">Connect With Us</h3>
            <p className="text-xs text-slate-400 font-body mb-4">Stay updated with seasonal harvest offers and organic recipes.</p>
            <div className="flex space-x-3">
              <a href="#" className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
                <Facebook size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all flex items-center justify-center">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all">
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500 font-body">
          <p>&copy; {new Date().getFullYear()} FresVeg Organic. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-1">
              Directly connecting farmers to homes with <Heart size={12} className="text-emerald-500 fill-emerald-500 inline" />
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                } catch {
                  window.scrollTo(0, 0);
                }
                if (document.documentElement) document.documentElement.scrollTop = 0;
                if (document.body) document.body.scrollTop = 0;
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-900/50 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs font-bold font-headings cursor-pointer group"
              title="Scroll to top of page"
            >
              <span>Back to top</span>
              <ChevronUp size={14} className="group-hover:-translate-y-0.5 transition-transform duration-200 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
