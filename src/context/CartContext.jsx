import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCartFromFirestore();
    } else {
      setCartItems([]);
      setAddress('');
    }
  }, [user]);

  const loadCartFromFirestore = async () => {
    if (!user) return;
    try {
      const cartRef = doc(db, 'carts', user.uid);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        const data = cartSnap.data();
        setCartItems(data.items || []);
        setAddress(data.address || '');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // If offline or network error, don't show error to user
      // Cart will work with local state until connection is restored
      if (error.code !== 'unavailable' && error.code !== 'failed-precondition') {
        console.warn('Cart data may not be synced. Check your internet connection.');
      }
    }
  };

  const saveCartToFirestore = async (items, addr) => {
    if (!user) return;
    try {
      const cartRef = doc(db, 'carts', user.uid);
      await setDoc(cartRef, { items, address: addr });
    } catch (error) {
      console.error('Error saving cart:', error);
      // If offline, data will be synced when connection is restored
      if (error.code !== 'unavailable' && error.code !== 'failed-precondition') {
        console.warn('Cart changes may not be saved. Check your internet connection.');
      }
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      let newItems;
      if (existing) {
        newItems = prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...prev, { ...product, quantity: 1 }];
      }
      saveCartToFirestore(newItems, address);
      return newItems;
    });
    
    // Trigger snackbar
    setSnackbarItem(product);
    setTimeout(() => {
       setSnackbarItem(null);
    }, 3000);
  };

  const removeFromCart = (id) => {
    const newItems = cartItems.filter(item => item.id !== id);
    setCartItems(newItems);
    saveCartToFirestore(newItems, address);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const newItems = cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    setCartItems(newItems);
    saveCartToFirestore(newItems, address);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToFirestore([], address);
  };

  const updateAddress = (newAddress) => {
    setAddress(newAddress);
    saveCartToFirestore(cartItems, newAddress);
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      address,
      setAddress: updateAddress,
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