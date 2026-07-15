import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, Compass, Search, Sparkles, CheckCircle, Clock, Trash2, ShieldAlert, ArrowRight, BookOpen, X } from 'lucide-react';

const INITIAL_MOCK_FARMS = [
  {
    id: 'mock-farm-1',
    farmName: 'Strawberry Fields & Orchards',
    location: 'Mahabaleshwar, Maharashtra',
    description: 'Pick fresh organic strawberries, stroll through our beautiful fruit orchards, and enjoy fresh strawberry milkshakes made on-site!',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80',
    costPerPerson: 350,
    vendorId: 'mock-vendor-1',
    vendorName: 'Orchard Farms'
  },
  {
    id: 'mock-farm-2',
    farmName: 'Green Valley Organic Haven',
    location: 'Karjat, Maharashtra',
    description: 'Learn about sustainable agriculture, witness our bio-gas plant, pick fresh organic leafy greens, and enjoy a traditional farm-to-table lunch.',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80',
    costPerPerson: 250,
    vendorId: 'mock-vendor-2',
    vendorName: 'Green Valley Farm'
  },
  {
    id: 'mock-farm-3',
    farmName: 'Sunshine Dairy & Carrot Patch',
    location: 'Anand, Gujarat',
    description: 'Experience organic dairy farming up close. Feed our happy cows, learn the milking process, explore carrot fields, and drink pure fresh buttermilk.',
    image: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&q=80',
    costPerPerson: 300,
    vendorId: 'mock-vendor-3',
    vendorName: 'Sunshine Produce'
  }
];

export default function VisitFarms() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const [farms, setFarms] = useState(INITIAL_MOCK_FARMS);
  const [bookings, setBookings] = useState([]);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Booking modal/drawer states
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [visitorsCount, setVisitorsCount] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // 1. Fetch Farms from Firebase RTDB + Merge with Mock
  useEffect(() => {
    const farmsRef = ref(realtimeDb, 'farms');
    const unsubscribe = onValue(farmsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dbFarms = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        // Merge mock list and actual DB farms
        setFarms([...INITIAL_MOCK_FARMS, ...dbFarms]);
      } else {
        setFarms(INITIAL_MOCK_FARMS);
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

  // Handle Search Filtering
  const filteredFarms = farms.filter(farm => 
    farm.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farm.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farm.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setBookingError('');
    setBookingSuccess(false);
  };

  // Submit Booking to Firebase
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedFarm || !bookingDate) {
      setBookingError('Please select a valid date.');
      return;
    }

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0,0,0,0);
    const selected = new Date(bookingDate);
    if (selected < today) {
      setBookingError('Cannot book slots in the past.');
      return;
    }

    setSubmittingBooking(true);
    setBookingError('');

    try {
      const bookingsRef = ref(realtimeDb, 'farmBookings');
      const newBookingRef = push(bookingsRef);
      
      const newBooking = {
        farmId: selectedFarm.id,
        farmName: selectedFarm.farmName,
        customerId: user.uid,
        customerName: userProfile?.displayName || user.displayName || 'Customer',
        customerEmail: user.email,
        date: bookingDate,
        visitorsCount: Number(visitorsCount),
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      await set(newBookingRef, newBooking);
      setBookingSuccess(true);
      setTimeout(() => {
        setSelectedFarm(null);
        setBookingSuccess(false);
      }, 2500);
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden mb-12 bg-white/70 backdrop-blur-md border border-white/60 p-8 sm:p-10 rounded-3xl shadow-xl shadow-emerald-950/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in">
        <div className="text-left space-y-2">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Compass size={12} className="text-emerald-600" /> Refreshment Weekend Tours
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 font-headings leading-tight">Visit Local Farms</h1>
          <p className="text-slate-500 text-sm max-w-2xl font-medium leading-relaxed">
            Take a break from software jobs or busy city routines. Connect directly with local farmers, book weekend refreshment visits, and experience organic farming firsthand.
          </p>
        </div>
        <div className="relative z-10 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-emerald-700 flex flex-col items-center justify-center flex-shrink-0 w-full md:w-36 text-center">
          <Sparkles size={28} className="animate-pulse mb-1 text-emerald-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-850">Direct Connect</span>
        </div>
      </div>

      {/* ── Search and Tabs ── */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-5 bg-white/70 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/60">
        {/* Search bar */}
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search farm name, location, or vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl text-xs focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
          />
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider font-headings">
          Showing {filteredFarms.length} Farm{filteredFarms.length !== 1 ? 's' : ''} listed
        </div>
      </div>

      {/* ── Two Column Layout (Farms on Left, Bookings on Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Farms Grid (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          {loadingFarms ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 shadow-inner">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-650"></div>
              <p className="mt-4 text-emerald-800 font-semibold animate-pulse text-xs uppercase tracking-wider font-headings">Loading listed farms...</p>
            </div>
          ) : filteredFarms.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur-md border border-white rounded-3xl shadow-sm max-w-lg mx-auto">
              <Compass className="mx-auto text-slate-350 mb-4 animate-spin" size={48} style={{ animationDuration: '6s' }} />
              <h3 className="text-lg font-bold font-headings text-slate-800 mb-1">No Farms Found</h3>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">We couldn't find any farms matching your search query. Try typing another keyword.</p>
              <button onClick={() => setSearchQuery('')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">Clear Search</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredFarms.map((farm) => (
                <div key={farm.id} className="bg-white/70 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group h-full">
                  
                  {/* Farm Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-50">
                    <img
                      src={farm.image || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80'}
                      alt={farm.farmName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Farm Info */}
                  <div className="p-5 flex flex-col flex-grow text-left space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 font-headings group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {farm.farmName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold font-body">
                        <MapPin size={13} className="text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{farm.location}</span>
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 font-medium italic">
                      "{farm.description}"
                    </p>

                    <div className="border-t border-slate-100/80 pt-4 mt-auto flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider font-headings">Farm Owner</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{farm.vendorName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider font-headings">Entry Cost</p>
                        <p className="font-black text-emerald-800 text-sm">₹{farm.costPerPerson} <span className="text-[10px] text-slate-400 font-semibold">/ guest</span></p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenBooking(farm)}
                      className="w-full bg-gradient-to-r from-emerald-600 via-emerald-650 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs py-3 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-headings"
                    >
                      Book Farm Visit <ArrowRight size={13} />
                    </button>
                  </div>

                </div>
              ))}
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

      {/* ── Booking Modal/Form Overlay ── */}
      {selectedFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 transition-all duration-300 border border-slate-100">
            <form onSubmit={handleConfirmBooking} className="flex flex-col">
              
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-left relative">
                <h3 className="text-lg font-black font-headings">Book Refreshment Slot</h3>
                <p className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider mt-0.5">{selectedFarm.farmName}</p>
                <button
                  type="button"
                  onClick={() => setSelectedFarm(null)}
                  className="absolute right-4 top-4 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-left space-y-5">
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

                    {/* Cost Summary Box */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider font-headings">Admission Cost</p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">₹{selectedFarm.costPerPerson} / visitor</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-455 font-black uppercase tracking-wider font-headings">Estimated Cost</p>
                        <p className="text-base font-black text-slate-850 font-sans mt-0.5">₹{selectedFarm.costPerPerson * visitorsCount}</p>
                      </div>
                    </div>

                    {/* Date Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">Choose Visit Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-250 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-xs bg-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Visitors Count */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">Number of Visitors</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max="20"
                          value={visitorsCount}
                          onChange={(e) => setVisitorsCount(Math.max(1, Number(e.target.value)))}
                          className="w-full px-4 py-3 rounded-2xl border border-slate-250 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-xs bg-white font-medium"
                        />
                      </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedFarm(null)}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-all text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBooking}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs flex items-center gap-1.5"
                      >
                        {submittingBooking ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Booking...
                          </>
                        ) : (
                          <>Confirm Visit Slot</>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
