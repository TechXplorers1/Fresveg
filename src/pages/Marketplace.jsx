import { useProducts } from '../context/ProductContext';

export default function Marketplace() {
  const { products } = useProducts();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState('none');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const vendorName = p.vendor || '';
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || vendorName.toLowerCase().includes(searchQuery.toLowerCase());
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
               <div 
                 key={product.id} 
                 onClick={() => navigate(`/product/${product.id}`)}
                 className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
               >
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
                           <Star size={12} className="mr-0.5 fill-current" /> {product.rating || '5.0'}
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 mb-4 truncate">{product.vendor}</p>
                     
                     <div className="flex justify-between items-center mt-auto">
                        <div>
                           <span className="text-xl font-extrabold text-brand-dark">${product.price}</span>
                           <span className="text-sm text-gray-500">/{product.unit}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
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
