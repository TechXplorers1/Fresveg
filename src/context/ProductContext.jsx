import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const DEFAULT_CATEGORY_OBJECTS = [
  { name: 'Tomatoes', image: '/cherry_tomatoes.png' },
  { name: 'Potatoes', image: '/sweet_potatoes.png' },
  { name: 'Onions', image: '/red_onions.png' },
  { name: 'Brinjal', image: '/fresh_brinjal.png' },
  { name: 'Carrots', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=200&q=80' },
  { name: 'Spinach', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=200&q=80' },
  { name: 'Capsicum', image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=200&q=80' },
  { name: 'Broccoli', image: 'https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=200&q=80' },
  { name: 'Garlic', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=200&q=80' },
  { name: 'Apples', image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=200&q=80' },
  { name: 'Bananas', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=200&q=80' },
  { name: 'Strawberries', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=200&q=80' },
  { name: 'Oranges', image: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=200&q=80' },
  { name: 'Milk', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=200&q=80' },
  { name: 'Butter', image: '/salted_butter.png' },
  { name: 'Cheese', image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=200&q=80' },
  { name: 'Yogurt', image: 'https://images.unsplash.com/photo-1571115177098-24eb42eb3dfc?auto=format&fit=crop&w=200&q=80' },
  { name: 'Paneer', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=200&q=80' }
];

export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_OBJECTS.map(c => c.name);

const INITIAL_MOCK_PRODUCTS = [
  { id: '1', name: 'Organic Red Tomatoes', price: 4.99, mrp: 6.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80', vendor: 'Green Valley Farm', rating: 4.8 },
  { id: '2', name: 'Farm Fresh Tomatoes', price: 3.50, mrp: 4.99, unit: 'kg', category: 'Tomatoes', image: 'https://images.unsplash.com/photo-1558818498-28c1e002b655?w=500&q=80', vendor: 'Sunshine Produce', rating: 4.5 },
  { id: '3', name: 'Cherry Tomatoes', price: 6.00, mrp: 8.50, unit: 'box', category: 'Tomatoes', image: '/cherry_tomatoes.png', vendor: 'Root Essentials', rating: 4.9 }
];

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(INITIAL_MOCK_PRODUCTS);
  const [categoriesWithDetails, setCategoriesWithDetails] = useState(DEFAULT_CATEGORY_OBJECTS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = categoriesWithDetails.map(c => c.name);

  // Fetch Categories from PostgreSQL
  const refreshCategories = async () => {
    try {
      const data = await api.getCategories();
      if (Array.isArray(data) && data.length > 0) {
        setCategoriesWithDetails(data);
      }
    } catch (err) {
      console.warn('Error fetching categories from PostgreSQL backend, using defaults:', err);
    }
  };

  // Fetch Products from PostgreSQL
  const refreshProducts = async () => {
    try {
      const data = await api.getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('Error fetching products from PostgreSQL backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCategories();
    refreshProducts();

    // Poll backend every 10 seconds to stay updated
    const interval = setInterval(() => {
      refreshProducts();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const addCategory = async (categoryName, categoryImage) => {
    const name = categoryName.trim();
    if (!name) throw new Error('Category name cannot be empty.');
    if (categoriesWithDetails.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('Category already exists.');
    }
    const image = categoryImage && categoryImage.trim() ? categoryImage.trim() : 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=80';
    
    await api.addCategory(name, image);
    await refreshCategories();
    return categoriesWithDetails;
  };

  const updateCategory = async (oldName, newName, newImage) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName) throw new Error('Category name cannot be empty.');

    if (oldName.toLowerCase() !== trimmedNewName.toLowerCase() &&
        categoriesWithDetails.some(c => c.name.toLowerCase() === trimmedNewName.toLowerCase())) {
      throw new Error('A category with this name already exists.');
    }

    await api.updateCategory(oldName, trimmedNewName, newImage);
    await refreshCategories();
    await refreshProducts();
    return categoriesWithDetails;
  };

  const deleteCategory = async (categoryName) => {
    await api.deleteCategory(categoryName);
    await refreshCategories();
    return categoriesWithDetails;
  };

  const addProduct = async (product) => {
    try {
      const newProd = await api.addProduct(product);
      setProducts(prev => [newProd, ...prev]);
      return newProd;
    } catch (error) {
      console.error('Error adding product to PostgreSQL:', error);
      throw error;
    }
  };

  const updateProduct = async (id, updatedProduct) => {
    try {
      const res = await api.updateProduct(id, updatedProduct);
      setProducts(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...res } : p));
      return res;
    } catch (error) {
      console.error('Error updating product in PostgreSQL:', error);
      setProducts(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...updatedProduct } : p));
    }
  };

  const deleteProduct = async (id) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
    } catch (error) {
      console.error('Error deleting product from PostgreSQL:', error);
      setProducts(prev => prev.filter(p => String(p.id) !== String(id)));
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
      categoriesWithDetails,
      addCategory,
      updateCategory,
      deleteCategory,
      searchQuery, 
      setSearchQuery 
    }}>
      {children}
    </ProductContext.Provider>
  );
};
