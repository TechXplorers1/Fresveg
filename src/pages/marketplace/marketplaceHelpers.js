// ============================================================================
// Marketplace Helper Utilities
// ============================================================================

import { VITAMINS_LIST, CITY_COORDINATES } from './marketplaceConstants';

/**
 * Derives a clean URL slug for a farm object.
 * @param {object} farm - Farm object
 * @returns {string} Hyphenated slug
 */
export function getFarmSlug(farm) {
  if (!farm) return '';
  const raw = farm.farmName || farm.name || farm.id || '';
  return String(raw).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

/**
 * Normalizes lookup strings for fuzzy matching (lowercase, no non-alphanumeric chars).
 * @param {string} value
 * @returns {string}
 */
export const normalizeLookupText = (value) => {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
};

/**
 * Analyzes product data or description to return associated vitamin tags.
 * @param {object} product - Product data
 * @returns {string[]} List of vitamin names (e.g., ['Vitamin A', 'Vitamin C'])
 */
export const getVitaminsForProduct = (product) => {
  if (!product) return [];

  // Direct array property
  if (Array.isArray(product.vitamins) && product.vitamins.length > 0) {
    return product.vitamins;
  }
  // Comma-separated string property
  if (typeof product.vitamins === 'string' && product.vitamins.trim() !== '') {
    return product.vitamins.split(',').map((v) => v.trim());
  }
  // Singular vitamin property
  if (product.vitamin) {
    if (Array.isArray(product.vitamin)) return product.vitamin;
    return [String(product.vitamin)];
  }

  // Text-based natural inference from title / description / category
  const text = `${product.name || ''} ${product.category || ''} ${product.features || ''} ${product.description || ''}`.toLowerCase();
  const found = new Set();

  if (/carrot|tomato|spinach|mango|capsicum|sweet potato|butter|milk|cheese|paneer|yogurt|papaya|pumpkin|leafy/i.test(text)) {
    found.add('Vitamin A');
  }
  if (/banana|potato|garlic|onion|milk|cheese|paneer|yogurt|mushroom|corn|spinach|pea|lentil|beans/i.test(text)) {
    found.add('Vitamin B');
  }
  if (/strawberry|strawberries|orange|citrus|tomato|broccoli|capsicum|apple|lemon|guava|kiwi|berry|pineapple/i.test(text)) {
    found.add('Vitamin C');
  }
  if (/milk|butter|cheese|paneer|yogurt|dairy|mushroom|egg|fortified/i.test(text)) {
    found.add('Vitamin D');
  }
  if (/spinach|mango|broccoli|capsicum|almond|nut|oil|seed|avocado|kiwi/i.test(text)) {
    found.add('Vitamin E');
  }
  if (/spinach|broccoli|tomato|brinjal|eggplant|strawberry|strawberries|apple|cabbage|lettuce|green/i.test(text)) {
    found.add('Vitamin K');
  }

  // Explicit keyword matches
  if (/vitamin\s*a/i.test(text)) found.add('Vitamin A');
  if (/vitamin\s*b/i.test(text)) found.add('Vitamin B');
  if (/vitamin\s*c/i.test(text)) found.add('Vitamin C');
  if (/vitamin\s*d/i.test(text)) found.add('Vitamin D');
  if (/vitamin\s*e/i.test(text)) found.add('Vitamin E');
  if (/vitamin\s*k/i.test(text)) found.add('Vitamin K');

  // Deterministic fallback based on product ID / name hash
  if (found.size === 0) {
    const hash = String(product.id || product.name || 'prod').charCodeAt(0);
    const vit1 = VITAMINS_LIST[hash % VITAMINS_LIST.length];
    const vit2 = VITAMINS_LIST[(hash + 2) % VITAMINS_LIST.length];
    found.add(vit1);
    found.add(vit2);
  }

  return Array.from(found);
};

/**
 * Extracts shops array from user profile object.
 * @param {object} userObj - User or profile object
 * @returns {Array} List of shops
 */
export const extractShops = (userObj) => {
  if (!userObj) return [];
  if (Array.isArray(userObj.shops)) return userObj.shops;
  if (userObj.shops && typeof userObj.shops === 'object') {
    return Object.values(userObj.shops);
  }
  return [];
};

/**
 * Formats ISO timestamp to human-readable date string.
 * @param {string} isoString
 * @returns {string|null}
 */
export const formatUpdatedTime = (isoString) => {
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

/**
 * Builds normalized social links object with fallbacks.
 * @param {object} source - Object containing socialLinks
 * @returns {object} { instagram, facebook, youtube, whatsapp, website }
 */
export const buildSocialLinks = (source) => {
  const raw = source?.socialLinks || source || {};
  if (raw && typeof raw === 'object') {
    const normalizeValue = (field) => {
      const value = raw[field];
      return typeof value === 'string' ? value.trim() : '';
    };

    return {
      instagram: normalizeValue('instagram'),
      facebook: normalizeValue('facebook'),
      youtube: normalizeValue('youtube'),
      whatsapp: normalizeValue('whatsapp'),
      website: normalizeValue('website')
    };
  }

  return { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' };
};

/**
 * Resolves social links for a shop or farm by combining direct properties and public shop directory.
 * @param {object} shopOrFarm
 * @param {object} publicShopsData
 * @returns {object}
 */
export const resolveShopSocialLinks = (shopOrFarm, publicShopsData) => {
  if (!shopOrFarm) return { instagram: '', facebook: '', youtube: '', whatsapp: '', website: '' };

  const name = shopOrFarm.name || shopOrFarm.shopName || shopOrFarm.farmName || shopOrFarm.vendorName || 'Organic Shop';
  const direct = buildSocialLinks(shopOrFarm);

  let matchedPublic = {};
  if (publicShopsData && typeof publicShopsData === 'object') {
    const targetName = normalizeLookupText(name);
    const targetVendorId = shopOrFarm.vendorId || shopOrFarm.uid;

    Object.entries(publicShopsData).forEach(([vUid, vShops]) => {
      const shopsArr = Array.isArray(vShops) ? vShops : Object.values(vShops || {});
      if (targetVendorId && vUid === targetVendorId) {
        shopsArr.forEach((s) => {
          const sSocials = buildSocialLinks(s);
          matchedPublic = { ...sSocials, ...matchedPublic };
        });
      }
      shopsArr.forEach((s) => {
        const sName = normalizeLookupText(s.shopName || s.name || s.farmName);
        if (targetName && sName && (targetName === sName || targetName.includes(sName) || sName.includes(targetName))) {
          const sSocials = buildSocialLinks(s);
          matchedPublic = { ...sSocials, ...matchedPublic };
        }
      });
    });
  }

  return {
    instagram: direct.instagram || matchedPublic.instagram || '',
    facebook: direct.facebook || matchedPublic.facebook || '',
    youtube: direct.youtube || matchedPublic.youtube || '',
    whatsapp: direct.whatsapp || matchedPublic.whatsapp || '',
    website: direct.website || matchedPublic.website || ''
  };
};

/**
 * Haversine Formula: calculates exact geodesic distance in km between two GPS coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Extracts approximate or mapped coordinates for a given location string.
 * @param {string} locationStr
 * @param {object} [coordinatesMap=CITY_COORDINATES]
 * @returns {{ lat: number, lng: number, name: string }}
 */
export const getLocationCoords = (locationStr, coordinatesMap = CITY_COORDINATES) => {
  if (!locationStr) return coordinatesMap.karjat;
  
  if (typeof locationStr === 'object' && locationStr.lat && locationStr.lng) {
    return { lat: Number(locationStr.lat), lng: Number(locationStr.lng), name: locationStr.name || '' };
  }

  // Check if string contains direct lat, lng format e.g. "18.5204, 73.8567"
  const coordMatch = String(locationStr).trim().match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[3]), name: String(locationStr) };
  }

  const locLower = String(locationStr).toLowerCase();

  for (const [key, coords] of Object.entries(coordinatesMap)) {
    const normalizedKey = key.replace(/_/g, ' ');
    if (locLower.includes(normalizedKey) || locLower.includes(key)) return coords;
  }

  // Deterministic coordinate derivation for unmapped towns
  let hash = 0;
  for (let i = 0; i < locLower.length; i++) {
    hash = (hash << 5) - hash + locLower.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = Math.abs(hash % 100) / 1000;
  const lngOffset = Math.abs((hash >> 2) % 100) / 1000;
  return { lat: 18.9107 + latOffset, lng: 73.3282 + lngOffset, name: locationStr };
};

/**
 * Calculates distance in km from current user location (GPS or reference city) to shop/farm address.
 * @param {string} locationStr
 * @param {object|null} userGpsCoords
 * @param {object} [coordinatesMap=CITY_COORDINATES]
 * @returns {number} Distance in km
 */
export const getShopDistanceKm = (locationStr, userGpsCoords, coordinatesMap = CITY_COORDINATES) => {
  const targetCoords = getLocationCoords(locationStr, coordinatesMap);

  if (userGpsCoords && userGpsCoords.lat && userGpsCoords.lng) {
    const dist = calculateHaversineDistance(
      userGpsCoords.lat,
      userGpsCoords.lng,
      targetCoords.lat,
      targetCoords.lng
    );
    return Math.max(0.8, Number(dist.toFixed(1)));
  }

  const refCoords = coordinatesMap.karjat;
  const dist = calculateHaversineDistance(
    refCoords.lat,
    refCoords.lng,
    targetCoords.lat,
    targetCoords.lng
  );
  return Math.max(1.2, Number(dist.toFixed(1)));
};
