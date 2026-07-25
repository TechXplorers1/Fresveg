import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  MapPin, Calendar, Users, Compass, ArrowLeft, Sparkles, CheckCircle, 
  Clock, ShieldCheck, Store, ShoppingCart, Info, Star, Navigation, Home as HomeIcon,
  Tent, Sun, Sprout, Heart, Check, Plus, Minus, Tag, Zap, Pencil, Trash2, Save, X, Edit3, Image as ImageIcon, Maximize2
} from 'lucide-react';
import ModernDatePicker from '../components/common/ModernDatePicker';

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
    gallery: [
      { id: 'g1', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'River Stream & Open Pastures' },
      { id: 'g2', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=1000&q=80', caption: 'Organic Cherry Tomatoes Patch' }
    ],
    amenities: ['Composting Demo', 'River Stream Dip', 'Bio-Gas Plant Tour', 'Organic Snacks', 'Tree Planting']
  }
};

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

  // Editable Form State
  const [editForm, setEditForm] = useState(null);
  const [detectingFarmLocation, setDetectingFarmLocation] = useState(false);
  const [farmMapCoords, setFarmMapCoords] = useState(null);

  // Inputs for adding items in Edit mode
  const [newCrop, setNewCrop] = useState('');
  const [newFruit, setNewFruit] = useState('');
  const [newAnimal, setNewAnimal] = useState('');

  // Add Product Modal in Edit Mode
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'pack', image: '' });

  // Add Accommodation Modal in Edit Mode
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [newAcc, setNewAcc] = useState({ title: '', price: 'Included', desc: '', icon: 'house' });

  // Add Photo Modal in Edit Mode
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhoto, setNewPhoto] = useState({ url: '', caption: '' });

  // Lightbox Viewer Index
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [visitorsCount, setVisitorsCount] = useState(1);
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
          const slug = getFarmSlug(item);
          return slug === id || id.startsWith(slug) || id.endsWith(key);
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
          crops: matchedFarm.crops || ['Organic Produce', 'Vegetable Crops', 'Herbs'],
          fruits: matchedFarm.fruits || ['Fruit Orchards'],
          livestock: matchedFarm.livestock || ['Poultry & Animals'],
          accommodations: matchedFarm.accommodations || [
            { id: 'a1', title: 'Farmhouse Room', desc: 'Clean, comfortable room with farm views.', price: 'Included', icon: 'house' },
            { id: 'a2', title: 'Mud Hut & Hammocks', desc: 'Relaxing mud hut stay under shade trees.', price: 'Included', icon: 'hut' }
          ],
          farmProducts: matchedFarm.farmProducts || [],
          gallery: matchedFarm.gallery || [
            { id: 'g1', url: matchedFarm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'Main Farm Field & Orchard' },
            { id: 'g2', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1000&q=80', caption: 'Organic Harvest Patch' }
          ],
          amenities: matchedFarm.amenities || ['Guided Farm Tour', 'Organic Snacks', 'Photo Spots']
        };
        setFarm(fullFarm);
        setEditForm({
          farmName: fullFarm.farmName || '',
          location: fullFarm.location || '',
          description: fullFarm.description || '',
          costPerPerson: fullFarm.costPerPerson || 0,
          costType: (!fullFarm.costPerPerson || Number(fullFarm.costPerPerson) === 0) ? 'free' : 'payable',
          image: fullFarm.image || '',
          crops: [...fullFarm.crops],
          fruits: [...fullFarm.fruits],
          livestock: [...fullFarm.livestock],
          accommodations: [...fullFarm.accommodations],
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
          crops: ['Organic Strawberries', 'Tomatoes', 'Sweet Corn', 'Spinach'],
          fruits: ['Mango Orchards', 'Guava Groves', 'Papaya'],
          livestock: ['Gir Cows', 'Goats & Sheep', 'Poultry'],
          accommodations: [
            { id: 'a1', title: 'Farmhouse Guest Suite', desc: 'Spacious room overlooking green fields.', price: 'Included', icon: 'house' },
            { id: 'a2', title: 'Rustic Clay Hut', desc: 'Traditional village stay with thatch roof.', price: 'Included', icon: 'hut' }
          ],
          farmProducts: [],
          gallery: [
            { id: 'g1', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'Lush Green Fields' },
            { id: 'g2', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1000&q=80', caption: 'Fresh Harvest' }
          ],
          amenities: ['Farm Walk', 'Fruit Picking', 'Tractor Ride', 'Fresh Organic Tea']
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
          fruits: [...fallbackFarm.fruits],
          livestock: [...fallbackFarm.livestock],
          accommodations: [...fallbackFarm.accommodations],
          farmProducts: [...fallbackFarm.farmProducts],
          gallery: [...fallbackFarm.gallery],
          amenities: [...fallbackFarm.amenities]
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

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
        crops: editForm.crops,
        fruits: editForm.fruits,
        livestock: editForm.livestock,
        accommodations: editForm.accommodations,
        farmProducts: editForm.farmProducts,
        gallery: editForm.gallery,
        amenities: editForm.amenities,
        updatedAt: new Date().toISOString()
      };

      const farmRef = ref(realtimeDb, `farms/${farm.id}`);
      await set(farmRef, updatedFarmData);
      setFarm(updatedFarmData);
      setIsEditing(false);
      alert('✨ Farm page changes saved live successfully!');
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

  const handleSaveNewProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price) {
      alert('Please enter product name and price.');
      return;
    }
    const prodObj = {
      id: `fp-${Date.now()}`,
      name: newProduct.name.trim(),
      price: Number(newProduct.price) || 100,
      unit: newProduct.unit.trim() || 'pack',
      image: newProduct.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
      vendor: farm.farmName,
      category: 'Farm Direct Harvest'
    };
    setEditForm(prev => ({ ...prev, farmProducts: [...prev.farmProducts, prodObj] }));
    setShowAddProductModal(false);
    setNewProduct({ name: '', price: '', unit: 'pack', image: '' });
  };

  const handleRemoveProductItem = (prodId) => {
    setEditForm(prev => ({ ...prev, farmProducts: prev.farmProducts.filter(p => p.id !== prodId) }));
  };

  const handleSaveNewAcc = (e) => {
    e.preventDefault();
    if (!newAcc.title.trim()) return;
    const accObj = {
      id: `acc-${Date.now()}`,
      title: newAcc.title.trim(),
      price: newAcc.price.trim() || 'Included',
      desc: newAcc.desc.trim() || 'Comfortable stay experience at the farm.',
      icon: newAcc.icon
    };
    setEditForm(prev => ({ ...prev, accommodations: [...prev.accommodations, accObj] }));
    setShowAddAccModal(false);
    setNewAcc({ title: '', price: 'Included', desc: '', icon: 'house' });
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
      const isFree = !farm.costPerPerson || Number(farm.costPerPerson) === 0;
      const totalAmount = isFree ? 0 : Number(farm.costPerPerson) * visitorsCount;

      const bookingData = {
        farmId: farm.id,
        farmName: farm.farmName,
        location: farm.location,
        vendorId: farm.vendorId || 'vendor-default',
        vendorName: farm.vendorName || 'Farm Owner',
        customerId: user.uid,
        customerName: userProfile?.displayName || user?.displayName || 'Customer',
        customerEmail: user.email || '',
        date: bookingDate,
        visitorsCount: Number(visitorsCount),
        accommodation: selectedAccommodation || 'Standard Farm Access',
        totalAmount,
        isFree,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      const bookingsRef = ref(realtimeDb, 'farmBookings');
      const newBookingRef = push(bookingsRef);
      await set(newBookingRef, bookingData);

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setShowBookingModal(false);
        setBookingDate('');
        setVisitorsCount(1);
      }, 2500);
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
  const activeAccommodations = isEditing ? editForm.accommodations : farm.accommodations;
  const activeFarmProducts = isEditing ? editForm.farmProducts : farm.farmProducts;
  const activeGallery = isEditing ? editForm.gallery : farm.gallery;
  const isFree = isEditing ? editForm.costType === 'free' : (!farm.costPerPerson || Number(farm.costPerPerson) === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      
      {/* ── Sticky Bottom Floating Vendor Live Editor Control Bar ──────────── */}
      {isEditing ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl bg-slate-900/90 backdrop-blur-xl text-white px-6 py-4 rounded-3xl shadow-2xl shadow-black/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-left animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Pencil size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-headings text-white flex items-center gap-2">
                Vendor Live Page Editor Mode <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">LIVE</span>
              </h3>
              <p className="text-[11px] text-slate-300 font-body">Customize title, location address, crops, stay options, photos & products live in place</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-headings border border-white/20 transition-all active:scale-95"
            >
              Exit Editing
            </button>
            <button
              onClick={handleSaveAllFarmChanges}
              disabled={savingChanges}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-headings transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={16} /> {savingChanges ? 'Saving Live...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      ) : isOwner ? (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsEditing(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-xs font-bold font-headings transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Pencil size={15} /> Edit Farm Page Live
          </button>
        </div>
      ) : null}

      {/* ── Breadcrumb Navigation ────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider text-left">
        <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <span className="text-slate-300">/</span>
        <Link to="/visit-farms" className="hover:text-emerald-600 transition-colors">Visit Farms</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-bold">{isEditing ? editForm.farmName : farm.farmName}</span>
      </nav>

      {/* ── Hero Farm Banner Showcase ────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-6 sm:p-10 text-left group">
        <img
          src={isEditing ? editForm.image : (farm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80')}
          alt={isEditing ? editForm.farmName : farm.farmName}
          className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-103 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

        <div className="relative z-10 space-y-4 max-w-3xl">
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
          </div>

          {/* Editable Title or Display */}
          {isEditing ? (
            <div className="space-y-3 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <label className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Edit Farm Title</label>
              <input
                type="text"
                value={editForm.farmName}
                onChange={(e) => setEditForm({ ...editForm, farmName: e.target.value })}
                className="w-full px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xl outline-none"
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
            <h1 className="text-3xl sm:text-5xl font-black font-headings text-white leading-tight drop-shadow-md">
              {farm.farmName}
            </h1>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <MapPin size={14} className="text-emerald-400" /> {isEditing ? editForm.location : farm.location}
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <Store size={14} className="text-emerald-400" /> Owner: {farm.vendorName}
            </span>
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-amber-300">
              <Star size={14} className="fill-current" /> {farm.rating || 4.9} Rating
            </span>
          </div>

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
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold text-xs font-headings transition-all shadow-xl active:scale-95 flex items-center gap-2"
              >
                <Calendar size={16} /> Book Farm Visit Slot
              </button>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(farm.farmName + ' ' + farm.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md px-5 py-3.5 rounded-2xl font-bold text-xs font-headings transition-all flex items-center gap-2"
              >
                <Navigation size={16} /> Get Directions
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Highlights Counter Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 rounded-3xl text-left shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center flex-shrink-0 font-bold text-xl">
            🌾
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Crops Grown</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeCrops.length}+ Varieties</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 rounded-3xl text-left shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center flex-shrink-0 font-bold text-xl">
            🐄
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Livestock & Birds</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeLivestock.length} Types</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 rounded-3xl text-left shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center flex-shrink-0 font-bold text-xl">
            🛖
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Stay Options</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeAccommodations.length} Accommodation Choices</p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-5 rounded-3xl text-left shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center flex-shrink-0 font-bold text-xl">
            📸
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider font-headings">Photo Gallery</p>
            <p className="font-extrabold text-slate-800 text-sm font-headings">{activeGallery.length} Farm Photos</p>
          </div>
        </div>
      </div>

      {/* ── Main Farm Experience Details Grid ────────────────────────────── */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Column: Farm Offerings & Gallery (8 Cols) */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Section 0: Farm Photo Gallery & Visual Tour 📸 */}
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
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
            {activeGallery.length === 0 ? (
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
                {activeGallery.map((photo, idx) => (
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

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSetCoverPhoto(photo.url); }}
                            className="bg-black/70 hover:bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-lg border border-white/30 backdrop-blur-md transition-colors"
                            title="Set as Main Banner Cover"
                          >
                            Set Cover
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveGalleryPhoto(photo.id || idx); }}
                            className="bg-black/70 hover:bg-rose-600 text-white p-1 rounded-lg border border-white/30 backdrop-blur-md transition-colors"
                            title="Delete Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <span className="p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white border border-white/20">
                          <Maximize2 size={12} />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 1: Accommodation & Stay Options 🛖 */}
          {(activeAccommodations.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
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
                    onClick={() => setShowAddAccModal(true)}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1 shadow-md hover:bg-emerald-700"
                  >
                    <Plus size={14} /> Add Stay Option
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeAccommodations.map((acc, index) => (
                  <div key={acc.id || index} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-2 relative group">
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveAccItem(acc.id)}
                        className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Stay Choice"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className="flex items-center justify-between pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {acc.title.includes('Tent') ? '⛺' : acc.title.includes('Hut') ? '🛖' : acc.title.includes('Tree') ? '🌳' : '🏠'}
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm font-headings">{acc.title}</h4>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200/60 font-mono">
                        {acc.price}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">{acc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Crops & Fruit Orchards Growing 🌾🍎 */}
          {((activeCrops.length > 0 || activeFruits.length > 0) || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
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
                        <span key={index} className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          <Sprout size={14} className="text-emerald-600" /> {crop}
                          {isEditing && (
                            <button onClick={() => handleRemoveCropItem(index)} className="text-rose-500 hover:text-rose-700 ml-1 font-black">
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
                        <span key={index} className="bg-amber-50 text-amber-900 border border-amber-200/80 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          🍎 {fruit}
                          {isEditing && (
                            <button onClick={() => handleRemoveFruitItem(index)} className="text-rose-500 hover:text-rose-700 ml-1 font-black">
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
            </div>
          )}

          {/* Section 3: Poultry, Sheep & Cattle 🐄🐓 */}
          {(activeLivestock.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {activeLivestock.map((animal, index) => (
                  <div key={index} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs text-center space-y-1.5 relative group">
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveAnimalItem(index)}
                        className="absolute top-2 right-2 p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-xl">
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
            </div>
          )}

          {/* Section 4: On-Farm Products For Direct Purchase 🧺 */}
          {(activeFarmProducts.length > 0 || isEditing) && (
            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
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
                        <button
                          onClick={() => handleRemoveProductItem(product.id)}
                          className="absolute top-2 right-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg z-20"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
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
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700"
                >
                  Add Photo
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
          onClick={() => setShowAddProductModal(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden text-left p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base font-headings flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" /> Add Farm Direct Product
              </h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Product Name *</label>
                <input
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="E.g. Fresh Organic Strawberries"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="180"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase">Unit / Weight</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="500g box / kg"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase">Product Image URL</label>
                <input
                  type="text"
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Add Product
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
                🛖 Add Stay / Accommodation Choice
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
                <label className="text-[11px] font-bold text-slate-700 uppercase">Price Badge</label>
                <input
                  type="text"
                  value={newAcc.price}
                  onChange={(e) => setNewAcc({ ...newAcc, price: e.target.value })}
                  placeholder="E.g. Included / + ₹200"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500"
                />
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Add Stay Option
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
                        placeholder="Pick visit date..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Number of Visitors / Guests</label>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                        <button
                          type="button"
                          onClick={() => setVisitorsCount(Math.max(1, (parseInt(visitorsCount) || 1) - 1))}
                          className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0"
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
                          className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Accommodation Choice</label>
                      <select
                        value={selectedAccommodation}
                        onChange={(e) => setSelectedAccommodation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium bg-white"
                      >
                        <option value="">Standard Day Access</option>
                        {activeAccommodations.map(acc => (
                          <option key={acc.id} value={acc.title}>{acc.title} ({acc.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Total Payable:</span>
                      {isFree ? (
                        <span className="font-black text-emerald-600 text-sm">FREE (₹0)</span>
                      ) : (
                        <span className="font-black text-slate-900 text-sm">₹{Number(farm.costPerPerson) * visitorsCount}</span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!bookingSuccess && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                  >
                    {submittingBooking ? 'Confirming...' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
