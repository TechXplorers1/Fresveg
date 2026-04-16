import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Minus, Plus, Trash2, MapPin, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function Cart() {
  const { cartItems, setAddress, removeFromCart, updateQuantity, getTotal } = useCart();
  const { userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const savedAddresses = userProfile?.addresses || [];
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveToProfile, setSaveToProfile] = useState(true);

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
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setShowNewAddressForm(false);
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    let finalAddressString = '';
    
    if (showNewAddressForm) {
      finalAddressString = `${addressForm.street}, ${addressForm.city}, ${addressForm.state} ${addressForm.zipCode}, ${addressForm.country}`;
      
      if (saveToProfile) {
        const newAddrObject = { ...addressForm, id: Date.now() };
        await updateProfile({ addresses: [...savedAddresses, newAddrObject] });
      }
    } else {
      const selected = savedAddresses.find(a => a.id === selectedAddressId);
      if (selected) {
        finalAddressString = `${selected.street}, ${selected.city}, ${selected.state} ${selected.zipCode}, ${selected.country}`;
      }
    }

    if (finalAddressString) {
      setAddress(finalAddressString);
      navigate('/checkout');
    }
  };

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
                <h2 className="text-xl font-semibold">Delivery To</h2>
              </div>
              {savedAddresses.length > 0 && (
                <button 
                  onClick={() => setShowNewAddressForm(!showNewAddressForm)}
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
                      {selectedAddressId === addr.id && <CheckCircle2 size={18} className="text-brand" />}
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
                       required
                       className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                       placeholder="e.g. Home, Work"
                     />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={addressForm.street}
                      onChange={handleAddressChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                      placeholder="MH"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={addressForm.zipCode}
                      onChange={handleAddressChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                      placeholder="400001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={addressForm.country}
                      onChange={handleAddressChange}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/10 focus:border-brand outline-none"
                      placeholder="India"
                    />
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
              Confirm Address & Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}