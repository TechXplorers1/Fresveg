import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { realtimeDb } from '../firebase';
import OrderTrackingMap from '../components/OrderTrackingMap';
import { ref, onValue, update, set, push } from 'firebase/database';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store, Mail, Calendar, Shield, MapPin, FileText, Pencil, Trash2, Check, X, Clock, ShoppingBag, ArrowRight, ArrowLeft, RefreshCw, ExternalLink, Navigation, LogOut as LogOutIcon, Bike, Power, Compass, CheckCircle, Users } from 'lucide-react';

const CATEGORIES = ['Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'];

export default function Profile() {
  const { user, userProfile, loading, updateProfile, logout } = useAuth();
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

  const [selectedShopFilter, setSelectedShopFilter] = useState(null);

  // Vendor sees products from all their shops combined (or selected filtered shop)
  const vendorProducts = allProducts.filter(p => {
    const belongsToVendor = (p.vendorId && user?.uid && p.vendorId === user.uid) ||
      vendorShops.some(shop => shop.shopName?.trim().toLowerCase() === p.vendor?.trim().toLowerCase());
    if (!belongsToVendor) return false;

    if (selectedShopFilter) {
      return p.vendor?.trim().toLowerCase() === selectedShopFilter.trim().toLowerCase();
    }
    return true;
  });

  const isVendor = userProfile?.role === 'vendor';



  // ─── UI Visibility States ───────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddShopForm, setShowAddShopForm] = useState(false);

  // ─── Add Product State ──────────────────────────────────────────────────────
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', shop: '', unit: 'kg',
    description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
    netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
  });

  // ─── Add Shop States ────────────────────────────────────────────────────────
  const [shopSetup, setShopSetup] = useState({ shopName: '', location: '', gstNumber: '', image: '' });
  const [newShop, setNewShop] = useState({ shopName: '', location: '', gstNumber: '', image: '' });

  // ─── Edit Shop State ────────────────────────────────────────────────────────
  const [editingShopIndex, setEditingShopIndex] = useState(null);
  const [editShopForm, setEditShopForm] = useState({ shopName: '', location: '', gstNumber: '', image: '' });

  // ─── Edit / Delete Product State ────────────────────────────────────────────
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', unit: '',
    description: '', origin: '', preference: '', shelfLife: '',
    netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
  });
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [detectingShopLocation, setDetectingShopLocation] = useState(false);
  const [deletingShopIndex, setDeletingShopIndex] = useState(null);
  const [viewingShopIndex, setViewingShopIndex] = useState(null);

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



  // ─── Shop Handlers ──────────────────────────────────────────────────────────
  const handleShopSetup = (e) => {
    e.preventDefault();
    if (shopSetup.shopName.trim() && shopSetup.location.trim() && shopSetup.gstNumber.trim()) {
      const shop = {
        shopName: shopSetup.shopName.trim(),
        location: shopSetup.location.trim(),
        gstNumber: shopSetup.gstNumber.trim(),
        image: shopSetup.image.trim(),
        createdAt: new Date().toISOString()
      };
      updateProfile({ shops: [...vendorShops, shop] });
      setShopSetup({ shopName: '', location: '', gstNumber: '', image: '' });
    }
  };

  const handleAddAdditionalShop = (e) => {
    e.preventDefault();
    if (newShop.shopName.trim() && newShop.location.trim() && newShop.gstNumber.trim()) {
      const shopToAdd = {
        shopName: newShop.shopName.trim(),
        location: newShop.location.trim(),
        gstNumber: newShop.gstNumber.trim(),
        image: newShop.image.trim(),
        createdAt: new Date().toISOString()
      };
      updateProfile({ shops: [...vendorShops, shopToAdd] });
      setNewShop({ shopName: '', location: '', gstNumber: '', image: '' });
      setShowAddShopForm(false);
    }
  };

  const handleEditShopClick = (shop, index) => {
    setEditingShopIndex(index);
    setEditShopForm({
      shopName: shop.shopName,
      location: shop.location,
      gstNumber: shop.gstNumber,
      image: shop.image || ''
    });
  };

  const handleUpdateShop = (e) => {
    e.preventDefault();
    const oldShopName = vendorShops[editingShopIndex].shopName;
    const newShopName = editShopForm.shopName.trim();
    const updatedShops = vendorShops.map((shop, i) =>
      i === editingShopIndex
        ? {
          ...shop,
          shopName: newShopName,
          location: editShopForm.location.trim(),
          gstNumber: editShopForm.gstNumber.trim(),
          image: editShopForm.image.trim()
        }
        : shop
    );

    // If shopName changed, update all products belonging to the old shop name
    if (oldShopName !== newShopName) {
      const shopProducts = allProducts.filter(p => p.vendor === oldShopName);
      shopProducts.forEach(product => {
        updateProduct(product.id, { vendor: newShopName });
      });
      // Update selected shop filter if it was active
      if (selectedShopFilter === oldShopName) {
        setSelectedShopFilter(newShopName);
      }
    }

    updateProfile({ shops: updatedShops });
    setEditingShopIndex(null);
  };

  const handleDeleteShop = (index) => {
    const shopToDelete = vendorShops[index];
    if (shopToDelete) {
      // Clean up products associated with the deleted shop name
      const shopProducts = allProducts.filter(p => p.vendor === shopToDelete.shopName);
      shopProducts.forEach(product => {
        deleteProduct(product.id);
      });

      // Update user profile shops
      const updatedShops = vendorShops.filter((_, i) => i !== index);
      updateProfile({ shops: updatedShops });
      setDeletingShopIndex(null);
    }
  };

  const handleOpenAddProductForShop = (shopName) => {
    setNewProduct({
      name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', shop: shopName, unit: 'kg',
      description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
      netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
    });
    setShowAddForm(true);
  };

  // ─── Product Handlers ───────────────────────────────────────────────────────
  const handleInputChange = (e) => setNewProduct({ ...newProduct, [e.target.name]: e.target.value });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const selectedShop = vendorShops.find(shop => shop.shopName === newProduct.shop) || vendorShops[0];
      const targetShopName = selectedShop?.shopName || newProduct.shop || 'Local Vendor';

      const productData = {
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price) || 0,
        mrp: newProduct.mrp ? parseFloat(newProduct.mrp) : (parseFloat(newProduct.price) || 0),
        unit: newProduct.unit.trim() || 'kg',
        category: newProduct.category || 'General',
        image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
        shop: targetShopName,
        vendor: targetShopName,
        vendorId: user?.uid || 'vendor-default',
        stockQuantity: newProduct.stockQuantity ? parseInt(newProduct.stockQuantity) : 100,
        shopLocation: selectedShop?.location || '',
        description: newProduct.description || '',
        origin: newProduct.origin || '',
        preference: newProduct.preference || 'Vegetarian',
        shelfLife: newProduct.shelfLife || '',
        netWeight: newProduct.netWeight || '',
        returnPolicy: newProduct.returnPolicy || '',
        offers: typeof newProduct.offers === 'string' ? newProduct.offers.split('\n').filter(line => line.trim() !== '') : newProduct.offers || [],
        features: typeof newProduct.features === 'string' ? newProduct.features.split('\n').filter(line => line.trim() !== '') : newProduct.features || [],
        rating: 5.0,
        createdAt: new Date().toISOString()
      };

      // Single Product Creation via ProductContext
      await addProduct(productData);

      alert('✅ Product successfully added to Firebase Database!');

      setNewProduct({
        name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', shop: '', unit: 'kg',
        description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
        netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add product to Firebase:', err);
      if (err.message && err.message.includes('PERMISSION_DENIED')) {
        alert('⚠️ Firebase Security Rules Notice:\n\nYour Firebase Realtime Database is blocking writes to the "products" node (PERMISSION_DENIED).\n\nTo fix this in 30 seconds:\n1. Open Firebase Console -> Realtime Database -> Rules tab.\n2. Set ".read": true and ".write": true\n3. Click Publish!');
      } else {
        alert('Error adding product to Firebase: ' + err.message);
      }
    }
  };

  const handleEditProductClick = (product) => {
    setEditingProductId(product.id);
    setEditProductForm({
      name: product.name || '',
      shop: product.vendor || product.shop || '',
      price: String(product.price || ''),
      mrp: product.mrp ? String(product.mrp) : String(product.price || ''),
      stockQuantity: String(product.stockQuantity || 100),
      category: product.category || '',
      image: product.image || '',
      unit: product.unit || 'kg',
      netWeight: product.netWeight || '',
      preference: product.preference || 'Vegetarian',
      origin: product.origin || '',
      shelfLife: product.shelfLife || '',
      harvestDate: product.harvestDate || '',
      organicCert: product.organicCert || '',
      storageInfo: product.storageInfo || '',
      description: product.description || '',
      returnPolicy: product.returnPolicy || '',
      offers: Array.isArray(product.offers) ? product.offers.join('\n') : (product.offers || ''),
      features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || '')
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProductId) return;
    try {
      const selectedShop = vendorShops.find(shop => shop.shopName === editProductForm.shop) || vendorShops[0];
      const targetShopName = selectedShop?.shopName || editProductForm.shop || 'Local Vendor';

      const updatedData = {
        name: editProductForm.name.trim(),
        price: parseFloat(editProductForm.price) || 0,
        mrp: editProductForm.mrp ? parseFloat(editProductForm.mrp) : (parseFloat(editProductForm.price) || 0),
        unit: editProductForm.unit.trim() || 'kg',
        category: editProductForm.category || 'General',
        image: editProductForm.image.trim() || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
        shop: targetShopName,
        vendor: targetShopName,
        vendorId: user?.uid || '',
        stockQuantity: editProductForm.stockQuantity ? parseInt(editProductForm.stockQuantity) : 100,
        shopLocation: selectedShop?.location || '',
        preference: editProductForm.preference || 'Vegetarian',
        origin: editProductForm.origin || '',
        shelfLife: editProductForm.shelfLife || '',
        harvestDate: editProductForm.harvestDate || '',
        organicCert: editProductForm.organicCert || '',
        storageInfo: editProductForm.storageInfo || '',
        description: editProductForm.description || '',
        netWeight: editProductForm.netWeight || '',
        returnPolicy: editProductForm.returnPolicy || '',
        offers: typeof editProductForm.offers === 'string' ? editProductForm.offers.split('\n').filter(line => line.trim() !== '') : editProductForm.offers || [],
        features: typeof editProductForm.features === 'string' ? editProductForm.features.split('\n').filter(line => line.trim() !== '') : editProductForm.features || []
      };

      await updateProduct(editingProductId, updatedData);
      setEditingProductId(null);
      alert('✨ Product updated successfully!');
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Error updating product: ' + err.message);
    }
  };

  const handleDeleteProduct = (productId) => {
    deleteProduct(productId);
    setDeletingProductId(null);
  };

  // ─── Farm States & Handlers ────────────────────────────────────────────────
  const [vendorFarms, setVendorFarms] = useState([]);
  const [incomingFarmBookings, setIncomingFarmBookings] = useState([]);
  const [showAddFarmForm, setShowAddFarmForm] = useState(false);
  const [newFarmForm, setNewFarmForm] = useState({
    farmName: '',
    location: '',
    description: '',
    costPerPerson: '',
    costType: 'free',
    image: '',
    crops: '',
    fruits: '',
    livestock: '',
    accommodations: '',
    amenities: '',
    farmProducts: ''
  });
  const [isSubmittingFarm, setIsSubmittingFarm] = useState(false);
  const [detectingFarmLocation, setDetectingFarmLocation] = useState(false);
  const [farmMapCoords, setFarmMapCoords] = useState(null);
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [deletingFarmId, setDeletingFarmId] = useState(null);
  const [editFarmForm, setEditFarmForm] = useState({
    farmName: '',
    location: '',
    description: '',
    costPerPerson: '',
    costType: 'free',
    image: ''
  });
  const farmMapContainerRef = useRef(null);
  const farmMapRef = useRef(null);
  const farmMarkerRef = useRef(null);

  const handleFarmReverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FresVegApp/1.0' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setNewFarmForm(prev => ({
          ...prev,
          location: data.display_name
        }));
      }
    } catch (err) {
      console.error("Farm reverse geocoding failed:", err);
    }
  };

  const handleLocateFarmAddress = async () => {
    if (!newFarmForm.location.trim()) {
      alert("Please enter some address details first.");
      return;
    }
    const coords = await geocodeAddress(newFarmForm.location);
    if (coords) {
      const newCoords = { lat: coords.lat, lng: coords.lon };
      setFarmMapCoords(newCoords);
      await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
    } else {
      alert("Could not locate the farm address on the map.");
    }
  };

  const handleDetectFarmLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingFarmLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setFarmMapCoords(coords);
        await handleFarmReverseGeocode(latitude, longitude);
        setDetectingFarmLocation(false);
      },
      (err) => {
        console.error("GPS error:", err);
        setDetectingFarmLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!showAddFarmForm || !window.L || !farmMapContainerRef.current) {
      if (farmMapRef.current) {
        farmMapRef.current.remove();
        farmMapRef.current = null;
        farmMarkerRef.current = null;
      }
      return;
    }

    const L = window.L;
    const initialLat = farmMapCoords?.lat || 20.5937;
    const initialLng = farmMapCoords?.lng || 78.9629;

    console.log("Initializing Farm Map at:", initialLat, initialLng);

    const map = L.map(farmMapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([initialLat, initialLng], farmMapCoords ? 15 : 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    farmMapRef.current = map;

    const pinHtml = `
      <div class="instamart-marker-container">
        <div class="instamart-marker-shadow"></div>
        <div class="instamart-marker-ground-dot"></div>
        <div class="instamart-marker-pin">
          <div class="instamart-marker-inner-dot"></div>
        </div>
      </div>
    `;
    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'custom-leaflet-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    farmMarkerRef.current = marker;

    marker.on('dragend', async () => {
      const latLng = marker.getLatLng();
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setFarmMapCoords(newCoords);
      await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
    });

    map.on('click', async (e) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setFarmMapCoords(newCoords);
      await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
    });

    return () => {
      if (farmMapRef.current) {
        farmMapRef.current.remove();
        farmMapRef.current = null;
        farmMarkerRef.current = null;
      }
    };
  }, [showAddFarmForm]);

  useEffect(() => {
    if (farmMapRef.current && farmMarkerRef.current && farmMapCoords) {
      const { lat, lng } = farmMapCoords;
      const currentLatLng = farmMarkerRef.current.getLatLng();
      if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
        farmMarkerRef.current.setLatLng([lat, lng]);
        farmMapRef.current.setView([lat, lng], 15);
      }
    }
  }, [farmMapCoords]);

  // Farms listener
  useEffect(() => {
    if (!user || userProfile?.role !== 'vendor') return;
    const farmsRef = ref(realtimeDb, 'farms');
    const unsubscribe = onValue(farmsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        })).filter(f => f.vendorId === user.uid);
        setVendorFarms(list);
      } else {
        setVendorFarms([]);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile]);

  // Bookings listener
  useEffect(() => {
    if (!user || userProfile?.role !== 'vendor') return;
    const bookingsRef = ref(realtimeDb, 'farmBookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allBookings = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));

        const myFarmIds = vendorFarms.map(f => f.id);
        let vendorMockFarmIds = [];
        if (userProfile?.displayName === 'Orchard Farms') vendorMockFarmIds.push('mock-farm-1');
        if (userProfile?.displayName === 'Green Valley Farm') vendorMockFarmIds.push('mock-farm-2');
        if (userProfile?.displayName === 'Sunshine Produce') vendorMockFarmIds.push('mock-farm-3');

        const activeFarmIds = [...myFarmIds, ...vendorMockFarmIds];
        const filtered = allBookings.filter(b => activeFarmIds.includes(b.farmId));
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        setIncomingFarmBookings(filtered);
      } else {
        setIncomingFarmBookings([]);
      }
    });
    return () => unsubscribe();
  }, [user, userProfile, vendorFarms]);

  const handleAddFarm = async (e) => {
    e.preventDefault();
    if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim()) {
      alert('Please fill out Farm Name and Location.');
      return;
    }

    setIsSubmittingFarm(true);
    try {
      const farmsRef = ref(realtimeDb, 'farms');
      const newFarmRef = push(farmsRef);
      const isFree = newFarmForm.costType === 'free';
      const finalCost = isFree ? 0 : (Number(newFarmForm.costPerPerson) || 0);

      const farmData = {
        farmName: newFarmForm.farmName.trim(),
        location: newFarmForm.location.trim(),
        description: newFarmForm.description.trim(),
        costPerPerson: finalCost,
        image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
        vendorId: user.uid,
        vendorName: userProfile?.displayName || user?.displayName || 'Vendor',
        createdAt: new Date().toISOString()
      };
      await set(newFarmRef, farmData);
      setNewFarmForm({ farmName: '', location: '', description: '', costPerPerson: '', image: '' });
      setShowAddFarmForm(false);
      alert('Farm successfully listed!');
    } catch (err) {
      console.error('Failed to add farm:', err);
      alert('Error listing farm: ' + err.message);
    } finally {
      setIsSubmittingFarm(false);
    }
  };

  const handleEditFarmClick = (farm) => {
    const slug = farm.farmName
      ? farm.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : farm.id;
    navigate(`/farm/${slug}?edit=true`);
  };

  const handleSaveFarmForm = async (e) => {
    e.preventDefault();
    if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim()) {
      alert('Please fill out Farm Name and Location.');
      return;
    }

    setIsSubmittingFarm(true);
    try {
      const isFree = newFarmForm.costType === 'free';
      const finalCost = isFree ? 0 : (Number(newFarmForm.costPerPerson) || 0);

      const parseList = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        return str.split(',').map(s => s.trim()).filter(Boolean);
      };

      const parseAccommodations = (str) => {
        const list = parseList(str);
        if (list.length === 0) return [
          { id: 'acc-1', title: 'Farmhouse Guest Suite', desc: 'Clean room with garden view', price: 'Included', icon: 'house' },
          { id: 'acc-2', title: 'Rustic Clay Hut', desc: 'Traditional village stay', price: 'Included', icon: 'hut' }
        ];
        return list.map((title, idx) => ({
          id: `acc-${idx + 1}`,
          title,
          desc: `Comfortable ${title.toLowerCase()} experience at the farm`,
          price: 'Included',
          icon: title.toLowerCase().includes('tent') ? 'tent' : title.toLowerCase().includes('hut') ? 'hut' : 'house'
        }));
      };

      const parseProducts = (str) => {
        if (!str) return [];
        if (Array.isArray(str)) return str;
        const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map((line, idx) => {
          const matchPrice = line.match(/₹?\s*(\d+)/);
          const price = matchPrice ? Number(matchPrice[1]) : 120;
          const cleanName = line.replace(/\(.*\)/, '').replace(/₹?\s*\d+.*/, '').trim() || line;
          return {
            id: `fp-${Date.now()}-${idx}`,
            name: cleanName,
            price,
            unit: 'pack',
            image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
            vendor: newFarmForm.farmName || 'Farm Direct'
          };
        });
      };

      const farmData = {
        farmName: newFarmForm.farmName.trim(),
        location: newFarmForm.location.trim(),
        description: newFarmForm.description.trim(),
        costPerPerson: finalCost,
        image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
        crops: parseList(newFarmForm.crops),
        fruits: parseList(newFarmForm.fruits),
        livestock: parseList(newFarmForm.livestock),
        accommodations: parseAccommodations(newFarmForm.accommodations),
        amenities: parseList(newFarmForm.amenities),
        farmProducts: parseProducts(newFarmForm.farmProducts),
        vendorId: user.uid,
        vendorName: userProfile?.displayName || user?.displayName || 'Vendor',
        createdAt: new Date().toISOString()
      };

      if (editingFarmId) {
        const farmRef = ref(realtimeDb, `farms/${editingFarmId}`);
        await update(farmRef, farmData);
        alert('Farm updated successfully!');
      } else {
        const farmsRef = ref(realtimeDb, 'farms');
        const newFarmRef = push(farmsRef);
        await set(newFarmRef, farmData);
        alert('Farm successfully listed!');
      }

      setEditingFarmId(null);
      setNewFarmForm({
        farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
        crops: '', fruits: '', livestock: '', accommodations: '', amenities: '', farmProducts: ''
      });
      setShowAddFarmForm(false);
    } catch (err) {
      console.error('Failed to save farm:', err);
      alert('Error saving farm: ' + err.message);
    } finally {
      setIsSubmittingFarm(false);
    }
  };

  const handleCancelFarmForm = () => {
    setEditingFarmId(null);
    setNewFarmForm({
      farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
      crops: '', fruits: '', livestock: '', accommodations: '', amenities: '', farmProducts: ''
    });
    setShowAddFarmForm(false);
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const bookingRef = ref(realtimeDb, `farmBookings/${bookingId}`);
      await update(bookingRef, { status: 'confirmed' });
      alert('Booking accepted!');
    } catch (err) {
      console.error('Failed to accept booking:', err);
      alert('Error updating booking: ' + err.message);
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to decline this booking?')) return;
    try {
      const bookingRef = ref(realtimeDb, `farmBookings/${bookingId}`);
      await update(bookingRef, { status: 'rejected' });
      alert('Booking declined!');
    } catch (err) {
      console.error('Failed to decline booking:', err);
      alert('Error updating booking: ' + err.message);
    }
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

  const [profileMapCoords, setProfileMapCoords] = useState(null);
  const profileMapContainerRef = useRef(null);
  const profileMapRef = useRef(null);
  const profileMarkerRef = useRef(null);

  const handleReverseGeocode = async (lat, lng, addressSetter) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FresVegApp/1.0' }
      });
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;

        // Extract all possible door/house/building identifiers to form an approximate door number
        const doorNumberParts = [
          addr.house_number,
          addr.house_name,
          addr.building,
          addr.flat,
          addr.apartment,
          addr.unit
        ].filter(Boolean);
        const doorNumber = doorNumberParts.join(', ');

        const streetName = addr.road || addr.suburb || addr.neighbourhood || '';
        const street = doorNumber
          ? `${doorNumber}, ${streetName}`
          : streetName || addr.amenity || 'Selected Location';

        const city = addr.city || addr.town || addr.village || addr.state_district || '';
        const state = addr.state || '';
        const zipCode = addr.postcode || '';
        const country = addr.country || 'India';
        addressSetter(prev => ({
          ...prev,
          street,
          city,
          state,
          zipCode,
          country
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const handleLocateTypedAddress = async () => {
    const { street, city, state, zipCode, country } = newAddress;
    const queryParts = [street, city, state, zipCode, country].filter(part => part && part.trim() !== '');
    if (queryParts.length === 0) {
      alert("Please fill in some address details first.");
      return;
    }
    const queryStr = queryParts.join(', ');
    const coords = await geocodeAddress(queryStr);
    if (coords) {
      const newCoords = { lat: coords.lat, lng: coords.lon };
      setProfileMapCoords(newCoords);
      // Automatically reverse geocode to get precise details (like door number) for this coordinate!
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
    } else {
      alert("Could not locate the typed address on the map. Try checking the spelling.");
    }
  };

  useEffect(() => {
    if (!showAddressForm || !window.L || !profileMapContainerRef.current) {
      if (profileMapRef.current) {
        profileMapRef.current.remove();
        profileMapRef.current = null;
        profileMarkerRef.current = null;
      }
      return;
    }

    const L = window.L;
    const initialLat = profileMapCoords?.lat || 20.5937;
    const initialLng = profileMapCoords?.lng || 78.9629;

    console.log("Initializing Profile Map at:", initialLat, initialLng);

    const map = L.map(profileMapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([initialLat, initialLng], profileMapCoords ? 16 : 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    profileMapRef.current = map;

    const pinHtml = `
      <div class="instamart-marker-container">
        <div class="instamart-marker-shadow"></div>
        <div class="instamart-marker-ground-dot"></div>
        <div class="instamart-marker-pin">
          <div class="instamart-marker-inner-dot"></div>
        </div>
      </div>
    `;
    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'custom-leaflet-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    profileMarkerRef.current = marker;

    marker.on('dragend', async () => {
      const latLng = marker.getLatLng();
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setProfileMapCoords(newCoords);
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
    });

    map.on('click', async (e) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setProfileMapCoords(newCoords);
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
    });

    return () => {
      if (profileMapRef.current) {
        profileMapRef.current.remove();
        profileMapRef.current = null;
        profileMarkerRef.current = null;
      }
    };
  }, [showAddressForm]);

  useEffect(() => {
    if (profileMapRef.current && profileMarkerRef.current && profileMapCoords) {
      const { lat, lng } = profileMapCoords;
      const currentLatLng = profileMarkerRef.current.getLatLng();
      if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
        profileMarkerRef.current.setLatLng([lat, lng]);
        profileMapRef.current.setView([lat, lng], 16);
      }
    }
  }, [profileMapCoords]);

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

            // Extract all possible door/house/building identifiers to form an approximate door number
            const doorNumberParts = [
              addr.house_number,
              addr.house_name,
              addr.building,
              addr.flat,
              addr.apartment,
              addr.unit
            ].filter(Boolean);
            const doorNumber = doorNumberParts.join(', ');

            const streetName = addr.road || addr.suburb || addr.neighbourhood || '';
            const street = doorNumber
              ? `${doorNumber}, ${streetName}`
              : streetName || addr.amenity || 'Current Location';

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
            setProfileMapCoords({ lat: latitude, lng: longitude });
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

  const handleEditAddressClick = async (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({
      label: addr.label || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || ''
    });

    // Geocode to initialize map coordinates
    const addressStr = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country || ''}`;
    const coords = await geocodeAddress(addressStr);
    if (coords) {
      setProfileMapCoords({ lat: coords.lat, lng: coords.lon });
    } else {
      setProfileMapCoords(null);
    }

    setShowAddressForm(true);
  };

  const toggleAddressForm = () => {
    if (showAddressForm) {
      setEditingAddressId(null);
      setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
      setProfileMapCoords(null);
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
  const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-sm transition-all duration-200 bg-white font-body text-slate-800 placeholder:text-slate-400';
  const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-headings';

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

  // States for delivery distance calculation
  const [calculatingDistanceForId, setCalculatingDistanceForId] = useState(null);
  const [calculatedDistances, setCalculatedDistances] = useState({});
  const [viewedMaps, setViewedMaps] = useState({});

  const getHaversineDistance = (coords1, coords2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const handleCalculateDistance = async (order) => {
    const pickupAddr = order.items[0]?.shopLocation;
    const deliveryAddr = order.address;

    if (!pickupAddr || !deliveryAddr) {
      alert("Both shop location and delivery address must be set to calculate distance.");
      return;
    }

    setCalculatingDistanceForId(order.id);

    try {
      const startCoords = await geocodeAddress(pickupAddr);
      await new Promise((r) => setTimeout(r, 600)); // slight throttle to respect Nominatim API
      const endCoords = await geocodeAddress(deliveryAddr);

      if (!startCoords || !endCoords) {
        // Fallback to a realistic random distance so the delivery boy is never stuck if geocoding fails
        const mockDist = (Math.random() * 8 + 2).toFixed(2);
        setCalculatedDistances(prev => ({
          ...prev,
          [order.id]: { distance: mockDist, isFallback: true }
        }));
      } else {
        const dist = getHaversineDistance(startCoords, endCoords).toFixed(2);
        setCalculatedDistances(prev => ({
          ...prev,
          [order.id]: { distance: dist, isFallback: false }
        }));
      }
    } catch (err) {
      console.error("Error calculating distance:", err);
      const mockDist = (Math.random() * 8 + 2).toFixed(2);
      setCalculatedDistances(prev => ({
        ...prev,
        [order.id]: { distance: mockDist, isFallback: true }
      }));
    } finally {
      setCalculatingDistanceForId(null);
    }
  };

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
      console.error('Failed to accept delivery order:', error);
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
  // ─── Route Protection & Session Loading ────────────────────────────────────
  // Show loading state while Firebase restores auth state on refresh
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600"></div>
        <p className="text-xs font-bold text-emerald-800 animate-pulse mt-4 font-headings">Restoring session...</p>
      </div>
    );
  }

  // Protect route (only redirect once auth loading is finished and user is not logged in)
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* ── User Profile Header ─────────────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl shadow-emerald-950/[0.02] p-8 mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100/50 shadow-inner text-emerald-600">
              <User size={40} />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-800 font-headings mb-2">{userProfile?.displayName || user?.displayName || 'User'}</h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium text-sm">
              <div className="flex items-center gap-2"><Mail size={15} /><span>{userProfile?.email || user?.email}</span></div>
              <div className="flex items-center gap-1.5"><Shield size={15} /><span className="capitalize font-bold text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-100/30">{userProfile?.role || 'customer'}</span></div>
              {userProfile?.createdAt && (
                <div className="flex items-center gap-2"><Calendar size={15} /><span>Joined {new Date(userProfile.createdAt).toLocaleDateString()}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-2 sticky top-24">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3 font-headings">Dashboard Menu</p>

            {userProfile?.role !== 'delivery_person' && (
              <>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'addresses'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                    : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                >
                  <MapPin size={18} />
                  My Saved Addresses
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'orders'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                    : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                >
                  <ShoppingBag size={18} />
                  {isVendor ? 'Customer Orders' : 'My Orders'}
                </button>

                {isVendor && (
                  <>
                    <button
                      onClick={() => setActiveTab('setup')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'setup' && !showAddForm
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                        }`}
                    >
                      <Store size={18} />
                      Set Up Your Shop
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('setup');
                        const defaultShopName = vendorShops[0]?.shopName || '';
                        handleOpenAddProductForShop(defaultShopName);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'setup' && showAddForm
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                        }`}
                    >
                      <Package size={18} />
                      Add Products
                    </button>
                    <button
                      onClick={() => setActiveTab('farms')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'farms'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                        }`}
                    >
                      <Compass size={18} />
                      My Farms
                    </button>
                  </>
                )}
              </>
            )}

            {userProfile?.role === 'delivery_person' && (
              <>
                {/* Available Orders */}
                <button
                  onClick={() => setActiveTab('delivery_jobs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_jobs'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                    : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                >
                  <Bike size={18} />
                  Available Orders
                </button>

                {/* Active Delivery */}
                <button
                  onClick={() => setActiveTab('delivery_active')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_active'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                    : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                >
                  <Navigation size={18} />
                  Active Delivery
                </button>

                {/* Completed Orders */}
                <button
                  onClick={() => setActiveTab('delivery_completed')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_completed'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                    : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                >
                  <Check size={18} />
                  Completed Orders
                </button>
              </>
            )}

            <div className="border-t border-slate-100 my-2 pt-2">
              <button
                onClick={handleVendorLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all text-sm text-left"
              >
                <LogOutIcon size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'addresses' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">
                      {editingAddressId ? 'Edit Address' : 'My Saved Addresses'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      {editingAddressId ? 'Update your address details below' : 'Manage your delivery locations'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleAddressForm}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] self-start sm:self-auto"
                >
                  {showAddressForm ? <X size={14} /> : <Plus size={14} />}
                  {showAddressForm ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-slate-50/50 backdrop-blur border border-slate-100 p-6 rounded-3xl mb-8 space-y-4 max-w-4xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Form Fields */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Location Services Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl gap-3">
                        <div className="flex items-center gap-2">
                          <Navigation size={18} className={`text-emerald-600 ${detectingLocation ? 'animate-spin' : ''}`} />
                          <div>
                            <p className="text-xs font-bold text-emerald-800 font-headings">Location Services</p>
                            <p className="text-[10px] text-slate-400">Detecting details automatically via GPS reverse geocoding</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            disabled={detectingLocation}
                            onClick={handleDetectLocation}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto"
                          >
                            <RefreshCw size={12} className={detectingLocation ? 'animate-spin' : ''} />
                            {detectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}
                          </button>
                          <button
                            type="button"
                            onClick={handleLocateTypedAddress}
                            className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto"
                            title="Geocode fields and update pin"
                          >
                            <MapPin size={12} />
                            Locate Address
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelCls}>Label (e.g. Home, Office)</label>
                          <input required type="text" name="label" value={newAddress.label} onChange={handleAddressInputChange} className={inputCls} placeholder="Home" />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>
                            Street Address <span className="text-[10px] text-gray-400 font-normal">(Include Door/Flat/Plot No. if missing)</span>
                          </label>
                          <input required type="text" name="street" value={newAddress.street} onChange={handleAddressInputChange} className={inputCls} placeholder="e.g. Door No. 45, Main St" />
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

                      <button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98]">
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                      </button>
                    </div>

                    {/* Right Column: Interactive Map */}
                    <div className="lg:col-span-5 flex flex-col min-h-[300px]">
                      <label className={labelCls}>Pin Location on Map</label>
                      <div
                        ref={profileMapContainerRef}
                        id="profile-address-map"
                        className="w-full flex-grow rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative"
                        style={{ minHeight: '300px', zIndex: 1 }}
                      />
                      <p className="text-[10px] text-slate-405 mt-2">
                        ℹ️ Drag the green marker or click on the map to pinpoint your location precisely. The fields will update automatically.
                      </p>
                    </div>

                  </div>
                </form>
              )}

              {savedAddresses.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <MapPin className="mx-auto text-slate-350 mb-4" size={48} />
                  <p className="text-slate-500 font-bold text-sm">No addresses saved yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedAddresses.map((addr) => (
                    <div key={addr.id} className="bg-white/40 hover:bg-white/90 p-5 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 relative group">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100/30 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {addr.label || 'Other'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 font-headings">{addr.street}</p>
                      <p className="text-xs text-slate-400 mt-1">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">{addr.country}</p>

                      <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleEditAddressClick(addr)}
                          className="text-slate-450 hover:text-emerald-600 hover:bg-white transition-all p-1.5 rounded-lg shadow-sm border border-slate-100"
                          title="Edit Address"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-slate-450 hover:text-rose-600 hover:bg-white transition-all p-1.5 rounded-lg shadow-sm border border-slate-100"
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
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] mb-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-headings text-slate-800">{userProfile?.role === 'vendor' ? 'Customer Orders' : 'My Orders'}</h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {userProfile?.role === 'vendor'
                      ? 'Manage orders for your products'
                      : 'Track your recent purchases and delivery status'}
                  </p>
                </div>
              </div>

              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-600"></div>
                  <p className="text-xs font-semibold text-emerald-850 animate-pulse font-headings mt-4">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-550 font-bold text-sm">No orders found.</p>
                  {userProfile?.role === 'customer' && (
                    <button onClick={() => navigate('/')} className="mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                      Start Shopping
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden">
                      {/* Order Header */}
                      <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-xs font-medium">
                            <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order Placed</p>
                            <p className="text-slate-700 font-bold">{new Date(order.timestamp).toLocaleDateString()}</p>
                          </div>
                          <div className="text-xs font-medium">
                            <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Total Amount</p>
                            <p className="text-emerald-600 font-extrabold">₹{parseFloat(order.total).toFixed(2)}</p>
                          </div>
                          <div className="text-xs font-medium">
                            <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order ID</p>
                            <p className="text-slate-700 font-mono font-bold uppercase">#{order.id.slice(-8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-50 text-emerald-805 border border-emerald-100/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Clock size={10} /> {order.status}
                          </span>
                          <button
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="flex items-center gap-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 text-slate-750 hover:text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                          >
                            <ArrowRight size={10} /> Track
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
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-2xl border border-slate-100 flex-shrink-0" />
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{item.name}</h4>
                                  <p className="text-[10px] text-slate-405 font-semibold">Sold by: {item.vendor}</p>
                                  <div className="flex items-center gap-4 mt-1">
                                    <p className="text-xs font-bold text-emerald-600">Qty: {item.quantity}</p>
                                    <p className="text-xs font-bold text-slate-500">₹{item.price}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Info */}
                          <div className="md:col-span-4 bg-white/50 p-4 rounded-2xl border border-slate-100/85 flex flex-col justify-center">
                            <div className="flex items-start gap-2">
                              <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider font-headings">Shipping Destination</p>
                                <p className="text-xs text-slate-650 leading-relaxed italic line-clamp-3">
                                  {order.address}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vendor Controls */}
                      {isVendor && (
                        <div className="bg-emerald-500/[0.015] border-t border-slate-105 px-6 py-4 flex items-center justify-between gap-4">
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 font-headings">
                            <Shield size={14} className="text-emerald-600" /> Vendor Controls
                          </div>
                          <div className="flex items-center gap-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                              >
                                <Check size={14} /> Confirm Order
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                              >
                                <Package size={14} /> Start Packing
                              </button>
                            )}
                            {order.status === 'processing' && (
                              <>
                                {order.deliveryStatus === 'requested' ? (
                                  <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-amber-100">
                                    <Clock size={12} className="animate-pulse" /> Awaiting Delivery Acceptance
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'processing', { deliveryStatus: 'requested' })}
                                    className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                  >
                                    <Bike size={14} /> Request Dispatch Rider
                                  </button>
                                )}
                              </>
                            )}
                            {order.status === 'dispatched' && (
                              <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full uppercase font-headings">
                                <Bike size={12} /> Dispatched Rider: {order.deliveryBoyName || 'Assigned'}
                              </div>
                            )}
                            {order.status === 'delivered' && (
                              <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-emerald-100">
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
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                    <Bike size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Available Delivery Jobs</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Claim pending requests from vendors nearby</p>
                  </div>
                </div>
                {/* Duty status toggle */}
                <button
                  onClick={() => setIsTrackingActive(!isTrackingActive)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm font-headings ${isTrackingActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/10 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                >
                  <Power size={14} />
                  {isTrackingActive ? 'GPS: Online & Sharing' : 'GPS: Offline'}
                </button>
              </div>

              {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                  <Bike className="mx-auto text-slate-300 mb-4" size={56} />
                  <p className="text-slate-550 font-bold text-lg font-headings">All Quiet on the Delivery Front!</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">There are no pending delivery requests right now. Vendors will request when orders are ready.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').map((order) => (
                    <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-sm">
                      {/* Job Header */}
                      <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <div className="text-xs font-medium">
                            <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Ready At</p>
                            <p className="text-slate-700 font-bold">{new Date(order.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <div className="text-xs font-medium">
                            <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order Total</p>
                            <p className="text-emerald-600 font-extrabold">₹{parseFloat(order.total).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAcceptJob(order.id)}
                            disabled={!viewedMaps[order.id]}
                            className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98] ${viewedMaps[order.id]
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                              }`}
                            title={viewedMaps[order.id] ? 'Accept Delivery Job' : 'Please view route map below first to accept'}
                          >
                            <Check size={14} /> Accept Delivery order
                          </button>
                        </div>
                      </div>

                      {/* Job details */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Vendor shop details */}
                          <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5 text-emerald-600 font-headings">
                              <Store size={16} /> Pickup From (Vendor)
                            </h4>
                            <p className="font-extrabold text-slate-700 text-sm">{order.items[0]?.vendor || 'Local Vendor'}</p>
                            <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                              {order.items[0]?.shopLocation || 'Shop Address Not Provided'}
                            </p>
                          </div>

                          {/* Customer address */}
                          <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5 text-blue-600 font-headings">
                              <MapPin size={16} /> Deliver To (Customer)
                            </h4>
                            <p className="font-extrabold text-slate-700 text-sm">{order.customerName}</p>
                            <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed line-clamp-2 font-body">
                              {order.address}
                            </p>
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs font-black text-slate-405 uppercase mb-2 tracking-wider font-headings">Package Items ({order.items.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="bg-slate-50 text-slate-650 text-xs px-3 py-1 rounded-full border border-slate-150 font-semibold font-body">
                                {item.name} x {item.quantity}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Route Map requirement */}
                        <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => setViewedMaps(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                            className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-3 px-4 rounded-xl border transition-all active:scale-[0.99] ${viewedMaps[order.id]
                              ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                              : 'bg-indigo-50/50 border-indigo-150 text-indigo-700 hover:bg-indigo-50 shadow-sm'
                              }`}
                          >
                            <Navigation size={14} className={viewedMaps[order.id] ? 'text-emerald-600' : 'text-indigo-650'} />
                            {viewedMaps[order.id] ? 'Hide Route Map' : 'View Route Map & Distance to Unlock Accept'}
                          </button>

                          {viewedMaps[order.id] && (
                            <div className="w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                              <OrderTrackingMap
                                vendorLocation={order.items[0]?.shopLocation}
                                vendorName={order.items[0]?.vendor}
                                deliveryAddress={order.address}
                                deliveryBoyLocation={null}
                                deliveryBoyName={null}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'delivery_active' && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 border border-amber-100/50">
                  <Navigation size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-headings text-slate-800">Active Delivery Job</h2>
                  <p className="text-xs text-slate-400 font-medium font-body">Real-time route tracking and delivery actions</p>
                </div>
              </div>

              {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                  <Navigation className="mx-auto text-slate-350 mb-4" size={56} />
                  <p className="text-slate-550 font-bold text-lg font-headings">No Active Deliveries</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">You don't have any active deliveries. Go to the "Available Jobs" tab to accept a job.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').map((order) => (
                    <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-sm">
                      {/* Active header */}
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Active Order ID</p>
                          <p className="font-extrabold tracking-tight text-sm font-mono uppercase">#{order.id.slice(-12)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsTrackingActive(!isTrackingActive)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all border active:scale-[0.98] ${isTrackingActive
                              ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white animate-pulse'
                              : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
                              }`}
                          >
                            <Power size={11} strokeWidth={2.5} />
                            {isTrackingActive ? 'GPS Sharing: ON' : 'GPS Sharing: OFF (Turn ON!)'}
                          </button>
                        </div>
                      </div>

                      {/* Active Info details */}
                      <div className="p-6 space-y-6">
                        {/* Alert when GPS is OFF */}
                        {!isTrackingActive && (
                          <div className="bg-amber-50/70 border border-amber-100/50 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
                            <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-bold text-amber-900 font-headings">GPS location sharing is offline</p>
                              <p className="mt-0.5 text-slate-500 leading-relaxed font-body">Please click the button above to enable GPS sharing so the customer and vendor can track your location lively on the map.</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Pickup Shop */}
                          <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-emerald-600 font-headings">
                                <Store size={16} /> 1. Pickup From
                              </h4>
                              <p className="font-extrabold text-slate-700 text-sm">{order.items[0]?.vendor}</p>
                              <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                {order.items[0]?.shopLocation || 'Shop location not set'}
                              </p>
                            </div>
                            {order.items[0]?.shopLocation && (
                              <a
                                href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.items[0].shopLocation)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200/50 hover:bg-emerald-50 py-2.5 rounded-xl transition-all font-headings"
                              >
                                <ExternalLink size={12} /> Get Pickup Directions
                              </a>
                            )}
                          </div>

                          {/* Delivery Address */}
                          <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-100 transition-all duration-300">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-blue-650 font-headings">
                                <MapPin size={16} /> 2. Deliver To
                              </h4>
                              <p className="font-extrabold text-slate-700 text-sm">{order.customerName}</p>
                              <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                {order.address}
                              </p>
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200/50 hover:bg-blue-50 py-2.5 rounded-xl transition-all font-headings"
                            >
                              <ExternalLink size={12} /> Get Delivery Directions
                            </a>
                          </div>
                        </div>

                        {/* Order Summary & Earn Info */}
                        <div className="bg-white/80 rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-headings">Order Total Value</p>
                            <p className="text-lg font-black text-slate-800 mt-0.5">₹{parseFloat(order.total).toFixed(2)}</p>
                          </div>
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-4 py-2 rounded-xl text-right">
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest font-headings">Est. Earnings</p>
                            <p className="text-lg font-black text-emerald-800 mt-0.5">₹40.00</p>
                          </div>
                        </div>

                        {/* Delivered Action */}
                        <button
                          onClick={() => handleMarkAsDelivered(order.id)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base font-headings"
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
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                  <Check size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-headings text-slate-800">Completed Deliveries</h2>
                  <p className="text-xs text-slate-400 font-medium font-body">Your historical delivery performance and earnings</p>
                </div>
              </div>

              {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                  <Check className="mx-auto text-slate-350 mb-4" size={56} />
                  <p className="text-slate-550 font-bold text-lg font-headings">No Completed Deliveries Yet</p>
                  <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">Your completed delivery jobs will appear here once you fulfill them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Earnings summary card */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/30 rounded-3xl p-6 flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Deliveries Fulfilled</h3>
                      <p className="text-3xl font-black text-emerald-900 mt-1">{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Earnings</h3>
                      <p className="text-3xl font-black text-emerald-900 mt-1">₹{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length * 40}.00</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').map((order) => (
                      <div key={order.id} className="bg-white/45 border border-slate-100 hover:border-emerald-100 hover:shadow-md p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 text-xs font-semibold transition-all duration-300">
                        <div>
                          <p className="text-slate-700 font-bold text-sm font-headings">Delivered to {order.customerName}</p>
                          <p className="text-slate-400 mt-0.5 font-medium font-body">Order ID: #{order.id.slice(-8).toUpperCase()} • {new Date(order.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border border-emerald-100/30 tracking-wider">Success</span>
                          <span className="text-emerald-600 font-black text-sm font-headings">₹40.00 Earned</span>
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

          {(isVendor && activeTab === 'farms') && (
            <div className="space-y-8 animate-fade-in text-left">
              {/* Header */}
              <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">My Farms</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">List your farm for weekend tours and manage bookings</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (showAddFarmForm || editingFarmId) {
                      handleCancelFarmForm();
                    } else {
                      setEditingFarmId(null);
                      setNewFarmForm({ farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free' });
                      setShowAddFarmForm(true);
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98]"
                >
                  {(showAddFarmForm || editingFarmId) ? <X size={14} /> : <Plus size={14} />}
                  {(showAddFarmForm || editingFarmId) ? 'Cancel' : 'Add New Farm'}
                </button>
              </div>

              {/* Add / Edit Farm Form */}
              {showAddFarmForm && (
                <form onSubmit={handleSaveFarmForm} className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6 max-w-5xl animate-fade-in">
                  <h3 className="text-base font-bold text-slate-855 font-headings text-left">
                    {editingFarmId ? 'Edit Farm Details' : 'Farm Details'}
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Form Fields */}
                    <div className="lg:col-span-7 space-y-4">

                      {/* Farm Name */}
                      <div className="text-left">
                        <label className={labelCls}>Farm Name</label>
                        <input
                          required
                          type="text"
                          value={newFarmForm.farmName}
                          onChange={(e) => setNewFarmForm({ ...newFarmForm, farmName: e.target.value })}
                          className={inputCls.replace('pl-10', 'px-4')}
                          placeholder="E.g. Strawberry Paradise"
                        />
                      </div>

                      {/* Location Field with Buttons */}
                      <div className="text-left">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={labelCls}>Location Address <span className="text-emerald-600 font-bold">*</span></label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={detectingFarmLocation}
                              onClick={handleDetectFarmLocation}
                              className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-100 transition-all flex items-center gap-1 active:scale-95"
                              title="Get current location"
                            >
                              <Navigation size={10} className={detectingFarmLocation ? 'animate-spin' : ''} />
                              {detectingFarmLocation ? 'Detecting...' : 'Use GPS'}
                            </button>
                            <button
                              type="button"
                              onClick={handleLocateFarmAddress}
                              className="bg-slate-700 hover:bg-slate-850 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                              title="Pin typed address on map"
                            >
                              <MapPin size={10} />
                              Locate
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            required
                            type="text"
                            value={newFarmForm.location}
                            onChange={(e) => setNewFarmForm({ ...newFarmForm, location: e.target.value })}
                            className={inputCls}
                            placeholder="E.g. Mahabaleshwar, Maharashtra"
                          />
                        </div>
                      </div>

                      {/* Admission Entry Type (Free vs Payable) */}
                      <div className="text-left space-y-2">
                        <label className={labelCls}>Admission Entry Type <span className="text-emerald-600 font-bold">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setNewFarmForm(prev => ({ ...prev, costType: 'free', costPerPerson: '0' }))}
                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${(newFarmForm.costType === 'free' || newFarmForm.costPerPerson === '0')
                              ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                🆓
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">Free of Cost</p>
                                <p className="text-[10px] text-slate-400 font-medium">Free open tour (₹0)</p>
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNewFarmForm(prev => ({ ...prev, costType: 'payable', costPerPerson: (newFarmForm.costPerPerson === '0' || !newFarmForm.costPerPerson) ? '250' : newFarmForm.costPerPerson }))}
                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${(newFarmForm.costType === 'payable' || (Number(newFarmForm.costPerPerson) > 0 && newFarmForm.costType !== 'free'))
                              ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/10'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                💳
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800">Payable Visit</p>
                                <p className="text-[10px] text-slate-400 font-medium">Ticket fee per guest</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Cost Input (Shown if Payable selected) */}
                        <div className="text-left">
                          <label className={labelCls}>Admission Fee per Visitor (₹)</label>
                          {newFarmForm.costType === 'free' || newFarmForm.costPerPerson === '0' ? (
                            <div className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                              <span>✨ Free Admission (₹0 Entry Fee)</span>
                            </div>
                          ) : (
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                              <input
                                required
                                type="number"
                                min="1"
                                value={newFarmForm.costPerPerson}
                                onChange={(e) => setNewFarmForm({ ...newFarmForm, costPerPerson: e.target.value })}
                                className={inputCls.replace('pl-10', 'pl-7 pr-4')}
                                placeholder="E.g. 250"
                              />
                            </div>
                          )}
                        </div>

                        {/* Photo URL */}
                        <div className="text-left">
                          <label className={labelCls}>Farm Photo URL</label>
                          <input
                            type="text"
                            value={newFarmForm.image}
                            onChange={(e) => setNewFarmForm({ ...newFarmForm, image: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-4')}
                            placeholder="https://images.unsplash.com/photo-..."
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="text-left">
                        <label className={labelCls}>Description</label>
                        <textarea
                          required
                          rows="3"
                          value={newFarmForm.description}
                          onChange={(e) => setNewFarmForm({ ...newFarmForm, description: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-xs transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none font-body"
                          placeholder="Describe the experience visitors can expect (activities, snacks, views)..."
                        ></textarea>
                      </div>

                      {/* Additional Farm Offerings & Availabilities Section */}
                      <div className="border-t border-slate-100 pt-4 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-headings">
                          🌿 Farm Page Features & Availabilities
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Crops Grown */}
                          <div>
                            <label className={labelCls}>🌾 Crops & Produce Grown</label>
                            <input
                              type="text"
                              value={newFarmForm.crops || ''}
                              onChange={(e) => setNewFarmForm({ ...newFarmForm, crops: e.target.value })}
                              className={inputCls.replace('pl-10', 'px-3.5')}
                              placeholder="E.g. Strawberries, Cherry Tomatoes, Sweet Corn"
                            />
                          </div>

                          {/* Fruit Orchards */}
                          <div>
                            <label className={labelCls}>🍎 Fruit Orchards & Trees</label>
                            <input
                              type="text"
                              value={newFarmForm.fruits || ''}
                              onChange={(e) => setNewFarmForm({ ...newFarmForm, fruits: e.target.value })}
                              className={inputCls.replace('pl-10', 'px-3.5')}
                              placeholder="E.g. Mango Orchards, Guava Groves, Papaya"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Livestock */}
                          <div>
                            <label className={labelCls}>🐄 Livestock & Poultry</label>
                            <input
                              type="text"
                              value={newFarmForm.livestock || ''}
                              onChange={(e) => setNewFarmForm({ ...newFarmForm, livestock: e.target.value })}
                              className={inputCls.replace('pl-10', 'px-3.5')}
                              placeholder="E.g. Pure Gir Cows, Goats & Sheep, Poultry"
                            />
                          </div>

                          {/* Accommodations */}
                          <div>
                            <label className={labelCls}>🛖 Accommodations Provided</label>
                            <input
                              type="text"
                              value={newFarmForm.accommodations || ''}
                              onChange={(e) => setNewFarmForm({ ...newFarmForm, accommodations: e.target.value })}
                              className={inputCls.replace('pl-10', 'px-3.5')}
                              placeholder="E.g. Farmhouse Rooms, Mud Huts, Camping Tents"
                            />
                          </div>
                        </div>

                        {/* Amenities & Activities */}
                        <div>
                          <label className={labelCls}>🚜 Activities & Amenities</label>
                          <input
                            type="text"
                            value={newFarmForm.amenities || ''}
                            onChange={(e) => setNewFarmForm({ ...newFarmForm, amenities: e.target.value })}
                            className={inputCls.replace('pl-10', 'px-3.5')}
                            placeholder="E.g. Berry Picking, Guided Walk, Organic Breakfast, Tractor Ride"
                          />
                        </div>

                        {/* Farm Products For Sale */}
                        <div>
                          <label className={labelCls}>🧺 Direct Farm Products For Sale (1 per line)</label>
                          <textarea
                            rows="2"
                            value={newFarmForm.farmProducts || ''}
                            onChange={(e) => setNewFarmForm({ ...newFarmForm, farmProducts: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-xs transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none font-body"
                            placeholder={'Fresh Organic Strawberries (₹180)\nRaw Organic Honey Jar (₹290)\nPure Cow Ghee (₹650)'}
                          ></textarea>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Farm Interactive Map */}
                    <div className="lg:col-span-5 flex flex-col min-h-[250px] text-left">
                      <label className={labelCls}>Pin Farm Location on Map</label>
                      <div className="flex-grow bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner min-h-[250px] lg:min-h-0">
                        <div
                          ref={farmMapContainerRef}
                          className="absolute inset-0 z-10 w-full h-full"
                          style={{ minHeight: '250px' }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 pl-1 font-body">Drag the pin or click on the map to select your farm location address automatically.</p>
                    </div>

                  </div>

                  {/* Form Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelFarmForm}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingFarm}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center gap-1.5 font-headings"
                    >
                      {isSubmittingFarm
                        ? (editingFarmId ? 'Updating...' : 'Listing...')
                        : (editingFarmId ? 'Update Farm' : 'List Farm')}
                    </button>
                  </div>

                </form>
              )}

              {/* Farms List & Incoming Bookings */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* My Listed Farms */}
                <div className="xl:col-span-7 space-y-6">
                  <h3 className="text-base font-extrabold text-slate-800 font-headings pl-1">My Listed Farms</h3>
                  {vendorFarms.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
                      <Compass size={40} className="mx-auto text-slate-350 mb-3" />
                      <p className="text-slate-500 text-sm font-bold">No farms listed yet</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed font-body">List your first organic farm to allow customers to book visits.</p>
                      <button
                        onClick={() => setShowAddFarmForm(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        Add Farm Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {vendorFarms.map(farm => (
                        <div key={farm.id} className="bg-white/70 border border-white/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group min-h-[220px]">
                          {deletingFarmId === farm.id ? (
                            <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-3xl flex flex-col justify-between flex-1 animate-fade-in text-left">
                              <div>
                                <div className="flex items-center gap-2 text-rose-600 mb-1.5">
                                  <Trash2 size={18} />
                                  <h4 className="font-bold text-sm font-headings">Delete Farm?</h4>
                                </div>
                                <p className="text-xs text-rose-700 font-medium font-body leading-relaxed">
                                  Are you sure you want to delete <span className="font-bold text-rose-900">{farm.farmName}</span>? This action cannot be undone.
                                </p>
                              </div>
                              <div className="flex items-center gap-2 pt-4">
                                <button
                                  onClick={() => handleDeleteFarm(farm.id)}
                                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 font-headings"
                                >
                                  Yes, Delete
                                </button>
                                <button
                                  onClick={() => setDeletingFarmId(null)}
                                  className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 font-headings"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="relative h-36 bg-slate-50">
                                <img src={farm.image} alt={farm.farmName} className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditFarmClick(farm)}
                                    className="bg-white/95 text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors shadow-md border border-slate-100"
                                    title="Edit Farm Details"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingFarmId(farm.id)}
                                    className="bg-white/95 text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors shadow-md border border-slate-100"
                                    title="Delete Farm"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4 flex flex-col flex-1 space-y-2">
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{farm.farmName}</h4>
                                  <p className="text-[10px] text-slate-450 font-semibold flex items-center gap-1 font-body mt-0.5"><MapPin size={11} className="text-emerald-600" />{farm.location}</p>
                                </div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 italic font-body">"{farm.description}"</p>
                                <div className="border-t border-slate-100/60 pt-2.5 mt-auto flex justify-between items-center text-[10px]">
                                  <span className="text-slate-400 font-bold uppercase tracking-wider font-headings font-mono">TICKET TYPE</span>
                                  {(!farm.costPerPerson || Number(farm.costPerPerson) === 0) ? (
                                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">FREE OF COST</span>
                                  ) : (
                                    <span className="font-black text-slate-800 text-xs">₹{farm.costPerPerson} / guest</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const slug = farm.farmName
                                      ? farm.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                      : farm.id;
                                    navigate(`/farm/${slug}`);
                                  }}
                                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 font-headings border border-emerald-200/60 mt-1"
                                >
                                  <Compass size={12} /> Explore Farm Page
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Incoming Bookings */}
                <div className="xl:col-span-5 space-y-6">
                  <h3 className="text-base font-extrabold text-slate-800 font-headings pl-1">Incoming Farm Visits</h3>
                  <div className="bg-white/70 border border-white/60 p-5 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                    {incomingFarmBookings.length === 0 ? (
                      <div className="py-12 text-center">
                        <Calendar size={36} className="mx-auto text-slate-350 mb-3" />
                        <p className="text-slate-550 font-bold text-xs">No scheduled visits</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed font-body">As soon as customers book slot dates, their visit schedules will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {incomingFarmBookings.map(booking => (
                          <div key={booking.id} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col space-y-3 shadow-inner hover:bg-white hover:border-emerald-100 transition-all duration-300">
                            <div className="flex justify-between items-start gap-1">
                              <div className="min-w-0 text-left">
                                <h4 className="font-extrabold text-slate-800 text-xs truncate font-headings">{booking.customerName}</h4>
                                <p className="text-[10px] text-slate-450 truncate font-body mt-0.5">{booking.customerEmail}</p>
                              </div>

                              {booking.status === 'confirmed' ? (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0">
                                  <CheckCircle size={9} /> confirmed
                                </span>
                              ) : booking.status === 'rejected' ? (
                                <span className="bg-rose-50 text-rose-800 border border-rose-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0">
                                  <X size={9} /> declined
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0 animate-pulse">
                                  <Clock size={9} /> pending
                                </span>
                              )}
                            </div>

                            <div className="border-t border-slate-100/60 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-550">
                              <span className="flex items-center gap-1"><Calendar size={11} className="text-emerald-600" />{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              <span className="flex items-center gap-1"><Users size={11} className="text-emerald-600" />{booking.visitorsCount} guest{booking.visitorsCount !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="text-[9px] text-slate-450 font-extrabold tracking-wide uppercase truncate pt-1 border-t border-slate-100/30 text-left">
                              Farm: {booking.farmName}
                            </div>

                            {/* Accept / Decline Action Buttons for Owner */}
                            {(!booking.status || booking.status === 'pending') && (
                              <div className="flex gap-2 pt-2 border-t border-slate-100/30">
                                <button
                                  onClick={() => handleAcceptBooking(booking.id)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-xl transition-all shadow-sm active:scale-95 text-center"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineBooking(booking.id)}
                                  className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-705 font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-xl transition-all active:scale-95 text-center"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {(isVendor && activeTab === 'setup') && (
            <>
              {/* ── Vendor: No Shop Yet ──────────────────────────────────────────────── */}
              {vendorShops.length === 0 && (
                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] max-w-xl mx-auto mt-8 animate-fade-in">
                  <div className="text-center mb-6">
                    <div className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 p-4 rounded-3xl inline-block mb-4">
                      <Store size={36} />
                    </div>
                    <h2 className="text-2xl font-bold font-headings text-slate-800">Set Up Your Shop</h2>
                    <p className="text-xs text-slate-400 font-medium font-body mt-1">Add your shop name so you can start adding products.</p>
                  </div>
                  <form onSubmit={handleShopSetup} className="space-y-4">
                    <div>
                      <label className={labelCls}>Shop Name</label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({ ...shopSetup, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Shop Location <span className="text-emerald-600 font-bold">*</span></label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="text" value={shopSetup.location} onChange={(e) => setShopSetup({ ...shopSetup, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                        <button
                          type="button"
                          onClick={() => handleGetCurrentLocation(setShopSetup, shopSetup)}
                          disabled={detectingShopLocation}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                        >
                          {detectingShopLocation ? (
                            <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Navigation size={11} />
                          )}
                          {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                        </button>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-1.5 flex items-start gap-1 font-body">
                        <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address (area + city + state) — this is shown to customers on Google Maps when they track their delivery.
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>GST Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="text" value={shopSetup.gstNumber} onChange={(e) => setShopSetup({ ...shopSetup, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Shop Photo URL</label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" value={shopSetup.image} onChange={(e) => setShopSetup({ ...shopSetup, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/photo-..." />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98] font-headings shadow-md shadow-emerald-900/10"
                    >
                      Complete Setup
                    </button>
                  </form>
                </div>
              )}

              {/* ── Vendor: Has Shops ────────────────────────────────────────────────── */}
              {userProfile?.role === 'vendor' && activeTab === 'setup' && vendorShops.length > 0 && (
                <div className="mt-8">
                  {viewingShopIndex !== null ? (
                    /* ── Shop Detail Page View ── */
                    (() => {
                      const shop = vendorShops[viewingShopIndex];
                      if (!shop) return null;

                      return (
                        <div className="space-y-8 animate-fade-in">
                          {/* Back button */}
                          <button
                            onClick={() => {
                              setViewingShopIndex(null);
                              setSelectedShopFilter(null);
                            }}
                            className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors font-headings"
                          >
                            <ArrowLeft size={16} /> Back to My Shops
                          </button>

                          {/* Shop Details Header Card */}
                          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/[0.02]">
                            {/* Banner Image */}
                            <div className="h-56 w-full bg-gradient-to-r from-emerald-800 to-teal-950 relative flex items-center justify-center">
                              {shop.image ? (
                                <img src={shop.image} alt={shop.shopName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-white text-center">
                                  <Store size={48} className="mx-auto mb-2 opacity-80" />
                                  <p className="text-sm font-semibold tracking-wider uppercase opacity-80 font-headings">Fresh Produce Store</p>
                                </div>
                              )}
                              {/* Edit Button Overlay */}
                              <button
                                onClick={() => handleEditShopClick(shop, viewingShopIndex)}
                                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 font-headings"
                              >
                                <Pencil size={12} /> Edit Shop / Photo
                              </button>
                            </div>

                            {/* Shop details */}
                            <div className="p-6 md:p-8">
                              {editingShopIndex === viewingShopIndex ? (
                                /* Editing form inside detail page */
                                <form onSubmit={handleUpdateShop} className="space-y-4 max-w-xl">
                                  <h3 className="text-lg font-bold text-slate-800 mb-2 font-headings">Edit Shop Details</h3>
                                  <div>
                                    <label className={labelCls}>Shop Name</label>
                                    <div className="relative">
                                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelCls}>Location <span className="text-emerald-600 font-bold">*</span></label>
                                    <div className="relative">
                                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} />
                                      <button
                                        type="button"
                                        onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                        disabled={detectingShopLocation}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                      >
                                        {detectingShopLocation ? (
                                          <span className="w-2.5 h-2.5 border-2 border-emerald-650 border-t-transparent rounded-full animate-spin"></span>
                                        ) : (
                                          <Navigation size={10} />
                                        )}
                                        {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelCls}>GST Number</label>
                                    <div className="relative">
                                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                    </div>
                                  </div>
                                  <div>
                                    <label className={labelCls}>Shop Photo URL</label>
                                    <div className="relative">
                                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input type="text" value={editShopForm.image} onChange={(e) => setEditShopForm({ ...editShopForm, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/..." />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10"><Check size={14} /> Save Changes</button>
                                    <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-100 text-slate-650 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                  </div>
                                </form>
                              ) : deletingShopIndex === viewingShopIndex ? (
                                /* Delete Shop Confirmation block */
                                <div className="py-6 flex flex-col items-center justify-center text-center gap-2 max-w-md mx-auto">
                                  <Trash2 className="text-red-500 animate-bounce" size={32} />
                                  <h3 className="text-lg font-bold text-slate-800 font-headings">Delete {shop.shopName}?</h3>
                                  <p className="text-sm text-slate-400 font-medium font-body leading-relaxed">Deleting this shop will permanently remove it and all of its associated products. This action cannot be undone.</p>
                                  <div className="flex gap-3 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteShop(viewingShopIndex);
                                        setViewingShopIndex(null);
                                        setSelectedShopFilter(null);
                                      }}
                                      className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10"
                                    >
                                      Yes, Delete Shop
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingShopIndex(null)}
                                      className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Display Shop details */
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="space-y-4">
                                    <h2 className="text-3xl font-black text-slate-850 font-headings">{shop.shopName}</h2>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium font-body">
                                      <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-600" />{shop.location || 'No location set'}</span>
                                      <span className="flex items-center gap-1.5"><FileText size={16} className="text-slate-400" />GST: {shop.gstNumber}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setDeletingShopIndex(viewingShopIndex)}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl transition-all border border-rose-100/50"
                                      title="Delete Shop"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* My Shops panel */
                    <div className="mb-8 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 w-full">
                          <h2 className="text-2xl font-bold text-slate-800 mb-4 font-headings">My Shops ({vendorShops.length})</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {vendorShops.map((shop, i) => (
                              <div key={i} className="bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">
                                {editingShopIndex === i ? (
                                  /* ── Inline Edit Shop Form ── */
                                  <form onSubmit={handleUpdateShop} className="space-y-3">
                                    <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2 font-headings">Editing Shop</p>
                                    <div>
                                      <label className={labelCls}>Shop Name</label>
                                      <div className="relative">
                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className={labelCls}>Location <span className="text-emerald-650 font-bold">*</span></label>
                                      <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                        <button
                                          type="button"
                                          onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                          disabled={detectingShopLocation}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                        >
                                          {detectingShopLocation ? (
                                            <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                          ) : (
                                            <Navigation size={10} />
                                          )}
                                          {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                        </button>
                                      </div>
                                      <p className="text-[10px] text-emerald-600 mt-1 flex items-start gap-1 font-body leading-relaxed">
                                        <Navigation size={10} className="mt-0.5 flex-shrink-0" /> Enter your full address so customers can see your shop on Google Maps when tracking orders.
                                      </p>
                                    </div>
                                    <div>
                                      <label className={labelCls}>GST Number</label>
                                      <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className={labelCls}>Shop Photo URL</label>
                                      <div className="relative">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input type="text" value={editShopForm.image} onChange={(e) => setEditShopForm({ ...editShopForm, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/..." />
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <button type="submit" className="flex items-center gap-1 bg-emerald-650 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all"><Check size={14} /> Save</button>
                                      <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-105 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                    </div>
                                  </form>
                                ) : deletingShopIndex === i ? (
                                  /* ── Delete Confirmation ── */
                                  <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                    <Trash2 className="text-red-500 animate-bounce" size={24} />
                                    <p className="text-sm font-bold text-slate-800 font-headings">Delete {shop.shopName}?</p>
                                    <p className="text-[10px] text-slate-400 font-body">Deleting this shop will also hide its products. This cannot be undone.</p>
                                    <div className="flex gap-2 mt-2">
                                      <button type="button" onClick={() => handleDeleteShop(i)} className="bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10">Yes, Delete</button>
                                      <button type="button" onClick={() => setDeletingShopIndex(null)} className="bg-slate-100 text-slate-650 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                    </div>
                                  </div>
                                ) : (
                                  /* ── Shop Card View ── */
                                  <>
                                    {/* Shop Header */}
                                    <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100/30">
                                          <Store size={14} className="text-emerald-600" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 font-headings">{shop.shopName}</h3>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => handleEditShopClick(shop, i)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50" title="Edit Shop">
                                          <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setDeletingShopIndex(i)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50" title="Delete Shop">
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Location row */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                      <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0 font-body">
                                        <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                                        <span className="truncate font-semibold">{shop.location || <span className="text-red-400 italic">No location set</span>}</span>
                                      </div>
                                      {shop.location && (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 border border-emerald-250 px-2 py-1 rounded-lg hover:bg-emerald-50/50 transition-colors flex-shrink-0 font-headings"
                                        >
                                          <ExternalLink size={11} /> Maps
                                        </a>
                                      )}
                                    </div>

                                    {/* Google Maps Embed Preview */}
                                    {shop.location ? (
                                      <div className="rounded-2xl overflow-hidden border border-slate-150 shadow-inner mb-3" style={{ height: '160px' }}>
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
                                      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-150 bg-rose-50/30 mb-3 py-5 px-3 text-center">
                                        <Navigation size={22} className="text-rose-300 mb-1" />
                                        <p className="text-xs font-bold text-rose-500 font-headings">Shop location not set</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-body">Click the pencil icon to add your location so customers can track their orders.</p>
                                      </div>
                                    )}

                                    {/* GST */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 border-b border-slate-100 pb-3 font-body">
                                      <FileText size={12} />
                                      <span>GST: {shop.gstNumber}</span>
                                    </div>

                                    {/* View Shop Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingShopIndex(i);
                                        setSelectedShopFilter(shop.shopName);
                                      }}
                                      className="w-full mt-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] font-headings"
                                    >
                                      <Store size={12} /> View Shop
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Add Shop button */}
                      <button
                        type="button"
                        onClick={() => setShowAddShopForm(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 active:scale-[0.98] font-headings mt-6"
                      >
                        <Plus size={20} />
                        Add Shop
                      </button>
                    </div>
                  )}



                  {/* ── Add New Shop Form Modal ────────────────────────────────────────── */}
                  {showAddShopForm && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                      onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                    >
                      <div
                        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <form onSubmit={handleAddAdditionalShop} className="flex flex-col h-full overflow-hidden">

                          {/* Modal Header */}
                          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                            <div className="flex items-center gap-2.5">
                              <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-605 border border-emerald-100 animate-pulse">
                                <Plus size={20} />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Shop</h2>
                                <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Register a new shop branch to showcase your products</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Modal Body */}
                          <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div>
                              <label className={labelCls}>Shop Name</label>
                              <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input required type="text" value={newShop.shopName} onChange={(e) => setNewShop({ ...newShop, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Shop Location <span className="text-emerald-605 font-bold">*</span></label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input required type="text" value={newShop.location} onChange={(e) => setNewShop({ ...newShop, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                <button
                                  type="button"
                                  onClick={() => handleGetCurrentLocation(setNewShop, newShop)}
                                  disabled={detectingShopLocation}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                                >
                                  {detectingShopLocation ? (
                                    <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <Navigation size={12} />
                                  )}
                                  {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                </button>
                              </div>
                              <p className="text-[10px] text-emerald-650 mt-1.5 flex items-start gap-1 font-body">
                                <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address — customers see this on Google Maps when tracking their order.
                              </p>
                            </div>
                            <div>
                              <label className={labelCls}>GST Number</label>
                              <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input required type="text" value={newShop.gstNumber} onChange={(e) => setNewShop({ ...newShop, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Shop Photo URL</label>
                              <div className="relative">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input type="text" value={newShop.image} onChange={(e) => setNewShop({ ...newShop, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/photo-..." />
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
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
                          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                            <div className="flex items-center gap-2.5">
                              <div className="bg-emerald-55 p-2.5 rounded-2xl text-emerald-600 border border-emerald-100/50 animate-pulse">
                                <Plus size={20} />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Product</h2>
                                <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Fill in the details to publish a new product in the marketplace</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="text-slate-400 hover:text-slate-650 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Modal Body (Scrollable) */}
                          <div className="overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-8 flex-1">
                            {/* Section: Basic Info */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <Package size={16} /> Basic Information
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="md:col-span-2 lg:col-span-3">
                                  <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className={inputCls} placeholder="E.g. Organic Red Tomatoes" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <select
                                      required
                                      name="shop"
                                      value={newProduct.shop}
                                      onChange={handleInputChange}
                                      disabled={!!selectedShopFilter}
                                      className={`${inputCls} appearance-none bg-white font-medium`}
                                    >
                                      <option value="">Select a shop...</option>
                                      {vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <select required name="category" value={newProduct.category} onChange={handleInputChange} className={`${inputCls} appearance-none bg-white font-medium`}>
                                      <option value="">Select category...</option>
                                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input type="number" step="0.01" name="mrp" value={newProduct.mrp} onChange={handleInputChange} className={inputCls} placeholder="6.50" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input required type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} className={inputCls} placeholder="4.99" />
                                  </div>
                                </div>
                                <div>
                                  <label className={labelCls}>Net Weight (e.g. 500g)</label>
                                  <input type="text" name="netWeight" value={newProduct.netWeight} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="500g" />
                                </div>
                                <div>
                                  <label className={labelCls}>Unit (e.g. kg, box) <span className="text-emerald-600 font-bold">*</span></label>
                                  <select
                                    required
                                    name="unit"
                                    value={newProduct.unit}
                                    onChange={handleInputChange}
                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                  >
                                    <option value="kg">KG</option>
                                    <option value="BOX">BOX</option>
                                    <option value="Packet">Packet</option>
                                    <option value="litre">litre</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelCls}>Available Stock / Inventory (Units / kg)</label>
                                  <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input type="number" name="stockQuantity" value={newProduct.stockQuantity} onChange={handleInputChange} className={inputCls} placeholder="E.g. 1000" />
                                  </div>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <label className={labelCls}>Image URL <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input required type="text" name="image" value={newProduct.image} onChange={handleInputChange} className={inputCls} placeholder="https://example.com/image.jpg" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section: Product Specifications */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <Check size={16} /> Product Specifications & Freshness
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className={labelCls}>Food Preference</label>
                                  <select name="preference" value={newProduct.preference} onChange={handleInputChange} className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}>
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
                                <div>
                                  <label className={labelCls}>Harvest / Freshness Date</label>
                                  <input type="text" name="harvestDate" value={newProduct.harvestDate} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Harvested Today" />
                                </div>
                                <div>
                                  <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                  <input type="text" name="organicCert" value={newProduct.organicCert} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="FSSAI-1002930492" />
                                </div>
                                <div>
                                  <label className={labelCls}>Storage & Handling Info</label>
                                  <input type="text" name="storageInfo" value={newProduct.storageInfo} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Keep refrigerated at 4°C" />
                                </div>
                              </div>
                            </div>

                            {/* Section: Details & Lists */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <FileText size={16} /> Details & Descriptions
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className={labelCls}>Description</label>
                                  <textarea name="description" value={newProduct.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Detailed description of the product..."></textarea>
                                </div>
                                <div>
                                  <label className={labelCls}>Features & Details (one per line)</label>
                                  <textarea name="features" value={newProduct.features} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"></textarea>
                                </div>
                                <div>
                                  <label className={labelCls}>Available Offers (one per line)</label>
                                  <textarea name="offers" value={newProduct.offers} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"></textarea>
                                </div>
                              </div>
                            </div>

                            {/* Section: Policies */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <RefreshCw size={16} /> Policies
                              </h3>
                              <div>
                                <label className={labelCls}>Return Policy</label>
                                <textarea name="returnPolicy" value={newProduct.returnPolicy} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Returnable within 24 hours if damaged..."></textarea>
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="px-5 py-2.5 rounded-xl border border-slate-205 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings"
                            >
                              Save Product to Marketplace
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* ── Edit Product Popup Modal ────────────────────────────────────── */}
                  {editingProductId && (
                    <div 
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 overflow-y-auto"
                      onClick={() => setEditingProductId(null)}
                    >
                      <div 
                        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-auto flex flex-col transform transition-all scale-100 duration-300 border border-slate-100 relative text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                              <Pencil size={20} />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold font-headings text-slate-800">Edit Product</h2>
                              <p className="text-xs text-slate-400 font-medium font-body">Modify details, pricing, inventory & specifications for {editProductForm.name}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdateProduct} className="flex flex-col flex-1 overflow-hidden">
                          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                            
                            {/* Section: Basic Information */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <Package size={16} /> Basic Information
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* 1. Product Name * */}
                                <div className="md:col-span-2 lg:col-span-3">
                                  <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input
                                      required
                                      type="text"
                                      name="name"
                                      value={editProductForm.name}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                                      className={inputCls}
                                      placeholder="E.g. Organic Red Tomatoes"
                                    />
                                  </div>
                                </div>

                                {/* 2. Which Shop? * */}
                                <div>
                                  <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <select
                                      required
                                      name="shop"
                                      value={editProductForm.shop}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, shop: e.target.value })}
                                      className={`${inputCls} appearance-none bg-white font-medium`}
                                    >
                                      <option value="">Select a shop...</option>
                                      {vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {/* 3. Category * */}
                                <div>
                                  <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <select
                                      required
                                      name="category"
                                      value={editProductForm.category}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                                      className={`${inputCls} appearance-none bg-white font-medium`}
                                    >
                                      <option value="">Select category...</option>
                                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                </div>

                                {/* 4. M.R.P. / Original Price (₹) */}
                                <div>
                                  <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input
                                      type="number"
                                      step="0.01"
                                      name="mrp"
                                      value={editProductForm.mrp}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, mrp: e.target.value })}
                                      className={inputCls}
                                      placeholder="6.50"
                                    />
                                  </div>
                                </div>

                                {/* 5. Selling Price (₹) * */}
                                <div>
                                  <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input
                                      required
                                      type="number"
                                      step="0.01"
                                      name="price"
                                      value={editProductForm.price}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                                      className={inputCls}
                                      placeholder="4.99"
                                    />
                                  </div>
                                </div>

                                {/* 6. Net Weight (e.g. 500g) */}
                                <div>
                                  <label className={labelCls}>Net Weight (e.g. 500g)</label>
                                  <input
                                    type="text"
                                    name="netWeight"
                                    value={editProductForm.netWeight}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, netWeight: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="500g"
                                  />
                                </div>

                                {/* 7. Unit (e.g. kg, box) * (Dropdown) */}
                                <div>
                                  <label className={labelCls}>Unit (e.g. kg, box) <span className="text-emerald-600 font-bold">*</span></label>
                                  <select
                                    required
                                    name="unit"
                                    value={editProductForm.unit}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, unit: e.target.value })}
                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                  >
                                    <option value="kg">KG</option>
                                    <option value="BOX">BOX</option>
                                    <option value="Packet">Packet</option>
                                    <option value="litre">litre</option>
                                  </select>
                                </div>

                                {/* 8. Available Stock / Inventory (Units / kg) */}
                                <div>
                                  <label className={labelCls}>Available Stock / Inventory (Units / kg)</label>
                                  <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input
                                      type="number"
                                      name="stockQuantity"
                                      value={editProductForm.stockQuantity}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, stockQuantity: e.target.value })}
                                      className={inputCls}
                                      placeholder="E.g. 1000"
                                    />
                                  </div>
                                </div>

                                {/* 9. Image URL * */}
                                <div className="md:col-span-2 lg:col-span-3">
                                  <label className={labelCls}>Image URL <span className="text-emerald-600 font-bold">*</span></label>
                                  <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                    <input
                                      required
                                      type="text"
                                      name="image"
                                      value={editProductForm.image}
                                      onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value })}
                                      className={inputCls}
                                      placeholder="https://example.com/image.jpg"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section: Product Specifications */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <Check size={16} /> Product Specifications & Freshness
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                  <label className={labelCls}>Food Preference</label>
                                  <select
                                    name="preference"
                                    value={editProductForm.preference}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, preference: e.target.value })}
                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                  >
                                    <option value="Vegetarian">Vegetarian</option>
                                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                                    <option value="Vegan">Vegan</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={labelCls}>Country of Origin</label>
                                  <input
                                    type="text"
                                    name="origin"
                                    value={editProductForm.origin}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, origin: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="India"
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Max Shelf Life</label>
                                  <input
                                    type="text"
                                    name="shelfLife"
                                    value={editProductForm.shelfLife}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, shelfLife: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="7 days"
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Harvest / Freshness Date</label>
                                  <input
                                    type="text"
                                    name="harvestDate"
                                    value={editProductForm.harvestDate}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, harvestDate: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="Harvested Today"
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                  <input
                                    type="text"
                                    name="organicCert"
                                    value={editProductForm.organicCert}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, organicCert: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="FSSAI-1002930492"
                                  />
                                </div>
                                <div>
                                  <label className={labelCls}>Storage & Handling Info</label>
                                  <input
                                    type="text"
                                    name="storageInfo"
                                    value={editProductForm.storageInfo}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, storageInfo: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="Keep refrigerated at 4°C"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section: Details & Lists */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <FileText size={16} /> Details & Descriptions
                              </h3>
                              <div className="space-y-4">
                                <div>
                                  <label className={labelCls}>Description</label>
                                  <textarea
                                    name="description"
                                    value={editProductForm.description}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                    placeholder="Detailed description of the product..."
                                  ></textarea>
                                </div>
                                <div>
                                  <label className={labelCls}>Features & Details (one per line)</label>
                                  <textarea
                                    name="features"
                                    value={editProductForm.features}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, features: e.target.value })}
                                    rows="3"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                    placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"
                                  ></textarea>
                                </div>
                                <div>
                                  <label className={labelCls}>Available Offers (one per line)</label>
                                  <textarea
                                    name="offers"
                                    value={editProductForm.offers}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, offers: e.target.value })}
                                    rows="2"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                    placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"
                                  ></textarea>
                                </div>
                              </div>
                            </div>

                            {/* Section: Policies */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                <RefreshCw size={16} /> Policies
                              </h3>
                              <div>
                                <label className={labelCls}>Return Policy</label>
                                <textarea
                                  name="returnPolicy"
                                  value={editProductForm.returnPolicy}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, returnPolicy: e.target.value })}
                                  rows="2"
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                  placeholder="Returnable within 24 hours if damaged..."
                                ></textarea>
                              </div>
                            </div>

                          </div>

                          {/* Modal Footer */}
                          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingProductId(null)}
                              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings"
                            >
                              Update Product Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* ── Your Products ─────────────────────────────────────────────────── */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <h2 className="text-xl font-bold font-headings text-slate-800">
                        {selectedShopFilter ? `Products at ${selectedShopFilter}` : 'Your Products'} ({vendorProducts.length})
                      </h2>
                      {selectedShopFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedShopFilter(null)}
                          className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all self-start shadow-sm active:scale-[0.98] font-headings"
                        >
                          <X size={12} /> Show All Shops
                        </button>
                      )}
                    </div>
                    {vendorProducts.length === 0 ? (
                      <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                        <Package className="mx-auto text-slate-350 mb-4" size={48} />
                        <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No products yet</h3>
                        <p className="text-sm text-slate-550 font-body">Get started by adding your first product to your shop.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {vendorProducts.map(product => (
                          <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">

                            {deletingProductId === product.id ? (
                              /* ── Delete Confirmation ── */
                              <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                                <Trash2 className="text-rose-500 animate-bounce" size={32} />
                                <p className="text-sm font-bold text-slate-800 font-headings">Delete <span className="text-emerald-600">{product.name}</span>?</p>
                                <p className="text-xs text-slate-405 font-body">This cannot be undone.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDeleteProduct(product.id)} className="bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10">Yes, Delete</button>
                                  <button onClick={() => setDeletingProductId(null)} className="bg-slate-100 text-slate-655 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              /* ── Normal Product Card ── */
                              <>
                                <div className="h-44 overflow-hidden bg-slate-50 flex items-center justify-center relative group">
                                  {product.image
                                    ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <ImageIcon className="text-slate-300" size={48} />
                                  }
                                  {/* Action buttons overlay */}
                                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-305">
                                    <button
                                      onClick={() => handleEditProductClick(product)}
                                      className="bg-white/90 backdrop-blur-sm text-emerald-600 hover:bg-emerald-650 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors"
                                      title="Edit Product"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      onClick={() => setDeletingProductId(product.id)}
                                      className="bg-white/90 backdrop-blur-sm text-rose-550 hover:bg-rose-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors"
                                      title="Delete Product"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                <div className="p-4">
                                  <div className="text-[10px] font-black text-emerald-650 mb-1.5 uppercase tracking-wider font-headings">{product.category}</div>
                                  <h3 className="font-bold text-slate-800 mb-1 truncate font-headings text-sm">{product.name}</h3>
                                  <div className="flex items-center justify-between mt-3">
                                    <div className="font-extrabold text-slate-900 text-base font-body">₹{parseFloat(product.price).toFixed(2)}</div>
                                    <div className="bg-slate-50 text-slate-405 px-2.5 py-1 rounded-full text-[10px] font-semibold truncate max-w-[120px] flex items-center gap-1 border border-slate-100 font-body">
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
