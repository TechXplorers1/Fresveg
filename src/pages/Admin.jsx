import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Users, Save, 
  ShieldAlert, CheckCircle, RefreshCw, Image as ImageIcon,
  Tag, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase';

export default function Admin() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab 2: Home Content State
  const [homeContent, setHomeContent] = useState({
    heroHeadline: "Fresh Organic Produce Directly From Farms",
    heroDescription: "Connect directly with local organic farmers. Freshly harvested vegetables, fruits, and pure dairy products delivered to your door in hours.",
    heroImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
    aboutHeadline: "About FresVeg",
    aboutText1: "We are committed to providing the freshest, highest quality produce directly from our farms to your table. Our mission is to support local farmers while delivering exceptional products that nourish your family.",
    aboutText2: "Every product is carefully selected, harvested at peak ripeness, and delivered with care to ensure you receive only the best nature has to offer.",
    aboutImage: "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&q=80",
    promo1Title: "Fresh Fruit Harvest Box",
    promo1Desc: "Get a handpicked assortment of organic seasonal fruits including strawberries, apples, and oranges.",
    promo1Code: "FRUIT20",
    promo2Title: "Bulk Veggies Discount",
    promo2Desc: "Stock up your kitchen with potatoes, onions, tomatoes, and greens. Harvested fresh and shipped in bulk.",
    promo2Code: "BULK15"
  });

  // Tab 3: Users State
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
    e.preventDefault();
    try {
      await set(ref(realtimeDb, 'homeContent'), homeContent);
      showToast('Home page layouts & texts updated successfully!');
    } catch (err) {
      showToast('Failed to update Home page content.', 'error');
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
    <div className="min-h-screen bg-slate-50/50 py-10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 text-left">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Admin Portal <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage catalogue products, configure marketing banners, and override roles.</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'home' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layout size={15} /> Home Content
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'users' ? 'bg-white text-brand shadow-md' : 'text-gray-500 hover:text-gray-800'
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
          


          {/* TAB 2: Home Page Content Editor */}
          {activeTab === 'home' && (
            <form onSubmit={handleSaveHomeContent} className="space-y-8 max-w-3xl">
              
              {/* Section: Hero Banner */}
              <div className="space-y-4 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-brand" /> Hero Landing Section
                </h3>
                
                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">Hero Headline Title</label>
                  <input 
                    type="text" 
                    required
                    value={homeContent.heroHeadline}
                    onChange={(e) => setHomeContent({ ...homeContent, heroHeadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">Hero Description Paragraph</label>
                  <textarea 
                    rows="3"
                    required
                    value={homeContent.heroDescription}
                    onChange={(e) => setHomeContent({ ...homeContent, heroDescription: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">Hero Headline Image URL</label>
                  <input 
                    type="url" 
                    required
                    value={homeContent.heroImage}
                    onChange={(e) => setHomeContent({ ...homeContent, heroImage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-2xs"
                  />
                </div>
              </div>

              {/* Section: Offers */}
              <div className="space-y-6 border-b border-slate-100 pb-8">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Tag size={18} className="text-brand" /> Promotional Banners & Deals
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  {/* Promo Banner 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1.5 border-slate-200/60">Deal Banner A</h4>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Banner Title</label>
                      <input 
                        type="text" 
                        value={homeContent.promo1Title}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Title: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Promo Description</label>
                      <textarea 
                        rows="2"
                        value={homeContent.promo1Desc}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-[11px] rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coupon Code</label>
                      <input 
                        type="text" 
                        value={homeContent.promo1Code}
                        onChange={(e) => setHomeContent({ ...homeContent, promo1Code: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand uppercase"
                      />
                    </div>
                  </div>

                  {/* Promo Banner 2 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-1.5 border-slate-200/60">Deal Banner B</h4>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Banner Title</label>
                      <input 
                        type="text" 
                        value={homeContent.promo2Title}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Title: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Promo Description</label>
                      <textarea 
                        rows="2"
                        value={homeContent.promo2Desc}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Desc: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-[11px] rounded-xl outline-none focus:border-brand leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Coupon Code</label>
                      <input 
                        type="text" 
                        value={homeContent.promo2Code}
                        onChange={(e) => setHomeContent({ ...homeContent, promo2Code: e.target.value })}
                        className="w-full bg-white border px-3 py-2 text-xs rounded-xl outline-none focus:border-brand uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: About block */}
              <div className="space-y-4 pb-4">
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand" /> About Section
                </h3>
                
                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">About Headline Title</label>
                  <input 
                    type="text" 
                    required
                    value={homeContent.aboutHeadline}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutHeadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">About Description Paragraph 1</label>
                  <textarea 
                    rows="3"
                    required
                    value={homeContent.aboutText1}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutText1: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">About Description Paragraph 2</label>
                  <textarea 
                    rows="3"
                    required
                    value={homeContent.aboutText2}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutText2: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-xs leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 pl-0.5">About Section Image URL</label>
                  <input 
                    type="url" 
                    required
                    value={homeContent.aboutImage}
                    onChange={(e) => setHomeContent({ ...homeContent, aboutImage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl focus:border-brand outline-none text-2xs"
                  />
                </div>
              </div>

              {/* Submit btn */}
              <button 
                type="submit" 
                className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-brand/10 hover:shadow-xl active:scale-[0.99] text-xs uppercase tracking-wider flex items-center gap-2"
              >
                <Save size={16} /> Save All Layout Changes
              </button>
            </form>
          )}

          {/* TAB 3: Registered User Roles Overrides */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-gray-900">Registered Users Profile Registry</h3>
                {loadingUsers && <RefreshCw className="animate-spin text-slate-400" size={16} />}
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">Loading users from Firebase Realtime DB...</div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/20">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-gray-400 font-extrabold border-b border-slate-100">
                        <th className="px-6 py-4">User Name</th>
                        <th className="px-6 py-4">Email Address</th>
                        <th className="px-6 py-4">Current Role</th>
                        <th className="px-6 py-4 text-center">Change Role Dropdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map(userItem => (
                        <tr key={userItem.id} className="hover:bg-slate-50/40 transition-colors text-xs font-medium text-slate-700">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {userItem.displayName || 'Customer'}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                            {userItem.email}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              userItem.role === 'admin' ? 'bg-red-50 text-red-650 border border-red-100' :
                              userItem.role === 'vendor' ? 'bg-emerald-50 text-emerald-750 border border-emerald-100' :
                              userItem.role === 'delivery_person' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {userItem.role || 'customer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select
                              value={userItem.role || 'customer'}
                              onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                              disabled={user?.uid === userItem.id}
                              className="bg-white border border-slate-200/80 text-[11px] font-bold px-3 py-1.5 rounded-xl outline-none focus:border-brand disabled:opacity-50"
                            >
                              <option value="customer">Customer</option>
                              <option value="vendor">Vendor</option>
                              <option value="delivery_person">Delivery Person</option>
                              <option value="admin">Admin</option>
                            </select>
                            {user?.uid === userItem.id && (
                              <p className="text-[9px] text-red-500 mt-1 pl-1">Cannot demote yourself</p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
