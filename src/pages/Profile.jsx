import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { realtimeDb } from '../firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store, Mail, Calendar, Shield, MapPin, FileText, Pencil, Trash2, Check, X, Clock, ShoppingBag, ArrowRight, RefreshCw, ExternalLink, Navigation, LogOut as LogOutIcon, Bike, Power } from 'lucide-react';

const CATEGORIES = ['Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'];

export default function Profile() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  const { products: allProducts, addProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();

  // ─── Vendor Custom Dashboard State ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('addresses'); // 'addresses', 'orders', 'setup'

  const handleVendorLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error("Failed to log out vendor", e);
    }
  };

  // Safely migrate existing users and define current shops array
  const vendorShops = userProfile?.shops || [];

  // Vendor sees products from all their shops combined
  const vendorProducts = allProducts.filter(p => vendorShops.some(shop => shop.shopName === p.vendor));

  const isVendor = userProfile?.role === 'vendor';



  // ─── UI Visibility States ───────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddShopForm, setShowAddShopForm] = useState(false);

  // ─── Add Product State ──────────────────────────────────────────────────────
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', image: '', shop: '', unit: 'kg',
    description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
    netWeight: '', returnPolicy: '', offers: '', features: ''
  });

  // ─── Add Shop States ────────────────────────────────────────────────────────
  const [shopSetup, setShopSetup] = useState({ shopName: '', location: '', gstNumber: '' });
  const [newShop, setNewShop] = useState({ shopName: '', location: '', gstNumber: '' });

  // ─── Edit Shop State ────────────────────────────────────────────────────────
  const [editingShopIndex, setEditingShopIndex] = useState(null);
  const [editShopForm, setEditShopForm] = useState({ shopName: '', location: '', gstNumber: '' });

  // ─── Edit / Delete Product State ────────────────────────────────────────────
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '', price: '', category: '', image: '', unit: '',
    description: '', origin: '', preference: '', shelfLife: '',
    netWeight: '', returnPolicy: '', offers: '', features: ''
  });
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [detectingShopLocation, setDetectingShopLocation] = useState(false);

  const handleGetCurrentLocation = (setter, formState) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingShopLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (response.ok) {
            const data = await response.json();
            const address = data.display_name || `${latitude}, ${longitude}`;
            setter({ ...formState, location: address });
          } else {
            setter({ ...formState, location: `${latitude}, ${longitude}` });
          }
        } catch (error) {
          setter({ ...formState, location: `${latitude}, ${longitude}` });
        } finally {
          setDetectingShopLocation(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Make sure location access is enabled.");
        setDetectingShopLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Protect route
  if (!user) return <Navigate to="/auth" replace />;

  // ─── Shop Handlers ──────────────────────────────────────────────────────────
  const handleShopSetup = (e) => {
    e.preventDefault();
    if (shopSetup.shopName.trim() && shopSetup.location.trim() && shopSetup.gstNumber.trim()) {
      const shop = { shopName: shopSetup.shopName.trim(), location: shopSetup.location.trim(), gstNumber: shopSetup.gstNumber.trim(), createdAt: new Date().toISOString() };
      updateProfile({ shops: [...vendorShops, shop] });
      setShopSetup({ shopName: '', location: '', gstNumber: '' });
    }
  };

  const handleAddAdditionalShop = (e) => {
    e.preventDefault();
    if (newShop.shopName.trim() && newShop.location.trim() && newShop.gstNumber.trim()) {
      const shopToAdd = { shopName: newShop.shopName.trim(), location: newShop.location.trim(), gstNumber: newShop.gstNumber.trim(), createdAt: new Date().toISOString() };
      updateProfile({ shops: [...vendorShops, shopToAdd] });
      setNewShop({ shopName: '', location: '', gstNumber: '' });
      setShowAddShopForm(false);
    }
  };

  const handleEditShopClick = (shop, index) => {
    setEditingShopIndex(index);
    setEditShopForm({ shopName: shop.shopName, location: shop.location, gstNumber: shop.gstNumber });
  };

  const handleUpdateShop = (e) => {
    e.preventDefault();
    const oldShopName = vendorShops[editingShopIndex].shopName;
    const updatedShops = vendorShops.map((shop, i) =>
      i === editingShopIndex
        ? { ...shop, shopName: editShopForm.shopName.trim(), location: editShopForm.location.trim(), gstNumber: editShopForm.gstNumber.trim() }
        : shop
    );
    updateProfile({ shops: updatedShops });
    setEditingShopIndex(null);
  };

  // ─── Product Handlers ───────────────────────────────────────────────────────
  const handleInputChange = (e) => setNewProduct({ ...newProduct, [e.target.name]: e.target.value });

  const handleAddProduct = (e) => {
    e.preventDefault();
    const selectedShop = vendorShops.find(shop => shop.shopName === newProduct.shop) || vendorShops[0];
    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      vendor: selectedShop.shopName,
      shopLocation: selectedShop.location || '',
      rating: 5.0,
      offers: newProduct.offers.split('\n').filter(line => line.trim() !== ''),
      features: newProduct.features.split('\n').filter(line => line.trim() !== ''),
      createdAt: new Date().toISOString()
    };
    addProduct(productData);
    setNewProduct({
      name: '', price: '', category: '', image: '', shop: '', unit: 'kg',
      description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
      netWeight: '', returnPolicy: '', offers: '', features: ''
    });
    setShowAddForm(false);
  };

  const handleEditProductClick = (product) => {
    setEditingProductId(product.id);
    setEditProductForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      image: product.image,
      unit: product.unit || 'kg',
      description: product.description || '',
      origin: product.origin || '',
      preference: product.preference || 'Vegetarian',
      shelfLife: product.shelfLife || '',
      netWeight: product.netWeight || '',
      returnPolicy: product.returnPolicy || '',
      offers: Array.isArray(product.offers) ? product.offers.join('\n') : '',
      features: Array.isArray(product.features) ? product.features.join('\n') : ''
    });
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    const updatedData = {
      ...editProductForm,
      price: parseFloat(editProductForm.price),
      offers: editProductForm.offers.split('\n').filter(line => line.trim() !== ''),
      features: editProductForm.features.split('\n').filter(line => line.trim() !== '')
    };
    updateProduct(editingProductId, updatedData);
    setEditingProductId(null);
  };

  const handleDeleteProduct = (productId) => {
    deleteProduct(productId);
    setDeletingProductId(null);
  };

  // ─── Address States ────────────────────────────────────────────────────────
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    label: '', // e.g., Home, Office
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const savedAddresses = userProfile?.addresses || [];

  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log(`Detecting address for coordinates: ${latitude}, ${longitude}`);
          
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;
          const res = await fetch(url, {
            headers: { 'User-Agent': 'FresVegApp/1.0' }
          });
          const data = await res.json();
          
          if (data && data.address) {
            const addr = data.address;
            
            // Build a descriptive street address
            const streetName = addr.road || addr.suburb || addr.neighbourhood || '';
            const houseNumber = addr.house_number || '';
            const street = [houseNumber, streetName].filter(Boolean).join(' ') || addr.amenity || 'Current Location';
            
            const city = addr.city || addr.town || addr.village || addr.state_district || '';
            const state = addr.state || '';
            const zipCode = addr.postcode || '';
            const country = addr.country || 'India';
            
            setNewAddress(prev => ({
              ...prev,
              street,
              city,
              state,
              zipCode,
              country
            }));
            
            console.log("Automatically detected and filled address details:", data.address);
          } else {
            alert("Could not retrieve address details for your location. Please enter manually.");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          alert("Reverse geocoding failed. Please enter your address details manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to acquire location. Please check browser permissions and GPS status.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAddressInputChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (newAddress.street && newAddress.city) {
      if (editingAddressId) {
        // Edit mode
        const updatedAddresses = savedAddresses.map(addr =>
          addr.id === editingAddressId ? { ...addr, ...newAddress } : addr
        );
        updateProfile({ addresses: updatedAddresses });
        setEditingAddressId(null);
      } else {
        // Add mode
        const addressToAdd = { ...newAddress, id: Date.now() };
        updateProfile({ addresses: [...savedAddresses, addressToAdd] });
      }
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
      setShowAddressForm(false);
    }
  };

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({
      label: addr.label || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || ''
    });
    setShowAddressForm(true);
    // Automatically trigger GPS detection on edit open
    setTimeout(() => handleDetectLocation(), 100);
  };

  const toggleAddressForm = () => {
    if (showAddressForm) {
      setEditingAddressId(null);
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
    } else {
      // Automatically trigger GPS detection when opening new address form
      setTimeout(() => handleDetectLocation(), 100);
    }
    setShowAddressForm(!showAddressForm);
  };

  const handleDeleteAddress = (addressId) => {
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    updateProfile({ addresses: updatedAddresses });
    if (editingAddressId === addressId) {
      setEditingAddressId(null);
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
      setShowAddressForm(false);
    }
  };

  // ─── Shared field style ─────────────────────────────────────────────────────
  const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none text-sm';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  // ─── Orders State & Fetching ────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(realtimeDb, 'orders');

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }

      // Convert RTDB object to array
      let ordersData = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));

      // Sort by timestamp descending (ISO string sorting works for this)
      ordersData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Filter for the current user (Customer)
      if (userProfile?.role === 'customer') {
        ordersData = ordersData.filter(order => order.customerId === user.uid);
      }
      // Filter for the Vendor's shops
      else if (userProfile?.role === 'vendor') {
        const shopNames = vendorShops.map(s => s.shopName);
        ordersData = ordersData.filter(order =>
          order.items.some(item => shopNames.includes(item.vendor))
        ).map(order => ({
          ...order,
          // Only show items relevant to this vendor
          items: order.items.filter(item => shopNames.includes(item.vendor))
        }));
      }

      setOrders(ordersData);
      setLoadingOrders(false);
    }, (error) => {
      console.error('Error fetching orders from RTDB:', error);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user, userProfile, vendorShops]);

  // ─── Geolocation & Delivery Tracking States (Moved below orders) ─────────────
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Keep orders list in a ref to avoid Geolocation effect re-triggering constantly on coordinate updates
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Simulation states for Delivery Boy
  const [simulatingOrderId, setSimulatingOrderId] = useState(null);
  const [simInterval, setSimInterval] = useState(null);

  // Geocoder helper
  const geocodeAddress = async (address) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'FresVegApp/1.0' },
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch (err) {
      console.warn('Geocoding failed for:', address, err);
    }
    return null;
  };

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [simInterval]);

  const handleSimulateDeliveryBoyMovement = async (orderId, pickupAddr, deliveryAddr) => {
    if (simulatingOrderId === orderId) {
      if (simInterval) {
        clearInterval(simInterval);
        setSimInterval(null);
      }
      setSimulatingOrderId(null);
      return;
    }

    if (!pickupAddr || !deliveryAddr) {
      alert("Both shop location and delivery address must be set to run simulation.");
      return;
    }

    setSimulatingOrderId(orderId);
    
    // Reverse Geocode both addresses
    const startCoords = await geocodeAddress(pickupAddr);
    // Stagger to prevent rate limit
    await new Promise((r) => setTimeout(r, 1100));
    const endCoords = await geocodeAddress(deliveryAddr);

    if (!startCoords || !endCoords) {
      alert("Could not geocode pickup or drop address. Make sure vendor shop location and customer address are valid.");
      setSimulatingOrderId(null);
      return;
    }

    const steps = 15;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const lat = startCoords.lat + (endCoords.lat - startCoords.lat) * fraction;
      const lng = startCoords.lon + (endCoords.lon - startCoords.lon) * fraction;
      path.push({ lat, lng });
    }

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep >= path.length) {
        clearInterval(interval);
        setSimInterval(null);
        setSimulatingOrderId(null);
        alert("Delivery simulation finished successfully!");
        return;
      }

      const point = path[currentStep];
      const newLoc = {
        lat: point.lat,
        lng: point.lng,
        timestamp: new Date().toISOString()
      };

      try {
        const orderRef = ref(realtimeDb, `orders/${orderId}/deliveryBoyLocation`);
        await set(orderRef, newLoc);
        console.log(`Driver simulation updated to Firebase: ${currentStep + 1}/${path.length}`, newLoc);
      } catch (err) {
        console.error("Failed to write simulation coordinates to DB:", err);
      }

      currentStep++;
    }, 2000);

    setSimInterval(interval);
  };

  // Set default tab for delivery persons on load
  useEffect(() => {
    if (userProfile?.role === 'delivery_person' && (activeTab === 'addresses' || activeTab === 'orders')) {
      setActiveTab('delivery_jobs');
    }
  }, [userProfile, activeTab]);

  // Geolocation watchPosition Effect
  useEffect(() => {
    if (userProfile?.role === 'delivery_person' && isTrackingActive) {
      if (navigator.geolocation) {
        console.log("Starting active geolocation watch...");
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLoc = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };
            
            // Find active delivery order assigned to this delivery boy using the ref
            const activeOrder = ordersRef.current.find(
              o => o.deliveryBoyId === user.uid && o.status === 'dispatched'
            );
            if (activeOrder) {
              const orderLocationRef = ref(realtimeDb, `orders/${activeOrder.id}/deliveryBoyLocation`);
              update(orderLocationRef, newLoc)
                .then(() => console.log("Real-time coordinates updated in database:", newLoc))
                .catch(err => console.error("Error writing coordinates to RTDB:", err));
            }
          },
          (error) => {
            console.error("Error watching position:", error);
            // Prevent auto-disabling the toggle on code 2 (Position Unavailable) to allow automatic sensor recovery
            if (error.code !== 2) {
              setIsTrackingActive(false);
              alert("Location tracking error: Please enable GPS/location permissions in your browser.");
            }
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
        );
        setWatchId(id);
      } else {
        alert("Geolocation is not supported by your browser.");
        setIsTrackingActive(false);
      }
    } else {
      if (watchId !== null) {
        console.log("Stopping active geolocation watch...");
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTrackingActive, user, userProfile]);

  // Action Handlers for Order Status & Delivery Lifecycle
  const handleUpdateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        status: newStatus,
        ...additionalData
      });
      console.log(`Order ${orderId} successfully updated to status ${newStatus}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Error updating order status: ' + error.message);
    }
  };

  const handleAcceptJob = async (orderId) => {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        status: 'dispatched',
        deliveryStatus: 'accepted',
        deliveryBoyId: user.uid,
        deliveryBoyName: userProfile?.displayName || user?.displayName || 'Delivery Hero'
      });
      setIsTrackingActive(true); // Automatically go online and share GPS coordinates!
      setActiveTab('delivery_active');
    } catch (error) {
      console.error('Failed to accept delivery job:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      const orderRef = ref(realtimeDb, `orders/${orderId}`);
      await update(orderRef, {
        status: 'delivered',
        deliveryStatus: 'delivered'
      });
      setIsTrackingActive(false); // Stop coordinates synchronization
      setActiveTab('delivery_completed');
    } catch (error) {
      console.error('Failed to mark order as delivered:', error);
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── User Profile Header ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="bg-brand-light/30 p-6 rounded-full border border-brand/20">
              <User size={48} className="text-brand" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userProfile?.displayName || user?.displayName || 'User'}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2"><Mail size={16} /><span>{userProfile?.email || user?.email}</span></div>
              <div className="flex items-center gap-2"><Shield size={16} /><span className="capitalize font-medium">{userProfile?.role || 'customer'}</span></div>
              {userProfile?.createdAt && (
                <div className="flex items-center gap-2"><Calendar size={16} /><span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2 sticky top-24">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Dashboard Menu</p>
            
            {userProfile?.role !== 'delivery_person' && (
              <>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                    activeTab === 'addresses'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <MapPin size={18} />
                  My Saved Addresses
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                    activeTab === 'orders'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <ShoppingBag size={18} />
                  {isVendor ? 'Customer Orders' : 'My Orders'}
                </button>

                {isVendor && (
                  <button
                    onClick={() => setActiveTab('setup')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                      activeTab === 'setup'
                        ? 'bg-brand text-white shadow-md shadow-brand/20'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                    }`}
                  >
                    <Store size={18} />
                    Set Up Your Shop
                  </button>
                )}
              </>
            )}

            {userProfile?.role === 'delivery_person' && (
              <>
                {/* Available Jobs */}
                <button
                  onClick={() => setActiveTab('delivery_jobs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                    activeTab === 'delivery_jobs'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <Bike size={18} />
                  Available Jobs
                </button>

                {/* Active Delivery */}
                <button
                  onClick={() => setActiveTab('delivery_active')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                    activeTab === 'delivery_active'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <Navigation size={18} />
                  Active Delivery
                </button>

                {/* Completed Jobs */}
                <button
                  onClick={() => setActiveTab('delivery_completed')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm ${
                    activeTab === 'delivery_completed'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                  }`}
                >
                  <Check size={18} />
                  Completed Jobs
                </button>
              </>
            )}

            <div className="border-t border-gray-100 my-2 pt-2">
              <button
                onClick={handleVendorLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-all text-sm"
              >
                <LogOutIcon size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingAddressId ? 'Edit Address' : 'My Saved Addresses'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingAddressId ? 'Update your address details below' : 'Manage your delivery locations'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleAddressForm}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors"
          >
            {showAddressForm ? <X size={18} /> : <Plus size={18} />}
            {showAddressForm ? 'Cancel' : 'Add New Address'}
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Services Banner */}
              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between bg-brand/5 border border-brand/10 p-3.5 rounded-2xl gap-3">
                <div className="flex items-center gap-2">
                  <Navigation size={18} className={`text-brand ${detectingLocation ? 'animate-spin' : ''}`} />
                  <div>
                    <p className="text-xs font-bold text-brand-dark">Location Services</p>
                    <p className="text-[10px] text-gray-500">Detecting details automatically via GPS reverse geocoding</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={detectingLocation}
                  onClick={handleDetectLocation}
                  className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto"
                >
                  <RefreshCw size={12} className={detectingLocation ? 'animate-spin' : ''} />
                  {detectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}
                </button>
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Label (e.g. Home, Office)</label>
                <input required type="text" name="label" value={newAddress.label} onChange={handleAddressInputChange} className={inputCls} placeholder="Home" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Street Address</label>
                <input required type="text" name="street" value={newAddress.street} onChange={handleAddressInputChange} className={inputCls} placeholder="123 Main St" />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input required type="text" name="city" value={newAddress.city} onChange={handleAddressInputChange} className={inputCls} placeholder="Mumbai" />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input required type="text" name="state" value={newAddress.state} onChange={handleAddressInputChange} className={inputCls} placeholder="Maharashtra" />
              </div>
              <div>
                <label className={labelCls}>ZIP Code</label>
                <input required type="text" name="zipCode" value={newAddress.zipCode} onChange={handleAddressInputChange} className={inputCls} placeholder="400001" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input required type="text" name="country" value={newAddress.country} onChange={handleAddressInputChange} className={inputCls} placeholder="India" />
              </div>
            </div>
            <button type="submit" className="bg-brand text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-dark transition-colors">
              {editingAddressId ? 'Update Address' : 'Save Address'}
            </button>
          </form>
        )}

        {savedAddresses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-500 text-sm">No addresses saved yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAddresses.map((addr) => (
              <div key={addr.id} className="bg-gray-50 p-5 rounded-2xl border border-gray-100 relative group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase">
                    {addr.label || 'Other'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{addr.street}</p>
                <p className="text-sm text-gray-500">{addr.city}, {addr.state} - {addr.zipCode}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight font-medium">{addr.country}</p>

                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => handleEditAddressClick(addr)}
                    className="text-gray-400 hover:text-brand transition-all p-1 rounded-lg hover:bg-white"
                    title="Edit Address"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-gray-400 hover:text-red-500 transition-all p-1 rounded-lg hover:bg-white"
                    title="Delete Address"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{userProfile?.role === 'vendor' ? 'Customer Orders' : 'My Orders'}</h2>
            <p className="text-sm text-gray-500">
              {userProfile?.role === 'vendor'
                ? 'Manage orders for your products'
                : 'Track your recent purchases and delivery status'}
            </p>
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <p className="text-sm text-gray-500 mt-4">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
            <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No orders found.</p>
            {userProfile?.role === 'customer' && (
              <button onClick={() => navigate('/#marketplace')} className="text-brand text-sm font-bold mt-2 hover:underline">
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden transition-all hover:border-brand/30">
                {/* Order Header */}
                <div className="bg-white px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-xs">
                      <p className="text-gray-500 uppercase font-bold tracking-wider mb-0.5">Order Placed</p>
                      <p className="text-gray-900 font-bold">{new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-500 uppercase font-bold tracking-wider mb-0.5">Total Amount</p>
                      <p className="text-brand font-black">₹{parseFloat(order.total).toFixed(2)}</p>
                    </div>
                    <div className="text-xs">
                      <p className="text-gray-500 uppercase font-bold tracking-wider mb-0.5">Order ID</p>
                      <p className="text-gray-900 font-medium font-mono uppercase">#{order.id.slice(-8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                      <Clock size={12} /> {order.status}
                    </span>
                    <button
                      onClick={() => navigate(`/order/${order.id}`)}
                      className="flex items-center gap-1.5 text-brand text-xs font-bold hover:bg-brand-light px-3 py-1 rounded-lg transition-colors border border-brand/20"
                    >
                      <ArrowRight size={12} /> Track Order
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Item List */}
                    <div className="md:col-span-8 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">Sold by: {item.vendor}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-xs font-bold text-brand">Qty: {item.quantity}</p>
                              <p className="text-xs font-bold text-gray-700">₹{item.price}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Info */}
                    <div className="md:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Shipping To</p>
                          <p className="text-xs text-gray-700 leading-relaxed italic line-clamp-3">
                            {order.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor Controls */}
                {isVendor && (
                  <div className="bg-brand-light/10 border-t border-gray-200/50 px-6 py-4 flex items-center justify-between gap-4">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={14} className="text-brand" /> Vendor Controls
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Check size={14} /> Confirm Order
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Package size={14} /> Start Packing
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <>
                          {order.deliveryStatus === 'requested' ? (
                            <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5">
                              <Clock size={12} className="animate-pulse" /> Awaiting Delivery Boy Acceptance
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, 'processing', { deliveryStatus: 'requested' })}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <Bike size={14} /> Send Delivery Request
                            </button>
                          )}
                        </>
                      )}
                      {order.status === 'dispatched' && (
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full uppercase">
                          <Bike size={12} /> Out for Delivery ({order.deliveryBoyName || 'Assigned Driver'})
                        </div>
                      )}
                      {order.status === 'delivered' && (
                        <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5">
                          <Check size={14} /> Delivered Successfully
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ─── Geolocation & Delivery Person Dashboard Tabs ─────────────────────── */}
      {activeTab === 'delivery_jobs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-full text-green-600 border border-green-100">
                <Bike size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Available Delivery Jobs</h2>
                <p className="text-sm text-gray-500">Claim pending requests from vendors nearby</p>
              </div>
            </div>
            {/* Duty status toggle */}
            <button
              onClick={() => setIsTrackingActive(!isTrackingActive)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isTrackingActive ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Power size={14} />
              {isTrackingActive ? 'GPS: Online & Sharing' : 'GPS: Offline'}
            </button>
          </div>

          {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
              <Bike className="mx-auto text-gray-300 mb-4" size={56} />
              <p className="text-gray-500 font-bold text-lg">All Quiet on the Delivery Front!</p>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">There are no pending delivery requests right now. Vendors will request when orders are ready.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Job Header */}
                  <div className="bg-white px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-xs">
                        <p className="text-gray-400 uppercase font-bold mb-0.5">Ready At</p>
                        <p className="text-gray-700 font-bold">{new Date(order.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-gray-400 uppercase font-bold mb-0.5">Order Total</p>
                        <p className="text-brand font-black">₹{parseFloat(order.total).toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptJob(order.id)}
                      className="bg-brand hover:bg-brand-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Check size={14} /> Accept Delivery Job
                    </button>
                  </div>

                  {/* Job details */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vendor shop details */}
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5 text-green-600">
                          <Store size={16} /> Pickup From (Vendor)
                        </h4>
                        <p className="font-bold text-gray-800 text-sm">{order.items[0]?.vendor || 'Local Vendor'}</p>
                        <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
                          {order.items[0]?.shopLocation || 'Shop Address Not Provided'}
                        </p>
                      </div>

                      {/* Customer address */}
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5 text-blue-600">
                          <MapPin size={16} /> Deliver To (Customer)
                        </h4>
                        <p className="font-bold text-gray-800 text-sm">{order.customerName}</p>
                        <p className="text-xs text-gray-500 italic mt-1 leading-relaxed line-clamp-2">
                          {order.address}
                        </p>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Package Items ({order.items.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full border border-gray-200 font-medium">
                            {item.name} x {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'delivery_active' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600 border border-orange-200">
              <Navigation size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Active Delivery Job</h2>
              <p className="text-sm text-gray-500">Real-time route tracking and delivery actions</p>
            </div>
          </div>

          {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
              <Navigation className="mx-auto text-gray-300 mb-4" size={56} />
              <p className="text-gray-500 font-bold text-lg">No Active Deliveries</p>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">You don't have any active deliveries. Go to the "Available Jobs" tab to accept a job.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').map((order) => (
                <div key={order.id} className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden shadow-md">
                  {/* Active header */}
                  <div className="bg-orange-500 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-75">Active Order ID</p>
                      <p className="font-bold tracking-tight text-sm font-mono uppercase">#{order.id.slice(-12)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsTrackingActive(!isTrackingActive)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                          isTrackingActive ? 'bg-green-600 text-white animate-pulse' : 'bg-white text-gray-800'
                        }`}
                      >
                        <Power size={12} />
                        {isTrackingActive ? 'GPS Sharing: ON' : 'GPS Sharing: OFF (Turn ON!)'}
                      </button>
                    </div>
                  </div>

                  {/* Active Info details */}
                  <div className="p-6 space-y-6">
                    {/* Alert when GPS is OFF */}
                    {!isTrackingActive && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 text-yellow-800 text-xs">
                        <Clock size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-yellow-900">GPS location sharing is offline</p>
                          <p className="mt-0.5 text-yellow-700">Please click the button above to enable GPS sharing so the customer and vendor can track your location lively on the map.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pickup Shop */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5 text-green-600">
                            <Store size={16} /> 1. Pickup From
                          </h4>
                          <p className="font-black text-gray-800 text-sm">{order.items[0]?.vendor}</p>
                          <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
                            {order.items[0]?.shopLocation || 'Shop location not set'}
                          </p>
                        </div>
                        {order.items[0]?.shopLocation && (
                          <a
                            href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.items[0].shopLocation)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-green-600 border border-green-200/50 hover:bg-green-50 py-2.5 rounded-xl transition-all"
                          >
                            <ExternalLink size={12} /> Get Pickup Directions
                          </a>
                        )}
                      </div>

                      {/* Delivery Address */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5 text-blue-600">
                            <MapPin size={16} /> 2. Deliver To
                          </h4>
                          <p className="font-black text-gray-800 text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-500 italic mt-1 leading-relaxed">
                            {order.address}
                          </p>
                        </div>
                        <a
                          href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200/50 hover:bg-blue-50 py-2.5 rounded-xl transition-all"
                        >
                          <ExternalLink size={12} /> Get Delivery Directions
                        </a>
                      </div>
                    </div>

                    {/* Order Summary & Earn Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Total Value</p>
                        <p className="text-lg font-black text-gray-800 mt-0.5">₹{parseFloat(order.total).toFixed(2)}</p>
                      </div>
                      <div className="bg-brand/5 border border-brand/10 px-4 py-2 rounded-xl text-right">
                        <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Est. Earnings</p>
                        <p className="text-lg font-black text-brand mt-0.5">₹40.00</p>
                      </div>
                    </div>

                    {/* Delivered Action */}
                    <button
                      onClick={() => handleMarkAsDelivered(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base"
                    >
                      <Check size={20} strokeWidth={3} /> Complete Order & Mark as Delivered
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'delivery_completed' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-green-100 p-3 rounded-full text-green-600 border border-green-200">
              <Check size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Completed Deliveries</h2>
              <p className="text-sm text-gray-500">Your historical delivery performance and earnings</p>
            </div>
          </div>

          {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
              <Check className="mx-auto text-gray-300 mb-4" size={56} />
              <p className="text-gray-500 font-bold text-lg">No Completed Deliveries Yet</p>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">Your completed delivery jobs will appear here once you fulfill them.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Earnings summary card */}
              <div className="bg-green-50 border border-green-100 rounded-3xl p-6 flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-green-800 text-sm">Total Deliveries Fulfilled</h3>
                  <p className="text-3xl font-black text-green-900 mt-1">{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-green-800 text-sm">Total Earnings</h3>
                  <p className="text-3xl font-black text-green-900 mt-1">₹{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length * 40}.00</p>
                </div>
              </div>

              <div className="space-y-3">
                {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center justify-between flex-wrap gap-4 text-xs font-semibold">
                    <div>
                      <p className="text-gray-700 font-bold text-sm">Delivered to {order.customerName}</p>
                      <p className="text-gray-400 mt-0.5">Order ID: #{order.id.slice(-8).toUpperCase()} • {new Date(order.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase">Success</span>
                      <span className="text-brand font-black text-sm">₹40.00 Earned</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Role Based Stats or Setup Guides ────────────────────────────────── */}
      {userProfile?.role === 'customer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-blue-100 p-3 rounded-full"><User className="text-blue-600" size={24} /></div><div><h3 className="font-semibold text-gray-900">Account Type</h3><p className="text-sm text-gray-500">Customer</p></div></div>
            <p className="text-gray-600 text-sm">You can browse and purchase fresh products from our vendors.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4"><div className="bg-purple-100 p-3 rounded-full"><Calendar className="text-purple-600" size={24} /></div><div><h3 className="font-semibold text-gray-900">Member Since</h3><p className="text-sm text-gray-500">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}</p></div></div>
            <p className="text-gray-600 text-sm">Thank you for being part of FresVeg community.</p>
          </div>
        </div>
      )}

      {(isVendor && activeTab === 'setup') && (
        <>
          {/* ── Vendor: No Shop Yet ──────────────────────────────────────────────── */}
          {vendorShops.length === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto mt-8">
          <div className="text-center mb-6">
            <Store className="mx-auto text-brand mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900">Set Up Your Shop</h2>
            <p className="text-gray-500 text-sm mt-1">Add your shop name so you can start adding products.</p>
          </div>
          <form onSubmit={handleShopSetup} className="space-y-4">
            <div>
              <label className={labelCls}>Shop Name</label>
              <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({ ...shopSetup, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" /></div>
            </div>
            <div>
              <label className={labelCls}>Shop Location <span className="text-brand font-bold">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="text" value={shopSetup.location} onChange={(e) => setShopSetup({ ...shopSetup, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                <button
                  type="button"
                  onClick={() => handleGetCurrentLocation(setShopSetup, shopSetup)}
                  disabled={detectingShopLocation}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand/10 hover:bg-brand/20 disabled:bg-gray-100 disabled:text-gray-400 text-brand text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  {detectingShopLocation ? (
                    <span className="w-3 h-3 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Navigation size={11} />
                  )}
                  {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                </button>
              </div>
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <Navigation size={11} /> Use a specific address (area + city + state) — this is shown to customers on Google Maps when they track their delivery.
              </p>
            </div>
            <div>
              <label className={labelCls}>GST Number</label>
              <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={shopSetup.gstNumber} onChange={(e) => setShopSetup({ ...shopSetup, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" /></div>
            </div>
            <button type="submit" className="w-full bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors">Complete Setup</button>
          </form>
        </div>
      )}

      {/* ── Vendor: Has Shops ────────────────────────────────────────────────── */}
      {userProfile?.role === 'vendor' && vendorShops.length > 0 && (
        <div className="mt-8">

          {/* My Shops panel */}
          <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Shops ({vendorShops.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorShops.map((shop, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      {editingShopIndex === i ? (
                        /* ── Inline Edit Shop Form ── */
                        <form onSubmit={handleUpdateShop} className="space-y-3">
                          <p className="text-sm font-semibold text-brand mb-2">Editing Shop</p>
                          <div>
                            <label className={labelCls}>Shop Name</label>
                            <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" /></div>
                          </div>
                          <div>
                            <label className={labelCls}>Location <span className="text-brand font-bold">*</span></label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                              <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" style={{ paddingRight: '150px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                              <button
                                type="button"
                                onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                disabled={detectingShopLocation}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand/10 hover:bg-brand/20 disabled:bg-gray-100 disabled:text-gray-400 text-brand text-xs font-bold px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                              >
                                {detectingShopLocation ? (
                                  <span className="w-2.5 h-2.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <Navigation size={10} />
                                )}
                                {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                              </button>
                            </div>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <Navigation size={10} /> Enter your full address so customers can see your shop on Google Maps when tracking orders.
                            </p>
                          </div>
                          <div>
                            <label className={labelCls}>GST Number</label>
                            <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" /></div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button type="submit" className="flex items-center gap-1 bg-brand text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"><Check size={14} /> Save</button>
                            <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"><X size={14} /> Cancel</button>
                          </div>
                        </form>
                      ) : (
                        /* ── Shop Card View ── */
                        <>
                          {/* Shop Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-brand/10 p-1.5 rounded-lg">
                                <Store size={14} className="text-brand" />
                              </div>
                              <h3 className="font-bold text-gray-900">{shop.shopName}</h3>
                            </div>
                            <button onClick={() => handleEditShopClick(shop, i)} className="text-gray-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-brand-light/30" title="Edit Shop">
                              <Pencil size={14} />
                            </button>
                          </div>

                          {/* Location row */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                              <MapPin size={13} className="text-green-600 flex-shrink-0" />
                              <span className="truncate font-medium">{shop.location || <span className="text-red-400 italic">No location set</span>}</span>
                            </div>
                            {shop.location && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs font-bold text-brand border border-brand/20 px-2 py-1 rounded-lg hover:bg-brand/5 transition-colors flex-shrink-0"
                              >
                                <ExternalLink size={11} /> Maps
                              </a>
                            )}
                          </div>

                          {/* Google Maps Embed Preview */}
                          {shop.location ? (
                            <div className="rounded-xl overflow-hidden border border-gray-200 mb-3" style={{ height: '160px' }}>
                              <iframe
                                title={`Map for ${shop.shopName}`}
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.shopName ? ' ' + shop.shopName : ''))}&output=embed&z=14`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 mb-3 py-5 px-3 text-center">
                              <Navigation size={22} className="text-red-300 mb-1" />
                              <p className="text-xs font-bold text-red-400">Shop location not set</p>
                              <p className="text-xs text-red-300 mt-0.5">Click the pencil icon to add your location so customers can track their orders.</p>
                            </div>
                          )}

                          {/* GST */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <FileText size={12} />
                            <span>GST: {shop.gstNumber}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowAddShopForm(true)} className="flex items-center gap-1 bg-gray-100 text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors mt-4">
                  <Plus size={14} /> Add Shop
                </button>
              </div>

              {/* Add New Product button */}
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-shrink-0"
              >
                <Plus size={20} />
                Add New Product
              </button>
            </div>
          </div>

          {/* ── Add New Shop Form Modal ────────────────────────────────────────── */}
          {showAddShopForm && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '' }); }}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleAddAdditionalShop} className="flex flex-col h-full overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-brand/10 p-2 rounded-xl text-brand animate-pulse">
                        <Plus size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Shop</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Register a new shop branch to showcase your products</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '' }); }}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                      <label className={labelCls}>Shop Name</label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="text" value={newShop.shopName} onChange={(e) => setNewShop({ ...newShop, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Shop Location <span className="text-brand font-bold">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="text" value={newShop.location} onChange={(e) => setNewShop({ ...newShop, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                        <button
                          type="button"
                          onClick={() => handleGetCurrentLocation(setNewShop, newShop)}
                          disabled={detectingShopLocation}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand/10 hover:bg-brand/20 disabled:bg-gray-100 disabled:text-gray-400 text-brand text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          {detectingShopLocation ? (
                            <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Navigation size={12} />
                          )}
                          {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                        </button>
                      </div>
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        <Navigation size={11} /> Use a specific address — customers see this on Google Maps when tracking their order.
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>GST Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input required type="text" value={newShop.gstNumber} onChange={(e) => setNewShop({ ...newShop, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
                    <button 
                      type="button" 
                      onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '' }); }} 
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-all duration-200 text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
                    >
                      Create Shop
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* ── Add Product Form Modal ────────────────────────────────────────── */}
          {showAddForm && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowAddForm(false)}
            >
              <div 
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleAddProduct} className="flex flex-col h-full overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-white">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-brand/10 p-2 rounded-xl text-brand animate-pulse">
                        <Plus size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Fill in the details to publish a new product in the marketplace</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-8 flex-1">
                    {/* Section: Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                        <Package size={16} /> Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelCls}>Product Name</label>
                          <div className="relative">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className={inputCls} placeholder="E.g. Organic Tomatoes" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Which Shop?</label>
                          <div className="relative">
                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select required name="shop" value={newProduct.shop} onChange={handleInputChange} className={`${inputCls} appearance-none bg-white`}>
                              <option value="">Select a shop...</option>
                              {vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Category</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select required name="category" value={newProduct.category} onChange={handleInputChange} className={`${inputCls} appearance-none bg-white`}>
                              <option value="">Select category...</option>
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Price (₹)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input required type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} className={inputCls} placeholder="2.99" />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Image URL</label>
                          <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input required type="text" name="image" value={newProduct.image} onChange={handleInputChange} className={inputCls} placeholder="https://example.com/image.jpg" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section: Product Specifications */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                        <Check size={16} /> Product Specifications
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className={labelCls}>Unit (e.g. kg, box)</label>
                          <input required type="text" name="unit" value={newProduct.unit} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="kg" />
                        </div>
                        <div>
                          <label className={labelCls}>Net Weight</label>
                          <input type="text" name="netWeight" value={newProduct.netWeight} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="500g" />
                        </div>
                        <div>
                          <label className={labelCls}>Food Preference</label>
                          <select name="preference" value={newProduct.preference} onChange={handleInputChange} className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white`}>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Country of Origin</label>
                          <input type="text" name="origin" value={newProduct.origin} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="India" />
                        </div>
                        <div>
                          <label className={labelCls}>Max Shelf Life</label>
                          <input type="text" name="shelfLife" value={newProduct.shelfLife} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="7 days" />
                        </div>
                      </div>
                    </div>

                    {/* Section: Details & Lists */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} /> Details & Descriptions
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className={labelCls}>Description</label>
                          <textarea name="description" value={newProduct.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none resize-none text-sm" placeholder="Detailed description of the product..."></textarea>
                        </div>
                        <div>
                          <label className={labelCls}>Features & Details (one per line)</label>
                          <textarea name="features" value={newProduct.features} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none resize-none text-sm" placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"></textarea>
                        </div>
                        <div>
                          <label className={labelCls}>Available Offers (one per line)</label>
                          <textarea name="offers" value={newProduct.offers} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none resize-none text-sm" placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Section: Policies */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                        <RefreshCw size={16} /> Policies
                      </h3>
                      <div>
                        <label className={labelCls}>Return Policy</label>
                        <textarea name="returnPolicy" value={newProduct.returnPolicy} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none resize-none text-sm" placeholder="Returnable within 24 hours if damaged..."></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-all duration-200 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
                    >
                      Save Product to Marketplace
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Your Products ─────────────────────────────────────────────────── */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Products ({vendorProducts.length})</h2>
            {vendorProducts.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No products yet</h3>
                <p className="text-gray-500">Get started by adding your first product to your shop.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vendorProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                    {editingProductId === product.id ? (
                      /* ── Inline Edit Product Form ── */
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                          <p className="text-sm font-black text-brand uppercase tracking-tighter">Editing Product</p>
                          <div className="flex gap-2">
                            <button onClick={handleUpdateProduct} className="bg-brand text-white p-2 rounded-lg hover:bg-brand-dark transition-colors"><Check size={16} /></button>
                            <button onClick={() => setEditingProductId(null)} className="bg-gray-100 text-gray-500 p-2 rounded-lg hover:bg-gray-200 transition-colors"><X size={16} /></button>
                          </div>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="space-y-6">
                          {/* Basic Information */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Basic Information</h4>
                            <div className="grid grid-cols-1 gap-3">
                              <input required type="text" value={editProductForm.name} onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Name" />
                              <div className="grid grid-cols-2 gap-3">
                                <input required type="number" step="0.01" value={editProductForm.price} onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Price (₹)" />
                                <select required value={editProductForm.category} onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none bg-white font-medium">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                              </div>
                              <input type="text" value={editProductForm.image} onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Image URL" />
                            </div>
                          </div>

                          {/* Specifications */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specifications</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <input type="text" value={editProductForm.unit} onChange={(e) => setEditProductForm({ ...editProductForm, unit: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Unit" />
                              <input type="text" value={editProductForm.netWeight} onChange={(e) => setEditProductForm({ ...editProductForm, netWeight: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Net Weight" />
                              <input type="text" value={editProductForm.origin} onChange={(e) => setEditProductForm({ ...editProductForm, origin: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium" placeholder="Origin" />
                              <select value={editProductForm.preference} onChange={(e) => setEditProductForm({ ...editProductForm, preference: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white font-medium"><option value="Vegetarian">Veg</option><option value="Non-Vegetarian">Non-Veg</option><option value="Vegan">Vegan</option></select>
                            </div>
                          </div>

                          {/* Details & Lists */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descriptions & Details</h4>
                            <textarea rows="2" value={editProductForm.description} onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-brand outline-none resize-none" placeholder="Description"></textarea>
                            <textarea rows="2" value={editProductForm.features} onChange={(e) => setEditProductForm({ ...editProductForm, features: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-brand outline-none resize-none" placeholder="Features (one per line)"></textarea>
                          </div>

                          <div className="pt-2">
                            <button type="submit" className="w-full bg-brand text-white py-2.5 rounded-xl font-bold hover:bg-brand-dark transition-colors shadow-sm">
                              Update Product
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : deletingProductId === product.id ? (
                      /* ── Delete Confirmation ── */
                      <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                        <Trash2 className="text-red-400" size={32} />
                        <p className="text-sm font-medium text-gray-800">Delete <span className="font-bold">{product.name}</span>?</p>
                        <p className="text-xs text-gray-500">This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">Yes, Delete</button>
                          <button onClick={() => setDeletingProductId(null)} className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal Product Card ── */
                      <>
                        <div className="h-44 overflow-hidden bg-gray-100 flex items-center justify-center relative group">
                          {product.image
                            ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            : <ImageIcon className="text-gray-300" size={48} />
                          }
                          {/* Action buttons overlay */}
                          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditProductClick(product)}
                              className="bg-white/90 backdrop-blur-sm text-brand hover:bg-brand hover:text-white p-1.5 rounded-lg shadow-sm transition-colors"
                              title="Edit Product"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingProductId(product.id)}
                              className="bg-white/90 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-lg shadow-sm transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="text-xs font-semibold text-brand mb-1 uppercase tracking-wider">{product.category}</div>
                          <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                          <div className="flex items-center justify-between mt-3">
                            <div className="font-bold text-gray-900">₹{parseFloat(product.price).toFixed(2)}</div>
                            <div className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs truncate max-w-[120px] flex items-center gap-1">
                              <Store size={10} /> {product.vendor}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
        </>
      )}
        </div>
      </div>
    </div>
  );
}
