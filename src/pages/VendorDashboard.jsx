import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Plus, Package, DollarSign, Tag, Image as ImageIcon } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
  });

  // Protect route
  if (!user || user.role !== 'vendor') {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    setProducts([...products, { ...newProduct, id: Date.now() }]);
    setNewProduct({ name: '', price: '', category: '', image: '' });
    setShowAddForm(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{user.shopName || "Your Shop"}</h1>
          <p className="text-gray-500 mt-1">Manage your store and products</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-brand outline-none" placeholder="E.g. Organic Tomatoes" />
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
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
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
        <h2 className="text-xl font-semibold mb-4">Your Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products yet</h3>
            <p className="text-gray-500">Get started by adding your first product to your shop.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-gray-300" size={48} />
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs font-semibold text-brand mb-1 uppercase tracking-wider">{product.category}</div>
                  <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                  <div className="font-bold text-gray-900">${parseFloat(product.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
