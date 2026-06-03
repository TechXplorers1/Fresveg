import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Trash2, MapPin, PlusCircle, CheckCircle2, Pencil } from 'lucide-react';

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

  const handleEditAddressClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || ''
    });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some fresh produce to get started!</p>
            <button
              onClick={() => navigate('/#marketplace')}
              className="bg-brand text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-dark transition-colors"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm h-fit">
            <h2 className="text-xl font-semibold mb-6">Items in Cart</h2>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.vendor}</p>
                    <p className="text-sm font-bold text-brand">${item.price}/{item.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full border border-gray-200 hover:bg-gray-100"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full border border-gray-200 hover:bg-gray-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-brand">${getTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 self-start">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="text-brand" size={24} />
                <h2 className="text-xl font-semibold">
                  {showNewAddressForm 
                    ? editingAddressId ? 'Edit Address' : 'Delivery To'
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
                  className="text-brand text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  {showNewAddressForm ? 'Select Saved' : 'Add New Address'}
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
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                      selectedAddressId === addr.id 
                        ? 'border-brand bg-brand-light/20' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-gray-100 mb-2 inline-block">
                        {addr.label || 'Other'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAddressClick(addr);
                          }}
                          className="text-gray-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-white"
                          title="Edit Address"
                        >
                          <Pencil size={14} />
                        </button>
                        {selectedAddressId === addr.id && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{addr.street}</p>
                    <p className="text-xs text-gray-500">{addr.city}, {addr.state} - {addr.zipCode}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* New Address Form */
              <form onSubmit={handleSubmitAddress} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Address Label</label>
                     <input
                       type="text"
                       name="label"
                       value={addressForm.label}
                       onChange={handleAddressChange}
                       className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                         errors.label ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                       }`}
                       placeholder="e.g. Home, Work"
                     />
                     {errors.label && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.label}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                        errors.street ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                      }`}
                      placeholder="123 Main Street"
                    />
                    {errors.street && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.street}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                        errors.city ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                      }`}
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                        errors.state ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                      }`}
                      placeholder="MH"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={addressForm.zipCode}
                      onChange={handleAddressChange}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                        errors.zipCode ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                      }`}
                      placeholder="400001"
                    />
                    {errors.zipCode && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.zipCode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressChange}
                      className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none transition-all ${
                        errors.country ? 'border-red-500 bg-red-50/20' : 'border-gray-200'
                      }`}
                      placeholder="India"
                    />
                    {errors.country && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.country}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 py-2">
                   <input 
                     type="checkbox" 
                     id="saveProfile" 
                     checked={saveToProfile} 
                     onChange={(e) => setSaveToProfile(e.target.checked)}
                     className="w-4 h-4 text-brand rounded focus:ring-brand"
                   />
                   <label htmlFor="saveProfile" className="text-sm text-gray-600 cursor-pointer">Save this address to my profile</label>
                </div>
              </form>
            )}

            <button
              onClick={handleSubmitAddress}
              className="w-full bg-brand text-white py-4 px-4 rounded-xl font-bold hover:bg-brand-dark transition-all shadow-md active:scale-[0.98] mt-4"
            >
              {showNewAddressForm 
                ? editingAddressId ? 'Update & Confirm' : 'Confirm Address & Checkout'
                : 'Confirm Address & Checkout'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}