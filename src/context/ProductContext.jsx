import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, realtimeDb } from '../firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

const INITIAL_MOCK_PRODUCTS = [
  // Tomatoes
  { id: 1, name: 'Organic Red Tomatoes', price: 4.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: 2, name: 'Farm Fresh Tomatoes', price: 3.50, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },
  { id: 3, name: 'Cherry Tomatoes', price: 6.00, unit: 'box', category: 'Tomatoes', image: '/cherry_tomatoes.png', vendor: 'Root Essentials', rating: 4.9 },

  // Potatoes
  { id: 4, name: 'Russet Potatoes', price: 2.10, unit: 'kg', category: 'Potatoes', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.6 },
  { id: 5, name: 'Sweet Potatoes', price: 3.20, unit: 'kg', category: 'Potatoes', image: '/sweet_potatoes.png', vendor: 'Root Essentials', rating: 4.8 },

  // Onions
  { id: 6, name: 'Red Onions', price: 1.80, unit: 'kg', category: 'Onions', image: '/red_onions.png', vendor: 'Sunshine Produce', rating: 4.7 },
  { id: 7, name: 'White Onions', price: 1.50, unit: 'kg', category: 'Onions', image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.5 },

  // Brinjal (Eggplant)
  { id: 8, name: 'Fresh Brinjal', price: 2.20, unit: 'kg', category: 'Brinjal', image: '/fresh_brinjal.png', vendor: 'Green Valley Farm', rating: 4.4 },
  { id: 9, name: 'Organic Baby Brinjal', price: 3.50, unit: 'kg', category: 'Brinjal', image: '/baby_brinjal.png', vendor: 'Root Essentials', rating: 4.8 },

  // Milk
  { id: 10, name: 'Farm Fresh Milk', price: 3.20, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.7 },
  { id: 11, name: 'Organic Whole Milk', price: 4.00, unit: 'L', category: 'Milk', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },

  // Butter
  { id: 12, name: 'Organic Butter', price: 4.50, unit: '250g', category: 'Butter', image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 },
  { id: 13, name: 'Salted Butter Block', price: 3.80, unit: '250g', category: 'Butter', image: '/salted_butter.png', vendor: 'Happy Cows Dairy', rating: 4.7 },

  // Carrots
  { id: 14, name: 'Fresh Carrots', price: 1.80, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
  { id: 15, name: 'Organic Baby Carrots', price: 2.50, unit: 'bunch', category: 'Carrots', image: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },

  // Apples
  { id: 16, name: 'Fuji Apples', price: 4.00, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.8 },
  { id: 17, name: 'Green Granny Smith', price: 3.50, unit: 'kg', category: 'Apples', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },

  // Bananas
  { id: 18, name: 'Organic Bananas', price: 1.99, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.8 },
  { id: 19, name: 'Plantains', price: 2.50, unit: 'bunch', category: 'Bananas', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500&q=80', vendor: 'Tropical Farms', rating: 4.5 },

  // Spinach
  { id: 20, name: 'Fresh Spinach', price: 2.00, unit: 'bunch', category: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.9 },
  { id: 21, name: 'Baby Spinach Pack', price: 3.50, unit: 'pack', category: 'Spinach', image: 'https://images.unsplash.com/photo-1622484211148-522db14e2c14?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Capsicum
  { id: 22, name: 'Red Bell Pepper', price: 1.50, unit: 'item', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&q=80', vendor: 'Root Essentials', rating: 4.7 },
  { id: 23, name: 'Mixed Bell Peppers', price: 4.00, unit: 'pack', category: 'Capsicum', image: 'https://images.unsplash.com/photo-1601275868399-45be508112fa?w=500&q=80', vendor: 'Happy Harvest', rating: 4.8 },

  // Cheese
  { id: 24, name: 'Cheddar Block', price: 6.50, unit: '500g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.9 },
  { id: 25, name: 'Mozzarella', price: 5.00, unit: '250g', category: 'Cheese', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Yogurt
  { id: 26, name: 'Greek Yogurt', price: 4.00, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
  { id: 27, name: 'Strawberry Yogurt', price: 4.50, unit: 'tub', category: 'Yogurt', image: 'https://images.unsplash.com/photo-1557925923-33b251d592cd?w=500&q=80', vendor: 'Meadow Farms', rating: 4.7 },

  // Broccoli
  { id: 28, name: 'Fresh Broccoli', price: 2.50, unit: 'head', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: 29, name: 'Organic Broccoli Florets', price: 3.50, unit: 'pack', category: 'Broccoli', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },

  // Garlic
  { id: 30, name: 'Garlic Bulbs', price: 1.00, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&q=80', vendor: 'Root Essentials', rating: 4.9 },
  { id: 31, name: 'Peeled Garlic', price: 2.00, unit: 'pack', category: 'Garlic', image: 'https://images.unsplash.com/photo-1587049352847-4d4b1a13437e?w=500&q=80', vendor: 'Happy Harvest', rating: 4.7 },

  // Strawberries
  { id: 32, name: 'Fresh Strawberries', price: 5.00, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&q=80', vendor: 'Orchard Farms', rating: 4.9 },
  { id: 33, name: 'Organic Strawberries', price: 6.50, unit: 'box', category: 'Strawberries', image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80', vendor: 'Meadow Farms', rating: 4.8 },

  // Oranges
  { id: 34, name: 'Navel Oranges', price: 3.00, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.6 },
  { id: 35, name: 'Juicing Oranges', price: 2.50, unit: 'kg', category: 'Oranges', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500&q=80', vendor: 'Tropical Farms', rating: 4.7 },

  // Paneer
  { id: 36, name: 'Fresh Paneer Block', price: 5.50, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=500&q=80', vendor: 'Happy Cows Dairy', rating: 4.8 },
  { id: 37, name: 'Malai Paneer', price: 6.00, unit: '250g', category: 'Paneer', image: 'https://images.unsplash.com/photo-1589115715509-bba91b264e16?w=500&q=80', vendor: 'Meadow Farms', rating: 4.9 }
];

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(INITIAL_MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Use Realtime Database to get products and listen for updates
  useEffect(() => {
    const productsRef = ref(realtimeDb, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dbProducts = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Merge mock products with actual DB products
        const mergedProducts = [...INITIAL_MOCK_PRODUCTS, ...dbProducts];
        setProducts(mergedProducts);
        saveProductsToStorage(mergedProducts);
      } else {
        setProducts(INITIAL_MOCK_PRODUCTS);
        saveProductsToStorage(INITIAL_MOCK_PRODUCTS);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading products from Firebase:', error);
      // Fallback to localStorage
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
  }, []);

  const saveProductsToStorage = (newProducts) => {
    try {
      localStorage.setItem('fresveg_products', JSON.stringify(newProducts));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  };

  const addProduct = async (product) => {
    try {
      const newProductRef = push(ref(realtimeDb, 'products'));
      await set(newProductRef, product);
      // No need to manually update state, onValue will trigger and handle it automatically.
    } catch (error) {
      console.error('Error adding product to Realtime DB:', error);
      // Fallback for offline mode
      setProducts(prev => {
        const newProduct = { ...product, id: Date.now().toString() };
        const newProducts = [...prev, newProduct];
        saveProductsToStorage(newProducts);
        return newProducts;
      });
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      await update(ref(realtimeDb, `products/${id}`), updatedProduct);
    } catch (error) {
      console.error('Error updating product in Realtime DB:', error);
      // Fallback to localStorage update
      setProducts(prev => {
        const newProducts = prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p);
        saveProductsToStorage(newProducts);
        return newProducts;
      });
    }
  };

  const deleteProduct = async (id) => {
    try {
      await remove(ref(realtimeDb, `products/${id}`));
    } catch (error) {
      console.error('Error deleting product from Realtime DB:', error);
      // Fallback to localStorage removal
      setProducts(prev => {
        const newProducts = prev.filter(p => p.id !== id);
        saveProductsToStorage(newProducts);
        return newProducts;
      });
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products, 
      loading,
      addProduct, 
      updateProduct,
      deleteProduct,
      searchQuery, 
      setSearchQuery 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

