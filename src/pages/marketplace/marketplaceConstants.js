// ============================================================================
// Marketplace Constants & Mock Data
// ============================================================================

export const MOCK_FARMS_LIST = [
  {
    id: 'mock-farm-1',
    farmName: 'Jos Highland Berry & Honey Haven',
    location: 'Jos, Plateau State, Nigeria',
    description: 'Experience strawberry harvesting, beehive tours, and fresh jam tasting in cool plateau hill country.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80',
    costPerPerson: 250,
    vendorId: 'mock-vendor-1',
    vendorName: 'Jos Highland Orchards',
    rating: 4.9,
    farmProducts: [
      { id: 'fp-1', name: 'Fresh Jos Strawberries (500g)', price: 180, unit: 'box', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80', vendor: 'Jos Highland Orchards', category: 'Strawberries' },
      { id: 'fp-2', name: 'Pure Organic Honey Jar (250g)', price: 290, unit: 'jar', image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=400&q=80', vendor: 'Jos Highland Orchards', category: 'Honey' },
      { id: 'fp-3', name: 'Fresh Strawberry Jam (300g)', price: 220, unit: 'jar', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&q=80', vendor: 'Jos Highland Orchards', category: 'Preserves' }
    ]
  },
  {
    id: 'mock-farm-2',
    farmName: 'Epe Green Valley Organic Haven',
    location: 'Epe, Lagos State, Nigeria',
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
    farmName: 'Ogbomoso Mango & Citrus Estate',
    location: 'Ogbomoso, Oyo State, Nigeria',
    description: 'Walk through sweet Nigerian mango orchards, enjoy fresh citrus harvests, traditional farm meals, and sunset view points.',
    image: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&q=80',
    costPerPerson: 300,
    vendorId: 'mock-vendor-3',
    vendorName: 'Sunshine Produce Nigeria',
    rating: 4.9,
    farmProducts: [
      { id: 'fp-6', name: 'Authentic Ogbomoso Mangoes (1 Basket)', price: 850, unit: 'box', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80', vendor: 'Sunshine Produce Nigeria', category: 'Mangoes' },
      { id: 'fp-7', name: 'Fresh Farm Oranges (1 kg)', price: 120, unit: 'kg', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80', vendor: 'Sunshine Produce Nigeria', category: 'Citrus' }
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
  // Nigerian Major Agricultural & Commercial Cities
  lagos: { lat: 6.5244, lng: 3.3792, name: 'Lagos' },
  karjat: { lat: 6.5244, lng: 3.3792, name: 'Lagos' },
  ikeja: { lat: 6.6018, lng: 3.3515, name: 'Ikeja, Lagos' },
  lekki: { lat: 6.4698, lng: 3.5852, name: 'Lekki, Lagos' },
  'victoria island': { lat: 6.4281, lng: 3.4219, name: 'Victoria Island, Lagos' },
  yaba: { lat: 6.5095, lng: 3.3711, name: 'Yaba, Lagos' },
  surulere: { lat: 6.4969, lng: 3.3541, name: 'Surulere, Lagos' },
  epe: { lat: 6.5841, lng: 3.9834, name: 'Epe, Lagos' },
  badagry: { lat: 6.4316, lng: 2.8876, name: 'Badagry, Lagos' },
  abuja: { lat: 9.0765, lng: 7.3986, name: 'Abuja (FCT)' },
  garki: { lat: 9.0300, lng: 7.4800, name: 'Garki, Abuja' },
  wuse: { lat: 9.0600, lng: 7.4700, name: 'Wuse, Abuja' },
  ibadan: { lat: 7.3775, lng: 3.9470, name: 'Ibadan, Oyo' },
  ogbomoso: { lat: 8.1333, lng: 4.2400, name: 'Ogbomoso, Oyo' },
  'port harcourt': { lat: 4.8156, lng: 7.0498, name: 'Port Harcourt, Rivers' },
  kano: { lat: 12.0022, lng: 8.5920, name: 'Kano, Kano State' },
  jos: { lat: 9.8965, lng: 8.8583, name: 'Jos, Plateau State' },
  abeokuta: { lat: 7.1557, lng: 3.3451, name: 'Abeokuta, Ogun' },
  'benin city': { lat: 6.3350, lng: 5.6037, name: 'Benin City, Edo' },
  kaduna: { lat: 10.5105, lng: 7.4165, name: 'Kaduna, Kaduna State' },
  enugu: { lat: 6.4584, lng: 7.5464, name: 'Enugu, Enugu State' },
  asaba: { lat: 6.1989, lng: 6.7337, name: 'Asaba, Delta' },
  warri: { lat: 5.5174, lng: 5.7501, name: 'Warri, Delta' },
  calabar: { lat: 4.9757, lng: 8.3417, name: 'Calabar, Cross River' },
  ilorin: { lat: 8.4799, lng: 4.5418, name: 'Ilorin, Kwara' },
  makurdi: { lat: 7.7327, lng: 8.5214, name: 'Makurdi, Benue' }
};
