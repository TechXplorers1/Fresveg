export const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Honey & Bee Products', 'Preserves & Jams', 'Spices', 'Grains & Pulses', 'Direct Harvest', 'Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'];

export const SUB_CATEGORIES_MAP = {
    Vegetables: [
        'Organic Spinach', 'Cherry Tomatoes', 'Fresh Tomatoes', 'Capsicum / Bell Peppers',
        'Broccoli', 'Cauliflower', 'Carrots', 'Potatoes', 'Red Onions', 'Cabbage',
        'Cucumber', 'Brinjal (Eggplant)', 'Lady Finger (Okra)', 'Green Peas', 'Bottle Gourd', 'Garlic', 'Other Vegetable'
    ],
    Fruits: [
        'Alphonso Mangoes', 'Mahabaleshwar Strawberries', 'Guava', 'Papaya',
        'Chiku (Sapodilla)', 'Oranges / Citrus', 'Apples', 'Bananas', 'Pomegranates',
        'Watermelon', 'Grapes', 'Pineapple', 'Dragon Fruit', 'Other Fruit'
    ],
    Dairy: [
        'Pure Cow Milk', 'Buffalo Milk', 'A2 Cow Milk', 'Fresh Paneer',
        'Organic Ghee', 'Curd / Yogurt', 'Fresh Butter', 'Cheese', 'Butter Milk (Chaas)'
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

export const STANDARD_UNITS = ['kg', 'gm', 'litre', 'ml', 'BOX', 'Packet', 'Bunch', 'Piece', 'Dozen'];

export const INITIAL_CROPS = ['Wheat', 'Sugarcane', 'Organic Strawberries', 'Fresh Tomatoes', 'Sweet Corn', 'Carrots', 'Leafy Spinach', 'Basmati Rice'];
export const EXTRA_CROPS = ['Cotton', 'Soybean', 'Groundnut', 'Organic Garlic', 'Green Peas', 'Brinjal (Eggplant)', 'Capsicum', 'Red Onions', 'Turmeric', 'Bio Millets'];

export const INITIAL_FRUITS = ['Ratnagiri Alphonso Mangoes', 'Mahabaleshwar Strawberries', 'Guava Orchards', 'Nagpur Oranges', 'Papaya Grove', 'Chiku (Sapodilla)', 'Pomegranate'];
export const EXTRA_FRUITS = ['Custard Apple (Sitaphal)', 'Dragon Fruit', 'Organic Bananas', 'Fresh Grapes', 'Figs (Anjeer)', 'Watermelon', 'Muskmelon', 'Amla (Gooseberry)'];

export const INITIAL_LIVESTOCK = ['Gir Cows & Cattle', 'Free Range Poultry Hens', 'Desi Goats & Sheep', 'Organic Beehives'];
export const EXTRA_LIVESTOCK = ['Buffaloes', 'Ducks & Geese', 'Quails', 'Rabbits', 'Fishery Pond', 'Silkworm Farm'];

export const INITIAL_KIDS_ACTIVITIES = ['Outdoor Play Area & Swings', 'Petting Farm Corner', 'Mini Tractor Rides', 'Traditional Pottery Workshop', 'Fruit Picking Tour', 'Organic Gardening Class'];
export const EXTRA_KIDS_ACTIVITIES = ['Clay Toy Making', 'Village Game Zone', 'Treehouse Adventure', 'Farm Treasure Hunt', 'Butterfly Garden Tour', 'Duck Feeding Pond'];

export const INITIAL_ACCOMMODATIONS = ['Farmhouse Guest Rooms', 'Rustic Mud Huts', 'Eco Camping Tents', 'Treehouse Stays'];
export const EXTRA_ACCOMMODATIONS = ['Glamping Pods', 'Luxury Farm Villa', 'Solar Eco Huts', 'Shaded Hammocks & Lawns'];

export const formatUpdatedTime = (isoString) => {
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

export const geocodeAddress = async (addressStr) => {
    if (!addressStr || !addressStr.trim()) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressStr)}&format=json&limit=1`;
        const res = await fetch(url, {
            headers: { 'User-Agent': 'FresVegApp/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }
        return null;
    } catch (err) {
        console.error("Geocoding failed:", err);
        return null;
    }
};
