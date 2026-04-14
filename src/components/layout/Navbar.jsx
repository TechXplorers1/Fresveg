import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, User, Menu, X, Leaf, LogOut, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useProducts();
  const navigate = useNavigate();
  
  const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (window.location.pathname !== '/') {
      navigate('/#marketplace');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Modern, classy UI with glassmorphism
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand text-white p-1.5 rounded-lg shadow-sm">
                <Leaf size={24} />
              </div>
              <span className="font-bold text-2xl tracking-tight text-brand-dark">FresVeg</span>
            </Link>
          </div>

          {/* Big Desktop Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl px-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search for fresh vegetables, fruits, and dairy..." 
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            
            <Link to="/" className="text-gray-600 hover:text-brand font-medium transition-colors">Home</Link>
            <Link to="/#marketplace" className="text-gray-600 hover:text-brand font-medium transition-colors">Marketplace</Link>
            
            {user && (
              <Link to="/profile" className="text-gray-600 hover:text-brand font-medium transition-colors flex items-center gap-2">
                {user.role === 'vendor' ? <Store size={18} /> : <User size={18} />}
                Profile
              </Link>
            )}

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative p-2 text-gray-500 hover:text-brand transition-colors rounded-full hover:bg-brand-light">
                <ShoppingCart size={24} />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full border border-white">
                  {cartItemCount}
                </span>
              </Link>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-brand-light/30 px-3 py-1.5 rounded-full border border-brand/20">
                    <User size={18} className="text-brand" />
                    <span className="text-sm font-semibold text-brand-dark">{user.name}</span>
                  </div>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="bg-brand hover:bg-brand-dark text-white px-5 py-2 rounded-full font-medium transition-colors shadow-sm text-sm">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-500 hover:text-brand focus:outline-none p-2 rounded-lg hover:bg-brand-light transition-colors">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
         <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-lg absolute w-full left-0">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => { handleSearchChange(e); setIsMenuOpen(false); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand"
              />
            </div>
            {user && (
              <div className="px-3 py-2 bg-brand-light/20 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-brand block font-semibold uppercase">{user.role}</span>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
              </div>
            )}
            <Link to="/" className="block px-3 py-2 text-gray-600 hover:text-brand hover:bg-brand-light rounded-md font-medium transition-colors">Home</Link>
            <Link to="/#marketplace" className="block px-3 py-2 text-gray-600 hover:text-brand hover:bg-brand-light rounded-md font-medium transition-colors">Marketplace</Link>
            <Link to="/cart" className="flex items-center justify-between px-3 py-2 text-gray-600 hover:text-brand hover:bg-brand-light rounded-md font-medium transition-colors">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} /> Cart
              </div>
              {cartItemCount > 0 && (
                 <span className="bg-brand text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartItemCount}</span>
              )}
            </Link>
            
            {user && (
              <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-brand hover:bg-brand-light rounded-md font-medium transition-colors">
                {user.role === 'vendor' ? <Store size={18} /> : <User size={18} />}
                Profile
              </Link>
            )}

            {!user ? (
              <Link to="/auth" className="block px-3 py-2 text-gray-600 hover:text-brand hover:bg-brand-light rounded-md font-medium transition-colors">Sign In / Register</Link>
            ) : (
              <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-left font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors">
                <LogOut size={18} /> Logout
              </button>
            )}
         </div>
      )}
    </nav>
  );
}
