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
      // Load guest cart from localStorage
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        try {
          setCartItems(JSON.parse(localCart));
        } catch (e) {
          console.error('Failed to parse guest cart:', e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      setAddress('');
    }
  }, [user]);

  const loadCartFromRTDB = async () => {
    if (!user) return;
    try {
      const cartRef = ref(realtimeDb);
      const snapshot = await get(child(cartRef, `carts/${user.uid}`));
      let dbItems = [];
      let dbAddress = '';
      if (snapshot.exists()) {
        const data = snapshot.val();
        dbItems = data.items || [];
        dbAddress = data.address || '';
      }

      // Sync guest cart if there are items in localStorage
      const localCart = localStorage.getItem('guest_cart');
      if (localCart) {
        try {
          const guestItems = JSON.parse(localCart);
          if (guestItems && guestItems.length > 0) {
            const mergedItems = [...dbItems];
            guestItems.forEach(gItem => {
              const existingIdx = mergedItems.findIndex(item => item.id === gItem.id);
              if (existingIdx > -1) {
                mergedItems[existingIdx].quantity += gItem.quantity;
              } else {
                mergedItems.push(gItem);
              }
            });
            await saveCartToRTDB(mergedItems, dbAddress);
            setCartItems(mergedItems);
            localStorage.removeItem('guest_cart');
          } else {
            setCartItems(dbItems);
          }
        } catch (e) {
          console.error('Error merging guest cart with database cart:', e);
          setCartItems(dbItems);
        }
      } else {
        setCartItems(dbItems);
      }
      setAddress(dbAddress);
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
      
      if (user) {
        saveCartToRTDB(newItems, address);
      } else {
        localStorage.setItem('guest_cart', JSON.stringify(newItems));
      }
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
    if (user) {
      saveCartToRTDB(newItems, address);
    } else {
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
    }
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
    if (user) {
      saveCartToRTDB(newItems, address);
    } else {
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      saveCartToRTDB([], address);
    } else {
      localStorage.removeItem('guest_cart');
    }
  };

  const updateAddress = (newAddress) => {
    setAddress(newAddress);
    if (user) {
      saveCartToRTDB(cartItems, newAddress);
    }
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