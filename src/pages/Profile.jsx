import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { realtimeDb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store, Mail, Calendar, Shield, MapPin, FileText, Pencil, Trash2, Check, X, Clock, ShoppingBag, ArrowRight, RefreshCw, ExternalLink, Navigation } from 'lucide-react';

const CATEGORIES = ['Tomatoes','Potatoes','Onions','Brinjal','Carrots','Spinach','Capsicum','Broccoli','Garlic','Apples','Bananas','Strawberries','Oranges','Milk','Butter','Cheese','Yogurt','Paneer'];

export default function Profile() {
  const { user, userProfile, updateProfile } = useAuth();
  const { products: allProducts, addProduct, updateProduct, deleteProduct } = useProducts();
  const navigate = useNavigate();

  // Safely migrate existing users and define current shops array
  const vendorShops = userProfile?.shops || [];

  // Vendor sees products from all their shops combined
  const vendorProducts = allProducts.filter(p => vendorShops.some(shop => shop.shopName === p.vendor));

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
  const [newAddress, setNewAddress] = useState({
    label: '', // e.g., Home, Office
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const savedAddresses = userProfile?.addresses || [];

  const handleAddressInputChange = (e) => {
    setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (newAddress.street && newAddress.city) {
      const addressToAdd = { ...newAddress, id: Date.now() };
      updateProfile({ addresses: [...savedAddresses, addressToAdd] });
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
      setShowAddressForm(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
    updateProfile({ addresses: updatedAddresses });
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

      {/* Addresses Section (Shared for both Customer and Vendor) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Saved Addresses</h2>
              <p className="text-sm text-gray-500">Manage your delivery locations</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-dark transition-colors"
          >
            {showAddressForm ? <X size={18} /> : <Plus size={18} />}
            {showAddressForm ? 'Cancel' : 'Add New Address'}
          </button>
        </div>

        {showAddressForm && (
          <form onSubmit={handleAddAddress} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Save Address
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
                
                <button 
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Section (Shared View Logic) */}
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
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* ── Vendor: No Shop Yet ──────────────────────────────────────────────── */}
      {userProfile?.role === 'vendor' && vendorShops.length === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto mt-8">
          <div className="text-center mb-6">
            <Store className="mx-auto text-brand mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900">Set Up Your Shop</h2>
            <p className="text-gray-500 text-sm mt-1">Add your shop name so you can start adding products.</p>
          </div>
          <form onSubmit={handleShopSetup} className="space-y-4">
            <div>
              <label className={labelCls}>Shop Name</label>
              <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({...shopSetup, shopName: e.target.value})} className={inputCls} placeholder="E.g. Fresh Valley Farms" /></div>
            </div>
            <div>
              <label className={labelCls}>Shop Location <span className="text-brand font-bold">*</span></label>
              <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={shopSetup.location} onChange={(e) => setShopSetup({...shopSetup, location: e.target.value})} className={inputCls} placeholder="E.g. Andheri West, Mumbai, Maharashtra" /></div>
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <Navigation size={11} /> Use a specific address (area + city + state) — this is shown to customers on Google Maps when they track their delivery.
              </p>
            </div>
            <div>
              <label className={labelCls}>GST Number</label>
              <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={shopSetup.gstNumber} onChange={(e) => setShopSetup({...shopSetup, gstNumber: e.target.value})} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" /></div>
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
                            <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({...editShopForm, shopName: e.target.value})} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" /></div>
                          </div>
                          <div>
                            <label className={labelCls}>Location <span className="text-brand font-bold">*</span></label>
                            <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({...editShopForm, location: e.target.value})} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" placeholder="E.g. Andheri West, Mumbai, Maharashtra" /></div>
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <Navigation size={10} /> Enter your full address so customers can see your shop on Google Maps when tracking orders.
                            </p>
                          </div>
                          <div>
                            <label className={labelCls}>GST Number</label>
                            <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({...editShopForm, gstNumber: e.target.value})} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-brand outline-none text-sm" /></div>
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

                {!showAddShopForm && (
                  <button onClick={() => setShowAddShopForm(true)} className="flex items-center gap-1 bg-gray-100 text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors mt-4">
                    <Plus size={14} /> Add Shop
                  </button>
                )}
              </div>

              {/* Add New Product button */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm flex-shrink-0"
              >
                <Plus size={20} />
                {showAddForm ? 'Cancel' : 'Add New Product'}
              </button>
            </div>
          </div>

          {/* ── Add New Shop Form ─────────────────────────────────────────────── */}
          {showAddShopForm && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Add New Shop</h2>
              <form onSubmit={handleAddAdditionalShop} className="space-y-4">
                <div>
                  <label className={labelCls}>Shop Name</label>
                  <div className="relative"><Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={newShop.shopName} onChange={(e) => setNewShop({...newShop, shopName: e.target.value})} className={inputCls} placeholder="E.g. Fresh Valley Farms" /></div>
                </div>
                <div>
                  <label className={labelCls}>Shop Location <span className="text-brand font-bold">*</span></label>
                  <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={newShop.location} onChange={(e) => setNewShop({...newShop, location: e.target.value})} className={inputCls} placeholder="E.g. Andheri West, Mumbai, Maharashtra" /></div>
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                    <Navigation size={11} /> Use a specific address — customers see this on Google Maps when tracking their order.
                  </p>
                </div>
                <div>
                  <label className={labelCls}>GST Number</label>
                  <div className="relative"><FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input required type="text" value={newShop.gstNumber} onChange={(e) => setNewShop({...newShop, gstNumber: e.target.value})} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" /></div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button type="submit" className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors">Create Shop</button>
                  <button type="button" onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '' }); }} className="text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-xl font-medium">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Add Product Form ──────────────────────────────────────────────── */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-4xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-8">
                
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

                <div className="pt-6 border-t font-bold">
                  <button type="submit" className="bg-brand text-white px-8 py-4 rounded-xl w-full hover:bg-brand-dark transition-all shadow-lg active:scale-[0.99] text-lg">
                    Save Product to Marketplace
                  </button>
                </div>
              </form>
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
                                 <input required type="text" value={editProductForm.name} onChange={(e) => setEditProductForm({...editProductForm, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Name" />
                                 <div className="grid grid-cols-2 gap-3">
                                    <input required type="number" step="0.01" value={editProductForm.price} onChange={(e) => setEditProductForm({...editProductForm, price: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Price (₹)" />
                                    <select required value={editProductForm.category} onChange={(e) => setEditProductForm({...editProductForm, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none bg-white font-medium">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                 </div>
                                 <input type="text" value={editProductForm.image} onChange={(e) => setEditProductForm({...editProductForm, image: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none" placeholder="Image URL" />
                              </div>
                           </div>

                           {/* Specifications */}
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Specifications</h4>
                              <div className="grid grid-cols-2 gap-3">
                                 <input type="text" value={editProductForm.unit} onChange={(e) => setEditProductForm({...editProductForm, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Unit" />
                                 <input type="text" value={editProductForm.netWeight} onChange={(e) => setEditProductForm({...editProductForm, netWeight: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="Net Weight" />
                                 <input type="text" value={editProductForm.origin} onChange={(e) => setEditProductForm({...editProductForm, origin: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium" placeholder="Origin" />
                                 <select value={editProductForm.preference} onChange={(e) => setEditProductForm({...editProductForm, preference: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white font-medium"><option value="Vegetarian">Veg</option><option value="Non-Vegetarian">Non-Veg</option><option value="Vegan">Vegan</option></select>
                              </div>
                           </div>

                           {/* Details & Lists */}
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descriptions & Details</h4>
                              <textarea rows="2" value={editProductForm.description} onChange={(e) => setEditProductForm({...editProductForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-brand outline-none resize-none" placeholder="Description"></textarea>
                              <textarea rows="2" value={editProductForm.features} onChange={(e) => setEditProductForm({...editProductForm, features: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:border-brand outline-none resize-none" placeholder="Features (one per line)"></textarea>
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
    </div>
  );
}
