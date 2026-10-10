import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'fresveg';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'fresveg';
const KEYCLOAK_ADMIN_USERNAME = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD || 'local-admin-change-me';

// In-memory cache for admin access token
let cachedAdminToken = null;
let adminTokenExpiry = 0;

// In-memory cache for Keycloak JWKS public keys
let cachedJwks = null;
let jwksLastFetched = 0;

/**
 * Acquire Keycloak Master Admin Access Token for User Management APIs
 */
export async function getAdminAccessToken() {
  const now = Date.now();
  if (cachedAdminToken && now < adminTokenExpiry) {
    return cachedAdminToken;
  }

  const tokenUrl = `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: KEYCLOAK_ADMIN_USERNAME,
      password: KEYCLOAK_ADMIN_PASSWORD
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to get Keycloak admin token:', errorBody);
    throw new Error(`Keycloak Admin Authentication failed: ${response.statusText}`);
  }

  const data = await response.json();
  cachedAdminToken = data.access_token;
  // Cache for 60 seconds less than expires_in
  adminTokenExpiry = now + (data.expires_in - 60) * 1000;
  return cachedAdminToken;
}

/**
 * Fetch and cache Keycloak JWKS public keys
 */
export async function getKeycloakJwks(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedJwks && now - jwksLastFetched < 300000) {
    return cachedJwks;
  }

  const certsUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;
  const response = await fetch(certsUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Keycloak JWKS from ${certsUrl}`);
  }

  cachedJwks = await response.json();
  jwksLastFetched = now;
  return cachedJwks;
}

/**
 * Map application role to Keycloak Realm Role
 */
function mapAppRoleToKeycloakRole(role) {
  const normalized = (role || 'customer').toLowerCase();
  switch (normalized) {
    case 'admin':
    case 'platform_admin':
      return 'PLATFORM_ADMIN';
    case 'vendor':
    case 'vendor_admin':
      return 'VENDOR_ADMIN';
    case 'vendor_staff':
      return 'VENDOR_STAFF';
    case 'customer':
    case 'delivery_person':
    default:
      return 'CUSTOMER';
  }
}

/**
 * Map Keycloak Realm Roles back to application role
 */
export function mapKeycloakRolesToAppRole(roles = [], fallbackRole = 'customer') {
  if (roles.includes('PLATFORM_ADMIN')) return 'admin';
  if (roles.includes('VENDOR_ADMIN') || roles.includes('VENDOR_STAFF')) return 'vendor';
  if (roles.includes('CUSTOMER')) return fallbackRole || 'customer';
  return fallbackRole || 'customer';
}

/**
 * Authenticate with Keycloak via Direct Access Grant (Password Credentials)
 */
export async function loginWithKeycloak(email, password) {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
      username: email.trim(),
      password: password,
      scope: 'openid profile email'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    if (data.error === 'invalid_grant' || data.error_description?.toLowerCase().includes('invalid')) {
      throw new Error('Invalid email or password');
    }
    throw new Error(data.error_description || data.error || 'Authentication failed with Keycloak');
  }

  // Decode access token claims
  const decodedToken = jwt.decode(data.access_token);
  return {
    tokens: data,
    claims: decodedToken
  };
}

/**
 * Register a new user in Keycloak using Keycloak Admin REST API
 */
export async function registerWithKeycloak({ email, password, firstName, lastName, role, phone }) {
  const adminToken = await getAdminAccessToken();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Create user in Keycloak
  const createUrl = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: cleanEmail,
      email: cleanEmail,
      firstName: firstName || 'FresVeg',
      lastName: lastName || 'User',
      enabled: true,
      emailVerified: true,
      attributes: {
        role: [role || 'customer'],
        phone: [phone || '']
      },
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false
        }
      ]
    })
  });

  if (!createRes.ok) {
    if (createRes.status === 409) {
      throw new Error('An account with this email already exists in Keycloak');
    }
    const errText = await createRes.text();
    console.error('Keycloak user creation error:', createRes.status, errText);
    throw new Error(`Keycloak Registration failed: ${errText || createRes.statusText}`);
  }

  // 2. Determine created user's ID
  let keycloakUserId = null;
  const locationHeader = createRes.headers.get('location');
  if (locationHeader) {
    keycloakUserId = locationHeader.split('/').pop();
  }

  if (!keycloakUserId) {
    // Lookup by email if location header was not returned
    const userSearchRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(cleanEmail)}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (userSearchRes.ok) {
      const users = await userSearchRes.json();
      if (users.length > 0) {
        keycloakUserId = users[0].id;
      }
    }
  }

  // 3. Assign Keycloak Realm Role
  const targetKcRole = mapAppRoleToKeycloakRole(role);
  if (keycloakUserId && targetKcRole) {
    try {
      const roleRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/roles/${targetKcRole}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (roleRes.ok) {
        const roleData = await roleRes.json();
        await fetch(`${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${keycloakUserId}/role-mappings/realm`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify([{ id: roleData.id, name: roleData.name }])
        });
      }
    } catch (roleErr) {
      console.warn('Could not assign realm role in Keycloak:', roleErr.message);
    }
  }

  // 4. Authenticate newly created user to obtain initial tokens
  const authResult = await loginWithKeycloak(cleanEmail, password);
  return {
    keycloakUserId,
    ...authResult
  };
}

/**
 * Verify Keycloak RS256 JWT Token using JWKS
 */
export async function verifyKeycloakToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  // Decode token header to locate key ID (kid)
  const decodedHeader = jwt.decode(token, { complete: true });
  if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
    throw new Error('Invalid token format or missing kid');
  }

  const kid = decodedHeader.header.kid;
  let jwks = await getKeycloakJwks();
  let keyObj = jwks.keys?.find(k => k.kid === kid);

  // If not found, refresh JWKS once
  if (!keyObj) {
    jwks = await getKeycloakJwks(true);
    keyObj = jwks.keys?.find(k => k.kid === kid);
  }

  if (!keyObj) {
    throw new Error(`Signing key not found for kid: ${kid}`);
  }

  const publicKey = crypto.createPublicKey({ key: keyObj, format: 'jwk' });
  const verified = jwt.verify(token, publicKey, {
    algorithms: ['RS256']
  });

  return verified;
}

/**
 * Exchange a Refresh Token with Keycloak for renewed tokens
 */
export async function refreshKeycloakToken(refreshToken) {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: KEYCLOAK_CLIENT_ID,
      refresh_token: refreshToken
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh token');
  }

  const decodedToken = jwt.decode(data.access_token);
  return {
    tokens: data,
    claims: decodedToken
  };
}
