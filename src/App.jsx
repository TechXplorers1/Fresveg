import React, { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import BackToTop from './components/layout/BackToTop';
import Home from './pages/Home';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import ProductDetails from './pages/ProductDetails';
import OrderTracking from './pages/OrderTracking';
import VisitFarms from './pages/VisitFarms';
import FarmDetails from './pages/FarmDetails';
import FarmCheckout from './pages/FarmCheckout';
import Marketplace from './pages/Marketplace';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { ImageModalProvider } from './context/ImageModalContext';
import { NotificationProvider } from './context/NotificationContext';
import ImageModal from './components/common/ImageModal';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  return null;
}

function TopLeftBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const mainPages = ['/', '/marketplace', '/visit-farms', '/profile', '/admin'];

  if (mainPages.includes(location.pathname)) {
    return null;
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1 w-full flex items-center justify-start">
      <button
        type="button"
        onClick={handleGoBack}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 hover:border-emerald-200 shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer font-bold text-xs group"
        title="Go Back"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform duration-200 text-emerald-600" />
        <span>Back</span>
      </button>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProductProvider>
          <CartProvider>
            <ImageModalProvider>
              <Router>
                <ScrollToTop />
                <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-green-100/50 to-emerald-100 font-sans text-gray-900 selection:bg-brand selection:text-white">
                  <Navbar />
                  <TopLeftBackButton />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/farm/:id" element={<FarmDetails />} />
                      <Route path="/order/:orderId" element={<OrderTracking />} />
                      <Route path="/visit-farms" element={<VisitFarms />} />
                      <Route path="/farm-checkout" element={<FarmCheckout />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/admin" element={<Admin />} />
                    </Routes>
                  </main>
                  <Footer />
                  <BackToTop />
                  <ImageModal />
                </div>
              </Router>
            </ImageModalProvider>
          </CartProvider>
        </ProductProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
