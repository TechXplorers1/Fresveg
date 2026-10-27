const fs = require('fs');

const files = [
  'src/pages/Profile/components/VendorBankDetailsTab.jsx',
  'src/pages/FarmCheckout.jsx',
  'src/pages/Checkout.jsx',
  'server/routes/subscriptions.js'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/currency:\s*['"]INR['"]/g, "currency: 'NGN'");
  content = content.replace(/cu=INR/g, 'cu=NGN');
  content = content.replace(/1 INR = 100 paise/g, '1 NGN = 100 kobo');
  content = content.replace(/Amount in paise/g, 'Amount in kobo');
  fs.writeFileSync(f, content, 'utf8');
  console.log('Updated currency to NGN in ' + f);
});
