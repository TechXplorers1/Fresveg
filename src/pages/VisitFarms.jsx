import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Globe, MessageCircle, MapPin, Calendar, Users, Compass, Search, Sparkles, CheckCircle, Clock, Trash2, ShieldAlert, ArrowRight, BookOpen, X, Minus, Plus } from 'lucide-react';
import ModernDatePicker from '../components/common/ModernDatePicker';
import { getFarmSlug } from './FarmDetails';
import { ensureFarmsInFirebase } from '../services/farmSeeder';

const formatUpdatedTime = (isoString) => {
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

export default function VisitFarms() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [costCategory, setCostCategory] = useState('all'); // 'all', 'free', 'payable'

  // Booking modal/drawer states
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [visitorsCount, setVisitorsCount] = useState(1);
  const [includeStay, setIncludeStay] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState('');
  const [selectedRoomsCount, setSelectedRoomsCount] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Counts for category badges
  const freeFarmsCount = farms.filter(f => !f.costPerPerson || Number(f.costPerPerson) === 0).length;
  const payableFarmsCount = farms.filter(f => Number(f.costPerPerson) > 0).length;

  // 1. Fetch Farms 100% directly from Firebase RTDB (Live Single Source of Truth)
  useEffect(() => {
    ensureFarmsInFirebase();
    const farmsRef = ref(realtimeDb, 'farms');
    const unsubscribe = onValue(farmsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dbFarms = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setFarms(dbFarms);
      } else {
        setFarms([]);
      }
      setLoadingFarms(false);
    }, (err) => {
      console.error('Failed to load farms from RTDB:', err);
      setLoadingFarms(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch User's Bookings from Firebase RTDB
  useEffect(() => {
    if (!user) {
      setBookings([]);
      setLoadingBookings(false);
      return;
    }

    const bookingsRef = ref(realtimeDb, 'farmBookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter bookings belonging to current customer
        const userBookings = Object.keys(data)
          .map(key => ({ ...data[key], id: key }))
          .filter(b => b.customerId === user.uid);

        // Sort bookings by date ascending
        userBookings.sort((a, b) => new Date(a.date) - new Date(b.date));
        setBookings(userBookings);
      } else {
        setBookings([]);
      }
      setLoadingBookings(false);
    }, (err) => {
      console.error('Failed to load bookings:', err);
      setLoadingBookings(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Search & Category Filtering
  const filteredFarms = farms.filter(farm => {
    const matchesSearch =
      farm.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const isFree = !farm.costPerPerson || Number(farm.costPerPerson) === 0;
    const matchesCategory =
      costCategory === 'all' ? true :
        costCategory === 'free' ? isFree :
          !isFree;

    return matchesSearch && matchesCategory;
  });

  // Start Booking Process
  const handleOpenBooking = (farm) => {
    if (!user) {
      // Redirect to Auth page if not logged in
      navigate('/auth?redirect=visit-farms');
      return;
    }
    setSelectedFarm(farm);
    setBookingDate('');
    setVisitorsCount(1);
    setIncludeStay(false);
    setSelectedAccommodation('');
    setSelectedRoomsCount(1);
    setBookingError('');
    setBookingSuccess(false);
  };

  // Submit Booking to Firebase (or route to checkout for payable farms)
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedFarm || !bookingDate) {
      setBookingError('Please select a valid date.');
      return;
    }

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(bookingDate);
    if (selected < today) {
      setBookingError('Cannot book slots in the past.');
      return;
    }

    setSubmittingBooking(true);
    setBookingError('');

    try {
      const accList = selectedFarm.accommodations && selectedFarm.accommodations.length > 0 ? selectedFarm.accommodations : [];
      const selectedAccObj = accList.find(a => a.title === selectedAccommodation) || accList[0];
      const selectedAccPrice = includeStay
        ? (selectedAccObj ? (parseFloat(String(selectedAccObj.price || '').replace(/[^0-9.]/g, '')) || 0) : (Number(selectedFarm.accommodationPrice) || 0))
        : 0;

      const isFree = !selectedFarm.costPerPerson || Number(selectedFarm.costPerPerson) === 0;
      const admissionCost = isFree ? 0 : Number(selectedFarm.costPerPerson) * Number(visitorsCount);
      const stayCost = includeStay ? (selectedAccPrice * Number(selectedRoomsCount)) : 0;
      const totalAmount = admissionCost + stayCost;

      const bookingPayload = {
        farmId: selectedFarm.id,
        farmName: selectedFarm.farmName,
        location: selectedFarm.location || '',
        farmImage: selectedFarm.image || '',
        vendorId: selectedFarm.vendorId || 'vendor-default',
        vendorName: selectedFarm.vendorName || 'Farm Owner',
        customerId: user.uid,
        customerName: userProfile?.displayName || user?.displayName || 'Customer',
        customerEmail: user.email || '',
        date: bookingDate,
        visitorsCount: Number(visitorsCount),
        costPerPerson: isFree ? 0 : (Number(selectedFarm.costPerPerson) || 0),
        includeStay,
        accommodationTitle: includeStay ? (selectedAccObj?.title || 'Selected Stay') : 'No Stay',
        roomsBooked: includeStay ? Number(selectedRoomsCount) : 0,
        accommodationPrice: selectedAccPrice,
        stayCost,
        totalAmount,
        isFree: isFree && stayCost === 0,
        status: 'confirmed',
        paymentMethod: isFree && stayCost === 0 ? 'Free Entry' : 'Pending Payment',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      if (isFree && stayCost === 0) {
        // Free farms: confirm immediately
        const bookingsRef = ref(realtimeDb, 'farmBookings');
        const newBookingRef = push(bookingsRef);
        await set(newBookingRef, bookingPayload);
        setBookingSuccess(true);
        setTimeout(() => {
          setSelectedFarm(null);
          setBookingSuccess(false);
        }, 2500);
      } else {
        // Payable farms or stay included: route to farm checkout page
        sessionStorage.setItem('pendingFarmBooking', JSON.stringify(bookingPayload));
        setSelectedFarm(null);
        navigate('/farm-checkout');
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      setBookingError('Booking failed. Check your internet connection.');
    } finally {
      setSubmittingBooking(false);
    }
  };


  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this farm visit booking?')) return;
    try {
      await remove(ref(realtimeDb, `farmBookings/${bookingId}`));
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-5 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      {/* ── Section 1: Modern Glassmorphic Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6 text-left animate-fade-in border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Compass size={14} className="text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>Direct Farm Refreshment Tours & Stays</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-headings leading-tight tracking-tight text-white drop-shadow-sm">
              Discover & Visit Local <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Organic Farms</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl font-body">
              Take a refreshing break from city routines and work stress. Connect directly with local organic farmers, pick fresh berries, observe livestock, and experience rustic farm stays.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white flex flex-col items-center justify-center shrink-0 w-full sm:w-auto text-center space-y-2">
            <Sparkles size={32} className="animate-pulse text-amber-400" />
            <div>
              <span className="block text-xs font-black uppercase tracking-widest text-emerald-300">100% Verified</span>
              <span className="text-[11px] text-slate-300 font-medium font-body">Organic Farmers & Hosts</span>
            </div>
          </div>
        </div>

        {/* Feature Badges Strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/10 text-xs font-bold">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-lg">🍓</span>
            <div>
              <p className="text-emerald-400 font-extrabold text-[11px]">Organic Crops</p>
              <p className="text-slate-400 text-[9px] font-normal">Self Picking & Tasting</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-lg">🐄</span>
            <div>
              <p className="text-amber-400 font-extrabold text-[11px]">Desi Livestock</p>
              <p className="text-slate-400 text-[9px] font-normal">Cows, Poultry & Sheep</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-lg">🛖</span>
            <div>
              <p className="text-teal-300 font-extrabold text-[11px]">Rustic Stays</p>
              <p className="text-slate-400 text-[9px] font-normal">Clay Huts & Camping</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-lg">🎟️</span>
            <div>
              <p className="text-purple-300 font-extrabold text-[11px]">Easy Slots</p>
              <p className="text-slate-400 text-[9px] font-normal">Free & Paid Entry</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Search and Category Filter Toolbar ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-slate-200/80">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search farm name, crops, fruits, location, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-body"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCostCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${costCategory === 'all'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            All Organic Farms ({farms.length})
          </button>
          <button
            type="button"
            onClick={() => setCostCategory('free')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${costCategory === 'free'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
          >
            <Sparkles size={13} /> Free Entry ({freeFarmsCount})
          </button>
          <button
            type="button"
            onClick={() => setCostCategory('payable')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${costCategory === 'payable'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-600/30'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60'
              }`}
          >
            💳 Payable Entry ({payableFarmsCount})
          </button>
        </div>
      </div>

      {/* ── Section 3: Main 2-Column Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">

        {/* Left Column: Farm Listing Cards (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {loadingFarms ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 shadow-inner">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-650"></div>
              <p className="mt-4 text-emerald-800 font-bold animate-pulse text-xs uppercase tracking-wider font-headings">Loading organic farms...</p>
            </div>
          ) : filteredFarms.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur-md border border-white rounded-3xl shadow-sm max-w-lg mx-auto p-6">
              <Compass className="mx-auto text-slate-300 mb-4 animate-spin" size={48} style={{ animationDuration: '6s' }} />
              <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No Farms Found</h3>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto font-body">We couldn't find any farms matching your selected category or search query.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCostCategory('all');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredFarms.map((farm) => {
                const isFree = !farm.costPerPerson || Number(farm.costPerPerson) === 0;

                return (
                  <div key={farm.id} className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full relative">

                    {/* Farm Image & Badges */}
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img
                        src={farm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'}
                        alt={farm.farmName}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

                      {/* Cost Category Badge */}
                      {isFree ? (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-emerald-400">
                          <Sparkles size={11} /> FREE ENTRY
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md border border-white/20">
                          PAYABLE ENTRY
                        </div>
                      )}

                      {/* Last Updated Badge on Card */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                        <Clock size={10} className="text-emerald-400" />
                        <span>
                          {farm.updatedAt || farm.createdAt ? `Updated ${formatUpdatedTime(farm.updatedAt || farm.createdAt)}` : 'Recently Updated'}
                        </span>
                      </div>

                      {/* Location Badge on Image */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold drop-shadow-md">
                        <span onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(farm.location)}`, '_blank'); }} className="flex items-center gap-1 text-[11px] truncate font-body hover:underline hover:text-emerald-300 transition-colors cursor-pointer" title="Click to open location in Google Maps">
                          <MapPin size={13} className="text-emerald-400 shrink-0" /> {farm.location} ↗
                        </span>
                        {farm.rating && (
                          <span className="bg-amber-500/90 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                            ★ {farm.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Farm Details Body */}
                    <div className="p-5 flex flex-col flex-grow text-left space-y-3.5">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 font-headings group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {farm.farmName}
                        </h3>
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 font-medium italic mt-1">
                          "{farm.description}"
                        </p>
                      </div>

                      {/* Crops / Features Chips preview */}
                      {((farm.crops && farm.crops.length > 0) || (farm.accommodations && farm.accommodations.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(farm.crops || []).slice(0, 3).map((crop, cIdx) => (
                            <span key={cIdx} className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-100">
                              🌾 {typeof crop === 'string' ? crop : crop.name}
                            </span>
                          ))}
                          {farm.accommodations && farm.accommodations.length > 0 && (
                            <span className="bg-amber-50 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                              🛖 Stays Available
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Row */}
                      {/* Social Media Links Bar on Farm Card */}
                      {farm.socialLinks && (farm.socialLinks.instagram || farm.socialLinks.facebook || farm.socialLinks.youtube || farm.socialLinks.whatsapp || farm.socialLinks.website) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 font-headings">Socials:</span>
                          {farm.socialLinks.instagram && (
                            <a href={farm.socialLinks.instagram.startsWith('http') ? farm.socialLinks.instagram : `https://instagram.com/${farm.socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:scale-110 transition-transform" title="Instagram">
                              <Instagram size={11} />
                            </a>
                          )}
                          {farm.socialLinks.facebook && (
                            <a href={farm.socialLinks.facebook.startsWith('http') ? farm.socialLinks.facebook : `https://facebook.com/${farm.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-blue-600 text-white hover:scale-110 transition-transform" title="Facebook">
                              <Facebook size={11} />
                            </a>
                          )}
                          {farm.socialLinks.youtube && (
                            <a href={farm.socialLinks.youtube.startsWith('http') ? farm.socialLinks.youtube : `https://youtube.com/${farm.socialLinks.youtube}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-red-600 text-white hover:scale-110 transition-transform" title="YouTube">
                              <Youtube size={11} />
                            </a>
                          )}
                          {farm.socialLinks.whatsapp && (
                            <a href={farm.socialLinks.whatsapp.startsWith('http') ? farm.socialLinks.whatsapp : `https://wa.me/${farm.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-emerald-600 text-white hover:scale-110 transition-transform" title="WhatsApp">
                              <MessageCircle size={11} />
                            </a>
                          )}
                          {farm.socialLinks.website && (
                            <a href={farm.socialLinks.website.startsWith('http') ? farm.socialLinks.website : `https://${farm.socialLinks.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 rounded-lg bg-slate-800 text-white hover:scale-110 transition-transform" title="Website">
                              <Globe size={11} />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider font-headings">Host / Owner</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{farm.vendorName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider font-headings">Visit Fee</p>
                          {isFree ? (
                            <p className="font-black text-emerald-600 text-sm">FREE ENTRY <span className="text-[10px] text-emerald-600/70 font-bold">(₹0)</span></p>
                          ) : (
                            <p className="font-black text-slate-900 text-sm">₹{farm.costPerPerson} <span className="text-[10px] text-slate-400 font-semibold">/ guest</span></p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const slug = farm.farmName
                              ? farm.farmName.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                              : farm.id;
                            navigate(`/farm/${slug}`);
                          }}
                          className="flex-1 bg-white border-2 border-emerald-600/80 text-emerald-700 hover:bg-emerald-50 font-bold text-xs py-2.5 px-3 rounded-2xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 font-headings cursor-pointer"
                        >
                          <Compass size={14} className="text-emerald-600" /> Explore Farm
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenBooking(farm)}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 px-3 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-headings cursor-pointer"
                        >
                          <Calendar size={14} /> Book Slot
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Customer Booked Slots (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xl shadow-emerald-950/[0.02]">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100/30">
                <BookOpen size={16} />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-800 font-headings">My Bookings</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled weekend refreshes</p>
              </div>
            </div>

            {/* Bookings List */}
            {!user ? (
              <div className="p-5 text-center bg-slate-50/50 border border-slate-150 rounded-2xl">
                <ShieldAlert className="mx-auto text-amber-500 mb-2" size={24} />
                <p className="text-xs text-slate-600 font-bold leading-relaxed">Sign In Required</p>
                <p className="text-[10px] text-slate-400 mt-1 mb-4 leading-relaxed font-body">Please sign in to book visits and manage your booked slots.</p>
                <button
                  onClick={() => navigate('/auth?redirect=visit-farms')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Sign In Now
                </button>
              </div>
            ) : loadingBookings ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-100 border-t-emerald-650"></div>
                <p className="mt-2 text-slate-450 font-bold text-[9px] uppercase tracking-wider">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-150 rounded-2xl">
                <Calendar className="mx-auto text-slate-350 mb-3" size={32} />
                <p className="text-slate-550 font-bold text-xs">No slots booked yet.</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed font-body">Select a farm and book a refreshment visit to unlock adventure!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white/55 border border-slate-150 rounded-2xl p-4 flex flex-col text-left space-y-3 shadow-inner hover:bg-white hover:border-emerald-150 transition-all duration-300">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-800 text-xs truncate font-headings">{booking.farmName}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-455 font-semibold mt-1">
                          <Calendar size={11} className="text-emerald-600" />
                          <span>{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50 flex-shrink-0"
                        title="Cancel visit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold border-t border-slate-100/60 pt-2.5">
                      <span className="flex items-center gap-1 text-slate-500"><Users size={11} /> {booking.visitorsCount} visitor{booking.visitorsCount !== 1 ? 's' : ''}</span>
                      {booking.status === 'confirmed' ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-2 py-0.5 rounded-full uppercase text-[8px] font-black flex items-center gap-1">
                          <CheckCircle size={9} className="text-emerald-600" /> confirmed
                        </span>
                      ) : booking.status === 'rejected' ? (
                        <span className="bg-rose-50 text-rose-800 border border-rose-150 px-2 py-0.5 rounded-full uppercase text-[8px] font-black flex items-center gap-1">
                          <X size={9} className="text-rose-650" /> declined
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-full uppercase text-[8px] font-black flex items-center gap-1 animate-pulse">
                          <Clock size={9} className="text-amber-600" /> pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Section 4: Experience Highlights & Feature Pillars ── */}
      <div className="pt-6 border-t border-slate-200/80 space-y-4 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-xl font-bold font-headings text-slate-800">Why Visit Local Organic Farms?</h2>
            <p className="text-xs text-slate-400 font-medium font-body">Four unique weekend experiences waiting for you</p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
            🌿 Refresh & Recharge
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-xl font-bold">
              🍓
            </div>
            <h4 className="font-bold text-slate-800 text-sm font-headings">Pick Fresh Crops</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-body">
              Harvest organic strawberries, tomatoes, leafy greens, and fresh fruits straight from soil to hand.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-xl font-bold">
              🐄
            </div>
            <h4 className="font-bold text-slate-800 text-sm font-headings">Desi Livestock & Birds</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-body">
              Feed pure Gir cows, observe free-range poultry hens, sheep flocks, and witness natural honeybee hives.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center text-xl font-bold">
              🛖
            </div>
            <h4 className="font-bold text-slate-800 text-sm font-headings">Rustic Farm Stays</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-body">
              Stay overnight in mud clay huts, solar-powered guest rooms, or eco-camping tents under nighttime stars.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-xl font-bold">
              🧺
            </div>
            <h4 className="font-bold text-slate-800 text-sm font-headings">Direct Farm Store</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed font-body">
              Buy 100% genuine farm produce, wild honey, and fruit jams directly from the farmers without middlemen.
            </p>
          </div>
        </div>
      </div>

      {/* ── Booking Modal/Form Overlay ── */}
      {selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm transition-opacity duration-300 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col transform scale-100 transition-all duration-300 border border-slate-100 my-auto text-left">
            <form onSubmit={handleConfirmBooking} className="flex flex-col h-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden">

              {/* Modal Header (Sticky Top) */}
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-left relative rounded-t-3xl sticky top-0 z-10 shrink-0">
                <h3 className="text-base sm:text-lg font-black font-headings">Book Refreshment Slot</h3>
                <p className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider mt-0.5 truncate max-w-[220px]">{selectedFarm.farmName}</p>
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="absolute right-4 top-3.5 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body (Scrollable Middle Container) */}
              <div className="p-5 sm:p-6 text-left space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {bookingSuccess ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
                    <CheckCircle className="text-emerald-500 animate-bounce" size={48} />
                    <h4 className="font-extrabold text-slate-800 text-sm font-headings">Booking Request Submitted!</h4>
                    <p className="text-xs text-slate-450 max-w-xs font-body leading-relaxed">Your visit slot to {selectedFarm.farmName} for {new Date(bookingDate).toLocaleDateString()} is pending owner approval. Enjoy your weekend refreshment once approved!</p>
                  </div>
                ) : (
                  <>
                    {bookingError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <Clock size={14} /> {bookingError}
                      </div>
                    )}

                    {/* Cost Summary Box & Stay Selector */}
                    {(() => {
                      const accList = selectedFarm.accommodations && selectedFarm.accommodations.length > 0 ? selectedFarm.accommodations : [];
                      const selectedAccObj = accList.find(a => a.title === selectedAccommodation) || accList[0];
                      const selectedAccPrice = includeStay
                        ? (selectedAccObj ? (parseFloat(String(selectedAccObj.price || '').replace(/[^0-9.]/g, '')) || 0) : (Number(selectedFarm.accommodationPrice) || 0))
                        : 0;

                      const isFreeTicket = !selectedFarm.costPerPerson || Number(selectedFarm.costPerPerson) === 0;
                      const stayTotalCost = includeStay ? (selectedAccPrice * Number(selectedRoomsCount)) : 0;
                      const admissionTotalCost = isFreeTicket ? 0 : (Number(selectedFarm.costPerPerson) * Number(visitorsCount));
                      const estimatedCostVal = admissionTotalCost + stayTotalCost;

                      return (
                        <>
                          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                            <div>
                              <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider font-headings">Entry Ticket</p>
                              {isFreeTicket ? (
                                <p className="text-xs text-emerald-600 font-bold mt-0.5">FREE Ticket</p>
                              ) : (
                                <p className="text-xs text-slate-500 font-semibold mt-0.5">₹{selectedFarm.costPerPerson} / visitor</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider font-headings">Estimated Total</p>
                              {estimatedCostVal === 0 ? (
                                <p className="text-base font-black text-emerald-600 font-sans mt-0.5">FREE (₹0)</p>
                              ) : (
                                <p className="text-base font-black text-slate-850 font-sans mt-0.5">
                                  ₹{estimatedCostVal}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Date Input */}
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">Choose Visit Date</label>
                            <ModernDatePicker
                              value={bookingDate}
                              onChange={(newDate) => setBookingDate(newDate)}
                              visitDays={selectedFarm?.visitDays}
                              visitTimings={selectedFarm?.visitTimings}
                            />
                          </div>

                          {/* Visitors Count */}
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">Number of Visitors</label>
                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                              <button
                                type="button"
                                onClick={() => setVisitorsCount(Math.max(1, (parseInt(visitorsCount) || 1) - 1))}
                                className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0"
                              >
                                <Minus size={14} />
                              </button>
                              <div className="flex-1 flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  required
                                  value={visitorsCount}
                                  onChange={(e) => setVisitorsCount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 text-center font-black text-slate-800 text-sm font-sans bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 rounded-lg py-1 border border-slate-200"
                                />
                                <span className="text-xs font-bold text-slate-500">Guest(s)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setVisitorsCount((parseInt(visitorsCount) || 0) + 1)}
                                className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Accommodation Selection Field */}
                          <div className="space-y-2 pt-1 text-left">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-headings">
                              Overnight Stay / Accommodation Option
                            </label>

                            <div className="space-y-2">
                              {/* Option 1: No Stay */}
                              <div
                                onClick={() => {
                                  setIncludeStay(false);
                                  setSelectedAccommodation('');
                                }}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between text-xs ${
                                  !includeStay
                                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!includeStay ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                                    {!includeStay && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-slate-800 font-headings block">No Stay (Day Visit Only)</span>
                                    <span className="text-[10px] text-slate-500">Only farm visit entry ticket</span>
                                  </div>
                                </div>
                                <span className="font-black text-[10px] text-emerald-700 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-lg">Included</span>
                              </div>

                              {/* Options 2+: Available Stay Options from Farm */}
                              {accList.map((acc, idx) => {
                                const isAccSelected = includeStay && (selectedAccommodation === acc.title || (!selectedAccommodation && idx === 0));
                                const accPriceNum = parseFloat(String(acc.price || '').replace(/[^0-9.]/g, '')) || 0;
                                const displayPriceStr = accPriceNum > 0 ? `+₹${accPriceNum}/night` : 'Free Stay';
                                const quantityStr = acc.roomQuantity || '1 Room';
                                const capacityStr = acc.roomCapacity || '2 Persons';
                                const maxAvailableRooms = Math.max(1, parseInt(String(acc.roomQuantity || '').replace(/[^0-9]/g, '')) || 1);

                                return (
                                  <div
                                    key={acc.id || idx}
                                    onClick={() => {
                                      setIncludeStay(true);
                                      if (selectedAccommodation !== acc.title) {
                                        setSelectedAccommodation(acc.title);
                                        setSelectedRoomsCount(1);
                                      }
                                    }}
                                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none space-y-2 text-xs ${
                                      isAccSelected
                                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isAccSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                                          {isAccSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        <span className="font-extrabold text-slate-800 font-headings truncate text-xs">
                                          {acc.title}
                                        </span>
                                      </div>

                                      <span className={`font-black text-[11px] font-mono px-2 py-0.5 rounded-lg shrink-0 ${isAccSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                        {displayPriceStr}
                                      </span>
                                    </div>

                                    {/* Badges: Quantity of Rooms & Capacity */}
                                    <div className="flex flex-wrap items-center gap-1.5 pl-6">
                                      <span className="bg-amber-100/80 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                                        🚪 {quantityStr} Available
                                      </span>
                                      <span className="bg-teal-100/80 text-teal-900 font-bold text-[10px] px-2 py-0.5 rounded-md border border-teal-200/60 flex items-center gap-1">
                                        👥 {capacityStr} Capacity
                                      </span>
                                    </div>

                                    {/* Short Description */}
                                    {acc.desc && (
                                      <p className="text-[10px] text-slate-500 pl-6 line-clamp-1 font-body">
                                        {acc.desc}
                                      </p>
                                    )}

                                    {/* Increment & Decrement Room Quantity Counter Buttons */}
                                    {isAccSelected && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-emerald-300/80 shadow-xs"
                                      >
                                        <div>
                                          <span className="text-[11px] font-extrabold text-slate-900 font-headings block">
                                            Rooms to Book:
                                          </span>
                                          <span className="text-[10px] text-emerald-700 font-bold font-mono">
                                            Max Available: {maxAvailableRooms} {maxAvailableRooms === 1 ? 'Room' : 'Rooms'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-1 rounded-xl">
                                          <button
                                            type="button"
                                            disabled={selectedRoomsCount <= 1}
                                            onClick={() => setSelectedRoomsCount(prev => Math.max(1, prev - 1))}
                                            className="w-7 h-7 bg-white text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 hover:text-white rounded-lg font-black flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                            title="Decrease room count"
                                          >
                                            <Minus size={13} strokeWidth={2.5} />
                                          </button>

                                          <span className="w-7 text-center text-xs font-black text-slate-900 font-mono">
                                            {selectedRoomsCount}
                                          </span>

                                          <button
                                            type="button"
                                            disabled={selectedRoomsCount >= maxAvailableRooms}
                                            onClick={() => setSelectedRoomsCount(prev => Math.min(maxAvailableRooms, prev + 1))}
                                            className="w-7 h-7 bg-white text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-600 hover:text-white rounded-lg font-black flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                            title="Increase room count"
                                          >
                                            <Plus size={13} strokeWidth={2.5} />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* Form Buttons Footer (Sticky Bottom) */}
              {!bookingSuccess && (
                <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 z-10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFarm(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {submittingBooking ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Booking...
                      </>
                    ) : (
                      <>
                        {(!selectedFarm.costPerPerson || Number(selectedFarm.costPerPerson) === 0)
                          ? 'Confirm Free Slot'
                          : 'Confirm Visit Slot'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
