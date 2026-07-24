import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Users, Save, Plus, Trash2, FolderPlus,
  ShieldAlert, CheckCircle, RefreshCw, Image as ImageIcon,
  Tag, ShieldCheck, Sparkles, Sprout, MessageSquare, Heart, Truck, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { ref, onValue, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';

export default function Admin() {
  const { user, userProfile } = useAuth();
  const { products: allProducts = [], categories = [], addCategory, deleteCategory } = useProducts();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Tab 3: Category Management State
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Tab 1: Home Content State
  const [homeContent, setHomeContent] = useState({
    // Hero
    heroHeadline: "Fresh fruits & Vegetables Directly From Farms",
    heroDescription: "Connect directly with local organic farmers. Freshly harvested vegetables, fruits, and pure dairy products delivered to your door in hours.",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",

    // Special Offers & Banners
    promo1Title: "Fresh Fruit Harvest Box",
    promo1Desc: "Get a handpicked assortment of organic seasonal fruits including strawberries, apples, and oranges.",
    promo1Code: "FRUIT20",
    promo2Title: "Bulk Veggies Discount",
    promo2Desc: "Stock up your kitchen with potatoes, onions, tomatoes, and greens. Harvested fresh and shipped in bulk.",
    promo2Code: "BULK15",

    // Why Choose FresVeg?
    whyTitle: "Why Choose FresVeg?",
    whySubtitle: "We bridge the gap between farmers and consumers, ensuring you get the freshest produce while supporting local vendors.",
    why1Title: "Premium Fresh",
    why1Desc: "Sourced directly from local farmers ensuring maximum freshness, nutritional value, and unbelievable taste.",
    why2Title: "Fast Delivery",
    why2Desc: "Lightning fast delivery straight to your doorstep within hours of harvesting from the nearest farms.",
    why3Title: "Quality Assured",
    why3Desc: "Rigorous quality checks at every step to ensure you get only the finest and safest selection of produce.",

    // Farm-to-Table Process
    processTitle: "Our Farm-to-Table Process",
    processSubtitle: "We maintain a clean, temperature-controlled, and highly efficient network to ship organic products from local soil directly to your shelf.",
    process1Title: "1. Fresh Harvest",
    process1Desc: "Farmers pick organic produce only after you place your order to ensure peak flavor.",
    process2Title: "2. Eco Packaging",
    process2Desc: "Items are sorted and wrapped in plastic-free biodegradable packets to protect the planet.",
    process3Title: "3. Swift Transit",
    process3Desc: "Delivery partners collect your box immediately and run optimized routes using maps.",
    process4Title: "4. Doorstep Joy",
    process4Desc: "Get contact-free drop off in under 4 hours, and scan farm codes for origin tracing.",

    // What Our Customers Say
    testimonialsTitle: "What Our Customers Say",
    testimonialsSubtitle: "Read verified feedback from home cooks and families who enjoy fresh farm deliveries weekly.",
    test1Quote: "The strawberries are exceptionally sweet and fresh, nothing like the supermarket ones. Plus, knowing it supports local farmers directly makes every order feel great.",
    test1Name: "Sarah J.",
    test1Role: "Home Cook",
    test2Quote: "The bulk veggie box is a life saver for my meal prep. Everything stays crisp for over a week, and delivery is consistently quick. Highly recommended!",
    test2Name: "David K.",
    test2Role: "Fitness Enthusiast",
    test3Quote: "We booked a farm tour weekend slots via 'Visit Farms' link, and our kids absolutely loved picking fruits and seeing cows. A perfect weekend refreshment setup!",
    test3Name: "Emma L.",
    test3Role: "Parent",

    // About FresVeg
    aboutHeadline: "About FresVeg",
    aboutText1: "We are committed to providing the freshest, highest quality produce directly from our farms to your table. Our mission is to support local farmers while delivering exceptional products that nourish your family.",
    aboutText2: "Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive only the best nature has to offer.",
    aboutImage: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80"
  });

  // Tab 2: Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load home Content
  useEffect(() => {
    const homeContentRef = ref(realtimeDb, 'homeContent');
    const unsubscribe = onValue(homeContentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setHomeContent(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Load registered users list
  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      const usersRef = ref(realtimeDb, 'users');
      const unsubscribe = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data).map(key => ({
            ...data[key],
            id: key
          }));
          setUsersList(list);
        } else {
          setUsersList([]);
        }
        setLoadingUsers(false);
      }, (error) => {
        console.error('Error fetching users from Firebase:', error);
        showToast('Permission Denied: Unable to fetch registered users.', 'error');
        setUsersList([]);
        setLoadingUsers(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const showToast = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Home content save
  const handleSaveHomeContent = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await set(ref(realtimeDb, 'homeContent'), homeContent);
      showToast('All Home Page content sections updated & published successfully!');
    } catch (err) {
      console.error('Failed to update Home page content:', err);
      showToast('Failed to update Home page content.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // User role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await update(ref(realtimeDb, `users/${userId}`), { role: newRole });
      showToast(`User role successfully changed to ${newRole}!`);
    } catch (err) {
      showToast('Failed to modify user role.', 'error');
    }
  };

  // Category Management Handlers
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    setIsAddingCategory(true);
    try {
      await addCategory(newCategoryInput.trim());
      showToast(`Category "${newCategoryInput.trim()}" added successfully!`);
      setNewCategoryInput('');
    } catch (err) {
      showToast(err.message || 'Failed to add category.', 'error');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategoryConfirm = async (catName) => {
    try {
      await deleteCategory(catName);
      showToast(`Category "${catName}" deleted successfully!`);
      setCategoryToDelete(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete category.', 'error');
    }
  };

  // Access check: only allow 'admin' role
  const isAdmin = userProfile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-red-100 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              This dashboard is restricted to administrator accounts. Please register or sign in using an Admin role.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-brand/10 hover:shadow-lg text-xs uppercase tracking-wider"
            >
              Sign In / Sign Up
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-wider"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 relative pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 text-left">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Admin Portal <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage all text & imagery for Home page sections and user permissions.</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-1 flex-wrap">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'home' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Layout size={15} /> Home Content Editor
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Tag size={15} /> Category Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Users size={15} /> User Roles
            </button>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="fixed bottom-10 right-10 z-[100] bg-gray-900 text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-2 text-xs font-bold border border-gray-800 animate-slide-in">
            <CheckCircle className="text-brand" size={16} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="fixed bottom-10 right-10 z-[100] bg-red-650 text-white rounded-full px-5 py-3 shadow-2xl flex items-center gap-2 text-xs font-bold border border-red-500 animate-slide-in">
            <ShieldAlert className="text-red-400" size={16} /> {errorMsg}
          </div>
        )}

        {/* Tab Content Panels */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white shadow-xl shadow-slate-200/40 text-left">

          {/* TAB 1: Home Page Content Editor */}
          {activeTab === 'home' && (
            <form onSubmit={handleSaveHomeContent} className="space-y-10 max-w-4xl">

              {/* Top Banner Save Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-2xl gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-600" /> Home Page Content Management
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">Edit text content across all 6 sections on the home page below.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-brand/20 active:scale-95 flex items-center gap-2 shrink-0"
                >
                  <Save size={15} /> {isSaving ? 'Saving...' : 'Save All Home Changes'}
                </button>
              </div>

              {/* SECTION 1: Hero Banner */}
              <div className="space-y-4 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-brand" /> 1. Hero Landing Section
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hero Headline Title</label>
                  <input
                    type="text"
                    required
                    value={homeContent.heroHeadline}
                    onChange={(e) => setHomeContent({ ...homeContent, heroHeadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hero Description Paragraph</label>
                  <textarea
                    rows="3"
                    required
                    value={homeContent.heroDescription}
                    onChange={(e) => setHomeContent({ ...homeContent, heroDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Hero Headline Image URL</label>
                  <input
                    type="url"
                    required
                    value={homeContent.heroImage}
                    onChange={(e) => setHomeContent({ ...homeContent, heroImage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-2xs"
                  />
                </div>
              </div>

              {/* SECTION 2: Special Offers & Banners */}
              <div className="space-y-6 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Tag size={18} className="text-brand" /> 2. Special Offers & Banners
                </h3>

                <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  {/* Promo Banner 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1.5 border-slate-200/60">Special Offer Banner A</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Banner Title</label>
                      <input
                        type="text"
                        value={homeContent.promo1Title}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Title: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Promo Description</label>
                      <textarea
                        rows="2"
                        value={homeContent.promo1Desc}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={homeContent.promo1Code}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Code: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand uppercase font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Promo Banner 2 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1.5 border-slate-200/60">Special Offer Banner B</h4>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Banner Title</label>
                      <input
                        type="text"
                        value={homeContent.promo2Title}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Title: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Promo Description</label>
                      <textarea
                        rows="2"
                        value={homeContent.promo2Desc}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={homeContent.promo2Code}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Code: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand uppercase font-bold text-amber-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Why Choose FresVeg? */}
              <div className="space-y-6 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand" /> 3. Why Choose FresVeg?
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Main Title</label>
                    <input
                      type="text"
                      value={homeContent.whyTitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, whyTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Subtitle Paragraph</label>
                    <input
                      type="text"
                      value={homeContent.whySubtitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, whySubtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  {/* Feature 1 */}
                  <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="text-[10px] font-black text-brand uppercase tracking-wider">Feature 1</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={homeContent.why1Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why1Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description</label>
                      <textarea
                        rows="2"
                        value={homeContent.why1Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why1Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="text-[10px] font-black text-brand uppercase tracking-wider">Feature 2</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={homeContent.why2Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why2Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description</label>
                      <textarea
                        rows="2"
                        value={homeContent.why2Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why2Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 space-y-2">
                    <span className="text-[10px] font-black text-brand uppercase tracking-wider">Feature 3</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        value={homeContent.why3Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why3Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Description</label>
                      <textarea
                        rows="2"
                        value={homeContent.why3Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, why3Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Our Farm-to-Table Process */}
              <div className="space-y-6 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Sprout size={18} className="text-brand" /> 4. Our Farm-to-Table Process
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Process Main Title</label>
                    <input
                      type="text"
                      value={homeContent.processTitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, processTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Process Subtitle Description</label>
                    <input
                      type="text"
                      value={homeContent.processSubtitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, processSubtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {/* Step 1 */}
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Step 1</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 1 Title</label>
                      <input
                        type="text"
                        value={homeContent.process1Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process1Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 1 Detail</label>
                      <textarea
                        rows="2"
                        value={homeContent.process1Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process1Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Step 2</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 2 Title</label>
                      <input
                        type="text"
                        value={homeContent.process2Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process2Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 2 Detail</label>
                      <textarea
                        rows="2"
                        value={homeContent.process2Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process2Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Step 3</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 3 Title</label>
                      <input
                        type="text"
                        value={homeContent.process3Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process3Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 3 Detail</label>
                      <textarea
                        rows="2"
                        value={homeContent.process3Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process3Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Step 4</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 4 Title</label>
                      <input
                        type="text"
                        value={homeContent.process4Title || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process4Title: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Step 4 Detail</label>
                      <textarea
                        rows="2"
                        value={homeContent.process4Desc || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, process4Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: What Our Customers Say (Testimonials) */}
              <div className="space-y-6 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={18} className="text-brand" /> 5. What Our Customers Say (Testimonials)
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Testimonials Section Title</label>
                    <input
                      type="text"
                      value={homeContent.testimonialsTitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, testimonialsTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Testimonials Subtitle</label>
                    <input
                      type="text"
                      value={homeContent.testimonialsSubtitle || ''}
                      onChange={(e) => setHomeContent({ ...homeContent, testimonialsSubtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-2">
                  {/* Testimonial 1 */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 1</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test1Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test1Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test1Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test1Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test1Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test1Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 2 */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 2</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test2Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test2Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test2Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test2Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test2Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test2Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 3 */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 3</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test3Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test3Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test3Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test3Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test3Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test3Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6: About Section */}
              <div className="space-y-4 pb-4">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand" /> 6. About FresVeg Section
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">About Headline Title</label>
                  <input
                    type="text"
                    required
                    value={homeContent.aboutHeadline}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutHeadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">About Paragraph 1</label>
                  <textarea
                    rows="3"
                    required
                    value={homeContent.aboutText1}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutText1: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">About Paragraph 2</label>
                  <textarea
                    rows="3"
                    required
                    value={homeContent.aboutText2}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutText2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">About Section Feature Image URL</label>
                  <input
                    type="url"
                    required
                    value={homeContent.aboutImage}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutImage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand focus:bg-white outline-none text-2xs"
                  />
                </div>
              </div>

              {/* Submit Save Floating Bar */}
              <div className="sticky bottom-6 z-40 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-gray-800">
                <span className="text-xs font-bold text-gray-300 pl-2">
                  Done making updates? Save to publish changes live.
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand/30 active:scale-95 flex items-center gap-2"
                >
                  <Save size={16} /> {isSaving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: User Roles Panel */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">User Account Roles</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Override account privileges for customers, vendors, and admin managers.</p>
                </div>
                <div className="text-xs font-bold text-gray-400">
                  Total Users: {usersList.length}
                </div>
              </div>

              {loadingUsers ? (
                <div className="py-16 text-center">
                  <RefreshCw className="animate-spin text-brand mx-auto mb-3" size={32} />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading user database...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No registered users found in database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Current Role</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((userItem) => (
                        <tr key={userItem.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            {userItem.displayName || 'User'}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {userItem.email || 'No email provided'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${userItem.role === 'admin' ? 'bg-red-50 text-red-650 border border-red-100' :
                                userItem.role === 'vendor' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                              {userItem.role || 'customer'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={userItem.role || 'customer'}
                              onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                              className="bg-white border border-slate-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-2xs focus:border-brand outline-none cursor-pointer"
                            >
                              <option value="customer">Customer</option>
                              <option value="vendor">Vendor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Product Category Management Panel */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              {/* Category Management Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Tag size={20} className="text-brand" /> Product Categories Management
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add new product categories or remove unused ones. Changes sync live across the Marketplace and Vendor shops.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <Sparkles size={14} className="text-brand" />
                  Total Categories: {categories.length}
                </div>
              </div>

              {/* Add New Category Form */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <FolderPlus size={16} className="text-emerald-600" /> Add New Category
                </h4>
                <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      required
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="Enter new category name (e.g. Exotic Herbs, Dry Fruits...)"
                      className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-2xl focus:border-brand outline-none text-xs font-semibold shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingCategory || !newCategoryInput.trim()}
                    className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-2xl font-extrabold text-xs transition-all shadow-md shadow-brand/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                  >
                    <Plus size={16} /> {isAddingCategory ? 'Adding...' : 'Add Category'}
                  </button>
                </form>
              </div>

              {/* List of Existing Categories */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 pl-1">
                  Active Categories ({categories.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map((cat, idx) => {
                    const productCount = allProducts.filter(p => p.category === cat).length;
                    return (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-md transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="font-extrabold text-gray-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                            {cat}
                          </h5>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                            {productCount} product{productCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all shrink-0 active:scale-90"
                          title={`Delete ${cat} category`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Delete Category Confirmation Modal */}
          {categoryToDelete && (
            <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-scale-up text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-gray-900">Delete Category?</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Are you sure you want to delete <span className="font-bold text-gray-900">"{categoryToDelete}"</span>? Products currently using this category will remain, but vendors won't be able to select it for new products.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryConfirm(categoryToDelete)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-red-500/20 active:scale-95"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
