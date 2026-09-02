import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    bufferPages: true
});

const outputPath = path.join(process.cwd(), 'Database_Data_Contract_Summary.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// --- Colors Palette ---
const PRIMARY = '#059669';   // Emerald 600
const SECONDARY = '#0f766e'; // Teal 700
const DARK_BG = '#0f172a';   // Slate 900
const TEXT_DARK = '#1e293b'; // Slate 800
const TEXT_MUTED = '#64748b';// Slate 500
const BORDER_COLOR = '#cbd5e1'; // Slate 300
const CODE_BG = '#f1f5f9';   // Slate 100

function drawHeader(title) {
    doc.rect(0, 0, 595.28, 80).fill(PRIMARY);
    
    doc.fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .fontSize(20)
       .text('FresVeg Agritourism & Direct Harvest Platform', 40, 18);
       
    doc.fillColor('#D1FAE5')
       .font('Helvetica-Bold')
       .fontSize(12)
       .text(title, 40, 46);

    doc.fillColor('#A7F3D0')
       .font('Helvetica')
       .fontSize(8.5)
       .text(`Official Database Data Contract Summary | ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 40, 62, { align: 'right', width: 515 });

    doc.y = 95;
}

function drawFooter(pageNumber, totalPages) {
    doc.rect(0, 800, 595.28, 42).fill('#F1F5F9');
    doc.fillColor(TEXT_MUTED)
       .font('Helvetica')
       .fontSize(8)
       .text('FresVeg Database Data Contract Summary — Confidential & Technical Documentation', 40, 814);
       
    doc.fillColor(PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(8.5)
       .text(`Page ${pageNumber} of ${totalPages}`, 40, 814, { align: 'right', width: 515 });
}

function addSectionHeader(title) {
    if (doc.y > 710) {
        doc.addPage();
        drawHeader('Database Data Contract Summary');
    }

    const y = doc.y;
    doc.rect(40, y, 5, 18).fill(PRIMARY);
    doc.fillColor(DARK_BG)
       .font('Helvetica-Bold')
       .fontSize(13)
       .text(title, 52, y + 2);

    doc.y = y + 24;
}

function addSubHeader(title) {
    if (doc.y > 720) {
        doc.addPage();
        drawHeader('Database Data Contract Summary');
    }

    doc.fillColor(SECONDARY)
       .font('Helvetica-Bold')
       .fontSize(10.5)
       .text(title, 40, doc.y);

    doc.y += 14;
}

function renderTable(headers, rows, columnWidths) {
    let currentY = doc.y;
    
    // Header Row
    doc.rect(40, currentY, 515, 18).fill(SECONDARY);
    let xOffset = 40;
    
    headers.forEach((header, idx) => {
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .fontSize(8)
           .text(header, xOffset + 4, currentY + 4, { width: columnWidths[idx] - 8, align: 'left' });
        xOffset += columnWidths[idx];
    });

    currentY += 18;

    rows.forEach((row, rowIndex) => {
        if (currentY > 740) {
            doc.addPage();
            drawHeader('Database Data Contract Summary');
            currentY = 95;
            
            // Re-render Header
            doc.rect(40, currentY, 515, 18).fill(SECONDARY);
            let reX = 40;
            headers.forEach((header, idx) => {
                doc.fillColor('#FFFFFF')
                   .font('Helvetica-Bold')
                   .fontSize(8)
                   .text(header, reX + 4, currentY + 4, { width: columnWidths[idx] - 8, align: 'left' });
                reX += columnWidths[idx];
            });
            currentY += 18;
        }

        const bg = (rowIndex % 2 === 0) ? '#FFFFFF' : '#F8FAFC';
        const rowHeight = Math.max(16, calculateRowHeight(row, columnWidths));

        doc.rect(40, currentY, 515, rowHeight).fill(bg);
        doc.rect(40, currentY, 515, rowHeight).stroke(BORDER_COLOR);

        let cellX = 40;
        row.forEach((cellText, colIndex) => {
            const isBold = colIndex === 0;
            const fontName = isBold ? 'Helvetica-Bold' : 'Helvetica';
            const color = isBold ? PRIMARY : TEXT_DARK;

            doc.fillColor(color)
               .font(fontName)
               .fontSize(7.5)
               .text(String(cellText), cellX + 4, currentY + 4, {
                   width: columnWidths[colIndex] - 8,
                   align: 'left'
               });

            cellX += columnWidths[colIndex];
        });

        currentY += rowHeight;
    });

    doc.y = currentY + 10;
}

function calculateRowHeight(row, columnWidths) {
    let maxLines = 1;
    row.forEach((cell, idx) => {
        const textStr = String(cell);
        const width = columnWidths[idx] - 8;
        const approxCharPerLine = Math.floor(width / 4.8);
        const lines = Math.ceil(textStr.length / approxCharPerLine) || 1;
        if (lines > maxLines) maxLines = lines;
    });
    return maxLines * 10 + 5;
}

function addCodeBlock(title, jsonString) {
    if (doc.y > 660) {
        doc.addPage();
        drawHeader('Database Data Contract Summary');
    }

    if (title) {
        doc.fillColor(TEXT_DARK)
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text(`Payload Schema Contract: ${title}`, 40, doc.y);
        doc.y += 10;
    }

    const lines = jsonString.split('\n');
    const blockHeight = lines.length * 9.5 + 10;

    doc.rect(40, doc.y, 515, blockHeight).fill(CODE_BG);
    doc.rect(40, doc.y, 515, blockHeight).stroke(BORDER_COLOR);

    let textY = doc.y + 5;
    doc.fillColor('#0F172A')
       .font('Courier')
       .fontSize(7);

    lines.forEach(line => {
        doc.text(line, 46, textY);
        textY += 9.5;
    });

    doc.y += blockHeight + 10;
}

// ==================== PAGE 1 ====================
drawHeader('Database Data Contract Summary');

doc.fillColor(DARK_BG).font('Helvetica-Bold').fontSize(16).text('Database Data Contract Summary', 40, doc.y);
doc.y += 6;
doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(10).text('Technical Specification & Schema Standard for Engineering Managers', 40, doc.y);
doc.y += 16;

// Executive Summary Box
doc.rect(40, doc.y, 515, 55).fill('#ECFDF5');
doc.rect(40, doc.y, 515, 55).stroke('#A7F3D0');
doc.fillColor('#065F46').font('Helvetica-Bold').fontSize(9).text('📋 EXECUTIVE SUMMARY', 50, doc.y + 8);
doc.fillColor('#047857').font('Helvetica').fontSize(8).text('This summary contract establishes the canonical data structures, table schemas, JSONB field definitions, API routes, and database constraints for the FresVeg website platform. Use this document as the reference guide for backend implementation and PostgreSQL database design.', 50, doc.y + 20, { width: 495 });
doc.y += 68;

addSectionHeader('1. Core Data Entities Summary');

const summaryTable = [
    ['users', 'User Accounts & Roles', 'Stores user accounts, roles (customer, vendor, delivery), profile details, and address arrays.'],
    ['farms', 'Agritourism Listings', 'Stores farm profiles, crops, fruits, livestock, stay accommodations, farm products, and photo galleries.'],
    ['farm_bookings', 'Tour & Stay Bookings', 'Tracks visitor tour bookings, guest count, accommodation selections, and payment statuses.'],
    ['products', 'Harvest Marketplace', 'Stores direct farm produce items with category, price, unit, and deliverability flags.'],
    ['orders', 'Customer Orders', 'Tracks direct harvest purchases, JSONB items, shipping address, and delivery driver status.'],
    ['shops', 'Vendor Farm Shops', 'Stores vendor shop storefront profiles associated with farm accounts.']
];
renderTable(['Table Name', 'Entity Domain', 'Business Responsibility & Contents'], summaryTable, [90, 120, 305]);

// ==================== PAGE 2: SCHEMAS ====================
doc.addPage();
drawHeader('Database Data Contract Summary');

addSectionHeader('2. Detailed Database Table Schemas');

addSubHeader('2.1 `users` Table Schema');
const userRows = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Firebase Auth UID / Unique User Identifier'],
    ['display_name', 'VARCHAR(255)', 'NOT NULL', 'Full name of user or vendor'],
    ['email', 'VARCHAR(255)', 'UNIQUE NOT NULL', 'Primary email address'],
    ['phone', 'VARCHAR(50)', 'NULLABLE', 'Contact phone number'],
    ['role', 'VARCHAR(50)', 'NOT NULL', 'Enum: customer | vendor | delivery | admin'],
    ['addresses', 'JSONB', 'DEFAULT []', 'Array of address objects with geocodes'],
    ['shops', 'JSONB', 'DEFAULT []', 'Array of vendor shop objects'],
    ['created_at', 'TIMESTAMPTZ', 'DEFAULT NOW()', 'Account creation timestamp']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Field Rules & Description'], userRows, [90, 85, 95, 245]);

addSubHeader('2.2 `farms` Table Schema (Agritourism Listings)');
const farmRows = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique farm ID / Slug (e.g. strawberry-paradise)'],
    ['farm_name', 'VARCHAR(255)', 'NOT NULL', 'Display title of the farm listing'],
    ['location', 'TEXT', 'NOT NULL', 'Address & GPS location'],
    ['description', 'TEXT', 'NULLABLE', 'Farm details narrative'],
    ['vendor_id', 'VARCHAR(255)', 'FK -> users(id)', 'Owner user ID of vendor'],
    ['vendor_name', 'VARCHAR(255)', 'NULLABLE', 'Vendor display name'],
    ['cost_per_person', 'NUMERIC(10,2)', 'DEFAULT 0', 'Ticket fee per visitor (0 = Free Entry)'],
    ['cost_type', 'VARCHAR(50)', 'DEFAULT free', 'Enum: free | payable'],
    ['accommodation_price', 'NUMERIC(10,2)', 'DEFAULT 0', 'Base price per night for stay options'],
    ['accommodations', 'JSONB', 'DEFAULT []', 'Array of stay option objects'],
    ['crops', 'JSONB', 'DEFAULT []', 'Array of crop strings (e.g. ["Spinach"])'],
    ['fruits', 'JSONB', 'DEFAULT []', 'Array of fruit strings (e.g. ["Mangoes"])'],
    ['livestock', 'JSONB', 'DEFAULT []', 'Array of animal strings (e.g. ["Gir Cows"])'],
    ['kids_activities', 'JSONB', 'DEFAULT []', 'Array of kids zone activity strings'],
    ['farm_products', 'JSONB', 'DEFAULT []', 'Direct harvest product objects'],
    ['crop_photos', 'JSONB', 'DEFAULT []', 'Produce field photo objects'],
    ['livestock_photos', 'JSONB', 'DEFAULT []', 'Livestock photo objects'],
    ['kids_photos', 'JSONB', 'DEFAULT []', 'Kids play photo objects'],
    ['accommodation_photos', 'JSONB', 'DEFAULT []', 'Stay accommodation photo objects'],
    ['gallery', 'JSONB', 'DEFAULT []', 'General farm gallery photos']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Field Rules & Description'], farmRows, [110, 80, 85, 240]);

// ==================== PAGE 3 ====================
doc.addPage();
drawHeader('Database Data Contract Summary');

addSubHeader('2.3 `farm_bookings` Table Schema');
const bookingRows = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique booking ID (e.g. booking_178523...)'],
    ['farm_id', 'VARCHAR(255)', 'FK -> farms(id)', 'Target farm listing ID'],
    ['customer_id', 'VARCHAR(255)', 'FK -> users(id)', 'Booking customer user ID'],
    ['date', 'VARCHAR(50)', 'NOT NULL', 'Scheduled visit date (YYYY-MM-DD)'],
    ['visitors_count', 'INTEGER', 'NOT NULL DEFAULT 1', 'Number of guests visiting'],
    ['cost_per_person', 'NUMERIC(10,2)', 'DEFAULT 0', 'Ticket price rate applied'],
    ['include_stay', 'BOOLEAN', 'DEFAULT false', 'Flag if stay option added'],
    ['accommodation_title', 'VARCHAR(255)', 'NULLABLE', 'Title of selected accommodation'],
    ['rooms_booked', 'INTEGER', 'DEFAULT 0', 'Rooms / huts count'],
    ['stay_cost', 'NUMERIC(10,2)', 'DEFAULT 0', 'Accommodation total cost'],
    ['total_amount', 'NUMERIC(10,2)', 'NOT NULL', 'Final payable amount in INR'],
    ['status', 'VARCHAR(50)', 'DEFAULT confirmed', 'Enum: pending | confirmed | completed | cancelled'],
    ['payment_method', 'VARCHAR(50)', 'DEFAULT Online UPI', 'Payment mode used']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Field Rules & Description'], bookingRows, [110, 80, 85, 240]);

addSubHeader('2.4 `products` Table Schema (Produce Catalog)');
const productRows = [
    ['id', 'VARCHAR(255)', 'PRIMARY KEY', 'Unique product ID (e.g. fp-101)'],
    ['name', 'VARCHAR(255)', 'NOT NULL', 'Produce name (e.g. Organic Strawberries)'],
    ['category', 'VARCHAR(100)', 'NOT NULL', 'Category: Vegetables | Fruits | Dairy & Eggs'],
    ['price', 'NUMERIC(10,2)', 'NOT NULL', 'Sale price per unit in INR (₹)'],
    ['unit', 'VARCHAR(50)', 'DEFAULT 1 kg', 'Measurement unit (kg, pack, crate)'],
    ['image', 'TEXT', 'NOT NULL', 'Product photo URL'],
    ['farm_id', 'VARCHAR(255)', 'FK -> farms(id)', 'Origin farm listing ID'],
    ['is_deliverable', 'BOOLEAN', 'DEFAULT true', 'False if product is farm pickup only'],
    ['fulfillment_type', 'VARCHAR(50)', 'DEFAULT deliverable', 'Enum: deliverable | non_deliverable | pickup_only']
];
renderTable(['Column Name', 'Data Type', 'Constraint', 'Field Rules & Description'], productRows, [100, 80, 85, 250]);

addSectionHeader('3. Sample Payload Contracts');

const farmPayloadJson = `{
  "id": "farm_1785821264",
  "name": "Mannila Organic Paradise & Berry Farm",
  "location": "Mahabaleshwar Highway, Maharashtra 412806",
  "costPerPerson": 250,
  "costType": "payable",
  "crops": ["Strawberries", "Cherry Tomatoes", "Sweet Corn"],
  "fruits": ["Alfonso Mangoes", "Guavas"],
  "livestock": ["Gir Cows", "Free-Range Poultry"],
  "kidsActivities": ["Pottery Workshop", "Petting Zoo"],
  "accommodations": [
    {
      "id": "acc-1",
      "title": "Rustic Mud Hut Stay",
      "price": "₹1,500 / night",
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
      "isDeliverable": true
    }
  ]
}`;

addCodeBlock('Agritourism Farm Payload Contract', farmPayloadJson);

// ==================== PAGE 4 ====================
doc.addPage();
drawHeader('Database Data Contract Summary');

addSectionHeader('4. API Mapping & Migration Guidelines');

const apiRows = [
    ['GET /api/farms', 'Fetch farm listings with crop/location search filters'],
    ['GET /api/farms/:id', 'Fetch complete farm details, crops, stays, products & gallery'],
    ['POST /api/farms', 'Create or update farm listing & all sections (Upsert mode)'],
    ['POST /api/farms/book', 'Place a farm visit tour or accommodation booking'],
    ['GET /api/farms/bookings/all', 'Fetch vendor farm bookings for management dashboard'],
    ['GET /api/products', 'Fetch marketplace harvest products by category/farm'],
    ['POST /api/orders', 'Place direct harvest marketplace orders']
];

renderTable(['REST API Endpoint', 'Frontend Usage Contract & Business Function'], apiRows, [150, 365]);

addSubHeader('4.1 Engineering & DB Migration Directives');

const directiveRows = [
    ['GIN Indexing', 'Create GIN indexes on `farms.crops`, `farms.fruits`, and `farms.farm_products` for high-speed tag searching.'],
    ['Idempotent Upserts', 'Use `ON CONFLICT (id) DO UPDATE` for `POST /api/farms` to allow progressive saving without duplicate creation.'],
    ['Currency Precision', 'Use NUMERIC(10, 2) for monetary values (`cost_per_person`, `total_amount`, `price`) to prevent rounding issues.']
];

renderTable(['Architecture Directive', 'Technical Implementation Directive'], directiveRows, [140, 375]);

// Footer for all pages
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    drawFooter(i + 1, totalPages);
}

doc.end();

stream.on('finish', () => {
    console.log('Database Data Contract Summary PDF successfully generated at:', outputPath);
});
