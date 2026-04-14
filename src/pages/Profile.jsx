import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { Navigate } from 'react-router-dom';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { products: allProducts, addProduct } = useProducts();
  
  // Safely migrate existing users and define current shops array
  const vendorShops = user?.shops || (user?.shopName ? [user.shopName] : []);
  
  // Vendor sees products from all their shops combined
  const vendorProducts = allProducts.filter(p => vendorShops.includes(p.vendor));
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddShopForm, setShowAddShopForm] = useState(false);
  
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: '', image: '', shop: ''
  });

  const [newShopName, setNewShopName] = useState('');

  // State for setting up the very first shop
  const [shopSetup, setShopSetup] = useState({ shopName: '' });

  // Protect route
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleShopSetup = (e) => {
    e.preventDefault();
    const updatedShops = [...vendorShops, shopSetup.shopName];
    updateProfile({ shops: updatedShops, shopName: updatedShops[0] });
  };

  const handleAddAdditionalShop = (e) => {
    e.preventDefault();
    if (newShopName.trim()) {
      updateProfile({ shops: [...vendorShops, newShopName.trim()] });
      setNewShopName('');
      setShowAddShopForm(false);
    }
  };

  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProduct({ 
      ...newProduct, 
      price: parseFloat(newProduct.price),
      vendor: newProduct.shop || vendorShops[0],
      rating: 5.0, // Default for new products
      unit: 'item' // Default unit
    });
    setNewProduct({ name: '', price: '', category: '', image: '', shop: '' });
    setShowAddForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-4">
           <div className="bg-brand-light/30 p-4 rounded-full border border-brand/20">
              <User size={32} className="text-brand" />
           </div>
           <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 mt-1 capitalize font-medium">{user.role}</p>
           </div>
        </div>
      </div>

      {user.role === 'customer' && (
         <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <User className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Your Customer Profile</h3>
            <p className="text-gray-500">More details and order history coming soon.</p>
         </div>
      )}

      {user.role === 'vendor' && vendorShops.length === 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto mt-8">
          <div className="text-center mb-6">
             <Store className="mx-auto text-brand mb-4" size={48} />
             <h2 className="text-2xl font-bold text-gray-900">Set Up Your Shop</h2>
             <p className="text-gray-500 text-sm mt-1">Add your shop name so you can start adding products.</p>
          </div>
          <form onSubmit={handleShopSetup} className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({shopName: e.target.value})} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand outline-none" placeholder="E.g. Fresh Valley Farms" />
                </div>
             </div>
             <button type="submit" className="w-full bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-colors">
                Complete Setup
             </button>
          </form>
        </div>
      )}

      {user.role === 'vendor' && vendorShops.length > 0 && (
        <div className="mt-8">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Shops ({vendorShops.length})</h2>
              <div className="flex flex-wrap gap-2">
                 {vendorShops.map((shop, i) => (
                    <span key={i} className="bg-brand-light text-brand px-3 py-1 rounded-full text-sm font-semibold shadow-sm">{shop}</span>
                 ))}
                 {!showAddShopForm && (
                   <button onClick={() => setShowAddShopForm(true)} className="flex items-center gap-1 bg-gray-100 text-gray-600 hover:text-brand hover:bg-brand-light/50 px-3 py-1 rounded-full text-sm font-medium transition-colors">
                     <Plus size={14} /> Add Shop
                   </button>
                 )}
              </div>
              
              {showAddShopForm && (
                <form onSubmit={handleAddAdditionalShop} className="mt-4 flex max-w-sm gap-2">
                  <input type="text" autoFocus required value={newShopName} onChange={(e) => setNewShopName(e.target.value)} placeholder="New Shop Name" className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-brand text-sm" />
                  <button type="submit" className="bg-brand text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-dark transition-colors">Save</button>
                  <button type="button" onClick={() => setShowAddShopForm(false)} className="text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                </form>
              )}
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={20} />
              {showAddForm ? 'Cancel' : 'Add New Product'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none" placeholder="E.g. Organic Tomatoes" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Which Shop?</label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select required name="shop" value={newProduct.shop} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none appearance-none bg-white">
                        <option value="">Select a shop...</option>
                        {vendorShops.map((shop, i) => (
                           <option key={i} value={shop}>{shop}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input required type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none" placeholder="2.99" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select required name="category" value={newProduct.category} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none appearance-none">
                        <option value="">Select category...</option>
                        <option value="Tomatoes">Tomatoes</option>
                        <option value="Potatoes">Potatoes</option>
                        <option value="Onions">Onions</option>
                        <option value="Brinjal">Brinjal</option>
                        <option value="Carrots">Carrots</option>
                        <option value="Spinach">Spinach</option>
                        <option value="Capsicum">Capsicum</option>
                        <option value="Broccoli">Broccoli</option>
                        <option value="Garlic">Garlic</option>
                        <option value="Apples">Apples</option>
                        <option value="Bananas">Bananas</option>
                        <option value="Strawberries">Strawberries</option>
                        <option value="Oranges">Oranges</option>
                        <option value="Milk">Milk</option>
                        <option value="Butter">Butter</option>
                        <option value="Cheese">Cheese</option>
                        <option value="Yogurt">Yogurt</option>
                        <option value="Paneer">Paneer</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input required type="text" name="image" value={newProduct.image} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none" placeholder="https://example.com/image.jpg" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" className="bg-brand text-white px-6 py-2.5 rounded-xl font-medium w-full md:w-auto hover:bg-brand-dark transition-colors">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Products ({vendorProducts.length})</h2>
            {vendorProducts.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No products yet</h3>
                <p className="text-gray-500">Get started by adding your first product to your shop.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {vendorProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-gray-300" size={48} />
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-semibold text-brand mb-1 uppercase tracking-wider">{product.category}</div>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                      <div className="flex items-center justify-between mt-3">
                         <div className="font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
                         <div className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs truncate max-w-[120px] flex items-center gap-1">
                            <Store size={10} /> {product.vendor}
                         </div>
                      </div>
                    </div>
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
