import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, set, get, child } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from './AuthContext';
import { CheckCircle, ShoppingBag } from 'lucide-react';

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
      loadCartFromRTDB();
    } else {
      setCartItems([]);
      setAddress('');
    }
  }, [user]);

  const loadCartFromRTDB = async () => {
    if (!user) return;
    try {
      const cartRef = ref(realtimeDb);
      const snapshot = await get(child(cartRef, `carts/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setCartItems(data.items || []);
        setAddress(data.address || '');
      }
    } catch (error) {
      console.error('Error loading cart from RTDB:', error);
      console.warn('Cart data may not be synced. Check your internet connection.');
    }
  };

  const saveCartToRTDB = async (items, addr) => {
    if (!user) return;
    try {
      const cartRef = ref(realtimeDb, `carts/${user.uid}`);
      await set(cartRef, { items, address: addr });
    } catch (error) {
      console.error('Error saving cart to RTDB:', error);
      console.warn('Cart changes may not be saved. Check your internet connection.');
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
      saveCartToRTDB(newItems, address);
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
    saveCartToRTDB(newItems, address);
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
    saveCartToRTDB(newItems, address);
  };

  const clearCart = () => {
    setCartItems([]);
    saveCartToRTDB([], address);
  };

  const updateAddress = (newAddress) => {
    setAddress(newAddress);
    saveCartToRTDB(cartItems, newAddress);
  };

  const placeOrder = async (paymentMethod = 'Cash on Delivery') => {
    if (!user || cartItems.length === 0) {
      console.warn('PlaceOrder aborted: No user or empty cart');
      return;
    }
    
    try {
      // Generate a unique order ID
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      
      const orderData = {
        orderId: orderId,
        customerId: user.uid,
        customerName: user.displayName || 'Customer',
        customerEmail: user.email,
        items: cartItems,
        total: getTotal(),
        address: address,
        paymentMethod: paymentMethod,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      console.log('Attempting to place order in RTDB:', orderId);
      await set(orderRef, orderData);
      console.log('Order successfully placed in Realtime Database');
      
      clearCart();
      return orderId;
    } catch (error) {
      console.error('CRITICAL: Error placing order in Realtime Database:', error);
      throw error;
    }
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
      getTotal,
      placeOrder
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