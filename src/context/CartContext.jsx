import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState('');
  const [snackbarItem, setSnackbarItem] = useState(null);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    // Trigger snackbar
    setSnackbarItem(product);
    setTimeout(() => {
       setSnackbarItem(null);
    }, 3000);
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      address,
      setAddress,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal
    }}>
      {children}
      
      {/* Global Snackbar */}
      <div 
         className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${snackbarItem ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'}`}
      >
         <div className="bg-gray-900 border border-gray-800 shadow-2xl rounded-full px-5 py-3 flex items-center gap-3 text-white max-w-sm w-max">
            <CheckCircle className="text-brand flex-shrink-0" size={20} />
            <span className="font-medium text-sm truncate">
               Added <span className="font-bold text-green-100">{snackbarItem?.name}</span> to Cart
            </span>
         </div>
      </div>
    </CartContext.Provider>
  );
};