import React, { useState } from 'react';
import { Search, Filter, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const MOCK_PRODUCTS = [
  // Vegetables
  { id: 1, name: 'Organic Tomatoes', price: 4.99, unit: 'kg', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: 4, name: 'Crisp Lettuce', price: 2.10, unit: 'head', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.5 },
  { id: 5, name: 'Red Bell Peppers', price: 5.50, unit: 'kg', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.6 },
  { id: 6, name: 'Fresh Carrots', price: 1.80, unit: 'bunch', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
  { id: 7, name: 'Broccoli Crown', price: 3.40, unit: 'head', category: 'Vegetables', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.7 },
  
  // Fruits
  { id: 2, name: 'Fresh Strawberries', price: 6.50, unit: 'box', category: 'Fruits', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80', vendor: 'Berry Farm', rating: 4.9 },
  { id: 8, name: 'Organic Bananas', price: 2.20, unit: 'bunch', category: 'Fruits', image: '/bananas.png', vendor: 'Tropical Imports', rating: 4.8 },
  { id: 9, name: 'Fuji Apples', price: 4.50, unit: 'kg', category: 'Fruits', image: '/apples.png', vendor: 'Orchard Fresh', rating: 4.9 },
  { id: 10, name: 'Sweet Oranges', price: 3.80, unit: 'kg', category: 'Fruits', image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500&q=80', vendor: 'Citrus Grove', rating: 4.6 },
  { id: 11, name: 'Avocados', price: 5.00, unit: 'pack of 3', category: 'Fruits', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },

  // Dairy (including eggs, often sold alongside dairy)
  { id: 3, name: 'Farm Fresh Milk', price: 3.20, unit: 'L', category: 'Dairy', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.7 },
  { id: 12, name: 'Organic Butter', price: 4.50, unit: '250g', category: 'Dairy', image: '/butter.png', vendor: 'Meadow Farms', rating: 4.9 },
  { id: 13, name: 'Cheddar Cheese', price: 7.20, unit: 'block', category: 'Dairy', image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
  { id: 14, name: 'Greek Yogurt', price: 5.40, unit: 'tub', category: 'Dairy', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80', vendor: 'Artisan Dairy', rating: 4.7 },
  { id: 15, name: 'Free Range Eggs', price: 6.00, unit: 'dozen', category: 'Dairy', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&q=80', vendor: 'Morning Roost', rating: 4.9 },
  
  // Bulk Options
  { id: 16, name: 'Bulk Potatoes', price: 15.00, unit: '20kg bag', category: 'Bulk Options', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', vendor: 'Root Essentials', rating: 4.8 }
];

export default function Marketplace() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState('none');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // 'none'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         
         <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
               <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
               <p className="text-gray-500 mt-1">Discover fresh produce from local vendors</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                     type="text" 
                     placeholder="Search products..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none" 
                  />
               </div>
               <div className="relative">
                  <button onClick={() => setShowFilterMenu(!showFilterMenu)} className="p-2 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand/20">
                     <Filter size={20} />
                  </button>
                  {showFilterMenu && (
                     <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 top-full">
                        <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By</div>
                        <button onClick={() => { setSortBy('none'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors ${sortBy === 'none' ? 'text-brand font-semibold' : 'text-gray-700'}`}>Recommended</button>
                        <button onClick={() => { setSortBy('price_asc'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors ${sortBy === 'price_asc' ? 'text-brand font-semibold' : 'text-gray-700'}`}>Price: Low to High</button>
                        <button onClick={() => { setSortBy('price_desc'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors ${sortBy === 'price_desc' ? 'text-brand font-semibold' : 'text-gray-700'}`}>Price: High to Low</button>
                        <button onClick={() => { setSortBy('rating'); setShowFilterMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-brand-light transition-colors ${sortBy === 'rating' ? 'text-brand font-semibold' : 'text-gray-700'}`}>Highest Rated</button>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Categories */}
         <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Vegetables', 'Fruits', 'Dairy', 'Bulk Options'].map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap scroll-snap-align-start ${activeCategory === cat ? 'bg-brand text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand/50 hover:text-brand'}`}>
                  {cat}
               </button>
            ))}
         </div>

         {/* Product Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
               <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                     <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm">
                        {product.category}
                     </div>
                  </div>
                  <div className="p-5">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
                        <div className="flex items-center text-xs font-semibold text-yellow-500 bg-yellow-50 px-1.5 py-0.5 rounded flex-shrink-0">
                           <Star size={12} className="mr-0.5 fill-current" /> {product.rating}
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 mb-4 truncate">{product.vendor}</p>
                     
                     <div className="flex justify-between items-center mt-auto">
                        <div>
                           <span className="text-xl font-extrabold text-brand-dark">${product.price}</span>
                           <span className="text-sm text-gray-500">/{product.unit}</span>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart(product);
                            navigate('/cart');
                          }}
                          className="bg-brand-light text-brand hover:bg-brand hover:text-white p-2 rounded-full transition-colors focus:ring-2 focus:ring-brand/50 outline-none"
                        >
                           <ShoppingCart size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>

      </div>
    </div>
  );
}
