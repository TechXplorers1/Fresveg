// ============================================================================
// Marketplace Constants & Mock Data
// ============================================================================

export const MOCK_FARMS_LIST = [
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

export const VITAMINS_LIST = [
  'Vitamin A',
  'Vitamin B',
  'Vitamin C',
  'Vitamin D',
  'Vitamin E',
  'Vitamin K'
];

export const VITAMIN_CATEGORIES_WITH_DETAILS = [
  {
    name: 'Vitamin A',
    code: 'VIT A',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=200&q=80'
  },
  {
    name: 'Vitamin B',
    code: 'VIT B',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80'
  },
  {
    name: 'Vitamin C',
    code: 'VIT C',
    image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=200&q=80'
  },
  {
    name: 'Vitamin D',
    code: 'VIT D',
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80'
  },
  {
    name: 'Vitamin E',
    code: 'VIT E',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80'
  },
  {
    name: 'Vitamin K',
    code: 'VIT K',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80'
  }
];

export const CITY_COORDINATES = {
  karjat: { lat: 18.9107, lng: 73.3282, name: 'Karjat' },
  mahabaleshwar: { lat: 17.9237, lng: 73.6586, name: 'Mahabaleshwar' },
  anantapur: { lat: 14.6819, lng: 77.6006, name: 'Anantapur' },
  'maruthi nagar': { lat: 14.6750, lng: 77.6050, name: 'Maruthi Nagar' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik' },
  satara: { lat: 17.6805, lng: 74.0183, name: 'Satara' },
  ratnagiri: { lat: 16.9902, lng: 73.3120, name: 'Ratnagiri' },
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  aurangabad: { lat: 19.8762, lng: 75.3433, name: 'Aurangabad' },
  chhatrapati_sambhajinagar: { lat: 19.8762, lng: 75.3433, name: 'Chhatrapati Sambhajinagar' },
  kolhapur: { lat: 16.7050, lng: 74.2433, name: 'Kolhapur' },
  solapur: { lat: 17.6599, lng: 75.9064, name: 'Solapur' },
  sangli: { lat: 16.8524, lng: 74.5815, name: 'Sangli' },
  ahmednagar: { lat: 19.0952, lng: 74.7496, name: 'Ahmednagar' },
  thane: { lat: 19.2183, lng: 72.9781, name: 'Thane' },
  navi_mumbai: { lat: 19.0330, lng: 73.0297, name: 'Navi Mumbai' },
  bengaluru: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
  bangalore: { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
  hyderabad: { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
  secunderabad: { lat: 17.4399, lng: 78.4983, name: 'Secunderabad' },
  chennai: { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
  delhi: { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  noida: { lat: 28.5355, lng: 77.3910, name: 'Noida' },
  gurugram: { lat: 28.4595, lng: 77.0266, name: 'Gurugram' },
  gurgaon: { lat: 28.4595, lng: 77.0266, name: 'Gurugram' },
  kolkata: { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
  surat: { lat: 21.1702, lng: 72.8311, name: 'Surat' },
  vadodara: { lat: 22.3072, lng: 73.1812, name: 'Vadodara' },
  jaipur: { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  lucknow: { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  chandigarh: { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  indore: { lat: 22.7196, lng: 75.8577, name: 'Indore' },
  bhopal: { lat: 23.2599, lng: 77.4126, name: 'Bhopal' },
  kochi: { lat: 9.9312, lng: 76.2673, name: 'Kochi' },
  coimbatore: { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },
  madurai: { lat: 9.9252, lng: 78.1198, name: 'Madurai' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },
  vizag: { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },
  vijayawada: { lat: 16.5062, lng: 80.6480, name: 'Vijayawada' },
  tirupati: { lat: 13.6288, lng: 79.4192, name: 'Tirupati' },
  mysuru: { lat: 12.2958, lng: 76.6394, name: 'Mysuru' },
  mysore: { lat: 12.2958, lng: 76.6394, name: 'Mysuru' },
  hubli: { lat: 15.3647, lng: 75.1240, name: 'Hubli' },
  belagavi: { lat: 15.8497, lng: 74.4977, name: 'Belagavi' }
};
