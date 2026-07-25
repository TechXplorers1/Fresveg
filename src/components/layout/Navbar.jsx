import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Store, User, Menu, X, Leaf, LogOut, Bike, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);
  const { cartItems } = useCart();
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleConfirmLogout = () => {
    setShowSignoutConfirm(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getLinkStyle = (path) => {
    return isActive(path)
      ? 'text-emerald-600 font-extrabold text-sm px-3.5 py-2 transition-colors duration-200 flex items-center gap-1.5'
      : 'text-slate-600 hover:text-emerald-600 font-bold text-sm px-3.5 py-2 transition-colors duration-200 flex items-center gap-1.5';
  };

  const getMobileLinkStyle = (path) => {
    return isActive(path)
      ? 'block px-4 py-2.5 text-emerald-600 font-extrabold text-sm transition-colors'
      : 'block px-4 py-2.5 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors';
  };

  const getRoleLabel = (role) => {
    if (role === 'vendor') return 'Vendor';
    if (role === 'delivery_person') return 'Delivery Boy';
    if (role === 'admin') return 'Admin';
    return 'Customer';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm shadow-emerald-950/[0.02] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="bg-gradient-to-br from-brand to-brand-dark text-white p-2 rounded-xl shadow-md shadow-brand/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Leaf size={22} />
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-brand-dark to-brand bg-clip-text text-transparent">FresVeg</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={getLinkStyle('/')}>Home</Link>
            {userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && (
              <>
                <Link to="/marketplace" className={getLinkStyle('/marketplace')}>Marketplace</Link>
                <Link to="/visit-farms" className={getLinkStyle('/visit-farms')}>Visit Farms</Link>
              </>
            )}
            {userProfile?.role === 'admin' && (
               <Link to="/admin" className={getLinkStyle('/admin')}>
                 <ShieldCheck size={16} className="text-emerald-600" /> Admin Panel
               </Link>
             )}
            
            {user && (
              <Link to="/profile" className={getLinkStyle('/profile')}>
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

            <div className="flex items-center space-x-3.5 border-l border-slate-200/80 pl-4 ml-2">
              <Link 
                to="/cart" 
                className={`relative p-2.5 transition-all duration-200 rounded-xl ${
                  isActive('/cart') 
                    ? 'text-emerald-600 bg-emerald-50/80 border border-emerald-200/60 shadow-xs' 
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-100/60'
                }`}
              >
                <ShoppingCart size={21} />
                <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-5 h-5 px-1 py-0.5 text-2xs font-extrabold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand rounded-full border-2 border-white animate-pulse-glow">
                  {cartItemCount}
                </span>
              </Link>
              
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-left justify-center bg-slate-100/80 px-3 py-1 rounded-xl border border-slate-200/60 leading-tight">
                    <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate">{userProfile?.displayName || user?.displayName || 'User'}</span>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{getRoleLabel(userProfile?.role)}</span>
                  </div>
                  <button onClick={() => setShowSignoutConfirm(true)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50" title="Sign Out">
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
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-500 hover:text-emerald-600 focus:outline-none p-2 rounded-xl hover:bg-slate-100 transition-colors">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
         <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 space-y-2.5 shadow-xl absolute w-full left-0 z-50">
            {user && (
              <div className="px-4 py-2.5 bg-emerald-50/60 rounded-xl flex items-center justify-between border border-emerald-100 mb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{userProfile?.displayName || user?.displayName || 'User'}</span>
                  <span className="text-[10px] text-emerald-600 block font-extrabold uppercase tracking-wider">{getRoleLabel(userProfile?.role)}</span>
                </div>
              </div>
            )}
            <Link to="/" onClick={() => setIsMenuOpen(false)} className={getMobileLinkStyle('/')}>Home</Link>
            {userProfile?.role !== 'vendor' && userProfile?.role !== 'delivery_person' && (
              <>
                <Link to="/marketplace" onClick={() => setIsMenuOpen(false)} className={getMobileLinkStyle('/marketplace')}>Marketplace</Link>
                <Link to="/visit-farms" onClick={() => setIsMenuOpen(false)} className={getMobileLinkStyle('/visit-farms')}>Visit Farms</Link>
              </>
            )}
            {userProfile?.role === 'admin' && (
               <Link to="/admin" onClick={() => setIsMenuOpen(false)} className={`${getMobileLinkStyle('/admin')} flex items-center gap-1.5`}>
                 <ShieldCheck size={16} className="text-emerald-600" /> Admin Panel
               </Link>
             )}
            <Link to="/cart" onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-between ${getMobileLinkStyle('/cart')}`}>
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} /> Cart
              </div>
              {cartItemCount > 0 && (
                 <span className="bg-brand text-white text-2xs font-extrabold px-2 py-0.5 rounded-full">{cartItemCount}</span>
              )}
            </Link>
            
            {user && (
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-2 ${getMobileLinkStyle('/profile')}`}>
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
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2.5 text-center bg-brand hover:bg-brand-dark text-white rounded-xl font-bold text-sm transition-colors mt-2">Sign In</Link>
            ) : (
              <button onClick={() => { setIsMenuOpen(false); setShowSignoutConfirm(true); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-left font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-2">
                <LogOut size={16} /> Logout
              </button>
            )}
         </div>
      )}

      {/* Signout Confirmation Popup Modal */}
      {showSignoutConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6 text-center animate-scale-up">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-rose-100">
              <LogOut size={30} className="ml-1" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                Confirm Signout
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed font-body">
                Are you sure you want to Signout?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
              >
                Yes, Signout
              </button>
              <button
                type="button"
                onClick={() => setShowSignoutConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}
