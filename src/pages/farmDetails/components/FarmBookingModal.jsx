import React from 'react';
import { Calendar, Minus, Plus, X, Loader2, AlertTriangle } from 'lucide-react';
import ModernDatePicker from '../../../components/common/ModernDatePicker';

/**
 * FarmBookingModal Component
 * Handles booking farm visit slots, guest count, accommodation selection, and total pricing calculation.
 */
export default function FarmBookingModal({
  showBookingModal,
  setShowBookingModal,
  farm,
  bookingDate,
  setBookingDate,
  visitorsCount,
  setVisitorsCount,
  includeStay,
  setIncludeStay,
  selectedAccommodation,
  setSelectedAccommodation,
  selectedRoomsCount,
  setSelectedRoomsCount,
  submittingBooking,
  bookingSuccess,
  handleConfirmBooking,
  isFullyBooked,
  availableSlotsForDate,
  bookedCountForDate,
  DAILY_MAX_CAPACITY = 30,
  isFree = false,
  existingFarmBookings = []
}) {
  if (!showBookingModal || !farm) return null;

  // Helper to normalize any date string to YYYY-MM-DD
  const normalizeDateStr = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return s;
  };

  const cleanTitle = (t) => (t || '').toLowerCase().replace(/\(.*?\)/g, '').trim();

  const getBookedRoomsForAcc = (accTitle, targetDate) => {
    if (!targetDate) return 0;
    const normTarget = normalizeDateStr(targetDate);
    const cleanTargetAcc = cleanTitle(accTitle);

    return (existingFarmBookings || [])
      .filter(b => {
        if (b.status === 'cancelled') return false;
        const bDate = normalizeDateStr(b.date || b.visitDate);
        if (bDate !== normTarget) return false;
        if (!b.includeStay && b.include_stay !== true) return false;

        const bTitle = cleanTitle(b.accommodationTitle || b.accommodation_title);
        if (!cleanTargetAcc || !bTitle) return true;
        return bTitle === cleanTargetAcc || bTitle.includes(cleanTargetAcc) || cleanTargetAcc.includes(bTitle);
      })
      .reduce((sum, b) => {
        const rooms = Number(b.roomsBooked || b.rooms_booked || 1);
        return sum + (rooms > 0 ? rooms : 1);
      }, 0);
  };

  const accList = farm?.accommodations && farm.accommodations.length > 0 ? farm.accommodations : [];

  const allRoomsUnavailableOnDate = Boolean(
    bookingDate &&
    accList.length > 0 &&
    accList.every(acc => {
      const maxRooms = Math.max(1, parseInt(String(acc.roomQuantity || '').replace(/[^0-9]/g, '')) || 1);
      const bookedRooms = getBookedRoomsForAcc(acc.title, bookingDate);
      return bookedRooms >= maxRooms;
    })
  );

  // Automatically deselect stay option if date changes to an unavailable date
  React.useEffect(() => {
    if (!bookingDate || !includeStay) return;
    const currentAcc = accList.find(a => a.title === selectedAccommodation) || accList[0];
    if (currentAcc) {
      const maxRooms = Math.max(1, parseInt(String(currentAcc.roomQuantity || '').replace(/[^0-9]/g, '')) || 1);
      const bookedRooms = getBookedRoomsForAcc(currentAcc.title, bookingDate);
      if (bookedRooms >= maxRooms) {
        setIncludeStay(false);
        setSelectedAccommodation('');
        setSelectedRoomsCount(1);
      }
    }
  }, [bookingDate, existingFarmBookings]);

  const selectedAccObj = accList.find(a => a.title === selectedAccommodation) || accList[0];
  const selectedAccMaxRooms = selectedAccObj ? Math.max(1, parseInt(String(selectedAccObj.roomQuantity || '').replace(/[^0-9]/g, '')) || 1) : 1;
  const selectedAccBookedRooms = bookingDate && selectedAccObj ? getBookedRoomsForAcc(selectedAccObj.title, bookingDate) : 0;
  const isSelectedAccUnavailable = bookingDate ? (selectedAccMaxRooms - selectedAccBookedRooms) <= 0 : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-sm transition-opacity duration-300 overflow-hidden"
      onClick={() => setShowBookingModal(false)}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col transform transition-all scale-100 duration-300 text-left border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleConfirmBooking} className="flex flex-col h-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden">

          {/* Header (Sticky Top) */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-50 p-2 rounded-2xl text-emerald-600 border border-emerald-100">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 font-headings">Book Farm Visit Slot</h3>
                <p className="text-xs text-slate-400 font-medium font-body truncate max-w-[200px]">{farm.farmName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBookingModal(false)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body (Scrollable Middle Container) */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl animate-bounce">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-slate-800 font-headings">Booking Confirmed!</h4>
                <p className="text-xs text-slate-500 font-body">Your farm visit slot has been reserved successfully.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Select Date of Visit <span className="text-emerald-600">*</span></label>
                  <ModernDatePicker
                    value={bookingDate}
                    onChange={(val) => setBookingDate(val)}
                    minDate={new Date().toISOString().split('T')[0]}
                    visitDays={farm?.visitDays}
                    visitTimings={farm?.visitTimings}
                    placeholder="Pick visit date..."
                  />
                  {bookingDate && (
                    <>
                      <div className={`mt-2.5 p-3 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs ${isFullyBooked
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : availableSlotsForDate < 10
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                        <span>
                          {isFullyBooked
                            ? `🔴 Fully Booked (${bookedCountForDate}/${DAILY_MAX_CAPACITY} Slots filled)`
                            : `🟢 ${availableSlotsForDate} / ${DAILY_MAX_CAPACITY} Visitor Slots Available`}
                        </span>
                        <span className="text-[10px] font-mono opacity-80 uppercase tracking-wider">Max {DAILY_MAX_CAPACITY}/day</span>
                      </div>

                      {allRoomsUnavailableOnDate && (
                        <div className="mt-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between shadow-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="text-base leading-none">⚠️</span>
                            <span>Rooms are unavailable on this day</span>
                          </span>
                          <span className="text-[10px] uppercase font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                            Day Visit Only
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-headings">Number of Visitors / Guests</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setVisitorsCount(Math.max(1, (parseInt(visitorsCount) || 1) - 1))}
                      className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0 cursor-pointer"
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
                      className="w-8 h-8 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-100 active:scale-95 flex-shrink-0 cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Accommodation Included & Stay Selection Field */}
                {(() => {
                  const selectedAccPrice = includeStay
                    ? (selectedAccObj ? (parseFloat(String(selectedAccObj.price || '').replace(/[^0-9.]/g, '')) || 0) : (Number(farm.accommodationPrice) || 0))
                    : 0;

                  const stayTotalCost = includeStay ? (selectedAccPrice * Number(selectedRoomsCount)) : 0;
                  const admissionTotalCost = isFree ? 0 : (Number(farm.costPerPerson) || 0) * Number(visitorsCount);
                  const totalPayableVal = admissionTotalCost + stayTotalCost;

                  return (
                    <>
                      <div className="space-y-2 pt-1 text-left">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-headings">
                          Overnight Stay / Accommodation Option
                        </label>

                        {allRoomsUnavailableOnDate && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2.5 shadow-xs">
                            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                            <div>
                              <span className="font-extrabold block">Rooms are unavailable on this day</span>
                              <span className="text-[11px] font-medium text-rose-600">
                                All rooms are already booked for this date ({bookingDate}). You can still book a Day Visit ticket!
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          {/* Option 1: No Stay (Day Visit Only) */}
                          <div
                            onClick={() => {
                              setIncludeStay(false);
                              setSelectedAccommodation('');
                              setSelectedRoomsCount(1);
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
                          </div>

                          {/* Options 2+: Available Stay Options from Farm */}
                          {accList.map((acc, idx) => {
                            const maxRooms = Math.max(1, parseInt(String(acc.roomQuantity || '').replace(/[^0-9]/g, '')) || 1);
                            const bookedRooms = bookingDate ? getBookedRoomsForAcc(acc.title, bookingDate) : 0;
                            const availableRooms = Math.max(0, maxRooms - bookedRooms);
                            const isAccUnavailable = bookingDate ? availableRooms <= 0 : false;

                            const isAccSelected = includeStay && !isAccUnavailable && (selectedAccommodation === acc.title || (!selectedAccommodation && idx === 0));
                            const accPriceNum = parseFloat(String(acc.price || '').replace(/[^0-9.]/g, '')) || 0;
                            const displayPriceStr = accPriceNum > 0 ? `+₦${accPriceNum}/night` : 'Free Stay';
                            const quantityStr = acc.roomQuantity || '1 Room';
                            const capacityStr = acc.roomCapacity || '2 Persons';

                            if (isAccUnavailable) {
                              return (
                                <div
                                  key={acc.id || idx}
                                  onClick={() => {
                                    alert(`Rooms are unavailable for '${acc.title}' on this day (${bookingDate}). Please choose another date or select 'No Stay (Day Visit Only)'.`);
                                  }}
                                  className="p-3 rounded-2xl border border-rose-200 bg-rose-50/40 text-slate-500 space-y-2 text-xs cursor-not-allowed select-none transition-all shadow-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-4 h-4 rounded-full border-2 border-rose-300 bg-rose-100 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] text-rose-600 font-bold">✕</span>
                                      </div>
                                      <span className="font-bold text-slate-700 font-headings truncate text-xs">
                                        {acc.title}
                                      </span>
                                    </div>

                                    <span className="font-extrabold text-[10px] font-mono px-2 py-0.5 rounded-lg shrink-0 bg-rose-100 text-rose-700 border border-rose-200">
                                      Rooms are unavailable
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 pl-6">
                                    <span className="bg-rose-100/80 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-md border border-rose-200/60 flex items-center gap-1">
                                      🚫 0 Rooms Available (Sold Out)
                                    </span>
                                    <span className="bg-slate-100 text-slate-500 font-medium text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                                      👥 {capacityStr} Capacity
                                    </span>
                                  </div>

                                  <p className="text-[10px] text-rose-600 font-bold pl-6 font-body">
                                    Rooms are unavailable on this day.
                                  </p>
                                </div>
                              );
                            }

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
                                    🚪 {availableRooms} / {quantityStr} Available
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
                                        Max Available: {availableRooms} {availableRooms === 1 ? 'Room' : 'Rooms'}
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
                                        disabled={selectedRoomsCount >= availableRooms}
                                        onClick={() => setSelectedRoomsCount(prev => Math.min(availableRooms, prev + 1))}
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

                      <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-2xl flex flex-col space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-700 font-headings">
                          <span>Total Payable Amount:</span>
                          <span className="text-base font-black text-emerald-700 font-sans">₦{totalPayableVal}</span>
                        </div>
                        {includeStay && (
                          <p className="text-[10px] text-slate-500 font-medium">
                            (Admission: ₦{admissionTotalCost} + Stay: ₦{selectedAccPrice} × {selectedRoomsCount} {selectedRoomsCount === 1 ? 'Room' : 'Rooms'})
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Footer (Sticky Bottom) */}
          {!bookingSuccess && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/90 sticky bottom-0 z-10 shrink-0">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submittingBooking ||
                  isFullyBooked ||
                  (bookingDate && Number(visitorsCount) > availableSlotsForDate) ||
                  (includeStay && isSelectedAccUnavailable)
                }
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                {submittingBooking ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : isFullyBooked ? (
                  'Fully Booked'
                ) : (includeStay && isSelectedAccUnavailable) ? (
                  'Rooms are unavailable on this day'
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
