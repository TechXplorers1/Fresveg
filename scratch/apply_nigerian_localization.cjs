const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function replaceInFile(relativePath, replacements) {
  const filePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const { search, replace, isRegex, desc } of replacements) {
    if (isRegex) {
      if (search.test(content)) {
        content = content.replace(search, replace);
        modified = true;
        console.log(`  [OK] Applied regex replacement: ${desc || ''}`);
      } else {
        console.warn(`  [WARN] Regex did not match in ${relativePath}: ${desc || search}`);
      }
    } else {
      if (content.includes(search)) {
        content = content.split(search).join(replace);
        modified = true;
        console.log(`  [OK] Applied exact replacement: ${desc || ''}`);
      } else {
        console.warn(`  [WARN] String not found in ${relativePath}: "${search.slice(0, 40)}..."`);
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Saved: ${relativePath}\n`);
  } else {
    console.log(`ℹ️ No changes made in: ${relativePath}\n`);
  }
}

console.log('🇳🇬 Starting comprehensive Nigerian localization update...\n');

// 1. Checkout.jsx
replaceInFile('src/pages/Checkout.jsx', [
  {
    search: "const [selectedPayment, setSelectedPayment] = React.useState('PhonePe UPI & Online');",
    replace: "const [selectedPayment, setSelectedPayment] = React.useState('Paystack (Card, Transfer & USSD)');",
    desc: 'Default selected payment to Paystack'
  },
  {
    search: `const PHONEPE_METHODS = [
  { label: 'PhonePe App', color: '#5f259f', abbr: 'पे' },
  { label: 'UPI QR Code',  color: '#16a34a', abbr: 'QR' },
  { label: 'GPay · Paytm', color: '#2563eb', abbr: 'UPI' },
  { label: 'Cards & NB',   color: '#d97706', abbr: 'CARD' },
];`,
    replace: `const PHONEPE_METHODS = [
  { label: 'Bank Transfer', color: '#09a5db', abbr: 'NIP' },
  { label: 'Debit Cards',   color: '#00c3f8', abbr: 'CARD' },
  { label: 'USSD Code',     color: '#1e293b', abbr: '*737#' },
  { label: 'OPay / PalmPay',color: '#16a34a', abbr: 'WAL' },
];`,
    desc: 'Paystack Nigerian payment channels'
  },
  {
    search: `const PAYMENT_METHODS = [
    {
      id:   'phonepe',
      name: 'PhonePe UPI & Online',
      icon: Smartphone,
      desc: 'Instant UPI, QR scan, Cards & Net Banking via PhonePe Gateway',
      badge: 'Fast & Secure',
      isPhonePe: true
    },
    {
      id:   'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      desc: 'Pay cash when your order arrives',
      badge: 'COD'
    },
    {
      id:   'vendor_bank',
      name: 'Direct Vendor Bank / UPI',
      icon: Landmark,
      desc: 'Transfer directly to Vendor Bank Account or scan UPI QR Code',
      badge: 'Zero Gateway Fees'
    },
    {
      id:   'razorpay',
      name: 'Pay Online (Razorpay)',
      icon: CreditCard,
      desc: 'Cards · Net Banking · Wallets via Razorpay',
      badge: 'Alternative Gateway'
    },
  ];`,
    replace: `const PAYMENT_METHODS = [
    {
      id:   'phonepe',
      name: 'Paystack (Card, Transfer & USSD)',
      icon: Smartphone,
      desc: 'Instant NUBAN Bank Transfer, Debit Cards (Verve/Mastercard), USSD & OPay/PalmPay',
      badge: 'Fastest & Recommended',
      isPhonePe: true
    },
    {
      id:   'cod',
      name: 'Cash on Delivery',
      icon: Banknote,
      desc: 'Pay cash when your order arrives',
      badge: 'COD'
    },
    {
      id:   'vendor_bank',
      name: 'Direct Vendor Bank Transfer',
      icon: Landmark,
      desc: 'Transfer directly to Vendor Nigerian Bank Account (NUBAN) with 0% gateway fees',
      badge: 'Direct NUBAN'
    },
    {
      id:   'razorpay',
      name: 'Flutterwave (Alternative Online)',
      icon: CreditCard,
      desc: 'Cards · Bank Transfer · Mobile Wallets via Flutterwave',
      badge: 'Alternative Gateway'
    },
  ];`,
    desc: 'Payment methods array updated'
  },
  {
    search: "selectedPayment === 'PhonePe UPI & Online'",
    replace: "selectedPayment === 'Paystack (Card, Transfer & USSD)'",
    desc: 'Selected payment conditional for Paystack'
  },
  {
    search: "selectedPayment === 'Direct Vendor Bank / UPI'",
    replace: "selectedPayment === 'Direct Vendor Bank Transfer'",
    desc: 'Selected payment conditional for Direct Vendor Bank'
  },
  {
    search: "selectedPayment === 'Pay Online (Razorpay)'",
    replace: "selectedPayment === 'Flutterwave (Alternative Online)'",
    desc: 'Selected payment conditional for Flutterwave'
  },
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'Default customer/vendor phone fallback'
  },
  {
    search: "'+919876543210'",
    replace: "'+2348023456789'",
    desc: 'Tel link phone fallback'
  },
  {
    search: '"919876543210"',
    replace: '"2348023456789"',
    desc: 'WhatsApp link phone fallback'
  },
  {
    search: "vendorBankDetails?.bankName || 'HDFC Bank'",
    replace: "vendorBankDetails?.bankName || 'Access Bank'",
    desc: 'Vendor fallback bank name'
  },
  {
    search: "vendorBankDetails?.accountNumber || '50100492817291'",
    replace: "vendorBankDetails?.accountNumber || '0128945678'",
    desc: 'Vendor fallback account number'
  },
  {
    search: '<span className="text-slate-400 font-medium">IFSC Code</span>',
    replace: '<span className="text-slate-400 font-medium">Bank Sort Code</span>',
    desc: 'IFSC to Bank Sort Code label'
  },
  {
    search: "vendorBankDetails?.ifscCode || 'HDFC0001234'",
    replace: "vendorBankDetails?.ifscCode || '044 (Access Bank)'",
    desc: 'Fallback sort code'
  },
  {
    search: 'title="Copy IFSC Code"',
    replace: 'title="Copy Bank Sort Code"',
    desc: 'Copy title'
  },
  {
    search: 'Scan or Pay via UPI',
    replace: 'Direct Transfer / Scan to Pay',
    desc: 'Instant transfer header'
  },
  {
    search: 'GPay · PhonePe · Paytm',
    replace: 'OPay · PalmPay · Kuda · All Nigerian Banks',
    desc: 'Bank app list'
  },
  {
    search: 'Vendor UPI ID',
    replace: 'Vendor Bank Reference / Paystack Tag',
    desc: 'Vendor transfer ref tag'
  },
  {
    search: "vendorBankDetails?.upiId || 'greenearth@okhdfcbank'",
    replace: "vendorBankDetails?.upiId || 'greenearth@accessbank'",
    desc: 'Vendor transfer ref'
  },
  {
    search: 'Enter Bank Transfer UTR / Transaction Reference Number',
    replace: 'Enter Bank Transfer Reference / NIP Session ID',
    desc: 'Reference label'
  },
  {
    search: 'placeholder="e.g. 423456789012 or UPI Ref ID"',
    replace: 'placeholder="e.g. 100004241024123456 or Transfer Ref"',
    desc: 'Reference placeholder'
  },
  {
    search: 'Enter 12-digit UTR from your bank or UPI transaction screen',
    replace: 'Enter NIP Session ID or reference from your bank app / USSD receipt',
    desc: 'Reference help text'
  },
  {
    search: 'PhonePe Instant Gateway Methods',
    replace: 'Paystack Instant Payment Channels',
    desc: 'Paystack panel title'
  },
  {
    search: 'PhonePe Certified Gateway',
    replace: 'Paystack Certified Gateway',
    desc: 'Paystack trust seal title'
  },
  {
    search: 'UPI Apps · Dynamic QR · Net Banking · Cards',
    replace: 'Virtual Accounts · Verve / Mastercard · USSD (*737#) · OPay',
    desc: 'Paystack trust subtext'
  },
  {
    search: 'Total Payable via PhonePe',
    replace: 'Total Payable via Paystack',
    desc: 'Paystack payable total'
  },
  {
    search: 'Instant UPI',
    replace: 'Cards & Transfer',
    desc: 'Badge on payment list'
  }
]);

// 2. FarmCheckout.jsx
replaceInFile('src/pages/FarmCheckout.jsx', [
  {
    search: "const [selectedPayment, setSelectedPayment] = React.useState('PhonePe UPI & Online');",
    replace: "const [selectedPayment, setSelectedPayment] = React.useState('Paystack (Card, Transfer & USSD)');",
    desc: 'Default selected payment in FarmCheckout'
  },
  {
    search: `const PHONEPE_METHODS = [
  { label: 'PhonePe App', color: '#5f259f', abbr: 'पे' },
  { label: 'UPI QR Code', color: '#16a34a', abbr: 'QR' },
  { label: 'GPay · Paytm', color: '#2563eb', abbr: 'UPI' },
  { label: 'Cards & NB',  color: '#d97706', abbr: 'CARD' },
];`,
    replace: `const PHONEPE_METHODS = [
  { label: 'Bank Transfer', color: '#09a5db', abbr: 'NIP' },
  { label: 'Debit Cards',   color: '#00c3f8', abbr: 'CARD' },
  { label: 'USSD Banking',  color: '#1e293b', abbr: '*737#' },
  { label: 'OPay / PalmPay',color: '#16a34a', abbr: 'WAL' },
];`,
    desc: 'FarmCheckout Paystack methods'
  },
  {
    search: `const PAYMENT_METHODS = [
    {
      id: 'phonepe',
      name: 'PhonePe UPI & Online',
      icon: Smartphone,
      desc: 'Instant UPI, QR scan, Cards & Net Banking via PhonePe',
      badge: 'Fast & Secure',
      isPhonePe: true
    },
    {
      id: 'cod',
      name: 'Cash on Visit',
      icon: Banknote,
      desc: 'Pay cash at the farm on your visit day',
    },
    {
      id: 'razorpay',
      name: 'Pay Online (Razorpay)',
      icon: CreditCard,
      desc: 'Cards · UPI · Net Banking · Wallets via Razorpay',
    },
  ];`,
    replace: `const PAYMENT_METHODS = [
    {
      id: 'phonepe',
      name: 'Paystack (Card, Transfer & USSD)',
      icon: Smartphone,
      desc: 'Instant NUBAN Bank Transfer, Debit Cards (Verve/Mastercard), USSD & OPay/PalmPay',
      badge: 'Fast & Secure',
      isPhonePe: true
    },
    {
      id: 'cod',
      name: 'Cash on Visit',
      icon: Banknote,
      desc: 'Pay cash at the farm on your visit day',
    },
    {
      id: 'razorpay',
      name: 'Flutterwave (Alternative Online)',
      icon: CreditCard,
      desc: 'Cards · Instant Bank Transfer · Mobile Wallets via Flutterwave',
    },
  ];`,
    desc: 'FarmCheckout PAYMENT_METHODS'
  },
  {
    search: "selectedPayment === 'PhonePe UPI & Online'",
    replace: "selectedPayment === 'Paystack (Card, Transfer & USSD)'",
    desc: 'Selected payment check'
  },
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'Phone fallback in FarmCheckout'
  },
  {
    search: "'+919876543210'",
    replace: "'+2348023456789'",
    desc: 'Tel fallback in FarmCheckout'
  },
  {
    search: 'PhonePe Gateway',
    replace: 'Paystack Gateway',
    desc: 'Paystack gateway title'
  },
  {
    search: 'Total to Pay via PhonePe',
    replace: 'Total to Pay via Paystack',
    desc: 'Paystack total in FarmCheckout'
  },
  {
    search: 'PhonePe Certified Gateway',
    replace: 'Paystack Certified Gateway',
    desc: 'Paystack trust seal in FarmCheckout'
  },
  {
    search: 'UPI Apps · Dynamic QR · Cards',
    replace: 'NUBAN Transfer · Cards · USSD · Wallets',
    desc: 'Paystack trust seal subtext in FarmCheckout'
  }
]);

// 3. VendorBankDetailsTab.jsx
replaceInFile('src/pages/Profile/components/VendorBankDetailsTab.jsx', [
  {
    search: `const POPULAR_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank'
];`,
    replace: `const POPULAR_BANKS = [
  'Access Bank',
  'Guaranty Trust Bank (GTBank)',
  'Zenith Bank',
  'First Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Kuda Bank',
  'OPay Digital Services',
  'PalmPay',
  'Moniepoint Microfinance Bank',
  'Stanbic IBTC Bank',
  'Fidelity Bank',
  'Sterling Bank',
  'Wema Bank'
];`,
    desc: 'Nigerian top commercial and fintech banks'
  },
  {
    search: "bankName: existingBank.bankName || 'HDFC Bank',",
    replace: "bankName: existingBank.bankName || 'Access Bank',",
    desc: 'Default bank name in form'
  },
  {
    search: "setErrorMsg('Please enter the Bank IFSC Code (e.g., HDFC0001234).');",
    replace: "setErrorMsg('Please enter the Bank Sort Code / CBN Code (e.g., 044 for Access, 058 for GTBank).');",
    desc: 'Bank sort code validation error'
  },
  {
    search: 'placeholder="E.g., HDFC Bank, State Bank of India"',
    replace: 'placeholder="E.g., Access Bank, GTBank, Zenith Bank"',
    desc: 'Bank name input placeholder'
  },
  {
    search: 'placeholder="e.g. 50100492817291"',
    replace: 'placeholder="e.g. 0128945678 (10-digit NUBAN)"',
    desc: 'Account number placeholder'
  },
  {
    search: 'IFSC Code',
    replace: 'Bank Sort Code / CBN Code',
    desc: 'IFSC Code label to Bank Sort Code'
  },
  {
    search: 'placeholder="e.g. HDFC0001234"',
    replace: 'placeholder="e.g. 044 (Access) or 058 (GTBank)"',
    desc: 'Sort code placeholder'
  },
  {
    search: 'placeholder="e.g. Nashik Main Branch, Igatpuri Road, Maharashtra"',
    replace: 'placeholder="e.g. Ikeja Branch, Lagos State, Nigeria"',
    desc: 'Branch name placeholder'
  },
  {
    search: 'IFSC CODE',
    replace: 'SORT CODE',
    desc: 'Card preview IFSC uppercase'
  },
  {
    search: "Please mention your Order ID in UPI/Bank transfer remarks for fast order processing.",
    replace: "Please include your Order ID in the transfer remarks/reference for instant payment verification.",
    desc: 'Default transfer instructions'
  }
]);

// 4. VendorFarmSubscriptionTab.jsx
replaceInFile('src/pages/Profile/components/VendorFarmSubscriptionTab.jsx', [
  {
    search: `const DEFAULT_BILLING_DETAILS = {
    companyName: 'FresVeg Technologies Private Limited',
    gstin: '29ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    billingAddress: '42, AgriTech Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    bankName: 'HDFC Bank Ltd',
    accountName: 'FresVeg Technologies Pvt Ltd',
    accountNumber: '50200088912345',
    ifscCode: 'HDFC0001234',
    accountType: 'Current Account',
    branch: 'Indiranagar, Bengaluru',
    upiId: 'fresveg.billing@hdfcbank'
};`,
    replace: `const DEFAULT_BILLING_DETAILS = {
    companyName: 'FresVeg Nigeria Limited',
    gstin: 'TIN-20489123-0001',
    pan: 'RC-1849201',
    billingAddress: 'Plot 12, Commercial Avenue, Victoria Island, Lagos, Nigeria 101241',
    bankName: 'Access Bank Plc',
    accountName: 'FresVeg Nigeria Limited',
    accountNumber: '0128945678',
    ifscCode: '044 (Access Bank)',
    accountType: 'Corporate Current Account',
    branch: 'Victoria Island Branch, Lagos',
    upiId: 'fresveg.billing@accessbank'
};`,
    desc: 'Corporate billing details for subscription'
  },
  {
    search: 'GST (18% inclusive):',
    replace: 'VAT (7.5% inclusive):',
    desc: 'GST to VAT label'
  },
  {
    search: '1.18',
    replace: '1.075',
    desc: 'VAT calculation divisor'
  },
  {
    search: 'Bank: {billingInfo.bankName} • A/C: {billingInfo.accountNumber} • IFSC: {billingInfo.ifscCode}',
    replace: 'Bank: {billingInfo.bankName} • A/C: {billingInfo.accountNumber} • Code: {billingInfo.ifscCode}',
    desc: 'Bank display in subscription modal'
  },
  {
    search: 'Enter 12-Digit Bank UTR / Reference ID:',
    replace: 'Enter Bank Transfer Reference / NIP Session ID:',
    desc: 'Reference input title'
  },
  {
    search: 'placeholder="e.g. UTR123456789012"',
    replace: 'placeholder="e.g. NIP-SESSION-1002930492"',
    desc: 'Reference input placeholder'
  }
]);

// 5. VendorShopsTab.jsx & AddShopModal.jsx
replaceInFile('src/pages/Profile/components/VendorShopsTab.jsx', [
  {
    search: '<label className={labelCls}>GST Number</label>',
    replace: '<label className={labelCls}>TIN / CAC RC Number</label>',
    desc: 'GST to TIN / CAC label in VendorShopsTab'
  },
  {
    search: 'placeholder="E.g. 22AAAAA0000A1Z5"',
    replace: 'placeholder="E.g. RC-1849201 or TIN 20489123-0001"',
    desc: 'TIN placeholder in VendorShopsTab'
  },
  {
    search: 'placeholder="E.g. Andheri West, Mumbai, Maharashtra"',
    replace: 'placeholder="E.g. Ikeja, Lagos State, Nigeria"',
    desc: 'Location placeholder in VendorShopsTab'
  },
  {
    search: 'placeholder="+91 9876543210"',
    replace: 'placeholder="+234 8023456789"',
    desc: 'WhatsApp placeholder in VendorShopsTab'
  },
  {
    search: 'GST: {shop.gstNumber}',
    replace: 'TIN / CAC: {shop.gstNumber}',
    desc: 'Shop card GST text'
  }
]);

replaceInFile('src/pages/Profile/modals/AddShopModal.jsx', [
  {
    search: '<label className={labelCls}>GST Number</label>',
    replace: '<label className={labelCls}>TIN / CAC RC Number</label>',
    desc: 'GST to TIN / CAC label in AddShopModal'
  },
  {
    search: 'placeholder="E.g. 22AAAAA0000A1Z5"',
    replace: 'placeholder="E.g. RC-1849201 or TIN 20489123-0001"',
    desc: 'TIN placeholder in AddShopModal'
  },
  {
    search: 'placeholder="E.g. Andheri West, Mumbai, Maharashtra"',
    replace: 'placeholder="E.g. Ikeja, Lagos State, Nigeria"',
    desc: 'Location placeholder in AddShopModal'
  }
]);

// 6. Product Modals (FSSAI -> NAFDAC)
replaceInFile('src/pages/Profile/modals/AddProductModal.jsx', [
  {
    search: 'FSSAI / Organic Cert. No.',
    replace: 'NAFDAC / Organic Cert. No.',
    desc: 'FSSAI to NAFDAC label'
  },
  {
    search: 'placeholder="FSSAI-1002930492"',
    replace: 'placeholder="NAFDAC-01-2345"',
    desc: 'NAFDAC placeholder'
  },
  {
    search: 'name="origin" value={newProduct.origin} onChange={handleInputChange} className={inputCls.replace(\'pl-10\', \'px-4\')} placeholder="India"',
    replace: 'name="origin" value={newProduct.origin} onChange={handleInputChange} className={inputCls.replace(\'pl-10\', \'px-4\')} placeholder="Nigeria"',
    desc: 'Origin placeholder Nigeria'
  }
]);

replaceInFile('src/pages/Profile/modals/EditProductModal.jsx', [
  {
    search: 'FSSAI / Organic Cert. No.',
    replace: 'NAFDAC / Organic Cert. No.',
    desc: 'FSSAI to NAFDAC in edit modal'
  },
  {
    search: 'placeholder="FSSAI-1002930492"',
    replace: 'placeholder="NAFDAC-01-2345"',
    desc: 'NAFDAC placeholder in edit modal'
  },
  {
    search: 'placeholder="India"',
    replace: 'placeholder="Nigeria"',
    desc: 'Origin placeholder Nigeria in edit modal'
  }
]);

// 7. Cart.jsx & SavedAddressesTab.jsx
replaceInFile('src/pages/Cart.jsx', [
  {
    search: 'placeholder="Mumbai"',
    replace: 'placeholder="Ikeja"',
    desc: 'Cart address city'
  },
  {
    search: 'placeholder="Maharashtra"',
    replace: 'placeholder="Lagos State"',
    desc: 'Cart address state'
  },
  {
    search: 'placeholder="400001"',
    replace: 'placeholder="100001"',
    desc: 'Cart address zip'
  },
  {
    search: 'placeholder="India"',
    replace: 'placeholder="Nigeria"',
    desc: 'Cart address country'
  }
]);

replaceInFile('src/pages/Profile/components/SavedAddressesTab.jsx', [
  {
    search: 'placeholder="Mumbai"',
    replace: 'placeholder="Ikeja"',
    desc: 'Saved addresses city'
  },
  {
    search: 'placeholder="Maharashtra"',
    replace: 'placeholder="Lagos State"',
    desc: 'Saved addresses state'
  },
  {
    search: 'placeholder="400001"',
    replace: 'placeholder="100001"',
    desc: 'Saved addresses zip'
  },
  {
    search: 'placeholder="India"',
    replace: 'placeholder="Nigeria"',
    desc: 'Saved addresses country'
  }
]);

// 8. ProductDetails.jsx & Profile/index.jsx
replaceInFile('src/pages/ProductDetails.jsx', [
  {
    search: "{product.origin || 'India'}",
    replace: "{product.origin || 'Nigeria'}",
    desc: 'Product origin default to Nigeria'
  }
]);

replaceInFile('src/pages/Profile/index.jsx', [
  {
    search: "origin: 'India'",
    replace: "origin: 'Nigeria'",
    desc: 'Profile new product origin Nigeria'
  },
  {
    search: "origin: newProduct.origin || 'India'",
    replace: "origin: newProduct.origin || 'Nigeria'",
    desc: 'Profile save product origin Nigeria'
  },
  {
    search: "country: geo.country || 'India'",
    replace: "country: geo.country || 'Nigeria'",
    desc: 'Profile geo country default Nigeria'
  },
  {
    search: "deliveryBoyPhone: userProfile?.phone || user?.phone || '+91 98765 43210'",
    replace: "deliveryBoyPhone: userProfile?.phone || user?.phone || '+234 802 345 6789'",
    desc: 'Delivery boy phone in Profile'
  }
]);

// 9. Phone numbers across CustomerOrdersTab, DeliveryOrdersTab, OrderTracking, MyDetailsTab, CartContext
replaceInFile('src/pages/Profile/components/MyDetailsTab.jsx', [
  {
    search: 'placeholder="+91 98765 43210"',
    replace: 'placeholder="+234 802 345 6789"',
    desc: 'My details phone placeholder'
  }
]);

replaceInFile('src/pages/FarmDetails.jsx', [
  {
    search: 'placeholder="E.g. +91 9876543210 or https://wa.me/..."',
    replace: 'placeholder="E.g. +234 8023456789 or https://wa.me/..."',
    desc: 'Farm details phone placeholder'
  }
]);

replaceInFile('src/pages/Profile/components/CustomerOrdersTab.jsx', [
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'CustomerOrders phone display fallback'
  },
  {
    search: "'+919876543210'",
    replace: "'+2348023456789'",
    desc: 'CustomerOrders tel fallback'
  }
]);

replaceInFile('src/pages/Profile/components/DeliveryOrdersTab.jsx', [
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'DeliveryOrders phone display fallback'
  },
  {
    search: "'+919876543210'",
    replace: "'+2348023456789'",
    desc: 'DeliveryOrders tel fallback'
  }
]);

replaceInFile('src/pages/OrderTracking.jsx', [
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'OrderTracking phone display fallback'
  },
  {
    search: "'+919876543210'",
    replace: "'+2348023456789'",
    desc: 'OrderTracking tel fallback'
  }
]);

replaceInFile('src/context/CartContext.jsx', [
  {
    search: "'+91 98765 43210'",
    replace: "'+234 802 345 6789'",
    desc: 'CartContext default phone fallback'
  }
]);

// 10. AdminPayoutsTab.jsx & VendorEarningsTab.jsx
replaceInFile('src/pages/admin/components/AdminPayoutsTab.jsx', [
  {
    search: '<div className="font-mono text-slate-500">IFSC: {bank.ifscCode}</div>',
    replace: '<div className="font-mono text-slate-500">Bank Code: {bank.ifscCode}</div>',
    desc: 'Admin payout IFSC label'
  },
  {
    search: '(IFSC: {bank.ifscCode || \'N/A\'})',
    replace: '(Bank Code: {bank.ifscCode || \'N/A\'})',
    desc: 'Admin payout modal IFSC label'
  },
  {
    search: 'placeholder="Bank UTR / Transaction Reference"',
    replace: 'placeholder="NIP Session ID / Transfer Reference"',
    desc: 'Admin payout reference placeholder'
  }
]);

replaceInFile('src/pages/Profile/components/VendorEarningsTab.jsx', [
  {
    search: '· IFSC: <span className="font-mono text-slate-300">{activeBank.ifscCode || \'N/A\'}</span>',
    replace: '· Sort Code: <span className="font-mono text-slate-300">{activeBank.ifscCode || \'N/A\'}</span>',
    desc: 'Vendor earnings IFSC label'
  }
]);

// 11. Marketplace.jsx locations
replaceInFile('src/pages/Marketplace.jsx', [
  {
    search: `lat: 18.9107,
            lng: 73.3282,
            label: 'Default Base Location (Karjat)'`,
    replace: `lat: 6.5244,
            lng: 3.3792,
            label: 'Default Base Location (Lagos)'`,
    desc: 'Marketplace GPS fallback coordinates'
  },
  {
    search: "setGpsMessage(`📍 ${err.message || 'Using base reference location (Karjat, Maharashtra).'}`);",
    replace: "setGpsMessage(`📍 ${err.message || 'Using base reference location (Lagos, Nigeria).'}`);",
    desc: 'Marketplace GPS fallback message'
  },
  {
    search: "let location = p.shopLocation || 'Karjat, Maharashtra';",
    replace: "let location = p.shopLocation || 'Epe, Lagos State';",
    desc: 'Marketplace shop fallback location'
  },
  {
    search: "location = 'Karjat, Maharashtra';",
    replace: "location = 'Epe, Lagos State';",
    desc: 'Green Valley location'
  },
  {
    search: "location = 'Nashik, Maharashtra';",
    replace: "location = 'Ibadan, Oyo State';",
    desc: 'Sunshine location'
  },
  {
    search: "location = 'Pune, Maharashtra';",
    replace: "location = 'Ikeja, Lagos State';",
    desc: 'Root Essentials location'
  },
  {
    search: "location = 'Satara, Maharashtra';",
    replace: "location = 'Abeokuta, Ogun State';",
    desc: 'Happy Cows location'
  },
  {
    search: "location = 'Mahabaleshwar, MH';",
    replace: "location = 'Jos, Plateau State';",
    desc: 'Meadow Farms location'
  },
  {
    search: "location = 'Ratnagiri, Maharashtra';",
    replace: "location = 'Benin City, Edo State';",
    desc: 'Orchard location'
  },
  {
    search: "location: s.location || 'Local Region, India',",
    replace: "location: s.location || 'Local Region, Nigeria',",
    desc: 'Marketplace public shop fallback region'
  }
]);

// 12. Backend server routes (subscriptions.js & auth.js)
replaceInFile('server/routes/subscriptions.js', [
  {
    search: `export const FRESVEG_BILLING_DETAILS = {
  companyName: 'FresVeg Technologies Private Limited',
  gstin: '29ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  billingAddress: '42, AgriTech Tower, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
  bankName: 'HDFC Bank Ltd',
  accountName: 'FresVeg Technologies Pvt Ltd',
  accountNumber: '50200088912345',
  ifscCode: 'HDFC0001234',
  accountType: 'Current Account',
  branch: 'Indiranagar, Bengaluru',
  upiId: 'fresveg.billing@hdfcbank'
};`,
    replace: `export const FRESVEG_BILLING_DETAILS = {
  companyName: 'FresVeg Nigeria Limited',
  gstin: 'TIN-20489123-0001',
  pan: 'RC-1849201',
  billingAddress: 'Plot 12, Commercial Avenue, Victoria Island, Lagos, Nigeria 101241',
  bankName: 'Access Bank Plc',
  accountName: 'FresVeg Nigeria Limited',
  accountNumber: '0128945678',
  ifscCode: '044 (Access Bank)',
  accountType: 'Corporate Current Account',
  branch: 'Victoria Island Branch, Lagos',
  upiId: 'fresveg.billing@accessbank'
};`,
    desc: 'Server backend billing details'
  }
]);

replaceInFile('server/routes/auth.js', [
  {
    search: `      bankDetails: {
        accountHolderName: 'FresVeg Certified Vendor',
        bankName: 'HDFC Bank',
        accountNumber: '50100492817291',
        ifscCode: 'HDFC0001234',
        accountType: 'Current',
        branchName: 'Main Branch, Maharashtra',
        upiId: 'fresveg.vendor@okhdfcbank',
        isVerified: true,
        acceptDirectPayments: true,
        paymentInstructions: 'Please add your Order ID in transfer remarks for instant automated verification.'
      }`,
    replace: `      bankDetails: {
        accountHolderName: 'FresVeg Certified Vendor',
        bankName: 'Access Bank',
        accountNumber: '0128945678',
        ifscCode: '044 (Access Bank)',
        accountType: 'Current',
        branchName: 'Ikeja Branch, Lagos State',
        upiId: 'fresveg.vendor@accessbank',
        isVerified: true,
        acceptDirectPayments: true,
        paymentInstructions: 'Please add your Order ID in transfer remarks for instant automated verification.'
      }`,
    desc: 'Server default vendor bank details'
  }
]);

// 13. adminConstants.js testimonials
replaceInFile('src/pages/admin/adminConstants.js', [
  {
    search: 'test4Name: "Rajesh V. Patel",\n  test4Role: "Local Restaurant Owner",',
    replace: 'test4Name: "Babatunde Adeleke",\n  test4Role: "Lagos Eatery Chef & Owner",',
    desc: 'Testimonial 4 Nigerian customer'
  },
  {
    search: 'test5Name: "Anita Roy",\n  test5Role: "Organic Living Advocate",',
    replace: 'test5Name: "Amina Bello",\n  test5Role: "Healthy Living Advocate, Abuja",',
    desc: 'Testimonial 5 Nigerian customer'
  }
]);

// 14. server/seed_sample_accounts.js
replaceInFile('server/seed_sample_accounts.js', [
  {
    search: "const customerName = 'Ananya Patel';",
    replace: "const customerName = 'Chioma Adebayo';",
    desc: 'Customer name'
  },
  {
    search: "const customerPhone = '+91 98765 11223';",
    replace: "const customerPhone = '+234 802 345 1122';",
    desc: 'Customer phone'
  },
  {
    search: "street: 'Flat 402, Green Acre Heights, Bandra West',",
    replace: "street: 'Flat 4, Palmview Court, Lekki Phase 1',",
    desc: 'Customer street'
  },
  {
    search: "city: 'Mumbai',",
    replace: "city: 'Lagos',",
    desc: 'Customer city'
  },
  {
    search: "state: 'Maharashtra',",
    replace: "state: 'Lagos State',",
    desc: 'Customer state'
  },
  {
    search: "zipCode: '400050',",
    replace: "zipCode: '105102',",
    desc: 'Customer zip'
  },
  {
    search: "country: 'India',",
    replace: "country: 'Nigeria',",
    desc: 'Customer country'
  },
  {
    search: "const vendorName = 'Vikram Singh';",
    replace: "const vendorName = 'Emeka Okonkwo';",
    desc: 'Vendor name'
  },
  {
    search: "const vendorPhone = '+91 98765 99887';",
    replace: "const vendorPhone = '+234 803 765 9988';",
    desc: 'Vendor phone'
  },
  {
    search: "location: 'Nashik Highway, Igatpuri, Maharashtra',",
    replace: "location: 'Epe Express Road, Lekki-Epe Axis, Lagos State',",
    desc: 'Vendor location'
  },
  {
    search: "gstNumber: '27ABCDE1234F1Z5',",
    replace: "gstNumber: 'RC-1849201',",
    desc: 'Vendor registration'
  },
  {
    search: "whatsapp: '+91 98765 99887',",
    replace: "whatsapp: '+234 803 765 9988',",
    desc: 'Vendor whatsapp'
  },
  {
    search: "website: 'https://greenearthorganics.in'",
    replace: "website: 'https://greenearthorganics.ng'",
    desc: 'Vendor website'
  },
  {
    search: "const deliveryName = 'Arjun Kumar';",
    replace: "const deliveryName = 'Ibrahim Musa';",
    desc: 'Delivery person name'
  },
  {
    search: "const deliveryPhone = '+91 98765 33445';",
    replace: "const deliveryPhone = '+234 805 123 3344';",
    desc: 'Delivery person phone'
  },
  {
    search: "street: 'FresVeg Hub #4, MG Road, Shivaji Nagar',",
    replace: "street: 'FresVeg Hub #1, Allen Avenue, Ikeja',",
    desc: 'Delivery street'
  },
  {
    search: "city: 'Pune',",
    replace: "city: 'Ikeja',",
    desc: 'Delivery city'
  },
  {
    search: "zipCode: '411005',",
    replace: "zipCode: '100001',",
    desc: 'Delivery zip'
  }
]);

console.log('🎉 Comprehensive localization complete!');
