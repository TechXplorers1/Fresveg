import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, User, Menu, X, Leaf, LogOut, Bike, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Modern, classy UI with glassmorphism
  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-emerald-500/10 shadow-sm shadow-emerald-950/[0.02] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-brand to-brand-dark text-white p-2 rounded-xl shadow-md shadow-brand/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Leaf size={22} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-transparent">FresVeg</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            <Link to="/" className="text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3.5 py-2 rounded-xl font-bold text-sm transition-all duration-200">Home</Link>
            <Link to="/marketplace" className="text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3.5 py-2 rounded-xl font-bold text-sm transition-all duration-200">Marketplace</Link>
            <Link to="/visit-farms" className="text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3.5 py-2 rounded-xl font-bold text-sm transition-all duration-200">Visit Farms</Link>
            {userProfile?.role === 'admin' && (
               <Link to="/admin" className="text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3.5 py-2 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-1.5">
                 <ShieldCheck size={16} className="text-brand" /> Admin Panel
               </Link>
             )}
            
            {user && (
              <Link to="/profile" className="text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3.5 py-2 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2">
                {userProfile?.role === 'vendor' ? (
                  <Store size={16} />
                ) : userProfile?.role === 'delivery_person' ? (
                  <Bike size={16} />
                ) : (
                  <User size={16} />
                )}
                Profile
              </Link>
            )}

            <div className="flex items-center space-x-3.5 border-l border-gray-200/80 pl-5">
              <Link to="/cart" className="relative p-2.5 text-gray-500 hover:text-brand transition-all duration-200 rounded-xl hover:bg-brand-light/50">
                <ShoppingCart size={22} />
                <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 py-0.5 text-2xs font-extrabold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand rounded-full border-2 border-white animate-pulse-glow">
                  {cartItemCount}
                </span>
              </Link>
              
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-brand-light/60 px-3.5 py-2 rounded-xl border border-brand/10">
                    <User size={15} className="text-brand" />
                    <span className="text-xs font-bold text-brand-dark max-w-[100px] truncate">{userProfile?.displayName || user?.displayName || 'User'}</span>
                  </div>
                  <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-50" title="Sign Out">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="bg-brand hover:bg-brand-dark text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md shadow-brand/15 text-xs tracking-wide">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-brand focus:outline-none p-2 rounded-xl hover:bg-brand-light/50 transition-colors">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
         <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 space-y-3.5 shadow-xl absolute w-full left-0 z-50">
            {user && (
              <div className="px-3.5 py-2.5 bg-brand-light/40 rounded-xl flex items-center justify-between border border-brand/5">
                <div>
                  <span className="text-[10px] text-brand block font-bold uppercase tracking-wider">{userProfile?.role || 'Customer'}</span>
                  <span className="font-bold text-gray-900 text-sm">{userProfile?.displayName || user?.displayName || 'User'}</span>
                </div>
              </div>
            )}
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors">Home</Link>
            <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className="block px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors">Marketplace</Link>
            <Link to="/visit-farms" onClick={() => setIsMenuOpen(false)} className="block px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors">Visit Farms</Link>
            {userProfile?.role === 'admin' && (
               <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors flex items-center gap-1.5">
                 <ShieldCheck size={16} className="text-brand" /> Admin Panel
               </Link>
             )}
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} /> Cart
              </div>
              {cartItemCount > 0 && (
                 <span className="bg-brand text-white text-2xs font-extrabold px-2 py-0.5 rounded-full">{cartItemCount}</span>
              )}
            </Link>
            
            {user && (
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 px-3.5 py-2.5 text-gray-600 hover:text-brand hover:bg-brand-light/50 rounded-xl font-bold text-sm transition-colors">
                {userProfile?.role === 'vendor' ? (
                  <Store size={16} />
                ) : userProfile?.role === 'delivery_person' ? (
                  <Bike size={16} />
                ) : (
                  <User size={16} />
                )}
                Profile
              </Link>
            )}

            {!user ? (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block px-3.5 py-2.5 text-center bg-brand hover:bg-brand-dark text-white rounded-xl font-bold text-sm transition-colors">Sign In</Link>
            ) : (
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-2 w-full px-3.5 py-2.5 text-left font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <LogOut size={16} /> Logout
              </button>
            )}
         </div>
      )}
    </nav>
  );
}
