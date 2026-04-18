import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation, Store, Clock, Ruler, AlertCircle, Loader } from 'lucide-react';

// ─── Haversine Distance Formula ───────────────────────────────────────────────
// Returns straight-line distance between two lat/lng points in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Nominatim Geocoder (OpenStreetMap — free, no API key) ───────────────────
async function geocodeAddress(address) {
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
}

// ─── Estimated delivery time (road factor ≈ 1.4× straight line, speed 30 km/h) ─
function estimateDelivery(distKm) {
  const roadKm = distKm * 1.4;          // approximate road distance
  const minutes = (roadKm / 30) * 60;   // 30 km/h average city speed
  if (minutes < 30) return { label: 'Under 30 mins', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (minutes < 60) return { label: `${Math.round(minutes)} mins`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  const label = mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hr`;
  return { label, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
}

/**
 * OrderTrackingMap
 *
 * Props:
 *  - vendorLocation  {string}  Vendor shop address
 *  - vendorName      {string}  Shop display name
 *  - deliveryAddress {string}  Customer delivery address
 */
export default function OrderTrackingMap({ vendorLocation, vendorName, deliveryAddress }) {
  const [mapMode, setMapMode] = useState('directions'); // 'directions' | 'vendor' | 'delivery'
  const [distanceInfo, setDistanceInfo] = useState(null); // { km, eta }
  const [calcState, setCalcState] = useState('idle');    // 'idle' | 'loading' | 'done' | 'error'

  // ── Geocode both addresses & compute distance ────────────────────────────
  useEffect(() => {
    if (!vendorLocation || !deliveryAddress) return;

    setCalcState('loading');

    const run = async () => {
      // Stagger requests so Nominatim rate-limit (1 req/s) is respected
      const vendorCoords = await geocodeAddress(vendorLocation);
      await new Promise((r) => setTimeout(r, 1100));
      const deliveryCoords = await geocodeAddress(deliveryAddress);

      if (vendorCoords && deliveryCoords) {
        const km = haversineKm(
          vendorCoords.lat, vendorCoords.lon,
          deliveryCoords.lat, deliveryCoords.lon
        );
        setDistanceInfo({ km: km.toFixed(1), eta: estimateDelivery(km) });
        setCalcState('done');
      } else {
        setCalcState('error');
      }
    };

    run();
  }, [vendorLocation, deliveryAddress]);

  // ── Map embed URLs ───────────────────────────────────────────────────────
  const buildEmbedUrl = () => {
    if (mapMode === 'directions' && vendorLocation && deliveryAddress) {
      // Directions view (no API key needed)
      return `https://maps.google.com/maps?saddr=${encodeURIComponent(vendorLocation)}&daddr=${encodeURIComponent(deliveryAddress)}&output=embed`;
    }
    const q = mapMode === 'delivery' ? deliveryAddress : vendorLocation;
    if (!q) return null;
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=14`;
  };

  const buildExternalUrl = () => {
    if (mapMode === 'directions' && vendorLocation && deliveryAddress) {
      return `https://www.google.com/maps/dir/${encodeURIComponent(vendorLocation)}/${encodeURIComponent(deliveryAddress)}`;
    }
    const q = mapMode === 'delivery' ? deliveryAddress : vendorLocation;
    if (!q) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  const embedUrl    = buildEmbedUrl();
  const externalUrl = buildExternalUrl();
  const hasRoute    = vendorLocation && deliveryAddress;

  // ── No location fallback ─────────────────────────────────────────────────
  if (!vendorLocation) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center py-12 text-center px-6">
        <MapPin className="text-gray-300 mb-3" size={40} />
        <p className="text-gray-500 font-medium text-sm">Shop location not available</p>
        <p className="text-gray-400 text-xs mt-1">The vendor hasn't set a location yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg bg-white">

      {/* ── Distance & ETA Banner ──────────────────────────────────────────── */}
      {hasRoute && (
        <div className="px-4 pt-4 pb-3 border-b border-gray-100">
          {calcState === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
              <Loader size={13} className="animate-spin text-brand" />
              <span>Calculating distance from vendor to your location…</span>
            </div>
          )}

          {calcState === 'done' && distanceInfo && (
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Distance */}
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 flex-1">
                <div className="bg-indigo-100 p-2 rounded-xl flex-shrink-0">
                  <Ruler size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Distance</p>
                  <p className="text-lg font-black text-indigo-700 leading-none">{distanceInfo.km} <span className="text-sm font-semibold">km</span></p>
                  <p className="text-[10px] text-indigo-400 mt-0.5">Straight-line distance</p>
                </div>
              </div>

              {/* ETA */}
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 flex-1 border ${distanceInfo.eta.bg} ${distanceInfo.eta.border}`}>
                <div className={`p-2 rounded-xl flex-shrink-0 ${distanceInfo.eta.bg}`} style={{ filter: 'brightness(0.9)' }}>
                  <Clock size={16} className={distanceInfo.eta.color} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${distanceInfo.eta.color} opacity-70`}>Est. Delivery</p>
                  <p className={`text-lg font-black leading-none ${distanceInfo.eta.color}`}>{distanceInfo.eta.label}</p>
                  <p className={`text-[10px] mt-0.5 ${distanceInfo.eta.color} opacity-60`}>Approx. road time</p>
                </div>
              </div>
            </div>
          )}

          {calcState === 'error' && (
            <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
              <AlertCircle size={13} />
              <span>Could not calculate distance — addresses may be too vague. Try the Directions view on Google Maps.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Map Mode Toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-100 flex-wrap">
        {hasRoute && (
          <button
            onClick={() => setMapMode('directions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${mapMode === 'directions' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Navigation size={12} /> Route
          </button>
        )}
        <button
          onClick={() => setMapMode('vendor')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
            ${mapMode === 'vendor' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <Store size={12} /> Vendor Shop
        </button>
        {deliveryAddress && (
          <button
            onClick={() => setMapMode('delivery')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all
              ${mapMode === 'delivery' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <MapPin size={12} /> Delivery
          </button>
        )}

        {/* External link */}
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs font-bold text-brand border border-brand/20 px-3 py-1.5 rounded-xl hover:bg-brand/5 transition-colors"
          >
            <ExternalLink size={11} />
            {mapMode === 'directions' ? 'Get Directions' : 'Open Maps'}
          </a>
        )}
      </div>

      {/* ── Active Location Banner ─────────────────────────────────────────── */}
      {mapMode !== 'directions' && (
        <div className={`flex items-center gap-3 px-4 py-2.5 ${
          mapMode === 'vendor' ? 'bg-green-50 border-b border-green-100' : 'bg-blue-50 border-b border-blue-100'
        }`}>
          <div className={`p-1.5 rounded-full ${mapMode === 'vendor' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {mapMode === 'vendor' ? <Store size={14} /> : <Navigation size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${mapMode === 'vendor' ? 'text-green-600' : 'text-blue-600'}`}>
              {mapMode === 'vendor' ? 'Vendor Shop' : 'Delivery Address'}
            </p>
            <p className="text-xs font-semibold text-gray-800 truncate">
              {mapMode === 'vendor' ? `${vendorName} — ${vendorLocation}` : deliveryAddress}
            </p>
          </div>
        </div>
      )}

      {/* Route label in directions mode */}
      {mapMode === 'directions' && vendorLocation && deliveryAddress && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-gray-600 font-semibold truncate">{vendorName}</span>
          </div>
          <span className="text-indigo-300 font-black flex-shrink-0">→</span>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            <span className="text-gray-600 font-semibold truncate">Your Location</span>
          </div>
        </div>
      )}

      {/* ── Google Maps iFrame ─────────────────────────────────────────────── */}
      {embedUrl ? (
        <div className="relative" style={{ height: '300px' }}>
          <iframe
            title="Order Location Map"
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-56 bg-gray-50">
          <p className="text-gray-400 text-sm">Unable to load map</p>
        </div>
      )}
    </div>
  );
}
