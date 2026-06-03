import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ExternalLink, Navigation, Store, Clock, Ruler, AlertCircle, Loader, Bike } from 'lucide-react';

// ─── Haversine Distance Formula ───────────────────────────────────────────────
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

// ─── Estimated delivery time (road factor ≈ 1.4×, city speed 30 km/h) ───────────
function estimateDelivery(distKm) {
  const roadKm = distKm * 1.4;
  const minutes = (roadKm / 30) * 60;
  if (minutes < 30) return { label: 'Under 30 mins', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (minutes < 60) return { label: `${Math.round(minutes)} mins`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  const label = mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hr`;
  return { label, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
}

export default function OrderTrackingMap({ 
  vendorLocation, 
  vendorName, 
  deliveryAddress,
  deliveryBoyLocation,
  deliveryBoyName
}) {
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [calcState, setCalcState] = useState('idle');

  // Coords states
  const [vendorCoords, setVendorCoords] = useState(null);
  const [deliveryCoords, setDeliveryCoords] = useState(null);

  // Map DOM and Instance refs
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  
  // Marker/Polyline tracking refs to update on changes
  const markersRef = useRef({ vendor: null, delivery: null, deliveryBoy: null });
  const polylineRef = useRef(null);

  // ── 1. Geocode both addresses & compute distance ────────────────────────────
  useEffect(() => {
    if (!vendorLocation || !deliveryAddress) return;

    setCalcState('loading');
    const run = async () => {
      const vCoords = await geocodeAddress(vendorLocation);
      // Nominatim rate limiting staggered wait
      await new Promise((r) => setTimeout(r, 1200));
      const dCoords = await geocodeAddress(deliveryAddress);

      if (vCoords && dCoords) {
        setVendorCoords(vCoords);
        setDeliveryCoords(dCoords);

        const km = haversineKm(vCoords.lat, vCoords.lon, dCoords.lat, dCoords.lon);
        setDistanceInfo({ km: km.toFixed(1), eta: estimateDelivery(km) });
        setCalcState('done');
      } else {
        setCalcState('error');
      }
    };
    run();
  }, [vendorLocation, deliveryAddress]);

  // ── 2. Initialize Leaflet Map ────────────────────────────────────────────────
  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    if (!mapInstance.current) {
      console.log("Initializing Leaflet map...");
      mapInstance.current = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false
      }).setView([20.5937, 78.9629], 5); // Default center on India

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapInstance.current);
    }

    // Cleanup map instance on unmount
    return () => {
      if (mapInstance.current) {
        console.log("Cleaning up Leaflet map instance...");
        mapInstance.current.remove();
        mapInstance.current = null;
        markersRef.current = { vendor: null, delivery: null, deliveryBoy: null };
        polylineRef.current = null;
      }
    };
  }, []);

  // ── 3. Render and Update Map Markers & Route dynamically ─────────────────────
  useEffect(() => {
    if (!window.L || !mapInstance.current) return;

    const L = window.L;
    const activePositions = [];

    // 3a. Shop Marker
    if (vendorCoords) {
      const pos = [vendorCoords.lat, vendorCoords.lon];
      if (markersRef.current.vendor) {
        markersRef.current.vendor.setLatLng(pos);
      } else {
        const shopHtml = `
          <div class="pulse-ring-container">
            <div class="w-10 h-10 rounded-full bg-green-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4-4h12l4 4"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            </div>
          </div>
        `;
        const icon = L.divIcon({ html: shopHtml, className: 'custom-leaflet-marker', iconSize: [40, 40], iconAnchor: [20, 20] });
        markersRef.current.vendor = L.marker(pos, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<strong>${vendorName || 'Shop Pickup'}</strong><br/><span class="text-xs text-gray-500">${vendorLocation}</span>`);
      }
      activePositions.push(pos);
    }

    // 3b. Customer Delivery Location Marker
    if (deliveryCoords) {
      const pos = [deliveryCoords.lat, deliveryCoords.lon];
      if (markersRef.current.delivery) {
        markersRef.current.delivery.setLatLng(pos);
      } else {
        const homeHtml = `
          <div class="pulse-ring-container">
            <div class="w-10 h-10 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
          </div>
        `;
        const icon = L.divIcon({ html: homeHtml, className: 'custom-leaflet-marker', iconSize: [40, 40], iconAnchor: [20, 20] });
        markersRef.current.delivery = L.marker(pos, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<strong>Your Address</strong><br/><span class="text-xs text-gray-500">${deliveryAddress}</span>`);
      }
      activePositions.push(pos);
    }

    // 3c. Live Delivery Boy pulsing marker
    if (deliveryBoyLocation && deliveryBoyLocation.lat && deliveryBoyLocation.lng) {
      const pos = [deliveryBoyLocation.lat, deliveryBoyLocation.lng];
      if (markersRef.current.deliveryBoy) {
        markersRef.current.deliveryBoy.setLatLng(pos);
      } else {
        const bikeHtml = `
          <div class="pulse-ring-container">
            <div class="pulse-ring"></div>
            <div class="w-11 h-11 rounded-full bg-orange-500 border-2 border-white shadow-xl flex items-center justify-center text-white z-20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14H7.5L4 10h5.5l1.5 2.5 3.5-3.5 1.5 1.5-1.5 2.5H19"/></svg>
            </div>
          </div>
        `;
        const icon = L.divIcon({ html: bikeHtml, className: 'custom-leaflet-marker', iconSize: [48, 48], iconAnchor: [24, 24] });
        markersRef.current.deliveryBoy = L.marker(pos, { icon })
          .addTo(mapInstance.current)
          .bindPopup(`<strong>${deliveryBoyName || 'Delivery Rider'} (Live)</strong><br/><span class="text-xs text-gray-400">Sharing location live</span>`)
          .openPopup();
      }
      activePositions.push(pos);
    } else {
      // Clean up bike marker if live coordinates stop
      if (markersRef.current.deliveryBoy) {
        markersRef.current.deliveryBoy.remove();
        markersRef.current.deliveryBoy = null;
      }
    }

    // 3d. Draw Dash Polyline connecting positions
    if (activePositions.length > 1) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(activePositions);
      } else {
        polylineRef.current = L.polyline(activePositions, {
          color: '#4f46e5', // indigo route line
          dashArray: '8, 8',
          weight: 4,
          opacity: 0.8
        }).addTo(mapInstance.current);
      }
    } else {
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
    }

    // 3e. Autocentering Bounds
    if (activePositions.length > 0) {
      mapInstance.current.fitBounds(activePositions, {
        padding: [50, 50],
        maxZoom: 16
      });
    }
  }, [vendorCoords, deliveryCoords, deliveryBoyLocation, vendorName, vendorLocation, deliveryAddress, deliveryBoyName]);

  // ── External Route Maps Redirect ──────────────────────────────────────────
  const buildExternalUrl = () => {
    if (vendorLocation && deliveryAddress) {
      return `https://www.google.com/maps/dir/${encodeURIComponent(vendorLocation)}/${encodeURIComponent(deliveryAddress)}`;
    }
    const q = deliveryAddress || vendorLocation;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };

  const externalUrl = buildExternalUrl();
  const hasRoute = vendorLocation && deliveryAddress;

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
              <span>Could not calculate distance — addresses may be too vague. Open Google Maps for exact navigation.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Active Status and External Link controls ─────────────────────────── */}
      <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold px-2 py-1 bg-white border rounded-xl shadow-xs">
          <span className={`w-2 h-2 rounded-full ${deliveryBoyLocation ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          {deliveryBoyLocation ? 'Live Tracking Active' : 'Base Route Ready'}
        </div>

        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-brand border border-brand/20 px-3 py-1.5 rounded-xl bg-white hover:bg-brand/5 transition-colors shadow-xs"
          >
            <ExternalLink size={11} />
            Get Maps Directions
          </a>
        )}
      </div>

      {/* ── Interactive Map Container ──────────────────────────────────────── */}
      <div className="relative" style={{ height: '350px' }}>
        {/* DOM element where Leaflet initializes */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-full" 
          style={{ background: '#f3f4f6' }}
        />
        
        {/* Loading overlay if geocoding is ongoing */}
        {calcState === 'loading' && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-[500] flex flex-col items-center justify-center gap-2">
            <Loader size={32} className="animate-spin text-brand" />
            <p className="text-xs font-bold text-gray-500">Plotting live tracking points...</p>
          </div>
        )}
      </div>

      {/* ── Legend Banner ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-5 px-4 py-3 bg-white border-t border-gray-100 text-[10px] font-bold text-gray-500 flex-wrap uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Vendor Pickup
        </div>
        {deliveryBoyLocation && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block animate-pulse" /> Delivery Partner (Live)
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Your Location
        </div>
      </div>

    </div>
  );
}
