import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Trash2, MapPin, PlusCircle, CheckCircle2, Pencil, Navigation, RefreshCw, Loader, X } from 'lucide-react';

export default function Cart() {
  const { cartItems, setAddress, removeFromCart, updateQuantity, getTotal } = useCart();
  const { user, userProfile, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect guest users to login
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?redirect=cart');
    }
  }, [user, loading, navigate]);
  
  const savedAddresses = userProfile?.addresses || [];
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [errors, setErrors] = useState({});

  const [cartMapCoords, setCartMapCoords] = useState(null);
  const cartMapContainerRef = React.useRef(null);
  const cartMapRef = React.useRef(null);
  const cartMarkerRef = React.useRef(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

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
    const { street, city, state, zipCode, country } = addressForm;
    const queryParts = [street, city, state, zipCode, country].filter(part => part && part.trim() !== '');
    if (queryParts.length === 0) {
      alert("Please fill in some address details first.");
      return;
    }
    const queryStr = queryParts.join(', ');
    const coords = await geocodeAddress(queryStr);
    if (coords) {
      const newCoords = { lat: coords.lat, lng: coords.lon };
      setCartMapCoords(newCoords);
      // Automatically reverse geocode to get precise details (like door number) for this coordinate!
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setAddressForm);
    } else {
      alert("Could not locate the typed address on the map. Try checking the spelling.");
    }
  };

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
            
            setAddressForm(prev => ({
              ...prev,
              street,
              city,
              state,
              zipCode,
              country
            }));
            setCartMapCoords({ lat: latitude, lng: longitude });
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

  useEffect(() => {
    if (!showNewAddressForm || !window.L || !cartMapContainerRef.current) {
      if (cartMapRef.current) {
        cartMapRef.current.remove();
        cartMapRef.current = null;
        cartMarkerRef.current = null;
      }
      return;
    }

    const L = window.L;
    const initialLat = cartMapCoords?.lat || 20.5937;
    const initialLng = cartMapCoords?.lng || 78.9629;

    console.log("Initializing Cart Map at:", initialLat, initialLng);

    const map = L.map(cartMapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false
    }).setView([initialLat, initialLng], cartMapCoords ? 16 : 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    cartMapRef.current = map;

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

    cartMarkerRef.current = marker;

    marker.on('dragend', async () => {
      const latLng = marker.getLatLng();
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setCartMapCoords(newCoords);
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setAddressForm);
    });

    map.on('click', async (e) => {
      const latLng = e.latlng;
      marker.setLatLng(latLng);
      const newCoords = { lat: latLng.lat, lng: latLng.lng };
      setCartMapCoords(newCoords);
      await handleReverseGeocode(newCoords.lat, newCoords.lng, setAddressForm);
    });

    return () => {
      if (cartMapRef.current) {
        cartMapRef.current.remove();
        cartMapRef.current = null;
        cartMarkerRef.current = null;
      }
    };
  }, [showNewAddressForm]);

  useEffect(() => {
    if (cartMapRef.current && cartMarkerRef.current && cartMapCoords) {
      const { lat, lng } = cartMapCoords;
      const currentLatLng = cartMarkerRef.current.getLatLng();
      if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
        cartMarkerRef.current.setLatLng([lat, lng]);
        cartMapRef.current.setView([lat, lng], 16);
      }
    }
  }, [cartMapCoords]);

  // Initialize selected address when saved addresses are loaded
  useEffect(() => {
    if (savedAddresses.length > 0 && selectedAddressId === null) {
      setSelectedAddressId(savedAddresses[0].id);
    }
    if (savedAddresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [savedAddresses, selectedAddressId]);

  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
    setErrors({});
  };

  const handleEditAddressClick = async (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
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
      setCartMapCoords({ lat: coords.lat, lng: coords.lon });
    } else {
      setCartMapCoords(null);
    }
    
    setShowNewAddressForm(true);
    setErrors({});
  };

  const handleSubmitAddress = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    let finalAddressString = '';
    
    if (showNewAddressForm) {
      // Validate fields
      const newErrors = {};
      if (!addressForm.label.trim()) newErrors.label = 'Address label is required (e.g. Home, Work)';
      if (!addressForm.street.trim()) newErrors.street = 'Street address is required';
      if (!addressForm.city.trim()) newErrors.city = 'City is required';
      if (!addressForm.state.trim()) newErrors.state = 'State is required';
      if (!addressForm.zipCode.trim()) newErrors.zipCode = 'ZIP Code is required';
      if (!addressForm.country.trim()) newErrors.country = 'Country is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      finalAddressString = `${addressForm.street}, ${addressForm.city}, ${addressForm.state} ${addressForm.zipCode}, ${addressForm.country}`;
      
      if (editingAddressId) {
        // Edit mode
        const updatedAddresses = savedAddresses.map(addr =>
          addr.id === editingAddressId ? { ...addr, ...addressForm } : addr
        );
        await updateProfile({ addresses: updatedAddresses });
        setSelectedAddressId(editingAddressId);
        setEditingAddressId(null);
      } else {
        // Add mode
        const newAddrId = Date.now();
        const newAddrObject = { ...addressForm, id: newAddrId };
        await updateProfile({ addresses: [...savedAddresses, newAddrObject] });
        setSelectedAddressId(newAddrId);
      }
      
      setShowNewAddressForm(false);
      setAddressForm({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
    } else {
      if (savedAddresses.length === 0) {
        alert('Please add a new address first.');
        return;
      }
      const selected = savedAddresses.find(a => a.id === selectedAddressId);
      if (selected) {
        finalAddressString = `${selected.street}, ${selected.city}, ${selected.state} ${selected.zipCode}, ${selected.country}`;
      } else {
        alert('Please select a delivery address.');
        return;
      }
    }

    if (finalAddressString) {
      setAddress(finalAddressString);
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gradient-to-br from-[#f8faf7] via-[#f2f8f0] to-[#eaf5e7]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-100 border-t-emerald-600"></div>
          <Loader className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-600 animate-pulse" size={24} />
        </div>
        <p className="mt-4 text-emerald-800 font-semibold animate-pulse font-headings">Loading your fresh cart...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#f8faf7] via-[#f2f8f0] to-[#eaf5e7]">
        <div className="max-w-md w-full bg-white/70 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.03] text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-float">
            <Trash2 className="text-emerald-600" size={36} />
          </div>
          <h1 className="text-3xl font-bold font-headings text-slate-800 mb-2">Your Cart is Empty</h1>
          <p className="text-slate-500 mb-8 text-sm">Looks like you haven't added any fresh farm produce to your cart yet. Let's find some healthy organic products!</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm tracking-wide rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20 hover:scale-[1.01] active:scale-[0.99]"
          >
            Explore Fresh Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-10 bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
          {[
            { label: 'Shopping Cart', desc: 'Manage items & location' },
            { label: 'Payment', desc: 'Choose checkout method' },
            { label: 'Live Tracking', desc: 'Monitor delivery status' }
          ].map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === 1;
            const isCompleted = stepNum < 1;
            return (
              <div key={idx} className="flex-1 w-full flex items-center gap-4 relative">
                <div className="relative flex items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : isActive 
                      ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/20 animate-pulse-glow' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={18} /> : stepNum}
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute left-12 w-24 lg:w-44 h-[2px] bg-slate-100">
                      <div className={`h-full bg-emerald-500 transition-all duration-500 ${isCompleted ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                </div>
                <div>
                  <p className={`font-semibold text-sm font-headings transition-colors ${isActive ? 'text-emerald-800 font-bold' : isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-headings text-slate-800">Shopping Cart</h2>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100/50">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white/40 border border-slate-100 rounded-2xl hover:bg-white/90 hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-950/[0.01] transition-all duration-300">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/80 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-base text-slate-800 font-headings truncate">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.vendor}</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1 font-sans">₹{item.price}/{item.unit}</p>
                </div>

                {/* Quantity adjustments */}
                <div className="flex items-center gap-3 bg-slate-50/50 p-1 rounded-xl border border-slate-100/80">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-white hover:shadow-sm active:scale-95 transition-all duration-200"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-slate-800 font-sans">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-white hover:shadow-sm active:scale-95 transition-all duration-200"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Subtotal & Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 mt-2 sm:mt-0 gap-2">
                  <p className="font-extrabold text-slate-800 text-base font-sans">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
              <span className="text-slate-600 font-medium text-sm">Cart Total Amount:</span>
              <span className="text-2xl font-black text-emerald-800 font-sans">₹{getTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Address & Checkout Column */}
        <div className="lg:col-span-5 bg-white/70 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] self-start">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <MapPin className="text-emerald-600" size={18} />
              </div>
              <h2 className="text-xl font-bold font-headings text-slate-800">
                {showNewAddressForm 
                  ? editingAddressId ? 'Edit Address' : 'New Address'
                  : 'Delivery To'
                }
              </h2>
            </div>
            {savedAddresses.length > 0 && (
              <button 
                onClick={() => { 
                  setShowNewAddressForm(!showNewAddressForm); 
                  setErrors({});
                  if (showNewAddressForm) {
                    setEditingAddressId(null);
                    setAddressForm({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
                  }
                }}
                className="text-emerald-600 text-xs font-bold hover:text-emerald-800 transition-colors uppercase tracking-wider"
              >
                {showNewAddressForm ? 'Select Saved' : 'Add New'}
              </button>
            )}
          </div>

          {!showNewAddressForm && savedAddresses.length > 0 ? (
            /* Saved Addresses List */
            <div className="space-y-3 mb-6">
              {savedAddresses.map((addr) => (
                <div 
                  key={addr.id}
                  onClick={() => handleSelectAddress(addr)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedAddressId === addr.id 
                      ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-md shadow-emerald-950/[0.01]' 
                      : 'border-slate-100 hover:border-slate-200 bg-white/40 hover:bg-white/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white px-2.5 py-1 rounded-md border border-slate-100 text-slate-500">
                      {addr.label || 'Other'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddressClick(addr);
                        }}
                        className="text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-all p-1.5 rounded-lg"
                        title="Edit Address"
                      >
                        <Pencil size={12} />
                      </button>
                      {selectedAddressId === addr.id && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{addr.street}</p>
                  <p className="text-xs text-slate-400 mt-1">{addr.city}, {addr.state} - {addr.zipCode}</p>
                </div>
              ))}
            </div>
          ) : (
            /* New Address Form */
            <div className="space-y-4">
              
              {/* Location Services Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                    <Navigation size={14} className={`text-emerald-600 ${detectingLocation ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 font-headings">Location Services</p>
                    <p className="text-[10px] text-slate-400">Pin your location automatically</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={detectingLocation}
                    onClick={handleDetectLocation}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center gap-1 active:scale-[0.98]"
                  >
                    <RefreshCw size={10} className={detectingLocation ? 'animate-spin' : ''} />
                    GPS
                  </button>
                  <button
                    type="button"
                    onClick={handleLocateTypedAddress}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-md flex items-center gap-1 active:scale-[0.98]"
                    title="Geocode fields and update pin"
                  >
                    <MapPin size={10} />
                    Locate
                  </button>
                </div>
              </div>

              {/* Leaflet Map Pin Container */}
              <div>
                <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-2">Pin Delivery Location</label>
                <div 
                  ref={cartMapContainerRef} 
                  id="cart-address-map" 
                  className="w-full h-48 rounded-2xl border border-slate-200/80 shadow-inner overflow-hidden relative"
                  style={{ zIndex: 1 }}
                />
                <p className="text-[10px] text-slate-400 mt-2 italic">
                  ℹ️ Drag the blue pin or click on the map to mark your home precisely.
                </p>
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                   <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">Address Label</label>
                   <input
                     type="text"
                     name="label"
                     value={addressForm.label}
                     onChange={handleAddressChange}
                     className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.label ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                     placeholder="e.g. Home, Work, Friend's Place"
                   />
                   {errors.label && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.label}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={addressForm.street}
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.street ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                    placeholder="e.g. Flat 101, Oak Apartments, Main Road"
                  />
                  {errors.street && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.street}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.city ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                    placeholder="Mumbai"
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">State</label>
                  <input
                    type="text"
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.state ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                    placeholder="Maharashtra"
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={addressForm.zipCode}
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.zipCode ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                    placeholder="400001"
                  />
                  {errors.zipCode && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.zipCode}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-headings uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={addressForm.country}
                    onChange={handleAddressChange}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm ${
                       errors.country ? 'border-red-400 bg-red-50/10' : 'border-slate-200 bg-white/50'
                     }`}
                    placeholder="India"
                  />
                  {errors.country && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.country}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                 <input 
                   type="checkbox" 
                   id="saveProfile" 
                   checked={saveToProfile} 
                   onChange={(e) => setSaveToProfile(e.target.checked)}
                   className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                 />
                 <label htmlFor="saveProfile" className="text-xs text-slate-500 cursor-pointer select-none">Save this address to my profile</label>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmitAddress}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm tracking-wide rounded-2xl py-4 transition-all duration-300 shadow-lg shadow-emerald-900/10 hover:shadow-xl hover:shadow-emerald-900/20 hover:scale-[1.01] active:scale-[0.99] mt-6"
          >
            {showNewAddressForm 
              ? editingAddressId ? 'Update & Confirm Address' : 'Confirm & Continue to Payment'
              : 'Confirm & Continue to Payment'
            }
          </button>
        </div>
      </div>
    </div>
  );
}