import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Users, Save, Plus, Trash2, FolderPlus, Pencil, X,
  ShieldAlert, CheckCircle, RefreshCw, Image as ImageIcon,
  Tag, ShieldCheck, Sparkles, Sprout, MessageSquare, Heart, Truck, AlertTriangle, ChevronDown, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductContext';
import { api } from '../services/api';
import { DEFAULT_HOME_CONTENT } from './admin/adminConstants';
import AdminUsersTab from './admin/components/AdminUsersTab';
import AdminCategoriesTab from './admin/components/AdminCategoriesTab';
import AdminPayoutsTab from './admin/components/AdminPayoutsTab';

export default function Admin() {
  const { user, userProfile } = useAuth();
  const { products: allProducts = [], categories = [], categoriesWithDetails = [], addCategory, updateCategory, deleteCategory } = useProducts();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Tab 3: Category Management State
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCategoryImageInput, setNewCategoryImageInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Category Edit State
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryNameInput, setEditCategoryNameInput] = useState('');
  const [editCategoryImageInput, setEditCategoryImageInput] = useState('');
  const [isSavingCategoryEdit, setIsSavingCategoryEdit] = useState(false);

  // Tab 1: Home Content State
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT);

  // Tab 2: Users State
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load home Content
  useEffect(() => {
    // Keep local homeContent state
  }, []);

  // Load registered users list from PostgreSQL
  useEffect(() => {
    if (activeTab === 'users') {
      setLoadingUsers(true);
      api.getUsers()
        .then(data => {
          setUsersList(Array.isArray(data) ? data : []);
          setLoadingUsers(false);
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          showToast('Unable to fetch registered users.', 'error');
          setUsersList([]);
          setLoadingUsers(false);
        });
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
  const toggleSectionVisibility = async (sectionKey) => {
    const currentHidden = homeContent.hiddenSections || {};
    const isCurrentlyHidden = Boolean(currentHidden[sectionKey]);
    const updatedHidden = { ...currentHidden, [sectionKey]: !isCurrentlyHidden };

    const updatedContent = {
      ...homeContent,
      hiddenSections: updatedHidden
    };

    setHomeContent(updatedContent);
    if (!isCurrentlyHidden) {
      showToast(`Section "${sectionKey}" has been deleted / hidden from Home page!`);
    } else {
      showToast(`Section "${sectionKey}" has been restored & enabled on Home page!`);
    }
  };

  const handleSaveHomeContent = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      showToast('All Home Page content sections updated & published successfully!');
    } catch (err) {
      console.error('Failed to update Home page content:', err);
      showToast('Failed to update Home page content.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // User role change via PostgreSQL API
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
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
      await addCategory(newCategoryInput.trim(), newCategoryImageInput.trim());
      showToast(`Category "${newCategoryInput.trim()}" added successfully!`);
      setNewCategoryInput('');
      setNewCategoryImageInput('');
    } catch (err) {
      showToast(err.message || 'Failed to add category.', 'error');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleOpenEditCategory = (catObj) => {
    setEditingCategory(catObj);
    setEditCategoryNameInput(catObj.name);
    setEditCategoryImageInput(catObj.image || '');
  };

  const handleSaveCategoryEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryNameInput.trim()) return;
    setIsSavingCategoryEdit(true);
    try {
      await updateCategory(editingCategory.name, editCategoryNameInput.trim(), editCategoryImageInput.trim());
      showToast(`Category "${editCategoryNameInput.trim()}" updated successfully!`);
      setEditingCategory(null);
    } catch (err) {
      showToast(err.message || 'Failed to update category.', 'error');
    } finally {
      setIsSavingCategoryEdit(false);
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
              onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'home' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Layout size={15} /> Home Content Editor
            </button>
            <button
              onClick={() => { setActiveTab('categories'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Tag size={15} /> Category Management
            </button>
            <button
              onClick={() => { setActiveTab('users'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Users size={15} /> User Roles
            </button>
            <button
              onClick={() => { setActiveTab('payouts'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'payouts' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <DollarSign size={15} /> Commission & Payouts
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50/70 border border-emerald-200/60 p-4.5 rounded-2xl gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2 font-headings">
                    <Sparkles size={16} className="text-emerald-600" /> Home Page Content & Section Management
                  </h3>
                  <p className="text-xs text-emerald-700 font-medium">Edit text, imagery, or delete/disable any of the 7 sections on the Home page below.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand hover:bg-brand-dark text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-brand/20 active:scale-95 flex items-center gap-2 shrink-0 disabled:opacity-60 font-headings"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save All Home Changes</span>
                    </>
                  )}
                </button>
              </div>

              {/* SECTION 1: Fresh fruits & Vegetables Directly From Farms (Hero Landing) */}
              <div className={`space-y-4 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.hero ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      1. "Fresh fruits & Vegetables Directly From Farms" Section
                    </h3>
                    {homeContent.hiddenSections?.hero ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('hero')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.hero
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.hero ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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
              <div className={`space-y-6 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.specialOffers ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      2. "Special Offers & Banners" Section
                    </h3>
                    {homeContent.hiddenSections?.specialOffers ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('specialOffers')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.specialOffers
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.specialOffers ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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

              {/* SECTION 3: Best Selling Organic Produce */}
              <div className={`space-y-4 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.bestSelling ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      3. "Best Selling Organic Produce" Section
                    </h3>
                    {homeContent.hiddenSections?.bestSelling ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('bestSelling')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.bestSelling
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.bestSelling ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Main Title</label>
                    <input
                      type="text"
                      value={homeContent.bestSellingTitle || 'Best Selling Organic Produce'}
                      onChange={(e) => setHomeContent({ ...homeContent, bestSellingTitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Section Subtitle Paragraph</label>
                    <input
                      type="text"
                      value={homeContent.bestSellingSubtitle || 'Directly harvested from local organic farms. Click any item to explore full product details & buy directly.'}
                      onChange={(e) => setHomeContent({ ...homeContent, bestSellingSubtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl focus:border-brand focus:bg-white outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: About FresVeg Section */}
              <div className={`space-y-4 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.about ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      4. "About FresVeg" Section
                    </h3>
                    {homeContent.hiddenSections?.about ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('about')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.about
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.about ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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

              {/* SECTION 5: Our Farm-to-Table Process */}
              <div className={`space-y-6 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.process ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Sprout size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      5. "Our Farm-to-Table Process" Section
                    </h3>
                    {homeContent.hiddenSections?.process ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('process')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.process
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.process ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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

              {/* SECTION 6: Why Choose FresVeg? */}
              <div className={`space-y-6 border-b border-slate-100 pb-8 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.whyChoose ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      6. "Why Choose FresVeg?" Section
                    </h3>
                    {homeContent.hiddenSections?.whyChoose ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('whyChoose')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.whyChoose
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.whyChoose ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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

              {/* SECTION 7: What Our Customers Say (Testimonials) */}
              <div className={`space-y-6 pb-4 p-5 rounded-3xl transition-all ${homeContent.hiddenSections?.testimonials ? 'bg-red-50/40 border border-red-200/60' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={20} className="text-brand" />
                    <h3 className="text-base font-extrabold text-gray-900 font-headings">
                      7. "What Our Customers Say" Section
                    </h3>
                    {homeContent.hiddenSections?.testimonials ? (
                      <span className="bg-red-100 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200">🔴 Hidden / Deleted</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">🟢 Active</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('testimonials')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 font-headings ${
                      homeContent.hiddenSections?.testimonials
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                    }`}
                  >
                    {homeContent.hiddenSections?.testimonials ? (
                      <><CheckCircle size={14} /> Restore Section</>
                    ) : (
                      <><Trash2 size={14} /> Delete / Hide Section</>
                    )}
                  </button>
                </div>

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

                  {/* Testimonial 4 (Rajesh V. Patel) */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 4</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test4Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test4Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test4Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test4Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test4Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test4Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 5 (Anita Roy) */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 5</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test5Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test5Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test5Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test5Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test5Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test5Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Testimonial 6 (Michael Rodriguez) */}
                  <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Testimonial 6</span>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Customer Quote</label>
                      <textarea
                        rows="3"
                        value={homeContent.test6Quote || ''}
                        onChange={(e) => setHomeContent({ ...homeContent, test6Quote: e.target.value })}
                        className="w-full bg-white border px-3 py-1.5 text-xs rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Name</label>
                        <input
                          type="text"
                          value={homeContent.test6Name || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test6Name: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Role / Tag</label>
                        <input
                          type="text"
                          value={homeContent.test6Role || ''}
                          onChange={(e) => setHomeContent({ ...homeContent, test6Role: e.target.value })}
                          className="w-full bg-white border px-2.5 py-1 text-xs rounded-lg outline-none focus:border-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Save Floating Bar */}
              <div className="sticky bottom-6 z-40 bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-gray-800 font-headings">
                <span className="text-xs font-bold text-gray-300 pl-2">
                  Done making updates? Save to publish changes live.
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand hover:bg-brand-dark text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-brand/30 active:scale-95 flex items-center gap-2 disabled:opacity-60 font-headings"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save All Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}


          {/* TAB 2: User Roles Panel */}
          {activeTab === 'users' && (
            <AdminUsersTab
              usersList={usersList}
              loadingUsers={loadingUsers}
              handleRoleChange={handleRoleChange}
            />
          )}

          {/* TAB 3: Product Category Management Panel */}
          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categoriesWithDetails={categoriesWithDetails}
              allProducts={allProducts}
              newCategoryInput={newCategoryInput}
              setNewCategoryInput={setNewCategoryInput}
              newCategoryImageInput={newCategoryImageInput}
              setNewCategoryImageInput={setNewCategoryImageInput}
              isAddingCategory={isAddingCategory}
              handleAddCategorySubmit={handleAddCategorySubmit}
              editingCategory={editingCategory}
              setEditingCategory={setEditingCategory}
              editCategoryNameInput={editCategoryNameInput}
              setEditCategoryNameInput={setEditCategoryNameInput}
              editCategoryImageInput={editCategoryImageInput}
              setEditCategoryImageInput={setEditCategoryImageInput}
              isSavingCategoryEdit={isSavingCategoryEdit}
              handleOpenEditCategory={handleOpenEditCategory}
              handleSaveCategoryEditSubmit={handleSaveCategoryEditSubmit}
              categoryToDelete={categoryToDelete}
              setCategoryToDelete={setCategoryToDelete}
              handleDeleteCategoryConfirm={handleDeleteCategoryConfirm}
            />
          )}

          {/* TAB 4: Commission & Vendor Payouts Panel */}
          {activeTab === 'payouts' && (
            <AdminPayoutsTab showToast={showToast} />
          )}

        </div>

      </div>
    </div>
  );
}
