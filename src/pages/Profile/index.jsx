import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import OrderTrackingMap from '../../components/OrderTrackingMap';
import { Instagram, Facebook, Youtube, Globe, MessageCircle, Plus, Package, DollarSign, Tag, Image as ImageIcon, User, Store, Mail, Calendar, Shield, MapPin, FileText, Pencil, Trash2, Check, X, Clock, ShoppingBag, ArrowRight, ArrowLeft, RefreshCw, ExternalLink, Navigation, LogOut as LogOutIcon, Bike, Power, Compass, CheckCircle, Users, BarChart2, TrendingUp, PieChart, ChevronDown, Loader2 } from 'lucide-react';
import ImageUploadField from '../../components/common/ImageUploadField';
import AddStayModal from './modals/AddStayModal';
import AddFarmProductModal from './modals/AddFarmProductModal';
import AddGalleryModal from './modals/AddGalleryModal';
import EditPhotoModal from './modals/EditPhotoModal';
import SignoutConfirmModal from './modals/SignoutConfirmModal';
import ProfileHeader from './components/ProfileHeader';
import MyDetailsTab from './components/MyDetailsTab';
import SavedAddressesTab from './components/SavedAddressesTab';
import CustomerOrdersTab from './components/CustomerOrdersTab';
import DeliveryOrdersTab from './components/DeliveryOrdersTab';
import VendorFarmsTab from './components/VendorFarmsTab';
import VendorShopsTab from './components/VendorShopsTab';
import VendorProductsTab from './components/VendorProductsTab';
import AddShopModal from './modals/AddShopModal';
import AddProductModal from './modals/AddProductModal';
import EditProductModal from './modals/EditProductModal';
import ProductAddedModal from './modals/ProductAddedModal';

import ProfileTabsNav from './components/ProfileTabsNav';
import VendorAnalyticsTab from './components/VendorAnalyticsTab';
import { SUB_CATEGORIES_MAP, CATEGORIES, STANDARD_UNITS, INITIAL_CROPS, EXTRA_CROPS, INITIAL_FRUITS, EXTRA_FRUITS, INITIAL_LIVESTOCK, EXTRA_LIVESTOCK, INITIAL_KIDS_ACTIVITIES, EXTRA_KIDS_ACTIVITIES, INITIAL_ACCOMMODATIONS, EXTRA_ACCOMMODATIONS, formatUpdatedTime, geocodeAddress } from './constants/profileConstants';
import { useImageModal } from '../../context/ImageModalContext';




export default function Profile() {
    const { user, userProfile, loading, updateProfile, logout } = useAuth();
    const { products: allProducts, addProduct, updateProduct, deleteProduct, categories: dynamicCategories } = useProducts();
    const { openImageModal } = useImageModal();
    const categories = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : CATEGORIES;
    const navigate = useNavigate();

    // ─── Vendor Custom Dashboard State Sync with URL ──────────────────────────────
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') || 'details';
    const [activeTab, setActiveTab] = useState(tabFromUrl); // 'details', 'addresses', 'orders', 'setup', 'my_products', 'farms', 'analytics'

    // Synchronize activeTab state whenever URL search params change (browser back/forward button)
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (currentTab) {
            setActiveTab(currentTab);
        } else {
            setActiveTab('details');
            setSearchParams({ tab: 'details' }, { replace: true });
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
        image: '',
        isDeliverable: true,
        fulfillmentType: 'deliverable'
    });
    const [farmProductList, setFarmProductList] = useState([]);

    const handleEditModalProduct = (idx) => {
        const product = farmProductList[idx];
        if (!product) return;
        setEditingModalProductIndex(idx);
        const cat = product.category || 'Vegetables';
        const subCatList = SUB_CATEGORIES_MAP[cat] || SUB_CATEGORIES_MAP['Vegetables'];
        const isDeliv = product.isDeliverable !== false && product.fulfillmentType !== 'non_deliverable';
        setNewFarmProductForm({
            name: product.name || '',
            category: cat,
            subCategory: product.subCategory || subCatList[0] || '',
            price: product.price || '',
            unit: product.unit || 'kg',
            customUnit: '',
            image: product.image || '',
            isDeliverable: isDeliv,
            fulfillmentType: isDeliv ? 'deliverable' : 'non_deliverable'
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
        const isDeliverable = newFarmProductForm.isDeliverable !== false && newFarmProductForm.fulfillmentType !== 'non_deliverable';
        const fulfillmentType = isDeliverable ? 'deliverable' : 'non_deliverable';

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
                        image: newFarmProductForm.image.trim() || 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&q=80',
                        isDeliverable,
                        fulfillmentType
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

    const [showEditPhotoModal, setShowEditPhotoModal] = useState(false);
    const [photoToEdit, setPhotoToEdit] = useState(null);

    const handleSaveEditedGalleryPhoto = (updatedPhoto) => {
        setFarmGalleryList(prev => prev.map((item, idx) => {
            if (idx === updatedPhoto.id || item.id === updatedPhoto.id || item.url === photoToEdit?.url) {
                return {
                    ...item,
                    url: updatedPhoto.url,
                    caption: updatedPhoto.caption
                };
            }
            return item;
        }));
        setShowEditPhotoModal(false);
        setPhotoToEdit(null);
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

    const loadVendorFarms = async () => {
        if (!user || userProfile?.role !== 'vendor') return;
        try {
            const data = await api.getFarms();
            if (Array.isArray(data)) {
                const list = data.filter(f => f.ownerId === user.uid || f.vendorId === user.uid);
                setVendorFarms(list);
            }
        } catch (err) {
            console.error('Failed to load farms from PostgreSQL:', err);
        }
    };

    useEffect(() => {
        loadVendorFarms();
    }, [user, userProfile]);

    const loadVendorBookings = async () => {
        if (!user || userProfile?.role !== 'vendor') return;
        try {
            const data = await api.getFarmBookings();
            if (Array.isArray(data)) {
                const myFarmIds = vendorFarms.map(f => f.id);
                let vendorMockFarmIds = [];
                if (userProfile?.displayName === 'Orchard Farms') vendorMockFarmIds.push('mock-farm-1');
                if (userProfile?.displayName === 'Green Valley Farm') vendorMockFarmIds.push('mock-farm-2');
                if (userProfile?.displayName === 'Sunshine Produce') vendorMockFarmIds.push('mock-farm-3');

                const activeFarmIds = [...myFarmIds, ...vendorMockFarmIds];
                const filtered = data.filter(b => activeFarmIds.includes(b.farmId));
                filtered.sort((a, b) => new Date(a.visitDate || a.date) - new Date(b.visitDate || b.date));
                setIncomingFarmBookings(filtered);
            }
        } catch (err) {
            console.error('Failed to load farm bookings from PostgreSQL:', err);
        }
    };

    useEffect(() => {
        loadVendorBookings();
    }, [user, userProfile, vendorFarms]);

    const handleAddFarm = async (e) => {
        e.preventDefault();
        if (!newFarmForm.farmName.trim() || !newFarmForm.location.trim()) {
            alert('Please fill out Farm Name and Location.');
            return;
        }

        setIsSubmittingFarm(true);
        try {
            const isFree = newFarmForm.costType === 'free';
            const finalCost = isFree ? 0 : (Number(newFarmForm.costPerPerson) || 0);

            const farmData = {
                name: newFarmForm.farmName.trim(),
                location: newFarmForm.location.trim(),
                description: newFarmForm.description.trim(),
                pricePerPerson: finalCost,
                image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
                ownerId: user.uid,
                vendorName: userProfile?.displayName || user?.displayName || 'Vendor'
            };
            await api.saveFarm(farmData);
            setNewFarmForm({ farmName: '', location: '', description: '', costPerPerson: '', image: '' });
            setShowAddFarmForm(false);
            loadVendorFarms();
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
            await api.deleteFarm(farmId);
            setDeletingFarmId(null);
            alert('Farm deleted successfully.');
            loadVendorFarms();
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

            const farmData = {
                id: editingFarmId || `farm_${Date.now()}`,
                name: newFarmForm.farmName.trim(),
                farmName: newFarmForm.farmName.trim(),
                location: newFarmForm.location.trim(),
                description: newFarmForm.description.trim(),
                pricePerPerson: finalCost,
                costPerPerson: finalCost,
                costType: isFree ? 'free' : 'payable',
                image: newFarmForm.image.trim() || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
                ownerId: user.uid,
                vendorId: user.uid,
                vendorName: userProfile?.displayName || user?.displayName || 'Vendor',
                vendorEmail: user?.email || '',
                crops: parseList(newFarmForm.crops),
                fruits: parseList(newFarmForm.fruits),
                livestock: parseList(newFarmForm.livestock),
                kidsActivities: parseList(newFarmForm.kidsActivities),
                accommodations: parseAccommodations(newFarmForm.accommodations),
                accommodationPrice: newFarmForm.accommodationPrice ? parseFloat(newFarmForm.accommodationPrice) : 0,
                farmProducts: farmProductList && farmProductList.length > 0 ? farmProductList : (Array.isArray(newFarmForm.farmProducts) ? newFarmForm.farmProducts : parseProducts(newFarmForm.farmProducts)),
                activities: parseList(newFarmForm.amenities),
                cropPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('crop') || g.caption?.toLowerCase().includes('fruit') || g.caption?.toLowerCase().includes('harvest') || g.caption?.toLowerCase().includes('orchard')),
                livestockPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('cow') || g.caption?.toLowerCase().includes('goat') || g.caption?.toLowerCase().includes('animal') || g.caption?.toLowerCase().includes('livestock') || g.caption?.toLowerCase().includes('poultry')),
                kidsPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('kid') || g.caption?.toLowerCase().includes('play') || g.caption?.toLowerCase().includes('child') || g.caption?.toLowerCase().includes('swing') || g.caption?.toLowerCase().includes('toy') || g.caption?.toLowerCase().includes('petting')),
                accommodationPhotos: farmGalleryList.filter(g => g.caption?.toLowerCase().includes('stay') || g.caption?.toLowerCase().includes('hut') || g.caption?.toLowerCase().includes('tent') || g.caption?.toLowerCase().includes('room')),
                gallery: farmGalleryList,
                visitDays: newFarmForm.visitDays || 'Weekends Only',
                visitTimings: newFarmForm.visitTimings || 'Morning 9AM – 6PM'
            };

            await api.saveFarm(farmData);
            setSuccessModalData({
                title: editingFarmId ? 'Farm Updated Successfully! 🎉' : 'Farm Successfully Listed! 🎉',
                message: `Your farm listing "${farmData.name}" has been published!`
            });

            setEditingFarmId(null);
            setNewFarmForm({
                farmName: '', location: '', description: '', costPerPerson: '', image: '', costType: 'free',
                crops: '', fruits: '', livestock: '', kidsActivities: '', accommodations: '', amenities: '', farmProducts: '',
                visitDays: '', visitTimings: ''
            });
            setShowAddFarmForm(false);
            loadVendorFarms();
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
            alert('Booking accepted!');
        } catch (err) {
            console.error('Failed to accept booking:', err);
            alert('Error updating booking: ' + err.message);
        }
    };

    const handleDeclineBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to decline this booking?')) return;
        try {
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

    const fetchProfileOrders = async () => {
        if (!user) return;
        try {
            let data = [];
            if (userProfile?.role === 'customer') {
                data = await api.getUserOrders(user.uid);
            } else {
                data = await api.getAllOrders();
            }

            let ordersData = Array.isArray(data) ? data : [];

            if (userProfile?.role === 'vendor') {
                const shopNames = vendorShops.map(s => s.shopName);
                ordersData = ordersData.filter(order =>
                    order.items && order.items.some(item => shopNames.includes(item.vendor))
                ).map(order => ({
                    ...order,
                    items: order.items.filter(item => shopNames.includes(item.vendor))
                }));
            }

            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders from PostgreSQL:', error);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchProfileOrders();
        const interval = setInterval(() => {
            fetchProfileOrders();
        }, 10000);
        return () => clearInterval(interval);
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

        setSimulatingOrderId(orderId);

        const start = pickupAddr || 'Farm Harvest Hub, Anantapur';
        const end = deliveryAddr || 'Customer Location, Anantapur';

        let startCoords = await geocodeAddress(start);
        await new Promise((r) => setTimeout(r, 600));
        let endCoords = await geocodeAddress(end);

        if (!startCoords) startCoords = { lat: 14.6819, lon: 77.6006 };
        if (!endCoords) endCoords = { lat: 14.6989, lon: 77.6186 };

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
            try {
                await api.updateDeliveryLocation(orderId, point.lat, point.lng);
            } catch (err) {
                console.error("Failed to write simulation coordinates:", err);
            }

            currentStep++;
        }, 2000);

        setSimInterval(interval);
    };

    const handleAcceptJob = async (orderId) => {
        try {
            await api.updateOrderStatus(orderId, 'dispatched', {
                deliveryStatus: 'accepted',
                deliveryBoyId: user?.uid,
                deliveryBoyName: userProfile?.displayName || user?.displayName || 'Delivery Partner',
                deliveryBoyPhone: userProfile?.phone || user?.phone || '+91 98765 43210'
            });
            setIsTrackingActive(true);
            setActiveTab('delivery_active');
            fetchProfileOrders();
        } catch (error) {
            console.error('Failed to accept delivery order:', error);
            alert('Error: ' + error.message);
        }
    };

    const handleMarkAsDelivered = async (orderId) => {
        try {
            await api.updateOrderStatus(orderId, 'delivered', {
                deliveryStatus: 'delivered'
            });
            setIsTrackingActive(false);
            setActiveTab('delivery_completed');
            fetchProfileOrders();
        } catch (error) {
            console.error('Failed to mark order as delivered:', error);
            alert('Error: ' + error.message);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus, extraFields = {}) => {
        // Optimistically update orders in React state for zero UI latency
        setOrders(prev => prev.map(o => (String(o.id) === String(orderId) || String(o.orderId) === String(orderId)) ? { ...o, status: newStatus, ...extraFields } : o));
        try {
            await api.updateOrderStatus(orderId, newStatus, extraFields);
            fetchProfileOrders();
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert('Error updating order status: ' + error.message);
            fetchProfileOrders();
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

                                {/* My Details Tab for Customer / Vendor */}
                                <button
                                    onClick={() => handleTabChange('details')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'details'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <User size={18} />
                                    My Details
                                </button>

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
                                {/* Address Tab for Delivery Partner */}
                                <button
                                    onClick={() => handleTabChange('addresses')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'addresses'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <MapPin size={18} />
                                    My Addresses
                                </button>

                                {/* My Details Tab for Delivery Person */}
                                <button
                                    onClick={() => handleTabChange('details')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-sm text-left ${activeTab === 'details'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/15 animate-pulse-glow'
                                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                                        }`}
                                >
                                    <User size={18} />
                                    My Details
                                </button>

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
                    {/* My Personal Details Tab */}
                    <MyDetailsTab activeTab={activeTab} />

                    {/* Analytics & Revenue Tab */}
                    <VendorAnalyticsTab
                        activeTab={activeTab}
                        isVendor={isVendor}
                        vendorProducts={vendorProducts}
                        vendorShops={vendorShops}
                        vendorFarms={vendorFarms}
                        incomingFarmBookings={incomingFarmBookings}
                        orders={orders}
                    />

                    {/* Saved Addresses Tab */}
                    <SavedAddressesTab
                        activeTab={activeTab}
                        showAddressForm={showAddressForm}
                        setShowAddressForm={setShowAddressForm}
                        editingAddressId={editingAddressId}
                        setEditingAddressId={setEditingAddressId}
                        newAddress={newAddress}
                        setNewAddress={setNewAddress}
                        handleAddressInputChange={handleAddressInputChange}
                        handleAddAddress={handleAddAddress}
                        handleEditAddressClick={handleEditAddressClick}
                        handleDeleteAddress={handleDeleteAddress}
                        isSavingAddress={isSavingAddress}
                        isGeocodingAddress={detectingLocation}
                        handleDetectLocation={handleDetectLocation}
                        handleLocateTypedAddress={handleLocateTypedAddress}
                        profileMapContainerRef={profileMapContainerRef}
                        savedAddresses={savedAddresses}
                        userProfile={userProfile}
                        labelCls={labelCls}
                        inputCls={inputCls}
                    />

                    {/* Customer Orders Tab */}
                    <CustomerOrdersTab
                        activeTab={activeTab}
                        orders={orders}
                        user={user}
                        userProfile={userProfile}
                        isVendor={isVendor}
                        handleUpdateOrderStatus={handleUpdateOrderStatus}
                        navigate={navigate}
                    />

                    {/* Delivery Partner Orders Tab */}
                    <DeliveryOrdersTab
                        activeTab={activeTab}
                        orders={orders}
                        user={user}
                        handleAcceptJob={handleAcceptJob}
                        handleMarkAsDelivered={handleMarkAsDelivered}
                        isTrackingActive={isTrackingActive}
                        toggleGpsTracking={() => setIsTrackingActive(!isTrackingActive)}
                    />

                    {/* Vendor Farms & Agritourism Tab */}
                    <VendorFarmsTab
                        isVendor={isVendor}
                        activeTab={activeTab}
                        myFarms={vendorFarms}
                        bookingsList={incomingFarmBookings}
                        showAddFarmForm={showAddFarmForm}
                        setShowAddFarmForm={setShowAddFarmForm}
                        editingFarmId={editingFarmId}
                        setEditingFarmId={setEditingFarmId}
                        farmFormStep={farmFormStep}
                        setFarmFormStep={setFarmFormStep}
                        newFarmForm={newFarmForm}
                        setNewFarmForm={setNewFarmForm}
                        farmGalleryList={farmGalleryList}
                        setFarmGalleryList={setFarmGalleryList}
                        farmProductList={farmProductList}
                        setFarmProductList={setFarmProductList}
                        stayList={stayList}
                        setStayList={setStayList}
                        handleCancelFarmForm={handleCancelFarmForm}
                        handleAddFarm={handleAddFarm}
                        handleSaveFarmForm={handleSaveFarmForm}
                        handleDeleteFarm={handleDeleteFarm}
                        handleEditFarmClick={handleEditFarmClick}
                        handleAcceptBooking={handleAcceptBooking}
                        handleDeclineBooking={handleDeclineBooking}
                        handleDetectFarmLocation={handleDetectFarmLocation}
                        handleLocateFarmAddress={handleLocateFarmAddress}
                        isDetectingFarmLocation={detectingFarmLocation}
                        farmMapContainerRef={farmMapContainerRef}
                        openImageModal={openImageModal}
                        navigate={navigate}
                        setShowAddStayModal={setShowAddStayModal}
                        setShowAddProductModal={setShowAddFarmProductModal}
                        setShowAddFarmProductModal={setShowAddFarmProductModal}
                        setShowAddGalleryModal={setShowAddGalleryModal}
                        newGalleryForm={newGalleryForm}
                        setNewGalleryForm={setNewGalleryForm}
                        newFarmProductForm={newFarmProductForm}
                        setNewFarmProductForm={setNewFarmProductForm}
                        newStayForm={newStayForm}
                        setNewStayForm={setNewStayForm}
                        handleOpenAddStayModal={handleOpenAddStayModal}
                        handleEditStay={handleEditStay}
                        handleEditModalProduct={handleEditModalProduct}
                        setPhotoToEdit={setPhotoToEdit}
                        setShowEditPhotoModal={setShowEditPhotoModal}
                        handleRemoveStay={handleRemoveStay}
                        handleRemoveModalProduct={handleRemoveModalProduct}
                        handleRemoveGalleryPhoto={handleRemoveGalleryPhoto}
                        handleAddCropChip={handleAddCropChip}
                        handleRemoveCropChip={handleRemoveCropChip}
                        handleAddFruitChip={handleAddFruitChip}
                        handleRemoveFruitChip={handleRemoveFruitChip}
                        handleAddLivestockChip={handleAddLivestockChip}
                        handleRemoveLivestockChip={handleRemoveLivestockChip}
                        handleAddKidsChip={handleAddKidsChip}
                        handleRemoveKidsChip={handleRemoveKidsChip}
                        INITIAL_CROPS={INITIAL_CROPS}
                        EXTRA_CROPS={EXTRA_CROPS}
                        INITIAL_FRUITS={INITIAL_FRUITS}
                        EXTRA_FRUITS={EXTRA_FRUITS}
                        INITIAL_LIVESTOCK={INITIAL_LIVESTOCK}
                        EXTRA_LIVESTOCK={EXTRA_LIVESTOCK}
                        INITIAL_KIDS_ACTIVITIES={INITIAL_KIDS_ACTIVITIES}
                        EXTRA_KIDS_ACTIVITIES={EXTRA_KIDS_ACTIVITIES}
                        labelCls={labelCls}
                        inputCls={inputCls}
                    />

                    {/* Vendor Shops & Setup Tab */}
                    <VendorShopsTab
                        isVendor={isVendor}
                        activeTab={activeTab}
                        vendorShops={vendorShops}
                        showAddShopForm={showAddShopForm}
                        setShowAddShopForm={setShowAddShopForm}
                        shopSetup={shopSetup}
                        setShopSetup={setShopSetup}
                        newShop={newShop}
                        setNewShop={setNewShop}
                        isSubmittingShop={isSubmittingShop}
                        handleShopSetup={handleShopSetup}
                        handleAddAdditionalShop={handleAddAdditionalShop}
                        handleEditShopClick={handleEditShopClick}
                        handleDeleteShop={handleDeleteShop}
                        editingShopIndex={editingShopIndex}
                        setEditingShopIndex={setEditingShopIndex}
                        editShopForm={editShopForm}
                        setEditShopForm={setEditShopForm}
                        handleUpdateShop={handleUpdateShop}
                        isUpdatingShop={isSubmittingShop}
                        deletingShopIndex={deletingShopIndex}
                        setDeletingShopIndex={setDeletingShopIndex}
                        viewingShopIndex={viewingShopIndex}
                        setViewingShopIndex={setViewingShopIndex}
                        selectedShopFilter={selectedShopFilter}
                        setSelectedShopFilter={setSelectedShopFilter}
                        vendorProducts={vendorProducts}
                        handleOpenAddProductForShop={handleOpenAddProductForShop}
                        handleEditProductClick={handleEditProductClick}
                        handleDeleteProduct={handleDeleteProduct}
                        handleGetCurrentLocation={handleGetCurrentLocation}
                        detectingShopLocation={false}
                        isAddingShop={isSubmittingShop}
                        EMPTY_SOCIAL_LINKS={EMPTY_SOCIAL_LINKS}
                        labelCls={labelCls}
                        inputCls={inputCls}
                    />

                    {/* Vendor Products Tab */}
                    <VendorProductsTab
                        isVendor={isVendor}
                        activeTab={activeTab}
                        vendorProducts={vendorProducts}
                        vendorShops={vendorShops}
                        selectedShopFilter={selectedShopFilter}
                        setSelectedShopFilter={setSelectedShopFilter}
                        setShowAddForm={setShowAddForm}
                        handleOpenAddProductForShop={handleOpenAddProductForShop}
                        handleEditProductClick={handleEditProductClick}
                        handleDeleteProduct={handleDeleteProduct}
                        updateProduct={updateProduct}
                        navigate={navigate}
                    />

                </div>
            </div>

            {/* Extracted Interactive Modals */}
            <AddShopModal
                showAddShopForm={showAddShopForm}
                setShowAddShopForm={setShowAddShopForm}
                newShop={newShop}
                setNewShop={setNewShop}
                handleAddAdditionalShop={handleAddAdditionalShop}
                handleGetCurrentLocation={handleGetCurrentLocation}
                detectingShopLocation={false}
                isAddingShop={isSubmittingShop}
                labelCls={labelCls}
                inputCls={inputCls}
            />

            <AddProductModal
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                newProduct={newProduct}
                setNewProduct={setNewProduct}
                handleAddProduct={handleAddProduct}
                isAddingProduct={false}
                vendorShops={vendorShops}
                categories={categories}
                STANDARD_UNITS={STANDARD_UNITS}
                handleInputChange={handleInputChange}
                labelCls={labelCls}
                inputCls={inputCls}
            />

            <EditProductModal
                editingProductId={editingProductId}
                setEditingProductId={setEditingProductId}
                editProductForm={editProductForm}
                setEditProductForm={setEditProductForm}
                handleUpdateProduct={handleUpdateProduct}
                categories={categories}
                STANDARD_UNITS={STANDARD_UNITS}
                labelCls={labelCls}
                inputCls={inputCls}
            />

            <ProductAddedModal
                successModalData={successModalData}
                setSuccessModalData={setSuccessModalData}
            />

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
                            <div>
                                <label className={labelCls}>Image URL or File Upload <span className="text-emerald-600 font-bold">*</span></label>
                                <ImageUploadField
                                    value={newGalleryForm.url}
                                    onChange={(val) => setNewGalleryForm({ ...newGalleryForm, url: val })}
                                    inputClassName={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    accentColor="emerald"
                                    id="gallery-photo-input"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Caption / Tag</label>
                                <input
                                    type="text"
                                    value={newGalleryForm.caption}
                                    onChange={(e) => setNewGalleryForm({ ...newGalleryForm, caption: e.target.value })}
                                    className={inputCls.replace('pl-10', 'px-4')}
                                    placeholder="E.g. Strawberry Field, Farm Stay Hut, Sunset"
                                />
                            </div>

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
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold font-headings shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                                >
                                    + Add Photo
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

            {/* Add Farm Product Modal */}
            <AddFarmProductModal
                showAddFarmProductModal={showAddFarmProductModal}
                setShowAddFarmProductModal={setShowAddFarmProductModal}
                editingModalProductIndex={editingModalProductIndex}
                setEditingModalProductIndex={setEditingModalProductIndex}
                newFarmProductForm={newFarmProductForm}
                setNewFarmProductForm={setNewFarmProductForm}
                handleSaveModalProduct={handleSaveModalProduct}
                isSavingModalProduct={isSavingModalProduct}
                SUB_CATEGORIES_MAP={SUB_CATEGORIES_MAP}
                labelCls={labelCls}
                inputCls={inputCls}
            />

            {/* Signout Confirmation Popup Modal */}
            <SignoutConfirmModal
                showSignoutConfirm={showSignoutConfirm}
                setShowSignoutConfirm={setShowSignoutConfirm}
                handleConfirmLogout={handleConfirmLogout}
            />

            {/* Edit Photo Modal */}
            <EditPhotoModal
                showEditPhotoModal={showEditPhotoModal}
                setShowEditPhotoModal={setShowEditPhotoModal}
                photoToEdit={photoToEdit}
                handleSaveEditedPhoto={handleSaveEditedGalleryPhoto}
            />
        </div>
    );
}
