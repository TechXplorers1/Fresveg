import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true
});

const outputPath = path.join(process.cwd(), 'FresVeg_Data_Contract_Specification.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// --- Colors Palette ---
const PRIMARY = '#059669';   // Emerald 600
const SECONDARY = '#0f766e'; // Teal 700
const DARK_BG = '#0f172a';   // Slate 900
const LIGHT_BG = '#f8fafc';  // Slate 50
const ACCENT = '#d97706';    // Amber 600
const TEXT_DARK = '#1e293b'; // Slate 800
const TEXT_MUTED = '#64748b';// Slate 500
const BORDER_COLOR = '#cbd5e1'; // Slate 300
const CODE_BG = '#f1f5f9';   // Slate 100

// Helper functions for PDF styling
function drawHeader(title, subtitle) {
    doc.rect(0, 0, 595.28, 85).fill(PRIMARY);
    
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(22)
       .text('FresVeg Direct Farm Harvest Platform', 40, 20);
       
    doc.fillColor('#D1FAE5')
       .font('Helvetica')
       .fontSize(12)
       .text(title + (subtitle ? ' — ' + subtitle : ''), 40, 48);

    doc.fillColor('#A7F3D0')
       .fontSize(9)
       .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Version 1.0.0`, 40, 65, { align: 'right', width: 515 });

    doc.y = 100;
}

function drawFooter(pageNumber, totalPages) {
    doc.rect(0, 800, 595.28, 42).fill('#F1F5F9');
    doc.fillColor(TEXT_MUTED)
       .font('Helvetica')
       .fontSize(8)
       .text('FresVeg System Data Contract & DB Schema Specification | Confidential - Internal Team Sharing', 40, 812);
       
    doc.fillColor(PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(9)
       .text(`Page ${pageNumber} of ${totalPages}`, 40, 812, { align: 'right', width: 515 });
}

function addSectionTitle(title, yPos) {
    if (yPos) doc.y = yPos;
    
    // Check page overflow
    if (doc.y > 720) {
        doc.addPage();
        drawHeader('Database Architecture & Contract Specification');
    }

    const currentY = doc.y;
    doc.rect(40, currentY, 6, 20).fill(PRIMARY);
    doc.fillColor(DARK_BG)
       .font('Helvetica-Bold')
       .fontSize(14)
       .text(title, 54, currentY + 2);

    doc.y = currentY + 28;
}

function addSubTitle(title) {
    if (doc.y > 730) {
        doc.addPage();
        drawHeader('Database Architecture & Contract Specification');
    }

    doc.fillColor(SECONDARY)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(title, 40, doc.y);

    doc.y += 16;
}

function renderTable(headers, rows, columnWidths, startY) {
    let currentY = startY || doc.y;
    
    // Header Row
    doc.rect(40, currentY, 515, 20).fill(SECONDARY);
    let xOffset = 40;
    
    headers.forEach((header, idx) => {
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(header, xOffset + 4, currentY + 5, { width: columnWidths[idx] - 8, align: 'left' });
        xOffset += columnWidths[idx];
    });

    currentY += 20;

    rows.forEach((row, rowIndex) => {
        if (currentY > 740) {
            doc.addPage();
            drawHeader('Database Architecture & Contract Specification');
            currentY = 100;
            
            // Re-render Header on new page
            doc.rect(40, currentY, 515, 20).fill(SECONDARY);
            let reX = 40;
            headers.forEach((header, idx) => {
                doc.fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .fontSize(8.5)
                   .text(header, reX + 4, currentY + 5, { width: columnWidths[idx] - 8, align: 'left' });
                reX += columnWidths[idx];
            });
            currentY += 20;
        }

        const bg = (rowIndex % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
        const rowHeight = Math.max(18, calculateRowHeight(row, columnWidths));

        doc.rect(40, currentY, 515, rowHeight).fill(bg);
        doc.rect(40, currentY, 515, rowHeight).stroke(BORDER_COLOR);

        let cellX = 40;
        row.forEach((cellText, colIndex) => {
            const isBold = colIndex === 0;
            const fontName = isBold ? 'Helvetica-Bold' : 'Helvetica';
            const color = isBold ? PRIMARY : TEXT_DARK;

            doc.fillColor(color)
               .font(fontName)
               .fontSize(8)
               .text(String(cellText), cellX + 4, currentY + 4, {
                   width: columnWidths[colIndex] - 8,
                   align: 'left'
               });

            cellX += columnWidths[colIndex];
        });

        currentY += rowHeight;
    });

    doc.y = currentY + 12;
}

function calculateRowHeight(row, columnWidths) {
    let maxLines = 1;
    row.forEach((cell, idx) => {
        const textStr = String(cell);
        const width = columnWidths[idx] - 8;
        const approxCharPerLine = Math.floor(width / 5.2);
        const lines = Math.ceil(textStr.length / approxCharPerLine) || 1;
        if (lines > maxLines) maxLines = lines;
    });
    return maxLines * 11 + 6;
}

function addCodeBlock(title, jsonString) {
    if (doc.y > 660) {
        doc.addPage();
        drawHeader('Database Architecture & Contract Specification');
    }

    if (title) {
        doc.fillColor(TEXT_DARK)
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(`Sample JSON Payload: ${title}`, 40, doc.y);
        doc.y += 12;
    }

    const lines = jsonString.split('\n');
    const blockHeight = lines.length * 10 + 12;

    doc.rect(40, doc.y, 515, blockHeight).fill(CODE_BG);
    doc.rect(40, doc.y, 515, blockHeight).stroke('#CBD5E1');

    let textY = doc.y + 6;
    doc.fillColor('#0F172A')
       .font('Courier')
       .fontSize(7.5);

    lines.forEach(line => {
        doc.text(line, 48, textY);
        textY += 10;
    });

    doc.y += blockHeight + 12;
}

// ==================== PAGE 1: COVER & EXECUTIVE SUMMARY ====================
drawHeader('Data Contract & Database Schema Specification');

doc.fillColor(DARK_BG).font('Helvetica-Bold').fontSize(18).text('System Data Architecture & Database Contract', 40, doc.y);
doc.y += 10;

doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(11).text('Official Backend Contract Specification for Manager & Database Engineering Team', 40, doc.y);
doc.y += 20;

// Callout Box
doc.rect(40, doc.y, 515, 65).fill('#ECFDF5');
doc.rect(40, doc.y, 515, 65).stroke('#A7F3D0');
doc.fillColor('#065F46')
   .font('Helvetica-Bold')
   .fontSize(9.5)
   .text('📌 PURPOSE & SCOPE OF THIS DATA CONTRACT', 52, doc.y + 10);
doc.fillColor('#047857')
   .font('Helvetica')
   .fontSize(8.5)
   .text('This document establishes the binding data contract for the FresVeg Agritourism & Direct Farm Harvest platform. It outlines all database schemas, table relationships, field data types, JSONB structures, sample mock payloads, and REST API contract endpoints required for PostgreSQL migration and backend integration.', 52, doc.y + 24, { width: 490 });
doc.y += 80;

addSectionTitle('1. System High-Level Architecture Overview');

doc.fillColor(TEXT_DARK)
   .font('Helvetica')
   .fontSize(9)
   .text('The FresVeg application operates as a full-stack agritourism and direct-to-consumer farm harvest platform. Key pillars of the data architecture include:', 40, doc.y, { width: 515 });
doc.y += 18;

const pillarItems = [
    ['User & Vendor Management', 'Role-based accounts (Customer, Vendor/Farm Host, Delivery Driver, Admin) with multi-address support.'],
    ['Agritourism Farm Listings', 'Rich farm profiles featuring produce, livestock, kids activities, stay accommodations, pricing, and categorized photo galleries.'],
    ['Agritourism Visit Bookings', 'Ticket bookings for open tours, payable per-visitor entry, and overnight stay reservations.'],
    ['Direct Harvest Marketplace', 'E-commerce catalog for freshly harvested farm produce with delivery or farm pickup fulfillment.'],
    ['Order & Delivery Fulfillment', 'Order lifecycle management, driver assignment, live status updates, and tracking numbers.']
];

renderTable(['Core Domain Pillar', 'Key Capabilities & Data Responsibilities'], pillarItems, [150, 365]);

// ==================== PAGE 2: ENTITY SPECIFICATION ====================
doc.addPage();
drawHeader('Core Database Schemas (Tables 1 - 3)');

addSectionTitle('2. Primary Database Entities & Data Contract');

// Table 1: Users
addSubTitle('Entity 2.1: `users` Table (User Accounts & Roles)');
const userFields = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Firebase Auth UID / Unique User Identifier'],
    ['display_name', 'VARCHAR(255)', 'NOT NULL', 'Full name of user or vendor representative'],
    ['email', 'VARCHAR(255)', 'UNIQUE NOT NULL', 'Primary email address'],
    ['phone', 'VARCHAR(50)', 'NULLABLE', 'Contact phone number'],
    ['role', 'VARCHAR(50)', 'NOT NULL', 'Enum: customer | vendor | delivery | admin'],
    ['avatar', 'TEXT', 'NULLABLE', 'Profile picture image URL'],
    ['addresses', 'JSONB', 'DEFAULT []', 'Array of address objects with geocodes'],
    ['shops', 'JSONB', 'DEFAULT []', 'Array of vendor shop profiles'],
    ['created_at', 'TIMESTAMPTZ', 'DEFAULT NOW()', 'Timestamp of registration']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Description & Business Rules'], userFields, [90, 85, 95, 245]);

// Table 2: Farms
addSubTitle('Entity 2.2: `farms` Table (Agritourism Farm Listings)');
const farmFields = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique farm ID or slug (e.g. strawberry-paradise)'],
    ['farm_name', 'VARCHAR(255)', 'NOT NULL', 'Display title of the agritourism farm'],
    ['location', 'TEXT', 'NOT NULL', 'Address / GPS coordinates for map navigation'],
    ['description', 'TEXT', 'NULLABLE', 'Detailed farm narrative and guidelines'],
    ['vendor_id', 'VARCHAR(255)', 'FK -> users(id)', 'Owner user ID of the listing vendor'],
    ['vendor_name', 'VARCHAR(255)', 'NULLABLE', 'Vendor display name'],
    ['cost_per_person', 'NUMERIC(10,2)', 'DEFAULT 0', 'Ticket fee per visitor (0 = Free Entry)'],
    ['cost_type', 'VARCHAR(50)', 'DEFAULT free', 'Enum: free | payable'],
    ['accommodation_price','NUMERIC(10,2)','DEFAULT 0', 'Base price per night for stay options'],
    ['accommodations', 'JSONB', 'DEFAULT []', 'Array of stay option objects'],
    ['crops', 'JSONB', 'DEFAULT []', 'Array of crop strings (e.g. ["Spinach", "Tomatoes"])'],
    ['fruits', 'JSONB', 'DEFAULT []', 'Array of fruit strings (e.g. ["Mangoes"])'],
    ['livestock', 'JSONB', 'DEFAULT []', 'Array of animal strings (e.g. ["Gir Cows"])'],
    ['kids_activities', 'JSONB', 'DEFAULT []', 'Array of kids zone activities'],
    ['farm_products', 'JSONB', 'DEFAULT []', 'Array of direct farm harvest product objects'],
    ['crop_photos', 'JSONB', 'DEFAULT []', 'Array of crop field photo objects'],
    ['livestock_photos', 'JSONB', 'DEFAULT []', 'Array of animal & livestock photo objects'],
    ['kids_photos', 'JSONB', 'DEFAULT []', 'Array of kids play area photo objects'],
    ['accommodation_photos','JSONB','DEFAULT []', 'Array of stay accommodation photo objects'],
    ['gallery', 'JSONB', 'DEFAULT []', 'General farm gallery photo objects'],
    ['visit_days', 'VARCHAR(255)', 'DEFAULT Weekends', 'Operating days (e.g. Mon-Sat)'],
    ['visit_timings', 'VARCHAR(255)', 'DEFAULT 9AM-6PM', 'Operating hours']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Description & Business Rules'], farmFields, [110, 80, 85, 240]);

// ==================== PAGE 3: TABLES 3 - 5 ====================
doc.addPage();
drawHeader('Core Database Schemas (Tables 3 - 5)');

// Table 3: Farm Bookings
addSubTitle('Entity 2.3: `farm_bookings` Table (Tour & Stay Reservations)');
const bookingFields = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique booking ID (e.g. booking_178523...)'],
    ['farm_id', 'VARCHAR(255)', 'FK -> farms(id)', 'Target farm listing ID'],
    ['customer_id', 'VARCHAR(255)', 'FK -> users(id)', 'Booking customer user ID'],
    ['date', 'VARCHAR(50)', 'NOT NULL', 'Scheduled visit date (YYYY-MM-DD)'],
    ['visitors_count', 'INTEGER', 'NOT NULL DEFAULT 1', 'Number of guests attending tour'],
    ['cost_per_person', 'NUMERIC(10,2)', 'DEFAULT 0', 'Ticket cost rate applied'],
    ['include_stay', 'BOOLEAN', 'DEFAULT false', 'Flag indicating if stay accommodation added'],
    ['accommodation_title','VARCHAR(255)','NULLABLE', 'Title of selected accommodation option'],
    ['rooms_booked', 'INTEGER', 'DEFAULT 0', 'Number of rooms / huts reserved'],
    ['stay_cost', 'NUMERIC(10,2)', 'DEFAULT 0', 'Total stay fee calculated'],
    ['total_amount', 'NUMERIC(10,2)', 'NOT NULL', 'Final payable booking amount'],
    ['status', 'VARCHAR(50)', 'DEFAULT confirmed', 'Enum: pending | confirmed | completed | cancelled'],
    ['payment_method', 'VARCHAR(50)', 'DEFAULT Online UPI', 'Payment mode used']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Description & Business Rules'], bookingFields, [110, 80, 85, 240]);

// Table 4: Products
addSubTitle('Entity 2.4: `products` Table (Harvest Marketplace Catalog)');
const productFields = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique product ID (e.g. fp-178523...)'],
    ['name', 'VARCHAR(255)', 'NOT NULL', 'Produce name (e.g. Organic Strawberries)'],
    ['category', 'VARCHAR(100)', 'NOT NULL', 'Category: Vegetables | Fruits | Dairy & Eggs | Grains'],
    ['sub_category', 'VARCHAR(100)', 'NULLABLE', 'Subcategory classification'],
    ['price', 'NUMERIC(10,2)', 'NOT NULL', 'Sale price per unit in INR (₹)'],
    ['unit', 'VARCHAR(50)', 'DEFAULT 1 kg', 'Measurement unit (kg, pack, crate, dozen)'],
    ['quantity', 'VARCHAR(50)', 'DEFAULT 1', 'Standard package quantity multiplier'],
    ['image', 'TEXT', 'NOT NULL', 'Primary high-res product photo URL'],
    ['farm_id', 'VARCHAR(255)', 'FK -> farms(id)', 'Origin farm listing ID'],
    ['vendor_id', 'VARCHAR(255)', 'FK -> users(id)', 'Seller vendor user ID'],
    ['is_deliverable', 'BOOLEAN', 'DEFAULT true', 'False if product is farm pickup only'],
    ['fulfillment_type', 'VARCHAR(50)', 'DEFAULT deliverable','Enum: deliverable | non_deliverable | pickup_only']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Description & Business Rules'], productFields, [100, 80, 85, 250]);

// Table 5: Orders
addSubTitle('Entity 2.5: `orders` Table (E-commerce Harvest Orders)');
const orderFields = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique order ID (e.g. order_1785...)'],
    ['customer_id', 'VARCHAR(255)', 'FK -> users(id)', 'Customer user ID placing order'],
    ['items', 'JSONB', 'NOT NULL', 'Array of purchased items with price & quantity'],
    ['total_amount', 'NUMERIC(10,2)', 'NOT NULL', 'Total transaction amount in INR'],
    ['delivery_address', 'JSONB', 'NOT NULL', 'Full shipping address object'],
    ['payment_method', 'VARCHAR(50)', 'NOT NULL', 'Payment mode: UPI | Card | COD'],
    ['order_status', 'VARCHAR(50)', 'DEFAULT placed', 'Enum: placed | confirmed | packed | in_transit | delivered'],
    ['delivery_boy_id', 'VARCHAR(255)', 'NULLABLE', 'Assigned delivery partner user ID']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Description & Business Rules'], orderFields, [95, 85, 85, 250]);

// ==================== PAGE 4: JSONB PAYLOADS & MOCK DATA CONTRACT ====================
doc.addPage();
drawHeader('JSONB Schemas & Mock Data Contract Payloads');

addSectionTitle('3. Structured JSONB Data Schemas & Sample Contracts');

doc.fillColor(TEXT_DARK)
   .font('Helvetica')
   .fontSize(8.5)
   .text('Below are the exact JSON payload contracts expected by the frontend application for complex JSONB columns.', 40, doc.y);
doc.y += 14;

const sampleFarmJson = `{
  "id": "farm_1785821264",
  "name": "Mannila Organic Paradise & Berry Farm",
  "location": "Mahabaleshwar Highway, Maharashtra 412806",
  "description": "Experience strawberry picking, Gir cow milk tasting, and mud hut stays.",
  "costPerPerson": 250,
  "costType": "payable",
  "crops": ["Strawberries", "Cherry Tomatoes", "Sweet Corn", "Organic Spinach"],
  "fruits": ["Alfonso Mangoes", "Guavas", "Fresh Figs"],
  "livestock": ["Gir Cows", "Free-Range Poultry", "Jamnapari Goats"],
  "kidsActivities": ["Pottery Workshop", "Petting Zoo", "Mini Tractor Rides"],
  "accommodations": [
    {
      "id": "acc-1",
      "title": "Rustic Mud Hut Stay",
      "desc": "Traditional eco mud hut with organic breakfast included.",
      "price": "₹1,500 / night",
      "icon": "hut",
      "roomQuantity": "2 Huts",
      "roomCapacity": "4 Persons"
    }
  ],
  "farmProducts": [
    {
      "id": "fp-101",
      "name": "Fresh Organic Strawberries",
      "price": 240,
      "unit": "500 g box",
      "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6",
      "isDeliverable": true,
      "fulfillmentType": "deliverable"
    }
  ],
  "gallery": [
    { "id": "g-1", "url": "https://images.unsplash.com/photo-1500937386664", "caption": "Strawberry Fields" }
  ]
}`;

addCodeBlock('Agritourism Farm Payload Contract (farms table)', sampleFarmJson);

const sampleBookingJson = `{
  "id": "booking_1785901234",
  "farmId": "farm_1785821264",
  "farmName": "Mannila Organic Paradise",
  "customerId": "user_cust_9921",
  "customerName": "Sandeep Mannila",
  "customerEmail": "sandeep@example.com",
  "date": "2026-09-10",
  "visitorsCount": 3,
  "costPerPerson": 250,
  "includeStay": true,
  "accommodationTitle": "Rustic Mud Hut Stay",
  "roomsBooked": 1,
  "stayCost": 1500,
  "totalAmount": 2250,
  "status": "confirmed",
  "paymentMethod": "Online UPI"
}`;

addCodeBlock('Farm Visit Booking Payload Contract (farm_bookings table)', sampleBookingJson);

// ==================== PAGE 5: API ENDPOINTS & RECOMMENDATIONS ====================
doc.addPage();
drawHeader('REST API Contract & Database Migration Recommendations');

addSectionTitle('4. REST API Endpoint Mapping Contract');

const apiEndpoints = [
    ['GET /api/farms', 'Fetch all agritourism farm listings with filters (search, crop, location)'],
    ['GET /api/farms/:id', 'Fetch full farm details including crops, livestock, stays, products & gallery'],
    ['POST /api/farms', 'Create or update a farm listing (Vendor Dashboard & Edit Mode)'],
    ['POST /api/farms/book', 'Create a farm tour visit or accommodation booking'],
    ['GET /api/farms/bookings/all', 'Fetch vendor farm bookings for dashboard management'],
    ['GET /api/products', 'Fetch marketplace harvest products with category & farm filter'],
    ['POST /api/orders', 'Place direct harvest order with items payload & shipping address'],
    ['GET /api/orders/user/:userId', 'Fetch order history for customer profile']
];

renderTable(['API Route Endpoint', 'Functionality & Frontend Usage Contract'], apiEndpoints, [160, 355]);

addSectionTitle('5. Database Indexing & Migration Directives for DB Engineers');

const migrationDirectives = [
    ['JSONB Indexing', 'Create GIN indexes on `farms.crops`, `farms.fruits`, and `farms.farm_products` for fast JSON searching.'],
    ['Foreign Keys', 'Enforce ON DELETE CASCADE on `farms.vendor_id` and `farm_bookings.customer_id` to maintain integrity.'],
    ['Numeric Precision', 'Use NUMERIC(10, 2) for all currency fields (`cost_per_person`, `total_amount`, `price`) to prevent rounding errors.'],
    ['Upsert Strategy', 'Use `ON CONFLICT (id) DO UPDATE` for `POST /api/farms` to enable seamless draft saving and editing.']
];

renderTable(['Architecture Directive', 'Technical Implementation Recommendation'], migrationDirectives, [140, 375]);

// Footer generation for all pages
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawFooter(i + 1, totalPages);
}

doc.end();

stream.on('finish', () => {
    console.log('PDF Data Contract successfully generated at:', outputPath);
});
