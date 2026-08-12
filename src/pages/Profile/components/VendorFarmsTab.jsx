import React, { useState } from 'react';
import {
    Compass, Plus, X, MapPin, Search, Locate, Loader2, Pencil, Trash2, Camera,
    Tent, PawPrint, Smile, ExternalLink, Calendar, Users, Check, Clock, Home as HomeIcon,
    Footprints, Feather, ShoppingBag, ShieldCheck, Star, Navigation, ArrowLeft, CheckCircle
} from 'lucide-react';
import ImageUploadField from '../../../components/common/ImageUploadField';
import { getFarmSlug } from '../../FarmDetails';

export default function VendorFarmsTab({
    isVendor,
    activeTab,
    myFarms = [],
    bookingsList = [],
    showAddFarmForm,
    setShowAddFarmForm,
    editingFarmId,
    setEditingFarmId,
    farmFormStep,
    setFarmFormStep,
    newFarmForm,
    setNewFarmForm,
    farmGalleryList,
    setFarmGalleryList,
    farmProductList,
    setFarmProductList,
    stayList,
    setStayList,
    handleCancelFarmForm,
    handleAddFarm,
    handleSaveFarmForm,
    handleDeleteFarm,
    handleEditFarmClick,
    handleAcceptBooking,
    handleDeclineBooking,
    handleDetectFarmLocation,
    handleLocateFarmAddress,
    isDetectingFarmLocation,
    farmMapContainerRef,
    openImageModal,
    navigate,
    setShowAddStayModal,
    setShowAddProductModal,
    setShowAddFarmProductModal,
    setShowAddGalleryModal,
    newGalleryForm,
    setNewGalleryForm,
    newFarmProductForm,
    setNewFarmProductForm,
    newStayForm,
    setNewStayForm,
    handleOpenAddStayModal,
    handleEditStay,
    handleEditModalProduct,
    setPhotoToEdit,
    setShowEditPhotoModal,
    handleRemoveStay,
    handleRemoveModalProduct,
    handleRemoveGalleryPhoto,
    handleAddCropChip,
    handleRemoveCropChip,
    handleAddFruitChip,
    handleRemoveFruitChip,
    handleAddLivestockChip,
    handleRemoveLivestockChip,
    handleAddKidsChip,
    handleRemoveKidsChip,
    INITIAL_CROPS = [],
    EXTRA_CROPS = [],
    INITIAL_FRUITS = [],
    EXTRA_FRUITS = [],
    INITIAL_LIVESTOCK = [],
    EXTRA_LIVESTOCK = [],
    INITIAL_KIDS_ACTIVITIES = [],
    EXTRA_KIDS_ACTIVITIES = [],
    labelCls = 'text-[11px] font-bold text-slate-700 uppercase font-headings block mb-1',
    inputCls = 'w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500 font-body'
}) {
    if (!isVendor || activeTab !== 'farms') return null;

    const vendorFarms = myFarms;
    const incomingFarmBookings = bookingsList;
    const detectingFarmLocation = isDetectingFarmLocation;
    const [deletingFarmId, setDeletingFarmId] = useState(null);
    const [showMoreCrops, setShowMoreCrops] = useState(false);
    const [showMoreFruits, setShowMoreFruits] = useState(false);
    const [showMoreLivestock, setShowMoreLivestock] = useState(false);
    const [showMoreKids, setShowMoreKids] = useState(false);
    const [cropInputText, setCropInputText] = useState('');
    const [fruitInputText, setFruitInputText] = useState('');
    const [livestockInputText, setLivestockInputText] = useState('');
    const [kidsInputText, setKidsInputText] = useState('');
    const [isSubmittingFarm, setIsSubmittingFarm] = useState(false);

    return (
        <React.Fragment>
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
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div>
                                                            <label className={labelCls}>📸 Farm Gallery & Visual Tour Photos ({farmGalleryList.length})</label>
                                                            <p className="text-[11px] text-slate-400 font-medium">Add photos of your fields, crops, stays, and farm views for visitors to explore.</p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {farmGalleryList.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const tourItems = farmGalleryList.map((g, i) => ({
                                                                            src: g.url,
                                                                            title: g.caption || `Farm Photo ${i + 1}`,
                                                                            caption: g.caption || ''
                                                                        }));
                                                                        openImageModal({
                                                                            src: tourItems[0].src,
                                                                            title: tourItems[0].title,
                                                                            gallery: tourItems,
                                                                            currentIndex: 0
                                                                        });
                                                                    }}
                                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-headings flex items-center gap-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
                                                                >
                                                                    <Compass size={13} className="animate-spin-slow" />
                                                                    <span>▶ Preview Tour</span>
                                                                </button>
                                                            )}

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
                                                    </div>

                                                    {/* Added Gallery Photos Grid */}
                                                    {farmGalleryList.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                                                            {farmGalleryList.map((item, idx) => (
                                                                <div key={item.id || idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs relative group cursor-pointer">
                                                                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-20">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPhotoToEdit({ ...item, id: idx });
                                                                                setShowEditPhotoModal(true);
                                                                            }}
                                                                            className="bg-slate-900/90 hover:bg-emerald-600 text-white p-1 rounded-lg transition-transform active:scale-95 cursor-pointer"
                                                                            title="Edit photo"
                                                                        >
                                                                            <Pencil size={12} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemoveGalleryPhoto(idx);
                                                                            }}
                                                                            className="bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-lg transition-transform active:scale-95 cursor-pointer"
                                                                            title="Remove photo"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                    <div 
                                                                        className="h-20 bg-slate-100 overflow-hidden relative"
                                                                        onClick={() => {
                                                                            const tourItems = farmGalleryList.map((g, i) => ({
                                                                                src: g.url,
                                                                                title: g.caption || `Farm Photo ${i + 1}`,
                                                                                caption: g.caption || ''
                                                                            }));
                                                                            openImageModal({
                                                                                src: item.url,
                                                                                title: item.caption || `Farm Photo ${idx + 1}`,
                                                                                gallery: tourItems,
                                                                                currentIndex: idx
                                                                            });
                                                                        }}
                                                                    >
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
        </React.Fragment>
    );
}
