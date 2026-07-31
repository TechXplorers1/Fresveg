import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  Instagram, Facebook, Youtube, Globe, MessageCircle,
  MapPin, Calendar, Users, Compass, ArrowLeft, Sparkles, CheckCircle, 
  Clock, ShieldCheck, Store, ShoppingCart, Info, Star, Navigation, Home as HomeIcon,
  Tent, Sun, Sprout, Heart, Check, Plus, Minus, Tag, Zap, Pencil, Trash2, Save, X, Edit3, Image as ImageIcon, Maximize2, ChevronDown, DollarSign, Loader2
} from 'lucide-react';
import ModernDatePicker from '../components/common/ModernDatePicker';

// Sub-Category Options Map for Farm Direct Products
export const SUB_CATEGORIES_MAP = {
  Vegetables: [
    'Organic Spinach', 'Cherry Tomatoes', 'Fresh Tomatoes', 'Capsicum / Bell Peppers', 
    'Broccoli', 'Cauliflower', 'Carrots', 'Potatoes', 'Red Onions', 'Cabbage', 
    'Cucumber', 'Brinjal (Eggplant)', 'Lady Finger (Okra)', 'Green Peas', 'Bottle Gourd', 'Other Vegetable'
  ],
  Fruits: [
    'Alphonso Mangoes', 'Mahabaleshwar Strawberries', 'Guava', 'Papaya', 
    'Chiku (Sapodilla)', 'Oranges / Citrus', 'Apples', 'Bananas', 'Pomegranates', 
    'Watermelon', 'Grapes', 'Pineapple', 'Dragon Fruit', 'Other Fruit'
  ],
  Dairy: [
    'Pure Cow Milk', 'Buffalo Milk', 'A2 Cow Milk', 'Fresh Paneer', 
    'Organic Ghee', 'Curd / Yogurt', 'Fresh Butter', 'Butter Milk (Chaas)'
  ],
  'Honey & Bee Products': [
    'Pure Organic Honey', 'Raw Wildflower Honey', 'Honeycomb Jar', 'Beeswax', 'Royal Jelly'
  ],
  'Preserves & Jams': [
    'Strawberry Jam', 'Mango Jam', 'Mixed Fruit Jam', 'Organic Pickles', 'Chutney'
  ],
  Spices: [
    'Turmeric (Haldi)', 'Red Chilli Powder', 'Coriander (Dhania)', 'Cumin (Jeera)', 'Cardamom', 'Black Pepper'
  ],
  'Grains & Pulses': [
    'Organic Wheat', 'Basmati Rice', 'Desi Chana (Gram)', 'Toor Dal', 'Moong Dal', 'Millets (Jowar/Bajra)'
  ],
  'Direct Harvest': [
    'Fresh Field Harvest', 'Organic Farm Pack', 'Farm Honey & Spices'
  ]
};

// Default enriched mock farm data
const MOCK_FARM_DATA = {
  'mock-farm-1': {
    id: 'mock-farm-1',
    farmName: 'Strawberry Fields & Orchards',
    location: 'Mahabaleshwar, Maharashtra',
    description: 'Pick fresh organic strawberries, stroll through our beautiful fruit orchards, and enjoy fresh strawberry milkshakes made on-site! Perfect weekend getaway for families and nature lovers.',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&q=80',
    costPerPerson: 350,
    vendorId: 'mock-vendor-1',
    vendorName: 'Orchard Farms',
    rating: 4.9,
    crops: ['Organic Strawberries', 'Sweet Cherries', 'Red Raspberries', 'Mulberries'],
    fruits: ['Mahabaleshwar Strawberries', 'Plums & Apricots', 'Wild Berries'],
    livestock: ['Poultry & Free-Range Ducks', 'Sheep & Goats Flock', 'Apiculture Honey Bees'],
    kidsActivities: ['🎈 Kids Playground & Swings', '🐰 Bunny & Petting Corner', '🎨 Pottery & Clay Crafts', '🚜 Mini Tractor Rides', '🐟 Fish Feeding Pond'],
    accommodations: [
      { id: 'acc-1', title: 'Farmhouse Guest Rooms', desc: 'Cozy, air-cooled rooms with private veranda facing strawberry fields.', price: 'Included', icon: 'house' },
      { id: 'acc-2', title: 'Traditional Clay Huts', desc: 'Cool eco-huts built with natural mud & thatched roofs.', price: 'Included', icon: 'hut' },
      { id: 'acc-3', title: 'Camping Tents under Stars', desc: 'High-quality waterproof tents with nighttime campfire setup.', price: '+ ₹200/tent', icon: 'tent' },
      { id: 'acc-4', title: 'Hammocks Under Banyan Trees', desc: 'Relaxing shaded hammocks for afternoon naps.', price: 'Free Access', icon: 'tree' }
    ],
    farmProducts: [
      { id: 'fp-1', name: 'Fresh Mahabaleshwar Strawberries (500g)', price: 180, unit: 'box', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80', vendor: 'Orchard Farms', category: 'Strawberries' },
      { id: 'fp-2', name: 'Pure Organic Honey Jar (250g)', price: 290, unit: 'jar', image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80', vendor: 'Orchard Farms', category: 'Honey' },
      { id: 'fp-3', name: 'Fresh Strawberry Jam (300g)', price: 220, unit: 'jar', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&q=80', vendor: 'Orchard Farms', category: 'Preserves' }
    ],
    cropPhotos: [
      { id: 'cp1', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&q=80', caption: 'Strawberry Harvest Patch' },
      { id: 'cp2', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&q=80', caption: 'Fresh Berry Trees & Orchard Trails' }
    ],
    livestockPhotos: [
      { id: 'lp1', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80', caption: 'Farm Cattle Grazing Pasture' },
      { id: 'lp2', url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80', caption: 'Free-Range Poultry Backyard' }
    ],
    accommodationPhotos: [
      { id: 'ap1', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80', caption: 'Shaded Hammocks & Clay Huts' },
      { id: 'ap2', url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&q=80', caption: 'Overnight Eco Camping Tents' }
    ],
    gallery: [
      { id: 'g1', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1000&q=80', caption: 'Organic Strawberry Fields' },
      { id: 'g2', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'Lush Green Orchard Trails' },
      { id: 'g3', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1000&q=80', caption: 'Farm Cattle & Pasture' },
      { id: 'g4', url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&q=80', caption: 'Shaded Hammocks under Banyan Trees' }
    ],
    amenities: ['Self Berry-Picking', 'Guided Tour', 'Organic Breakfast', 'Tractor Ride', 'Pet Friendly', 'Free Parking']
  },
  'mock-farm-2': {
    id: 'mock-farm-2',
    farmName: 'Green Valley Organic Haven',
    location: 'Karjat, Maharashtra',
    description: 'Learn about sustainable agriculture, witness our bio-gas plant, pick fresh organic leafy greens, and enjoy open field walks along river streams.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80',
    costPerPerson: 0,
    vendorId: 'mock-vendor-2',
    vendorName: 'Green Valley Farm',
    rating: 4.8,
    crops: ['Organic Spinach', 'Cherry Tomatoes', 'Capsicum', 'Broccoli', 'Organic Wheat'],
    fruits: ['Guava Orchards', 'Papaya Groves', 'Chiku (Sapodilla)'],
    livestock: ['Pure Gir Cows', 'Desi Hens & Roosters', 'Freshwater Fish Pond'],
    accommodations: [
      { id: 'acc-1', title: 'Eco Farmhouse Rooms', desc: 'Spacious solar-powered rooms surrounded by lush greenery.', price: 'Free Entry', icon: 'house' },
      { id: 'acc-2', title: 'Open Air Tents', desc: 'Eco camping tents along river stream.', price: 'Free Entry', icon: 'tent' },
      { id: 'acc-3', title: 'Tree Deck & Hammocks', desc: 'Rest under mango trees on woven hammocks.', price: 'Free Entry', icon: 'tree' }
    ],
    farmProducts: [
      { id: 'fp-4', name: 'Fresh Organic Spinach (250g)', price: 35, unit: 'bunch', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80', vendor: 'Green Valley Farm', category: 'Spinach' },
      { id: 'fp-5', name: 'Organic Cherry Tomatoes (500g)', price: 80, unit: 'pack', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80', vendor: 'Green Valley Farm', category: 'Tomatoes' }
    ],
    cropPhotos: [
      { id: 'cp1', url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80', caption: 'Organic Leafy Greens & Spinach Field' }
    ],
    livestockPhotos: [
      { id: 'lp1', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800&q=80', caption: 'Desi Gir Cows Shelter' }
    ],
    accommodationPhotos: [
      { id: 'ap1', url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80', caption: 'Eco Solar-Powered Rooms' }
    ],
    gallery: [
      { id: 'g1', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'River Stream & Open Pastures' },
      { id: 'g2', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000&q=80', caption: 'Organic Cherry Tomatoes Patch' }
    ],
    amenities: ['Composting Demo', 'River Stream Dip', 'Bio-Gas Plant Tour', 'Organic Snacks', 'Tree Planting']
  }
};


function sanitizeForFirebase(obj) {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirebase);
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      sanitized[key] = sanitizeForFirebase(obj[key]);
    }
  }
  return sanitized;
}

export function getFarmSlug(farm) {
  if (!farm) return '';
  if (!farm.farmName) return farm.id || '';
  const cleanName = farm.farmName
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return cleanName || farm.id || 'farm';
}

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

export default function FarmDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditParam = searchParams.get('edit') === 'true';

  const { user, userProfile } = useAuth();
  const { addToCart, cartItems, updateQuantity } = useCart();

  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(isEditParam);
  const [savingChanges, setSavingChanges] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);

  // Editable Form State
  const [editForm, setEditForm] = useState(null);
  const [detectingFarmLocation, setDetectingFarmLocation] = useState(false);
  const [farmMapCoords, setFarmMapCoords] = useState(null);

  // Inputs for adding items in Edit mode
  const [newCrop, setNewCrop] = useState('');
  const [newFruit, setNewFruit] = useState('');
  const [newAnimal, setNewAnimal] = useState('');

  // Add/Edit Product Modal in Edit Mode
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Vegetables', subCategory: 'Organic Spinach', price: '', quantity: '1', unit: 'kg', image: '' });

  // Add Accommodation Modal in Edit Mode
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [editingAccId, setEditingAccId] = useState(null);
  const [newAcc, setNewAcc] = useState({ title: '', price: '', desc: '', icon: 'house' });

  // Add Photo Modal in Edit Mode
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });

  // Lightbox Viewer Index
  const openLocationInMaps = (locationStr, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!locationStr) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationStr)}`;
    window.open(url, '_blank');
  };

  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [visitorsCount, setVisitorsCount] = useState(1);
  const [includeStay, setIncludeStay] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Live Slot Availability State
  const [existingFarmBookings, setExistingFarmBookings] = useState([]);
  const DAILY_MAX_CAPACITY = 30;

  // Verified Customer Reviews State
  const [reviewsList, setReviewsList] = useState([]);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({ rating: 5, comment: '', photoUrl: '' });

  const leafletMapContainerRef = useRef(null);
  const leafletMapInstanceRef = useRef(null);
  const farmMarkerRef = useRef(null);

  const isOwner = user && farm && (user.uid === farm.vendorId || userProfile?.role === 'vendor');

  // Fetch Farm data from Firebase or fallback to mock (matches by ID or name slug)
  useEffect(() => {
    window.scrollTo(0, 0);
    const farmsRef = ref(realtimeDb, 'farms');
    const unsubscribe = onValue(farmsRef, (snapshot) => {
      const data = snapshot.val();
      let matchedFarm = null;
      let matchedId = id;

      if (data) {
        const farmKey = Object.keys(data).find(key => {
          const item = data[key];
          if (key === id) return true;
          return getFarmSlug(item) === id;
        });
        if (farmKey) {
          matchedFarm = { ...data[farmKey], id: farmKey };
          matchedId = farmKey;
        }
      }

      if (!matchedFarm) {
        const mockKey = Object.keys(MOCK_FARM_DATA).find(key => {
          const mock = MOCK_FARM_DATA[key];
          return key === id || getFarmSlug(mock) === id || id.startsWith(getFarmSlug(mock));
        });
        if (mockKey) {
          matchedFarm = MOCK_FARM_DATA[mockKey];
        }
      }

      if (matchedFarm) {
        const fullFarm = {
          ...matchedFarm,
          crops: matchedFarm.crops || [],
          cropPhotos: matchedFarm.cropPhotos || [],
          fruits: matchedFarm.fruits || [],
          livestock: matchedFarm.livestock || [],
          livestockPhotos: matchedFarm.livestockPhotos || [],
          accommodations: matchedFarm.accommodations || [],
          accommodationPhotos: matchedFarm.accommodationPhotos || [],
          kidsActivities: matchedFarm.kidsActivities || [],
          farmProducts: matchedFarm.farmProducts || [],
          gallery: matchedFarm.gallery || [],
          amenities: matchedFarm.amenities || []
        };
        setFarm(fullFarm);
        setEditForm({
          farmName: fullFarm.farmName || '',
          location: fullFarm.location || '',
          description: fullFarm.description || '',
          socialLinks: fullFarm.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
          costPerPerson: fullFarm.costPerPerson || 0,
          costType: (!fullFarm.costPerPerson || Number(fullFarm.costPerPerson) === 0) ? 'free' : 'payable',
          image: fullFarm.image || '',
          crops: [...fullFarm.crops],
          cropPhotos: [...fullFarm.cropPhotos],
          fruits: [...fullFarm.fruits],
          livestock: [...fullFarm.livestock],
          livestockPhotos: [...fullFarm.livestockPhotos],
          accommodations: [...(fullFarm.accommodations || [])],
          accommodationPhotos: [...(fullFarm.accommodationPhotos || [])],
          kidsActivities: [...(fullFarm.kidsActivities || [])],
          farmProducts: [...fullFarm.farmProducts],
          gallery: [...fullFarm.gallery],
          amenities: [...fullFarm.amenities]
        });
      } else {
        const fallbackFarm = {
          id: matchedId,
          farmName: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          location: 'Local Region, India',
          description: 'A serene organic sanctuary with lush crops, fruit orchards, friendly farm animals, and comfortable rustic stays.',
          image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80',
          costPerPerson: 250,
          vendorName: 'Organic Farm Owner',
          rating: 4.9,
          crops: [],
          cropPhotos: [],
          fruits: [],
          livestock: [],
          livestockPhotos: [],
          accommodations: [],
          accommodationPhotos: [],
          farmProducts: [],
          gallery: [],
          amenities: []
        };
        setFarm(fallbackFarm);
        setEditForm({
          farmName: fallbackFarm.farmName,
          location: fallbackFarm.location,
          description: fallbackFarm.description,
          costPerPerson: fallbackFarm.costPerPerson,
          costType: 'payable',
          image: fallbackFarm.image,
          crops: [...fallbackFarm.crops],
          cropPhotos: [...fallbackFarm.cropPhotos],
          fruits: [...fallbackFarm.fruits],
          livestock: [...fallbackFarm.livestock],
          livestockPhotos: [...fallbackFarm.livestockPhotos],
          accommodations: [...fallbackFarm.accommodations],
          accommodationPhotos: [...fallbackFarm.accommodationPhotos],
          farmProducts: [...fallbackFarm.farmProducts],
          gallery: [...fallbackFarm.gallery],
          amenities: [...fallbackFarm.amenities]
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // Fetch Existing Bookings for Live Slot Availability
  useEffect(() => {
    if (!farm?.id) return;
    const bookingsRef = ref(realtimeDb, 'farmBookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const farmBookings = Object.values(data).filter(b => b.farmId === farm.id || b.farmName === farm.farmName);
        setExistingFarmBookings(farmBookings);
      } else {
        setExistingFarmBookings([]);
      }
    });
    return () => unsubscribe();
  }, [farm?.id, farm?.farmName]);

  // Fetch Customer Reviews for this Farm
  useEffect(() => {
    if (!farm?.id) return;
    const reviewsRef = ref(realtimeDb, `farms/${farm.id}/reviews`);
    const unsubscribe = onValue(reviewsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setReviewsList(list);
      } else {
        setReviewsList([]);
      }
    });
    return () => unsubscribe();
  }, [farm?.id]);

  // Live Slot Availability Calculation
  const getBookedSlotsForDate = (dateStr) => {
    if (!dateStr) return 0;
    return existingFarmBookings
      .filter(b => b.date === dateStr && b.status !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.visitorsCount) || 1), 0);
  };

  const bookedCountForDate = bookingDate ? getBookedSlotsForDate(bookingDate) : 0;
  const availableSlotsForDate = DAILY_MAX_CAPACITY - bookedCountForDate;
  const isFullyBooked = bookingDate ? availableSlotsForDate <= 0 : false;

  // Aggregate Customer Star Rating Calculation
  const getAverageStarRating = () => {
    if (reviewsList.length === 0) return farm?.rating || 4.9;
    const total = reviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / reviewsList.length).toFixed(1);
  };

  const displayRating = getAverageStarRating();

  // Submit Verified Customer Review
  const handleSaveCustomerReview = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      navigate('/auth?redirect=visit-farms');
      return;
    }
    if (!newReviewForm.comment.trim()) {
      alert("Please write a review comment.");
      return;
    }
    try {
      const reviewsRef = ref(realtimeDb, `farms/${farm.id}/reviews`);
      const newReviewRef = push(reviewsRef);
      const reviewData = {
        rating: Number(newReviewForm.rating) || 5,
        comment: newReviewForm.comment.trim(),
        photoUrl: newReviewForm.photoUrl.trim(),
        reviewerName: userProfile?.displayName || user.displayName || 'Verified Visitor',
        reviewerPhoto: user.photoURL || '',
        date: new Date().toISOString().split('T')[0]
      };
      await set(newReviewRef, reviewData);
      setShowAddReviewModal(false);
      setNewReviewForm({ rating: 5, comment: '', photoUrl: '' });
    } catch (err) {
      console.error('Failed to submit customer review:', err);
      alert('Failed to submit review: ' + err.message);
    }
  };

  // Leaflet Interactive Pin Map Initialization
  useEffect(() => {
    if (!farm || !leafletMapContainerRef.current) return;

    if (leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.remove();
      leafletMapInstanceRef.current = null;
    }

    if (window.L) {
      const defaultLat = 17.9237;
      const defaultLng = 73.6586;
      const currentCoords = farmMapCoords || { lat: defaultLat, lng: defaultLng };

      const map = window.L.map(leafletMapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 13,
        zoomControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const pinHtml = `
        <div class="instamart-marker-container">
          <div class="instamart-marker-shadow"></div>
          <div class="instamart-marker-ground-dot"></div>
          <div class="instamart-marker-pin">
            <div class="instamart-marker-inner-dot"></div>
          </div>
        </div>
      `;
      const customIcon = window.L.divIcon({
        html: pinHtml,
        className: 'custom-leaflet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const marker = window.L.marker([currentCoords.lat, currentCoords.lng], {
        icon: customIcon,
        draggable: isEditing
      }).addTo(map);

      if (isEditing) {
        marker.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          setFarmMapCoords({ lat, lng });
          handleReverseGeocode(lat, lng);
        });

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setFarmMapCoords({ lat, lng });
          handleReverseGeocode(lat, lng);
        });
      } else {
        marker.bindPopup(`<b>${farm.farmName}</b><br/>${farm.location}`).openPopup();
      }

      leafletMapInstanceRef.current = map;
      farmMarkerRef.current = marker;
    }
  }, [farm, isEditing, farmMapCoords]);

  // Geocoding Helpers for Location Pinning in Edit Mode
  const handleReverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FresVegApp/1.0' }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const shortAddr = data.display_name.split(',').slice(0, 4).join(', ');
        setEditForm(prev => ({ ...prev, location: shortAddr }));
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    }
  };

  const handleDetectFarmLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingFarmLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFarmMapCoords({ lat, lng });
        if (leafletMapInstanceRef.current && farmMarkerRef.current) {
          leafletMapInstanceRef.current.setView([lat, lng], 14);
          farmMarkerRef.current.setLatLng([lat, lng]);
        }
        await handleReverseGeocode(lat, lng);
        setDetectingFarmLocation(false);
      },
      (err) => {
        alert('Could not get GPS location: ' + err.message);
        setDetectingFarmLocation(false);
      }
    );
  };

  const handleLocateFarmAddress = async () => {
    if (!editForm.location || !editForm.location.trim()) {
      alert('Please enter a location address first.');
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(editForm.location)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'FresVegApp/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setFarmMapCoords({ lat, lng });
        if (leafletMapInstanceRef.current && farmMarkerRef.current) {
          leafletMapInstanceRef.current.setView([lat, lng], 14);
          farmMarkerRef.current.setLatLng([lat, lng]);
        }
      } else {
        alert('Could not locate address on map.');
      }
    } catch (err) {
      console.error('Geocode search error:', err);
    }
  };

  // Save All Farm Live Changes to Firebase
  const handleSaveAllFarmChanges = async () => {
    if (!farm || !editForm) return;
    setSavingChanges(true);
    try {
      const isFree = editForm.costType === 'free';
      const finalCost = isFree ? 0 : (Number(editForm.costPerPerson) || 0);

      const updatedFarmData = {
        ...farm,
        farmName: editForm.farmName.trim(),
        location: editForm.location.trim(),
        description: editForm.description.trim(),
        costPerPerson: finalCost,
        image: editForm.image.trim() || farm.image,
        socialLinks: editForm.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
        crops: editForm.crops || [],
        fruits: editForm.fruits || [],
        livestock: editForm.livestock || [],
        kidsActivities: editForm.kidsActivities || [],
        accommodations: editForm.accommodations || [],
        cropPhotos: editForm.cropPhotos || [],
        livestockPhotos: editForm.livestockPhotos || [],
        accommodationPhotos: editForm.accommodationPhotos || [],
        farmProducts: editForm.farmProducts || [],
        gallery: editForm.gallery || [],
        amenities: editForm.amenities || [],
        updatedAt: new Date().toISOString()
      };

      const sanitizedData = sanitizeForFirebase(updatedFarmData);
      const farmRef = ref(realtimeDb, `farms/${farm.id}`);
      await set(farmRef, sanitizedData);
      setFarm(updatedFarmData);
      setIsEditing(false);
      setShowSaveSuccessModal(true);
    } catch (err) {
      console.error('Failed to save farm changes:', err);
      alert('Error saving farm changes: ' + err.message);
    } finally {
      setSavingChanges(false);
    }
  };

  // Add Photo to Gallery
  const handleSaveNewPhoto = (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) {
      alert('Please enter a photo URL.');
      return;
    }
    const photoObj = {
      id: `g-${Date.now()}`,
      url: newPhoto.url.trim(),
      caption: newPhoto.caption.trim() || 'Farm View'
    };
    setEditForm(prev => ({ ...prev, gallery: [...prev.gallery, photoObj] }));
    setShowAddPhotoModal(false);
    setNewPhoto({ url: '', caption: '' });
  };

  const handleRemoveGalleryPhoto = (photoId) => {
    setEditForm(prev => ({ ...prev, gallery: prev.gallery.filter((p, i) => p.id !== photoId && i !== photoId) }));
  };

  const handleSetCoverPhoto = (photoUrl) => {
    setEditForm(prev => ({ ...prev, image: photoUrl }));
    alert('Photo set as main banner cover!');
  };

  // Add Item Helpers in Edit Mode
  const handleAddCropItem = () => {
    if (!newCrop.trim()) return;
    setEditForm(prev => ({ ...prev, crops: [...prev.crops, newCrop.trim()] }));
    setNewCrop('');
  };

  const handleRemoveCropItem = (idx) => {
    setEditForm(prev => ({ ...prev, crops: prev.crops.filter((_, i) => i !== idx) }));
  };

  const handleAddFruitItem = () => {
    if (!newFruit.trim()) return;
    setEditForm(prev => ({ ...prev, fruits: [...prev.fruits, newFruit.trim()] }));
    setNewFruit('');
  };

  const handleRemoveFruitItem = (idx) => {
    setEditForm(prev => ({ ...prev, fruits: prev.fruits.filter((_, i) => i !== idx) }));
  };

  const INITIAL_CROPS = ['Strawberries', 'Cherry Tomatoes', 'Sweet Corn', 'Spinach', 'Carrots'];
  const EXTRA_CROPS = ['Capsicum', 'Broccoli', 'Organic Wheat', 'Red Onions', 'Potatoes', 'Herbs', 'Lettuce', 'Cabbage', 'Radish'];

  const INITIAL_FRUITS = ['Mango Orchards', 'Guava Groves', 'Papaya', 'Apple Trees', 'Banana Plantation'];
  const EXTRA_FRUITS = ['Pomegranate', 'Orange Groves', 'Coconut Palms', 'Dragonfruit', 'Custard Apple', 'Pineapple', 'Lemon Trees', 'Jackfruit'];

  const INITIAL_LIVESTOCK = ['Pure Gir Cows', 'Goats & Sheep', 'Free-Range Poultry', 'Rabbits & Ducks', 'Honey Bees'];
  const EXTRA_LIVESTOCK = ['Buffaloes', 'Horses & Ponies', 'Fish Ponds', 'Turkeys', 'Geese', 'Quails', 'Dairy Cattle'];

  const INITIAL_ACCOMMODATIONS = ['Farmhouse Rooms', 'Rustic Mud Huts', 'Camping Tents', 'Treehouse Stays', 'Shaded Hammocks'];
  const EXTRA_ACCOMMODATIONS = ['Luxury Villas', 'Wooden Cottages', 'Dormitory Stays', 'Glamping Pods', 'Caravan Parking'];

  const [showMoreCrops, setShowMoreCrops] = useState(false);
  const [showMoreFruits, setShowMoreFruits] = useState(false);
  const [showMoreLivestock, setShowMoreLivestock] = useState(false);
  const [showMoreAccommodations, setShowMoreAccommodations] = useState(false);

  const handleToggleCropChip = (cropName) => {
    if (!editForm) return;
    const current = editForm.crops || [];
    const exists = current.some(c => c.toLowerCase() === cropName.toLowerCase());
    if (exists) {
      setEditForm(prev => ({ ...prev, crops: prev.crops.filter(c => c.toLowerCase() !== cropName.toLowerCase()) }));
    } else {
      setEditForm(prev => ({ ...prev, crops: [...prev.crops, cropName] }));
    }
  };

  const handleToggleFruitChip = (fruitName) => {
    if (!editForm) return;
    const current = editForm.fruits || [];
    const exists = current.some(f => f.toLowerCase() === fruitName.toLowerCase());
    if (exists) {
      setEditForm(prev => ({ ...prev, fruits: prev.fruits.filter(f => f.toLowerCase() !== fruitName.toLowerCase()) }));
    } else {
      setEditForm(prev => ({ ...prev, fruits: [...prev.fruits, fruitName] }));
    }
  };

  const handleToggleAnimalChip = (animalName) => {
    if (!editForm) return;
    const current = editForm.livestock || [];
    const exists = current.some(a => a.toLowerCase() === animalName.toLowerCase());
    if (exists) {
      setEditForm(prev => ({ ...prev, livestock: prev.livestock.filter(a => a.toLowerCase() !== animalName.toLowerCase()) }));
    } else {
      setEditForm(prev => ({ ...prev, livestock: [...prev.livestock, animalName] }));
    }
  };

  const handleAddAnimalItem = () => {
    if (!newAnimal.trim()) return;
    setEditForm(prev => ({ ...prev, livestock: [...prev.livestock, newAnimal.trim()] }));
    setNewAnimal('');
  };

  const handleRemoveAnimalItem = (idx) => {
    setEditForm(prev => ({ ...prev, livestock: prev.livestock.filter((_, i) => i !== idx) }));
  };

  const handleEditProductClick = (product) => {
    setEditingProductId(product.id);
    const cat = product.category || 'Vegetables';
    const subCatList = SUB_CATEGORIES_MAP[cat] || SUB_CATEGORIES_MAP['Vegetables'];
    setNewProduct({
      name: product.name || '',
      category: cat,
      subCategory: product.subCategory || subCatList[0] || '',
      price: product.price || '',
      quantity: product.quantity || '1',
      unit: product.rawUnit || product.unit || 'kg',
      image: product.image || ''
    });
    setShowAddProductModal(true);
  };

  const handleSaveNewProduct = async (e) => {
    if (e) e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price) {
      alert('Please enter product name and price.');
      return;
    }

    let updatedProducts = [];
    const currentProducts = editForm?.farmProducts || farm?.farmProducts || [];
    const qtyStr = newProduct.quantity?.trim();
    const unitStr = newProduct.unit?.trim() || 'kg';
    const displayUnit = qtyStr ? `${qtyStr} ${unitStr}` : unitStr;

    if (editingProductId) {
      updatedProducts = currentProducts.map(p => 
        p.id === editingProductId 
          ? {
              ...p,
              name: newProduct.name.trim(),
              category: newProduct.category.trim() || 'Vegetables',
              subCategory: newProduct.subCategory?.trim() || '',
              price: Number(newProduct.price) || 0,
              quantity: qtyStr || '1',
              unit: displayUnit,
              rawUnit: unitStr,
              image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'
            }
          : p
      );
      setEditingProductId(null);
    } else {
      const prodObj = {
        id: `fp-${Date.now()}`,
        name: newProduct.name.trim(),
        category: newProduct.category.trim() || 'Vegetables',
        subCategory: newProduct.subCategory?.trim() || '',
        price: Number(newProduct.price) || 100,
        quantity: qtyStr || '1',
        unit: displayUnit,
        rawUnit: unitStr,
        image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
        vendor: farm?.farmName || 'Farm Direct'
      };
      updatedProducts = [...currentProducts, prodObj];
    }

    setEditForm(prev => ({ ...prev, farmProducts: updatedProducts }));
    setFarm(prev => prev ? ({ ...prev, farmProducts: updatedProducts }) : prev);

    if (farm?.id) {
      try {
        const farmProductsRef = ref(realtimeDb, `farms/${farm.id}/farmProducts`);
        await set(farmProductsRef, updatedProducts);
      } catch (err) {
        console.error('Failed to save farm product to Firebase Realtime DB:', err);
      }
    }

    setShowAddProductModal(false);
    setNewProduct({ name: '', category: 'Vegetables', subCategory: 'Organic Spinach', price: '', quantity: '1', unit: 'kg', image: '' });
  };

  const handleRemoveProductItem = async (prodId) => {
    const currentProducts = editForm?.farmProducts || farm?.farmProducts || [];
    const updatedProducts = currentProducts.filter(p => p.id !== prodId);
    
    setEditForm(prev => ({ ...prev, farmProducts: updatedProducts }));
    setFarm(prev => prev ? ({ ...prev, farmProducts: updatedProducts }) : prev);

    if (farm?.id) {
      try {
        const farmProductsRef = ref(realtimeDb, `farms/${farm.id}/farmProducts`);
        await set(farmProductsRef, updatedProducts);
      } catch (err) {
        console.error('Failed to remove farm product from Firebase DB:', err);
      }
    }
  };

  const handleEditAccClick = (acc) => {
    setEditingAccId(acc.id || `acc-${Date.now()}`);
    setNewAcc({
      title: acc.title || '',
      price: acc.price || '',
      desc: acc.desc || '',
      icon: acc.icon || 'house'
    });
    setShowAddAccModal(true);
  };

  const handleSaveNewAcc = (e) => {
    e.preventDefault();
    if (!newAcc.title.trim()) return;

    if (editingAccId) {
      setEditForm(prev => ({
        ...prev,
        accommodations: prev.accommodations.map(a =>
          (a.id === editingAccId)
            ? { ...a, title: newAcc.title.trim(), price: newAcc.price.trim() || '', desc: newAcc.desc.trim() }
            : a
        )
      }));
    } else {
      const accObj = {
        id: `acc-${Date.now()}`,
        title: newAcc.title.trim(),
        price: newAcc.price.trim() || '',
        desc: newAcc.desc.trim() || 'Comfortable stay experience at the farm.',
        icon: newAcc.icon
      };
      setEditForm(prev => ({ ...prev, accommodations: [...prev.accommodations, accObj] }));
    }

    setShowAddAccModal(false);
    setEditingAccId(null);
    setNewAcc({ title: '', price: '', desc: '', icon: 'house' });
  };

  const handleRemoveAccItem = (accId) => {
    setEditForm(prev => ({ ...prev, accommodations: prev.accommodations.filter(a => a.id !== accId) }));
  };

  // Submit Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      alert('Please select a visit date.');
      return;
    }

    if (!user) {
      navigate('/auth?redirect=visit-farms');
      return;
    }

    setSubmittingBooking(true);
    try {
      const stayPriceVal = Number(farm.accommodationPrice) || (
        farm.accommodations && farm.accommodations.length > 0
          ? (parseFloat(String(farm.accommodations[0]?.price || '').replace(/[^0-9.]/g, '')) || 0)
          : 0
      );
      const admissionCost = isFree ? 0 : Number(farm.costPerPerson) * visitorsCount;
      const stayCost = includeStay ? stayPriceVal : 0;
      const totalAmount = admissionCost + stayCost;

      const bookingData = {
        farmId: farm.id,
        farmName: farm.farmName,
        location: farm.location,
        farmImage: farm.image || '',
        vendorId: farm.vendorId || 'vendor-default',
        vendorName: farm.vendorName || 'Farm Owner',
        customerId: user.uid,
        customerName: userProfile?.displayName || user?.displayName || 'Customer',
        customerEmail: user.email || '',
        date: bookingDate,
        visitorsCount: Number(visitorsCount),
        costPerPerson: Number(farm.costPerPerson) || 0,
        includeStay,
        accommodationPrice: stayPriceVal,
        stayCost,
        totalAmount,
        isFree: isFree && stayCost === 0,
      };

      if (isFree) {
        // Free farms: confirm immediately without checkout
        const bookingsRef = ref(realtimeDb, 'farmBookings');
        const newBookingRef = push(bookingsRef);
        await set(newBookingRef, {
          ...bookingData,
          status: 'confirmed',
          paymentMethod: 'Free Entry',
          createdAt: new Date().toISOString()
        });

        setBookingSuccess(true);
        setTimeout(() => {
          setBookingSuccess(false);
          setShowBookingModal(false);
          setBookingDate('');
          setVisitorsCount(1);
        }, 2500);
      } else {
        // Payable farms: go to checkout page
        sessionStorage.setItem('pendingFarmBooking', JSON.stringify(bookingData));
        setShowBookingModal(false);
        navigate('/farm-checkout');
      }
    } catch (err) {
      console.error('Failed to place booking:', err);
      alert('Error placing booking: ' + err.message);
    } finally {
      setSubmittingBooking(false);
    }
  };


  if (loading || !farm || !editForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-650"></div>
        <p className="mt-4 text-emerald-800 font-semibold animate-pulse text-xs uppercase tracking-wider font-headings">Loading Farm Page...</p>
      </div>
    );
  }

  const activeCrops = isEditing ? editForm.crops : farm.crops;
  const activeFruits = isEditing ? editForm.fruits : farm.fruits;
  const activeLivestock = isEditing ? editForm.livestock : farm.livestock;
  const activeKidsActivities = isEditing ? editForm.kidsActivities : (farm.kidsActivities || []);
  const activeAccommodations = isEditing ? editForm.accommodations : farm.accommodations;
  const activeFarmProducts = isEditing ? editForm.farmProducts : farm.farmProducts;
  const activeGallery = (isEditing ? editForm.gallery : farm.gallery) || [];

  const rawCropPhotos = (isEditing ? editForm.cropPhotos : farm.cropPhotos) || [];
  const activeCropPhotos = rawCropPhotos.length > 0
    ? rawCropPhotos
    : activeGallery.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard') || g.caption?.toLowerCase().includes('produce') || g.category === 'crop');

  const rawLivestockPhotos = (isEditing ? editForm.livestockPhotos : farm.livestockPhotos) || [];
  const activeLivestockPhotos = rawLivestockPhotos.length > 0
    ? rawLivestockPhotos
    : activeGallery.filter(g => g.caption?.toLowerCase().includes('cow') || g.caption?.toLowerCase().includes('goat') || g.caption?.toLowerCase().includes('animal') || g.caption?.toLowerCase().includes('livestock') || g.caption?.toLowerCase().includes('poultry') || g.caption?.toLowerCase().includes('bee') || g.caption?.toLowerCase().includes('duck') || g.caption?.toLowerCase().includes('sheep') || g.caption?.toLowerCase().includes('chicken') || g.category === 'livestock');

  const rawKidsPhotos = (isEditing ? editForm.kidsPhotos : farm.kidsPhotos) || [];
  const activeKidsPhotos = rawKidsPhotos.length > 0
    ? rawKidsPhotos
    : activeGallery.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting') || g.caption?.toLowerCase().includes('fun') || g.category === 'kids');

  const rawAccommodationPhotos = (isEditing ? editForm.accommodationPhotos : farm.accommodationPhotos) || [];
  const activeAccommodationPhotos = rawAccommodationPhotos.length > 0
    ? rawAccommodationPhotos
    : activeGallery.filter(g => g.caption?.toLowerCase().includes('stay') || g.caption?.toLowerCase().includes('hut') || g.caption?.toLowerCase().includes('tent') || g.caption?.toLowerCase().includes('room') || g.caption?.toLowerCase().includes('cottage') || g.caption?.toLowerCase().includes('villa') || g.category === 'stay');

  // Exclude section-specific photos (Crops, Animals, Kids, Stays) from the main General Farm Gallery
  const generalGalleryPhotos = activeGallery.filter(p => {
    const c = (p.caption || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    
    const isCrop = cat === 'crop' || c.includes('crop') || c.includes('fruit') || c.includes('harvest') || c.includes('orchard') || c.includes('produce');
    const isAnimal = cat === 'livestock' || c.includes('cow') || c.includes('goat') || c.includes('animal') || c.includes('livestock') || c.includes('poultry') || c.includes('bee') || c.includes('duck') || c.includes('sheep') || c.includes('chicken');
    const isKids = cat === 'kids' || c.includes('kid') || c.includes('play') || c.includes('child') || c.includes('swing') || c.includes('toy') || c.includes('petting') || c.includes('fun');
    const isStay = cat === 'stay' || c.includes('stay') || c.includes('hut') || c.includes('tent') || c.includes('room') || c.includes('cottage') || c.includes('villa');

    return !(isCrop || isAnimal || isKids || isStay);
  });
  const isFree = isEditing ? editForm.costType === 'free' : (!farm.costPerPerson || Number(farm.costPerPerson) === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen">
      
      {/* ── Owner Action Header Button ── */}
      {isOwner && (
        <div className="mb-4 flex justify-end">
          {isEditing ? (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded-2xl text-xs font-bold font-headings transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              Exit Editing
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold font-headings transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil size={15} /> Edit Farm Page Live
            </button>
          )}
        </div>
      )}

      {/* ── Breadcrumb Navigation ────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider text-left">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <span className="text-slate-300">/</span>
        <span
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate('/visit-farms');
          }}
          className="hover:text-emerald-600 transition-colors cursor-pointer"
        >
          Back
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-bold">{isEditing ? editForm.farmName : farm.farmName}</span>
      </nav>

      {/* ── Hero Farm Banner Showcase ────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 text-white min-h-[300px] sm:min-h-[360px] flex flex-col justify-end p-6 sm:p-8 text-left group">
        <img
          src={isEditing ? editForm.image : (farm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80')}
          alt={isEditing ? editForm.farmName : farm.farmName}
          className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-103 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {isFree ? (
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Sparkles size={13} /> FREE ENTRY (₹0)
              </span>
            ) : (
              <span className="bg-teal-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                ₹{isEditing ? editForm.costPerPerson : farm.costPerPerson} / GUEST
              </span>
            )}
            <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              🚜 Verified Agritourism Spot
            </span>
            <span className="bg-slate-900/85 backdrop-blur-md text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs font-mono">
              <Clock size={13} className="text-emerald-400" />
              <span>
                Page Updated: {formatUpdatedTime(farm.updatedAt || farm.createdAt) || 'Recently Updated'}
              </span>
            </span>
          </div>

          {/* Editable Title or Display */}
          {isEditing ? (
            <div className="space-y-2.5 bg-black/60 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
              <label className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Edit Farm Title</label>
              <input
                type="text"
                value={editForm.farmName}
                onChange={(e) => setEditForm({ ...editForm, farmName: e.target.value })}
                className="w-full px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-lg outline-none"
                placeholder="Farm Name"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Location Address</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-medium outline-none"
                    placeholder="Location Address"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 font-bold uppercase">Main Cover Photo URL</label>
                  <input
                    type="text"
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-medium outline-none"
                    placeholder="Photo URL"
                  />
                </div>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-4xl font-black font-headings text-white leading-tight drop-shadow-md">
              {farm.farmName}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-200">
            <span onClick={(e) => openLocationInMaps(isEditing ? editForm.location : farm.location, e)} className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 hover:border-emerald-400 hover:text-emerald-300 transition-all cursor-pointer" title="Click to open location in Google Maps">
              <MapPin size={14} className="text-emerald-400" /> {isEditing ? editForm.location : farm.location} ↗
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Store size={14} className="text-emerald-400" /> Owner: {farm.vendorName}
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-amber-300">
              <Star size={14} className="fill-current" /> {displayRating} ({reviewsList.length} Reviews)
            </span>
          </div>

          {/* Customer Social Media Links Bar */}
          {!isEditing && farm.socialLinks && (farm.socialLinks.instagram || farm.socialLinks.facebook || farm.socialLinks.youtube || farm.socialLinks.whatsapp || farm.socialLinks.website) && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-headings mr-1">Socials:</span>
              {farm.socialLinks.instagram && (
                <a
                  href={farm.socialLinks.instagram.startsWith('http') ? farm.socialLinks.instagram : `https://instagram.com/${farm.socialLinks.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                >
                  <Instagram size={12} /> <span>Instagram</span>
                </a>
              )}
              {farm.socialLinks.facebook && (
                <a
                  href={farm.socialLinks.facebook.startsWith('http') ? farm.socialLinks.facebook : `https://facebook.com/${farm.socialLinks.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-blue-600 text-white shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-[11px] font-bold font-headings"
                >
                  <Facebook size={12} /> <span>Facebook</span>
                </a>
              )}
              {farm.socialLinks.youtube && (
                <a
                  href={farm.socialLinks.youtube.startsWith('http') ? farm.socialLinks.youtube : `https://youtube.com/${farm.socialLinks.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-red-600 text-white shadow-sm hover:scale-105 transition-all flex items-center gap-1 text-[11px] font-bold font-headings"
                >
                  <Youtube size={12} /> <span>YouTube</span>
                </a>
              )}
              {farm.socialLinks.whatsapp && (
                <a
                  href={farm.socialLinks.whatsapp.startsWith('http') ? farm.socialLinks.whatsapp : `https://wa.me/${farm.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white shadow-sm hover:scale-105 transition-all flex items-center gap-1 text-[11px] font-bold font-headings"
                >
                  <MessageCircle size={12} /> <span>WhatsApp</span>
                </a>
              )}
              {farm.socialLinks.website && (
                <a
                  href={farm.socialLinks.website.startsWith('http') ? farm.socialLinks.website : `https://${farm.socialLinks.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-slate-800 text-white shadow-sm hover:scale-105 transition-all flex items-center gap-1 text-[11px] font-bold font-headings border border-white/20"
                >
                  <Globe size={12} /> <span>Website</span>
                </a>
              )}
            </div>
          )}

          {/* Editable Description or Display */}
          {isEditing ? (
            <div className="bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/20">
              <label className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block mb-1">Edit Description</label>
              <textarea
                rows="2"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-medium outline-none resize-none"
                placeholder="Describe farm experience..."
              ></textarea>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-200 font-body leading-relaxed max-w-2xl pt-1 italic opacity-95">
              "{farm.description}"
            </p>
          )}

          {/* Hero Action CTA (Hidden when in Edit Mode) */}
          {!isEditing && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3 rounded-2xl font-bold text-xs font-headings transition-all shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Calendar size={16} /> Book Farm Visit Slot
              </button>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(farm.farmName + ' ' + farm.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-5 py-3 rounded-2xl font-bold text-xs font-headings transition-all flex items-center gap-2"
              >
                <Navigation size={16} /> Get Directions
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Highlights Counter Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5">
        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl text-left shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0 font-bold text-lg">
            🌾
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Crops Grown</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeCrops.length}+ Varieties</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl text-left shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0 font-bold text-lg">
            🐄
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Livestock & Birds</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeLivestock.length} Types</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl text-left shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0 font-bold text-lg">
            🛖
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Stay Options</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeAccommodations.length} Accommodation Choices</p>
          </div>
        </div>

        {(activeGallery.length > 0 || isEditing) && (
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl text-left shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-lg">
              📸
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Photo Gallery</p>
              <p className="font-extrabold text-slate-800 text-sm font-headings">{activeGallery.length} Farm Photos</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Main Farm Experience Details Grid ────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        
        {/* Left Column: Farm Offerings & Gallery (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 0: Farm Photo Gallery & Visual Tour 📸 */}
          {(activeGallery.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-lg">
                    📸
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Farm Gallery & Visual Tour</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Explore real photos of our fields, crops, stays, animals, and sunsets</p>
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => setShowAddPhotoModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus size={14} /> Add Farm Photo
                  </button>
                )}
              </div>

              {/* Photo Grid Showcase */}
              {generalGalleryPhotos.length === 0 ? (
                <div className="py-8 text-center bg-white/50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">No gallery photos added yet.</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddPhotoModal(true)}
                      className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold"
                    >
                      + Add Photo Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {generalGalleryPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="relative h-36 sm:h-44 rounded-2xl overflow-hidden group cursor-pointer border border-slate-200/80 shadow-xs hover:shadow-lg transition-all"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || 'Farm Photo'}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-85 group-hover:opacity-95 transition-opacity"></div>
                      
                      {photo.caption && (
                        <p className="absolute bottom-2.5 left-2.5 right-2.5 text-[11px] font-bold text-white font-body truncate drop-shadow-sm">
                          {photo.caption}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 1: Accommodation & Stay Options 🛖 */}
          {(activeAccommodations.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-lg">
                    🛖
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Accommodations & Stay Experience</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Choose from farmhouse rooms, rustic mud huts, camping tents, or shaded hammocks</p>
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      setEditingAccId(null);
                      setNewAcc({ title: '', price: '', desc: '', icon: 'house' });
                      setShowAddAccModal(true);
                    }}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1 shadow-md hover:bg-emerald-700 cursor-pointer"
                  >
                    <Plus size={14} /> Add Stay Option
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeAccommodations.map((acc, index) => {
                  const accTitle = typeof acc === 'string' ? acc : (acc.title || 'Accommodation');
                  const accPrice = typeof acc === 'object' && acc.price ? acc.price : '';
                  const accDesc = typeof acc === 'object' && acc.desc ? acc.desc : 'Comfortable farm stay choice';
                  const accPhotos = typeof acc === 'object' && Array.isArray(acc.photos) ? acc.photos : [];

                  return (
                    <div key={acc.id || index} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2 relative group">
                      {isEditing && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                          <button
                            type="button"
                            onClick={() => handleEditAccClick(acc)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Stay Choice"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAccItem(acc.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Stay Choice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between pr-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center font-bold text-sm">
                            {accTitle.includes('Tent') ? '⛺' : accTitle.includes('Hut') ? '🛖' : accTitle.includes('Tree') ? '🌳' : '🏠'}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm font-headings">{accTitle}</h4>
                        </div>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
                          {accPrice}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{accDesc}</p>

                      {accPhotos.length > 0 && (
                        <div className="flex gap-1.5 pt-1.5 overflow-x-auto">
                          {accPhotos.map((p, pIdx) => (
                            <img key={pIdx} src={p.url} alt={p.caption} className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Accommodation & Stay Photos Grid */}
              {activeAccommodationPhotos.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings">📸 Accommodation & Stay Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeAccommodationPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} onClick={() => { const i = activeGallery.findIndex(g => g.url === photo.url); setLightboxIndex(i >= 0 ? i : 0); }} className="h-28 rounded-xl overflow-hidden relative group border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-400">
                        <img src={photo.url} alt={photo.caption || 'Stay Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                            <p className="text-[10px] font-bold text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 2: Crops & Fruit Orchards Growing 🌾🍎 */}
          {((activeCrops.length > 0 || activeFruits.length > 0) || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
                  🌾
                </div>
                <div>
                  <h2 className="text-xl font-bold font-headings text-slate-800">Crops & Fruit Orchards Grown Here</h2>
                  <p className="text-xs text-slate-400 font-medium font-body">Organically cultivated crops and fresh fruit trees on this soil</p>
                </div>
              </div>

              <div className="space-y-4">
                {(activeCrops.length > 0 || isEditing) && (
                  <>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings">Organic Crops & Produce</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {activeCrops.map((crop, index) => (
                        <span key={index} className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          <Sprout size={14} className="text-emerald-600" /> {crop}
                          {isEditing && (
                            <button onClick={() => handleRemoveCropItem(index)} className="text-rose-500 hover:text-rose-700 ml-1 font-black cursor-pointer">
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-headings">
                            Select Suggested Crops or Type Custom Crop:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMoreCrops(!showMoreCrops)}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            {showMoreCrops ? 'Show Less' : `+ Others (${EXTRA_CROPS.length} more)`}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pb-2">
                          {(showMoreCrops ? [...INITIAL_CROPS, ...EXTRA_CROPS] : INITIAL_CROPS).map((chip, idx) => {
                            const isSelected = (editForm?.crops || []).some(c => c.toLowerCase() === chip.toLowerCase());
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleCropChip(chip)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                                }`}
                              >
                                <span>{chip}</span>
                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2 max-w-md pt-1">
                          <input
                            type="text"
                            value={newCrop}
                            onChange={(e) => setNewCrop(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddCropItem();
                              }
                            }}
                            placeholder="Type custom crop and press Enter (e.g. Sweet Corn)..."
                            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium flex-1 outline-none focus:border-emerald-500 font-body"
                          />
                          <button onClick={handleAddCropItem} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer">
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(activeFruits.length > 0 || isEditing) && (
                  <>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings pt-2">Fruit Orchards & Trees</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {activeFruits.map((fruit, index) => (
                        <span key={index} className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          🍎 {fruit}
                          {isEditing && (
                            <button onClick={() => handleRemoveFruitItem(index)} className="text-rose-500 hover:text-rose-700 ml-1 font-black cursor-pointer">
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="space-y-2 pt-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-headings">
                            Select Suggested Fruit Orchards or Type Custom Fruit:
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMoreFruits(!showMoreFruits)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                          >
                            {showMoreFruits ? 'Show Less' : `+ Others (${EXTRA_FRUITS.length} more)`}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pb-2">
                          {(showMoreFruits ? [...INITIAL_FRUITS, ...EXTRA_FRUITS] : INITIAL_FRUITS).map((chip, idx) => {
                            const isSelected = (editForm?.fruits || []).some(f => f.toLowerCase() === chip.toLowerCase());
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleFruitChip(chip)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:text-amber-700'
                                }`}
                              >
                                <span>{chip}</span>
                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-2 max-w-md pt-1">
                          <input
                            type="text"
                            value={newFruit}
                            onChange={(e) => setNewFruit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                handleAddFruitItem();
                              }
                            }}
                            placeholder="Type custom fruit/orchard and press Enter..."
                            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium flex-1 outline-none focus:border-amber-500 font-body"
                          />
                          <button onClick={handleAddFruitItem} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer">
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Crops & Fruit Orchards Photos Grid */}
              {activeCropPhotos.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings">📸 Crops & Fruit Orchard Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeCropPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} className="h-28 rounded-xl overflow-hidden relative group border border-slate-200 shadow-2xs">
                        <img src={photo.url} alt={photo.caption || 'Crop Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                            <p className="text-[10px] font-bold text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Poultry, Sheep & Cattle 🐄🐓 */}
          {(activeLivestock.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center font-bold text-lg">
                    🐄
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Livestock, Poultry & Cattle</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Interact, feed, and observe farm animals up close</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {activeLivestock.map((animal, index) => (
                  <div key={index} className="bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs text-center space-y-1 relative group">
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveAnimalItem(index)}
                        className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-lg">
                      {animal.includes('Cow') || animal.includes('Cattle') ? '🐄' : animal.includes('Sheep') || animal.includes('Goat') ? '🐐' : animal.includes('Honey') || animal.includes('Bee') ? '🐝' : '🐓'}
                    </div>
                    <p className="font-bold text-slate-800 text-xs font-headings truncate">{animal}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">100% Organic Raised</p>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="space-y-2 pt-2 bg-teal-50/50 p-4 rounded-2xl border border-teal-200/80 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider font-headings">
                      Select Suggested Livestock/Animals or Type Custom Animal:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMoreLivestock(!showMoreLivestock)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline cursor-pointer"
                    >
                      {showMoreLivestock ? 'Show Less' : `+ Others (${EXTRA_LIVESTOCK.length} more)`}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {(showMoreLivestock ? [...INITIAL_LIVESTOCK, ...EXTRA_LIVESTOCK] : INITIAL_LIVESTOCK).map((chip, idx) => {
                      const isSelected = (editForm?.livestock || []).some(a => a.toLowerCase() === chip.toLowerCase());
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleAnimalChip(chip)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'
                          }`}
                        >
                          <span>{chip}</span>
                          {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      value={newAnimal}
                      onChange={(e) => setNewAnimal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddAnimalItem();
                        }
                      }}
                      placeholder="Type custom animal and press Enter (e.g. Gir Cows)..."
                      className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium flex-1 outline-none focus:border-teal-500 font-body"
                    />
                    <button onClick={handleAddAnimalItem} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer">
                      + Add
                    </button>
                  </div>
                </div>
              )}
              {/* Livestock & Poultry Photos Grid */}
              {activeLivestockPhotos.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings">📸 Livestock & Poultry Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeLivestockPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} className="h-28 rounded-xl overflow-hidden relative group border border-slate-200 shadow-2xs">
                        <img src={photo.url} alt={photo.caption || 'Livestock Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                            <p className="text-[10px] font-bold text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Kids Section & Fun Entertainments 🎈 */}
          {((activeKidsActivities && activeKidsActivities.length > 0) || (activeKidsPhotos && activeKidsPhotos.length > 0) || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-lg">
                    🎈
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Kids Section & Fun Entertainments</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Safe playgrounds, petting corners, pottery & mini tractor rides for children</p>
                  </div>
                </div>
                <span className="bg-purple-50 text-purple-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-200">
                  Family Friendly 👨‍👩‍👧‍👦
                </span>
              </div>

              {activeKidsActivities && activeKidsActivities.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {(Array.isArray(activeKidsActivities) ? activeKidsActivities : activeKidsActivities.split(',').map(a => a.trim())).map((act, index) => (
                    <span key={index} className="bg-purple-50 text-purple-900 border border-purple-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      🎈 {act}
                    </span>
                  ))}
                </div>
              )}

              {/* Kids Entertainments Photos Grid */}
              {activeKidsPhotos && activeKidsPhotos.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 font-headings">📸 Kids Play Area & Activity Photos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {activeKidsPhotos.map((photo, idx) => (
                      <div key={photo.id || idx} className="h-28 rounded-xl overflow-hidden relative group border border-slate-200 shadow-2xs">
                        <img src={photo.url} alt={photo.caption || 'Kids Activity Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                            <p className="text-[10px] font-bold text-white truncate">{photo.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: On-Farm Products For Direct Purchase 🧺 */}
          {(activeFarmProducts.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold text-lg">
                    🧺
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-headings text-slate-800">Buy Direct Farm Harvest</h2>
                    <p className="text-xs text-slate-400 font-medium font-body">Products harvested right here available for purchase</p>
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Plus size={14} /> Add Farm Product
                  </button>
                )}
              </div>

              {activeFarmProducts.length === 0 ? (
                <div className="py-8 text-center bg-white/50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-medium">No farm harvest products added yet.</p>
                  {isEditing && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold"
                    >
                      + Add Product Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeFarmProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs flex flex-col justify-between group hover:shadow-md transition-all relative">
                      {isEditing && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                          <button
                            type="button"
                            onClick={() => handleEditProductClick(product)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg bg-white/90 shadow-xs border border-slate-200/80 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProductItem(product.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg bg-white/90 shadow-xs border border-slate-200/80 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <div className="relative h-32 bg-slate-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center p-2">
                        <img src={product.image} alt={product.name} className="max-h-full object-contain group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="space-y-2 text-left">
                        <h4 className="font-bold text-slate-800 text-xs font-headings line-clamp-1">{product.name}</h4>
                        <div className="pt-1">
                          <span className="font-extrabold text-slate-900 text-sm font-sans">₹{product.price} <span className="text-[10px] text-slate-400">/{product.unit}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 5: Verified Customer Reviews & Guest Photos ⭐ */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
                  ⭐
                </div>
                <div>
                  <h2 className="text-xl font-bold font-headings text-slate-800 flex items-center gap-2">
                    Verified Customer Reviews <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">★ {displayRating}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium font-body">Real feedback & photos from visitors who experienced this farm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/auth?redirect=visit-farms');
                    return;
                  }
                  setShowAddReviewModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Plus size={14} /> + Leave a Review
              </button>
            </div>

            {reviewsList.length === 0 ? (
              <div className="py-8 text-center bg-white/50 border border-dashed border-slate-200 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                  🌟
                </div>
                <h4 className="font-bold text-slate-800 text-xs font-headings">No Guest Reviews Yet</h4>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1 mb-3">Be the first verified visitor to leave a star rating and share your farm photos!</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/auth?redirect=visit-farms');
                      return;
                    }
                    setShowAddReviewModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-headings inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <Plus size={14} /> Write First Review
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviewsList.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-2.5 text-left flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs">
                            {rev.reviewerName?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs font-headings">{rev.reviewerName}</h5>
                            <span className="text-[10px] text-slate-400 font-medium">{rev.date || 'Verified Visitor'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                            <Star key={i} size={12} className="fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 font-body leading-relaxed italic">"{rev.comment}"</p>
                    </div>

                    {rev.photoUrl && (
                      <div className="pt-2 border-t border-slate-100">
                        <img
                          src={rev.photoUrl}
                          alt="Customer farm photo"
                          className="h-24 w-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Booking Sidebar vs Live Map Edit Box (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {isEditing ? (
            /* ── Interactive Location Pinning & Ticket Settings Box in Edit Mode ── */
            <div className="bg-white/95 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl space-y-5 text-left sticky top-24">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="text-emerald-600" size={18} />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm font-headings">Edit Location & Pin Map</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-body">Pin exact farm location on Leaflet map</p>
                </div>
              </div>

              {/* Location Input with GPS & Locate Action Buttons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Location Address *</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={detectingFarmLocation}
                      onClick={handleDetectFarmLocation}
                      className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-100 transition-all flex items-center gap-1 active:scale-95"
                      title="Get current location via GPS"
                    >
                      <Navigation size={10} className={detectingFarmLocation ? 'animate-spin' : ''} />
                      {detectingFarmLocation ? 'Detecting...' : 'Use GPS'}
                    </button>
                    <button
                      type="button"
                      onClick={handleLocateFarmAddress}
                      className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                      title="Pin typed address on map"
                    >
                      <MapPin size={10} /> Locate
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="Enter farm address..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                />
              </div>

              {/* Interactive Leaflet Pin Map */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase block">Interactive Pin Map</label>
                <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
                  <div ref={leafletMapContainerRef} className="w-full h-full z-10" />
                </div>
                <p className="text-[10px] text-slate-400 font-body italic pt-0.5">Drag the blue pin or click on the map to select your farm location automatically.</p>
              </div>

              {/* Admission Entry Fee Settings */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="text-[11px] font-bold text-slate-700 uppercase block">Admission Ticket Fee</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, costType: 'free', costPerPerson: 0 }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                      editForm.costType === 'free' || Number(editForm.costPerPerson) === 0
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <span>🆓 Free (₹0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm(prev => ({ ...prev, costType: 'payable', costPerPerson: editForm.costPerPerson || 250 }))}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                      editForm.costType === 'payable' && Number(editForm.costPerPerson) > 0
                        ? 'border-teal-600 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 bg-white'
                    }`}
                  >
                    <span>💳 Payable Visit</span>
                  </button>
                </div>

                {(editForm.costType === 'payable' || Number(editForm.costPerPerson) > 0) && (
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={editForm.costPerPerson}
                      onChange={(e) => setEditForm({ ...editForm, costPerPerson: Number(e.target.value) })}
                      placeholder="Ticket fee per visitor"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* 🌐 Social Media & Web Contact Links */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 font-headings">
                  <Globe size={14} className="text-emerald-600" /> Social Media & Contact Links
                </label>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5 font-headings">Instagram URL / Handle</label>
                    <input
                      type="text"
                      value={editForm.socialLinks?.instagram || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value }
                      }))}
                      placeholder="https://instagram.com/yourfarm"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5 font-headings">Facebook Page URL</label>
                    <input
                      type="text"
                      value={editForm.socialLinks?.facebook || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value }
                      }))}
                      placeholder="https://facebook.com/yourfarm"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5 font-headings">YouTube Channel URL</label>
                    <input
                      type="text"
                      value={editForm.socialLinks?.youtube || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value }
                      }))}
                      placeholder="https://youtube.com/@yourfarm"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5 font-headings">WhatsApp Phone / Link</label>
                    <input
                      type="text"
                      value={editForm.socialLinks?.whatsapp || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value }
                      }))}
                      placeholder="E.g. +91 9876543210 or https://wa.me/..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5 font-headings">Official Website URL</label>
                    <input
                      type="text"
                      value={editForm.socialLinks?.website || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...(prev.socialLinks || {}), website: e.target.value }
                      }))}
                      placeholder="https://yourfarm.com"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── Standard Customer Admission Ticket & Booking Card ── */
            <div className="bg-white/80 backdrop-blur-md border border-white p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.04] space-y-5 text-left sticky top-24">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Admission Ticket</p>
                  {isFree ? (
                    <p className="text-2xl font-black text-emerald-600 font-headings">FREE ENTRY <span className="text-xs font-normal text-emerald-600/70">(₹0)</span></p>
                  ) : (
                    <p className="text-2xl font-black text-slate-900 font-headings">₹{farm.costPerPerson} <span className="text-xs font-normal text-slate-400">/ person</span></p>
                  )}
                </div>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                  Instant Confirmation
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Full day access to farm & orchards</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Guided walk & animal feeding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Fresh organic welcome drink included</span>
                </div>
              </div>

              {/* Visit Days & Timings */}
              {(farm.visitDays || farm.visitTimings) && (
                <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 space-y-2">
                  {farm.visitDays && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-base leading-none mt-0.5">📅</span>
                      <div>
                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider font-headings">Visit Days</p>
                        <p className="font-bold text-slate-700 mt-0.5">{farm.visitDays}</p>
                      </div>
                    </div>
                  )}
                  {farm.visitTimings && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-base leading-none mt-0.5">🕐</span>
                      <div>
                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-wider font-headings">Visit Timings</p>
                        <p className="font-bold text-slate-700 mt-0.5">{farm.visitTimings}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowBookingModal(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-900/10 active:scale-98 flex items-center justify-center gap-2 font-headings"
              >
                <Calendar size={16} /> Book Visit Slot Now
              </button>

              {/* Interactive Leaflet Map Box */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider font-headings block">Pinpoint Location Map</label>
                <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
                  <div ref={leafletMapContainerRef} className="w-full h-full z-10" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Save All Changes Action Bar at End of Page (Edit Mode) ───────── */}
      {isEditing && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-10 text-left">
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl shrink-0">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-headings">Finished Customizing Your Farm Page?</h3>
                <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Save all your updated titles, address pin, accommodations, crops, photos & products live to FresVeg marketplace.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => navigate(`/farm/${slug}`)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-bold transition-all text-xs font-headings cursor-pointer"
              >
                Exit Editing
              </button>
              <button
                type="button"
                onClick={handleSaveAllFarmChanges}
                disabled={savingChanges}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-extrabold px-7 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-sm font-headings flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingChanges ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} /> Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Farm Photo Modal (Edit Mode) ────────────────────────────── */}
      {showAddPhotoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity"
          onClick={() => setShowAddPhotoModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
                <ImageIcon size={18} className="text-indigo-600" /> Add Farm Gallery Photo
              </h3>
              <button onClick={() => setShowAddPhotoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPhoto} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Photo Image URL *</label>
                <input
                  required
                  type="text"
                  value={newPhoto.url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Photo Caption / Description</label>
                <input
                  type="text"
                  value={newPhoto.caption}
                  onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                  placeholder="E.g. Sunset View Over Strawberry Patch"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Photo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Farm Harvest Product Modal (Edit Mode) ──────────────────── */}
      {showAddProductModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity"
          onClick={() => { setShowAddProductModal(false); setEditingProductId(null); }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" /> {editingProductId ? 'Edit Farm Product' : 'Add Farm Direct Product'}
              </h3>
              <button onClick={() => { setShowAddProductModal(false); setEditingProductId(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3.5 font-body">
              {/* Product Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Product Name *</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="E.g. Fresh Organic Strawberries"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              {/* Category & Sub-Category Linked Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => {
                      const selectedCat = e.target.value;
                      const subCatList = SUB_CATEGORIES_MAP[selectedCat] || [];
                      const firstSubCat = subCatList[0] || '';
                      setNewProduct(prev => ({
                        ...prev,
                        category: selectedCat,
                        subCategory: firstSubCat,
                        name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? firstSubCat : prev.name
                      }));
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Honey & Bee Products">Honey & Bee Products</option>
                    <option value="Preserves & Jams">Preserves & Jams</option>
                    <option value="Spices">Spices</option>
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Direct Harvest">Direct Harvest</option>
                  </select>
                </div>

                {/* Sub-Category */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Sub-Category *</label>
                  <select
                    value={newProduct.subCategory}
                    onChange={(e) => {
                      const selectedSubCat = e.target.value;
                      setNewProduct(prev => ({
                        ...prev,
                        subCategory: selectedSubCat,
                        name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? selectedSubCat : prev.name
                      }));
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    {(SUB_CATEGORIES_MAP[newProduct.category] || []).map((subCat, idx) => (
                      <option key={idx} value={subCat}>{subCat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selling Price, Quantity & Unit Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Selling Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="180"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Quantity (in {newProduct.unit || 'units'}) *</label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                      placeholder={`E.g. 10 ${newProduct.unit || 'units'}`}
                      className="w-full pl-3 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase font-mono pointer-events-none">
                      {newProduct.unit || 'units'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Unit *</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="gm">gm</option>
                    <option value="ml">ml</option>
                    <option value="tones">tones</option>
                    <option value="quintals">quintals</option>
                    <option value="pack">pack</option>
                    <option value="liter">liter</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              {/* Product Image URL */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Image URL</label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddProductModal(false); setEditingProductId(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {editingProductId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Stay Accommodation Choice Modal (Edit Mode) ─────────────── */}
      {showAddAccModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity"
          onClick={() => setShowAddAccModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
                {editingAccId ? '✏️ Edit Stay / Accommodation Choice' : '🛖 Add Stay / Accommodation Choice'}
              </h3>
              <button onClick={() => setShowAddAccModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewAcc} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase font-headings">Stay Title *</label>
                <input
                  required
                  type="text"
                  value={newAcc.title}
                  onChange={(e) => setNewAcc({ ...newAcc, title: e.target.value })}
                  placeholder="E.g. Mud Huts / Camping Tents"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body"
                />
              </div>

              {/* 🛖 Suggested Accommodation Chips */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-headings">
                    Select Stay Option Chip:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMoreAccommodations(!showMoreAccommodations)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                  >
                    {showMoreAccommodations ? 'Show Less' : `+ Others (${EXTRA_ACCOMMODATIONS.length} more)`}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(showMoreAccommodations ? [...INITIAL_ACCOMMODATIONS, ...EXTRA_ACCOMMODATIONS] : INITIAL_ACCOMMODATIONS).map((chip, idx) => {
                    const isSelected = newAcc.title.toLowerCase() === chip.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewAcc(prev => ({ ...prev, title: chip }))}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                        }`}
                      >
                        <span>{chip}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase font-headings flex items-center justify-between">
                  <span>Stay / Accommodation Price (₹)</span>
                  <span className="text-[10px] text-amber-700 font-bold normal-case font-body">(Excluded from visit admission)</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">₹</span>
                  <input
                    type="text"
                    value={newAcc.price}
                    onChange={(e) => setNewAcc({ ...newAcc, price: e.target.value })}
                    placeholder="E.g. 1500 or Free"
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                {/* Price preset chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 self-center font-headings">Presets:</span>
                  {['Free', '₹500 / night', '₹1,000 / night', '₹1,500 / night', '₹2,000 / night'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewAcc({ ...newAcc, price: preset })}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        newAcc.price === preset
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Short Description</label>
                <textarea
                  rows="2"
                  value={newAcc.desc}
                  onChange={(e) => setNewAcc({ ...newAcc, desc: e.target.value })}
                  placeholder="Describe experience e.g. Cool eco-huts built with natural mud"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none resize-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {editingAccId ? 'Update Stay Option' : 'Add Stay Option'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lightbox Full Screen Image Modal ───────────────────────────── */}
      {lightboxIndex !== null && activeGallery[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 text-white animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeGallery[lightboxIndex].url}
              alt={activeGallery[lightboxIndex].caption || 'Farm Photo'}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />

            {/* Prev / Next Navigation Arrows */}
            {activeGallery.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + activeGallery.length) % activeGallery.length)}
                  className="absolute left-2 p-3.5 rounded-full bg-black/65 hover:bg-black/90 text-white border border-white/20 transition-all active:scale-95 font-bold text-xl"
                >
                  ‹
                </button>
                <button
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % activeGallery.length)}
                  className="absolute right-2 p-3.5 rounded-full bg-black/65 hover:bg-black/90 text-white border border-white/20 transition-all active:scale-95 font-bold text-xl"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {activeGallery[lightboxIndex].caption && (
            <p className="mt-4 text-sm font-bold font-headings text-slate-200 bg-black/60 px-5 py-2 rounded-full border border-white/20 shadow-md">
              {activeGallery[lightboxIndex].caption} ({lightboxIndex + 1} of {activeGallery.length})
            </p>
          )}
        </div>
      )}

      {/* ── Booking Modal Dialog ────────────────────────────────────────── */}
      {showBookingModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setShowBookingModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col transform transition-all scale-100 duration-300 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleConfirmBooking} className="flex flex-col">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600 border border-emerald-100">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-headings">Book Farm Visit Slot</h3>
                    <p className="text-xs text-slate-400 font-medium font-body">{farm.farmName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {bookingSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
                      ✓
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 font-headings">Booking Confirmed!</h4>
                    <p className="text-xs text-slate-500 font-body">Your farm visit slot has been reserved successfully.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Select Date of Visit <span className="text-emerald-600">*</span></label>
                      <ModernDatePicker
                        value={bookingDate}
                        onChange={(val) => setBookingDate(val)}
                        minDate={new Date().toISOString().split('T')[0]}
                        visitDays={farm?.visitDays}
                        visitTimings={farm?.visitTimings}
                        placeholder="Pick visit date..."
                      />
                      {bookingDate && (
                        <div className={`mt-2.5 p-3 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${
                          isFullyBooked
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : availableSlotsForDate < 10
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          <span>
                            {isFullyBooked
                              ? `🔴 Fully Booked (${bookedCountForDate}/${DAILY_MAX_CAPACITY} Slots filled)`
                              : `🟢 ${availableSlotsForDate} / ${DAILY_MAX_CAPACITY} Visitor Slots Available`}
                          </span>
                          <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">Max {DAILY_MAX_CAPACITY}/day</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Number of Visitors / Guests</label>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setVisitorsCount(Math.max(1, (parseInt(visitorsCount) || 1) - 1))}
                          className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0 cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={visitorsCount}
                            onChange={(e) => setVisitorsCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center font-black text-slate-800 text-sm font-sans bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-lg py-1 border border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-500">Guest(s)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVisitorsCount((parseInt(visitorsCount) || 0) + 1)}
                          className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0 cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>



                    {/* Accommodation Included Toggle Field */}
                    {(() => {
                      const stayPriceVal = Number(farm.accommodationPrice) || (
                        farm.accommodations && farm.accommodations.length > 0
                          ? (parseFloat(String(farm.accommodations[0]?.price || '').replace(/[^0-9.]/g, '')) || 0)
                          : 0
                      );
                      const displayStayLabel = farm.accommodations && farm.accommodations.length > 0
                        ? farm.accommodations[0]?.title || 'Overnight Accommodation Stay'
                        : 'Overnight Accommodation Stay';

                      return (
                        <>
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider pl-1 font-headings">Accommodation Included</label>
                            <div
                              onClick={() => setIncludeStay(!includeStay)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between text-xs ${
                                includeStay ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* iOS Style Toggle Switch */}
                                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${includeStay ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${includeStay ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <div>
                                  <label className="font-extrabold text-slate-800 block cursor-pointer font-headings">
                                    {displayStayLabel}
                                  </label>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {stayPriceVal > 0 ? `🛖 Separate from visit ticket (+₹${stayPriceVal} / night)` : '🛖 Separate overnight stay at farm'}
                                  </span>
                                </div>
                              </div>
                              <span className={`font-black font-mono text-xs px-2.5 py-1 rounded-lg ${includeStay ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {includeStay ? (stayPriceVal > 0 ? `+₹${stayPriceVal}` : 'ON') : 'OFF'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-2xl flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 font-headings">Total Payable:</span>
                            {isFree && (!includeStay || stayPriceVal === 0) ? (
                              <span className="font-black text-emerald-600 text-sm font-sans">FREE (₹0)</span>
                            ) : (
                              <span className="font-black text-slate-900 text-sm font-sans">
                                ₹{(isFree ? 0 : Number(farm.costPerPerson) * visitorsCount) + (includeStay ? stayPriceVal : 0)}
                              </span>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Footer */}
              {!bookingSuccess && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking || isFullyBooked || (bookingDate && Number(visitorsCount) > availableSlotsForDate)}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingBooking ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : isFullyBooked ? (
                      'Fully Booked'
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Add Customer Review Popup Modal ───────────────────────────── */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity" onClick={() => setShowAddReviewModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
                ⭐ Leave a Verified Customer Review
              </h3>
              <button onClick={() => setShowAddReviewModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerReview} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Star Rating</label>
                <div className="flex items-center gap-2 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/80">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewForm({ ...newReviewForm, rating: star })}
                      className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star size={24} className={star <= newReviewForm.rating ? 'fill-current text-amber-400' : 'text-slate-300'} />
                    </button>
                  ))}
                  <span className="text-xs font-black text-amber-900 ml-2 font-mono">{newReviewForm.rating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Your Review & Feedback *</label>
                <textarea
                  required
                  rows="3"
                  value={newReviewForm.comment}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                  placeholder="Share your farm experience, fresh produce quality, or stay details..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body resize-none"
                ></textarea>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">Attach Farm Visit Photo URL (Optional)</label>
                <input
                  type="text"
                  value={newReviewForm.photoUrl}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 font-body"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Save Success Popup Modal */}
      {showSaveSuccessModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 space-y-6 text-center animate-scale-up">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200/60">
              <CheckCircle size={34} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                Farm Page Saved Live! 🎉
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed font-body">
                Your live farm edits, crops, stay options, photo gallery, and products have been saved successfully!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSaveSuccessModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer font-headings"
              >
                Awesome, Got It!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
