import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Globe, MessageCircle, ShoppingCart, Star, Search, Filter, Plus, Minus, X, ChevronLeft, ChevronRight, MapPin, Clock, Store, ArrowLeft, CheckCircle, Sprout, Compass, Navigation, ExternalLink, Target, Loader2, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { realtimeDb } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { getFarmSlug } from './FarmDetails';
import { getProductSlug } from './ProductDetails';
import { ensureFarmsInFirebase } from '../services/farmSeeder';

const MOCK_FARMS_LIST = [
   {
      id: 'mock-farm-1',
      farmName: 'Orchard Berry & Honey Haven',
      location: 'Mahabaleshwar, Maharashtra',
      description: 'Experience strawberry harvesting, beehive tours, and fresh jam tasting in cool hill country.',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
      costPerPerson: 250,
      vendorId: 'mock-vendor-1',
      vendorName: 'Orchard Farms',
      rating: 4.9,
      farmProducts: [
         { id: 'fp-1', name: 'Fresh Mahabaleshwar Strawberries (500g)', price: 180, unit: 'box', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80', vendor: 'Orchard Farms', category: 'Strawberries' },
         { id: 'fp-2', name: 'Pure Organic Honey Jar (250g)', price: 290, unit: 'jar', image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80', vendor: 'Orchard Farms', category: 'Honey' },
         { id: 'fp-3', name: 'Fresh Strawberry Jam (300g)', price: 220, unit: 'jar', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&q=80', vendor: 'Orchard Farms', category: 'Preserves' }
      ]
   },
   {
      id: 'mock-farm-2',
      farmName: 'Green Valley Organic Haven',
      location: 'Karjat, Maharashtra',
      description: 'Learn about sustainable agriculture, witness our bio-gas plant, pick fresh organic leafy greens, and enjoy open field walks along river streams.',
      image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80',
      costPerPerson: 0,
      vendorId: 'mock-vendor-2',
      vendorName: 'Green Valley Farm',
      rating: 4.8,
      farmProducts: [
         { id: 'fp-4', name: 'Fresh Organic Spinach (250g)', price: 35, unit: 'bunch', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', vendor: 'Green Valley Farm', category: 'Spinach' },
         { id: 'fp-5', name: 'Organic Cherry Tomatoes (500g)', price: 80, unit: 'pack', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', vendor: 'Green Valley Farm', category: 'Tomatoes' }
      ]
   },
   {
      id: 'mock-farm-3',
      farmName: 'Sunshine Mango & Citrus Estate',
      location: 'Ratnagiri, Maharashtra',
      description: 'Walk through Alphonso mango orchards, enjoy fresh citrus harvests, traditional Maharashtrian meals, and sunset view points.',
      image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&q=80',
      costPerPerson: 300,
      vendorId: 'mock-vendor-3',
      vendorName: 'Sunshine Produce',
      rating: 4.9,
      farmProducts: [
         { id: 'fp-6', name: 'Authentic Ratnagiri Alphonso Mangoes (1 Dozen)', price: 850, unit: 'box', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80', vendor: 'Sunshine Produce', category: 'Mangoes' },
         { id: 'fp-7', name: 'Fresh Farm Oranges (1 kg)', price: 120, unit: 'kg', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', vendor: 'Sunshine Produce', category: 'Citrus' }
      ]
   }
];

const extractShops = (userObj) => {
   if (!userObj) return [];
   if (Array.isArray(userObj.shops)) return userObj.shops;
   if (userObj.shops && typeof userObj.shops === 'object') {
      return Object.values(userObj.shops);
   }
   return [];
};

const formatUpdatedTime = (isoString) => {
   if (!isoString) return null;
   try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
         hour: 'numeric',
         minute: '2-digit',
         hour12: true
      });
   } catch {
      return null;
   }
};

const normalizeLookupText = (value) => {
   return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
};

const buildSocialLinks = (source) => {
   const raw = source?.socialLinks || source || {};
   if (raw && typeof raw === 'object') {
      const normalizeValue = (field) => {
         const value = raw[field];
         if (typeof value !== 'string') return '';
         const trimmed = value.trim();
         return trimmed;
      };

      return {
         instagram: normalizeValue('instagram'),
         facebook: normalizeValue('facebook'),
         youtube: normalizeValue('youtube'),
         whatsapp: normalizeValue('whatsapp'),
         website: normalizeValue('website')
      };
   }

   return { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' };
};

const resolveShopSocialLinks = (shopOrFarm, publicShopsData) => {
   if (!shopOrFarm) return { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' };
   
   const name = shopOrFarm.name || shopOrFarm.shopName || shopOrFarm.farmName || shopOrFarm.vendorName || 'Organic Shop';
   const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '');

   // 1. Direct socialLinks on object
   const direct = buildSocialLinks(shopOrFarm);
   
   // 2. Search in publicShopsData
   let matchedPublic = {};
   if (publicShopsData && typeof publicShopsData === 'object') {
      const targetName = normalizeLookupText(name);
      const targetVendorId = shopOrFarm.vendorId || shopOrFarm.uid;
      
      Object.entries(publicShopsData).forEach(([vUid, vShops]) => {
         const shopsArr = Array.isArray(vShops) ? vShops : Object.values(vShops || {});
         if (targetVendorId && vUid === targetVendorId) {
            shopsArr.forEach(s => {
               const sSocials = buildSocialLinks(s);
               matchedPublic = { ...sSocials, ...matchedPublic };
            });
         }
         shopsArr.forEach(s => {
            const sName = normalizeLookupText(s.shopName || s.name || s.farmName);
            if (targetName && sName && (targetName === sName || targetName.includes(sName) || sName.includes(targetName))) {
               const sSocials = buildSocialLinks(s);
               matchedPublic = { ...sSocials, ...matchedPublic };
            }
         });
      });
   }
   
   const combined = {
      instagram: direct.instagram || matchedPublic.instagram || '',
      facebook: direct.facebook || matchedPublic.facebook || '',
      youtube: direct.youtube || matchedPublic.youtube || '',
      whatsapp: direct.whatsapp || matchedPublic.whatsapp || '',
      website: direct.website || matchedPublic.website || ''
   };

   // Ensure every shop & farm always displays social links
   return {
      instagram: combined.instagram || `https://instagram.com/${slug}`,
      facebook: combined.facebook || `https://facebook.com/${slug}`,
      youtube: combined.youtube || `https://youtube.com/@${slug}`,
      whatsapp: combined.whatsapp || `+91 98765 43210`,
      website: combined.website || `https://${slug}.fresveg.com`
   };
};

export default function Marketplace() {
   const { cartItems, addToCart, updateQuantity } = useCart();
   const { products, searchQuery, setSearchQuery, categoriesWithDetails = [] } = useProducts();
   const navigate = useNavigate();
   const [activeCategory, setActiveCategory] = useState('All');
   const [sortBy, setSortBy] = useState('none');

   const openLocationInMaps = (locationStr, e) => {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }
      if (!locationStr) return;
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationStr)}`;
      window.open(url, '_blank');
   };

   // Filter states
   const [priceRanges, setPriceRanges] = useState([]);
   const [ratingFilters, setRatingFilters] = useState([]);
   const [selectedBrands, setSelectedBrands] = useState([]);
   const [discountFilters, setDiscountFilters] = useState([]);
   const [showFilters, setShowFilters] = useState(true);

   // Reset search query when entering or leaving Marketplace page
   useEffect(() => {
      setSearchQuery('');
      return () => {
         setSearchQuery('');
      };
   }, [setSearchQuery]);

   // Refs & mouse drag state for category carousels
   const categoriesTilesRef = useRef(null);
   const categoryPillsRef = useRef(null);

   const [isMouseDownTiles, setIsMouseDownTiles] = useState(false);
   const [startXPointerTiles, setStartXPointerTiles] = useState(0);
   const [scrollLeftStartTiles, setScrollLeftStartTiles] = useState(0);

   const [isMouseDownPills, setIsMouseDownPills] = useState(false);
   const [startXPointerPills, setStartXPointerPills] = useState(0);
   const [scrollLeftStartPills, setScrollLeftStartPills] = useState(0);

   // Non-passive wheel listeners to convert vertical mouse wheel scrolling into horizontal carousel sliding
   useEffect(() => {
      const tilesEl = categoriesTilesRef.current;
      const pillsEl = categoryPillsRef.current;

      const onWheelTiles = (e) => {
         if (tilesEl && e.deltaY !== 0) {
            e.preventDefault();
            tilesEl.scrollLeft += e.deltaY * 1.2;
         }
      };

      const onWheelPills = (e) => {
         if (pillsEl && e.deltaY !== 0) {
            e.preventDefault();
            pillsEl.scrollLeft += e.deltaY * 1.2;
         }
      };

      if (tilesEl) tilesEl.addEventListener('wheel', onWheelTiles, { passive: false });
      if (pillsEl) pillsEl.addEventListener('wheel', onWheelPills, { passive: false });

      return () => {
         if (tilesEl) tilesEl.removeEventListener('wheel', onWheelTiles);
         if (pillsEl) pillsEl.removeEventListener('wheel', onWheelPills);
      };
   }, []);

   // Arrow button click scroll helper
   const scrollRow = (refEl, direction) => {
      if (refEl.current) {
         const scrollAmount = direction === 'left' ? -300 : 300;
         refEl.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
   };

   // Drag handlers for Browse Categories tiles
   const handleMouseDownTiles = (e) => {
      if (!categoriesTilesRef.current) return;
      setIsMouseDownTiles(true);
      setStartXPointerTiles(e.pageX - categoriesTilesRef.current.offsetLeft);
      setScrollLeftStartTiles(categoriesTilesRef.current.scrollLeft);
   };

   const handleMouseMoveTiles = (e) => {
      if (!isMouseDownTiles || !categoriesTilesRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoriesTilesRef.current.offsetLeft;
      const walk = (x - startXPointerTiles) * 1.5;
      categoriesTilesRef.current.scrollLeft = scrollLeftStartTiles - walk;
   };

   const handleMouseUpTiles = () => {
      setIsMouseDownTiles(false);
   };

   // Drag handlers for Category filter pills
   const handleMouseDownPills = (e) => {
      if (!categoryPillsRef.current) return;
      setIsMouseDownPills(true);
      setStartXPointerPills(e.pageX - categoryPillsRef.current.offsetLeft);
      setScrollLeftStartPills(categoryPillsRef.current.scrollLeft);
   };

   const handleMouseMovePills = (e) => {
      if (!isMouseDownPills || !categoryPillsRef.current) return;
      e.preventDefault();
      const x = e.pageX - categoryPillsRef.current.offsetLeft;
      const walk = (x - startXPointerPills) * 1.5;
      categoryPillsRef.current.scrollLeft = scrollLeftStartPills - walk;
   };

   const handleMouseUpPills = () => {
      setIsMouseDownPills(false);
   };

   const handleCategoryClick = (category) => {
      setActiveCategory(category);
   };

   // Zomato-Style Shop State
   const [selectedShop, setSelectedShop] = useState(null);
   const [shopSearchQuery, setShopSearchQuery] = useState('');
   const [shopActiveCategory, setShopActiveCategory] = useState('All');

   // Marketplace Tabs State: 'markets' or 'farms'
   const [marketplaceTab, setMarketplaceTab] = useState('markets');
   const [publicShopsData, setPublicShopsData] = useState({});
   const [selectedRadius, setSelectedRadius] = useState('all'); // 'all', '5', '10', '25', '50'

   // Live GPS Location Detection & Haversine Distance Calculator
   const [userGpsCoords, setUserGpsCoords] = useState(null); // { lat, lng, label }
   const [isFetchingGps, setIsFetchingGps] = useState(false);
   const [gpsMessage, setGpsMessage] = useState('');

   // Known City Coordinates Map for Haversine Distance Calculation
   const CITY_COORDINATES = React.useMemo(() => ({
      karjat: { lat: 18.9107, lng: 73.3282, name: 'Karjat' },
      mahabaleshwar: { lat: 17.9237, lng: 73.6586, name: 'Mahabaleshwar' },
      anantapur: { lat: 14.6819, lng: 77.6006, name: 'Anantapur' },
      'maruthi nagar': { lat: 14.6750, lng: 77.6050, name: 'Maruthi Nagar' },
      pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
      nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik' },
      satara: { lat: 17.6805, lng: 74.0183, name: 'Satara' },
      ratnagiri: { lat: 16.9902, lng: 73.3120, name: 'Ratnagiri' },
      mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
   }), []);

   // Haversine Formula: calculates exact geodesic distance in km between 2 GPS coordinates
   const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
         Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
         Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
   };

   // Helper to extract coordinates for a given location string
   const getLocationCoords = React.useCallback((locationStr) => {
      if (!locationStr) return CITY_COORDINATES.karjat;
      const locLower = locationStr.toLowerCase();
      for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
         if (locLower.includes(key)) return coords;
      }
      let hash = 0;
      for (let i = 0; i < locLower.length; i++) {
         hash = ((hash << 5) - hash) + locLower.charCodeAt(i);
         hash |= 0;
      }
      const latOffset = (Math.abs(hash % 100) / 1000);
      const lngOffset = (Math.abs((hash >> 2) % 100) / 1000);
      return { lat: 18.9107 + latOffset, lng: 73.3282 + lngOffset, name: locationStr };
   }, [CITY_COORDINATES]);

   // Helper to calculate distance in km from current user location (GPS or reference city) to shop/farm address
   const getShopDistanceKm = React.useCallback((locationStr) => {
      const targetCoords = getLocationCoords(locationStr);
      
      // If user enabled Live GPS
      if (userGpsCoords && userGpsCoords.lat && userGpsCoords.lng) {
         const dist = calculateHaversineDistance(
            userGpsCoords.lat,
            userGpsCoords.lng,
            targetCoords.lat,
            targetCoords.lng
         );
         return Math.max(0.8, Number(dist.toFixed(1)));
      }

      // Default reference city distance (relative to Karjat center)
      const refCoords = CITY_COORDINATES.karjat;
      const dist = calculateHaversineDistance(
         refCoords.lat,
         refCoords.lng,
         targetCoords.lat,
         targetCoords.lng
      );
      return Math.max(1.2, Number(dist.toFixed(1)));
   }, [userGpsCoords, getLocationCoords, CITY_COORDINATES]);

   // Handler to trigger browser GPS location fetch
   const handleDetectUserLocation = () => {
      if (!navigator.geolocation) {
         setGpsMessage('Geolocation is not supported by your browser.');
         return;
      }
      setIsFetchingGps(true);
      setGpsMessage('');
      navigator.geolocation.getCurrentPosition(
         (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setUserGpsCoords({
               lat,
               lng,
               label: `Live GPS (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`
            });
            setIsFetchingGps(false);
            setGpsMessage('📍 Precise GPS position detected! Distances recalculated live.');
         },
         (err) => {
            console.warn('GPS location fetch error:', err.message);
            setUserGpsCoords({
               lat: 18.9107,
               lng: 73.3282,
               label: 'Default Base Location (Karjat)'
            });
            setIsFetchingGps(false);
            setGpsMessage('📍 Using base reference location (Karjat, Maharashtra).');
         },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
   };

   // Listen to publicShops — publicly readable, contains vendor shop info + socialLinks
   useEffect(() => {
      const publicShopsRef = ref(realtimeDb, 'publicShops');
      const unsubscribe = onValue(publicShopsRef, (snapshot) => {
         const data = snapshot.val();
         setPublicShopsData(data || {});
      });
      return () => unsubscribe();
   }, []);
   const [farmsList, setFarmsList] = useState([]);
   const [selectedFarmShop, setSelectedFarmShop] = useState(null);
   const [farmSearchQuery, setFarmSearchQuery] = useState('');
   const [farmActiveCategory, setFarmActiveCategory] = useState('All');

   // Fetch Farms 100% directly from Firebase Realtime Database (Single Source of Truth)
   useEffect(() => {
      ensureFarmsInFirebase();
      const farmsRef = ref(realtimeDb, 'farms');
      const unsubscribe = onValue(farmsRef, (snapshot) => {
         const data = snapshot.val();
         if (data) {
            const dbFarms = Object.keys(data).map(key => ({
               ...data[key],
               id: key,
               farmProducts: data[key].farmProducts || []
            }));
            setFarmsList(dbFarms);
         } else {
            setFarmsList([]);
         }
      });
      return () => unsubscribe();
   }, []);

   // Combined Products for Selected Farm Shop (Whatever products added by vendor at farm page)
   const selectedFarmProducts = React.useMemo(() => {
      if (!selectedFarmShop) return [];

      const rawFarmProducts = selectedFarmShop.farmProducts || [];
      let parsedFarmProducts = [];

      if (Array.isArray(rawFarmProducts)) {
         parsedFarmProducts = rawFarmProducts.map((p, idx) => {
            if (typeof p === 'string') {
               return {
                  id: `fp-str-${idx}`,
                  name: p.trim(),
                  price: 60,
                  unit: 'kg',
                  category: 'Direct Harvest',
                  image: selectedFarmShop.image || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
                  vendor: selectedFarmShop.farmName,
                  rating: 5.0
               };
            }
            return {
               id: p.id || `fp-${idx}`,
               name: p.name || 'Organic Direct Harvest Product',
               price: Number(p.price) || 50,
               unit: p.unit || 'kg',
               category: p.category || 'Direct Harvest',
               image: p.image || selectedFarmShop.image || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
               vendor: selectedFarmShop.farmName,
               rating: p.rating || 5.0
            };
         });
      } else if (typeof rawFarmProducts === 'string' && rawFarmProducts.trim() !== '') {
         parsedFarmProducts = rawFarmProducts.split(',').map((pStr, idx) => ({
            id: `fp-str-${idx}`,
            name: pStr.trim(),
            price: 60,
            unit: 'kg',
            category: 'Direct Harvest',
            image: selectedFarmShop.image || 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
            vendor: selectedFarmShop.farmName,
            rating: 5.0
         }));
      }

      // Also match any products in ProductContext added by this vendor for this farm
      const matchingMarketplaceProducts = products.filter(p => 
         p.vendor?.trim().toLowerCase() === selectedFarmShop.farmName?.trim().toLowerCase() ||
         p.vendor?.trim().toLowerCase() === selectedFarmShop.vendorName?.trim().toLowerCase()
      );

      const mergedMap = {};
      parsedFarmProducts.forEach(p => {
         if (p.name) mergedMap[p.name.trim().toLowerCase()] = p;
      });

      matchingMarketplaceProducts.forEach(p => {
         const key = p.name ? p.name.trim().toLowerCase() : p.id;
         if (!mergedMap[key]) {
            mergedMap[key] = p;
         }
      });

      return Object.values(mergedMap);
   }, [selectedFarmShop, products]);

   // Category list for selected farm shop
   const farmCategoryList = React.useMemo(() => {
      if (!selectedFarmProducts) return ['All'];
      const cats = new Set(['All']);
      selectedFarmProducts.forEach(p => {
         if (p.category) cats.add(p.category);
      });
      return Array.from(cats);
   }, [selectedFarmProducts]);

   // Filtered Farm Products in Selected Farm Storefront using active filters
   const filteredFarmProducts = React.useMemo(() => {
      return selectedFarmProducts.filter(p => {
         const effectiveCat = farmActiveCategory !== 'All' ? farmActiveCategory : activeCategory;
         const matchesCategory = effectiveCat === 'All' || (p.category && p.category.toLowerCase() === effectiveCat.toLowerCase());
         const query = farmSearchQuery || searchQuery;
         const matchesSearch = query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || (p.category && p.category.toLowerCase().includes(query.toLowerCase()));
         
         const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
            const pRating = p.rating || selectedFarmShop?.rating || 4.8;
            return pRating >= Number(rating);
         });

         const matchesPrice = priceRanges.length === 0 || priceRanges.some(range => {
            const price = Number(p.price) || 0;
            switch (range) {
               case 'under5': return price < 50;
               case '5to10': return price >= 50 && price <= 100;
               case '10to20': return price > 100 && price <= 200;
               case 'over20': return price > 200;
               default: return true;
            }
         });

         const matchesDiscount = discountFilters.length === 0 || discountFilters.some(disc => {
            const d = Number(p.discount || 0);
            return d >= Number(disc);
         });

         return matchesCategory && matchesSearch && matchesRating && matchesPrice && matchesDiscount;
      }).sort((a, b) => {
         if (sortBy === 'price-low' || sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
         if (sortBy === 'price-high' || sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
         if (sortBy === 'rating') return (b.rating || 4.9) - (a.rating || 4.9);
         return 0;
      });
   }, [selectedFarmProducts, farmActiveCategory, activeCategory, farmSearchQuery, searchQuery, ratingFilters, priceRanges, discountFilters, sortBy, selectedFarmShop]);

   // Aggregate unique Local Organic Shops & Markets from products & vendor profiles
   const shopsList = React.useMemo(() => {
      const shopMap = {};

      // Load vendor shop profiles from publicShops (publicly readable node)
      Object.values(publicShopsData || {}).forEach(vendorShopsArr => {
         const shops = Array.isArray(vendorShopsArr)
            ? vendorShopsArr
            : Object.values(vendorShopsArr || {});
         shops.forEach(s => {
            if (s && s.shopName && s.shopName.trim()) {
               const key = s.shopName.trim();
               const normalizedKey = normalizeLookupText(key);
               shopMap[normalizedKey] = {
                  id: key.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  name: key,
                  image: s.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
                  location: s.location || 'Local Region, India',
                  rating: 4.9,
                  deliveryTime: '25-35 mins',
                  gstNumber: s.gstNumber || '',
                  socialLinks: s.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
                  updatedAt: s.updatedAt || null,
                  categories: new Set(),
                  products: []
               };
            }
         });
      });

      products.forEach(p => {
         const vendorName = p.vendor || p.shop || 'Local Farm Market';
         const normalizedVendorName = normalizeLookupText(vendorName);
         let targetShop = normalizedVendorName ? shopMap[normalizedVendorName] : null;

         if (!targetShop) {
            targetShop = Object.values(shopMap).find(shop => {
               const normalizedShopName = normalizeLookupText(shop.name);
               return normalizedShopName === normalizedVendorName ||
                  normalizedShopName.includes(normalizedVendorName) ||
                  normalizedVendorName.includes(normalizedShopName);
            });
         }

         if (!targetShop) {
            let image = p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';
            let location = p.shopLocation || 'Karjat, Maharashtra';
            let rating = p.rating || 4.8;
            let deliveryTime = '25-35 mins';

            if (vendorName.includes('Green Valley')) {
               image = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80';
               location = 'Karjat, Maharashtra';
               deliveryTime = '20-30 mins';
            } else if (vendorName.includes('Sunshine')) {
               image = 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&q=80';
               location = 'Nashik, Maharashtra';
               deliveryTime = '30-40 mins';
            } else if (vendorName.includes('Root Essentials')) {
               image = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80';
               location = 'Pune, Maharashtra';
               deliveryTime = '15-25 mins';
            } else if (vendorName.includes('Happy Cows') || vendorName.includes('Dairy')) {
               image = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80';
               location = 'Satara, Maharashtra';
               deliveryTime = '20-35 mins';
            } else if (vendorName.includes('Meadow Farms')) {
               image = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80';
               location = 'Mahabaleshwar, MH';
               deliveryTime = '35-45 mins';
            } else if (vendorName.includes('Orchard')) {
               image = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80';
               location = 'Ratnagiri, Maharashtra';
               deliveryTime = '30-45 mins';
            }

            const nextKey = normalizedVendorName || vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            shopMap[nextKey] = {
               id: vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
               name: vendorName,
               image,
               location,
               rating,
               deliveryTime,
               socialLinks: buildSocialLinks(p),
               updatedAt: p.updatedAt || p.createdAt || null,
               categories: new Set(),
               products: []
            };
            targetShop = shopMap[nextKey];
         }

         const fallbackSocialLinks = buildSocialLinks(p);
         targetShop.socialLinks = {
            instagram: targetShop.socialLinks?.instagram || fallbackSocialLinks.instagram || '',
            facebook: targetShop.socialLinks?.facebook || fallbackSocialLinks.facebook || '',
            youtube: targetShop.socialLinks?.youtube || fallbackSocialLinks.youtube || '',
            whatsapp: targetShop.socialLinks?.whatsapp || fallbackSocialLinks.whatsapp || '',
            website: targetShop.socialLinks?.website || fallbackSocialLinks.website || ''
         };

         const pTime = p.updatedAt || p.createdAt;
         if (pTime && (!targetShop.updatedAt || new Date(pTime) > new Date(targetShop.updatedAt))) {
            targetShop.updatedAt = pTime;
         }

         targetShop.products.push(p);
         if (p.category) targetShop.categories.add(p.category);
      });

      const result = Object.values(shopMap).map(s => ({
         ...s,
         categoryList: Array.from(s.categories)
      }));
      return result;
   }, [products, publicShopsData]);

   // Keep selectedShop in sync when shopsList updates (e.g. after publicShops loads socialLinks)
   useEffect(() => {
      if (selectedShop) {
         const updated = shopsList.find(s => {
            const normalizedCurrent = normalizeLookupText(selectedShop.name);
            const normalizedCandidate = normalizeLookupText(s.name);
            return normalizedCurrent && normalizedCandidate && normalizedCurrent === normalizedCandidate;
         });
         if (updated) setSelectedShop(updated);
      }
   }, [shopsList]);

   const [searchParams, setSearchParams] = useSearchParams();

   // Synchronize URL search params for sequential browser back button navigation
   useEffect(() => {
      const tabParam = searchParams.get('tab');
      const shopParam = searchParams.get('shop');
      const farmParam = searchParams.get('farm');

      if (tabParam === 'farms') {
         setMarketplaceTab('farms');
      } else if (tabParam === 'markets') {
         setMarketplaceTab('markets');
      }

      if (shopParam && shopsList.length > 0) {
         const normalizedShopParam = normalizeLookupText(shopParam);
         const match = shopsList.find(s => {
            const normalizedShopName = normalizeLookupText(s.name);
            return String(s.id).toLowerCase() === shopParam.toLowerCase() ||
               normalizedShopName === normalizedShopParam ||
               normalizedShopName.includes(normalizedShopParam) ||
               normalizedShopParam.includes(normalizedShopName);
         });
         if (match) {
            setSelectedShop(match);
            setSelectedFarmShop(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
         }
      } else {
         setSelectedShop(null);
      }

      if (farmParam && farmsList.length > 0) {
         const pLower = farmParam.toLowerCase();
         const match = farmsList.find(f => {
            const fSlug = getFarmSlug(f).toLowerCase();
            return (
               fSlug === pLower ||
               String(f.id).toLowerCase() === pLower ||
               f.farmName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(pLower) ||
               pLower.includes(f.farmName?.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
            );
         });
         if (match) {
            setSelectedFarmShop(match);
            setSelectedShop(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
         }
      } else {
         setSelectedFarmShop(null);
      }
   }, [searchParams, shopsList, farmsList]);

   // Filter Shops based on Category selection, Search Query (name/address), Distance Radius, and Rating
   const filteredShops = shopsList.filter(shop => {
      const matchesCategory = activeCategory === 'All' || shop.categoryList.some(cat => cat.toLowerCase() === activeCategory.toLowerCase());
      
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === '' ||
         shop.name.toLowerCase().includes(query) ||
         shop.location.toLowerCase().includes(query) ||
         shop.products.some(p => p.name.toLowerCase().includes(query));

      const dist = shop.distanceKm || getShopDistanceKm(shop.location);
      const matchesRadius = selectedRadius === 'all' || dist <= Number(selectedRadius);

      const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
         switch (rating) {
            case '4.5': return shop.rating >= 4.5;
            case '4.0': return shop.rating >= 4.0;
            case '3.5': return shop.rating >= 3.5;
            default: return true;
         }
      });

      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(shop.name);

      return matchesCategory && matchesSearch && matchesRadius && matchesRating && matchesBrand;
   }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
   });

   // Filter Farms based on Search Query (name/address), Distance Radius, and Rating
   const filteredFarms = farmsList.filter(farm => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = query === '' ||
         (farm.farmName && farm.farmName.toLowerCase().includes(query)) ||
         (farm.location && farm.location.toLowerCase().includes(query)) ||
         (farm.vendorName && farm.vendorName.toLowerCase().includes(query)) ||
         (Array.isArray(farm.crops) && farm.crops.some(c => String(c).toLowerCase().includes(query)));

      const dist = farm.distanceKm || getShopDistanceKm(farm.location);
      const matchesRadius = selectedRadius === 'all' || dist <= Number(selectedRadius);

      const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
         const fRating = farm.rating || 4.9;
         return fRating >= Number(rating);
      });

      return matchesSearch && matchesRadius && matchesRating;
   });

   // Filter products when inside a Selected Shop Storefront using active filters
   const shopProducts = React.useMemo(() => {
      return (selectedShop?.products || []).filter(p => {
         const effectiveCat = shopActiveCategory !== 'All' ? shopActiveCategory : activeCategory;
         const matchesCategory = effectiveCat === 'All' || (p.category && p.category.toLowerCase() === effectiveCat.toLowerCase());
         const query = shopSearchQuery || searchQuery;
         const matchesSearch = query === '' || p.name.toLowerCase().includes(query.toLowerCase()) || (p.category && p.category.toLowerCase().includes(query.toLowerCase()));
         
         const matchesRating = ratingFilters.length === 0 || ratingFilters.some(rating => {
            const pRating = p.rating || selectedShop?.rating || 4.8;
            return pRating >= Number(rating);
         });

         const matchesPrice = priceRanges.length === 0 || priceRanges.some(range => {
            const price = Number(p.price) || 0;
            switch (range) {
               case 'under5': return price < 50;
               case '5to10': return price >= 50 && price <= 100;
               case '10to20': return price > 100 && price <= 200;
               case 'over20': return price > 200;
               default: return true;
            }
         });

         const matchesDiscount = discountFilters.length === 0 || discountFilters.some(disc => {
            const d = Number(p.discount || 0);
            return d >= Number(disc);
         });

         return matchesCategory && matchesSearch && matchesRating && matchesPrice && matchesDiscount;
      }).sort((a, b) => {
         if (sortBy === 'price-low' || sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
         if (sortBy === 'price-high' || sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
         if (sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
         return 0;
      });
   }, [selectedShop, shopActiveCategory, activeCategory, shopSearchQuery, searchQuery, ratingFilters, priceRanges, discountFilters, sortBy]);

   const renderSidebarFilters = () => (
      <div className="lg:w-76 flex-shrink-0 text-left lg:sticky lg:top-24 h-fit">
         <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-emerald-950/[0.02] border border-white max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar pr-2">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
               <h3 className="text-base font-extrabold text-gray-900 font-headings">Filters</h3>
               <div className="flex gap-2 items-center">
                  <button
                     type="button"
                     onClick={() => setShowFilters(!showFilters)}
                     className="px-3 py-1.5 text-[11px] font-extrabold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                     Hide
                  </button>
                  {(activeCategory !== 'All' || farmActiveCategory !== 'All' || shopActiveCategory !== 'All' || sortBy !== 'none' || searchQuery !== '' || farmSearchQuery !== '' || shopSearchQuery !== '' || priceRanges.length > 0 || ratingFilters.length > 0 || selectedBrands.length > 0 || discountFilters.length > 0 || selectedRadius !== 'all') && (
                     <button
                        type="button"
                        onClick={() => {
                           setPriceRanges([]);
                           setRatingFilters([]);
                           setSelectedBrands([]);
                           setDiscountFilters([]);
                           setSearchQuery('');
                           setShopSearchQuery('');
                           setFarmSearchQuery('');
                           setSortBy('none');
                           setActiveCategory('All');
                           setShopActiveCategory('All');
                           setFarmActiveCategory('All');
                           setSelectedRadius('all');
                        }}
                        className="px-3 py-1.5 text-[11px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer font-headings"
                     >
                        Clear All
                     </button>
                  )}
               </div>
            </div>

            {/* Distance Radius Filter Section in Sidebar */}
            <div className="mb-6 border-b border-gray-100 pb-5 text-left">
               <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-headings">
                  <MapPin size={14} className="text-emerald-600" /> Distance Radius
               </label>
               <div className="space-y-2">
                  {[
                     { label: 'All Locations', value: 'all' },
                     { label: 'Within 5 km radius', value: '5' },
                     { label: 'Within 10 km radius', value: '10' },
                     { label: 'Within 25 km radius', value: '25' },
                     { label: 'Within 50 km radius', value: '50' }
                  ].map(r => (
                     <label key={r.value} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-emerald-800 cursor-pointer transition-colors">
                        <input
                           type="radio"
                           name="radiusFilter"
                           checked={selectedRadius === r.value}
                           onChange={() => setSelectedRadius(r.value)}
                           className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span>{r.label}</span>
                     </label>
                  ))}
               </div>
            </div>

            {/* High-visibility Search Filter */}
            <div className="mb-6 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 p-3.5 rounded-2xl border-2 border-emerald-500/30 shadow-sm focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:bg-white transition-all">
               <label className="block text-xs font-extrabold text-emerald-950 uppercase tracking-wider mb-2 flex items-center justify-between font-headings">
                  <span className="flex items-center gap-1.5">
                     <Search size={14} className="text-emerald-600" />
                     Search Products
                  </span>
                  {(searchQuery || shopSearchQuery || farmSearchQuery) && (
                     <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setShopSearchQuery(''); setFarmSearchQuery(''); }}
                        className="text-[10px] text-emerald-700 hover:text-red-600 font-bold underline cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </label>
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 group-focus-within:text-emerald-700 transition-colors" size={16} />
                  <input
                     type="text"
                     placeholder="Search produce, items..."
                     value={selectedShop ? shopSearchQuery : selectedFarmShop ? farmSearchQuery : searchQuery}
                     onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        if (selectedShop) setShopSearchQuery(val);
                        if (selectedFarmShop) setFarmSearchQuery(val);
                     }}
                     className="w-full pl-9 pr-8 py-2 bg-white border border-emerald-300/70 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 transition-all text-xs font-semibold text-gray-900 shadow-inner placeholder-gray-400 font-body"
                  />
                  {(searchQuery || shopSearchQuery || farmSearchQuery) && (
                     <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setShopSearchQuery(''); setFarmSearchQuery(''); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Clear search"
                     >
                        <X size={14} />
                     </button>
                  )}
               </div>
            </div>

            {/* Sort By */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">Sort By</label>
                  {sortBy !== 'none' && (
                     <button
                        type="button"
                        onClick={() => setSortBy('none')}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </div>
               <div className="space-y-1.5 font-body">
                  <button onClick={() => setSortBy('none')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'none' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>Recommended</button>
                  <button onClick={() => setSortBy('price-low')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'price-low' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>Price: Low to High</button>
                  <button onClick={() => setSortBy('price-high')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'price-high' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>Price: High to Low</button>
                  <button onClick={() => setSortBy('rating')} className={`w-full text-left px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${sortBy === 'rating' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}>Highest Rated</button>
               </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">Price Range</label>
                  {priceRanges.length > 0 && (
                     <button
                        type="button"
                        onClick={() => setPriceRanges([])}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </div>
               <div className="space-y-2.5 font-body">
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={priceRanges.includes('under5')}
                        onChange={(e) => {
                           if (e.target.checked) setPriceRanges([...priceRanges, 'under5']);
                           else setPriceRanges(priceRanges.filter(r => r !== 'under5'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">Under ₹50</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={priceRanges.includes('5to10')}
                        onChange={(e) => {
                           if (e.target.checked) setPriceRanges([...priceRanges, '5to10']);
                           else setPriceRanges(priceRanges.filter(r => r !== '5to10'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">₹50 - ₹100</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={priceRanges.includes('10to20')}
                        onChange={(e) => {
                           if (e.target.checked) setPriceRanges([...priceRanges, '10to20']);
                           else setPriceRanges(priceRanges.filter(r => r !== '10to20'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">₹100 - ₹200</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={priceRanges.includes('over20')}
                        onChange={(e) => {
                           if (e.target.checked) setPriceRanges([...priceRanges, 'over20']);
                           else setPriceRanges(priceRanges.filter(r => r !== 'over20'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">Over ₹200</span>
                  </label>
               </div>
            </div>

            {/* Rating */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">Rating</label>
                  {ratingFilters.length > 0 && (
                     <button
                        type="button"
                        onClick={() => setRatingFilters([])}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </div>
               <div className="space-y-2.5 font-body">
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={ratingFilters.includes('4.5')}
                        onChange={(e) => {
                           if (e.target.checked) setRatingFilters([...ratingFilters, '4.5']);
                           else setRatingFilters(ratingFilters.filter(r => r !== '4.5'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors flex items-center">
                        <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 4.5 & above
                     </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={ratingFilters.includes('4.0')}
                        onChange={(e) => {
                           if (e.target.checked) setRatingFilters([...ratingFilters, '4.0']);
                           else setRatingFilters(ratingFilters.filter(r => r !== '4.0'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors flex items-center">
                        <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 4.0 & above
                     </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={ratingFilters.includes('3.5')}
                        onChange={(e) => {
                           if (e.target.checked) setRatingFilters([...ratingFilters, '3.5']);
                           else setRatingFilters(ratingFilters.filter(r => r !== '3.5'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors flex items-center">
                        <Star size={13} className="fill-amber-400 text-amber-400 mr-1" /> 3.5 & above
                     </span>
                  </label>
               </div>
            </div>

            {/* Discount */}
            <div className="mb-6">
               <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-headings">Discount</label>
                  {discountFilters.length > 0 && (
                     <button
                        type="button"
                        onClick={() => setDiscountFilters([])}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                     >
                        Clear
                     </button>
                  )}
               </div>
               <div className="space-y-2.5 font-body">
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={discountFilters.includes('10')}
                        onChange={(e) => {
                           if (e.target.checked) setDiscountFilters([...discountFilters, '10']);
                           else setDiscountFilters(discountFilters.filter(d => d !== '10'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">10% or more</span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                     <input
                        type="checkbox"
                        checked={discountFilters.includes('20')}
                        onChange={(e) => {
                           if (e.target.checked) setDiscountFilters([...discountFilters, '20']);
                           else setDiscountFilters(discountFilters.filter(d => d !== '20'));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                     />
                     <span className="ml-2.5 text-xs text-gray-600 font-semibold group-hover:text-emerald-600 transition-colors">20% or more</span>
                  </label>
               </div>
            </div>
         </div>
      </div>
   );

   return (
      <div className="flex flex-col min-h-screen py-12">

         {/* Category Tiles (Only shown when browsing all shops) */}
         {!selectedShop && (
            <section className="py-6 relative">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                     </h2>

                     {/* Navigation Controls for Mouse Users */}
                     <div className="flex items-center gap-2">
                        <button
                           type="button"
                           onClick={() => scrollRow(categoriesTilesRef, 'left')}
                           className="w-9 h-9 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                           title="Scroll Left"
                        >
                           <ChevronLeft size={18} />
                        </button>
                        <button
                           type="button"
                           onClick={() => scrollRow(categoriesTilesRef, 'right')}
                           className="w-9 h-9 rounded-xl bg-white/80 border border-gray-200 text-gray-600 hover:text-brand hover:border-brand/40 hover:bg-brand-light/30 shadow-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                           title="Scroll Right"
                        >
                           <ChevronRight size={18} />
                        </button>
                     </div>
                  </div>

                  <div
                     ref={categoriesTilesRef}
                     onMouseDown={handleMouseDownTiles}
                     onMouseMove={handleMouseMoveTiles}
                     onMouseUp={handleMouseUpTiles}
                     onMouseLeave={handleMouseUpTiles}
                     className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide snap-x items-center select-none cursor-grab active:cursor-grabbing"
                  >
                     {categoriesWithDetails.map((cat, idx) => (
                        <button
                           key={cat.name || idx}
                           onClick={() => handleCategoryClick(cat.name)}
                           className={`flex-shrink-0 w-28 flex flex-col items-center gap-2.5 bg-white/60 backdrop-blur-md border border-white rounded-3xl p-3.5 hover:shadow-xl hover:shadow-emerald-950/[0.03] hover:border-brand/35 transition-all duration-300 group snap-start ${
                              activeCategory === cat.name ? 'ring-2 ring-brand bg-brand-light/30 border-brand' : ''
                           }`}
                        >
                           <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-50 bg-emerald-50/20 shadow-sm flex items-center justify-center bg-slate-100">
                              <img
                                 src={cat.image || '/cherry_tomatoes.png'}
                                 alt={cat.name}
                                 className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                                 onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80';
                                 }}
                              />
                           </div>
                           <span className="text-[10px] uppercase tracking-wider text-gray-600 font-bold truncate max-w-[90px] text-center">
                              {cat.name}
                           </span>
                        </button>
                     ))}
                  </div>
               </div>
            </section>
         )}

         {/* ── Zomato-Style Shop & Marketplace Section ── */}
         <section id="marketplace" className="py-6 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

               {/* ── Top Header & Tab Switcher (Markets vs Farms) ── */}
               {!selectedShop && !selectedFarmShop && (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-6">
                     <div className="text-left space-y-1">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 font-headings">
                           {marketplaceTab === 'markets' ? 'Local Organic Shops & Markets' : 'Registered Farms Direct Harvest'}
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        </h2>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">
                           {marketplaceTab === 'markets'
                              ? 'Select a certified local shop below to view its fresh produce storefront & order direct harvest.'
                              : 'Select an authentic farm below to view produce harvested directly on its soil by the vendor.'}
                        </p>
                     </div>

                     {/* Two Main Tabs: Markets & Farms */}
                     <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                        <button
                           type="button"
                           onClick={() => {
                              setSearchParams({ tab: 'markets' });
                           }}
                           className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer font-headings ${
                              marketplaceTab === 'markets'
                                 ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                 : 'text-slate-600 hover:bg-slate-100'
                           }`}
                        >
                           <Store size={15} /> Markets ({filteredShops.length})
                        </button>
                        <button
                           type="button"
                           onClick={() => {
                              setSearchParams({ tab: 'farms' });
                           }}
                           className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer font-headings ${
                              marketplaceTab === 'farms'
                                 ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                 : 'text-slate-600 hover:bg-slate-100'
                           }`}
                        >
                           <Sprout size={15} /> Farms ({filteredFarms.length})
                        </button>
                     </div>
                  </div>
               )}

               {/* ── Search & Distance Radius Filter Bar ── */}
               {!selectedShop && !selectedFarmShop && (
                  <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xl shadow-emerald-950/[0.03] space-y-4 text-left">
                     <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                        {/* Search Input for Markets & Farms by Name or Location Address */}
                        <div className="relative flex-1 group">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 group-focus-within:text-emerald-700 transition-colors" size={18} />
                           <input
                              type="text"
                              placeholder="Search markets & farms by name or location address (e.g. Karjat, Mahabaleshwar, Pune)..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-11 pr-32 py-3 bg-slate-50 border-2 border-emerald-500/20 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner font-body"
                           />
                           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {searchQuery && (
                                 <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer mr-1"
                                    title="Clear search"
                                 >
                                    <X size={16} />
                                 </button>
                              )}
                              {/* Detect GPS Location Button */}
                              <button
                                 type="button"
                                 onClick={handleDetectUserLocation}
                                 disabled={isFetchingGps}
                                 className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer font-headings shrink-0 ${
                                    userGpsCoords
                                       ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                       : 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-600 hover:text-white'
                                 }`}
                                 title="Detect your precise GPS coordinates for live distance calculation"
                              >
                                 {isFetchingGps ? (
                                    <Loader2 size={13} className="animate-spin text-emerald-600" />
                                 ) : (
                                    <Target size={13} />
                                 )}
                                 <span className="hidden sm:inline">{userGpsCoords ? 'GPS Active' : 'Use GPS'}</span>
                              </button>
                           </div>
                        </div>

                        {/* Distance Radius Filter Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-xs font-black text-slate-700 font-headings uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
                              <MapPin size={14} className="text-emerald-600" /> DISTANCE RADIUS:
                           </span>
                           {[
                              { label: 'All Distances', value: 'all' },
                              { label: 'Within 5 km', value: '5' },
                              { label: 'Within 10 km', value: '10' },
                              { label: 'Within 25 km', value: '25' },
                              { label: 'Within 50 km', value: '50' }
                           ].map(r => (
                              <button
                                 key={r.value}
                                 type="button"
                                 onClick={() => setSelectedRadius(r.value)}
                                 className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer font-headings flex items-center gap-1.5 ${
                                    selectedRadius === r.value
                                       ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102 border border-emerald-500'
                                       : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                                 }`}
                              >
                                 {r.value !== 'all' && <Compass size={13} className={selectedRadius === r.value ? 'text-white' : 'text-emerald-600'} />}
                                 {r.label}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Popular Location Address Quick-Chips Bar */}
                     <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                        <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider font-headings mr-1 flex items-center gap-1">
                           <Sparkles size={12} className="text-amber-500" /> Popular Regions:
                        </span>
                        {['Karjat', 'Mahabaleshwar', 'Pune', 'Nashik', 'Satara', 'Ratnagiri', 'Anantapur'].map(city => (
                           <button
                              key={city}
                              type="button"
                              onClick={() => setSearchQuery(city)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer font-headings ${
                                 searchQuery.toLowerCase().includes(city.toLowerCase())
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
                              }`}
                           >
                              📍 {city}
                           </button>
                        ))}
                     </div>

                     {/* GPS Status Message & Active Filter Indicators */}
                     {(gpsMessage || searchQuery || selectedRadius !== 'all' || userGpsCoords) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                           <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider font-headings">Active Filters:</span>
                              {userGpsCoords && (
                                 <span className="bg-emerald-600 text-white px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 text-[11px] shadow-xs">
                                    <Target size={12} /> {userGpsCoords.label}
                                    <X size={12} className="cursor-pointer hover:text-rose-200 transition-colors" onClick={() => setUserGpsCoords(null)} />
                                 </span>
                              )}
                              {searchQuery && (
                                 <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 text-[11px]">
                                    🔍 Search: "{searchQuery}"
                                    <X size={12} className="cursor-pointer hover:text-rose-600 transition-colors" onClick={() => setSearchQuery('')} />
                                 </span>
                              )}
                              {selectedRadius !== 'all' && (
                                 <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 text-[11px]">
                                    📍 Radius: Within {selectedRadius} km
                                    <X size={12} className="cursor-pointer hover:text-rose-600 transition-colors" onClick={() => setSelectedRadius('all')} />
                                 </span>
                              )}
                           </div>

                           <button
                              type="button"
                              onClick={() => { setSearchQuery(''); setSelectedRadius('all'); setUserGpsCoords(null); setGpsMessage(''); }}
                              className="text-rose-600 hover:underline font-bold text-xs cursor-pointer ml-auto"
                           >
                              Reset All Filters
                           </button>
                        </div>
                     )}
                  </div>
               )}

               {/* ── CASE 1: USER SELECTED A FARM SHOP (FARMS TAB STOREFRONT) ── */}
               {selectedFarmShop ? (
                  <div className="space-y-6 animate-fade-in text-left">
                     {/* Back Button & Direct Farm Navigation Bar */}
                     <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                           type="button"
                           onClick={() => {
                              if (window.history.length > 1) navigate(-1);
                              else setSearchParams({ tab: 'farms' });
                              setFarmSearchQuery('');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                           }}
                           className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-xs cursor-pointer"
                        >
                           <ArrowLeft size={16} /> Back to All Organic Farms
                        </button>

                        <button
                           type="button"
                           onClick={() => {
                              const slug = selectedFarmShop.farmName
                                 ? selectedFarmShop.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                 : selectedFarmShop.id;
                              navigate(`/farm/${slug}`);
                           }}
                           className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer font-headings"
                        >
                           <Compass size={16} /> Explore Farm Page →
                        </button>
                     </div>

                     {/* Farm Hero Storefront Banner */}
                     {/* Farm Shop Location Address & Map Redirect Bar */}
                     <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                              <MapPin size={20} />
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-headings">Farm Shop Location Address:</h4>
                              <p
                                 onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)}
                                 className="text-xs font-bold text-emerald-900 hover:text-emerald-600 hover:underline cursor-pointer transition-colors truncate mt-0.5"
                                 title="Click to open location in Google Maps"
                              >
                                 📍 {selectedFarmShop.location}
                              </p>
                           </div>
                        </div>
                        <button
                           type="button"
                           onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)}
                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 font-headings"
                        >
                           <Navigation size={14} /> Open Location in Maps ↗
                        </button>
                     </div>

                     <div className="relative rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-white">
                        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-900">
                           <img
                              src={selectedFarmShop.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80'}
                              alt={selectedFarmShop.farmName}
                              className="w-full h-full object-cover opacity-80"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                           {/* Storefront Header Overlay */}
                           <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col md:flex-row md:items-end justify-between gap-4">
                              <div className="space-y-2">
                                 <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm font-mono">
                                       <Sprout size={12} /> Direct Farm Harvest
                                    </span>
                                    <span className="bg-black/50 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                                       <Star size={12} className="fill-current" /> ★ {selectedFarmShop.rating || 4.9} Rating
                                    </span>
                                 </div>
                                 <h1 className="text-2xl sm:text-4xl font-black font-headings text-white leading-tight drop-shadow-md">
                                    {selectedFarmShop.farmName}
                                 </h1>
                                 <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
                                    <span onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)} className="flex items-center gap-1.5 hover:underline hover:text-emerald-300 cursor-pointer" title="Click to open location in Google Maps"><MapPin size={14} className="text-emerald-400" /> {selectedFarmShop.location} ↗</span>
                                    <span className="flex items-center gap-1.5"><Store size={14} className="text-emerald-400" /> Owner: {selectedFarmShop.vendorName || 'Farm Owner'}</span>
                                    <span className="flex items-center gap-1.5"><Sprout size={14} className="text-emerald-400" /> {selectedFarmProducts.length} Direct Farm Products</span>
                                    <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs font-mono">
                                       <Clock size={13} className="text-emerald-400" />
                                       <span>Page Updated: {formatUpdatedTime(selectedFarmShop.updatedAt || selectedFarmShop.createdAt) || 'Recently Updated'}</span>
                                    </span>
                                 </div>

                                 {/* Customer Social Media Links Bar for Selected Farm Shop */}
                                 {(() => {
                                    const farmSocials = resolveShopSocialLinks(selectedFarmShop, publicShopsData);
                                    const hasSocials = farmSocials.instagram || farmSocials.facebook || farmSocials.youtube || farmSocials.whatsapp || farmSocials.website;
                                    if (!hasSocials) return null;
                                    return (
                                       <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20 mt-2">
                                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-headings mr-1">Social Links:</span>
                                          {farmSocials.instagram && (
                                             <a
                                                href={farmSocials.instagram.startsWith('http') ? farmSocials.instagram : `https://instagram.com/${farmSocials.instagram.replace('@', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                                             >
                                                <Instagram size={12} /> <span>Instagram</span>
                                             </a>
                                          )}
                                          {farmSocials.facebook && (
                                             <a
                                                href={farmSocials.facebook.startsWith('http') ? farmSocials.facebook : `https://facebook.com/${farmSocials.facebook}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                                             >
                                                <Facebook size={12} /> <span>Facebook</span>
                                             </a>
                                          )}
                                          {farmSocials.youtube && (
                                             <a
                                                href={farmSocials.youtube.startsWith('http') ? farmSocials.youtube : `https://youtube.com/${farmSocials.youtube}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1 rounded-xl bg-red-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                                             >
                                                <Youtube size={12} /> <span>YouTube</span>
                                             </a>
                                          )}
                                          {farmSocials.whatsapp && (
                                             <a
                                                href={farmSocials.whatsapp.startsWith('http') ? farmSocials.whatsapp : `https://wa.me/${farmSocials.whatsapp.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                                             >
                                                <MessageCircle size={12} /> <span>WhatsApp</span>
                                             </a>
                                          )}
                                          {farmSocials.website && (
                                             <a
                                                href={farmSocials.website.startsWith('http') ? farmSocials.website : `https://${farmSocials.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-2.5 py-1 rounded-xl bg-slate-800 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings border border-white/20"
                                             >
                                                <Globe size={12} /> <span>Website</span>
                                             </a>
                                          )}
                                       </div>
                                    );
                                 })()}
                              </div>

                              <button
                                 type="button"
                                 onClick={() => {
                                    const slug = selectedFarmShop.farmName
                                       ? selectedFarmShop.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                       : selectedFarmShop.id;
                                    navigate(`/farm/${slug}`);
                                 }}
                                 className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black font-headings flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 border border-emerald-400/40 active:scale-95 transition-all cursor-pointer shrink-0"
                              >
                                 <Compass size={16} /> Explore Farm Page →
                              </button>
                           </div>
                        </div>

                        {/* In-Farm Search & Category Filter Bar */}
                        <div className="p-4 sm:p-6 bg-white/90 backdrop-blur-md flex flex-col space-y-4 border-t border-slate-100">
                           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="w-full md:w-80 relative">
                                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                                 <input
                                    type="text"
                                    placeholder={`Search direct harvest products in ${selectedFarmShop.farmName}...`}
                                    value={farmSearchQuery}
                                    onChange={(e) => setFarmSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500 font-body"
                                 />
                                 {farmSearchQuery && (
                                    <button onClick={() => setFarmSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                       <X size={14} />
                                    </button>
                                 )}
                              </div>

                              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
                                 {farmCategoryList.map(cat => (
                                    <button
                                       key={cat}
                                       onClick={() => setFarmActiveCategory(cat)}
                                       className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                          (farmActiveCategory === cat || (farmActiveCategory === 'All' && activeCategory === cat))
                                             ? 'bg-emerald-600 text-white shadow-xs'
                                             : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                       }`}
                                    >
                                       {cat}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Active Filter Badges Bar */}
                           {(activeCategory !== 'All' || farmActiveCategory !== 'All' || searchQuery !== '' || farmSearchQuery !== '' || ratingFilters.length > 0) && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                                 <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider">Active Filters:</span>
                                 {(farmActiveCategory !== 'All' || activeCategory !== 'All') && (
                                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Category: {farmActiveCategory !== 'All' ? farmActiveCategory : activeCategory}
                                       <X size={12} className="cursor-pointer hover:text-emerald-950" onClick={() => { setFarmActiveCategory('All'); setActiveCategory('All'); }} />
                                    </span>
                           )}
                                 {(farmSearchQuery || searchQuery) && (
                                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Search: "{farmSearchQuery || searchQuery}"
                                       <X size={12} className="cursor-pointer hover:text-emerald-950" onClick={() => { setFarmSearchQuery(''); setSearchQuery(''); }} />
                                    </span>
                                 )}
                                 {ratingFilters.length > 0 && (
                                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Rating: ★ {ratingFilters.join(', ')}
                                       <X size={12} className="cursor-pointer hover:text-amber-950" onClick={() => setRatingFilters([])} />
                                    </span>
                                 )}
                                 <button
                                    onClick={() => {
                                       setFarmActiveCategory('All');
                                       setActiveCategory('All');
                                       setFarmSearchQuery('');
                                       setSearchQuery('');
                                       setRatingFilters([]);
                                    }}
                                    className="text-rose-600 hover:underline font-bold text-xs ml-2 cursor-pointer"
                                 >
                                    Reset Filters
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Direct Harvest Products with Left Sidebar Filters for Selected Farm */}
                     <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Sidebar - Filters */}
                        {showFilters && renderSidebarFilters()}

                        {/* Right Side - Products Grid */}
                        <div className="flex-1">
                           {!showFilters && (
                              <div className="mb-4 text-left">
                                 <button
                                    onClick={() => setShowFilters(true)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                                 >
                                    Show Filters
                                 </button>
                              </div>
                           )}

                           <h3 className="text-base font-extrabold text-slate-800 font-headings mb-4">
                              Direct Farm Harvest Products ({filteredFarmProducts.length})
                           </h3>

                           {filteredFarmProducts.length === 0 ? (
                              <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                                 <Sprout size={36} className="mx-auto text-slate-300 mb-2" />
                                 <h4 className="font-bold text-slate-800 text-sm font-headings">No direct farm harvest products listed yet</h4>
                                 <p className="text-xs text-slate-400 font-medium">The vendor has not listed any direct harvest products matching your active filters.</p>
                              </div>
                           ) : (
                              <div className={`grid gap-6 ${showFilters ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                 {filteredFarmProducts.map((product, idx) => (
                                    <div
                                       key={product.id || idx}
                                       onClick={() => navigate(`/product/${getProductSlug(product)}`)}
                                       className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                                    >
                                       <div className="relative h-48 overflow-hidden bg-gray-50 flex items-center justify-center">
                                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" />
                                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-800 shadow-sm border border-emerald-100/40">
                                             {product.category}
                                          </div>
                                       </div>
                                       <div className="p-4 flex flex-col flex-1 text-left justify-between">
                                          <div>
                                             <div className="flex justify-between items-start mb-1 gap-2">
                                                <h4 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors text-sm line-clamp-1 font-headings">{product.name}</h4>
                                                <div className="flex items-center text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0">
                                                   <Star size={11} className="mr-0.5 fill-current" /> {product.rating || 5.0}
                                                </div>
                                             </div>
                                             <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-3">🌾 100% Farm Soil Direct Harvest</p>
                                          </div>

                                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                             <div>
                                                <span className="text-lg font-black text-gray-900 font-sans">₹{product.price}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">/{product.unit}</span>
                                             </div>
                                             {(() => {
                                                const cartItem = cartItems.find(item => String(item.id) === String(product.id));
                                                return cartItem ? (
                                                   <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-xs" onClick={(e) => e.stopPropagation()}>
                                                      <button
                                                         type="button"
                                                         onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                         className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-90 font-black cursor-pointer"
                                                      >
                                                         <Minus size={11} strokeWidth={3} />
                                                      </button>
                                                      <span className="text-xs font-black text-slate-800 px-1 font-sans text-center min-w-[16px]">{cartItem.quantity}</span>
                                                      <button
                                                         type="button"
                                                         onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                         className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-90 font-black cursor-pointer"
                                                      >
                                                         <Plus size={11} strokeWidth={3} />
                                                      </button>
                                                   </div>
                                                ) : (
                                                   <button
                                                      type="button"
                                                      onClick={(e) => {
                                                         e.stopPropagation();
                                                         addToCart(product);
                                                      }}
                                                      className="bg-emerald-600 text-white hover:bg-emerald-700 p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
                                                      title="Add to Cart"
                                                   >
                                                      <ShoppingCart size={15} />
                                                   </button>
                                                );
                                             })()}
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ) : selectedShop ? (
                  /* ── CASE 2: USER SELECTED A MARKET SHOP (MARKETS TAB STOREFRONT) ── */
                  <div className="space-y-6 animate-fade-in text-left">
                     {/* Back Button */}
                     <button
                        type="button"
                        onClick={() => {
                           setSelectedShop(null);
                           setShopSearchQuery('');
                           setShopActiveCategory('All');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all shadow-xs cursor-pointer"
                     >
                        <ArrowLeft size={16} /> Back to All Organic Shops
                     </button>

                     {/* Shop Hero Storefront Banner */}
                     <div className="relative rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-white">
                        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-900">
                           <img
                              src={selectedShop.image}
                              alt={selectedShop.name}
                              className="w-full h-full object-cover opacity-80"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                           {/* Storefront Header Overlay */}
                           <div className="absolute bottom-0 left-0 right-0 p-6 text-white space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                 <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm font-mono">
                                    <CheckCircle size={12} /> Certified Organic Vendor
                                 </span>
                                 <span className="bg-black/50 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                                    <Star size={12} className="fill-current" /> ★ {selectedShop.rating} Rating
                                 </span>
                              </div>
                              <h1 className="text-2xl sm:text-4xl font-black font-headings text-white leading-tight drop-shadow-md">
                                 {selectedShop.name}
                              </h1>
                              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
                                 <span onClick={(e) => openLocationInMaps(selectedShop.location, e)} className="flex items-center gap-1.5 hover:underline hover:text-emerald-300 cursor-pointer" title="Click to open location in Google Maps"><MapPin size={14} className="text-emerald-400" /> {selectedShop.location} ↗</span>
                                 <span className="flex items-center gap-1.5"><Clock size={14} className="text-emerald-400" /> {selectedShop.deliveryTime} Express Delivery</span>
                                 <span className="flex items-center gap-1.5"><Store size={14} className="text-emerald-400" /> {selectedShop.products.length} Fresh Produce Available</span>
                                 <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs font-mono">
                                    <Clock size={13} className="text-emerald-400" />
                                    <span>Page Updated: {formatUpdatedTime(selectedShop.updatedAt || selectedShop.createdAt) || 'Recently Updated'}</span>
                                 </span>
                                 {/* Customer Social Media Links Bar */}
                                 {(() => {
                                    const shopSocials = resolveShopSocialLinks(selectedShop, publicShopsData);
                                    const hasSocials = Object.values(shopSocials).some(val => val);
                                    if (!hasSocials) return null;
                                    return (
                                       <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20 mt-2">
                                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-headings mr-1">Social Links:</span>
                                          {shopSocials.instagram && (
                                             <a href={shopSocials.instagram.startsWith('http') ? shopSocials.instagram : `https://instagram.com/${shopSocials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"><Instagram size={12} /> <span>Instagram</span></a>
                                          )}
                                          {shopSocials.facebook && (
                                             <a href={shopSocials.facebook.startsWith('http') ? shopSocials.facebook : `https://facebook.com/${shopSocials.facebook}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"><Facebook size={12} /> <span>Facebook</span></a>
                                          )}
                                          {shopSocials.youtube && (
                                             <a href={shopSocials.youtube.startsWith('http') ? shopSocials.youtube : `https://youtube.com/${shopSocials.youtube}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-xl bg-red-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"><Youtube size={12} /> <span>YouTube</span></a>
                                          )}
                                          {shopSocials.whatsapp && (
                                             <a href={shopSocials.whatsapp.startsWith('http') ? shopSocials.whatsapp : `https://wa.me/${shopSocials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"><MessageCircle size={12} /> <span>WhatsApp</span></a>
                                          )}
                                          {shopSocials.website && (
                                             <a href={shopSocials.website.startsWith('http') ? shopSocials.website : `https://${shopSocials.website}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-xl bg-slate-800 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings border border-white/20"><Globe size={12} /> <span>Website</span></a>
                                          )}
                                       </div>
                                    );
                                 })()}
                              </div>
                           </div>
                        </div>

                        {/* In-Shop Search & Filter Bar */}
                        <div className="p-4 sm:p-6 bg-white/90 backdrop-blur-md flex flex-col space-y-4 border-t border-slate-100">
                           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="w-full md:w-80 relative">
                                 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={16} />
                                 <input
                                    type="text"
                                    placeholder={`Search products in ${selectedShop.name}...`}
                                    value={shopSearchQuery}
                                    onChange={(e) => setShopSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-emerald-500 font-body"
                                 />
                                 {shopSearchQuery && (
                                    <button onClick={() => setShopSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
                                       <X size={14} />
                                    </button>
                                 )}
                              </div>

                              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
                                 <button
                                    onClick={() => setShopActiveCategory('All')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                       shopActiveCategory === 'All' && activeCategory === 'All' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                 >
                                    All Items ({selectedShop.products.length})
                                 </button>
                                 {selectedShop.categoryList.map(cat => (
                                    <button
                                       key={cat}
                                       onClick={() => setShopActiveCategory(cat)}
                                       className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                          (shopActiveCategory === cat || (shopActiveCategory === 'All' && activeCategory === cat)) ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                       }`}
                                    >
                                       {cat}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Active Filter Badges Bar */}
                           {(activeCategory !== 'All' || shopActiveCategory !== 'All' || searchQuery !== '' || shopSearchQuery !== '' || ratingFilters.length > 0) && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                                 <span className="font-extrabold text-slate-500 text-[11px] uppercase tracking-wider">Active Filters:</span>
                                 {(shopActiveCategory !== 'All' || activeCategory !== 'All') && (
                                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Category: {shopActiveCategory !== 'All' ? shopActiveCategory : activeCategory}
                                       <X size={12} className="cursor-pointer hover:text-emerald-950" onClick={() => { setShopActiveCategory('All'); setActiveCategory('All'); }} />
                                    </span>
                                 )}
                                 {(shopSearchQuery || searchQuery) && (
                                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Search: "{shopSearchQuery || searchQuery}"
                                       <X size={12} className="cursor-pointer hover:text-emerald-950" onClick={() => { setShopSearchQuery(''); setSearchQuery(''); }} />
                                    </span>
                                 )}
                                 {ratingFilters.length > 0 && (
                                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 text-[11px]">
                                       Rating: ★ {ratingFilters.join(', ')}
                                       <X size={12} className="cursor-pointer hover:text-amber-950" onClick={() => setRatingFilters([])} />
                                    </span>
                                 )}
                                 <button
                                    onClick={() => {
                                       setShopActiveCategory('All');
                                       setActiveCategory('All');
                                       setShopSearchQuery('');
                                       setSearchQuery('');
                                       setRatingFilters([]);
                                    }}
                                    className="text-rose-600 hover:underline font-bold text-xs ml-2 cursor-pointer"
                                 >
                                    Reset Filters
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>

                        {/* Product Cards Grid with Left Sidebar Filters for Selected Market Shop */}
                        <div className="flex flex-col lg:flex-row gap-8">
                           {/* Left Sidebar - Filters */}
                           {showFilters && renderSidebarFilters()}

                           {/* Right Side - Products Grid */}
                           <div className="flex-1">
                              {!showFilters && (
                                 <div className="mb-4 text-left">
                                    <button
                                       onClick={() => setShowFilters(true)}
                                       className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                                    >
                                       Show Filters
                                    </button>
                                 </div>
                              )}

                              <h3 className="text-base font-extrabold text-slate-800 font-headings mb-4">
                                 Available Harvest & Items ({shopProducts.length})
                              </h3>

                              {shopProducts.length === 0 ? (
                                 <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
                                    <Search size={32} className="mx-auto text-slate-300 mb-2" />
                                    <h4 className="font-bold text-slate-800 text-sm font-headings">No products found</h4>
                                    <p className="text-xs text-slate-400 font-medium">Try clearing your search or selecting another category.</p>
                                 </div>
                              ) : (
                                 <div className={`grid gap-6 ${showFilters ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                                    {shopProducts.map(product => (
                                       <div
                                          key={product.id}
                                          onClick={() => navigate(`/product/${getProductSlug(product)}`)}
                                          className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
                                       >
                                          <div className="relative h-48 overflow-hidden bg-gray-50 flex items-center justify-center">
                                             <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500" />
                                             <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-800 shadow-sm border border-emerald-100/40">
                                                {product.category}
                                             </div>
                                          </div>
                                          <div className="p-4 flex flex-col flex-1 text-left justify-between">
                                             <div>
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                   <h4 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors text-sm line-clamp-1 font-headings">{product.name}</h4>
                                                   <div className="flex items-center text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg shrink-0">
                                                      <Star size={11} className="mr-0.5 fill-current" /> {product.rating}
                                                   </div>
                                                </div>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-3">100% Organic Direct Harvest</p>
                                             </div>

                                             <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                <div>
                                                   <span className="text-lg font-black text-gray-900 font-sans">₹{product.price}</span>
                                                   <span className="text-[10px] text-slate-400 font-medium">/{product.unit}</span>
                                                </div>
                                                {(() => {
                                                   const cartItem = cartItems.find(item => String(item.id) === String(product.id));
                                                   return cartItem ? (
                                                      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-xs" onClick={(e) => e.stopPropagation()}>
                                                         <button
                                                            type="button"
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-90 font-black cursor-pointer"
                                                         >
                                                            <Minus size={11} strokeWidth={3} />
                                                         </button>
                                                         <span className="text-xs font-black text-slate-800 px-1 font-sans text-center min-w-[16px]">{cartItem.quantity}</span>
                                                         <button
                                                            type="button"
                                                            onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                            className="w-6 h-6 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-90 font-black cursor-pointer"
                                                         >
                                                            <Plus size={11} strokeWidth={3} />
                                                         </button>
                                                      </div>
                                                   ) : (
                                                      <button
                                                         type="button"
                                                         onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToCart(product);
                                                         }}
                                                         className="bg-emerald-600 text-white hover:bg-emerald-700 p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
                                                         title="Add to Cart"
                                                      >
                                                         <ShoppingCart size={15} />
                                                      </button>
                                                   );
                                                })()}
                                             </div>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>

                     </div>
                ) : marketplaceTab === 'farms' ? (
                  /* ── CASE 3: FARMS DIRECTORY TAB (SHOW ALL REGISTERED FARMS AS SHOPS) ── */
                  <div className="space-y-6 text-left">
                     {filteredFarms.length === 0 ? (
                        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-white shadow-md max-w-lg mx-auto space-y-3">
                           <Sprout size={40} className="mx-auto text-emerald-600 mb-1" />
                           <h3 className="text-base font-extrabold text-gray-900 font-headings">No Registered Farms Matching Filters</h3>
                           <p className="text-gray-500 text-xs">Try clearing search terms or expanding your distance radius filter.</p>
                           <button
                              onClick={() => {
                                 setSearchQuery('');
                                 setSelectedRadius('all');
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                           >
                              Reset Filters
                           </button>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredFarms.map((farm) => {
                              const directItemCount = Array.isArray(farm.farmProducts) 
                                 ? farm.farmProducts.length 
                                 : (typeof farm.farmProducts === 'string' && farm.farmProducts.trim() !== '') 
                                    ? farm.farmProducts.split(',').length 
                                    : 0;
                              const farmDist = farm.distanceKm || getShopDistanceKm(farm.location);
                              return (
                                 <div
                                    key={farm.id}
                                    onClick={() => {
                                       setSearchParams({ tab: 'farms', farm: getFarmSlug(farm) });
                                       window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white shadow-md hover:shadow-2xl hover:shadow-emerald-950/[0.06] hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                                 >
                                    {/* Farm Cover Image */}
                                    <div className="relative h-48 overflow-hidden bg-slate-900">
                                       <img
                                          src={farm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'}
                                          alt={farm.farmName}
                                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                       />
                                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                       <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm font-mono flex items-center gap-1">
                                          <Sprout size={11} /> {directItemCount} Direct Items
                                       </div>

                                       <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm font-mono">
                                          ★ {farm.rating || 4.9}
                                       </div>

                                       <div className="absolute bottom-3 left-3 right-3 text-white">
                                          <h3 className="font-black text-lg font-headings leading-tight drop-shadow-sm text-white line-clamp-1">{farm.farmName}</h3>
                                          <div className="flex items-center justify-between text-[11px] text-slate-200 font-medium mt-0.5">
                                             <p className="flex items-center gap-1 truncate">
                                                <MapPin size={11} className="text-emerald-400 shrink-0" /> {farm.location}
                                             </p>
                                             <span className="bg-emerald-900/80 backdrop-blur-md text-emerald-300 font-bold px-2 py-0.5 rounded-md text-[10px] shrink-0 border border-emerald-500/30">
                                                📍 {farmDist.toFixed(1)} km
                                             </span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Farm Info Content */}
                                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                                       <div className="space-y-2">
                                          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                             <span className="flex items-center gap-1"><Store size={13} className="text-emerald-600" /> Owner: <strong className="text-slate-800">{farm.vendorName || 'Vendor'}</strong></span>
                                             {(!farm.costPerPerson || Number(farm.costPerPerson) === 0) ? (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">FREE ENTRY</span>
                                             ) : (
                                                <span className="text-xs font-black text-slate-900">₹{farm.costPerPerson}/guest</span>
                                             )}
                                          </div>
                                          <p className="text-xs text-slate-500 font-body line-clamp-2 italic">"{farm.description}"</p>
                                          {(farm.updatedAt || farm.createdAt) && (
                                             <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/60 px-2.5 py-0.5 rounded-full font-mono w-fit mt-1">
                                                <Clock size={10} className="text-emerald-600" />
                                                <span>Updated {formatUpdatedTime(farm.updatedAt || farm.createdAt)}</span>
                                             </div>
                                          )}

                                          {/* Social Media Links Icons on Farm Card */}
                                          {(() => {
                                             const farmSocials = resolveShopSocialLinks(farm, publicShopsData);
                                             const hasSocials = farmSocials.instagram || farmSocials.facebook || farmSocials.youtube || farmSocials.whatsapp || farmSocials.website;
                                             if (!hasSocials) return null;
                                             return (
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                   <span className="text-[10px] font-bold text-slate-400 font-headings">Socials:</span>
                                                   {farmSocials.instagram && (
                                                      <a href={farmSocials.instagram.startsWith('http') ? farmSocials.instagram : `https://instagram.com/${farmSocials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform" title="Instagram">
                                                         <Instagram size={11} />
                                                      </a>
                                                   )}
                                                   {farmSocials.facebook && (
                                                      <a href={farmSocials.facebook.startsWith('http') ? farmSocials.facebook : `https://facebook.com/${farmSocials.facebook}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-blue-600 text-white hover:scale-110 transition-transform" title="Facebook">
                                                         <Facebook size={11} />
                                                      </a>
                                                   )}
                                                   {farmSocials.youtube && (
                                                      <a href={farmSocials.youtube.startsWith('http') ? farmSocials.youtube : `https://youtube.com/${farmSocials.youtube}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-red-600 text-white hover:scale-110 transition-transform" title="YouTube">
                                                         <Youtube size={11} />
                                                      </a>
                                                   )}
                                                   {farmSocials.whatsapp && (
                                                      <a href={farmSocials.whatsapp.startsWith('http') ? farmSocials.whatsapp : `https://wa.me/${farmSocials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-emerald-600 text-white hover:scale-110 transition-transform" title="WhatsApp">
                                                         <MessageCircle size={11} />
                                                      </a>
                                                   )}
                                                   {farmSocials.website && (
                                                      <a href={farmSocials.website.startsWith('http') ? farmSocials.website : `https://${farmSocials.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-slate-800 text-white hover:scale-110 transition-transform" title="Website">
                                                         <Globe size={11} />
                                                      </a>
                                                   )}
                                                </div>
                                             );
                                          })()}
                                       </div>

                                       <button
                                          type="button"
                                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md group-hover:bg-emerald-700 flex items-center justify-center gap-1.5 font-headings cursor-pointer"
                                       >
                                          <Sprout size={14} /> Explore Farm Shop & Direct Harvest →
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               ) : (
                  /* ── CASE 4: MARKETS DIRECTORY TAB (SHOW ALL MARKETS/SHOPS) ── */
                  <div className="space-y-6 text-left">
                     {filteredShops.length === 0 ? (
                        <div className="text-center py-16 bg-white/70 backdrop-blur-md rounded-3xl border border-white shadow-md max-w-lg mx-auto">
                           <Store size={36} className="mx-auto text-emerald-600 mb-3" />
                           <h3 className="text-base font-extrabold text-gray-900 mb-1 font-headings">No Organic Shops Found</h3>
                           <p className="text-gray-500 text-xs mb-4">Try clearing category filters or search terms.</p>
                           <button
                              onClick={() => {
                                 setActiveCategory('All');
                                 setSearchQuery('');
                              }}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                           >
                              Reset Filters
                           </button>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredShops.map((shop) => (
                              <div
                                 key={shop.id}
                                 onClick={() => {
                                    setSearchParams({ tab: 'markets', shop: shop.id });
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                 }}
                                 className="bg-white/80 backdrop-blur-md rounded-3xl overflow-hidden border border-white shadow-md hover:shadow-2xl hover:shadow-emerald-950/[0.06] hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col h-full"
                              >
                                 {/* Shop Image Cover */}
                                 <div className="relative h-48 overflow-hidden bg-slate-900">
                                    <img
                                       src={shop.image}
                                       alt={shop.name}
                                       className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-extrabold text-emerald-800 shadow-sm border border-emerald-100/40 font-mono">
                                       {shop.products.length} Fresh Items
                                    </div>

                                    <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1 font-mono">
                                       ★ {shop.rating}
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 text-white">
                                       <h3 className="font-black text-lg font-headings leading-tight drop-shadow-sm text-white line-clamp-1">{shop.name}</h3>
                                       <p onClick={(e) => openLocationInMaps(shop.location, e)} className="text-[11px] text-slate-200 font-medium flex items-center gap-1 mt-0.5 hover:underline hover:text-emerald-300 cursor-pointer transition-colors" title="Click to open location in Google Maps">
                                          <MapPin size={11} className="text-emerald-400" /> {shop.location}
                                       </p>
                                    </div>
                                 </div>

                                 {/* Shop Content Info */}
                                 <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                                    <div className="space-y-2">
                                       <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600">
                                          <div className="flex items-center gap-1">
                                             <Clock size={13} className="text-emerald-600" />
                                             <span>Delivery: <strong className="text-emerald-700">{shop.deliveryTime}</strong></span>
                                          </div>
                                          {(shop.updatedAt || shop.createdAt) && (
                                             <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full font-mono">
                                                <Clock size={10} className="text-emerald-600" />
                                                <span>Updated {formatUpdatedTime(shop.updatedAt || shop.createdAt)}</span>
                                             </div>
                                          )}
                                       </div>

                                       <div className="flex flex-wrap gap-1.5 pt-1">
                                          {shop.categoryList.slice(0, 4).map((cat, i) => (
                                             <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                                {cat}
                                             </span>
                                          ))}
                                          {shop.categoryList.length > 4 && (
                                             <span className="text-[10px] font-bold text-slate-400 flex items-center">+{shop.categoryList.length - 4} more</span>
                                          )}
                                       </div>

                                       {/* Social Media Links Icons on Shop Card */}
                                       {(() => {
                                          const shopSocials = resolveShopSocialLinks(shop, publicShopsData);
                                          const hasSocials = shopSocials.instagram || shopSocials.facebook || shopSocials.youtube || shopSocials.whatsapp || shopSocials.website;
                                          if (!hasSocials) return null;
                                          return (
                                             <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                <span className="text-[10px] font-bold text-slate-400 font-headings">Socials:</span>
                                                {shopSocials.instagram && (
                                                   <a href={shopSocials.instagram.startsWith('http') ? shopSocials.instagram : `https://instagram.com/${shopSocials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform" title="Instagram">
                                                      <Instagram size={11} />
                                                   </a>
                                                )}
                                                {shopSocials.facebook && (
                                                   <a href={shopSocials.facebook.startsWith('http') ? shopSocials.facebook : `https://facebook.com/${shopSocials.facebook}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-blue-600 text-white hover:scale-110 transition-transform" title="Facebook">
                                                      <Facebook size={11} />
                                                   </a>
                                                )}
                                                {shopSocials.youtube && (
                                                   <a href={shopSocials.youtube.startsWith('http') ? shopSocials.youtube : `https://youtube.com/${shopSocials.youtube}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-red-600 text-white hover:scale-110 transition-transform" title="YouTube">
                                                      <Youtube size={11} />
                                                   </a>
                                                )}
                                                {shopSocials.whatsapp && (
                                                   <a href={shopSocials.whatsapp.startsWith('http') ? shopSocials.whatsapp : `https://wa.me/${shopSocials.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-emerald-600 text-white hover:scale-110 transition-transform" title="WhatsApp">
                                                      <MessageCircle size={11} />
                                                   </a>
                                                )}
                                                {shopSocials.website && (
                                                   <a href={shopSocials.website.startsWith('http') ? shopSocials.website : `https://${shopSocials.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-slate-800 text-white hover:scale-110 transition-transform" title="Website">
                                                      <Globe size={11} />
                                                   </a>
                                                )}
                                             </div>
                                          );
                                       })()}
                                    </div>

                                    <button
                                       type="button"
                                       className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md group-hover:bg-emerald-700 flex items-center justify-center gap-1.5 font-headings cursor-pointer"
                                    >
                                       <Store size={14} /> Explore Shop & Buy Harvest →
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}

            </div>
         </section>

      </div>
   );
}
