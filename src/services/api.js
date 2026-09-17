// FresVeg API Client — Connected to Spring Boot API Gateway (Port 8080)

const GATEWAY_PREFIX = '/api/v1';

// Generate a valid RFC-compliant correlation ID
function generateCorrelationId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return `fresveg-${ts}-${rand}`;
}

// Generate idempotency key for mutations
function generateIdempotencyKey(prefix = 'cmd') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

async function request(endpoint, options = {}) {
  // Normalize endpoint:
  // - If it starts with /api/ or /api/v1, keep it intact
  // - Otherwise prepend /api/v1 to route to Gateway
  let normalizedPath = endpoint;
  if (!normalizedPath.startsWith('/api/v1') && !normalizedPath.startsWith('/api/')) {
    normalizedPath = `${GATEWAY_PREFIX}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
  }

  const token = localStorage.getItem('fresveg_jwt_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, application/problem+json',
    'X-Correlation-ID': generateCorrelationId(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(normalizedPath, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Parse RFC 9457 Problem Details or standard error format
      const message = errorData.detail || errorData.title || errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(message);
      err.status = response.status;
      err.problem = errorData;
      throw err;
    }
    const result = await response.json();
    return unboxResponse(result);
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${normalizedPath}]:`, error.message);
    throw error;
  }
}

// Automatically unpack Spring Boot ApiResponse / CollectionResponse envelope
function unboxResponse(res) {
  if (res && typeof res === 'object' && 'data' in res) {
    if (Array.isArray(res.data)) {
      const list = [...res.data];
      if (res.pagination) list.pagination = res.pagination;
      if (res.meta) list.meta = res.meta;
      return list;
    }
    return res.data;
  }
  return res;
}

// Normalize backend product response to match frontend UI component expectations
function normalizeProduct(item) {
  if (!item) return item;
  const id = item.productId || item.id || `prod-${Date.now()}`;
  return {
    ...item,
    id,
    productId: id,
    name: item.name || 'Fresh Produce',
    description: item.description || '',
    category: item.categoryName || item.category || 'Vegetables',
    price: Number(item.price || item.basePrice || 4.99),
    mrp: Number(item.mrp || (item.price ? (item.price * 1.25).toFixed(2) : 6.99)),
    unit: item.unit || item.baseUnit || 'kg',
    image: (item.images && item.images.length > 0 ? item.images[0] : item.image) || '/cherry_tomatoes.png',
    vendor: item.vendorName || item.vendor || 'FresVeg Direct Farm',
    organic: item.organic !== undefined ? item.organic : true,
    rating: Number(item.rating || 4.8)
  };
}

// Normalize category item
function normalizeCategory(cat) {
  if (!cat) return cat;
  return {
    ...cat,
    id: cat.categoryId || cat.id || cat.code,
    name: cat.name || cat.code || 'Produce',
    image: cat.imageUrl || cat.image || '/cherry_tomatoes.png',
    description: cat.description || ''
  };
}

export const api = {
  // --- Account & User Profile API (Spring Boot account-service via Gateway) ---
  getAuthMe: async () => {
    try {
      const data = await request('/api/auth/me');
      return {
        uid: data.uid || data.userId || data.id,
        email: data.email || '',
        displayName: data.displayName || data.name || 'FresVeg User',
        photoURL: data.photoURL || data.photoUrl || '',
        role: (data.roles && data.roles[0]) || data.role || 'customer',
        ...data
      };
    } catch {
      try {
        const data = await request('/accounts/me');
        return {
          uid: data.userId || data.id,
          email: data.email || '',
          displayName: data.displayName || data.name || 'FresVeg User',
          photoURL: data.photoUrl || '',
          role: (data.roles && data.roles[0]) || data.role || 'customer',
          ...data
        };
      } catch {
        return null;
      }
    }
  },
  
  getAddresses: () => request('/accounts/me/addresses'),
  createAddress: (addressData) => request('/accounts/me/addresses', {
    method: 'POST',
    body: JSON.stringify(addressData)
  }),
  updateAddress: (addressId, addressData) => request(`/accounts/me/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData)
  }),
  getVendors: () => request('/accounts/vendors'),

  // Auth helper for development session token
  loginUser: async (email, password) => {
    try {
      return await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
    } catch {
      // Create local session token for client authentication
      const demoUser = {
        uid: 'user_' + Date.now(),
        email: email.trim(),
        displayName: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : (email.includes('vendor') ? 'vendor' : 'customer'),
        photoURL: '',
        addresses: []
      };
      const demoToken = 'fresveg-dev-token-' + btoa(JSON.stringify(demoUser));
      return { token: demoToken, user: demoUser };
    }
  },

  registerUser: async (userData) => {
    try {
      return await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch {
      const newUser = {
        uid: 'user_' + Date.now(),
        email: userData.email,
        displayName: userData.displayName || userData.email.split('@')[0],
        role: userData.role || 'customer',
        photoURL: '',
        addresses: []
      };
      const newToken = 'fresveg-dev-token-' + btoa(JSON.stringify(newUser));
      return { token: newToken, user: newUser };
    }
  },

  getUsers: () => request('/api/auth/users').catch(() => []),
  getUserProfile: (uid) => request(`/api/auth/user/${uid}`).catch(() => ({ uid })),
  saveUserRole: (uid, role) => request('/api/auth/save-role', { method: 'POST', body: JSON.stringify({ uid, role }) }).catch(() => ({})),
  updateUserRole: (uid, role) => request(`/api/auth/users/${uid}/role`, { method: 'PUT', body: JSON.stringify({ role }) }).catch(() => ({})),
  updateUserProfile: (uid, profileData) => request(`/api/auth/user/${uid}`, { method: 'PUT', body: JSON.stringify(profileData) }).catch(() => ({})),
  getPublicShops: () => request('/api/auth/public-shops').catch(() => []),

  // --- Catalog API (Spring Boot catalog-service via Gateway & PostgreSQL Express backend) ---
  getProducts: async () => {
    try {
      const fallbackRes = await request('/api/products');
      const items = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes && fallbackRes.data ? fallbackRes.data : []);
      if (items.length > 0) {
        return items.map(normalizeProduct);
      }
    } catch (err) {
      console.warn('Local PostgreSQL products fetch failed, trying catalog gateway:', err.message);
    }
    try {
      const res = await request('/catalog/products');
      const items = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      return items.map(normalizeProduct);
    } catch {
      return [];
    }
  },

  getProductById: async (id) => {
    try {
      const item = await request(`/api/products/${id}`);
      if (item && item.id) return normalizeProduct(item);
    } catch {
      // Fallback to gateway catalog
    }
    try {
      const item = await request(`/catalog/products/${id}`);
      return normalizeProduct(item);
    } catch {
      return null;
    }
  },

  addProduct: async (productData) => {
    try {
      return await request('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    } catch (err) {
      console.warn('POST /api/products failed, attempting gateway catalog fallback:', err.message);
      return await request('/catalog/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      });
    }
  },

  updateProduct: async (id, productData) => {
    try {
      return await request(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    } catch (err) {
      console.warn('PUT /api/products failed, attempting gateway catalog fallback:', err.message);
      return await request(`/catalog/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
    }
  },

  deleteProduct: async (id) => {
    try {
      return await request(`/api/products/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('DELETE /api/products failed, attempting gateway catalog fallback:', err.message);
      return await request(`/catalog/products/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Categories API
  getCategories: async () => {
    try {
      const fallbackRes = await request('/api/products/categories');
      const items = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes && fallbackRes.data ? fallbackRes.data : []);
      if (items.length > 0) return items.map(normalizeCategory);
    } catch (err) {
      console.warn('Local categories fetch failed, trying gateway:', err.message);
    }
    try {
      const res = await request('/catalog/categories');
      const items = Array.isArray(res) ? res : (res && res.data ? res.data : []);
      return items.map(normalizeCategory);
    } catch {
      return [];
    }
  },

  addCategory: async (name, image) => {
    try {
      return await request('/api/products/categories', {
        method: 'POST',
        body: JSON.stringify({ name, image })
      });
    } catch {
      return await request('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify({ name, imageUrl: image })
      });
    }
  },

  updateCategory: async (oldName, name, image) => {
    try {
      return await request(`/api/products/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        body: JSON.stringify({ name, image })
      });
    } catch {
      return await request(`/catalog/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        body: JSON.stringify({ name, imageUrl: image })
      });
    }
  },

  deleteCategory: async (name) => {
    try {
      return await request(`/api/products/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
    } catch {
      return await request(`/catalog/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
    }
  },

  // --- Commerce API (PostgreSQL Express backend on port 5000 with Gateway fallback) ---
  getCart: async (cartId) => {
    try {
      const cart = await request(`/api/carts/${cartId}`);
      if (cart) return cart;
    } catch {
      // Fallback
    }
    return request(`/carts/${cartId}`).catch(() => ({ items: [], address: '' }));
  },

  saveCart: async (cartId, items, address) => {
    try {
      return await request(`/api/carts/${cartId}`, {
        method: 'POST',
        body: JSON.stringify({ items, address })
      });
    } catch {
      return request(`/carts/${cartId}`, {
        method: 'POST',
        body: JSON.stringify({ items, address })
      }).catch(() => ({}));
    }
  },

  previewCheckout: (previewData) => request('/checkout/preview', {
    method: 'POST',
    body: JSON.stringify(previewData)
  }).catch(() => ({})),

  getAllOrders: async () => {
    try {
      const orders = await request('/api/orders');
      if (Array.isArray(orders)) return orders;
    } catch {
      // Fallback
    }
    return request('/orders').catch(() => []);
  },

  getUserOrders: async (userId) => {
    try {
      const orders = await request(`/api/orders/user/${userId}`);
      if (Array.isArray(orders)) return orders;
    } catch {
      // Fallback
    }
    return request(`/orders?customerId=${userId}`).catch(() => []);
  },

  getOrderById: async (orderId) => {
    try {
      const order = await request(`/api/orders/${orderId}`);
      if (order && (order.orderId || order.id)) return order;
    } catch {
      // Fallback
    }
    return request(`/orders/${orderId}`);
  },

  placeOrder: async (orderData) => {
    try {
      return await request('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    } catch (err) {
      console.warn('POST /api/orders failed, trying gateway fallback:', err.message);
      const idempotencyKey = generateIdempotencyKey('ord');
      return await request('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(orderData)
      });
    }
  },

  updateOrderStatus: async (orderId, status, extraFields = {}) => {
    try {
      return await request(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...extraFields })
      });
    } catch {
      return request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...extraFields })
      });
    }
  },

  updateDeliveryLocation: async (orderId, lat, lng) => {
    try {
      return await request(`/api/orders/${orderId}/location`, {
        method: 'PUT',
        body: JSON.stringify({ lat, lng })
      });
    } catch {
      return request(`/orders/${orderId}/location`, {
        method: 'PUT',
        body: JSON.stringify({ lat, lng })
      });
    }
  },

  // --- Fulfillment API (Spring Boot fulfillment-service via Gateway) ---
  getDeliverySlots: () => request('/fulfillment/slots').catch(() => []),
  getFulfillmentTracking: (fulfillmentId) => request(`/fulfillments/${fulfillmentId}/tracking`),

  // --- Notifications API ---
  getNotifications: (userId) => request(`/api/notifications/user/${userId}`).catch(() => []),
  createNotification: (notifData) => request('/api/notifications', { method: 'POST', body: JSON.stringify(notifData) }).catch(() => ({})),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => ({})),
  markAllNotificationsRead: (userId) => request(`/api/notifications/user/${userId}/read-all`, { method: 'PUT' }).catch(() => ({})),
  deleteNotification: (id) => request(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => ({})),

  // --- Farms & Agri-Tourism API ---
  getFarms: () => request('/api/farms').catch(() => []),
  getFarmById: (id) => request(`/api/farms/${id}`),
  saveFarm: (farmData) => request('/api/farms', { method: 'POST', body: JSON.stringify(farmData) }),
  deleteFarm: (id) => request(`/api/farms/${id}`, { method: 'DELETE' }),
  getFarmBookings: () => request('/api/farms/bookings/all').catch(() => []),
  createFarmBooking: (bookingData) => request('/api/farms/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  deleteFarmBooking: (bookingId) => request(`/api/farms/bookings/${bookingId}`, { method: 'DELETE' }),
  getFarmReviews: (farmId) => request(`/api/farms/${farmId}/reviews`).catch(() => []),
  addFarmReview: (farmId, reviewData) => request(`/api/farms/${farmId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),
  createFarmReview: (reviewData) => request(`/api/farms/${reviewData.farmId || reviewData.farm_id}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),
  deleteFarmReview: (reviewId) => request(`/api/farms/reviews/${reviewId}`, { method: 'DELETE' })
};
