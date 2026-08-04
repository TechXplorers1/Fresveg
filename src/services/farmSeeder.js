import { ref, get, set } from 'firebase/database';
import { realtimeDb } from '../firebase';

export const INITIAL_FARMS_MAP = {
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
      { id: 'acc-1', title: 'Farmhouse Guest Rooms', desc: 'Cozy, air-cooled rooms with private veranda facing strawberry fields.', price: 'Free', icon: 'house', roomQuantity: '4 Rooms', roomCapacity: '2 Persons' },
      { id: 'acc-2', title: 'Traditional Clay Huts', desc: 'Cool eco-huts built with natural mud & thatched roofs.', price: 'Free', icon: 'hut', roomQuantity: '2 Huts', roomCapacity: '3 Persons' },
      { id: 'acc-3', title: 'Camping Tents under Stars', desc: 'High-quality waterproof tents with nighttime campfire setup.', price: '+ ₹200/tent', icon: 'tent', roomQuantity: '5 Tents', roomCapacity: '2 Persons' },
      { id: 'acc-4', title: 'Hammocks Under Banyan Trees', desc: 'Relaxing shaded hammocks for afternoon naps.', price: 'Free Access', icon: 'tree', roomQuantity: '6 Hammocks', roomCapacity: '1 Person' }
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
      { id: 'acc-1', title: 'Eco Farmhouse Rooms', desc: 'Spacious solar-powered rooms surrounded by lush greenery.', price: 'Free Entry', icon: 'house', roomQuantity: '3 Rooms', roomCapacity: '4 Persons' },
      { id: 'acc-2', title: 'Open Air Tents', desc: 'Eco camping tents along river stream.', price: 'Free Entry', icon: 'tent', roomQuantity: '4 Tents', roomCapacity: '2 Persons' },
      { id: 'acc-3', title: 'Tree Deck & Hammocks', desc: 'Rest under mango trees on woven hammocks.', price: 'Free Entry', icon: 'tree', roomQuantity: '5 Hammocks', roomCapacity: '1 Person' }
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

/**
 * Ensures Firebase RTDB 'farms' node contains initial farm keys if they don't exist yet.
 * NEVER overwrites an existing farm in Firebase RTDB so vendor edits are preserved permanently.
 */
export const ensureFarmsInFirebase = async () => {
  try {
    for (const key of Object.keys(INITIAL_FARMS_MAP)) {
      const singleFarmRef = ref(realtimeDb, `farms/${key}`);
      const snapshot = await get(singleFarmRef);
      if (!snapshot.exists()) {
        await set(singleFarmRef, INITIAL_FARMS_MAP[key]);
      }
    }
  } catch (err) {
    console.error('Error ensuring farms in Firebase RTDB:', err);
  }
};
