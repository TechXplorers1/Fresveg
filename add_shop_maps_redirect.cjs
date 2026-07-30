const fs = require('fs');
const path = require('path');

const marketplacePath = path.join(__dirname, 'src', 'pages', 'Marketplace.jsx');
let content = fs.readFileSync(marketplacePath, 'utf8');

// 1. Add openLocationInMaps helper function inside Marketplace component
const helperMarker = `   const handleSelectShop = (shopId) => {`;

const openMapsHelper = `   const openLocationInMaps = (locationStr, e) => {
      if (e) {
         e.preventDefault();
         e.stopPropagation();
      }
      if (!locationStr) return;
      const url = \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(locationStr)}\`;
      window.open(url, '_blank');
   };

   const handleSelectShop = (shopId) => {`;

if (content.includes(helperMarker)) {
    content = content.replace(helperMarker, openMapsHelper);
    console.log('✅ Added openLocationInMaps helper function');
}

// 2. Add Location Address & Map Redirect Bar in selectedFarmShop view
const farmShopTarget = `<div className="relative rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-white">`;

const farmShopLocationBar = `{/* Farm Shop Location Address & Map Redirect Bar */}
                     <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                              <MapPin size={20} />
                           </div>
                           <div className="min-w-0">
                              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-headings">Farm Shop Location Address:</h4>
                              <p
                                 onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)}
                                 className="text-xs font-bold text-emerald-900 hover:text-emerald-600 hover:underline cursor-pointer transition-colors truncate mt-0.5"
                                 title="Click to open location in Google Maps"
                              >
                                 📍 {selectedFarmShop.location}
                              </p>
                           </div>
                        </div>
                        <button
                           type="button"
                           onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)}
                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 font-headings"
                        >
                           <Navigation size={14} /> Open Location in Maps ↗
                        </button>
                     </div>

                     <div className="relative rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-white">`;

if (content.includes(farmShopTarget)) {
    content = content.replace(farmShopTarget, farmShopLocationBar);
    console.log('✅ Added Location & Map Bar in Farm Shop View');
}

// 3. Add Location Address & Map Redirect Bar in selectedShop view
const marketShopTarget = `/* ── CASE 2: USER SELECTED A MARKET SHOP (MARKETS TAB STOREFRONT) ── */\n                   <div className="space-y-6 animate-fade-in text-left">`;

const marketShopLocationBar = `/* ── CASE 2: USER SELECTED A MARKET SHOP (MARKETS TAB STOREFRONT) ── */
                   <div className="space-y-6 animate-fade-in text-left">
                      {/* Shop Location Address & Map Redirect Bar */}
                      <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
                         <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                               <MapPin size={20} />
                            </div>
                            <div className="min-w-0">
                               <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-headings">Shop Location Address:</h4>
                               <p
                                  onClick={(e) => openLocationInMaps(selectedShop.location, e)}
                                  className="text-xs font-bold text-emerald-900 hover:text-emerald-600 hover:underline cursor-pointer transition-colors truncate mt-0.5"
                                  title="Click to open location in Google Maps"
                               >
                                  📍 {selectedShop.location}
                               </p>
                            </div>
                         </div>
                         <button
                            type="button"
                            onClick={(e) => openLocationInMaps(selectedShop.location, e)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 font-headings"
                         >
                            <Navigation size={14} /> Open Location in Maps ↗
                         </button>
                      </div>`;

if (content.includes(marketShopTarget)) {
    content = content.replace(marketShopTarget, marketShopLocationBar);
    console.log('✅ Added Location & Map Bar in Market Shop View');
}

// 4. Update address link on shop cards header overlay
content = content.replace(
    `<span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-400" /> {selectedShop.location}</span>`,
    `<span onClick={(e) => openLocationInMaps(selectedShop.location, e)} className="flex items-center gap-1.5 hover:underline hover:text-emerald-300 cursor-pointer" title="Click to open location in Google Maps"><MapPin size={14} className="text-emerald-400" /> {selectedShop.location} ↗</span>`
);

content = content.replace(
    `<span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-400" /> {selectedFarmShop.location}</span>`,
    `<span onClick={(e) => openLocationInMaps(selectedFarmShop.location, e)} className="flex items-center gap-1.5 hover:underline hover:text-emerald-300 cursor-pointer" title="Click to open location in Google Maps"><MapPin size={14} className="text-emerald-400" /> {selectedFarmShop.location} ↗</span>`
);

content = content.replace(
    `<p className="text-[11px] text-slate-200 font-medium flex items-center gap-1 mt-0.5">\n                                          <MapPin size={11} className="text-emerald-400" /> {shop.location}\n                                       </p>`,
    `<p onClick={(e) => openLocationInMaps(shop.location, e)} className="text-[11px] text-slate-200 font-medium flex items-center gap-1 mt-0.5 hover:underline hover:text-emerald-300 cursor-pointer transition-colors" title="Click to open location in Google Maps">\n                                          <MapPin size={11} className="text-emerald-400" /> {shop.location}\n                                       </p>`
);

fs.writeFileSync(marketplacePath, content, 'utf8');
console.log('✅ Successfully updated Marketplace.jsx!');
