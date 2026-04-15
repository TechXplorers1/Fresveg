# FresVeg Firebase Setup Instructions

## Firestore Security Rules Deployment

The "client is offline" error in CartContext is likely due to missing Firestore security rules. To fix this:

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase in your project (if not done)
```bash
cd Fresveg
firebase init
```
- Select "Firestore" when prompted
- Choose your existing Firebase project "fresveg"

### 4. Deploy Firestore Security Rules
```bash
firebase deploy --only firestore:rules
```

## What the Security Rules Allow

- **Carts**: Users can only read/write their own cart data
- **Users**: Users can only read/write their own profile data
- **Products**: Authenticated users can read/write products (for vendors), all users can read products (for customers)

## Offline Persistence

The app now includes offline persistence for Firestore, which means:
- Cart data will work even when offline
- Changes will sync automatically when connection is restored
- No more "client is offline" errors for normal usage

## Testing

After deploying the security rules:
1. Start the dev server: `npm run dev`
2. Try logging in and adding items to cart
3. The cart should persist across sessions and work offline