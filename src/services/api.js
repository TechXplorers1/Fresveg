// API Client for PostgreSQL Backend Server

const API_BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('fresveg_jwt_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth & User Profile API (PostgreSQL + JWT)
  loginUser: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerUser: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getAuthMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  getUserProfile: (uid) => request(`/auth/user/${uid}`),
  saveUserRole: (uid, role) => request('/auth/save-role', { method: 'POST', body: JSON.stringify({ uid, role }) }),
  updateUserRole: (uid, role) => request(`/auth/users/${uid}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateUserProfile: (uid, profileData) => request(`/auth/user/${uid}`, { method: 'PUT', body: JSON.stringify(profileData) }),
  getPublicShops: () => request('/auth/public-shops'),

  // Products API
  getProducts: () => request('/products'),
  addProduct: (productData) => request('/products', { method: 'POST', body: JSON.stringify(productData) }),
  updateProduct: (id, productData) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Categories API
  getCategories: () => request('/products/categories'),
  addCategory: (name, image) => request('/products/categories', { method: 'POST', body: JSON.stringify({ name, image }) }),
  updateCategory: (oldName, name, image) => request(`/products/categories/${encodeURIComponent(oldName)}`, { method: 'PUT', body: JSON.stringify({ name, image }) }),
  deleteCategory: (name) => request(`/products/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Cart API
  getCart: (userId) => request(`/carts/${userId}`),
  saveCart: (userId, items, address) => request(`/carts/${userId}`, { method: 'POST', body: JSON.stringify({ items, address }) }),

  // Orders API
  getAllOrders: () => request('/orders'),
  getUserOrders: (userId) => request(`/orders/user/${userId}`),
  getOrderById: (orderId) => request(`/orders/${orderId}`),
  placeOrder: (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  updateOrderStatus: (orderId, status, extraFields = {}) => request(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status, ...extraFields }) }),
  updateDeliveryLocation: (orderId, lat, lng) => request(`/orders/${orderId}/location`, { method: 'PUT', body: JSON.stringify({ lat, lng }) }),

  // Notifications API
  getNotifications: (userId) => request(`/notifications/user/${userId}`),
  createNotification: (notifData) => request('/notifications', { method: 'POST', body: JSON.stringify(notifData) }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (userId) => request(`/notifications/user/${userId}/read-all`, { method: 'PUT' }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  // Farms API
  getFarms: () => request('/farms'),
  getFarmById: (id) => request(`/farms/${id}`),
  saveFarm: (farmData) => request('/farms', { method: 'POST', body: JSON.stringify(farmData) }),
  deleteFarm: (id) => request(`/farms/${id}`, { method: 'DELETE' }),
  getFarmBookings: () => request('/farms/bookings/all'),
  createFarmBooking: (bookingData) => request('/farms/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  deleteFarmBooking: (bookingId) => request(`/farms/bookings/${bookingId}`, { method: 'DELETE' }),
  getFarmReviews: (farmId) => request(`/farms/${farmId}/reviews`),
  addFarmReview: (farmId, reviewData) => request(`/farms/${farmId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),
  createFarmReview: (reviewData) => request(`/farms/${reviewData.farmId || reviewData.farm_id}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) }),
  deleteFarmReview: (reviewId) => request(`/farms/reviews/${reviewId}`, { method: 'DELETE' })
};
