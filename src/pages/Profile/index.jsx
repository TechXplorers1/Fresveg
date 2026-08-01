import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { realtimeDb } from '../../firebase';
import OrderTrackingMap from '../../components/OrderTrackingMap';
import { ref, onValue, update, set, push, remove } from 'firebase/database';
import { Instagram, Facebook, Youtube, Globe, MessageCircle, Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store, Mail, Calendar, Shield, MapPin, FileText, Pencil, Trash2, Check, X, Clock, ShoppingBag, ArrowRight, ArrowLeft, RefreshCw, ExternalLink, Navigation, LogOut as LogOutIcon, Bike, Power, Compass, CheckCircle, Users, BarChart2, TrendingUp, PieChart, ChevronDown, Loader2 } from 'lucide-react';
import ImageUploadField from '../../components/common/ImageUploadField';
import AddStayModal from './modals/AddStayModal';
import AddFarmProductModal from './modals/AddFarmProductModal';
import AddGalleryModal from './modals/AddGalleryModal';
import SignoutConfirmModal from './modals/SignoutConfirmModal';
import ProfileHeader from './components/ProfileHeader';
import ProfileTabsNav from './components/ProfileTabsNav';
import VendorAnalyticsTab from './components/VendorAnalyticsTab';
import { SUB_CATEGORIES_MAP, CATEGORIES, STANDARD_UNITS, INITIAL_CROPS, EXTRA_CROPS, INITIAL_FRUITS, EXTRA_FRUITS, INITIAL_LIVESTOCK, EXTRA_LIVESTOCK, INITIAL_KIDS_ACTIVITIES, EXTRA_KIDS_ACTIVITIES, INITIAL_ACCOMMODATIONS, EXTRA_ACCOMMODATIONS, formatUpdatedTime, geocodeAddress } from './constants/profileConstants';




export default function Profile() {
    const { user, userProfile, loading, updateProfile, logout } = useAuth();
    const { products: allProducts, addProduct, updateProduct, deleteProduct, categories: dynamicCategories } = useProducts();
    const categories = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : CATEGORIES;
    const navigate = useNavigate();

    // ─── Vendor Custom Dashboard State Sync with URL ──────────────────────────────
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'addresses';
    const [activeTab, setActiveTab] = useState(tabFromUrl); // 'addresses', 'orders', 'setup', 'my_products', 'farms', 'analytics'

    // Synchronize activeTab state whenever URL search params change (browser back/forward button)
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab) {
            setActiveTab(currentTab);
        } else {
            setActiveTab('addresses');
            setSearchParams({ tab: 'addresses' }, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setSearchParams({ tab: newTab });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

    const handleVendorLogout = () => {
        setShowSignoutConfirm(true);
    };

    const handleConfirmLogout = async () => {
        setShowSignoutConfirm(false);
        try {
            await logout();
            navigate('/');
        } catch (e) {
            console.error("Failed to log out vendor", e);
        }
    };

    // Safely migrate existing users and define current shops array
    const vendorShops = userProfile?.shops || [];

    const [selectedShopFilter, setSelectedShopFilter] = useState(null);

    const isVendor = userProfile?.role === 'vendor';

    // Vendor sees ONLY products belonging strictly to their registered shops or user UID / Email
    const vendorProducts = allProducts.filter(p => {
        const matchesVendorId = Boolean((p.vendorId && user?.uid && String(p.vendorId) === String(user.uid)) || (p.vendorEmail && user?.email && p.vendorEmail === user.email));
        const matchesShopName = Boolean(vendorShops.some(shop => shop.shopName && p.vendor && shop.shopName.trim().toLowerCase() === p.vendor.trim().toLowerCase()));

        // Strict ownership: must match vendor's shop name OR vendor UID / Email
        const belongsToVendor = matchesVendorId || matchesShopName;

        if (!belongsToVendor) return false;

        if (selectedShopFilter) {
            return p.vendor?.trim().toLowerCase() === selectedShopFilter.trim().toLowerCase();
        }
        return true;
    });



    // ─── UI Visibility States ───────────────────────────────────────────────────
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddShopForm, setShowAddShopForm] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null);

    // ─── Add Product State ──────────────────────────────────────────────────────
    const [newProduct, setNewProduct] = useState({
        name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', shop: '', unit: 'kg',
        description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
        netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
    });

    const EMPTY_SOCIAL_LINKS = { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' };

    // ─── Add Shop States ────────────────────────────────────────────────────────
    const [shopSetup, setShopSetup] = useState({ shopName: '', location: '', gstNumber: '', image: '', socialLinks: EMPTY_SOCIAL_LINKS });
    const [newShop, setNewShop] = useState({ shopName: '', location: '', gstNumber: '', image: '', socialLinks: EMPTY_SOCIAL_LINKS });

    // ─── Edit Shop State ────────────────────────────────────────────────────────
    const [editingShopIndex, setEditingShopIndex] = useState(null);
    const [editShopForm, setEditShopForm] = useState({ shopName: '', location: '', gstNumber: '', image: '', socialLinks: { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' } });

    // ─── Edit / Delete Product State ────────────────────────────────────────────
    const [editingProductId, setEditingProductId] = useState(null);
    const [editProductForm, setEditProductForm] = useState({
        name: '', price: '', mrp: '', stockQuantity: '', category: '', image: '', unit: '',
        description: '', origin: '', preference: '', shelfLife: '',
        netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
    });
    const [deletingProductId, setDeletingProductId] = useState(null);

    const [detectingShopLocation, setDetectingShopLocation] = useState(false);
    const [deletingShopIndex, setDeletingShopIndex] = useState(null);
    const [viewingShopIndex, setViewingShopIndex] = useState(null);

    // Submitting / Loading states for buttons
    const [isSubmittingShop, setIsSubmittingShop] = useState(false);
    const [isAddingShop, setIsAddingShop] = useState(false);
    const [isUpdatingShop, setIsUpdatingShop] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isAddingProductState, setIsAddingProductState] = useState(false);
    const [isUpdatingProductState, setIsUpdatingProductState] = useState(false);
    const [isSavingGallery, setIsSavingGallery] = useState(false);
    const [isSavingModalProduct, setIsSavingModalProduct] = useState(false);
    const [isSavingStayState, setIsSavingStayState] = useState(false);

    const handleGetCurrentLocation = (setter, formState) => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setDetectingShopLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (response.ok) {
                        const data = await response.json();
                        const address = data.display_name || `${latitude}, ${longitude}`;
                        setter({ ...formState, location: address });
                    } else {
                        setter({ ...formState, location: `${latitude}, ${longitude}` });
                    }
                } catch (error) {
                    setter({ ...formState, location: `${latitude}, ${longitude}` });
                } finally {
                    setDetectingShopLocation(false);
                }
            },
            (error) => {
                console.error(error);
                alert("Unable to retrieve your location. Make sure location access is enabled.");
                setDetectingShopLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };



    // ─── Shop Handlers ──────────────────────────────────────────────────────────
    const handleShopSetup = async (e) => {
        e.preventDefault();
        if (shopSetup.shopName.trim() && shopSetup.location.trim() && shopSetup.gstNumber.trim()) {
            setIsSubmittingShop(true);
            try {
                const now = new Date().toISOString();
                const shop = {
                    shopName: shopSetup.shopName.trim(),
                    location: shopSetup.location.trim(),
                    gstNumber: shopSetup.gstNumber.trim(),
                    image: shopSetup.image.trim(),
                    socialLinks: shopSetup.socialLinks || EMPTY_SOCIAL_LINKS,
                    createdAt: now,
                    updatedAt: now
                };
                await updateProfile({ shops: [...vendorShops, shop] });
                setShopSetup({ shopName: '', location: '', gstNumber: '', image: '', socialLinks: EMPTY_SOCIAL_LINKS });
            } catch (err) {
                console.error('Error during shop setup:', err);
            } finally {
                setIsSubmittingShop(false);
            }
        }
    };

    const handleAddAdditionalShop = async (e) => {
        e.preventDefault();
        if (newShop.shopName.trim() && newShop.location.trim() && newShop.gstNumber.trim()) {
            setIsAddingShop(true);
            try {
                const now = new Date().toISOString();
                const shopToAdd = {
                    shopName: newShop.shopName.trim(),
                    location: newShop.location.trim(),
                    gstNumber: newShop.gstNumber.trim(),
                    image: newShop.image.trim(),
                    socialLinks: newShop.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
                    createdAt: now,
                    updatedAt: now
                };
                await updateProfile({ shops: [...vendorShops, shopToAdd] });
                setNewShop({ shopName: '', location: '', gstNumber: '', image: '', socialLinks: EMPTY_SOCIAL_LINKS });
                setShowAddShopForm(false);
            } catch (err) {
                console.error('Error adding shop:', err);
            } finally {
                setIsAddingShop(false);
            }
        }
    };

    const handleEditShopClick = (shop, index) => {
        setEditingShopIndex(index);
        setEditShopForm({
            shopName: shop.shopName,
            location: shop.location,
            gstNumber: shop.gstNumber,
            image: shop.image || '',
            socialLinks: shop.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' }
        });
    };

    const handleUpdateShop = async (e) => {
        e.preventDefault();
        const oldShopName = vendorShops[editingShopIndex].shopName;
        const newShopName = editShopForm.shopName.trim();
        const now = new Date().toISOString();
        setIsUpdatingShop(true);
        try {
            const updatedShops = vendorShops.map((shop, i) =>
                i === editingShopIndex
                    ? {
                        ...shop,
                        shopName: newShopName,
                        location: editShopForm.location.trim(),
                        gstNumber: editShopForm.gstNumber.trim(),
                        image: editShopForm.image.trim(),
                        socialLinks: editShopForm.socialLinks || { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' },
                        updatedAt: now
                    }
                    : shop
            );

            // If shopName changed, update all products belonging to the old shop name
            if (oldShopName !== newShopName) {
                const shopProducts = allProducts.filter(p => p.vendor === oldShopName);
                shopProducts.forEach(product => {
                    updateProduct(product.id, { vendor: newShopName });
                });
                // Update selected shop filter if it was active
                if (selectedShopFilter === oldShopName) {
                    setSelectedShopFilter(newShopName);
                }
            }

            await updateProfile({ shops: updatedShops });
            setEditingShopIndex(null);
        } catch (err) {
            console.error('Error updating shop:', err);
        } finally {
            setIsUpdatingShop(false);
        }
    };

    const handleDeleteShop = (index) => {
        const shopToDelete = vendorShops[index];
        if (shopToDelete) {
            // Clean up products associated with the deleted shop name
            const shopProducts = allProducts.filter(p => p.vendor === shopToDelete.shopName);
            shopProducts.forEach(product => {
                deleteProduct(product.id);
            });

            // Update user profile shops
            const updatedShops = vendorShops.filter((_, i) => i !== index);
            updateProfile({ shops: updatedShops });
            setDeletingShopIndex(null);
        }
    };

    const handleOpenAddProductForShop = (shopName) => {
        const defaultShop = shopName || (vendorShops[0]?.shopName) || userProfile?.displayName || user?.displayName || 'My Vendor Shop';
        setNewProduct({
            name: '', price: '', mrp: '', stockQuantity: '100', category: '', subCategory: '', image: '', shop: defaultShop, unit: 'kg',
            description: '', origin: 'India', preference: 'Vegetarian', shelfLife: '7 days',
            netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
        });
        setShowAddForm(true);
    };

    // ─── Product Handlers ───────────────────────────────────────────────────────
    const handleInputChange = (e) => setNewProduct({ ...newProduct, [e.target.name]: e.target.value });

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('You must be signed in to add a product.');
            return;
        }

        try {
            const selectedShop = vendorShops.find(shop => shop.shopName === newProduct.shop) || vendorShops[0];
            const fallbackShopName = userProfile?.displayName || user?.displayName || 'My Vendor Shop';
            const targetShopName = selectedShop?.shopName || (newProduct.shop && newProduct.shop.trim()) || fallbackShopName;

            const priceVal = parseFloat(newProduct.price) || 0;
            const mrpVal = newProduct.mrp ? parseFloat(newProduct.mrp) : priceVal;
            const finalMrp = mrpVal < priceVal ? priceVal : mrpVal;

            const productData = {
                name: newProduct.name.trim(),
                price: priceVal,
                mrp: finalMrp,
                unit: newProduct.unit ? newProduct.unit.trim() : 'kg',
                category: newProduct.category || 'General',
                subCategory: newProduct.subCategory || '',
                image: newProduct.image && newProduct.image.trim() ? newProduct.image.trim() : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
                shop: targetShopName,
                vendor: targetShopName,
                vendorId: user.uid,
                vendorEmail: user.email || '',
                stockQuantity: newProduct.stockQuantity ? parseInt(newProduct.stockQuantity) : 100,
                shopLocation: selectedShop?.location || '',
                description: newProduct.description || '',
                origin: newProduct.origin || 'India',
                preference: newProduct.preference || 'Vegetarian',
                shelfLife: newProduct.shelfLife || '',
                netWeight: newProduct.netWeight || '',
                harvestDate: newProduct.harvestDate || '',
                organicCert: newProduct.organicCert || '',
                storageInfo: newProduct.storageInfo || '',
                returnPolicy: newProduct.returnPolicy || '',
                offers: typeof newProduct.offers === 'string' ? newProduct.offers.split('\n').filter(line => line.trim() !== '') : newProduct.offers || [],
                features: typeof newProduct.features === 'string' ? newProduct.features.split('\n').filter(line => line.trim() !== '') : newProduct.features || [],
                rating: 5.0,
                createdAt: new Date().toISOString()
            };

            // Single Product Creation via ProductContext
            await addProduct(productData);

            setSuccessModalData({
                title: 'Product Added Successfully! 🎉',
                message: `Product "${productData.name}" added to shop "${targetShopName}" successfully!`
            });

            setNewProduct({
                name: '', price: '', mrp: '', stockQuantity: '', category: '', subCategory: '', image: '', shop: '', unit: 'kg',
                description: '', origin: '', preference: 'Vegetarian', shelfLife: '',
                netWeight: '', returnPolicy: '', offers: '', features: '', harvestDate: '', organicCert: '', storageInfo: ''
            });
            setShowAddForm(false);
        } catch (err) {
            console.error('Failed to add product to Firebase:', err);
            if (err.message && err.message.includes('PERMISSION_DENIED')) {
                alert('⚠️ Firebase Security Rules Notice:\n\nYour Firebase Realtime Database is blocking writes to the "products" node (PERMISSION_DENIED).\n\nTo fix this:\n1. Open Firebase Console -> Realtime Database -> Rules tab.\n2. Set ".read": true and ".write": true\n3. Click Publish!');
            } else {
                alert('Error adding product to Firebase: ' + err.message);
            }
        }
    };

    const handleEditProductClick = (product) => {
        setEditingProductId(product.id);
        setEditProductForm({
            name: product.name || '',
            shop: product.vendor || product.shop || '',
            price: String(product.price || ''),
            mrp: product.mrp ? String(product.mrp) : String(product.price || ''),
            stockQuantity: String(product.stockQuantity || 100),
            category: product.category || '',
            image: product.image || '',
            unit: product.unit || 'kg',
            netWeight: product.netWeight || '',
            preference: product.preference || 'Vegetarian',
            origin: product.origin || '',
            shelfLife: product.shelfLife || '',
            harvestDate: product.harvestDate || '',
            organicCert: product.organicCert || '',
            storageInfo: product.storageInfo || '',
            description: product.description || '',
            returnPolicy: product.returnPolicy || '',
            offers: Array.isArray(product.offers) ? product.offers.join('\n') : (product.offers || ''),
            features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || '')
        });
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (!editingProductId) return;
        try {
            const selectedShop = vendorShops.find(shop => shop.shopName === editProductForm.shop) || vendorShops[0];
            const targetShopName = selectedShop?.shopName || editProductForm.shop || 'Local Vendor';

            const updatedData = {
                name: editProductForm.name.trim(),
                price: parseFloat(editProductForm.price) || 0,
                mrp: editProductForm.mrp ? parseFloat(editProductForm.mrp) : (parseFloat(editProductForm.price) || 0),
                unit: editProductForm.unit.trim() || 'kg',
                category: editProductForm.category || 'General',
                image: editProductForm.image.trim() || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
                shop: targetShopName,
                vendor: targetShopName,
                vendorId: user?.uid || '',
                stockQuantity: editProductForm.stockQuantity ? parseInt(editProductForm.stockQuantity) : 100,
                shopLocation: selectedShop?.location || '',
                preference: editProductForm.preference || 'Vegetarian',
                origin: editProductForm.origin || '',
                shelfLife: editProductForm.shelfLife || '',
                harvestDate: editProductForm.harvestDate || '',
                organicCert: editProductForm.organicCert || '',
                storageInfo: editProductForm.storageInfo || '',
                description: editProductForm.description || '',
                netWeight: editProductForm.netWeight || '',
                returnPolicy: editProductForm.returnPolicy || '',
                offers: typeof editProductForm.offers === 'string' ? editProductForm.offers.split('\n').filter(line => line.trim() !== '') : editProductForm.offers || [],
                features: typeof editProductForm.features === 'string' ? editProductForm.features.split('\n').filter(line => line.trim() !== '') : editProductForm.features || []
            };

            await updateProduct(editingProductId, updatedData);
            setEditingProductId(null);
            alert('✨ Product updated successfully!');
        } catch (err) {
            console.error('Failed to update product:', err);
            alert('Error updating product: ' + err.message);
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await deleteProduct(productId);
        } catch (err) {
            console.error('Error deleting product:', err);
        } finally {
            setDeletingProductId(null);
        }
    };

    // ─── Farm States & Handlers ────────────────────────────────────────────────
    const [vendorFarms, setVendorFarms] = useState([]);
    const [incomingFarmBookings, setIncomingFarmBookings] = useState([]);
    const [showAddFarmForm, setShowAddFarmForm] = useState(false);
    const [farmFormStep, setFarmFormStep] = useState(1);
    const [newFarmForm, setNewFarmForm] = useState({
        farmName: '',
        location: '',
        description: '',
        costPerPerson: '',
        costType: 'free',
        image: '',
        crops: '',
        fruits: '',
        livestock: '',
        accommodations: '',
        accommodationPrice: '',
        amenities: '',
        farmProducts: ''
    });
    const [isSubmittingFarm, setIsSubmittingFarm] = useState(false);
    const [detectingFarmLocation, setDetectingFarmLocation] = useState(false);
    const [farmMapCoords, setFarmMapCoords] = useState(null);
    const [editingFarmId, setEditingFarmId] = useState(null);
    const [deletingFarmId, setDeletingFarmId] = useState(null);
    const [editFarmForm, setEditFarmForm] = useState({
        farmName: '',
        location: '',
        description: '',
        costPerPerson: '',
        costType: 'free',
        image: ''
    });
    const [showMoreCrops, setShowMoreCrops] = useState(false);
    const [showMoreFruits, setShowMoreFruits] = useState(false);
    const [showMoreLivestock, setShowMoreLivestock] = useState(false);
    const [showMoreAccommodations, setShowMoreAccommodations] = useState(false);
    const [showMoreKids, setShowMoreKids] = useState(false);
    const [kidsInputText, setKidsInputText] = useState('');

    // Step 5 Stay Modal States
    const [showAddStayModal, setShowAddStayModal] = useState(false);
    const [editingStayIndex, setEditingStayIndex] = useState(null);
    const [newStayForm, setNewStayForm] = useState({ name: '', price: '', description: '', image: '' });
    const [stayList, setStayList] = useState([]);
    const [cropInputText, setCropInputText] = useState('');
    const [fruitInputText, setFruitInputText] = useState('');
    const [livestockInputText, setLivestockInputText] = useState('');
    const [accInputText, setAccInputText] = useState('');

    const [showAddFarmProductModal, setShowAddFarmProductModal] = useState(false);
    const [editingModalProductIndex, setEditingModalProductIndex] = useState(null);
    const [newFarmProductForm, setNewFarmProductForm] = useState({
        name: '',
        category: 'Vegetables',
        subCategory: 'Organic Spinach',
        price: '',
        unit: 'kg',
        customUnit: '',
        image: ''
    });
    const [farmProductList, setFarmProductList] = useState([]);

    const handleEditModalProduct = (idx) => {
        const product = farmProductList[idx];
        if (!product) return;
        setEditingModalProductIndex(idx);
        const cat = product.category || 'Vegetables';
        const subCatList = SUB_CATEGORIES_MAP[cat] || SUB_CATEGORIES_MAP['Vegetables'];
        setNewFarmProductForm({
            name: product.name || '',
            category: cat,
            subCategory: product.subCategory || subCatList[0] || '',
            price: product.price || '',
            unit: product.unit || 'kg',
            customUnit: '',
            image: product.image || ''
        });
        setShowAddFarmProductModal(true);
    };

    const handleSaveModalProduct = (e) => {
        if (e) e.preventDefault();
        if (!newFarmProductForm.name.trim() || !newFarmProductForm.price) {
            alert("Please enter product name and price.");
            return;
        }
        const finalUnit = newFarmProductForm.unit === 'Other...'
            ? (newFarmProductForm.customUnit.trim() || 'unit')
            : newFarmProductForm.unit;

        let updatedList = [];
        if (editingModalProductIndex !== null && editingModalProductIndex >= 0) {
            updatedList = farmProductList.map((p, idx) =>
                idx === editingModalProductIndex
                    ? {
                        ...p,
                        name: newFarmProductForm.name.trim(),
                        category: newFarmProductForm.category || 'Vegetables',
                        subCategory: newFarmProductForm.subCategory || '',
                        price: Number(newFarmProductForm.price) || 0,
                        unit: finalUnit,
                        image: newFarmProductForm.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'
                    }
                    : p
            );
            setEditingModalProductIndex(null);
        } else {
            const productObj = {
                id: `fp-${Date.now()}`,
                name: newFarmProductForm.name.trim(),
                category: newFarmProductForm.category || 'Vegetables',
                subCategory: newFarmProductForm.subCategory || '',
                price: Number(newFarmProductForm.price) || 0,
                unit: finalUnit,
                image: newFarmProductForm.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
                vendor: newFarmForm.farmName || 'Farm Direct'
            };
            updatedList = [...farmProductList, productObj];
        }

        setFarmProductList(updatedList);
        setNewFarmForm(prev => ({ ...prev, farmProducts: updatedList }));
        setShowAddFarmProductModal(false);
        setNewFarmProductForm({ name: '', category: 'Vegetables', subCategory: 'Organic Spinach', price: '', unit: 'kg', customUnit: '', image: '' });
    };

    const handleRemoveModalProduct = (indexToRemove) => {
        const updatedList = farmProductList.filter((_, idx) => idx !== indexToRemove);
        setFarmProductList(updatedList);
        setNewFarmForm(prev => ({ ...prev, farmProducts: updatedList }));
    };

    const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);
    const [newGalleryForm, setNewGalleryForm] = useState({ url: '', caption: '' });
    const [farmGalleryList, setFarmGalleryList] = useState([]);

    const handleAddGalleryPhoto = (e) => {
        if (e) e.preventDefault();
        if (!newGalleryForm.url.trim()) {
            alert("Please enter a valid Image URL.");
            return;
        }
        const photoObj = {
            id: `g-${Date.now()}`,
            url: newGalleryForm.url.trim(),
            caption: newGalleryForm.caption.trim() || 'Farm Tour Photo'
        };
        setFarmGalleryList(prev => [...prev, photoObj]);
        setNewGalleryForm({ url: '', caption: '' });
        setShowAddGalleryModal(false);
    };

    const handleRemoveGalleryPhoto = (indexToRemove) => {
        setFarmGalleryList(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const INITIAL_CROPS = ['Strawberries', 'Cherry Tomatoes', 'Sweet Corn', 'Spinach', 'Carrots'];
    const EXTRA_CROPS = ['Capsicum', 'Broccoli', 'Organic Wheat', 'Red Onions', 'Potatoes', 'Herbs', 'Lettuce', 'Cabbage', 'Radish'];

    const INITIAL_FRUITS = ['Mango Orchards', 'Guava Groves', 'Papaya', 'Apple Trees', 'Banana Plantation'];
    const EXTRA_FRUITS = ['Pomegranate', 'Orange Groves', 'Coconut Palms', 'Dragonfruit', 'Custard Apple', 'Pineapple', 'Lemon Trees', 'Jackfruit'];

    const INITIAL_LIVESTOCK = ['Pure Gir Cows', 'Goats & Sheep', 'Free-Range Poultry', 'Rabbits & Ducks', 'Honey Bees'];
    const EXTRA_LIVESTOCK = ['Buffaloes', 'Horses & Ponies', 'Fish Ponds', 'Turkeys', 'Geese', 'Quails', 'Dairy Cattle'];

    const INITIAL_KIDS_ACTIVITIES = [
        '🎈 Kids Playground & Swings',
        '🐰 Bunny & Petting Corner',
        '🎨 Pottery & Clay Crafts',
        '🚜 Mini Tractor Rides',
        '🐟 Fish Feeding Pond',
        '🚴 Kids Bicycle Trails'
    ];
    const EXTRA_KIDS_ACTIVITIES = [
        '🏹 Archery & Ring Toss',
        '🌾 Straw Maze Adventure',
        '🪁 Kite Flying & Open Lawns',
        '🌳 Treehouse Play Zone',
        '🐴 Pony & Donkey Rides',
        '🧁 Organic Cookie & Jam Workshops'
    ];

    const INITIAL_ACCOMMODATIONS = ['Farmhouse Rooms', 'Rustic Mud Huts', 'Camping Tents', 'Treehouse Stays', 'Shaded Hammocks'];
    const EXTRA_ACCOMMODATIONS = ['Luxury Villas', 'Wooden Cottages', 'Dormitory Stays', 'Glamping Pods', 'Caravan Parking'];

    const handleAddKidsChip = (activityName) => {
        const trimmed = activityName.trim();
        if (!trimmed) return;
        const current = newFarmForm.kidsActivities ? newFarmForm.kidsActivities.split(',').map(k => k.trim()).filter(Boolean) : [];
        if (!current.some(k => k.toLowerCase() === trimmed.toLowerCase())) {
            const updated = [...current, trimmed].join(', ');
            setNewFarmForm(prev => ({ ...prev, kidsActivities: updated }));
        }
        setKidsInputText('');
    };

    const handleRemoveKidsChip = (activityName) => {
        const current = newFarmForm.kidsActivities ? newFarmForm.kidsActivities.split(',').map(k => k.trim()).filter(Boolean) : [];
        const updated = current.filter(k => k.toLowerCase() !== activityName.toLowerCase()).join(', ');
        setNewFarmForm(prev => ({ ...prev, kidsActivities: updated }));
    };

    const handleAddCropChip = (cropName) => {
        const trimmed = cropName.trim();
        if (!trimmed) return;
        const current = newFarmForm.crops ? newFarmForm.crops.split(',').map(c => c.trim()).filter(Boolean) : [];
        if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            const updated = [...current, trimmed].join(', ');
            setNewFarmForm(prev => ({ ...prev, crops: updated }));
        }
        setCropInputText('');
    };

    const handleRemoveCropChip = (cropName) => {
        const current = newFarmForm.crops ? newFarmForm.crops.split(',').map(c => c.trim()).filter(Boolean) : [];
        const updated = current.filter(c => c.toLowerCase() !== cropName.toLowerCase()).join(', ');
        setNewFarmForm(prev => ({ ...prev, crops: updated }));
    };

    const handleAddFruitChip = (fruitName) => {
        const trimmed = fruitName.trim();
        if (!trimmed) return;
        const current = newFarmForm.fruits ? newFarmForm.fruits.split(',').map(f => f.trim()).filter(Boolean) : [];
        if (!current.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
            const updated = [...current, trimmed].join(', ');
            setNewFarmForm(prev => ({ ...prev, fruits: updated }));
        }
        setFruitInputText('');
    };

    const handleRemoveFruitChip = (fruitName) => {
        const current = newFarmForm.fruits ? newFarmForm.fruits.split(',').map(f => f.trim()).filter(Boolean) : [];
        const updated = current.filter(f => f.toLowerCase() !== fruitName.toLowerCase()).join(', ');
        setNewFarmForm(prev => ({ ...prev, fruits: updated }));
    };

    const handleAddLivestockChip = (animalName) => {
        const trimmed = animalName.trim();
        if (!trimmed) return;
        const current = newFarmForm.livestock ? newFarmForm.livestock.split(',').map(a => a.trim()).filter(Boolean) : [];
        if (!current.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
            const updated = [...current, trimmed].join(', ');
            setNewFarmForm(prev => ({ ...prev, livestock: updated }));
        }
        setLivestockInputText('');
    };

    const handleRemoveLivestockChip = (animalName) => {
        const current = newFarmForm.livestock ? newFarmForm.livestock.split(',').map(a => a.trim()).filter(Boolean) : [];
        const updated = current.filter(a => a.toLowerCase() !== animalName.toLowerCase()).join(', ');
        setNewFarmForm(prev => ({ ...prev, livestock: updated }));
    };

    const handleOpenAddStayModal = () => {
        setEditingStayIndex(null);
        setNewStayForm({ name: '', price: '', description: '', image: '' });
        setShowAddStayModal(true);
    };

    const handleEditStay = (index) => {
        const item = stayList[index];
        if (!item) return;
        setEditingStayIndex(index);
        setNewStayForm({
            name: item.title || item.name || '',
            price: item.rawPrice || (item.price ? item.price.replace(/[^0-9]/g, '') : ''),
            description: item.desc || item.description || '',
            image: item.image || item.url || ''
        });
        setShowAddStayModal(true);
    };

    const handleSaveStay = (e) => {
        if (e) e.preventDefault();
        if (!newStayForm.name.trim()) {
            alert("Please enter a Stay / Accommodation Name.");
            return;
        }

        const priceNum = newStayForm.price ? Number(newStayForm.price) : 0;
        const priceStr = priceNum > 0 ? '₹' + priceNum + '/night' : 'Free';
        const stayTitle = newStayForm.name.trim();

        const stayObj = {
            id: editingStayIndex !== null && stayList[editingStayIndex] ? stayList[editingStayIndex].id : 'stay-' + Date.now(),
            title: stayTitle,
            name: stayTitle,
            price: priceStr,
            rawPrice: priceNum,
            desc: newStayForm.description.trim() || 'Comfortable ' + stayTitle.toLowerCase() + ' experience at the farm',
            description: newStayForm.description.trim() || 'Comfortable ' + stayTitle.toLowerCase() + ' experience at the farm',
            image: newStayForm.image.trim() || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
            icon: stayTitle.toLowerCase().includes('tent') ? 'tent' : stayTitle.toLowerCase().includes('hut') ? 'hut' : 'house'
        };

        let updatedList = [];
        if (editingStayIndex !== null && editingStayIndex >= 0) {
            updatedList = stayList.map((item, idx) => idx === editingStayIndex ? stayObj : item);
            setEditingStayIndex(null);
        } else {
            updatedList = [...stayList, stayObj];
        }

        setStayList(updatedList);

        const accNames = updatedList.map(s => s.title + (s.rawPrice ? ' (₹' + s.rawPrice + '/night)' : '')).join(', ');
        setNewFarmForm(prev => ({
            ...prev,
            accommodations: accNames,
            accommodationPrice: updatedList[0]?.rawPrice || prev.accommodationPrice
        }));

        if (newStayForm.image.trim()) {
            const photoObj = {
                id: 'g-stay-' + Date.now(),
                url: newStayForm.image.trim(),
                caption: 'Stay: ' + stayTitle
            };
            setFarmGalleryList(prev => [...prev, photoObj]);
        }

        setShowAddStayModal(false);
        setNewStayForm({ name: '', price: '', description: '', image: '' });
    };

    const handleRemoveStay = (indexToRemove) => {
        const updatedList = stayList.filter((_, idx) => idx !== indexToRemove);
        setStayList(updatedList);
        const accNames = updatedList.map(s => s.title + (s.rawPrice ? ' (₹' + s.rawPrice + '/night)' : '')).join(', ');
        setNewFarmForm(prev => ({ ...prev, accommodations: accNames }));
    };

    const handleAddAccChip = (accName) => {
        const trimmed = accName.trim();
        if (!trimmed) return;
        const current = newFarmForm.accommodations ? newFarmForm.accommodations.split(',').map(a => a.trim()).filter(Boolean) : [];
        if (!current.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
            const updated = [...current, trimmed].join(', ');
            setNewFarmForm(prev => ({ ...prev, accommodations: updated }));
        }
        setAccInputText('');
    };

    const handleRemoveAccChip = (accName) => {
        const current = newFarmForm.accommodations ? newFarmForm.accommodations.split(',').map(a => a.trim()).filter(Boolean) : [];
        const updated = current.filter(a => a.toLowerCase() !== accName.toLowerCase()).join(', ');
        setNewFarmForm(prev => ({ ...prev, accommodations: updated }));
    };

    const farmMapContainerRef = useRef(null);
    const farmMapRef = useRef(null);
    const farmMarkerRef = useRef(null);

    const handleFarmReverseGeocode = async (lat, lng) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'FresVegApp/1.0' }
            });
            const data = await res.json();
            if (data && data.display_name) {
                setNewFarmForm(prev => ({
                    ...prev,
                    location: data.display_name
                }));
            }
        } catch (err) {
            console.error("Farm reverse geocoding failed:", err);
        }
    };

    const handleLocateFarmAddress = async () => {
        if (!newFarmForm.location.trim()) {
            alert("Please enter some address details first.");
            return;
        }
        const coords = await geocodeAddress(newFarmForm.location);
        if (coords) {
            const newCoords = { lat: coords.lat, lng: coords.lon };
            setFarmMapCoords(newCoords);
            await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
        } else {
            alert("Could not locate the farm address on the map.");
        }
    };

    const handleDetectFarmLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setDetectingFarmLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const coords = { lat: latitude, lng: longitude };
                setFarmMapCoords(coords);
                await handleFarmReverseGeocode(latitude, longitude);
                setDetectingFarmLocation(false);
            },
            (err) => {
                console.error("GPS error:", err);
                setDetectingFarmLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    useEffect(() => {
        if (!showAddFarmForm || !window.L || !farmMapContainerRef.current) {
            if (farmMapRef.current) {
                farmMapRef.current.remove();
                farmMapRef.current = null;
                farmMarkerRef.current = null;
            }
            return;
        }

        const L = window.L;
        const initialLat = farmMapCoords?.lat || 20.5937;
        const initialLng = farmMapCoords?.lng || 78.9629;

        console.log("Initializing Farm Map at:", initialLat, initialLng);

        const map = L.map(farmMapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
            attributionControl: false
        }).setView([initialLat, initialLng], farmMapCoords ? 15 : 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        farmMapRef.current = map;

        const pinHtml = `
      <div class="instamart-marker-container">
        <div class="instamart-marker-shadow"></div>
        <div class="instamart-marker-ground-dot"></div>
        <div class="instamart-marker-pin">
          <div class="instamart-marker-inner-dot"></div>
        </div>
      </div>
    `;
        const customIcon = L.divIcon({
            html: pinHtml,
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon
        }).addTo(map);

        farmMarkerRef.current = marker;

        marker.on('dragend', async () => {
            const latLng = marker.getLatLng();
            const newCoords = { lat: latLng.lat, lng: latLng.lng };
            setFarmMapCoords(newCoords);
            await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
        });

        map.on('click', async (e) => {
            const latLng = e.latlng;
            marker.setLatLng(latLng);
            const newCoords = { lat: latLng.lat, lng: latLng.lng };
            setFarmMapCoords(newCoords);
            await handleFarmReverseGeocode(newCoords.lat, newCoords.lng);
        });

        return () => {
            if (farmMapRef.current) {
                farmMapRef.current.remove();
                farmMapRef.current = null;
                farmMarkerRef.current = null;
            }
        };
    }, [showAddFarmForm]);

    useEffect(() => {
        if (farmMapRef.current && farmMarkerRef.current && farmMapCoords) {
            const { lat, lng } = farmMapCoords;
            const currentLatLng = farmMarkerRef.current.getLatLng();
            if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
                farmMarkerRef.current.setLatLng([lat, lng]);
                farmMapRef.current.setView([lat, lng], 15);
            }
        }
    }, [farmMapCoords]);

    // Automatically scroll to top of farm setup form whenever step changes or form opens
    useEffect(() => {
        if (showAddFarmForm) {
            const el = document.getElementById('farm-setup-wizard');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [farmFormStep, showAddFarmForm]);

    // Farms listener
    useEffect(() => {
        if (!user || userProfile?.role !== 'vendor') return;
        const farmsRef = ref(realtimeDb, 'farms');
        const unsubscribe = onValue(farmsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                })).filter(f => f.vendorId === user.uid);
                setVendorFarms(list);
            } else {
                setVendorFarms([]);
            }
        });
        return () => unsubscribe();
    }, [user, userProfile]);

    // Bookings listener
    useEffect(() => {
        if (!user || userProfile?.role !== 'vendor') return;
        const bookingsRef = ref(realtimeDb, 'farmBookings');
        const unsubscribe = onValue(bookingsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const allBookings = Object.keys(data).map(key => ({
                    ...data[key],
                    id: key
                }));

                const myFarmIds = vendorFarms.map(f => f.id);
                let vendorMockFarmIds = [];
                if (userProfile?.displayName === 'Orchard Farms') vendorMockFarmIds.push('mock-farm-1');
                if (userProfile?.displayName === 'Green Valley Farm') vendorMockFarmIds.push('mock-farm-2');
                if (userProfile?.displayName === 'Sunshine Produce') vendorMockFarmIds.push('mock-farm-3');

                const activeFarmIds = [...myFarmIds, ...vendorMockFarmIds];
                const filtered = allBookings.filter(b => activeFarmIds.includes(b.farmId));
                filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
                setIncomingFarmBookings(filtered);
            } else {
                setIncomingFarmBookings([]);
            }
        });
        return () => unsubscribe();
    }, [user, userProfile, vendorFarms]);

    const handleAddFarm = async (e) => {
        e.preventDefault();
        if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim()) {
            alert('Please fill out Farm Name and Location.');
            return;
        }

        setIsSubmittingFarm(true);
        try {
            const farmsRef = ref(realtimeDb, 'farms');
            const newFarmRef = push(farmsRef);
            const isFree = newFarmForm.costType === 'free';
            const finalCost = isFree ? 0 : (Number(newFarmForm.costPerPerson) || 0);

            const farmData = {
                farmName: newFarmForm.farmName.trim(),
                location: newFarmForm.location.trim(),
                description: newFarmForm.description.trim(),
                costPerPerson: finalCost,
                image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
                vendorId: user.uid,
                vendorName: userProfile?.displayName || user?.displayName || 'Vendor',
                createdAt: new Date().toISOString()
            };
            await set(newFarmRef, farmData);
            setNewFarmForm({ farmName: '', location: '', description: '', costPerPerson: '', image: '' });
            setShowAddFarmForm(false);
            alert('Farm successfully listed!');
        } catch (err) {
            console.error('Failed to add farm:', err);
            alert('Error listing farm: ' + err.message);
        } finally {
            setIsSubmittingFarm(false);
        }
    };

    const handleDeleteFarm = async (farmId) => {
        try {
            const farmRef = ref(realtimeDb, `farms/${farmId}`);
            await remove(farmRef);
            setDeletingFarmId(null);
            alert('Farm deleted successfully.');
        } catch (err) {
            console.error('Failed to delete farm:', err);
            alert('Failed to delete farm: ' + err.message);
        }
    };

    const handleEditFarmClick = (farm) => {
        const slug = farm.farmName
            ? farm.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            : farm.id;
        navigate(`/farm/${slug}?edit=true`);
    };

    const handleSaveFarmForm = async (e) => {
        if (e) e.preventDefault();
        if (farmFormStep < 7) {
            return;
        }
        if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim()) {
            alert('Please fill out Farm Name and Location.');
            return;
        }

        setIsSubmittingFarm(true);
        try {
            const isFree = newFarmForm.costType === 'free';
            const finalCost = isFree ? 0 : (Number(newFarmForm.costPerPerson) || 0);

            const parseList = (str) => {
                if (!str) return [];
                if (Array.isArray(str)) return str;
                return str.split(',').map(s => s.trim()).filter(Boolean);
            };

            const parseAccommodations = (str) => {
                const list = parseList(str);
                if (list.length === 0) return [];
                return list.map((item, idx) => {
                    if (typeof item === 'object') return item;
                    const titleStr = String(item);
                    return {
                        id: `acc-${idx + 1}`,
                        title: titleStr,
                        desc: `Comfortable ${titleStr.toLowerCase()} experience at the farm`,
                        price: '',
                        icon: titleStr.toLowerCase().includes('tent') ? 'tent' : titleStr.toLowerCase().includes('hut') ? 'hut' : 'house'
                    };
                });
            };

            const parseProducts = (str) => {
                if (!str) return [];
                if (Array.isArray(str)) return str;
                const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
                return lines.map((line, idx) => {
                    const matchPrice = line.match(/₹?\s*(\d+)/);
                    const price = matchPrice ? Number(matchPrice[1]) : 120;
                    const cleanName = line.replace(/\(.*\)/, '').replace(/₹?\s*\d+.*/, '').trim() || line;
                    return {
                        id: `fp-${Date.now()}-${idx}`,
                        name: cleanName,
                        price,
                        unit: 'pack',
                        image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
                        vendor: newFarmForm.farmName || 'Farm Direct'
                    };
                });
            };

            const existingFarm = editingFarmId ? vendorFarms.find(f => f.id === editingFarmId) : null;
            const now = new Date().toISOString();

            const farmData = {
                farmName: newFarmForm.farmName.trim(),
                location: newFarmForm.location.trim(),
                description: newFarmForm.description.trim(),
                costPerPerson: finalCost,
                image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
                crops: parseList(newFarmForm.crops),
                fruits: parseList(newFarmForm.fruits),
                livestock: parseList(newFarmForm.livestock),
                kidsActivities: parseList(newFarmForm.kidsActivities),
                accommodations: parseAccommodations(newFarmForm.accommodations),
                accommodationPrice: newFarmForm.accommodationPrice ? parseFloat(newFarmForm.accommodationPrice) : 0,
                amenities: parseList(newFarmForm.amenities),
                farmProducts: parseProducts(newFarmForm.farmProducts),
                gallery: farmGalleryList,
                cropPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard') || g.caption?.toLowerCase().includes('produce') || g.category === 'crop'),
                livestockPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('cow') || g.caption?.toLowerCase().includes('goat') || g.caption?.toLowerCase().includes('animal') || g.caption?.toLowerCase().includes('livestock') || g.caption?.toLowerCase().includes('poultry') || g.caption?.toLowerCase().includes('bee') || g.caption?.toLowerCase().includes('duck') || g.caption?.toLowerCase().includes('sheep') || g.caption?.toLowerCase().includes('chicken') || g.category === 'livestock'),
                kidsPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting') || g.caption?.toLowerCase().includes('fun') || g.category === 'kids'),
                accommodationPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('stay') || g.caption?.toLowerCase().includes('hut') || g.caption?.toLowerCase().includes('tent') || g.caption?.toLowerCase().includes('room') || g.caption?.toLowerCase().includes('cottage') || g.caption?.toLowerCase().includes('villa') || g.category === 'stay'),
                visitDays: (newFarmForm.visitDays || '').trim(),
                visitTimings: (newFarmForm.visitTimings || '').trim(),
                vendorId: user.uid,
                vendorName: userProfile?.displayName || user?.displayName || 'Vendor',
                createdAt: editingFarmId ? (existingFarm?.createdAt || now) : now,
                updatedAt: now
            };

            if (editingFarmId) {
                const farmRef = ref(realtimeDb, `farms/${editingFarmId}`);
                const farmDataWithId = { ...farmData, id: editingFarmId };
                await set(farmRef, farmDataWithId);
                setSuccessModalData({
                    title: 'Farm Updated Successfully! 🎉',
                    message: `Your farm listing "${farmData.farmName}" has been updated live on FresVeg!`
                });
            } else {
                const farmsRef = ref(realtimeDb, 'farms');
                const newFarmRef = push(farmsRef);
                const farmDataWithId = { ...farmData, id: newFarmRef.key };
                await set(newFarmRef, farmDataWithId);
                setSuccessModalData({
                    title: 'Farm Successfully Listed! 🎉',
                    message: `Congratulations! Your farm listing "${farmData.farmName}" is now active and published on FresVeg!`
                });
            }

            setEditingFarmId(null);
            setNewFarmForm({
                farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
                crops: '', fruits: '', livestock: '', kidsActivities: '', accommodations: '', amenities: '', farmProducts: '',
                visitDays: '', visitTimings: ''
            });
            setShowAddFarmForm(false);
        } catch (err) {
            console.error('Failed to save farm:', err);
            alert('Error saving farm: ' + err.message);
        } finally {
            setIsSubmittingFarm(false);
        }
    };

    const handleCancelFarmForm = () => {
        setEditingFarmId(null);
        setNewFarmForm({
            farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
            crops: '', fruits: '', livestock: '', kidsActivities: '', accommodations: '', amenities: '', farmProducts: '',
            visitDays: '', visitTimings: ''
        });
        setShowAddFarmForm(false);
    };

    const handleAcceptBooking = async (bookingId) => {
        try {
            const bookingRef = ref(realtimeDb, `farmBookings/${bookingId}`);
            await update(bookingRef, { status: 'confirmed' });
            alert('Booking accepted!');
        } catch (err) {
            console.error('Failed to accept booking:', err);
            alert('Error updating booking: ' + err.message);
        }
    };

    const handleDeclineBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to decline this booking?')) return;
        try {
            const bookingRef = ref(realtimeDb, `farmBookings/${bookingId}`);
            await update(bookingRef, { status: 'rejected' });
            alert('Booking declined!');
        } catch (err) {
            console.error('Failed to decline booking:', err);
            alert('Error updating booking: ' + err.message);
        }
    };

    // ─── Address States ────────────────────────────────────────────────────────
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [newAddress, setNewAddress] = useState({
        label: '', // e.g., Home, Office
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    });

    const savedAddresses = userProfile?.addresses || [];

    const [detectingLocation, setDetectingLocation] = useState(false);

    const [profileMapCoords, setProfileMapCoords] = useState(null);
    const profileMapContainerRef = useRef(null);
    const profileMapRef = useRef(null);
    const profileMarkerRef = useRef(null);

    const handleReverseGeocode = async (lat, lng, addressSetter) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
            const res = await fetch(url, {
                headers: { 'User-Agent': 'FresVegApp/1.0' }
            });
            const data = await res.json();
            if (data && data.address) {
                const addr = data.address;

                // Extract all possible door/house/building identifiers to form an approximate door number
                const doorNumberParts = [
                    addr.house_number,
                    addr.house_name,
                    addr.building,
                    addr.flat,
                    addr.apartment,
                    addr.unit
                ].filter(Boolean);
                const doorNumber = doorNumberParts.join(', ');

                const streetName = addr.road || addr.suburb || addr.neighbourhood || '';
                const street = doorNumber
                    ? `${doorNumber}, ${streetName}`
                    : streetName || addr.amenity || 'Selected Location';

                const city = addr.city || addr.town || addr.village || addr.state_district || '';
                const state = addr.state || '';
                const zipCode = addr.postcode || '';
                const country = addr.country || 'India';
                addressSetter(prev => ({
                    ...prev,
                    street,
                    city,
                    state,
                    zipCode,
                    country
                }));
            }
        } catch (err) {
            console.error("Reverse geocoding failed:", err);
        }
    };

    const handleLocateTypedAddress = async () => {
        const { street, city, state, zipCode, country } = newAddress;
        const queryParts = [street, city, state, zipCode, country].filter(part => part && part.trim() !== '');
        if (queryParts.length === 0) {
            alert("Please fill in some address details first.");
            return;
        }
        const queryStr = queryParts.join(', ');
        const coords = await geocodeAddress(queryStr);
        if (coords) {
            const newCoords = { lat: coords.lat, lng: coords.lon };
            setProfileMapCoords(newCoords);
            // Automatically reverse geocode to get precise details (like door number) for this coordinate!
            await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
        } else {
            alert("Could not locate the typed address on the map. Try checking the spelling.");
        }
    };

    useEffect(() => {
        if (!showAddressForm || !window.L || !profileMapContainerRef.current) {
            if (profileMapRef.current) {
                profileMapRef.current.remove();
                profileMapRef.current = null;
                profileMarkerRef.current = null;
            }
            return;
        }

        const L = window.L;
        const initialLat = profileMapCoords?.lat || 20.5937;
        const initialLng = profileMapCoords?.lng || 78.9629;

        console.log("Initializing Profile Map at:", initialLat, initialLng);

        const map = L.map(profileMapContainerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
            attributionControl: false
        }).setView([initialLat, initialLng], profileMapCoords ? 16 : 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map);

        profileMapRef.current = map;

        const pinHtml = `
      <div class="instamart-marker-container">
        <div class="instamart-marker-shadow"></div>
        <div class="instamart-marker-ground-dot"></div>
        <div class="instamart-marker-pin">
          <div class="instamart-marker-inner-dot"></div>
        </div>
      </div>
    `;
        const customIcon = L.divIcon({
            html: pinHtml,
            className: 'custom-leaflet-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([initialLat, initialLng], {
            draggable: true,
            icon: customIcon
        }).addTo(map);

        profileMarkerRef.current = marker;

        marker.on('dragend', async () => {
            const latLng = marker.getLatLng();
            const newCoords = { lat: latLng.lat, lng: latLng.lng };
            setProfileMapCoords(newCoords);
            await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
        });

        map.on('click', async (e) => {
            const latLng = e.latlng;
            marker.setLatLng(latLng);
            const newCoords = { lat: latLng.lat, lng: latLng.lng };
            setProfileMapCoords(newCoords);
            await handleReverseGeocode(newCoords.lat, newCoords.lng, setNewAddress);
        });

        return () => {
            if (profileMapRef.current) {
                profileMapRef.current.remove();
                profileMapRef.current = null;
                profileMarkerRef.current = null;
            }
        };
    }, [showAddressForm]);

    useEffect(() => {
        if (profileMapRef.current && profileMarkerRef.current && profileMapCoords) {
            const { lat, lng } = profileMapCoords;
            const currentLatLng = profileMarkerRef.current.getLatLng();
            if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
                profileMarkerRef.current.setLatLng([lat, lng]);
                profileMapRef.current.setView([lat, lng], 16);
            }
        }
    }, [profileMapCoords]);

    const handleDetectLocation = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log(`Detecting address for coordinates: ${latitude}, ${longitude}`);

                    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`;
                    const res = await fetch(url, {
                        headers: { 'User-Agent': 'FresVegApp/1.0' }
                    });
                    const data = await res.json();

                    if (data && data.address) {
                        const addr = data.address;

                        // Extract all possible door/house/building identifiers to form an approximate door number
                        const doorNumberParts = [
                            addr.house_number,
                            addr.house_name,
                            addr.building,
                            addr.flat,
                            addr.apartment,
                            addr.unit
                        ].filter(Boolean);
                        const doorNumber = doorNumberParts.join(', ');

                        const streetName = addr.road || addr.suburb || addr.neighbourhood || '';
                        const street = doorNumber
                            ? `${doorNumber}, ${streetName}`
                            : streetName || addr.amenity || 'Current Location';

                        const city = addr.city || addr.town || addr.village || addr.state_district || '';
                        const state = addr.state || '';
                        const zipCode = addr.postcode || '';
                        const country = addr.country || 'India';

                        setNewAddress(prev => ({
                            ...prev,
                            street,
                            city,
                            state,
                            zipCode,
                            country
                        }));
                        setProfileMapCoords({ lat: latitude, lng: longitude });
                        console.log("Automatically detected and filled address details:", data.address);
                    } else {
                        alert("Could not retrieve address details for your location. Please enter manually.");
                    }
                } catch (err) {
                    console.error("Reverse geocoding failed:", err);
                    alert("Reverse geocoding failed. Please enter your address details manually.");
                } finally {
                    setDetectingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Failed to acquire location. Please check browser permissions and GPS status.");
                setDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const handleAddressInputChange = (e) => {
        setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
    };


    const handleAddAddress = (e) => {
        e.preventDefault();
        if (newAddress.street && newAddress.city) {
            if (editingAddressId) {
                // Edit mode
                const updatedAddresses = savedAddresses.map(addr =>
                    addr.id === editingAddressId ? { ...addr, ...newAddress } : addr
                );
                updateProfile({ addresses: updatedAddresses });
                setEditingAddressId(null);
            } else {
                // Add mode
                const addressToAdd = { ...newAddress, id: Date.now() };
                updateProfile({ addresses: [...savedAddresses, addressToAdd] });
            }
            setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
            setShowAddressForm(false);
        }
    };

    const handleEditAddressClick = async (addr) => {
        setEditingAddressId(addr.id);
        setNewAddress({
            label: addr.label || '',
            street: addr.street || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            country: addr.country || ''
        });

        // Geocode to initialize map coordinates
        const addressStr = `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''}, ${addr.country || ''}`;
        const coords = await geocodeAddress(addressStr);
        if (coords) {
            setProfileMapCoords({ lat: coords.lat, lng: coords.lon });
        } else {
            setProfileMapCoords(null);
        }

        setShowAddressForm(true);
    };

    const toggleAddressForm = () => {
        if (showAddressForm) {
            setEditingAddressId(null);
            setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
            setProfileMapCoords(null);
        }
        setShowAddressForm(!showAddressForm);
    };

    const handleDeleteAddress = (addressId) => {
        const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressId);
        updateProfile({ addresses: updatedAddresses });
        if (editingAddressId === addressId) {
            setEditingAddressId(null);
            setNewAddress({ label: '', street: '', city: '', state: '', zipCode: '', country: '' });
            setShowAddressForm(false);
        }
    };

    // ─── Shared field style ─────────────────────────────────────────────────────
    const inputCls = 'w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-sm transition-all duration-200 bg-white font-body text-slate-800 placeholder:text-slate-400';
    const labelCls = 'block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-headings';

    // ─── Orders State & Fetching ────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (!user) return;

        const ordersRef = ref(realtimeDb, 'orders');

        const unsubscribe = onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setOrders([]);
                setLoadingOrders(false);
                return;
            }

            // Convert RTDB object to array
            let ordersData = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Sort by timestamp descending (ISO string sorting works for this)
            ordersData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Filter for the current user (Customer)
            if (userProfile?.role === 'customer') {
                ordersData = ordersData.filter(order => order.customerId === user.uid);
            }
            // Filter for the Vendor's shops
            else if (userProfile?.role === 'vendor') {
                const shopNames = vendorShops.map(s => s.shopName);
                ordersData = ordersData.filter(order =>
                    order.items.some(item => shopNames.includes(item.vendor))
                ).map(order => ({
                    ...order,
                    // Only show items relevant to this vendor
                    items: order.items.filter(item => shopNames.includes(item.vendor))
                }));
            }

            setOrders(ordersData);
            setLoadingOrders(false);
        }, (error) => {
            console.error('Error fetching orders from RTDB:', error);
            setLoadingOrders(false);
        });

        return () => unsubscribe();
    }, [user, userProfile, vendorShops]);

    // ─── Geolocation & Delivery Tracking States (Moved below orders) ─────────────
    const [isTrackingActive, setIsTrackingActive] = useState(false);
    const [watchId, setWatchId] = useState(null);

    // Keep orders list in a ref to avoid Geolocation effect re-triggering constantly on coordinate updates
    const ordersRef = useRef(orders);
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    // Simulation states for Delivery Boy
    const [simulatingOrderId, setSimulatingOrderId] = useState(null);
    const [simInterval, setSimInterval] = useState(null);

    // States for delivery distance calculation
    const [calculatingDistanceForId, setCalculatingDistanceForId] = useState(null);
    const [calculatedDistances, setCalculatedDistances] = useState({});
    const [viewedMaps, setViewedMaps] = useState({});

    const getHaversineDistance = (coords1, coords2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
        const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const handleCalculateDistance = async (order) => {
        const pickupAddr = order.items[0]?.shopLocation;
        const deliveryAddr = order.address;

        if (!pickupAddr || !deliveryAddr) {
            alert("Both shop location and delivery address must be set to calculate distance.");
            return;
        }

        setCalculatingDistanceForId(order.id);

        try {
            const startCoords = await geocodeAddress(pickupAddr);
            await new Promise((r) => setTimeout(r, 600)); // slight throttle to respect Nominatim API
            const endCoords = await geocodeAddress(deliveryAddr);

            if (!startCoords || !endCoords) {
                // Fallback to a realistic random distance so the delivery boy is never stuck if geocoding fails
                const mockDist = (Math.random() * 8 + 2).toFixed(2);
                setCalculatedDistances(prev => ({
                    ...prev,
                    [order.id]: { distance: mockDist, isFallback: true }
                }));
            } else {
                const dist = getHaversineDistance(startCoords, endCoords).toFixed(2);
                setCalculatedDistances(prev => ({
                    ...prev,
                    [order.id]: { distance: dist, isFallback: false }
                }));
            }
        } catch (err) {
            console.error("Error calculating distance:", err);
            const mockDist = (Math.random() * 8 + 2).toFixed(2);
            setCalculatedDistances(prev => ({
                ...prev,
                [order.id]: { distance: mockDist, isFallback: true }
            }));
        } finally {
            setCalculatingDistanceForId(null);
        }
    };

    // Geocoder helper
    const geocodeAddress = async (address) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;
            const res = await fetch(url, {
                headers: { 'Accept-Language': 'en-US,en', 'User-Agent': 'FresVegApp/1.0' },
            });
            const data = await res.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
        } catch (err) {
            console.warn('Geocoding failed for:', address, err);
        }
        return null;
    };

    // Cleanup simulation on unmount
    useEffect(() => {
        return () => {
            if (simInterval) clearInterval(simInterval);
        };
    }, [simInterval]);

    const handleSimulateDeliveryBoyMovement = async (orderId, pickupAddr, deliveryAddr) => {
        if (simulatingOrderId === orderId) {
            if (simInterval) {
                clearInterval(simInterval);
                setSimInterval(null);
            }
            setSimulatingOrderId(null);
            return;
        }

        if (!pickupAddr || !deliveryAddr) {
            alert("Both shop location and delivery address must be set to run simulation.");
            return;
        }

        setSimulatingOrderId(orderId);

        // Reverse Geocode both addresses
        const startCoords = await geocodeAddress(pickupAddr);
        // Stagger to prevent rate limit
        await new Promise((r) => setTimeout(r, 1100));
        const endCoords = await geocodeAddress(deliveryAddr);

        if (!startCoords || !endCoords) {
            alert("Could not geocode pickup or drop address. Make sure vendor shop location and customer address are valid.");
            setSimulatingOrderId(null);
            return;
        }

        const steps = 15;
        const path = [];
        for (let i = 0; i <= steps; i++) {
            const fraction = i / steps;
            const lat = startCoords.lat + (endCoords.lat - startCoords.lat) * fraction;
            const lng = startCoords.lon + (endCoords.lon - startCoords.lon) * fraction;
            path.push({ lat, lng });
        }

        let currentStep = 0;
        const interval = setInterval(async () => {
            if (currentStep >= path.length) {
                clearInterval(interval);
                setSimInterval(null);
                setSimulatingOrderId(null);
                alert("Delivery simulation finished successfully!");
                return;
            }

            const point = path[currentStep];
            const newLoc = {
                lat: point.lat,
                lng: point.lng,
                timestamp: new Date().toISOString()
            };

            try {
                const orderRef = ref(realtimeDb, `orders/${orderId}/deliveryBoyLocation`);
                await set(orderRef, newLoc);
                console.log(`Driver simulation updated to Firebase: ${currentStep + 1}/${path.length}`, newLoc);
            } catch (err) {
                console.error("Failed to write simulation coordinates to DB:", err);
            }

            currentStep++;
        }, 2000);

        setSimInterval(interval);
    };

    // Set default tab for delivery persons on load
    useEffect(() => {
        if (userProfile?.role === 'delivery_person' && (activeTab === 'addresses' || activeTab === 'orders')) {
            setActiveTab('delivery_jobs');
        }
    }, [userProfile, activeTab]);

    // Geolocation watchPosition Effect
    useEffect(() => {
        if (userProfile?.role === 'delivery_person' && isTrackingActive) {
            if (navigator.geolocation) {
                console.log("Starting active geolocation watch...");
                const id = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const newLoc = { lat: latitude, lng: longitude, timestamp: new Date().toISOString() };

                        // Find active delivery order assigned to this delivery boy using the ref
                        const activeOrder = ordersRef.current.find(
                            o => o.deliveryBoyId === user.uid && o.status === 'dispatched'
                        );
                        if (activeOrder) {
                            const orderLocationRef = ref(realtimeDb, `orders/${activeOrder.id}/deliveryBoyLocation`);
                            update(orderLocationRef, newLoc)
                                .then(() => console.log("Real-time coordinates updated in database:", newLoc))
                                .catch(err => console.error("Error writing coordinates to RTDB:", err));
                        }
                    },
                    (error) => {
                        console.error("Error watching position:", error);
                        // Prevent auto-disabling the toggle on code 2 (Position Unavailable) to allow automatic sensor recovery
                        if (error.code !== 2) {
                            setIsTrackingActive(false);
                            alert("Location tracking error: Please enable GPS/location permissions in your browser.");
                        }
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
                );
                setWatchId(id);
            } else {
                alert("Geolocation is not supported by your browser.");
                setIsTrackingActive(false);
            }
        } else {
            if (watchId !== null) {
                console.log("Stopping active geolocation watch...");
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isTrackingActive, user, userProfile]);

    // Action Handlers for Order Status & Delivery Lifecycle
    const handleUpdateOrderStatus = async (orderId, newStatus, additionalData = {}) => {
        try {
            const orderRef = ref(realtimeDb, `orders/${orderId}`);
            await update(orderRef, {
                status: newStatus,
                ...additionalData
            });
            console.log(`Order ${orderId} successfully updated to status ${newStatus}`);
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Error updating order status: ' + error.message);
        }
    };

    const handleAcceptJob = async (orderId) => {
        try {
            const orderRef = ref(realtimeDb, `orders/${orderId}`);
            await update(orderRef, {
                status: 'dispatched',
                deliveryStatus: 'accepted',
                deliveryBoyId: user.uid,
                deliveryBoyName: userProfile?.displayName || user?.displayName || 'Delivery Hero'
            });
            setIsTrackingActive(true); // Automatically go online and share GPS coordinates!
            setActiveTab('delivery_active');
        } catch (error) {
            console.error('Failed to accept delivery order:', error);
            alert('Error: ' + error.message);
        }
    };

    const handleMarkAsDelivered = async (orderId) => {
        try {
            const orderRef = ref(realtimeDb, `orders/${orderId}`);
            await update(orderRef, {
                status: 'delivered',
                deliveryStatus: 'delivered'
            });
            setIsTrackingActive(false); // Stop coordinates synchronization
            setActiveTab('delivery_completed');
        } catch (error) {
            console.error('Failed to mark order as delivered:', error);
            alert('Error: ' + error.message);
        }
    };
    // ─── Route Protection & Session Loading ────────────────────────────────────
    // Show loading state while Firebase restores auth state on refresh
    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600"></div>
                <p className="text-xs font-bold text-emerald-800 animate-pulse mt-4 font-headings">Restoring session...</p>
            </div>
        );
    }

    // Protect route (only redirect once auth loading is finished and user is not logged in)
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            {/* ── User Profile Header with Photo Upload ────────────────────────── */}
            <ProfileHeader
                userProfile={userProfile}
                user={user}
                roleLabel={userProfile?.role || 'customer'}
                handleSignoutClick={() => setShowSignoutConfirm(true)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                    <div className="bg-white/70 backdrop-blur-md border border-white/60 p-4 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-2 sticky top-24">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3 font-headings">Dashboard Menu</p>

                        {userProfile?.role !== 'delivery_person' && (
                            <>
                                {isVendor && (
                                    <button
                                        onClick={() => handleTabChange('analytics')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'analytics'
                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                            : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                            }`}
                                    >
                                        <BarChart2 size={18} />
                                        Analytics & Revenue
                                    </button>
                                )}

                                <button
                                    onClick={() => handleTabChange('addresses')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'addresses'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <MapPin size={18} />
                                    My Saved Addresses
                                </button>

                                <button
                                    onClick={() => handleTabChange('orders')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'orders'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <ShoppingBag size={18} />
                                    {isVendor ? 'Customer Orders' : 'My Orders'}
                                </button>

                                {isVendor && (
                                    <>
                                        <button
                                            onClick={() => handleTabChange('setup')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'setup' && !showAddForm
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                                : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                                }`}
                                        >
                                            <Store size={18} />
                                            Set Up Your Shop
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleTabChange('my_products');
                                                setShowAddForm(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'my_products'
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                                : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                                }`}
                                        >
                                            <Package size={18} />
                                            My Products
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('farms')}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'farms'
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                                : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                                }`}
                                        >
                                            <Compass size={18} />
                                            My Farms
                                        </button>
                                    </>
                                )}
                            </>
                        )}

                        {userProfile?.role === 'delivery_person' && (
                            <>
                                {/* Available Orders */}
                                <button
                                    onClick={() => handleTabChange('delivery_jobs')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_jobs'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <Bike size={18} />
                                    Available Orders
                                </button>

                                {/* Active Delivery */}
                                <button
                                    onClick={() => handleTabChange('delivery_active')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_active'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <Navigation size={18} />
                                    Active Delivery
                                </button>

                                {/* Completed Orders */}
                                <button
                                    onClick={() => handleTabChange('delivery_completed')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'delivery_completed'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <Check size={18} />
                                    Completed Orders
                                </button>
                            </>
                        )}

                        <div className="border-t border-slate-100 my-2 pt-2">
                            <button
                                onClick={handleVendorLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all text-sm text-left"
                            >
                                <LogOutIcon size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9 space-y-8">
                    {/* Analytics & Revenue Tab */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-fade-in text-left">
                            {/* Header */}
                            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xl">
                                        <BarChart2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black font-headings text-slate-800">Analytics & Revenue Dashboard</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body">Track produce sales revenue vs farm visit bookings, monthly visitor headcount, and shop performance.</p>
                                    </div>
                                </div>

                                {/* 4 Summary Stat Cards */}
                                {(() => {
                                    const vendorProduceSalesRevenue = (vendorProducts || []).reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stockQuantity) || 10)), 0);
                                    const vendorFarmBookingsRevenue = (incomingFarmBookings || []).reduce((sum, b) => {
                                        const matchedFarm = vendorFarms.find(f => f.id === b.farmId || f.farmName === b.farmName);
                                        const cost = matchedFarm ? Number(matchedFarm.costPerPerson) || 0 : 0;
                                        return sum + (cost * (Number(b.visitorsCount) || 1));
                                    }, 0);
                                    const totalRevenue = vendorProduceSalesRevenue + vendorFarmBookingsRevenue;
                                    const vendorFarmBookingsCount = (incomingFarmBookings || []).length;
                                    const vendorTotalVisitorsCount = (incomingFarmBookings || []).reduce((sum, b) => sum + (Number(b.visitorsCount) || 1), 0);

                                    const produceRatio = totalRevenue > 0 ? Math.round((vendorProduceSalesRevenue / totalRevenue) * 100) : 50;
                                    const farmRatio = totalRevenue > 0 ? (100 - produceRatio) : 50;

                                    return (
                                        <div className="space-y-6">
                                            {/* Metric Cards Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {/* Card 1: Total Combined Revenue */}
                                                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-950/10 space-y-2">
                                                    <div className="flex items-center justify-between opacity-90">
                                                        <span className="text-[10px] font-black uppercase tracking-wider font-headings">Total Revenue</span>
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <h3 className="text-3xl font-black font-sans">₹{totalRevenue.toLocaleString()}</h3>
                                                    <p className="text-[11px] text-emerald-100 font-bold">Produce + Farm Visit Sales</p>
                                                </div>

                                                {/* Card 2: Produce Sales Revenue */}
                                                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Produce Sales</span>
                                                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <ShoppingBag size={18} />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 font-sans">₹{vendorProduceSalesRevenue.toLocaleString()}</h3>
                                                    <p className="text-[11px] text-emerald-600 font-bold">Direct Harvest & Shop Items</p>
                                                </div>

                                                {/* Card 3: Farm Visit Revenue */}
                                                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Farm Tour Revenue</span>
                                                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                                                            <Compass size={18} />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 font-sans">₹{vendorFarmBookingsRevenue.toLocaleString()}</h3>
                                                    <p className="text-[11px] text-amber-600 font-bold">{vendorFarmBookingsCount} Scheduled Bookings</p>
                                                </div>

                                                {/* Card 4: Monthly Visitors */}
                                                <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-headings">Total Visitors</span>
                                                        <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                                                            <Users size={18} />
                                                        </div>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-slate-900 font-sans">{vendorTotalVisitorsCount}</h3>
                                                    <p className="text-[11px] text-teal-600 font-bold">Guests this month</p>
                                                </div>
                                            </div>

                                            {/* Revenue Comparison: Produce Sales vs Farm Visit Bookings */}
                                            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-3xl space-y-4">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm font-headings">Revenue Breakdown: Produce Sales vs Farm Visit Bookings</h4>
                                                        <p className="text-xs text-slate-500 font-medium">Comparison of income generated from direct produce sales versus farm tour bookings.</p>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-700">
                                                        Total: ₹{totalRevenue.toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Progress bar visual */}
                                                <div className="space-y-1.5">
                                                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                                                        <div style={{ width: `${produceRatio}%` }} className="bg-emerald-600 h-full transition-all duration-500" title={`Produce Sales (${produceRatio}%)`} />
                                                        <div style={{ width: `${farmRatio}%` }} className="bg-amber-500 h-full transition-all duration-500" title={`Farm Visit Bookings (${farmRatio}%)`} />
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs font-bold font-headings pt-1">
                                                        <span className="text-emerald-700 flex items-center gap-1.5">
                                                            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                                                            Produce Sales: ₹{vendorProduceSalesRevenue.toLocaleString()} ({produceRatio}%)
                                                        </span>
                                                        <span className="text-amber-700 flex items-center gap-1.5">
                                                            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                                                            Farm Bookings: ₹{vendorFarmBookingsRevenue.toLocaleString()} ({farmRatio}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revenue Produce From Registered Shops Breakdown */}
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-slate-800 text-sm font-headings flex items-center gap-2">
                                                        <Store size={18} className="text-teal-600" />
                                                        Revenue Produce from Registered Shops
                                                    </h4>
                                                    <span className="text-xs font-extrabold text-slate-500 font-mono">{vendorShops.length} Registered Shops</span>
                                                </div>

                                                {vendorShops.length === 0 ? (
                                                    <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4">
                                                        <Store size={32} className="mx-auto text-slate-400 mb-2" />
                                                        <p className="text-xs font-bold text-slate-600">No registered shops yet</p>
                                                        <p className="text-[11px] text-slate-400 mt-1">Register a shop under "Set Up Your Shop" tab to track produce sales revenue by shop location.</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {vendorShops.map((shop, idx) => {
                                                            const shopProducts = (vendorProducts || []).filter(p => p.vendor?.trim().toLowerCase() === shop.shopName?.trim().toLowerCase() || p.shop?.trim().toLowerCase() === shop.shopName?.trim().toLowerCase());
                                                            const shopEstimatedRevenue = shopProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stockQuantity) || 10)), 0);

                                                            return (
                                                                <div key={idx} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                                                                                🏪
                                                                            </div>
                                                                            <div>
                                                                                <h5 className="font-bold text-slate-800 text-xs font-headings line-clamp-1">{shop.shopName}</h5>
                                                                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]"><MapPin size={10} className="inline mr-0.5" />{shop.location}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                                            <span className="text-slate-400 font-medium">Products Listed:</span>
                                                                            <span className="font-bold text-slate-700 font-mono">{shopProducts.length} Products</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-emerald-50/70 border border-emerald-200/60 p-2.5 rounded-xl flex items-center justify-between text-xs">
                                                                        <span className="font-bold text-slate-700">Shop Produce Revenue:</span>
                                                                        <span className="font-black text-emerald-700 font-sans text-sm">₹{shopEstimatedRevenue.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold font-headings text-slate-800">
                                            {editingAddressId ? 'Edit Address' : 'My Saved Addresses'}
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {editingAddressId ? 'Update your address details below' : 'Manage your delivery locations'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleAddressForm}
                                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] self-start sm:self-auto"
                                >
                                    {showAddressForm ? <X size={14} /> : <Plus size={14} />}
                                    {showAddressForm ? 'Cancel' : 'Add New Address'}
                                </button>
                            </div>

                            {showAddressForm && (
                                <form onSubmit={handleAddAddress} className="bg-slate-50/50 backdrop-blur border border-slate-100 p-6 rounded-3xl mb-8 space-y-4 max-w-4xl">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                        {/* Left Column: Form Fields */}
                                        <div className="lg:col-span-7 space-y-4">
                                            {/* Location Services Banner */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl gap-3">
                                                <div className="flex items-center gap-2">
                                                    <Navigation size={18} className={`text-emerald-600 ${detectingLocation ? 'animate-spin' : ''}`} />
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-800 font-headings">Location Services</p>
                                                        <p className="text-[10px] text-slate-400">Detecting details automatically via GPS reverse geocoding</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <button
                                                        type="button"
                                                        disabled={detectingLocation}
                                                        onClick={handleDetectLocation}
                                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto"
                                                    >
                                                        <RefreshCw size={12} className={detectingLocation ? 'animate-spin' : ''} />
                                                        {detectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleLocateTypedAddress}
                                                        className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] w-full sm:w-auto"
                                                        title="Geocode fields and update pin"
                                                    >
                                                        <MapPin size={12} />
                                                        Locate Address
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="md:col-span-2">
                                                    <label className={labelCls}>Label (e.g. Home, Office)</label>
                                                    <input required type="text" name="label" value={newAddress.label} onChange={handleAddressInputChange} className={inputCls} placeholder="Home" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className={labelCls}>
                                                        Street Address <span className="text-[10px] text-gray-400 font-normal">(Include Door/Flat/Plot No. if missing)</span>
                                                    </label>
                                                    <input required type="text" name="street" value={newAddress.street} onChange={handleAddressInputChange} className={inputCls} placeholder="e.g. Door No. 45, Main St" />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>City</label>
                                                    <input required type="text" name="city" value={newAddress.city} onChange={handleAddressInputChange} className={inputCls} placeholder="Mumbai" />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>State</label>
                                                    <input required type="text" name="state" value={newAddress.state} onChange={handleAddressInputChange} className={inputCls} placeholder="Maharashtra" />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>ZIP Code</label>
                                                    <input required type="text" name="zipCode" value={newAddress.zipCode} onChange={handleAddressInputChange} className={inputCls} placeholder="400001" />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Country</label>
                                                    <input required type="text" name="country" value={newAddress.country} onChange={handleAddressInputChange} className={inputCls} placeholder="India" />
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSavingAddress}
                                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                {isSavingAddress ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    editingAddressId ? 'Update Address' : 'Save Address'
                                                )}
                                            </button>
                                        </div>

                                        {/* Right Column: Interactive Map */}
                                        <div className="lg:col-span-5 flex flex-col min-h-[300px]">
                                            <label className={labelCls}>Pin Location on Map</label>
                                            <div
                                                ref={profileMapContainerRef}
                                                id="profile-address-map"
                                                className="w-full flex-grow rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative"
                                                style={{ minHeight: '300px', zIndex: 1 }}
                                            />
                                            <p className="text-[10px] text-slate-405 mt-2">
                                                ℹ️ Drag the green marker or click on the map to pinpoint your location precisely. The fields will update automatically.
                                            </p>
                                        </div>

                                    </div>
                                </form>
                            )}

                            {savedAddresses.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <MapPin className="mx-auto text-slate-350 mb-4" size={48} />
                                    <p className="text-slate-500 font-bold text-sm">No addresses saved yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {savedAddresses.map((addr) => (
                                        <div key={addr.id} className="bg-white/70 hover:bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                        {addr.label || 'Other'}
                                                    </span>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            onClick={() => handleEditAddressClick(addr)}
                                                            className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all p-1.5 rounded-xl border border-slate-100"
                                                            title="Edit Address"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all p-1.5 rounded-xl border border-slate-100"
                                                            title="Delete Address"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-sm font-bold text-slate-800 font-headings leading-snug break-words">{addr.street}</p>
                                                <p className="text-xs text-slate-500 font-medium font-body mt-1 break-words">{addr.city}, {addr.state} - {addr.zipCode}</p>
                                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black font-headings">{addr.country}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] mb-8 animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-headings text-slate-800">{userProfile?.role === 'vendor' ? 'Customer Orders' : 'My Orders'}</h2>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {userProfile?.role === 'vendor'
                                            ? 'Manage orders for your products'
                                            : 'Track your recent purchases and delivery status'}
                                    </p>
                                </div>
                            </div>

                            {loadingOrders ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-100 border-t-emerald-600"></div>
                                    <p className="text-xs font-semibold text-emerald-850 animate-pulse font-headings mt-4">Loading your orders...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                                    <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
                                    <p className="text-slate-550 font-bold text-sm">No orders found.</p>
                                    {userProfile?.role === 'customer' && (
                                        <button onClick={() => navigate('/')} className="mt-4 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                                            Start Shopping
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden">
                                            {/* Order Header */}
                                            <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="text-xs font-medium">
                                                        <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order Placed</p>
                                                        <p className="text-slate-700 font-bold">{new Date(order.timestamp).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-xs font-medium">
                                                        <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Total Amount</p>
                                                        <p className="text-emerald-600 font-extrabold">₹{parseFloat(order.total).toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-xs font-medium">
                                                        <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order ID</p>
                                                        <p className="text-slate-700 font-mono font-bold uppercase">#{order.id.slice(-8)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-emerald-50 text-emerald-805 border border-emerald-100/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                                        <Clock size={10} /> {order.status}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/order/${order.id}`)}
                                                        className="flex items-center gap-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-250 text-slate-750 hover:text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                                                    >
                                                        <ArrowRight size={10} /> Track
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Main Content */}
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                    {/* Item List */}
                                                    <div className="md:col-span-8 space-y-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex items-center gap-4">
                                                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-2xl border border-slate-100 flex-shrink-0" />
                                                                <div className="flex-grow min-w-0">
                                                                    <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{item.name}</h4>
                                                                    <p className="text-[10px] text-slate-405 font-semibold">Sold by: {item.vendor}</p>
                                                                    <div className="flex items-center gap-4 mt-1">
                                                                        <p className="text-xs font-bold text-emerald-600">Qty: {item.quantity}</p>
                                                                        <p className="text-xs font-bold text-slate-500">₹{item.price}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Shipping Info */}
                                                    <div className="md:col-span-4 bg-white/50 p-4 rounded-2xl border border-slate-100/85 flex flex-col justify-center">
                                                        <div className="flex items-start gap-2">
                                                            <MapPin size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-wider font-headings">Shipping Destination</p>
                                                                <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">
                                                                    {order.address}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vendor Controls */}
                                            {isVendor && (
                                                <div className="bg-emerald-500/[0.015] border-t border-slate-105 px-6 py-4 flex items-center justify-between gap-4">
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5 font-headings">
                                                        <Shield size={14} className="text-emerald-600" /> Vendor Controls
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {order.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                                            >
                                                                <Check size={14} /> Confirm Order
                                                            </button>
                                                        )}
                                                        {order.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'processing')}
                                                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                                            >
                                                                <Package size={14} /> Start Packing
                                                            </button>
                                                        )}
                                                        {order.status === 'processing' && (
                                                            <>
                                                                {order.deliveryStatus === 'requested' ? (
                                                                    <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-amber-100">
                                                                        <Clock size={12} className="animate-pulse" /> Awaiting Delivery Acceptance
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleUpdateOrderStatus(order.id, 'processing', { deliveryStatus: 'requested' })}
                                                                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                                                    >
                                                                        <Bike size={14} /> Request Dispatch Rider
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {order.status === 'dispatched' && (
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-full uppercase font-headings">
                                                                <Bike size={12} /> Dispatched Rider: {order.deliveryBoyName || 'Assigned'}
                                                            </div>
                                                        )}
                                                        {order.status === 'delivered' && (
                                                            <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 border border-emerald-100">
                                                                <Check size={14} /> Delivered Successfully
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}


                    {/* ─── Geolocation & Delivery Person Dashboard Tabs ─────────────────────── */}
                    {activeTab === 'delivery_jobs' && (
                        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                                        <Bike size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold font-headings text-slate-800">Available Delivery Jobs</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body">Claim pending requests from vendors nearby</p>
                                    </div>
                                </div>
                                {/* Duty status toggle */}
                                <button
                                    onClick={() => setIsTrackingActive(!isTrackingActive)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm font-headings ${isTrackingActive
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/10 animate-pulse'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                        }`}
                                >
                                    <Power size={14} />
                                    {isTrackingActive ? 'GPS: Online & Sharing' : 'GPS: Offline'}
                                </button>
                            </div>

                            {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                                    <Bike className="mx-auto text-slate-300 mb-4" size={56} />
                                    <p className="text-slate-550 font-bold text-lg font-headings">All Quiet on the Delivery Front!</p>
                                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">There are no pending delivery requests right now. Vendors will request when orders are ready.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.filter(o => o.status === 'processing' && o.deliveryStatus === 'requested').map((order) => (
                                        <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-sm">
                                            {/* Job Header */}
                                            <div className="bg-white/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="text-xs font-medium">
                                                        <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Ready At</p>
                                                        <p className="text-slate-700 font-bold">{new Date(order.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                    <div className="text-xs font-medium">
                                                        <p className="text-slate-400 uppercase font-black tracking-wider mb-0.5">Order Total</p>
                                                        <p className="text-emerald-600 font-extrabold">₹{parseFloat(order.total).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleAcceptJob(order.id)}
                                                        disabled={!viewedMaps[order.id]}
                                                        className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98] ${viewedMaps[order.id]
                                                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-900/10'
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                            }`}
                                                        title={viewedMaps[order.id] ? 'Accept Delivery Job' : 'Please view route map below first to accept'}
                                                    >
                                                        <Check size={14} /> Accept Delivery order
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Job details */}
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Vendor shop details */}
                                                    <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5 text-emerald-600 font-headings">
                                                            <Store size={16} /> Pickup From (Vendor)
                                                        </h4>
                                                        <p className="font-extrabold text-slate-700 text-sm">{order.items[0]?.vendor || 'Local Vendor'}</p>
                                                        <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                                            {order.items[0]?.shopLocation || 'Shop Address Not Provided'}
                                                        </p>
                                                    </div>

                                                    {/* Customer address */}
                                                    <div className="bg-white/60 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-1.5 text-blue-600 font-headings">
                                                            <MapPin size={16} /> Deliver To (Customer)
                                                        </h4>
                                                        <p className="font-extrabold text-slate-700 text-sm">{order.customerName}</p>
                                                        <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed line-clamp-2 font-body">
                                                            {order.address}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Items preview */}
                                                <div className="mt-4 border-t border-slate-100 pt-4">
                                                    <p className="text-xs font-black text-slate-405 uppercase mb-2 tracking-wider font-headings">Package Items ({order.items.length})</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.items.map((item, idx) => (
                                                            <span key={idx} className="bg-slate-50 text-slate-600 text-xs px-3 py-1 rounded-full border border-slate-200 font-semibold font-body">
                                                                {item.name} x {item.quantity}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Interactive Route Map requirement */}
                                                <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewedMaps(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                                        className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-3 px-4 rounded-xl border transition-all active:scale-[0.99] ${viewedMaps[order.id]
                                                            ? 'bg-emerald-50 border-emerald-250 text-emerald-800'
                                                            : 'bg-indigo-50/50 border-indigo-150 text-indigo-700 hover:bg-indigo-50 shadow-sm'
                                                            }`}
                                                    >
                                                        <Navigation size={14} className={viewedMaps[order.id] ? 'text-emerald-600' : 'text-indigo-650'} />
                                                        {viewedMaps[order.id] ? 'Hide Route Map' : 'View Route Map & Distance to Unlock Accept'}
                                                    </button>

                                                    {viewedMaps[order.id] && (
                                                        <div className="w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner">
                                                            <OrderTrackingMap
                                                                vendorLocation={order.items[0]?.shopLocation}
                                                                vendorName={order.items[0]?.vendor}
                                                                deliveryAddress={order.address}
                                                                deliveryBoyLocation={null}
                                                                deliveryBoyName={null}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'delivery_active' && (
                        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 border border-amber-100/50">
                                    <Navigation size={24} className="animate-pulse" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-headings text-slate-800">Active Delivery Job</h2>
                                    <p className="text-xs text-slate-400 font-medium font-body">Real-time route tracking and delivery actions</p>
                                </div>
                            </div>

                            {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                                    <Navigation className="mx-auto text-slate-350 mb-4" size={56} />
                                    <p className="text-slate-550 font-bold text-lg font-headings">No Active Deliveries</p>
                                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">You don't have any active deliveries. Go to the "Available Jobs" tab to accept a job.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'dispatched').map((order) => (
                                        <div key={order.id} className="bg-white/40 border border-slate-100 hover:border-emerald-100 hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden shadow-sm">
                                            {/* Active header */}
                                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Active Order ID</p>
                                                    <p className="font-extrabold tracking-tight text-sm font-mono uppercase">#{order.id.slice(-12)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setIsTrackingActive(!isTrackingActive)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all border active:scale-[0.98] ${isTrackingActive
                                                            ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700 text-white animate-pulse'
                                                            : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <Power size={11} strokeWidth={2.5} />
                                                        {isTrackingActive ? 'GPS Sharing: ON' : 'GPS Sharing: OFF (Turn ON!)'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Active Info details */}
                                            <div className="p-6 space-y-6">
                                                {/* Alert when GPS is OFF */}
                                                {!isTrackingActive && (
                                                    <div className="bg-amber-50/70 border border-amber-100/50 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
                                                        <Clock size={16} className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                                        <div>
                                                            <p className="font-bold text-amber-900 font-headings">GPS location sharing is offline</p>
                                                            <p className="mt-0.5 text-slate-500 leading-relaxed font-body">Please click the button above to enable GPS sharing so the customer and vendor can track your location lively on the map.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Pickup Shop */}
                                                    <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-emerald-600 font-headings">
                                                                <Store size={16} /> 1. Pickup From
                                                            </h4>
                                                            <p className="font-extrabold text-slate-700 text-sm">{order.items[0]?.vendor}</p>
                                                            <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                                                {order.items[0]?.shopLocation || 'Shop location not set'}
                                                            </p>
                                                        </div>
                                                        {order.items[0]?.shopLocation && (
                                                            <a
                                                                href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.items[0].shopLocation)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 border border-emerald-200/50 hover:bg-emerald-50 py-2.5 rounded-xl transition-all font-headings"
                                                            >
                                                                <ExternalLink size={12} /> Get Pickup Directions
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Delivery Address */}
                                                    <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-blue-100 transition-all duration-300">
                                                        <div>
                                                            <h4 className="font-bold text-slate-800 text-sm mb-2.5 flex items-center gap-1.5 text-blue-650 font-headings">
                                                                <MapPin size={16} /> 2. Deliver To
                                                            </h4>
                                                            <p className="font-extrabold text-slate-700 text-sm">{order.customerName}</p>
                                                            <p className="text-xs text-slate-400 italic mt-1.5 leading-relaxed font-body">
                                                                {order.address}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={`https://www.google.com/maps/dir/${order.deliveryBoyLocation?.lat || ''},${order.deliveryBoyLocation?.lng || ''}/${encodeURIComponent(order.address)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200/50 hover:bg-blue-50 py-2.5 rounded-xl transition-all font-headings"
                                                        >
                                                            <ExternalLink size={12} /> Get Delivery Directions
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Order Summary & Earn Info */}
                                                <div className="bg-white/80 rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-headings">Order Total Value</p>
                                                        <p className="text-lg font-black text-slate-800 mt-0.5">₹{parseFloat(order.total).toFixed(2)}</p>
                                                    </div>
                                                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-4 py-2 rounded-xl text-right">
                                                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest font-headings">Est. Earnings</p>
                                                        <p className="text-lg font-black text-emerald-800 mt-0.5">₹40.00</p>
                                                    </div>
                                                </div>

                                                {/* Delivered Action */}
                                                <button
                                                    onClick={() => handleMarkAsDelivered(order.id)}
                                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base font-headings"
                                                >
                                                    <Check size={20} strokeWidth={3} /> Complete Order & Mark as Delivered
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'delivery_completed' && (
                        <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] animate-fade-in">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 border border-emerald-100/50">
                                    <Check size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold font-headings text-slate-800">Completed Deliveries</h2>
                                    <p className="text-xs text-slate-400 font-medium font-body">Your historical delivery performance and earnings</p>
                                </div>
                            </div>

                            {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-slate-50/30">
                                    <Check className="mx-auto text-slate-350 mb-4" size={56} />
                                    <p className="text-slate-550 font-bold text-lg font-headings">No Completed Deliveries Yet</p>
                                    <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto font-body">Your completed delivery jobs will appear here once you fulfill them.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Earnings summary card */}
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/30 rounded-3xl p-6 flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Deliveries Fulfilled</h3>
                                            <p className="text-3xl font-black text-emerald-900 mt-1">{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length}</p>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-emerald-800 text-sm font-headings">Total Earnings</h3>
                                            <p className="text-3xl font-black text-emerald-900 mt-1">₹{orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').length * 40}.00</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {orders.filter(o => o.deliveryBoyId === user.uid && o.status === 'delivered').map((order) => (
                                            <div key={order.id} className="bg-white/45 border border-slate-100 hover:border-emerald-100 hover:shadow-md p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4 text-xs font-semibold transition-all duration-300">
                                                <div>
                                                    <p className="text-slate-700 font-bold text-sm font-headings">Delivered to {order.customerName}</p>
                                                    <p className="text-slate-400 mt-0.5 font-medium font-body">Order ID: #{order.id.slice(-8).toUpperCase()} • {new Date(order.timestamp).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border border-emerald-100/30 tracking-wider">Success</span>
                                                    <span className="text-emerald-600 font-black text-sm font-headings">₹40.00 Earned</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Role Based Stats or Setup Guides ────────────────────────────────── */}
                    {userProfile?.role === 'customer' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-4"><div className="bg-blue-100 p-3 rounded-full"><User className="text-blue-600" size={24} /></div><div><h3 className="font-semibold text-gray-900">Account Type</h3><p className="text-sm text-gray-500">Customer</p></div></div>
                                <p className="text-gray-600 text-sm">You can browse and purchase fresh products from our vendors.</p>
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-center gap-3 mb-4"><div className="bg-purple-100 p-3 rounded-full"><Calendar className="text-purple-600" size={24} /></div><div><h3 className="font-semibold text-gray-900">Member Since</h3><p className="text-sm text-gray-500">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Recently'}</p></div></div>
                                <p className="text-gray-600 text-sm">Thank you for being part of FresVeg community.</p>
                            </div>
                        </div>
                    )}

                    {(isVendor && activeTab === 'farms') && (
                        <div className="space-y-8 animate-fade-in text-left">
                            {/* Header */}
                            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                                        <Compass size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold font-headings text-slate-800">My Farms</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body">List your farm for weekend tours and manage bookings</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (showAddFarmForm || editingFarmId) {
                                            handleCancelFarmForm();
                                        } else {
                                            setEditingFarmId(null);
                                            setFarmFormStep(1);
                                            setFarmGalleryList([]);
                                            setFarmProductList([]);
                                            setStayList([]);
                                            setNewFarmForm({
                                                farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
                                                crops: '', fruits: '', livestock: '', kidsActivities: '', accommodations: '', amenities: '', farmProducts: '',
                                                visitDays: '', visitTimings: ''
                                            });
                                            setShowAddFarmForm(true);
                                        }
                                    }}
                                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98]"
                                >
                                    {(showAddFarmForm || editingFarmId) ? <X size={14} /> : <Plus size={14} />}
                                    {(showAddFarmForm || editingFarmId) ? 'Cancel' : 'Add New Farm'}
                                </button>
                            </div>

                            {/* Add / Edit Farm Step-by-Step Wizard Form */}
                            {showAddFarmForm && (
                                <form id="farm-setup-wizard" onSubmit={(e) => e.preventDefault()} className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] space-y-6 max-w-5xl animate-fade-in scroll-mt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 text-left">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800 font-headings">
                                                {editingFarmId ? 'Edit Farm Details' : 'Add New Farm'}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-medium font-body">Step-by-step farm listing setup</p>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200/80 px-3.5 py-1 rounded-xl text-emerald-800 text-xs font-extrabold font-mono">
                                            Step {farmFormStep} of 7
                                        </div>
                                    </div>

                                    {/* Wizard Step Progress Indicator */}
                                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-extrabold font-headings text-slate-800">
                                            <span>
                                                {farmFormStep === 1 && '📍 Step 1: Basic Info'}
                                                {farmFormStep === 2 && '🌾 Step 2: Produce & Fruits'}
                                                {farmFormStep === 3 && '🐄 Step 3: Animals'}
                                                {farmFormStep === 4 && '🎈 Step 4: Kids Zone 🎈'}
                                                {farmFormStep === 5 && '🛖 Step 5: Stays'}
                                                {farmFormStep === 6 && '🧺 Step 6: Products'}
                                                {farmFormStep === 7 && '📋 Step 7: Review'}
                                            </span>
                                            <span className="text-[11px] font-bold text-emerald-600 font-mono">{Math.round((farmFormStep / 7) * 100)}% Completed</span>
                                        </div>

                                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300 rounded-full"
                                                style={{ width: `${Math.round((farmFormStep / 7) * 100)}%` }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 text-center">
                                            {[
                                                { step: 1, label: '1. Basic Info' },
                                                { step: 2, label: '2. Produce & Fruits' },
                                                { step: 3, label: '3. Animals' },
                                                { step: 4, label: '4. Kids Zone 🎈' },
                                                { step: 5, label: '5. Stays' },
                                                { step: 6, label: '6. Products' },
                                                { step: 7, label: '7. Review' }
                                            ].map((s) => (
                                                <button
                                                    type="button"
                                                    key={s.step}
                                                    onClick={() => {
                                                        if (s.step < farmFormStep || (newFarmForm.farmName && newFarmForm.location && newFarmForm.description)) {
                                                            setFarmFormStep(s.step);
                                                        }
                                                    }}
                                                    className={`py-1.5 px-0.5 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer truncate ${farmFormStep === s.step
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : s.step < farmFormStep
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-white text-slate-400 border border-slate-200'
                                                        }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* STEP 1: Basic Farm Details (Up to Description & Map) */}
                                    {farmFormStep === 1 && (
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                                            <div className="lg:col-span-7 space-y-4">
                                                {/* Farm Name */}
                                                <div className="text-left">
                                                    <label className={labelCls}>Farm Name <span className="text-emerald-600 font-bold">*</span></label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={newFarmForm.farmName}
                                                        onChange={(e) => setNewFarmForm({ ...newFarmForm, farmName: e.target.value })}
                                                        className={inputCls.replace('pl-10', 'px-4')}
                                                        placeholder="E.g. Strawberry Paradise"
                                                    />
                                                </div>

                                                {/* Location Field with Buttons */}
                                                <div className="text-left">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <label className={labelCls}>Location Address <span className="text-emerald-600 font-bold">*</span></label>
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={detectingFarmLocation}
                                                                onClick={handleDetectFarmLocation}
                                                                className="bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-100 transition-all flex items-center gap-1 active:scale-95"
                                                                title="Get current location"
                                                            >
                                                                <Navigation size={10} className={detectingFarmLocation ? 'animate-spin' : ''} />
                                                                {detectingFarmLocation ? 'Detecting...' : 'Use GPS'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleLocateFarmAddress}
                                                                className="bg-slate-700 hover:bg-slate-850 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all flex items-center gap-1 active:scale-95"
                                                                title="Pin typed address on map"
                                                            >
                                                                <MapPin size={10} />
                                                                Locate
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                        <input
                                                            required
                                                            type="text"
                                                            value={newFarmForm.location}
                                                            onChange={(e) => setNewFarmForm({ ...newFarmForm, location: e.target.value })}
                                                            className={inputCls}
                                                            placeholder="E.g. Mahabaleshwar, Maharashtra"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Entry Type */}
                                                <div className="text-left space-y-2">
                                                    <label className={labelCls}>Farm Entry Type <span className="text-emerald-600 font-bold">*</span></label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewFarmForm(prev => ({ ...prev, costType: 'free', costPerPerson: '0' }))}
                                                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${(newFarmForm.costType === 'free' || newFarmForm.costPerPerson === '0')
                                                                ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                                                    🆓
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800">Free of Cost</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">Free open tour (₹0)</p>
                                                                </div>
                                                            </div>
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setNewFarmForm(prev => ({ ...prev, costType: 'payable', costPerPerson: (newFarmForm.costPerPerson === '0' || !newFarmForm.costPerPerson) ? '250' : newFarmForm.costPerPerson }))}
                                                            className={`p-3 rounded-2xl border-2 flex items-center justify-between transition-all text-left ${(newFarmForm.costType === 'payable' || (Number(newFarmForm.costPerPerson) > 0 && newFarmForm.costType !== 'free'))
                                                                ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/10'
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                                                                    💳
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-slate-800">Payable Visit</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium">Ticket fee per guest</p>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {/* Cost Input */}
                                                    <div className="text-left">
                                                        <label className={labelCls}>Entry Fee per Visitor (₹)</label>
                                                        {newFarmForm.costType === 'free' || newFarmForm.costPerPerson === '0' ? (
                                                            <div className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                                                                <span>✨ Free Entry (₹0 Entry Fee)</span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                                                <input
                                                                    required
                                                                    type="number"
                                                                    min="1"
                                                                    value={newFarmForm.costPerPerson}
                                                                    onChange={(e) => setNewFarmForm({ ...newFarmForm, costPerPerson: e.target.value })}
                                                                    className={inputCls.replace('pl-10', 'pl-7 pr-4')}
                                                                    placeholder="E.g. 250"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Photo URL */}
                                                    <div className="text-left">
                                                        <label className={labelCls}>Farm Cover Photo</label>
                                                        <ImageUploadField
                                                            value={newFarmForm.image}
                                                            onChange={(val) => setNewFarmForm({ ...newFarmForm, image: val })}
                                                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                            placeholder="https://images.unsplash.com/photo-..."
                                                            accentColor="emerald"
                                                            id="farm-cover-photo"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <div className="text-left">
                                                    <label className={labelCls}>Description <span className="text-emerald-600 font-bold">*</span></label>
                                                    <textarea
                                                        required
                                                        rows="3"
                                                        value={newFarmForm.description}
                                                        onChange={(e) => setNewFarmForm({ ...newFarmForm, description: e.target.value })}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-xs transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none font-body"
                                                        placeholder="Describe the experience visitors can expect (activities, snacks, views)..."
                                                    ></textarea>
                                                </div>

                                                {/* 📅 Visit Days & 🕐 Farm Timings */}
                                                <div className="space-y-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                                                        <span className="text-base">📅</span>
                                                        <div>
                                                            <p className="text-xs font-extrabold text-slate-700 font-headings">Farm Visit Days & Timings</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">Let visitors know when they can visit your farm</p>
                                                        </div>
                                                    </div>

                                                    {/* Visit Days */}
                                                    <div className="text-left space-y-2">
                                                        <label className={labelCls}>📅 Visit Days Available</label>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {['Weekends Only', 'Weekdays Only', 'Mon–Sat', '365 Days / Year', 'By Appointment Only', 'Festive Seasons Only'].map((day) => {
                                                                const isSelected = (newFarmForm.visitDays || '').split(',').map(d => d.trim()).filter(Boolean).includes(day);
                                                                return (
                                                                    <button
                                                                        key={day}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = (newFarmForm.visitDays || '').split(',').map(d => d.trim()).filter(Boolean);
                                                                            const updated = isSelected ? current.filter(d => d !== day) : [...current, day];
                                                                            setNewFarmForm(prev => ({ ...prev, visitDays: updated.join(', ') }));
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 ${isSelected
                                                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                                                                            }`}
                                                                    >
                                                                        {isSelected ? '✓ ' : ''}{day}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={newFarmForm.visitDays || ''}
                                                            onChange={(e) => setNewFarmForm(prev => ({ ...prev, visitDays: e.target.value }))}
                                                            className={inputCls.replace('pl-10', 'px-4')}
                                                            placeholder="Or type custom visit days (e.g. Every Sunday, Public Holidays)..."
                                                        />
                                                    </div>

                                                    {/* Visit Timings */}
                                                    <div className="text-left space-y-2">
                                                        <label className={labelCls}>🕐 Farm Visit Timings</label>
                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            {['Morning 9AM – 6PM', 'Morning 6AM – 12PM', 'Afternoon 12PM – 8PM', '24/7 Open', 'Sunrise to Sunset', '8AM – 5PM (Weekdays)', '9AM – 1PM (Weekends)'].map((timing) => {
                                                                const isSelected = (newFarmForm.visitTimings || '').split(',').map(t => t.trim()).filter(Boolean).includes(timing);
                                                                return (
                                                                    <button
                                                                        key={timing}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = (newFarmForm.visitTimings || '').split(',').map(t => t.trim()).filter(Boolean);
                                                                            const updated = isSelected ? current.filter(t => t !== timing) : [...current, timing];
                                                                            setNewFarmForm(prev => ({ ...prev, visitTimings: updated.join(', ') }));
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer active:scale-95 ${isSelected
                                                                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                                                                            : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700'
                                                                            }`}
                                                                    >
                                                                        {isSelected ? '✓ ' : ''}{timing}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={newFarmForm.visitTimings || ''}
                                                            onChange={(e) => setNewFarmForm(prev => ({ ...prev, visitTimings: e.target.value }))}
                                                            className={inputCls.replace('pl-10', 'px-4')}
                                                            placeholder="Or type custom timings (e.g. 10AM to 4PM on Sundays only)..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* 📸 Farm Gallery & Visual Tour Photos Section */}
                                                <div className="text-left space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <label className={labelCls}>📸 Farm Gallery & Visual Tour Photos ({farmGalleryList.length})</label>
                                                            <p className="text-[11px] text-slate-400 font-medium">Add photos of your fields, crops, stays, and farm views for visitors to explore.</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewGalleryForm({ url: '', caption: '' });
                                                                setShowAddGalleryModal(true);
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                        >
                                                            <Plus size={13} /> Add Photo
                                                        </button>
                                                    </div>

                                                    {/* Added Gallery Photos Grid */}
                                                    {farmGalleryList.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                                                            {farmGalleryList.map((item, idx) => (
                                                                <div key={item.id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveGalleryPhoto(idx)}
                                                                        className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg z-20 transition-transform active:scale-95 cursor-pointer"
                                                                        title="Remove photo"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                    <div className="h-20 bg-slate-100 overflow-hidden relative">
                                                                        <img
                                                                            src={item.url || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'}
                                                                            alt={item.caption || 'Farm Photo'}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'; }}
                                                                        />
                                                                    </div>
                                                                    <div className="p-1.5 text-center bg-white">
                                                                        <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Farm View'}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-4 text-center bg-white border border-dashed border-slate-200 rounded-xl p-3">
                                                            <p className="text-xs text-slate-400 font-medium">No gallery photos added yet. Click <span className="font-bold text-emerald-600">+ Add Photo</span> to add real photos of your farm.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Column: Map Pinning */}
                                            <div className="lg:col-span-5 flex flex-col min-h-[250px] text-left">
                                                <label className={labelCls}>Pin Farm Location on Map</label>
                                                <div className="flex-grow bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner min-h-[250px] lg:min-h-0">
                                                    <div
                                                        ref={farmMapContainerRef}
                                                        className="absolute inset-0 z-10 w-full h-full"
                                                        style={{ minHeight: '250px' }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-2 pl-1 font-body">Drag the pin or click on the map to select your farm location address automatically.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: Crops & Fruit Orchards */}
                                    {farmFormStep === 2 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                                <div className="text-2xl">🌾</div>
                                                <div>
                                                    <h4 className="font-bold text-emerald-900 text-sm font-headings">Step 2: Produce & Fruits</h4>
                                                    <p className="text-xs text-emerald-700 font-medium font-body mt-0.5">Select suggested item chips below or type custom text and press <span className="font-extrabold text-emerald-900">Enter</span> to add. Click <span className="font-extrabold">Skip Step</span> if none.</p>
                                                </div>
                                            </div>

                                            {/* Field 1: Crops & Produce Grown */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <label className={labelCls}>🌾 Crops & Produce Grown</label>

                                                {/* Selected Crop Chips */}
                                                {(() => {
                                                    const selectedCrops = newFarmForm.crops ? newFarmForm.crops.split(',').map(c => c.trim()).filter(Boolean) : [];
                                                    return (
                                                        <>
                                                            {selectedCrops.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                                                    {selectedCrops.map((crop, idx) => (
                                                                        <span key={idx} className="bg-emerald-600 text-white border border-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                                                                            🌾 {crop}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveCropChip(crop)}
                                                                                className="text-white hover:text-rose-200 font-black ml-0.5 text-xs cursor-pointer"
                                                                                title="Remove chip"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Input Box */}
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={cropInputText}
                                                                    onChange={(e) => setCropInputText(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ',') {
                                                                            e.preventDefault();
                                                                            handleAddCropChip(cropInputText);
                                                                        }
                                                                    }}
                                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                                    placeholder="Type crop name and press Enter (e.g. Sweet Corn, Spinach)..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddCropChip(cropInputText)}
                                                                    disabled={!cropInputText.trim()}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>

                                                            {/* Suggested Crop Chips */}
                                                            <div className="space-y-2 pt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">
                                                                        Suggested Crops (Click to Select):
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowMoreCrops(!showMoreCrops)}
                                                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        {showMoreCrops ? 'Show Less' : `+ Others (${EXTRA_CROPS.length} more)`}
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {(showMoreCrops ? [...INITIAL_CROPS, ...EXTRA_CROPS] : INITIAL_CROPS).map((chip, idx) => {
                                                                        const isSelected = selectedCrops.some(c => c.toLowerCase() === chip.toLowerCase());
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) handleRemoveCropChip(chip);
                                                                                    else handleAddCropChip(chip);
                                                                                }}
                                                                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer active:scale-95 flex items-center gap-1.5 ${isSelected
                                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700 shadow-xs'
                                                                                    }`}
                                                                            >
                                                                                <span>{chip}</span>
                                                                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Field 2: Fruit Orchards & Trees */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <label className={labelCls}>🍎 Fruit Orchards & Trees</label>

                                                {/* Selected Fruit Chips */}
                                                {(() => {
                                                    const selectedFruits = newFarmForm.fruits ? newFarmForm.fruits.split(',').map(f => f.trim()).filter(Boolean) : [];
                                                    return (
                                                        <>
                                                            {selectedFruits.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200">
                                                                    {selectedFruits.map((fruit, idx) => (
                                                                        <span key={idx} className="bg-amber-600 text-white border border-amber-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                                                                            🍎 {fruit}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveFruitChip(fruit)}
                                                                                className="text-white hover:text-rose-200 font-black ml-0.5 text-xs cursor-pointer"
                                                                                title="Remove chip"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Input Box */}
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={fruitInputText}
                                                                    onChange={(e) => setFruitInputText(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ',') {
                                                                            e.preventDefault();
                                                                            handleAddFruitChip(fruitInputText);
                                                                        }
                                                                    }}
                                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                                    placeholder="Type fruit/orchard name and press Enter (e.g. Mango Orchards)..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddFruitChip(fruitInputText)}
                                                                    disabled={!fruitInputText.trim()}
                                                                    className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>

                                                            {/* Suggested Fruit Chips */}
                                                            <div className="space-y-2 pt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">
                                                                        Suggested Fruits & Orchards (Click to Select):
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowMoreFruits(!showMoreFruits)}
                                                                        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        {showMoreFruits ? 'Show Less' : `+ Others (${EXTRA_FRUITS.length} more)`}
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {(showMoreFruits ? [...INITIAL_FRUITS, ...EXTRA_FRUITS] : INITIAL_FRUITS).map((chip, idx) => {
                                                                        const isSelected = selectedFruits.some(f => f.toLowerCase() === chip.toLowerCase());
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) handleRemoveFruitChip(chip);
                                                                                    else handleAddFruitChip(chip);
                                                                                }}
                                                                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer active:scale-95 flex items-center gap-1.5 ${isSelected
                                                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:text-amber-700 shadow-xs'
                                                                                    }`}
                                                                            >
                                                                                <span>{chip}</span>
                                                                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* 📸 Step 2 Photo Upload Section */}
                                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mt-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <label className={labelCls}>📸 Crop & Orchard Field Photos ({farmGalleryList.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard')).length})</label>
                                                                        <p className="text-[11px] text-slate-400 font-medium">Upload photos of your crops, fruit orchards, and organic harvest fields.</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewGalleryForm({ url: '', caption: 'Crop & Orchard Harvest' });
                                                                            setShowAddGalleryModal(true);
                                                                        }}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                                    >
                                                                        <Plus size={13} /> Add Crop Photo
                                                                    </button>
                                                                </div>

                                                                {/* Step 2 Photos Grid */}
                                                                {(() => {
                                                                    const step2Photos = farmGalleryList.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard'));
                                                                    return step2Photos.length > 0 ? (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                                            {step2Photos.map((item, idx) => {
                                                                                const realIdx = farmGalleryList.findIndex(g => g.id === item.id);
                                                                                return (
                                                                                    <div key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRemoveGalleryPhoto(realIdx >= 0 ? realIdx : idx)}
                                                                                            className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg z-20 transition-transform active:scale-95 cursor-pointer"
                                                                                            title="Remove photo"
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                        <div className="h-20 overflow-hidden relative">
                                                                                            <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'; }} />
                                                                                        </div>
                                                                                        <div className="p-1.5 text-center bg-white">
                                                                                            <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Crop Photo'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
                                                                            <p className="text-xs text-slate-400 font-medium">No crop or fruit orchard photos added yet. Click <span className="font-bold text-emerald-600">+ Add Crop Photo</span> to showcase your fields.</p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: Livestock & Poultry */}
                                    {farmFormStep === 3 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            <div className="bg-teal-50/70 p-4 rounded-2xl border border-teal-100 flex items-start gap-3">
                                                <div className="text-2xl">🐄</div>
                                                <div>
                                                    <h4 className="font-bold text-teal-900 text-sm font-headings">Step 3: Animals</h4>
                                                    <p className="text-xs text-teal-700 font-medium font-body mt-0.5">Select suggested animal chips below or type custom text and press <span className="font-extrabold text-teal-900">Enter</span> to add. Click <span className="font-extrabold">Skip Step</span> if none.</p>
                                                </div>
                                            </div>

                                            {/* Field: Livestock & Poultry */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <label className={labelCls}>🐄 Livestock & Poultry</label>

                                                {/* Selected Livestock Chips */}
                                                {(() => {
                                                    const selectedLivestock = newFarmForm.livestock ? newFarmForm.livestock.split(',').map(a => a.trim()).filter(Boolean) : [];
                                                    return (
                                                        <>
                                                            {selectedLivestock.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 p-2.5 bg-teal-50/60 rounded-xl border border-teal-200">
                                                                    {selectedLivestock.map((animal, idx) => (
                                                                        <span key={idx} className="bg-teal-600 text-white border border-teal-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                                                                            🐄 {animal}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveLivestockChip(animal)}
                                                                                className="text-white hover:text-rose-200 font-black ml-0.5 text-xs cursor-pointer"
                                                                                title="Remove chip"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Input Box */}
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={livestockInputText}
                                                                    onChange={(e) => setLivestockInputText(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ',') {
                                                                            e.preventDefault();
                                                                            handleAddLivestockChip(livestockInputText);
                                                                        }
                                                                    }}
                                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                                    placeholder="Type animal name and press Enter (e.g. Free-Range Poultry, Gir Cows)..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddLivestockChip(livestockInputText)}
                                                                    disabled={!livestockInputText.trim()}
                                                                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>

                                                            {/* Suggested Livestock Chips */}
                                                            <div className="space-y-2 pt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">
                                                                        Suggested Livestock & Poultry (Click to Select):
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowMoreLivestock(!showMoreLivestock)}
                                                                        className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        {showMoreLivestock ? 'Show Less' : `+ Others (${EXTRA_LIVESTOCK.length} more)`}
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {(showMoreLivestock ? [...INITIAL_LIVESTOCK, ...EXTRA_LIVESTOCK] : INITIAL_LIVESTOCK).map((chip, idx) => {
                                                                        const isSelected = selectedLivestock.some(a => a.toLowerCase() === chip.toLowerCase());
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) handleRemoveLivestockChip(chip);
                                                                                    else handleAddLivestockChip(chip);
                                                                                }}
                                                                                className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer active:scale-95 flex items-center gap-1.5 ${isSelected
                                                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-500/20'
                                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700 shadow-xs'
                                                                                    }`}
                                                                            >
                                                                                <span>{chip}</span>
                                                                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* 📸 Step 3 Photo Upload Section */}
                                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mt-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <label className={labelCls}>📸 Livestock & Farm Animal Photos ({farmGalleryList.filter(g => g.caption?.toLowerCase().includes('cow') || g.caption?.toLowerCase().includes('goat') || g.caption?.toLowerCase().includes('animal') || g.caption?.toLowerCase().includes('livestock') || g.caption?.toLowerCase().includes('poultry') || g.caption?.toLowerCase().includes('bee')).length})</label>
                                                                        <p className="text-[11px] text-slate-400 font-medium">Upload photos of your Gir cows, poultry, honeybee hives, and farm animals.</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewGalleryForm({ url: '', caption: 'Livestock & Farm Animals' });
                                                                            setShowAddGalleryModal(true);
                                                                        }}
                                                                        className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                                    >
                                                                        <Plus size={13} /> Add Animal Photo
                                                                    </button>
                                                                </div>

                                                                {/* Step 3 Photos Grid */}
                                                                {(() => {
                                                                    const step3Photos = farmGalleryList.filter(g => g.caption?.toLowerCase().includes('cow') || g.caption?.toLowerCase().includes('goat') || g.caption?.toLowerCase().includes('animal') || g.caption?.toLowerCase().includes('livestock') || g.caption?.toLowerCase().includes('poultry') || g.caption?.toLowerCase().includes('bee'));
                                                                    return step3Photos.length > 0 ? (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                                            {step3Photos.map((item, idx) => {
                                                                                const realIdx = farmGalleryList.findIndex(g => g.id === item.id);
                                                                                return (
                                                                                    <div key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRemoveGalleryPhoto(realIdx >= 0 ? realIdx : idx)}
                                                                                            className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg z-20 transition-transform active:scale-95 cursor-pointer"
                                                                                            title="Remove photo"
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                        <div className="h-20 overflow-hidden relative">
                                                                                            <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80'; }} />
                                                                                        </div>
                                                                                        <div className="p-1.5 text-center bg-white">
                                                                                            <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Animal Photo'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
                                                                            <p className="text-xs text-slate-400 font-medium">No livestock or animal photos added yet. Click <span className="font-bold text-teal-600">+ Add Animal Photo</span> to showcase your farm animals.</p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: Kids Section Entertainments & Play Area */}
                                    {farmFormStep === 4 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 flex items-start gap-3">
                                                <div className="text-2xl">🎈</div>
                                                <div>
                                                    <h4 className="font-bold text-rose-900 text-sm font-headings">Step 4: Kids Zone 🎈</h4>
                                                    <p className="text-xs text-rose-700 font-medium font-body mt-0.5">Select suggested kid-friendly entertainment chips below or type custom activities and press <span className="font-extrabold text-rose-900">Enter</span> to add. Upload play area photos below. Click <span className="font-extrabold">Skip Step</span> if none.</p>
                                                </div>
                                            </div>

                                            {/* Field: Kids Entertainments */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <label className={labelCls}>🎈 Kids Section Entertainments & Play Area</label>

                                                {/* Selected Kids Activity Chips */}
                                                {(() => {
                                                    const selectedKids = newFarmForm.kidsActivities ? newFarmForm.kidsActivities.split(',').map(k => k.trim()).filter(Boolean) : [];
                                                    return (
                                                        <>
                                                            {selectedKids.length > 0 && (
                                                                <div className="flex flex-wrap gap-2 p-2.5 bg-rose-50/60 rounded-xl border border-rose-200">
                                                                    {selectedKids.map((act, idx) => (
                                                                        <span key={idx} className="bg-rose-600 text-white border border-rose-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
                                                                            🎈 {act}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveKidsChip(act)}
                                                                                className="text-white hover:text-amber-200 font-black ml-0.5 text-xs cursor-pointer"
                                                                                title="Remove chip"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Input Box */}
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={kidsInputText}
                                                                    onChange={(e) => setKidsInputText(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' || e.key === ',') {
                                                                            e.preventDefault();
                                                                            handleAddKidsChip(kidsInputText);
                                                                        }
                                                                    }}
                                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                                    placeholder="Type activity name and press Enter (e.g. Swings, Petting Corner)..."
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddKidsChip(kidsInputText)}
                                                                    disabled={!kidsInputText.trim()}
                                                                    className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer transition-all active:scale-95"
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>

                                                            {/* Suggested Kids Activity Chips */}
                                                            <div className="space-y-2 pt-1">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">
                                                                        Suggested Kids Section Entertainments (Click to Select):
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowMoreKids(!showMoreKids)}
                                                                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        {showMoreKids ? 'Show Less' : `+ Others (${EXTRA_KIDS_ACTIVITIES.length} more)`}
                                                                    </button>
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {(showMoreKids ? [...INITIAL_KIDS_ACTIVITIES, ...EXTRA_KIDS_ACTIVITIES] : INITIAL_KIDS_ACTIVITIES).map((chip, idx) => {
                                                                        const isSelected = selectedKids.some(k => k.toLowerCase() === chip.toLowerCase());
                                                                        return (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    if (isSelected) handleRemoveKidsChip(chip);
                                                                                    else handleAddKidsChip(chip);
                                                                                }}
                                                                                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer active:scale-95 flex items-center gap-1.5 ${isSelected
                                                                                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                                                                    : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                                                                                    }`}
                                                                            >
                                                                                <span>{chip}</span>
                                                                                {isSelected ? <span>✓</span> : <span className="text-slate-400 text-[10px]">+</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Step 4 Photo Upload Section */}
                                                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <label className={labelCls}>📸 Kids Play Zone & Entertainment Photos ({farmGalleryList.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting')).length})</label>
                                                                        <p className="text-[11px] text-slate-400 font-medium">Upload photos of play areas, swings, petting corners, and activities for kids.</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setNewGalleryForm({ url: '', caption: 'Kids Section & Play Zone' });
                                                                            setShowAddGalleryModal(true);
                                                                        }}
                                                                        className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                                    >
                                                                        <Plus size={13} /> Add Kids Photo
                                                                    </button>
                                                                </div>

                                                                {/* Step 4 Photos Grid */}
                                                                {(() => {
                                                                    const step4Photos = farmGalleryList.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting'));
                                                                    return step4Photos.length > 0 ? (
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                                            {step4Photos.map((item, idx) => {
                                                                                const realIdx = farmGalleryList.findIndex(g => g.id === item.id);
                                                                                return (
                                                                                    <div key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRemoveGalleryPhoto(realIdx >= 0 ? realIdx : idx)}
                                                                                            className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg z-20 transition-transform active:scale-95 cursor-pointer"
                                                                                            title="Remove photo"
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                        <div className="h-20 overflow-hidden relative">
                                                                                            <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=600&q=80'; }} />
                                                                                        </div>
                                                                                        <div className="p-1.5 text-center bg-white">
                                                                                            <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Kids Section Photo'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="py-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
                                                                            <p className="text-xs text-slate-400 font-medium">No kids section photos added yet. Click <span className="font-bold text-rose-600">+ Add Kids Photo</span> to showcase your play area.</p>
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 5: Stays */}
                                    {farmFormStep === 5 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            {/* Banner */}
                                            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-2xl">🛖</div>
                                                    <div>
                                                        <h4 className="font-bold text-amber-900 text-sm font-headings">Step 5: Stays</h4>
                                                        <p className="text-xs text-amber-700 font-medium font-body mt-0.5">Click <span className="font-extrabold">+ Add Stay</span> to add stay options with photo & price per night. Click <span className="font-extrabold">Skip Step</span> if day-visit only.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenAddStayModal}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold font-headings flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0 cursor-pointer"
                                                >
                                                    <Plus size={14} /> Add Stay
                                                </button>
                                            </div>

                                            {/* Added Stays Cards List */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <label className={labelCls}>🛖 Farm Stay Accommodations ({stayList.length})</label>
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenAddStayModal}
                                                        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        + Add Stay Option
                                                    </button>
                                                </div>

                                                {stayList.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                                        {stayList.map((stay, idx) => (
                                                            <div key={stay.id || idx} className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3.5 flex gap-3 relative group hover:shadow-md transition-all">
                                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-amber-200 shrink-0 relative">
                                                                    <img
                                                                        src={stay.image || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80'}
                                                                        alt={stay.title}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80'; }}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0 flex-1 space-y-1">
                                                                    <div className="flex items-start justify-between gap-1">
                                                                        <h5 className="font-extrabold text-slate-800 text-xs font-headings truncate">{stay.title}</h5>
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditStay(idx)}
                                                                                className="text-slate-400 hover:text-amber-600 p-1 rounded-md transition-colors"
                                                                                title="Edit stay"
                                                                            >
                                                                                <Pencil size={12} />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveStay(idx)}
                                                                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                                                                title="Remove stay"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-amber-700 font-extrabold text-xs">{stay.price}</p>
                                                                    {stay.desc && <p className="text-[10px] text-slate-500 line-clamp-1 font-body">{stay.desc}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 space-y-2">
                                                        <p className="text-xs text-slate-500 font-medium">No stay options added yet.</p>
                                                        <button
                                                            type="button"
                                                            onClick={handleOpenAddStayModal}
                                                            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Plus size={14} /> Add Stay Accommodation
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Suggested Quick Add Chips */}
                                                <div className="pt-3 space-y-2 border-t border-slate-100">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">
                                                        Quick Add Stay Options (Click to Add):
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {['Farmhouse Room', 'Rustic Mud Hut', 'Camping Tent', 'Treehouse Stay', 'Luxury Villa', 'Glamping Pod'].map((chip, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewStayForm({ name: chip, price: '1500', description: 'Comfortable ' + chip.toLowerCase() + ' experience', image: '' });
                                                                    setShowAddStayModal(true);
                                                                }}
                                                                className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:border-amber-400 hover:text-amber-800 hover:bg-amber-50/50 transition-all cursor-pointer active:scale-95"
                                                            >
                                                                + {chip}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 📸 Step 5 Stay Photo Upload Section */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className={labelCls}>📸 Accommodation & Stay Photos ({farmGalleryList.filter(g => g.caption?.toLowerCase().includes('stay') || g.caption?.toLowerCase().includes('hut') || g.caption?.toLowerCase().includes('tent') || g.caption?.toLowerCase().includes('room') || g.caption?.toLowerCase().includes('cottage') || g.caption?.toLowerCase().includes('villa')).length})</label>
                                                        <p className="text-[11px] text-slate-400 font-medium">Upload photos of guest rooms, mud huts, camping tents, and stay amenities.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNewGalleryForm({ url: '', caption: 'Farm Stay Accommodation' });
                                                            setShowAddGalleryModal(true);
                                                        }}
                                                        className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                    >
                                                        <Plus size={13} /> Add Stay Photo
                                                    </button>
                                                </div>

                                                {/* Step 5 Photos Grid */}
                                                {(() => {
                                                    const step5Photos = farmGalleryList.filter(g => g.caption?.toLowerCase().includes('stay') || g.caption?.toLowerCase().includes('hut') || g.caption?.toLowerCase().includes('tent') || g.caption?.toLowerCase().includes('room') || g.caption?.toLowerCase().includes('cottage') || g.caption?.toLowerCase().includes('villa'));
                                                    return step5Photos.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                            {step5Photos.map((item, idx) => {
                                                                const realIdx = farmGalleryList.findIndex(g => g.id === item.id);
                                                                return (
                                                                    <div key={item.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveGalleryPhoto(realIdx >= 0 ? realIdx : idx)}
                                                                            className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg z-20 transition-transform active:scale-95 cursor-pointer"
                                                                            title="Remove photo"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                        <div className="h-20 overflow-hidden relative">
                                                                            <img src={item.url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=600&q=80'; }} />
                                                                        </div>
                                                                        <div className="p-1.5 text-center bg-white">
                                                                            <p className="text-[10px] font-bold text-slate-700 truncate">{item.caption || 'Stay Photo'}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3">
                                                            <p className="text-xs text-slate-400 font-medium">No accommodation photos added yet. Click <span className="font-bold text-amber-600">+ Add Stay Photo</span> to show guest stays.</p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 6: Products */}
                                    {farmFormStep === 6 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            {/* Step 5 Banner */}
                                            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-2xl">🧺</div>
                                                    <div>
                                                        <h4 className="font-bold text-purple-900 text-sm font-headings">Step 6: Products</h4>
                                                        <p className="text-xs text-purple-700 font-medium font-body mt-0.5">Click <span className="font-extrabold">+ Add Product</span> to list products for sale, or click <span className="font-extrabold">Next Step →</span> to review your listing.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setNewFarmProductForm({ name: '', price: '', unit: 'kg', customUnit: '', image: '' });
                                                        setShowAddFarmProductModal(true);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold font-headings flex items-center justify-center gap-1.5 shadow-md active:scale-95 shrink-0 cursor-pointer"
                                                >
                                                    <Plus size={14} /> Add Product
                                                </button>
                                            </div>

                                            {/* Added Products Section */}
                                            <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                                                <div className="flex items-center justify-between">
                                                    <label className={labelCls}>🧺 Direct Farm Products Added ({farmProductList.length})</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setNewFarmProductForm({ name: '', price: '', unit: 'kg', customUnit: '', image: '' });
                                                            setShowAddFarmProductModal(true);
                                                        }}
                                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                                    >
                                                        + Add Another Product
                                                    </button>
                                                </div>

                                                {farmProductList.length === 0 ? (
                                                    <div className="py-8 text-center bg-slate-50/60 border-2 border-dashed border-purple-200/80 rounded-2xl p-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto mb-2.5 font-bold text-xl">
                                                            🧺
                                                        </div>
                                                        <h5 className="font-bold text-slate-800 text-xs font-headings">No Farm Products Added Yet</h5>
                                                        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1 mb-4 font-body">Add your freshly harvested organic farm products so visitors can purchase direct from your farm, or click Next Step to skip.</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewFarmProductForm({ name: '', price: '', unit: 'kg', customUnit: '', image: '' });
                                                                setShowAddFarmProductModal(true);
                                                            }}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-headings inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                                                        >
                                                            <Plus size={14} /> Add Product Now
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                        {farmProductList.map((product, idx) => (
                                                            <div key={product.id || idx} className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-xs flex flex-col justify-between group hover:shadow-md transition-all relative">
                                                                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditModalProduct(idx)}
                                                                        className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                                                        title="Edit Product"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveModalProduct(idx)}
                                                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                                        title="Remove Product"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                                <div className="relative h-24 bg-slate-50 rounded-xl overflow-hidden mb-2.5 flex items-center justify-center p-1.5 border border-slate-100">
                                                                    <img
                                                                        src={product.image || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80'}
                                                                        alt={product.name}
                                                                        className="max-h-full object-contain group-hover:scale-105 transition-transform"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1 text-left">
                                                                    <h4 className="font-bold text-slate-800 text-xs font-headings line-clamp-1">{product.name}</h4>
                                                                    <div>
                                                                        <span className="font-extrabold text-emerald-700 text-xs font-sans">
                                                                            ₹{product.price} <span className="text-[10px] text-slate-400 font-normal">/{product.unit}</span>
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 7: Review */}
                                    {farmFormStep === 7 && (
                                        <div className="space-y-6 animate-fade-in text-left max-w-3xl mx-auto py-2">
                                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                                <div className="text-2xl">📋</div>
                                                <div>
                                                    <h4 className="font-bold text-emerald-900 text-sm font-headings">Step 7: Review</h4>
                                                    <p className="text-xs text-emerald-700 font-medium font-body mt-0.5">Please review all your farm information below. Click <span className="font-extrabold">{editingFarmId ? 'Update Farm' : 'List Farm'}</span> to publish.</p>
                                                </div>
                                            </div>

                                            {/* 📋 Complete All Steps Summary Preview Card */}
                                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-5">
                                                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-2xl">📋</span>
                                                        <div>
                                                            <h4 className="font-extrabold text-base font-headings text-emerald-400">Complete Listing Summary</h4>
                                                            <p className="text-xs text-slate-400 font-body">Final verification before publishing</p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                                                        Ready to Submit
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                    {/* Step 1 Preview */}
                                                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">📍 Step 1: Basic Info</span>
                                                        <p className="font-extrabold text-sm text-white truncate">{newFarmForm.farmName || 'Unnamed Farm'}</p>
                                                        <p className="text-slate-400">Ticket Fee: <span className="text-emerald-400 font-bold">{newFarmForm.costType === 'free' || newFarmForm.costPerPerson === '0' ? 'Free Entry (₹0)' : `₹${newFarmForm.costPerPerson} per visitor`}</span></p>
                                                        <p className="text-slate-400">Gallery: <span className="text-emerald-400 font-bold">{farmGalleryList.length} Photos Added</span></p>
                                                        {newFarmForm.visitDays && (
                                                            <p className="text-slate-400">📅 Days: <span className="text-teal-300 font-bold">{newFarmForm.visitDays}</span></p>
                                                        )}
                                                        {newFarmForm.visitTimings && (
                                                            <p className="text-slate-400">🕐 Timings: <span className="text-teal-300 font-bold">{newFarmForm.visitTimings}</span></p>
                                                        )}
                                                        {newFarmForm.description && (
                                                            <p className="text-slate-400 italic line-clamp-2 text-[11px] pt-1">"{newFarmForm.description}"</p>
                                                        )}
                                                    </div>

                                                    {/* Step 2 Preview */}
                                                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">🌾 Step 2: Produce & Fruits</span>
                                                        <p className="text-slate-300 line-clamp-2"><strong className="text-slate-400">Crops:</strong> {newFarmForm.crops || 'None added'}</p>
                                                        <p className="text-slate-300 line-clamp-2"><strong className="text-slate-400">Fruits:</strong> {newFarmForm.fruits || 'None added'}</p>
                                                        <p className="text-emerald-400 font-bold text-[11px]">📸 Crop Photos: {farmGalleryList.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard')).length} Added</p>
                                                    </div>

                                                    {/* Step 3 Preview */}
                                                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                                                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider">🐄 Step 3: Animals</span>
                                                        <p className="text-slate-300 line-clamp-3">{newFarmForm.livestock || 'None added'}</p>
                                                    </div>

                                                    {/* Step 4 Preview (Kids Section) */}
                                                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                                                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">🎈 Step 4: Kids Zone 🎈</span>
                                                        <p className="text-slate-300 line-clamp-2">{newFarmForm.kidsActivities || 'None added'}</p>
                                                        <p className="text-rose-300 font-bold text-[11px]">📸 Kids Play Photos: {farmGalleryList.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting')).length} Added</p>
                                                    </div>

                                                    {/* Step 4 Preview */}
                                                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">🛖 Step 5: Stays & Stay Price</span>
                                                        <p className="text-slate-300 line-clamp-3">{newFarmForm.accommodations || 'None added'}</p>
                                                        {newFarmForm.accommodationPrice && Number(newFarmForm.accommodationPrice) > 0 && (
                                                            <p className="text-xs font-bold text-amber-400">
                                                                Stay Price: ₹{newFarmForm.accommodationPrice} / night <span className="text-[10px] font-normal text-slate-400">(Excluded from visit price)</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Step 5 Direct Products Summary */}
                                                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">🧺 Step 6: Products</span>
                                                        <span className="font-extrabold text-white text-xs">{farmProductList.length} Products Added</span>
                                                    </div>
                                                    {farmProductList.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-1">
                                                            {farmProductList.map((prod, i) => (
                                                                <span key={i} className="bg-slate-700/80 border border-slate-600 text-slate-200 px-3 py-1 rounded-full text-[11px] font-bold">
                                                                    {prod.name} (₹{prod.price}/{prod.unit})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Wizard Control Buttons */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                        <div>
                                            <button
                                                type="button"
                                                onClick={handleCancelFarmForm}
                                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {farmFormStep > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFarmFormStep(prev => prev - 1)}
                                                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold transition-all text-xs flex items-center gap-1 cursor-pointer"
                                                >
                                                    ← Previous
                                                </button>
                                            )}

                                            {farmFormStep > 1 && farmFormStep < 7 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (farmFormStep === 2) setNewFarmForm(prev => ({ ...prev, crops: '', fruits: '' }));
                                                        if (farmFormStep === 3) setNewFarmForm(prev => ({ ...prev, livestock: '' }));
                                                        if (farmFormStep === 4) setNewFarmForm(prev => ({ ...prev, kidsActivities: '' }));
                                                        if (farmFormStep === 5) setNewFarmForm(prev => ({ ...prev, accommodations: '' }));
                                                        if (farmFormStep === 6) {
                                                            setFarmProductList([]);
                                                            setNewFarmForm(prev => ({ ...prev, farmProducts: [] }));
                                                        }
                                                        setFarmFormStep(prev => prev + 1);
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold transition-all text-xs cursor-pointer"
                                                >
                                                    Skip Step
                                                </button>
                                            )}

                                            {farmFormStep < 7 ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (farmFormStep === 1) {
                                                            if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim() || !newFarmForm.description.trim()) {
                                                                alert('Please fill in Farm Name, Location Address, and Description to proceed.');
                                                                return;
                                                            }
                                                        }
                                                        setFarmFormStep(prev => prev + 1);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center gap-1 cursor-pointer font-headings"
                                                >
                                                    Next Step →
                                                </button>
                                            ) : (
                                                <button
                                                    id="save-farm-submit-btn"
                                                    type="button"
                                                    onClick={handleSaveFarmForm}
                                                    disabled={isSubmittingFarm}
                                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center gap-1.5 cursor-pointer font-headings"
                                                >
                                                    {isSubmittingFarm
                                                        ? (editingFarmId ? 'Updating...' : 'Listing...')
                                                        : (editingFarmId ? 'Update Farm' : 'List Farm')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </form>
                            )}

                            {/* Farms List & Incoming Bookings */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                                {/* My Listed Farms */}
                                <div className="xl:col-span-7 space-y-6">
                                    <h3 className="text-base font-extrabold text-slate-800 font-headings pl-1">My Listed Farms</h3>
                                    {vendorFarms.length === 0 ? (
                                        <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
                                            <Compass size={40} className="mx-auto text-slate-350 mb-3" />
                                            <p className="text-slate-500 text-sm font-bold">No farms listed yet</p>
                                            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed font-body">List your first organic farm to allow customers to book visits.</p>
                                            <button
                                                onClick={() => setShowAddFarmForm(true)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                                            >
                                                Add Farm Now
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {vendorFarms.map(farm => (
                                                <div key={farm.id} className="bg-white/70 border border-white/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group min-h-[220px]">
                                                    {deletingFarmId === farm.id ? (
                                                        <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-3xl flex flex-col justify-between flex-1 animate-fade-in text-left">
                                                            <div>
                                                                <div className="flex items-center gap-2 text-rose-600 mb-1.5">
                                                                    <Trash2 size={18} />
                                                                    <h4 className="font-bold text-sm font-headings">Delete Farm?</h4>
                                                                </div>
                                                                <p className="text-xs text-rose-700 font-medium font-body leading-relaxed">
                                                                    Are you sure you want to delete <span className="font-bold text-rose-900">{farm.farmName}</span>? This action cannot be undone.
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2 pt-4">
                                                                <button
                                                                    onClick={() => handleDeleteFarm(farm.id)}
                                                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 font-headings"
                                                                >
                                                                    Yes, Delete
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingFarmId(null)}
                                                                    className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 font-headings"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="relative h-36 bg-slate-50">
                                                                <img src={farm.image} alt={farm.farmName} className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
                                                                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => handleEditFarmClick(farm)}
                                                                        className="bg-white/95 text-emerald-600 hover:bg-emerald-50 p-2 rounded-xl transition-colors shadow-md border border-slate-100"
                                                                        title="Edit Farm Details"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingFarmId(farm.id)}
                                                                        className="bg-white/95 text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-colors shadow-md border border-slate-100"
                                                                        title="Delete Farm"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 flex flex-col flex-1 space-y-2">
                                                                <div>
                                                                    <h4 className="font-bold text-slate-800 text-sm font-headings truncate">{farm.farmName}</h4>
                                                                    <p className="text-[10px] text-slate-450 font-semibold flex items-center gap-1 font-body mt-0.5"><MapPin size={11} className="text-emerald-600" />{farm.location}</p>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 line-clamp-2 italic font-body">"{farm.description}"</p>
                                                                <div className="border-t border-slate-100/60 pt-2.5 mt-auto flex justify-between items-center text-[10px]">
                                                                    <span className="text-slate-400 font-bold uppercase tracking-wider font-headings font-mono">TICKET TYPE</span>
                                                                    {(!farm.costPerPerson || Number(farm.costPerPerson) === 0) ? (
                                                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">FREE OF COST</span>
                                                                    ) : (
                                                                        <span className="font-black text-slate-800 text-xs">₹{farm.costPerPerson} / guest</span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const slug = farm.farmName
                                                                            ? farm.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                                                                            : farm.id;
                                                                        navigate(`/farm/${slug}`);
                                                                    }}
                                                                    className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 font-headings border border-emerald-200/60 mt-1"
                                                                >
                                                                    <Compass size={12} /> Explore Farm Page
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Incoming Bookings */}
                                <div className="xl:col-span-5 space-y-6">
                                    <h3 className="text-base font-extrabold text-slate-800 font-headings pl-1">Incoming Farm Visits</h3>
                                    <div className="bg-white/70 border border-white/60 p-5 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                                        {incomingFarmBookings.length === 0 ? (
                                            <div className="py-12 text-center">
                                                <Calendar size={36} className="mx-auto text-slate-350 mb-3" />
                                                <p className="text-slate-550 font-bold text-xs">No scheduled visits</p>
                                                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed font-body">As soon as customers book slot dates, their visit schedules will appear here.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                                {incomingFarmBookings.map(booking => (
                                                    <div key={booking.id} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col space-y-3 shadow-inner hover:bg-white hover:border-emerald-100 transition-all duration-300">
                                                        <div className="flex justify-between items-start gap-1">
                                                            <div className="min-w-0 text-left">
                                                                <h4 className="font-extrabold text-slate-800 text-xs truncate font-headings">{booking.customerName}</h4>
                                                                <p className="text-[10px] text-slate-450 truncate font-body mt-0.5">{booking.customerEmail}</p>
                                                            </div>

                                                            {booking.status === 'confirmed' ? (
                                                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0">
                                                                    <CheckCircle size={9} /> confirmed
                                                                </span>
                                                            ) : booking.status === 'rejected' ? (
                                                                <span className="bg-rose-50 text-rose-800 border border-rose-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0">
                                                                    <X size={9} /> declined
                                                                </span>
                                                            ) : (
                                                                <span className="bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-0.5 flex-shrink-0 animate-pulse">
                                                                    <Clock size={9} /> pending
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="border-t border-slate-100/60 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-550">
                                                            <span className="flex items-center gap-1"><Calendar size={11} className="text-emerald-600" />{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                            <span className="flex items-center gap-1"><Users size={11} className="text-emerald-600" />{booking.visitorsCount} guest{booking.visitorsCount !== 1 ? 's' : ''}</span>
                                                        </div>

                                                        <div className="text-[9px] text-slate-450 font-extrabold tracking-wide uppercase truncate pt-1 border-t border-slate-100/30 text-left">
                                                            Farm: {booking.farmName}
                                                        </div>

                                                        {/* Accept / Decline Action Buttons for Owner */}
                                                        {(!booking.status || booking.status === 'pending') && (
                                                            <div className="flex gap-2 pt-2 border-t border-slate-100/30">
                                                                <button
                                                                    onClick={() => handleAcceptBooking(booking.id)}
                                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-xl transition-all shadow-sm active:scale-95 text-center"
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeclineBooking(booking.id)}
                                                                    className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-705 font-bold text-[10px] uppercase tracking-wider py-1.5 rounded-xl transition-all active:scale-95 text-center"
                                                                >
                                                                    Decline
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>
                    )}

                    {/* ─── Vendor: Set Up Your Shop Tab ──────────────────────────────────── */}
                    {(isVendor && activeTab === 'setup') && (
                        <div className="space-y-8 animate-fade-in text-left">
                            {vendorShops.length === 0 ? (
                                <div className="bg-white/70 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02] max-w-xl mx-auto mt-8 animate-fade-in">
                                    <div className="text-center mb-6">
                                        <div className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 p-4 rounded-3xl inline-block mb-4">
                                            <Store size={36} />
                                        </div>
                                        <h2 className="text-2xl font-bold font-headings text-slate-800">Set Up Your Shop</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body mt-1">Add your shop name so you can start adding products.</p>
                                    </div>
                                    <form onSubmit={handleShopSetup} className="space-y-4">
                                        <div>
                                            <label className={labelCls}>Shop Name</label>
                                            <div className="relative">
                                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.shopName} onChange={(e) => setShopSetup({ ...shopSetup, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Shop Location <span className="text-emerald-600 font-bold">*</span></label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.location} onChange={(e) => setShopSetup({ ...shopSetup, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                                <button
                                                    type="button"
                                                    onClick={() => handleGetCurrentLocation(setShopSetup, shopSetup)}
                                                    disabled={detectingShopLocation}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                >
                                                    {detectingShopLocation ? (
                                                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : (
                                                        <Navigation size={11} />
                                                    )}
                                                    {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-emerald-600 mt-1.5 flex items-start gap-1 font-body">
                                                <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address (area + city + state) — this is shown to customers on Google Maps when they track their delivery.
                                            </p>
                                        </div>
                                        <div>
                                            <label className={labelCls}>GST Number</label>
                                            <div className="relative">
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input required type="text" value={shopSetup.gstNumber} onChange={(e) => setShopSetup({ ...shopSetup, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Shop Photo</label>
                                            <ImageUploadField
                                                value={shopSetup.image}
                                                onChange={(val) => setShopSetup({ ...shopSetup, image: val })}
                                                inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                placeholder="https://images.unsplash.com/photo-..."
                                                accentColor="emerald"
                                                id="shop-setup-image"
                                            />
                                        </div>
                                        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                                            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 font-headings">Social Media Links (Optional)</label>
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Instagram</label>
                                                    <input type="text" value={shopSetup.socialLinks?.instagram || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), instagram: e.target.value } }))} placeholder="https://instagram.com/yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Facebook</label>
                                                    <input type="text" value={shopSetup.socialLinks?.facebook || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), facebook: e.target.value } }))} placeholder="https://facebook.com/yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">YouTube</label>
                                                    <input type="text" value={shopSetup.socialLinks?.youtube || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), youtube: e.target.value } }))} placeholder="https://youtube.com/@yourshop" className={inputCls} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                                                    <input type="text" value={shopSetup.socialLinks?.whatsapp || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className={inputCls} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Official Website</label>
                                                <input type="text" value={shopSetup.socialLinks?.website || ''} onChange={(e) => setShopSetup(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || EMPTY_SOCIAL_LINKS), website: e.target.value } }))} placeholder="https://yourshop.com" className={inputCls} />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingShop}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold hover:shadow-lg transition-all duration-300 active:scale-[0.98] font-headings shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingShop ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    <span>Completing Setup...</span>
                                                </>
                                            ) : (
                                                "Complete Setup"
                                            )}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="mt-8">
                                    {viewingShopIndex !== null ? (
                                        /* ── Shop Detail Page View ── */
                                        (() => {
                                            const shop = vendorShops[viewingShopIndex];
                                            if (!shop) return null;

                                            return (
                                                <div className="space-y-8 animate-fade-in">
                                                    <button
                                                        onClick={() => {
                                                            setViewingShopIndex(null);
                                                            setSelectedShopFilter(null);
                                                        }}
                                                        className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors font-headings"
                                                    >
                                                        <ArrowLeft size={16} /> Back to My Shops
                                                    </button>

                                                    <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-xl shadow-emerald-950/[0.02]">
                                                        <div className="h-56 w-full bg-gradient-to-r from-emerald-800 to-teal-950 relative flex items-center justify-center">
                                                            {shop.image ? (
                                                                <img src={shop.image} alt={shop.shopName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-white text-center">
                                                                    <Store size={48} className="mx-auto mb-2 opacity-80" />
                                                                    <p className="text-sm font-semibold tracking-wider uppercase opacity-80 font-headings">Fresh Produce Store</p>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => handleEditShopClick(shop, viewingShopIndex)}
                                                                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 font-headings"
                                                            >
                                                                <Pencil size={12} /> Edit Shop / Photo
                                                            </button>
                                                        </div>

                                                        <div className="p-6 md:p-8">
                                                            {editingShopIndex === viewingShopIndex ? (
                                                                <form onSubmit={handleUpdateShop} className="space-y-4 max-w-xl">
                                                                    <h3 className="text-lg font-bold text-slate-800 mb-2 font-headings">Edit Shop Details</h3>
                                                                    <div>
                                                                        <label className={labelCls}>Shop Name</label>
                                                                        <div className="relative">
                                                                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>Location <span className="text-emerald-600 font-bold">*</span></label>
                                                                        <div className="relative">
                                                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                                                                disabled={detectingShopLocation}
                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                                            >
                                                                                {detectingShopLocation ? (
                                                                                    <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                                                ) : (
                                                                                    <Navigation size={10} />
                                                                                )}
                                                                                {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>GST Number</label>
                                                                        <div className="relative">
                                                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                            <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className={labelCls}>Shop Photo</label>
                                                                        <ImageUploadField
                                                                            value={editShopForm.image}
                                                                            onChange={(val) => setEditShopForm({ ...editShopForm, image: val })}
                                                                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                                            placeholder="https://images.unsplash.com/..."
                                                                            accentColor="emerald"
                                                                            id="edit-shop-inline-image"
                                                                        />
                                                                    </div>
                                                                    {/* Social Media Links - Edit Shop / Photo inline form */}
                                                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                        <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 font-headings">
                                                                            <Globe size={13} className="text-emerald-600" /> Social Media Links (Optional)
                                                                        </label>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Instagram</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.instagram || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value } }))} placeholder="https://instagram.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Facebook</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.facebook || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value } }))} placeholder="https://facebook.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">YouTube</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.youtube || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value } }))} placeholder="https://youtube.com/@..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">WhatsApp</label>
                                                                                <input type="text" value={editShopForm.socialLinks?.whatsapp || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Official Website</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.website || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), website: e.target.value } }))} placeholder="https://yourshop.com" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2 pt-1">
                                                                        <button type="submit" disabled={isUpdatingShop} className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black font-headings shadow-md active:scale-95 cursor-pointer">
                                                                            {isUpdatingShop ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                                            <span>{isUpdatingShop ? 'Saving...' : 'Save Shop Changes'}</span>
                                                                        </button>
                                                                        <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                                                    </div>
                                                                </form>
                                                            ) : deletingShopIndex === viewingShopIndex ? (
                                                                <div className="py-6 flex flex-col items-center justify-center text-center gap-2 max-w-md mx-auto">
                                                                    <Trash2 className="text-red-500 animate-bounce" size={32} />
                                                                    <h3 className="text-lg font-bold text-slate-800 font-headings">Delete {shop.shopName}?</h3>
                                                                    <p className="text-sm text-slate-400 font-medium font-body leading-relaxed">Deleting this shop will permanently remove it and all of its associated products. This action cannot be undone.</p>
                                                                    <div className="flex gap-3 mt-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleDeleteShop(viewingShopIndex);
                                                                                setViewingShopIndex(null);
                                                                                setSelectedShopFilter(null);
                                                                            }}
                                                                            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10"
                                                                        >
                                                                            Yes, Delete Shop
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeletingShopIndex(null)}
                                                                            className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                                    <div className="space-y-4">
                                                                        <h2 className="text-3xl font-black text-slate-850 font-headings">{shop.shopName}</h2>
                                                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium font-body">
                                                                            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-emerald-600" />{shop.location || 'No location set'}</span>
                                                                            <span className="flex items-center gap-1.5"><FileText size={16} className="text-slate-400" />GST: {shop.gstNumber}</span>
                                                                            {(shop.updatedAt || shop.createdAt) && (
                                                                                <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-mono">
                                                                                    <Clock size={13} className="text-emerald-600" />
                                                                                    Last Updated: {formatUpdatedTime(shop.updatedAt || shop.createdAt)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {/* Social Media Links - View Shop detail */}
                                                                        {shop.socialLinks && (shop.socialLinks.instagram || shop.socialLinks.facebook || shop.socialLinks.youtube || shop.socialLinks.whatsapp || shop.socialLinks.website) && (
                                                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-headings mr-1">Socials:</span>
                                                                                {shop.socialLinks.instagram && (
                                                                                    <a href={shop.socialLinks.instagram.startsWith('http') ? shop.socialLinks.instagram : `https://instagram.com/${shop.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform shadow-sm" title="Instagram">
                                                                                        <Instagram size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.facebook && (
                                                                                    <a href={shop.socialLinks.facebook.startsWith('http') ? shop.socialLinks.facebook : `https://facebook.com/${shop.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-600 text-white hover:scale-110 transition-transform shadow-sm" title="Facebook">
                                                                                        <Facebook size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.youtube && (
                                                                                    <a href={shop.socialLinks.youtube.startsWith('http') ? shop.socialLinks.youtube : `https://youtube.com/${shop.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-red-600 text-white hover:scale-110 transition-transform shadow-sm" title="YouTube">
                                                                                        <Youtube size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.whatsapp && (
                                                                                    <a href={shop.socialLinks.whatsapp.startsWith('http') ? shop.socialLinks.whatsapp : `https://wa.me/${shop.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-emerald-600 text-white hover:scale-110 transition-transform shadow-sm" title="WhatsApp">
                                                                                        <MessageCircle size={14} />
                                                                                    </a>
                                                                                )}
                                                                                {shop.socialLinks.website && (
                                                                                    <a href={shop.socialLinks.website.startsWith('http') ? shop.socialLinks.website : `https://${shop.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-slate-800 text-white hover:scale-110 transition-transform shadow-sm" title="Website">
                                                                                        <Globe size={14} />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeletingShopIndex(viewingShopIndex)}
                                                                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2.5 rounded-xl transition-all border border-rose-100/50"
                                                                            title="Delete Shop"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        /* ── Shops List View ── */
                                        <div className="flex-1 w-full text-left">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-2xl font-bold text-slate-800 font-headings">My Shops ({vendorShops.length})</h2>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddShopForm(true)}
                                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-1.5 active:scale-[0.98] font-headings text-xs uppercase tracking-wider cursor-pointer"
                                                >
                                                    <Plus size={18} />
                                                    Add Shop
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {vendorShops.map((shop, i) => (
                                                    <div key={i} className="bg-white/40 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">
                                                        {editingShopIndex === i ? (
                                                            <form onSubmit={handleUpdateShop} className="space-y-3">
                                                                <p className="text-xs font-black text-emerald-700 uppercase tracking-wider mb-2 font-headings">Editing Shop</p>
                                                                <div>
                                                                    <label className={labelCls}>Shop Name</label>
                                                                    <div className="relative">
                                                                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.shopName} onChange={(e) => setEditShopForm({ ...editShopForm, shopName: e.target.value })} className={inputCls} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>Location <span className="text-emerald-600 font-bold">*</span></label>
                                                                    <div className="relative">
                                                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.location} onChange={(e) => setEditShopForm({ ...editShopForm, location: e.target.value })} className={inputCls} style={{ paddingRight: '150px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleGetCurrentLocation(setEditShopForm, editShopForm)}
                                                                            disabled={detectingShopLocation}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2 py-1 rounded-md transition-colors border border-emerald-100/50 flex items-center gap-1"
                                                                        >
                                                                            {detectingShopLocation ? (
                                                                                <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                                            ) : (
                                                                                <Navigation size={10} />
                                                                            )}
                                                                            {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                                                        </button>
                                                                    </div>
                                                                    <p className="text-[10px] text-emerald-600 mt-1 flex items-start gap-1 font-body leading-relaxed">
                                                                        <Navigation size={10} className="mt-0.5 flex-shrink-0" /> Enter your full address so customers can see your shop on Google Maps when tracking orders.
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>GST Number</label>
                                                                    <div className="relative">
                                                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                                        <input required type="text" value={editShopForm.gstNumber} onChange={(e) => setEditShopForm({ ...editShopForm, gstNumber: e.target.value })} className={inputCls} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className={labelCls}>Shop Photo</label>
                                                                    <ImageUploadField
                                                                        value={editShopForm.image}
                                                                        onChange={(val) => setEditShopForm({ ...editShopForm, image: val })}
                                                                        inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                                        placeholder="https://images.unsplash.com/..."
                                                                        accentColor="emerald"
                                                                        id="edit-shop-modal-image"
                                                                    />
                                                                </div>

                                                                {/* Social Media Links */}
                                                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                                                    <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5 font-headings">
                                                                        <Globe size={13} className="text-emerald-600" /> Social Media Links (Optional)
                                                                    </label>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Instagram</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.instagram || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), instagram: e.target.value } }))} placeholder="https://instagram.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Facebook</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.facebook || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), facebook: e.target.value } }))} placeholder="https://facebook.com/..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">YouTube</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.youtube || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), youtube: e.target.value } }))} placeholder="https://youtube.com/@..." className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">WhatsApp</label>
                                                                            <input type="text" value={editShopForm.socialLinks?.whatsapp || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), whatsapp: e.target.value } }))} placeholder="+91 9876543210" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Official Website</label>
                                                                        <input type="text" value={editShopForm.socialLinks?.website || ''} onChange={(e) => setEditShopForm(prev => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), website: e.target.value } }))} placeholder="https://yourshop.com" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 pt-1">
                                                                    <button type="submit" disabled={isUpdatingShop} className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black font-headings shadow-md active:scale-95 cursor-pointer">
                                                                        {isUpdatingShop ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                                        <span>{isUpdatingShop ? 'Saving...' : 'Save Shop Changes'}</span>
                                                                    </button>
                                                                    <button type="button" onClick={() => setEditingShopIndex(null)} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"><X size={14} /> Cancel</button>
                                                                </div>
                                                            </form>
                                                        ) : deletingShopIndex === i ? (
                                                            /* ── Delete Confirmation ── */
                                                            <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
                                                                <Trash2 className="text-red-500 animate-bounce" size={24} />
                                                                <p className="text-sm font-bold text-slate-800 font-headings">Delete {shop.shopName}?</p>
                                                                <p className="text-[10px] text-slate-400 font-body">Deleting this shop will also hide its products. This cannot be undone.</p>
                                                                <div className="flex gap-2 mt-2">
                                                                    <button type="button" onClick={() => handleDeleteShop(i)} className="bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/10">Yes, Delete</button>
                                                                    <button type="button" onClick={() => setDeletingShopIndex(null)} className="bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* ── Shop Card View ── */
                                                            <>
                                                                {/* Shop Header */}
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100/30">
                                                                            <Store size={14} className="text-emerald-600" />
                                                                        </div>
                                                                        <h3 className="font-extrabold text-slate-800 font-headings">{shop.shopName}</h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => handleEditShopClick(shop, i)} className="text-slate-400 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-emerald-50" title="Edit Shop">
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                        <button onClick={() => setDeletingShopIndex(i)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50" title="Delete Shop">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Location row */}
                                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                                    <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0 font-body">
                                                                        <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                                                                        <span className="truncate font-semibold">{shop.location || <span className="text-red-400 italic">No location set</span>}</span>
                                                                    </div>
                                                                    {shop.location && (
                                                                        <a
                                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.location)}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1 text-xs font-bold text-emerald-600 border border-emerald-250 px-2 py-1 rounded-lg hover:bg-emerald-50/50 transition-colors flex-shrink-0 font-headings"
                                                                        >
                                                                            <ExternalLink size={11} /> Maps
                                                                        </a>
                                                                    )}
                                                                </div>

                                                                {/* Google Maps Embed Preview */}
                                                                {shop.location ? (
                                                                    <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner mb-3" style={{ height: '160px' }}>
                                                                        <iframe
                                                                            title={`Map for ${shop.shopName}`}
                                                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(shop.location + (shop.shopName ? ' ' + shop.shopName : ''))}&output=embed&z=14`}
                                                                            width="100%"
                                                                            height="100%"
                                                                            style={{ border: 0 }}
                                                                            loading="lazy"
                                                                            referrerPolicy="no-referrer-when-downgrade"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rose-150 bg-rose-50/30 mb-3 py-5 px-3 text-center">
                                                                        <Navigation size={22} className="text-rose-300 mb-1" />
                                                                        <p className="text-xs font-bold text-rose-500 font-headings">Shop location not set</p>
                                                                        <p className="text-[10px] text-slate-400 mt-0.5 font-body">Click the pencil icon to add your location so customers can track their orders.</p>
                                                                    </div>
                                                                )}

                                                                {/* GST & Last Updated */}
                                                                {/* Shop Social Media Links */}
                                                                {shop.socialLinks && (shop.socialLinks.instagram || shop.socialLinks.facebook || shop.socialLinks.youtube || shop.socialLinks.whatsapp || shop.socialLinks.website) && (
                                                                    <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 font-headings">Socials:</span>
                                                                        {shop.socialLinks.instagram && (
                                                                            <a href={shop.socialLinks.instagram.startsWith('http') ? shop.socialLinks.instagram : `https://instagram.com/${shop.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform" title="Instagram">
                                                                                <Instagram size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.facebook && (
                                                                            <a href={shop.socialLinks.facebook.startsWith('http') ? shop.socialLinks.facebook : `https://facebook.com/${shop.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-600 text-white hover:scale-110 transition-transform" title="Facebook">
                                                                                <Facebook size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.youtube && (
                                                                            <a href={shop.socialLinks.youtube.startsWith('http') ? shop.socialLinks.youtube : `https://youtube.com/${shop.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-red-600 text-white hover:scale-110 transition-transform" title="YouTube">
                                                                                <Youtube size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.whatsapp && (
                                                                            <a href={shop.socialLinks.whatsapp.startsWith('http') ? shop.socialLinks.whatsapp : `https://wa.me/${shop.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-600 text-white hover:scale-110 transition-transform" title="WhatsApp">
                                                                                <MessageCircle size={12} />
                                                                            </a>
                                                                        )}
                                                                        {shop.socialLinks.website && (
                                                                            <a href={shop.socialLinks.website.startsWith('http') ? shop.socialLinks.website : `https://${shop.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-800 text-white hover:scale-110 transition-transform" title="Website">
                                                                                <Globe size={12} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-100 pb-3 font-body">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <FileText size={12} />
                                                                        <span>GST: {shop.gstNumber}</span>
                                                                    </div>
                                                                    {(shop.updatedAt || shop.createdAt) && (
                                                                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-full font-mono">
                                                                            <Clock size={10} className="text-emerald-600" />
                                                                            <span>Updated {formatUpdatedTime(shop.updatedAt || shop.createdAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* View Shop Button */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setViewingShopIndex(i);
                                                                        setSelectedShopFilter(shop.shopName);
                                                                    }}
                                                                    className="w-full mt-3 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] font-headings"
                                                                >
                                                                    <Store size={12} /> View Shop
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* ─── Vendor: My Products Tab ────────────────────────────────────────── */}
                    {(isVendor && activeTab === 'my_products') && (
                        <div className="space-y-8 animate-fade-in text-left">
                            <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold font-headings text-slate-800 flex items-center gap-2">
                                            <Package className="text-emerald-600" size={22} />
                                            {selectedShopFilter ? `Products at ${selectedShopFilter}` : 'My Products'} ({vendorProducts.length})
                                        </h2>
                                        <p className="text-xs text-slate-450 font-body mt-0.5">Manage catalog pricing, stock levels, and publish new products.</p>
                                    </div>

                                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                        {selectedShopFilter && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedShopFilter(null)}
                                                className="flex items-center gap-1.5 bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] font-headings"
                                            >
                                                <X size={12} /> Show All Shops
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const defaultShopName = vendorShops[0]?.shopName || '';
                                                handleOpenAddProductForShop(defaultShopName);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                                        >
                                            <Plus size={16} /> Add Products
                                        </button>
                                    </div>
                                </div>

                                {vendorProducts.length === 0 ? (
                                    <div className="bg-white/40 border border-dashed border-slate-200 rounded-3xl p-12 text-center">
                                        <Package className="mx-auto text-slate-350 mb-4" size={48} />
                                        <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No products yet</h3>
                                        <p className="text-sm text-slate-550 font-body mb-4">Get started by adding your first product to your shop.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const defaultShopName = vendorShops[0]?.shopName || '';
                                                handleOpenAddProductForShop(defaultShopName);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-1.5"
                                        >
                                            <Plus size={16} /> Add Products
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {vendorProducts.map(product => (
                                            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-100/50 transition-all duration-300">
                                                {deletingProductId === product.id ? (
                                                    <div className="p-5 flex flex-col items-center justify-center h-full text-center gap-3">
                                                        <Trash2 className="text-rose-500 animate-bounce" size={32} />
                                                        <p className="text-sm font-bold text-slate-800 font-headings">Delete <span className="text-emerald-600">{product.name}</span>?</p>
                                                        <p className="text-xs text-slate-405 font-body">This cannot be undone.</p>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md">Yes, Delete</button>
                                                            <button onClick={() => setDeletingProductId(null)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="h-44 overflow-hidden bg-slate-50 flex items-center justify-center relative group">
                                                            {product.image
                                                                ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                : <ImageIcon className="text-slate-300" size={48} />
                                                            }
                                                            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-305">
                                                                <button
                                                                    onClick={() => handleEditProductClick(product)}
                                                                    className="bg-white/90 backdrop-blur-sm text-emerald-600 hover:bg-emerald-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors"
                                                                    title="Edit Product"
                                                                >
                                                                    <Pencil size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingProductId(product.id)}
                                                                    className="bg-white/90 backdrop-blur-sm text-rose-550 hover:bg-rose-600 hover:text-white p-2 rounded-xl shadow-md border border-slate-100 transition-colors"
                                                                    title="Delete Product"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <div className="text-[10px] font-black text-emerald-600 mb-1.5 uppercase tracking-wider font-headings">{product.category}</div>
                                                            <h3 className="font-bold text-slate-800 mb-1 truncate font-headings text-sm">{product.name}</h3>
                                                            <div className="flex items-center justify-between mt-3">
                                                                <div className="font-extrabold text-slate-900 text-base font-body">₹{parseFloat(product.price).toFixed(2)}</div>
                                                                <div className="bg-slate-50 text-slate-405 px-2.5 py-1 rounded-full text-[10px] font-semibold truncate max-w-[120px] flex items-center gap-1 border border-slate-100 font-body">
                                                                    <Store size={10} /> {product.vendor}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div> {/* closes lg:col-span-9 space-y-8 */}
                {showAddShopForm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                    >
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleAddAdditionalShop} className="flex flex-col h-full overflow-hidden">

                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-605 border border-emerald-100 animate-pulse">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Shop</h2>
                                            <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Register a new shop branch to showcase your products</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <div>
                                        <label className={labelCls}>Shop Name</label>
                                        <div className="relative">
                                            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input required type="text" value={newShop.shopName} onChange={(e) => setNewShop({ ...newShop, shopName: e.target.value })} className={inputCls} placeholder="E.g. Fresh Valley Farms" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Shop Location <span className="text-emerald-605 font-bold">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input required type="text" value={newShop.location} onChange={(e) => setNewShop({ ...newShop, location: e.target.value })} className={inputCls} style={{ paddingRight: '160px' }} placeholder="E.g. Andheri West, Mumbai, Maharashtra" />
                                            <button
                                                type="button"
                                                onClick={() => handleGetCurrentLocation(setNewShop, newShop)}
                                                disabled={detectingShopLocation}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 text-emerald-600 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-100/50 flex items-center gap-1"
                                            >
                                                {detectingShopLocation ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                                ) : (
                                                    <Navigation size={12} />
                                                )}
                                                {detectingShopLocation ? 'Detecting...' : 'Add current location'}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 mt-1.5 flex items-start gap-1 font-body">
                                            <Navigation size={11} className="mt-0.5 flex-shrink-0" /> Use a specific address — customers see this on Google Maps when tracking their order.
                                        </p>
                                    </div>
                                    <div>
                                        <label className={labelCls}>GST Number</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input required type="text" value={newShop.gstNumber} onChange={(e) => setNewShop({ ...newShop, gstNumber: e.target.value })} className={inputCls} placeholder="E.g. 22AAAAA0000A1Z5" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Shop Photo</label>
                                        <ImageUploadField
                                            value={newShop.image}
                                            onChange={(val) => setNewShop({ ...newShop, image: val })}
                                            inputClassName={inputCls.replace('pl-10', 'px-4')}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            accentColor="emerald"
                                            id="add-new-shop-image"
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddShopForm(false); setNewShop({ shopName: '', location: '', gstNumber: '', image: '' }); }}
                                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold transition-all duration-200 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAddingShop}
                                        className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                                    >
                                        {isAddingShop ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            "Create Shop"
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

                {/* ── Add Product Form Modal ────────────────────────────────────────── */}
                {showAddForm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                        onClick={() => setShowAddForm(false)}
                    >
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <form onSubmit={handleAddProduct} className="flex flex-col h-full overflow-hidden">

                                {/* Modal Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-emerald-55 p-2.5 rounded-2xl text-emerald-600 border border-emerald-100/50 animate-pulse">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 font-headings">Add New Product</h2>
                                            <p className="text-xs text-slate-400 font-medium font-body mt-0.5">Fill in the details to publish a new product in the marketplace</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Body (Scrollable) */}
                                <div className="overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-8 flex-1">
                                    {/* Section: Basic Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <Package size={16} /> Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <input required type="text" name="name" value={newProduct.name} onChange={handleInputChange} className={inputCls} placeholder="E.g. Organic Red Tomatoes" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <select
                                                        required
                                                        name="shop"
                                                        value={newProduct.shop}
                                                        onChange={handleInputChange}
                                                        disabled={!!selectedShopFilter}
                                                        className={`${inputCls} appearance-none bg-white font-medium`}
                                                    >
                                                        <option value="">Select a shop...</option>
                                                        {vendorShops.length === 0 ? (
                                                            <option value={userProfile?.displayName || user?.displayName || 'My Vendor Shop'}>
                                                                {userProfile?.displayName || user?.displayName || 'My Vendor Shop'} (Default Shop)
                                                            </option>
                                                        ) : (
                                                            vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <select
                                                        required
                                                        name="category"
                                                        value={newProduct.category}
                                                        onChange={(e) => {
                                                            const selectedCat = e.target.value;
                                                            const subCatList = SUB_CATEGORIES_MAP[selectedCat] || [];
                                                            const firstSub = subCatList[0] || '';
                                                            setNewProduct(prev => ({
                                                                ...prev,
                                                                category: selectedCat,
                                                                subCategory: firstSub,
                                                                name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? firstSub : prev.name
                                                            }));
                                                        }}
                                                        className={`${inputCls} appearance-none bg-white font-medium`}
                                                    >
                                                        <option value="">Select category...</option>
                                                        {Object.keys(SUB_CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            {newProduct.category && SUB_CATEGORIES_MAP[newProduct.category] && (
                                                <div>
                                                    <label className={labelCls}>Sub-Category <span className="text-emerald-600 font-bold">*</span></label>
                                                    <div className="relative">
                                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                        <select
                                                            required
                                                            name="subCategory"
                                                            value={newProduct.subCategory}
                                                            onChange={(e) => {
                                                                const selectedSubCat = e.target.value;
                                                                setNewProduct(prev => ({
                                                                    ...prev,
                                                                    subCategory: selectedSubCat,
                                                                    name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? selectedSubCat : prev.name
                                                                }));
                                                            }}
                                                            className={`${inputCls} appearance-none bg-white font-medium`}
                                                        >
                                                            <option value="">Select sub-category...</option>
                                                            {(SUB_CATEGORIES_MAP[newProduct.category] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                    <input type="number" step="0.01" name="mrp" value={newProduct.mrp} onChange={handleInputChange} className={inputCls} placeholder="6.50" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                    <input required type="number" step="0.01" name="price" value={newProduct.price} onChange={handleInputChange} className={inputCls} placeholder="4.99" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Quantity (e.g. 500g, 1 pack, 6 pcs)</label>
                                                <input type="text" name="netWeight" value={newProduct.netWeight} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="E.g. 500g, 1 pack, 6 pcs" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Unit (e.g. kg, box, gm, ml) <span className="text-emerald-600 font-bold">*</span></label>
                                                <select
                                                    required
                                                    name="unitSelect"
                                                    value={STANDARD_UNITS.includes(newProduct.unit) ? newProduct.unit : 'Other'}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other') {
                                                            setNewProduct({ ...newProduct, unit: '' });
                                                        } else {
                                                            setNewProduct({ ...newProduct, unit: val });
                                                        }
                                                    }}
                                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="kg">KG</option>
                                                    <option value="gm">gm (grams)</option>
                                                    <option value="litre">litre (L)</option>
                                                    <option value="ml">ml (millilitres)</option>
                                                    <option value="BOX">BOX</option>
                                                    <option value="Packet">Packet</option>
                                                    <option value="Bunch">Bunch</option>
                                                    <option value="Piece">Piece / Pcs</option>
                                                    <option value="Dozen">Dozen</option>
                                                    <option value="Other">Other...</option>
                                                </select>

                                                {!STANDARD_UNITS.includes(newProduct.unit) && (
                                                    <div className="mt-2.5 animate-fade-in">
                                                        <input
                                                            required
                                                            type="text"
                                                            name="unit"
                                                            value={newProduct.unit}
                                                            onChange={handleInputChange}
                                                            className={inputCls.replace('pl-10', 'px-4')}
                                                            placeholder="Enter custom unit (e.g. crate, bundle, jar, tray)"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelCls}>
                                                    Available Stock / Inventory <span className="text-emerald-700 font-extrabold font-headings">(in {newProduct.unit ? newProduct.unit : 'units'})</span>
                                                </label>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <input
                                                        type="number"
                                                        name="stockQuantity"
                                                        value={newProduct.stockQuantity}
                                                        onChange={handleInputChange}
                                                        className={`${inputCls} pr-20`}
                                                        placeholder={`E.g. 100 ${newProduct.unit || 'units'}`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 uppercase tracking-wider font-mono pointer-events-none shadow-2xs">
                                                        {newProduct.unit || 'units'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <label className={labelCls}>Product Image <span className="text-slate-400 font-normal text-[11px]">(Optional - fallback image auto-assigned if empty)</span></label>
                                                <ImageUploadField
                                                    value={newProduct.image}
                                                    onChange={(val) => setNewProduct(prev => ({ ...prev, image: val }))}
                                                    inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="https://images.unsplash.com/photo-..."
                                                    accentColor="emerald"
                                                    id="add-product-image"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Product Specifications */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <Check size={16} /> Product Specifications & Freshness
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className={labelCls}>Food Preference</label>
                                                <select name="preference" value={newProduct.preference} onChange={handleInputChange} className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}>
                                                    <option value="Vegetarian">Vegetarian</option>
                                                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                    <option value="Vegan">Vegan</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Country of Origin</label>
                                                <input type="text" name="origin" value={newProduct.origin} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="India" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Max Shelf Life</label>
                                                <input type="text" name="shelfLife" value={newProduct.shelfLife} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="7 days" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Harvest / Freshness Date</label>
                                                <input type="text" name="harvestDate" value={newProduct.harvestDate} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Harvested Today" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                                <input type="text" name="organicCert" value={newProduct.organicCert} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="FSSAI-1002930492" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Storage & Handling Info</label>
                                                <input type="text" name="storageInfo" value={newProduct.storageInfo} onChange={handleInputChange} className={inputCls.replace('pl-10', 'px-4')} placeholder="Keep refrigerated at 4°C" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Details & Lists */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <FileText size={16} /> Details & Descriptions
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelCls}>Description</label>
                                                <textarea name="description" value={newProduct.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Detailed description of the product..."></textarea>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Features & Details (one per line)</label>
                                                <textarea name="features" value={newProduct.features} onChange={handleInputChange} rows="3" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"></textarea>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Available Offers (one per line)</label>
                                                <textarea name="offers" value={newProduct.offers} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Policies */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-605 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <RefreshCw size={16} /> Policies
                                        </h3>
                                        <div>
                                            <label className={labelCls}>Return Policy</label>
                                            <textarea name="returnPolicy" value={newProduct.returnPolicy} onChange={handleInputChange} rows="2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body" placeholder="Returnable within 24 hours if damaged..."></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-205 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings"
                                    >
                                        Save Product to Marketplace
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Edit Product Popup Modal ────────────────────────────────────── */}
                {editingProductId && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 overflow-y-auto"
                        onClick={() => setEditingProductId(null)}
                    >
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-auto flex flex-col transform transition-all scale-100 duration-300 border border-slate-100 relative text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                                        <Pencil size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold font-headings text-slate-800">Edit Product</h2>
                                        <p className="text-xs text-slate-400 font-medium font-body">Modify details, pricing, inventory & specifications for {editProductForm.name}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingProductId(null)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all duration-200"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleUpdateProduct} className="flex flex-col flex-1 overflow-hidden">
                                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">

                                    {/* Section: Basic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <Package size={16} /> Basic Information
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* 1. Product Name * */}
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <input
                                                        required
                                                        type="text"
                                                        name="name"
                                                        value={editProductForm.name}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                                                        className={inputCls}
                                                        placeholder="E.g. Organic Red Tomatoes"
                                                    />
                                                </div>
                                            </div>

                                            {/* 2. Which Shop? * */}
                                            <div>
                                                <label className={labelCls}>Which Shop? <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <select
                                                        required
                                                        name="shop"
                                                        value={editProductForm.shop}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, shop: e.target.value })}
                                                        className={`${inputCls} appearance-none bg-white font-medium`}
                                                    >
                                                        <option value="">Select a shop...</option>
                                                        {vendorShops.map((shop, i) => <option key={i} value={shop.shopName}>{shop.shopName}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* 3. Category * */}
                                            <div>
                                                <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <select
                                                        required
                                                        name="category"
                                                        value={editProductForm.category}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                                                        className={`${inputCls} appearance-none bg-white font-medium`}
                                                    >
                                                        <option value="">Select category...</option>
                                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* 4. M.R.P. / Original Price (₹) */}
                                            <div>
                                                <label className={labelCls}>M.R.P. / Original Price (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        name="mrp"
                                                        value={editProductForm.mrp}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, mrp: e.target.value })}
                                                        className={inputCls}
                                                        placeholder="6.50"
                                                    />
                                                </div>
                                            </div>

                                            {/* 5. Selling Price (₹) * */}
                                            <div>
                                                <label className={labelCls}>Selling Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                                <div className="relative">
                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                                                    <input
                                                        required
                                                        type="number"
                                                        step="0.01"
                                                        name="price"
                                                        value={editProductForm.price}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                                                        className={inputCls}
                                                        placeholder="4.99"
                                                    />
                                                </div>
                                            </div>

                                            {/* 6. Quantity (e.g. 500g, 1 pack) */}
                                            <div>
                                                <label className={labelCls}>Quantity (e.g. 500g, 1 pack, 6 pcs)</label>
                                                <input
                                                    type="text"
                                                    name="netWeight"
                                                    value={editProductForm.netWeight}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, netWeight: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="E.g. 500g, 1 pack, 6 pcs"
                                                />
                                            </div>

                                            {/* 7. Unit (e.g. kg, box) * (Dropdown) */}
                                            <div>
                                                <label className={labelCls}>Unit (e.g. kg, box, gm, ml) <span className="text-emerald-600 font-bold">*</span></label>
                                                <select
                                                    required
                                                    name="unitSelect"
                                                    value={STANDARD_UNITS.includes(editProductForm.unit) ? editProductForm.unit : 'Other'}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'Other') {
                                                            setEditProductForm({ ...editProductForm, unit: '' });
                                                        } else {
                                                            setEditProductForm({ ...editProductForm, unit: val });
                                                        }
                                                    }}
                                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="kg">KG</option>
                                                    <option value="gm">gm (grams)</option>
                                                    <option value="litre">litre (L)</option>
                                                    <option value="ml">ml (millilitres)</option>
                                                    <option value="BOX">BOX</option>
                                                    <option value="Packet">Packet</option>
                                                    <option value="Bunch">Bunch</option>
                                                    <option value="Piece">Piece / Pcs</option>
                                                    <option value="Dozen">Dozen</option>
                                                    <option value="Other">Other...</option>
                                                </select>

                                                {!STANDARD_UNITS.includes(editProductForm.unit) && (
                                                    <div className="mt-2.5 animate-fade-in">
                                                        <input
                                                            required
                                                            type="text"
                                                            name="unit"
                                                            value={editProductForm.unit}
                                                            onChange={(e) => setEditProductForm({ ...editProductForm, unit: e.target.value })}
                                                            className={inputCls.replace('pl-10', 'px-4')}
                                                            placeholder="Enter custom unit (e.g. crate, bundle, jar, tray)"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* 8. Available Stock / Inventory (Units / kg) */}
                                            <div>
                                                <label className={labelCls}>Available Stock / Inventory (in {editProductForm.unit || 'units'})</label>
                                                <div className="relative">
                                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" size={18} />
                                                    <input
                                                        type="number"
                                                        name="stockQuantity"
                                                        value={editProductForm.stockQuantity}
                                                        onChange={(e) => setEditProductForm({ ...editProductForm, stockQuantity: e.target.value })}
                                                        className={`${inputCls} pr-20`}
                                                        placeholder={`E.g. 100 ${editProductForm.unit || 'units'}`}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/80 uppercase tracking-wider font-mono pointer-events-none shadow-2xs">
                                                        {editProductForm.unit || 'units'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 9. Image URL * */}
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <label className={labelCls}>Product Image <span className="text-emerald-600 font-bold">*</span></label>
                                                <ImageUploadField
                                                    value={editProductForm.image}
                                                    onChange={(val) => setEditProductForm(prev => ({ ...prev, image: val }))}
                                                    inputClassName={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="https://example.com/image.jpg"
                                                    required
                                                    accentColor="emerald"
                                                    id="edit-product-image"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Product Specifications */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <Check size={16} /> Product Specifications & Freshness
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                                <label className={labelCls}>Food Preference</label>
                                                <select
                                                    name="preference"
                                                    value={editProductForm.preference}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, preference: e.target.value })}
                                                    className={`${inputCls.replace('pl-10', 'px-4')} appearance-none bg-white font-medium`}
                                                >
                                                    <option value="Vegetarian">Vegetarian</option>
                                                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                    <option value="Vegan">Vegan</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Country of Origin</label>
                                                <input
                                                    type="text"
                                                    name="origin"
                                                    value={editProductForm.origin}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, origin: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="India"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Max Shelf Life</label>
                                                <input
                                                    type="text"
                                                    name="shelfLife"
                                                    value={editProductForm.shelfLife}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, shelfLife: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="7 days"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Harvest / Freshness Date</label>
                                                <input
                                                    type="text"
                                                    name="harvestDate"
                                                    value={editProductForm.harvestDate}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, harvestDate: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="Harvested Today"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>FSSAI / Organic Cert. No.</label>
                                                <input
                                                    type="text"
                                                    name="organicCert"
                                                    value={editProductForm.organicCert}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, organicCert: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="FSSAI-1002930492"
                                                />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Storage & Handling Info</label>
                                                <input
                                                    type="text"
                                                    name="storageInfo"
                                                    value={editProductForm.storageInfo}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, storageInfo: e.target.value })}
                                                    className={inputCls.replace('pl-10', 'px-4')}
                                                    placeholder="Keep refrigerated at 4°C"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Details & Lists */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <FileText size={16} /> Details & Descriptions
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className={labelCls}>Description</label>
                                                <textarea
                                                    name="description"
                                                    value={editProductForm.description}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                                                    rows="3"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                    placeholder="Detailed description of the product..."
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Features & Details (one per line)</label>
                                                <textarea
                                                    name="features"
                                                    value={editProductForm.features}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, features: e.target.value })}
                                                    rows="3"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                    placeholder="Hand-picked&#10;Organic certified&#10;Rich in Vitamin C"
                                                ></textarea>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Available Offers (one per line)</label>
                                                <textarea
                                                    name="offers"
                                                    value={editProductForm.offers}
                                                    onChange={(e) => setEditProductForm({ ...editProductForm, offers: e.target.value })}
                                                    rows="2"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                    placeholder="10% discount on orders above $50&#10;Buy 1 Get 1 Free"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section: Policies */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 font-headings">
                                            <RefreshCw size={16} /> Policies
                                        </h3>
                                        <div>
                                            <label className={labelCls}>Return Policy</label>
                                            <textarea
                                                name="returnPolicy"
                                                value={editProductForm.returnPolicy}
                                                onChange={(e) => setEditProductForm({ ...editProductForm, returnPolicy: e.target.value })}
                                                rows="2"
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none resize-none text-sm transition-all duration-200 bg-white/50 backdrop-blur-sm font-body"
                                                placeholder="Returnable within 24 hours if damaged..."
                                            ></textarea>
                                        </div>
                                    </div>

                                </div>

                                {/* Modal Footer */}
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setEditingProductId(null)}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold transition-all duration-200 text-sm font-headings"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-900/10 active:scale-[0.98] text-sm font-headings"
                                    >
                                        Update Product Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}


            </div>

            {/* Custom Success Popup Modal */}
            {successModalData && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 space-y-6 text-center animate-scale-up">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200/60">
                            <CheckCircle size={32} />
                        </div>

                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                                {successModalData.title || 'Success!'}
                            </h3>
                            <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed font-body">
                                {successModalData.message}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setSuccessModalData(null)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                            >
                                Okay, Great!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Gallery Photo Popup Modal */}
            {showAddGalleryModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold text-base">
                                    📸
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 font-headings">Add Farm Gallery Photo</h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Add photo to Farm Gallery & Visual Tour</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddGalleryModal(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddGalleryPhoto} className="space-y-4">
                            {/* Photo URL */}
                            <div>
                                <label className={labelCls}>Photo Image URL <span className="text-emerald-600 font-bold">*</span></label>
                                <ImageUploadField
                                    value={newGalleryForm.url}
                                    onChange={(val) => setNewGalleryForm({ ...newGalleryForm, url: val })}
                                    inputClassName={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    required
                                    accentColor="emerald"
                                    id="gallery-photo-url"
                                />
                            </div>

                            {/* Photo Caption */}
                            <div>
                                <label className={labelCls}>Photo Caption / Label</label>
                                <input
                                    type="text"
                                    value={newGalleryForm.caption}
                                    onChange={(e) => setNewGalleryForm({ ...newGalleryForm, caption: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="E.g. Organic Harvest Patch, Sunset View"
                                />
                            </div>

                            {/* Preset Sample Photos */}
                            <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-headings">Or select sample photo:</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: '🌾 Green Fields & Orchard', url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1000&q=80' },
                                        { label: '🍓 Harvest Patch', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1000&q=80' },
                                        { label: '🌅 Farm Sunset View', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000&q=80' },
                                        { label: '🛖 Rustic Stays & Huts', url: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1000&q=80' }
                                    ].map((sample, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setNewGalleryForm({ url: sample.url, caption: sample.label.replace(/^[^\s]+\s*/, '') })}
                                            className="text-[11px] font-extrabold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 p-2 rounded-xl border border-slate-200 text-left transition-all truncate cursor-pointer"
                                        >
                                            {sample.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Live Preview if provided */}
                            {newGalleryForm.url.trim() && (
                                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                    <div className="w-14 h-14 bg-white rounded-xl overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                                        <img
                                            src={newGalleryForm.url}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">Live Photo Preview</p>
                                        <p className="text-[10px] text-emerald-600 font-bold">Loaded successfully</p>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddGalleryModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingGallery}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSavingGallery ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        '+ Add to Gallery'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Farm Product Popup Modal */}
            {showAddFarmProductModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-left animate-scale-up">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold text-base">
                                    🧺
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-900 font-headings">
                                        {editingModalProductIndex !== null ? 'Edit Farm Product' : 'Add Farm Product'}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-medium">Add or customize product for direct purchase</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setShowAddFarmProductModal(false); setEditingModalProductIndex(null); }}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveModalProduct} className="space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className={labelCls}>Product Name <span className="text-emerald-600 font-bold">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={newFarmProductForm.name}
                                    onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, name: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="E.g. Fresh Organic Strawberries"
                                />
                            </div>

                            {/* Category & Sub-Category Linked Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Category */}
                                <div>
                                    <label className={labelCls}>Category <span className="text-emerald-600 font-bold">*</span></label>
                                    <select
                                        value={newFarmProductForm.category}
                                        onChange={(e) => {
                                            const selectedCat = e.target.value;
                                            const subCatList = SUB_CATEGORIES_MAP[selectedCat] || [];
                                            const firstSub = subCatList[0] || '';
                                            setNewFarmProductForm(prev => ({
                                                ...prev,
                                                category: selectedCat,
                                                subCategory: firstSub,
                                                name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? firstSub : prev.name
                                            }));
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs transition-all bg-white font-body"
                                    >
                                        {Object.keys(SUB_CATEGORIES_MAP).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* Sub-Category */}
                                <div>
                                    <label className={labelCls}>Sub-Category <span className="text-emerald-600 font-bold">*</span></label>
                                    <select
                                        value={newFarmProductForm.subCategory}
                                        onChange={(e) => {
                                            const selectedSubCat = e.target.value;
                                            setNewFarmProductForm(prev => ({
                                                ...prev,
                                                subCategory: selectedSubCat,
                                                name: (!prev.name.trim() || Object.values(SUB_CATEGORIES_MAP).flat().includes(prev.name)) ? selectedSubCat : prev.name
                                            }));
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-xs transition-all bg-white font-body"
                                    >
                                        {(SUB_CATEGORIES_MAP[newFarmProductForm.category || 'Vegetables'] || []).map(sc => <option key={sc} value={sc}>{sc}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Cost / Price */}
                                <div>
                                    <label className={labelCls}>Price (₹) <span className="text-emerald-600 font-bold">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            value={newFarmProductForm.price}
                                            onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, price: e.target.value })}
                                            className={inputCls.replace('pl-10', 'pl-7 pr-3')}
                                            placeholder="180"
                                        />
                                    </div>
                                </div>

                                {/* Unit Dropdown */}
                                <div>
                                    <label className={labelCls}>Unit (e.g. kg, box)</label>
                                    <select
                                        value={newFarmProductForm.unit}
                                        onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, unit: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 outline-none text-xs transition-all bg-white font-body"
                                    >
                                        <option value="kg">kg (Kilogram)</option>
                                        <option value="gm">gm (Gram)</option>
                                        <option value="ml">ml (Milliliter)</option>
                                        <option value="liter">liter (Liter)</option>
                                        <option value="box">box</option>
                                        <option value="jar">jar</option>
                                        <option value="pack">pack</option>
                                        <option value="piece">piece</option>
                                        <option value="Other...">Other...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Custom Unit input if 'Other...' selected */}
                            {newFarmProductForm.unit === 'Other...' && (
                                <div>
                                    <label className={labelCls}>Custom Unit Name</label>
                                    <input
                                        type="text"
                                        value={newFarmProductForm.customUnit}
                                        onChange={(e) => setNewFarmProductForm({ ...newFarmProductForm, customUnit: e.target.value })}
                                        className={inputCls.replace('pl-10', 'px-4')}
                                        placeholder="E.g. crate, basket, bunch"
                                    />
                                </div>
                            )}

                            {/* Product Image URL */}
                            <div>
                                <label className={labelCls}>Product Image</label>
                                <ImageUploadField
                                    value={newFarmProductForm.image}
                                    onChange={(val) => setNewFarmProductForm({ ...newFarmProductForm, image: val })}
                                    inputClassName={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    accentColor="emerald"
                                    id="farm-product-image"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddFarmProductModal(false); setEditingModalProductIndex(null); }}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingModalProduct}
                                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    {isSavingModalProduct ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        editingModalProductIndex !== null ? 'Update Product' : '+ Save Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Add Stay Accommodation Popup Modal */}
            <AddStayModal
                showAddStayModal={showAddStayModal}
                setShowAddStayModal={setShowAddStayModal}
                editingStayIndex={editingStayIndex}
                setEditingStayIndex={setEditingStayIndex}
                newStayForm={newStayForm}
                setNewStayForm={setNewStayForm}
                handleSaveStay={handleSaveStay}
                isSubmitting={isSavingStayState}
                labelCls={labelCls}
                inputCls={inputCls}
            />

            {/* Signout Confirmation Popup Modal */}
            {showSignoutConfirm && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-6 text-center animate-scale-up">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-rose-100">
                            <LogOutIcon size={30} className="ml-1" />
                        </div>

                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 font-headings">
                                Confirm Signout
                            </h3>
                            <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed font-body">
                                Are you sure you want to Signout?
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleConfirmLogout}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                            >
                                Yes, Signout
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSignoutConfirm(false)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}