// Wize Restaurant RMS — shared master data
// Every seeded store the modules read from, published as window.RMSData so each
// module file can stay independent of the others.
(() => {
  const { store } = window.RMS;

  // ---------- shared reference data ----------
  const STATES = ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'Assam', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Gujarat'];
  const LOC_TYPES = { WH: 'Warehouse', OUT: 'Outlet', CK: 'Central Kitchen' };
  const LOC_CHIP = { WH: '', OUT: 'finished', CK: 'semi' };

  const locations = () => store('locations', () => [
    { name: 'Rashbehari Kitchen', code: 'RBK', type: 'OUT', manager: 'Uttiyo Ghosh', line1: '114, KN Sen Rd, New Ballygunge, Kasba', city: 'Kolkata', state: 'West Bengal', pin: '700042', phone: '9830770140', gstin: '19AABCW1234F1Z5', isDefault: true, canReq: true, pos: true },
    { name: 'Rashbehari Avenue Store', code: 'RBA', type: 'WH', manager: 'Vikram Singh', line1: '114, KN Sen Rd, New Ballygunge, Kasba', city: 'Kolkata', state: 'West Bengal', pin: '700042', phone: '9830011223', gstin: '', isDefault: false, canReq: false, pos: false },
    { name: 'Salt Lake Sector V', code: 'SLV', type: 'OUT', manager: 'Priya Sharma', line1: 'DN-24, Sector V, Salt Lake', city: 'Kolkata', state: 'West Bengal', pin: '700091', phone: '9830044556', gstin: '19AABCW1234F2Z4', isDefault: false, canReq: true, pos: true },
    { name: 'Central Kitchen – Topsia', code: 'CKT', type: 'CK', manager: 'Rahul Das', line1: '12, Topsia Road', city: 'Kolkata', state: 'West Bengal', pin: '700046', phone: '9830099887', gstin: '', isDefault: false, canReq: true, pos: false },
  ]);
  const departments = () => store('departments', () => [
    ['Kitchen / Food Preparation', 'KIT', 'Rahul Das'], ['Service / Floor', 'SRV', 'Amit Roy'], ['Purchasing / Procurement', 'PUR', 'Vikram Singh'], ['Inventory / Store', 'STR', 'Vikram Singh'],
    ['Management / Administration', 'ADM', 'Uttiyo Ghosh'], ['Human Resources (HR)', 'HR', 'Mohitosh Sen'], ['Delivery / Takeaway', 'DEL', ''], ['Housekeeping', 'HK', 'Sneha Paul'],
    ['Billing / Cashier', 'BIL', 'Priya Sharma'], ['Bakery & Pastry', 'BAK', ''], ['Maintenance', 'MNT', ''], ['Marketing & Sales', 'MKT', ''],
  ].map(([name, code, head], i) => ({ name, code, head, desc: '', active: i !== 11 })));
  const roles = () => store('roles', () => [
    { name: 'Administrator', desc: 'Full access to every module and setting.', perms: 'ALL' },
    { name: 'Outlet Manager', desc: 'Runs an outlet — staff, roster, stock and approvals.', perms: 'MANAGER' },
    { name: 'Executive Chef', desc: 'Oversees the kitchen, menu and recipes.', perms: 'CHEF' },
    { name: 'Head Chef', desc: 'Runs daily kitchen operations.', perms: 'CHEF' },
    { name: 'Store Manager', desc: 'Manages stock, purchase and vendors.', perms: 'STORE' },
    { name: 'Cashier', desc: 'Billing on POS.', perms: 'SELF' },
    { name: 'Steward', desc: 'Floor service staff.', perms: 'SELF' },
    { name: 'Housekeeping Staff', desc: 'Fills assigned checklists.', perms: 'SELF' },
  ]);
  const users = () => store('users', () => [
    ['Uttiyo', 'Ghosh', 'uttiyo.ghosh@wize.in', '9830770140', 'Administrator', 'Management / Administration', 'Rashbehari Kitchen', 'EMP001', 'Today, 09:42'],
    ['Mohitosh', 'Sen', 'mohitosh.sen@wize.in', '9810020030', 'Administrator', 'Human Resources (HR)', 'Rashbehari Kitchen', 'EMP002', 'Yesterday, 18:10'],
    ['Rahul', 'Das', 'rahul.das@wize.in', '9830112233', 'Executive Chef', 'Kitchen / Food Preparation', 'Central Kitchen – Topsia', 'EMP003', 'Today, 08:05'],
    ['Priya', 'Sharma', 'priya.sharma@wize.in', '9830445566', 'Outlet Manager', 'Billing / Cashier', 'Salt Lake Sector V', 'EMP004', 'Today, 10:15'],
    ['Vikram', 'Singh', 'vikram.singh@wize.in', '9830778899', 'Store Manager', 'Inventory / Store', 'Rashbehari Avenue Store', 'EMP005', '21 Oct, 17:30'],
    ['Amit', 'Roy', 'amit.roy@wize.in', '9831234567', 'Steward', 'Service / Floor', 'Rashbehari Kitchen', 'EMP006', 'Today, 11:02'],
    ['Sneha', 'Paul', 'sneha.paul@wize.in', '9831987654', 'Housekeeping Staff', 'Housekeeping', 'Rashbehari Kitchen', 'EMP007', 'Today, 07:58'],
    ['Arjun', 'Mehta', 'arjun.mehta@wize.in', '9832456789', 'Head Chef', 'Kitchen / Food Preparation', 'Rashbehari Kitchen', 'EMP008', 'Today, 08:40'],
    ['Riya', 'Banerjee', 'riya.banerjee@wize.in', '9833567812', 'Cashier', 'Billing / Cashier', 'Rashbehari Kitchen', 'EMP009', 'Never'],
  ].map(([first, last, email, phone, role, dept, loc, code, lastLogin], i) => ({ first, middle: '', last, email, phone, cc: '+91', role, dept, loc, code, lastLogin, active: i !== 8, line1: '', city: 'Kolkata', state: 'West Bengal', pin: '', join: '2025-0' + (1 + (i % 9)) + '-15' })));
  const fullName = u => [u.first, u.middle, u.last].filter(Boolean).join(' ');
  const vendors = () => store('vendors', () => [
    { name: 'Spencer\'s Retail', gstin: '19AAACS1234K1ZQ', contact: 'Sanjay Kumar', phone: '9830123456', wa: '9830123456', email: 'orders@spencers.in', website: 'spencers.in', line1: 'Gariahat Road', city: 'Kolkata', state: 'West Bengal', pin: '700019', terms: 'Net 15', lead: 1, supplies: ['Dry Goods & Grains', 'Dairy & Eggs'], active: false },
    { name: 'IndiaMART Wholesale', gstin: '07AAACI1681G1ZN', contact: 'Neha Gupta', phone: '9876543210', wa: '9876543210', email: 'b2b@indiamart.com', website: 'indiamart.com', line1: 'Sector 2', city: 'Noida', state: 'Uttar Pradesh', pin: '201301', terms: 'Advance', lead: 4, supplies: ['Packaging & Disposables'], active: true },
    { name: 'Fresh Farm Produce', gstin: '19AAFCF5521M1Z2', contact: 'Bikash Mondal', phone: '9831002003', wa: '9831002003', email: 'freshfarm@gmail.com', website: '', line1: 'Koley Market, Sealdah', city: 'Kolkata', state: 'West Bengal', pin: '700014', terms: 'Net 7', lead: 0, supplies: ['Fresh Produce', 'Fresh Herbs & Greens'], active: true },
    { name: 'Haringhata Meat', gstin: '19AAAGH4410Q1ZB', contact: 'Ratan Pal', phone: '9831777666', wa: '', email: 'sales@haringhatameat.in', website: 'haringhatameat.in', line1: 'Mohanpur, Nadia', city: 'Nadia', state: 'West Bengal', pin: '741246', terms: 'Net 7', lead: 1, supplies: ['Meat & Poultry'], active: true },
    { name: 'Metro Cash & Carry', gstin: '19AAACM8811D1Z9', contact: 'Arindam Saha', phone: '9830666555', wa: '9830666555', email: 'kolkata@metro.co.in', website: 'metro.co.in', line1: 'Kona Expressway', city: 'Howrah', state: 'West Bengal', pin: '711114', terms: 'Net 30', lead: 2, supplies: ['Dry Goods & Grains', 'Spices & Seasonings', 'Edible Oils & Fats', 'Beverage Stock'], active: true },
  ]);
  const brands = () => store('brands', () => ['Amul', 'Mother Dairy', 'Fortune', 'Emami', 'Aashirvaad', 'Tata Consumer', 'Hindustan Unilever', 'ITC', 'Coca-Cola', 'Haldiram\'s', 'MDH', 'Everest', 'Kissan', 'Nestlé'].map((name, i) => ({ name, active: i !== 13 })));
  const subBrands = () => store('subbrands', () => [['Thums Up', 'Coca-Cola'], ['Sprite', 'Coca-Cola'], ['Kinley', 'Coca-Cola'], ['Amul Butter', 'Amul'], ['Amul Gold', 'Amul'], ['Fortune Kachi Ghani', 'Fortune'], ['Tata Tea Gold', 'Tata Consumer'], ['Tata Salt', 'Tata Consumer'], ['Aashirvaad Atta', 'Aashirvaad'], ['Kissan Ketchup', 'Kissan']].map(([name, brand]) => ({ name, brand })));
  const rawMaterials = () => store('rawmaterials', () => [
    ['Basmati Rice (Premium)', 'RM-RIC-001', 'Rice', 'Dry Goods & Grains', '', '', 'Kg', 'g', 1000, 25, 50, 365, 'Dry', 'Metro Cash & Carry', 118, 12],
    ['Amul Butter 500 g', 'RM-BTR-001', 'Butter & Ghee', 'Dairy & Eggs', 'Amul', 'Amul Butter', 'Pack', 'g', 500, 10, 20, 90, 'Chilled', 'Metro Cash & Carry', 285, 30],
    ['Chicken Curry Cut', 'RM-CHK-001', 'Chicken', 'Meat & Poultry', '', '', 'Kg', 'g', 1000, 15, 10, 2, 'Chilled', 'Haringhata Meat', 240, 4],
    ['Mustard Oil 15 L Tin', 'RM-OIL-001', 'Edible Oils & Fats', 'Edible Oils & Fats', 'Fortune', 'Fortune Kachi Ghani', 'Tin', 'L', 15, 2, 1, 270, 'Dry', 'Metro Cash & Carry', 2450, 0],
    ['Onion', 'RM-VEG-001', 'Vegetables', 'Fresh Produce', '', '', 'Kg', 'g', 1000, 40, 25, 15, 'Dry', 'Fresh Farm Produce', 38, 55],
    ['Tomato', 'RM-VEG-002', 'Vegetables', 'Fresh Produce', '', '', 'Kg', 'g', 1000, 20, 10, 5, 'Chilled', 'Fresh Farm Produce', 32, 8],
    ['Paneer', 'RM-CHS-001', 'Cheese & Paneer', 'Dairy & Eggs', 'Amul', '', 'Kg', 'g', 1000, 8, 5, 4, 'Chilled', 'Metro Cash & Carry', 360, 6],
    ['Haldi Powder', 'RM-GSP-001', 'Ground Spices', 'Spices & Seasonings', 'MDH', '', 'Kg', 'g', 1000, 2, 1, 365, 'Dry', 'Metro Cash & Carry', 260, 3],
    ['Dhania Powder', 'RM-GSP-002', 'Ground Spices', 'Spices & Seasonings', 'Everest', '', 'Kg', 'g', 1000, 2, 1, 365, 'Dry', '', 220, 1],
    ['Thums Up 750 ml', 'RM-SFT-001', 'Soft Drinks & Juices', 'Beverage Stock', 'Coca-Cola', 'Thums Up', 'Crate', 'Bottle', 24, 4, 2, 180, 'Dry', 'Metro Cash & Carry', 840, 6],
    ['Takeaway Container 500 ml', 'RM-PKG-001', 'Packaging & Disposables', 'Packaging & Disposables', '', '', 'Box', 'Pcs', 100, 5, 5, 0, 'Dry', 'IndiaMART Wholesale', 650, 2],
    ['Frozen Prawns', 'RM-SHL-001', 'Shellfish & Prawns', 'Seafood', '', '', 'Kg', 'g', 1000, 5, 5, 180, 'Frozen', '', 620, 7],
  ].map(([name, sku, cat, parent, brand, sub, pu, su, conv, reorder, moq, shelf, storage, vendor, price, stock]) => ({ name, sku, cat, parent, brand, sub, pu, su, conv, reorder, moq, shelf, storage, vendor, price, stock, gst: 5, yieldP: 100, usedBy: ['Rashbehari Kitchen', 'Salt Lake Sector V'], desc: '' })));

  // categories from the user's Category Master (their localStorage), fallback list
  function rmCategories() {
    try {
      const all = JSON.parse(localStorage.getItem('rms_item_categories_v4') || '[]').filter(c => c.type === 'RM' && c.active !== false);
      if (all.length) {
        const byId = Object.fromEntries(all.map(c => [c.id, c]));
        return all.map(c => ({ v: c.name, l: c.parentId && byId[c.parentId] ? `${byId[c.parentId].name} › ${c.name}` : c.name, parent: c.parentId && byId[c.parentId] ? byId[c.parentId].name : c.name }));
      }
    } catch (e) { /* ignore */ }
    return ['Dairy & Eggs', 'Meat & Poultry', 'Seafood', 'Fresh Produce', 'Dry Goods & Grains', 'Spices & Seasonings', 'Edible Oils & Fats', 'Beverage Stock', 'Packaging & Disposables'].map(x => ({ v: x, l: x, parent: x }));
  }
  const UOMS = ['Kg', 'g', 'L', 'ml', 'Pcs', 'Pack', 'Box', 'Tin', 'Crate', 'Bottle', 'Dozen', 'Bag'];

  const VEH_TYPES = ['Two-wheeler', 'Three-wheeler', 'Van', 'Mini Truck', 'Car'];
  const vehicles = () => store('vehicles', () => [
    { reg: 'WB 02 AK 4521', type: 'Two-wheeler', make: 'Honda Activa 6G', capacity: 15, driver: 'Sunil Yadav', insurance: '2027-03-12', fitness: '2030-01-01' },
    { reg: 'WB 06 F 7788', type: 'Van', make: 'Maruti Eeco Cargo', capacity: 500, driver: 'Raju Sk', insurance: '2026-11-05', fitness: '2027-06-30' },
    { reg: 'WB 24 C 1102', type: 'Mini Truck', make: 'Tata Ace Gold', capacity: 750, driver: '', insurance: '2026-10-10', fitness: '2026-12-31' },
  ]);
  const drivers = () => store('drivers', () => [
    { name: 'Sunil Yadav', phone: '9831455667', license: 'WB0220190012345', licExp: '2029-05-20', vehicle: 'WB 02 AK 4521', addr: 'Kasba, Kolkata' },
    { name: 'Raju Sk', phone: '9831233445', license: 'WB0620170098765', licExp: '2026-11-15', vehicle: 'WB 06 F 7788', addr: 'Tiljala, Kolkata' },
    { name: 'Manoj Kumar', phone: '9832556677', license: 'WB2420150054321', licExp: '2026-09-30', vehicle: '', addr: 'Topsia, Kolkata', active: false },
  ]);

  const taxes = () => store('taxes', () => [
    { name: 'GST 5% (Restaurant)', code: 'GST5', mode: 'EXC', comps: [{ n: 'CGST', p: 2.5 }, { n: 'SGST', p: 2.5 }], appliesTo: ['Dine-in', 'Takeaway', 'Delivery'], isDefault: true },
    { name: 'GST 18% (Outdoor Catering)', code: 'GST18', mode: 'EXC', comps: [{ n: 'CGST', p: 9 }, { n: 'SGST', p: 9 }], appliesTo: ['Catering'], isDefault: false },
    { name: 'IGST 5% (Inter-state)', code: 'IGST5', mode: 'EXC', comps: [{ n: 'IGST', p: 5 }], appliesTo: ['Delivery'], isDefault: false, active: false },
    { name: 'Service Charge', code: 'SC', mode: 'EXC', comps: [{ n: 'Service Charge', p: 5 }], appliesTo: ['Dine-in'], isDefault: false, optional: true },
  ]);

  window.RMSData = {
    STATES, LOC_TYPES, LOC_CHIP,
    locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories,
    vehicles, drivers, taxes,
    UOMS, VEH_TYPES,
  };
})();
