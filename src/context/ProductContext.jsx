import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, realtimeDb } from '../firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const INITIAL_MOCK_PRODUCTS = [
  // Tomatoes
  { id: 1, name: 'Organic Red Tomatoes', price: 4.99, mrp: 6.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: 2, name: 'Farm Fresh Tomatoes', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },
  { id: 3, name: 'Cherry Tomatoes', price: 6.00, mrp: 8.50, unit: 'box', category: 'Tomatoes', image: '/cherry_tomatoes.png', vendor: 'Root Essentials', rating: 4.9 },

  // Potatoes
  { id: 4, name: 'Russet Potatoes', price: 2.10, mrp: 3.00, unit: 'kg', category: 'Potatoes', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.6 },
  { id: 5, name: 'Sweet Potatoes', price: 3.20, mrp: 4.50, unit: 'kg', category: 'Potatoes', image: '/sweet_potatoes.png', vendor: 'Root Essentials', rating: 4.8 },

  // Onions
  { id: 6, name: 'Red Onions', price: 1.80, mrp: 2.50, unit: 'kg', category: 'Onions', image: '/red_onions.png', vendor: 'Sunshine Produce', rating: 4.7 },
  { id: 7, name: 'White Onions', price: 1.50, mrp: 2.20, unit: 'kg', category: 'Onions', image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.5 },

  // Brinjal (Eggplant)
  { id: 8, name: 'Fresh Brinjal', price: 2.20, mrp: 3.00, unit: 'kg', category: 'Brinjal', image: '/fresh_brinjal.png', vendor: 'Green Valley Farm', rating: 4.4 },
  { id: 9, name: 'Organic Baby Brinjal', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Brinjal', image: '/baby_brinjal.png', vendor: 'Root Essentials', rating: 4.8 },

  // Milk
  { id: 10, name: 'Farm Fresh Milk', price: 3.20, mrp: 4.20, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.7 },
  { id: 11, name: 'Organic Whole Milk', price: 4.00, mrp: 5.50, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },

  // Butter
  { id: 12, name: 'Organic Butter', price: 4.50, mrp: 6.00, unit: '250g', category: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },
  { id: 13, name: 'Salted Butter Block', price: 3.80, mrp: 5.00, unit: '250g', category: 'Butter', image: '/salted_butter.png', vendor: 'Happy Cows Dairy', rating: 4.7 },

  // Carrots
  { id: 14, name: 'Fresh Carrots', price: 1.80, mrp: 2.50, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
  { id: 15, name: 'Organic Baby Carrots', price: 2.50, mrp: 3.50, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },

  // Apples
  { id: 16, name: 'Fuji Apples', price: 4.00, mrp: 5.80, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.8 },
  { id: 17, name: 'Green Granny Smith', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },

  // Bananas
  { id: 18, name: 'Organic Bananas', price: 1.99, mrp: 2.99, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },
  { id: 19, name: 'Plantains', price: 2.50, mrp: 3.60, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80', vendor: 'Tropical Farms', rating: 4.5 },

  // Spinach
  { id: 20, name: 'Fresh Spinach', price: 2.00, mrp: 2.80, unit: 'bunch', category: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.9 },
  { id: 21, name: 'Baby Spinach Pack', price: 3.50, mrp: 4.99, unit: 'pack', category: 'Spinach', image: 'https://images.unsplash.com/photo-1622484211148-522db14e2c14?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Capsicum
  { id: 22, name: 'Red Bell Pepper', price: 1.50, mrp: 2.20, unit: 'item', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&q=80', vendor: 'Root Essentials', rating: 4.7 },
  { id: 23, name: 'Mixed Bell Peppers', price: 4.00, mrp: 5.80, unit: 'pack', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1601275868399-45be508112fa?w=500&q=80', vendor: 'Happy Harvest', rating: 4.8 },

  // Cheese
  { id: 24, name: 'Cheddar Block', price: 6.50, mrp: 8.99, unit: '500g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.9 },
  { id: 25, name: 'Mozzarella', price: 5.00, mrp: 7.25, unit: '250g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Yogurt
  { id: 26, name: 'Greek Yogurt', price: 4.00, mrp: 5.80, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
  { id: 27, name: 'Strawberry Yogurt', price: 4.50, mrp: 6.20, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1557925923-33b251d592cd?w=500&q=80', vendor: 'Meadow Farms', rating: 4.7 },

  // Broccoli
  { id: 28, name: 'Fresh Broccoli', price: 2.50, mrp: 3.60, unit: 'head', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: 29, name: 'Organic Broccoli Florets', price: 3.50, mrp: 4.99, unit: 'pack', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },

  // Garlic
  { id: 30, name: 'Garlic Bulbs', price: 1.00, mrp: 1.50, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
  { id: 31, name: 'Peeled Garlic', price: 2.00, mrp: 2.99, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1587049352847-4d4b1a13437e?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },

  // Strawberries
  { id: 32, name: 'Fresh Strawberries', price: 5.00, mrp: 7.25, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.9 },
  { id: 33, name: 'Organic Strawberries', price: 6.50, mrp: 8.99, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Oranges
  { id: 34, name: 'Navel Oranges', price: 3.00, mrp: 4.20, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.6 },
  { id: 35, name: 'Juicing Oranges', price: 2.50, mrp: 3.60, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80', vendor: 'Tropical Farms', rating: 4.7 },

  // Paneer
  { id: 36, name: 'Fresh Paneer Block', price: 5.50, mrp: 7.99, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
  { id: 37, name: 'Malai Paneer', price: 6.00, mrp: 8.50, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1589115715509-bba91b264e16?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 }
];

export const DEFAULT_CATEGORIES = [
  'Tomatoes', 'Potatoes', 'Onions', 'Brinjal', 'Carrots', 'Spinach', 
  'Capsicum', 'Broccoli', 'Garlic', 'Apples', 'Bananas', 'Strawberries', 
  'Oranges', 'Milk', 'Butter', 'Cheese', 'Yogurt', 'Paneer'
];

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(INITIAL_MOCK_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletedMockIds, setDeletedMockIds] = useState([]);

  // Listen for categories in Realtime DB
  useEffect(() => {
    const categoriesRef = ref(realtimeDb, 'productCategories');
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else if (data && typeof data === 'object') {
        const catList = Object.values(data).filter(Boolean);
        if (catList.length > 0) setCategories(catList);
      }
    });
    return () => unsubscribe();
  }, []);

  const addCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed) throw new Error('Category name cannot be empty.');
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error('Category already exists.');
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    await set(ref(realtimeDb, 'productCategories'), updated);
    return updated;
  };

  const deleteCategory = async (categoryName) => {
    const updated = categories.filter(c => c !== categoryName);
    setCategories(updated);
    await set(ref(realtimeDb, 'productCategories'), updated);
    return updated;
  };

  useEffect(() => {
    const deletedRef = ref(realtimeDb, 'deletedMockProducts');
    const unsubscribeDeleted = onValue(deletedRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setDeletedMockIds(Object.keys(val).map(String));
      } else {
        setDeletedMockIds([]);
      }
    });
    return () => unsubscribeDeleted();
  }, []);

  // Use Realtime Database to get products and listen for updates
  useEffect(() => {
    const productsRef = ref(realtimeDb, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const dbProducts = data ? Object.keys(data).map(key => {
        const item = data[key];
        const numPrice = parseFloat(item.price) || 0;
        const numMrp = item.mrp !== undefined && item.mrp !== null && item.mrp !== ''
          ? parseFloat(item.mrp)
          : parseFloat((numPrice * 1.25).toFixed(2));
        return {
          ...item,
          id: key,
          mrp: numMrp
        };
      }) : [];

      let manuallyDeletedIds = [];
      try {
        manuallyDeletedIds = JSON.parse(localStorage.getItem('fresveg_deleted_product_ids') || '[]');
      } catch (e) {}

      // Deduplicate dbProducts by ID
      const uniqueDbMap = new Map();
      dbProducts.forEach(p => {
        if (p && p.id) {
          uniqueDbMap.set(String(p.id), p);
        }
      });
      const uniqueDbProducts = Array.from(uniqueDbMap.values());

      const activeMockProducts = INITIAL_MOCK_PRODUCTS.filter(p => 
        !deletedMockIds.includes(String(p.id)) && !manuallyDeletedIds.includes(String(p.id))
      );
      
      const filteredDbProducts = uniqueDbProducts.filter(p => !manuallyDeletedIds.includes(String(p.id)));

      // Final deduplication across mock + db products
      const finalProductsMap = new Map();
      [...activeMockProducts, ...filteredDbProducts].forEach(p => {
        finalProductsMap.set(String(p.id), p);
      });

      const mergedProducts = Array.from(finalProductsMap.values());

      setProducts(mergedProducts);
      saveProductsToStorage(mergedProducts);
      setLoading(false);
    }, (error) => {
      console.error('Error loading products from Firebase:', error);
      try {
        const savedProducts = localStorage.getItem('fresveg_products');
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        }
      } catch (e) {
        console.error('Error parsing local storage products:', e);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [deletedMockIds]);

  const saveProductsToStorage = (newProducts) => {
    try {
      localStorage.setItem('fresveg_products', JSON.stringify(newProducts));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  };

const cleanFirebaseData = (data) => {
  if (data === null || data === undefined) return '';
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === undefined) return '';
    return value;
  }));
};

  const addProduct = async (product) => {
    const newProductRef = push(ref(realtimeDb, 'products'));
    const newKey = newProductRef.key;
    const rawProduct = {
      name: '',
      price: 0,
      unit: 'kg',
      category: 'General',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
      vendor: 'Local Vendor',
      shopLocation: '',
      rating: 5.0,
      ...product,
      id: newKey,
      createdAt: new Date().toISOString()
    };
    const sanitizedProduct = cleanFirebaseData(rawProduct);

    // 1. Immediately update React state & localStorage
    setProducts(prev => {
      const exists = prev.some(p => String(p.id) === String(newKey));
      if (exists) return prev;
      const updated = [...prev, sanitizedProduct];
      saveProductsToStorage(updated);
      return updated;
    });

    // 2. Write directly to Firebase Realtime DB at products/newKey
    try {
      const dbProductRef = ref(realtimeDb, `products/${newKey}`);
      await set(dbProductRef, sanitizedProduct);
      console.log('Successfully written to Firebase RTDB products/' + newKey, sanitizedProduct);

      if (sanitizedProduct.vendorId) {
        const userProdRef = ref(realtimeDb, `users/${sanitizedProduct.vendorId}/userProducts/${newKey}`);
        await set(userProdRef, sanitizedProduct);
      }
    } catch (error) {
      console.error('Error saving product to Firebase Realtime DB:', error);
      alert('Error writing product to Firebase: ' + error.message);
    }

    return sanitizedProduct;
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      const isMock = typeof id === 'number' || !isNaN(id);
      const sanitizedData = cleanFirebaseData(updatedProduct);
      if (isMock) {
        await set(ref(realtimeDb, `deletedMockProducts/${id}`), true);
        await set(ref(realtimeDb, `products/mock_${id}`), { ...sanitizedData, id: `mock_${id}` });
      } else {
        await update(ref(realtimeDb, `products/${id}`), sanitizedData);
      }
    } catch (error) {
      console.error('Error updating product in Realtime DB:', error);
      setProducts(prev => {
        const newProducts = prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p);
        saveProductsToStorage(newProducts);
        return newProducts;
      });
    }
  };

  const deleteProduct = async (id) => {
    try {
      const strId = String(id);

      // 1. Immediately remove from React state & localStorage
      setProducts(prev => {
        const updated = prev.filter(p => String(p.id) !== strId);
        saveProductsToStorage(updated);
        return updated;
      });

      // 2. Track deleted ID in localStorage so stale cache never resurrects it
      try {
        const deletedList = JSON.parse(localStorage.getItem('fresveg_deleted_product_ids') || '[]');
        if (!deletedList.includes(strId)) {
          deletedList.push(strId);
          localStorage.setItem('fresveg_deleted_product_ids', JSON.stringify(deletedList));
        }
      } catch (e) {}

      // 3. Remove permanently from Firebase Realtime Database
      const isMock = typeof id === 'number' || (!isNaN(id) && !strId.includes('-'));
      if (isMock) {
        await set(ref(realtimeDb, `deletedMockProducts/${id}`), true);
      } else {
        if (strId.startsWith('mock_')) {
          const originalId = strId.replace('mock_', '');
          await set(ref(realtimeDb, `deletedMockProducts/${originalId}`), true);
        }
        await remove(ref(realtimeDb, `products/${id}`));
      }
    } catch (error) {
      console.error('Error deleting product from Realtime DB:', error);
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      loading,
      addProduct, 
      updateProduct,
      deleteProduct,
      categories,
      addCategory,
      deleteCategory,
      searchQuery, 
      setSearchQuery 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

