import { api } from './api';

export const INITIAL_FARMS_MAP = {
  'mock-farm-1': {
    id: 'mock-farm-1',
    name: 'Strawberry Fields & Orchards',
    location: 'Mahabaleshwar, Maharashtra',
    description: 'Pick fresh organic strawberries, stroll through our beautiful fruit orchards, and enjoy fresh strawberry milkshakes made on-site! Perfect weekend getaway for families and nature lovers.',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&q=80',
    pricePerPerson: 350,
    ownerId: 'mock-vendor-1',
    rating: 4.9,
    activities: ['Self Berry-Picking', 'Guided Tour', 'Organic Breakfast', 'Tractor Ride', 'Pet Friendly', 'Free Parking'],
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
      { id: 'g2', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'Lush Green Orchard Trails' }
    ]
  },
  'mock-farm-2': {
    id: 'mock-farm-2',
    name: 'Green Valley Organic Haven',
    location: 'Karjat, Maharashtra',
    description: 'Learn about sustainable agriculture, witness our bio-gas plant, pick fresh organic leafy greens, and enjoy open field walks along river streams.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80',
    pricePerPerson: 0,
    ownerId: 'mock-vendor-2',
    rating: 4.8,
    activities: ['Composting Demo', 'River Stream Dip', 'Bio-Gas Plant Tour', 'Organic Snacks', 'Tree Planting'],
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
      { id: 'g1', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80', caption: 'River Stream & Open Pastures' }
    ]
  }
};

export const ensureFarmsInFirebase = async () => {
  try {
    for (const key of Object.keys(INITIAL_FARMS_MAP)) {
      await api.saveFarm(INITIAL_FARMS_MAP[key]);
    }
  } catch (err) {
    console.error('Error seeding farms to PostgreSQL:', err);
  }
};
