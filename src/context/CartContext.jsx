import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { CheckCircle } from 'lucide-react';

const defaultCartContext = {
  cartItems: [],
  address: '',
  setAddress: () => {},
  addToCart: () => false,
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotal: () => 0,
  placeOrder: async () => {}
};

const CartContext = createContext(defaultCartContext);

export const useCart = () => {
  const context = useContext(CartContext);
  return context || defaultCartContext;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState('');
  const [snackbarItem, setSnackbarItem] = useState(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    if (user) {
      loadCartFromDB();
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

  const loadCartFromDB = async () => {
    if (!user) return;
    try {
      const data = await api.getCart(user.uid);
      const dbItems = data.items || [];
      const dbAddress = data.address || '';

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
            await saveCartToDB(mergedItems, dbAddress);
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
      console.error('Error loading cart from PostgreSQL:', error);
    }
  };

  const saveCartToDB = async (items, addr) => {
    if (!user) return;
    try {
      await api.saveCart(user.uid, items, addr);
    } catch (error) {
      console.error('Error saving cart to PostgreSQL:', error);
    }
  };

  const isProductOwnedByUser = (product) => {
    if (!user || !userProfile || !product) return false;
    if (userProfile.role !== 'vendor') return false;

    const matchesVendorId = Boolean(product.vendorId && String(product.vendorId) === String(user.uid));
    const matchesVendorEmail = Boolean(product.vendorEmail && user.email && product.vendorEmail.toLowerCase() === user.email.toLowerCase());
    const matchesVendorName = Boolean(product.vendor && userProfile.displayName && product.vendor.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase());

    const userShops = userProfile.shops || [];
    const matchesShop = Boolean(userShops.some(s => s.shopName && product.vendor && s.shopName.trim().toLowerCase() === product.vendor.trim().toLowerCase()));

    return matchesVendorId || matchesVendorEmail || matchesVendorName || matchesShop;
  };

  const addToCart = (product) => {
    if (isProductOwnedByUser(product)) {
      alert("As the farm owner, you cannot order your own farm products.");
      return false;
    }

    if (product.isDeliverable === false || product.fulfillmentType === 'non_deliverable') {
      alert("🚜 Farm Pickup Only: This harvest product is non-deliverable. Please visit the farm in-person to purchase!");
      return false;
    }

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
        saveCartToDB(newItems, address);
      } else {
        localStorage.setItem('guest_cart', JSON.stringify(newItems));
      }
      return newItems;
    });
    
    setSnackbarItem(product);
    setTimeout(() => {
       setSnackbarItem(null);
    }, 3000);
    return true;
  };

  const removeFromCart = (id) => {
    const newItems = cartItems.filter(item => item.id !== id);
    setCartItems(newItems);
    if (user) {
      saveCartToDB(newItems, address);
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
      saveCartToDB(newItems, address);
    } else {
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      saveCartToDB([], address);
    } else {
      localStorage.removeItem('guest_cart');
    }
  };

  const updateAddress = (newAddress) => {
    setAddress(newAddress);
    if (user) {
      saveCartToDB(cartItems, newAddress);
    }
  };

  const placeOrder = async (paymentMethod = 'Cash on Delivery') => {
    if (!user || cartItems.length === 0) {
      console.warn('PlaceOrder aborted: No user or empty cart');
      return;
    }
    
    try {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const customerPhone = user?.phoneNumber || user?.phone || '+91 98765 43210';
      const firstItem = cartItems[0] || {};
      const vendorPhone = firstItem.vendorPhone || firstItem.phone || '+91 98765 43210';

      const orderData = {
        orderId: orderId,
        customerId: user.uid,
        customerName: user.displayName || 'Customer',
        customerEmail: user.email,
        customerPhone: customerPhone,
        vendorPhone: vendorPhone,
        items: cartItems,
        total: getTotal(),
        address: address,
        paymentMethod: paymentMethod,
        status: 'pending'
      };
      
      const res = await api.placeOrder(orderData);
      console.log('Order successfully placed in PostgreSQL database:', res.orderId);
      
      clearCart();
      return orderId;
    } catch (error) {
      console.error('CRITICAL: Error placing order in PostgreSQL:', error);
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