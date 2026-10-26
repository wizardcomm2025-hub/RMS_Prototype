// Wize Restaurant RMS — Setting
// Location, Department, Reason of Wastage, Vehicle Master, Driver Master.
(() => {
  const R = window.RMS;
  const { esc, store, chip, status, ava, money, expiry, fmtDate, crud, IC } = R;
  const D = window.RMSData;
  const { STATES, LOC_TYPES, LOC_CHIP, locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories, vehicles, drivers, taxes,
    UOMS, VEH_TYPES } = D;

  // =============== SETTING ===============
  crud({
    key: 'location', group: 'setting', title: 'Location', entity: 'Location', db: locations,
    sub: 'Every outlet, store and kitchen you run. Stock, users, POS and requisitions are tracked per location.',
    info: 'A <b>Location</b> is one outlet, warehouse or central kitchen. Set these up first — <a href="#users">Users</a>, stock, requisitions and <a href="#pos-table-config">POS tables</a> are all tracked per location.',
    name: r => r.name, unique: ['name', 'code'],
    stats: rows => [
      { label: 'Total locations', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Outlets (POS)', value: rows.filter(r => r.pos).length, sub: 'billing enabled', filter: 'pos' },
      { label: 'Warehouses / Stores', value: rows.filter(r => r.type === 'WH').length, sub: 'hold stock', filter: 'WH' },
      { label: 'Central Kitchens', value: rows.filter(r => r.type === 'CK').length, sub: 'prepare semi-finished', filter: 'CK' },
    ],
    statFilter: (r, f) => (f === 'pos' ? r.pos : r.type === f),
    filters: [{ key: 'type', label: 'All Types', options: Object.entries(LOC_TYPES).map(([v, l]) => ({ v, l })), match: (r, v) => r.type === v }],
    searchText: r => [r.name, r.code, r.city, r.manager].join(' '),
    columns: [
      { h: 'Location', render: r => `${esc(r.name)} ${r.isDefault ? chip('Default', 'grey') : ''}<span class="rc-code">${esc(r.code)}</span>` },
      { h: 'Type', render: r => chip(LOC_TYPES[r.type], LOC_CHIP[r.type]) },
      { h: 'Address', render: r => `<span style="font-weight:500">${esc(r.line1)}</span><span class="sub-line">${esc(r.city)}, ${esc(r.state)} – ${esc(r.pin)}</span>` },
      { h: 'Manager', render: r => r.manager ? `<span class="who">${ava(r.manager, 28)}<span style="font-weight:500">${esc(r.manager)}</span></span>` : '<span class="muted">Not assigned</span>' },
      { h: 'Capabilities', render: r => `<span class="chips">${r.pos ? chip('POS', 'finished') : ''}${r.canReq ? chip('Requisition') : ''}${!r.pos && !r.canReq ? '<span class="muted">—</span>' : ''}</span>` },
    ],
    toggle: { field: 'active', block: r => (r.isDefault ? 'This is the <b>default location</b>. Make another location default first.' : '') },
    deleteBlock: r => { const n = users().all().filter(u => u.loc === r.name).length; return n ? `<b>${n} user(s)</b> are assigned to this location. Move them to another location first, or mark it Inactive.` : (r.isDefault ? 'The default location cannot be deleted.' : ''); },
    defaults: () => ({ type: 'OUT', state: 'West Bengal', canReq: true, pos: true, isDefault: false }),
    beforeSave: d => { if (d.isDefault) locations().all().forEach(l => { if (l.id !== d.id && l.isDefault) { l.isDefault = false; } }); },
    form: {
      size: 'md', addTitle: 'Add New Location', saveLabel: 'Save Location',
      sections: [
        { title: 'Basic details', fields: [
          { key: 'name', label: 'Location Name', req: true, placeholder: 'e.g. Salt Lake Sector V', span: 'span2' },
          { key: 'code', label: 'Short Code', req: true, placeholder: 'e.g. SLV', maxlength: 5, upper: true, hint: 'Used on bills, requisitions & reports.' },
          { key: 'type', label: 'Location Type', req: true, type: 'select', options: Object.entries(LOC_TYPES).map(([v, l]) => ({ v, l })), rerender: true, onChange: d => { if (d.type === 'WH') d.pos = false; } },
          { key: 'manager', label: 'Location Manager', type: 'select', options: () => users().all().filter(u => u.active).map(u => fullName(u)), placeholder: 'Select employee' },
          { key: 'phone', label: 'Contact Phone', type: 'tel', placeholder: '10-digit mobile', pattern: /^[6-9]\d{9}$/, patternMsg: 'Enter a valid 10-digit mobile number' },
        ] },
        { title: 'Address', fields: [
          { key: 'line1', label: 'Address Line 1', req: true, placeholder: 'Building, street', span: 'full' },
          { key: 'line2', label: 'Address Line 2', placeholder: 'Area, landmark (optional)', span: 'full' },
          { key: 'city', label: 'City', req: true, placeholder: 'e.g. Kolkata' },
          { key: 'state', label: 'State', req: true, type: 'select', options: STATES },
          { key: 'pin', label: 'Pincode', req: true, placeholder: '6 digits', pattern: /^\d{6}$/, patternMsg: 'Pincode must be 6 digits', maxlength: 6 },
          { key: 'gstin', label: 'GSTIN (if billed separately)', placeholder: '15-character GSTIN', upper: true, pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, patternMsg: 'Enter a valid 15-character GSTIN' },
        ] },
        { title: 'Capabilities', cols: 1, fields: [
          { key: 'pos', type: 'switch', label: 'POS Outlet', desc: 'Bills are raised here; tables & order channels can be configured.', show: d => d.type !== 'WH' },
          { key: 'canReq', type: 'switch', label: 'Can raise requisitions', desc: 'Staff here can request stock from a warehouse or central kitchen.' },
          { key: 'isDefault', type: 'switch', label: 'Default location', desc: 'Pre-selected for new users and documents. Only one location can be default.' },
        ] },
      ],
    },
  });

  crud({
    key: 'department', group: 'setting', title: 'Department', entity: 'Department', db: departments,
    sub: 'Teams your staff belong to. Used in User List, Roster Patterns and reports.',
    info: 'Departments group your staff for rostering and reporting. Needed before you can add a <a href="#users">User</a>, and a <a href="#rosterpattern">Roster Pattern</a> is assigned to a department.',
    name: r => r.name, unique: ['name'],
    searchText: r => r.name + ' ' + r.code + ' ' + r.head,
    columns: [
      { h: 'Department', render: r => `${esc(r.name)}<span class="rc-code">${esc(r.code || '')}</span>` },
      { h: 'Department Head', render: r => r.head ? `<span class="who">${ava(r.head, 28)}<span style="font-weight:500">${esc(r.head)}</span></span>` : '<span class="muted">Not assigned</span>' },
      { h: 'Staff', cls: 'num', render: r => { const n = users().all().filter(u => u.dept === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
    ],
    toggle: { field: 'active' },
    filters: [{ key: 'st', label: 'All Status', options: [{ v: 'on', l: 'Active' }, { v: 'off', l: 'Inactive' }], match: (r, v) => (v === 'on' ? r.active : !r.active) }],
    deleteBlock: r => { const n = users().all().filter(u => u.dept === r.name).length; return n ? `<b>${n} staff member(s)</b> belong to this department. Re-assign them first.` : ''; },
    form: { size: '', saveLabel: 'Save Department', sections: [{ fields: [
      { key: 'name', label: 'Department Name', req: true, placeholder: 'e.g. Kitchen / Food Preparation', span: 'full' },
      { key: 'code', label: 'Code', placeholder: 'e.g. KIT', upper: true, maxlength: 5 },
      { key: 'head', label: 'Department Head', type: 'select', options: () => users().all().map(fullName), placeholder: 'Select employee' },
      { key: 'desc', label: 'Description', type: 'textarea', placeholder: 'What this team does (optional)', span: 'full' },
      { key: 'active', type: 'switch', label: 'Active', desc: 'Inactive departments cannot be selected for new users.', span: 'full' },
    ] }] },
  });

  const WASTE_CAT = { KIT: 'Kitchen / Prep', STO: 'Storage', SRV: 'Service', OTH: 'Other' };
  crud({
    key: 'wastage', group: 'setting', title: 'Reason of Wastage', entity: 'Wastage Reason', db: () => store('wastage', () => [
      ['Expired', 'STO'], ['Spoiled', 'STO'], ['Temperature Issue', 'STO'], ['Pest Contamination', 'STO'], ['Packaging Damage', 'STO'], ['Power Failure', 'STO'],
      ['Overcooked / Burnt', 'KIT'], ['Preparation Error', 'KIT'], ['Overproduction', 'KIT'], ['Portioning Error', 'KIT'], ['Cleaning / Trimming Waste', 'KIT'], ['Test / Trial Preparation', 'KIT'],
      ['Customer Return', 'SRV'], ['Spillage', 'SRV'], ['Dropped / Damaged', 'SRV'], ['Incorrect Order', 'SRV'], ['Poor Quality', 'SRV'], ['Other', 'OTH'],
    ].map(([name, cat], i) => ({ name, cat, photo: ['STO', 'SRV'].includes(cat) && i % 2 === 0, approval: cat === 'SRV', appliesTo: ['Raw Material', 'Semi-Finished', 'Finished Goods'] }))),
    sub: 'Reasons staff pick when they record wastage. Clear reasons give accurate wastage reports.',
    info: 'These are the reasons staff pick when they write off stock. The wastage report totals by <b>category</b>, and the rules you set here — photo required, manager approval — apply everywhere stock is written off.',
    name: r => r.name, unique: ['name'],
    seg: { options: Object.entries(WASTE_CAT).map(([v, l]) => ({ v, l })), match: (r, v) => r.cat === v },
    columns: [
      { h: 'Wastage Reason', render: r => esc(r.name) },
      { h: 'Category', render: r => chip(WASTE_CAT[r.cat], { KIT: 'semi', STO: '', SRV: 'purple', OTH: 'grey' }[r.cat]) },
      { h: 'Applies To', render: r => `<span class="chips">${(r.appliesTo || []).map(a => chip(a.split(' ')[0], 'outline')).join('')}</span>` },
      { h: 'Rules', render: r => `<span class="chips">${r.photo ? chip('Photo required', 'grey') : ''}${r.approval ? chip('Needs approval', 'semi') : ''}${!r.photo && !r.approval ? '<span class="muted">—</span>' : ''}</span>` },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ cat: 'KIT', appliesTo: ['Raw Material', 'Semi-Finished', 'Finished Goods'] }),
    form: { saveLabel: 'Save Reason', sections: [{ cols: 1, fields: [
      { key: 'name', label: 'Wastage Reason', req: true, placeholder: 'e.g. Overcooked / Burnt' },
      { key: 'cat', label: 'Category', req: true, type: 'select', options: Object.entries(WASTE_CAT).map(([v, l]) => ({ v, l })), hint: 'Groups reasons in the wastage report.' },
      { key: 'appliesTo', label: 'Applies to', req: true, type: 'pills', options: ['Raw Material', 'Semi-Finished', 'Finished Goods'] },
      { key: 'photo', type: 'switch', label: 'Photo required', desc: 'Staff must attach a photo when using this reason.' },
      { key: 'approval', type: 'switch', label: 'Needs manager approval', desc: 'Entry is held until a manager approves it.' },
      { key: 'active', type: 'switch', label: 'Active' },
    ] }] },
  });

  crud({
    key: 'vehicle', group: 'setting', title: 'Vehicle Master', entity: 'Vehicle', db: vehicles,
    sub: 'Delivery and transfer vehicles. Assign a driver and track document expiry.',
    info: 'Vehicles used for delivery and stock transfer between <a href="#location">Locations</a>. A vehicle needs an assigned <a href="#driver">Driver</a> before it can be dispatched, and expired insurance should take it off the road.',
    name: r => r.reg, unique: ['reg'], searchPh: 'Search by registration, model or driver...',
    searchText: r => [r.reg, r.make, r.driver, r.type].join(' '),
    stats: rows => [
      { label: 'Vehicles', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Without driver', value: rows.filter(r => !r.driver).length, sub: 'cannot be dispatched', cls: rows.some(r => !r.driver) ? 'warn' : '', filter: 'nodriver' },
      { label: 'Insurance due ≤ 30 days', value: rows.filter(r => R.daysBetween(R.ymd(R.TODAY), r.insurance) <= 30).length, sub: 'renew to stay compliant', cls: 'bad', filter: 'ins' },
    ],
    statFilter: (r, f) => (f === 'nodriver' ? !r.driver : R.daysBetween(R.ymd(R.TODAY), r.insurance) <= 30),
    filters: [{ key: 'type', label: 'All Vehicle Types', options: VEH_TYPES, match: (r, v) => r.type === v }],
    columns: [
      { h: 'Registration No.', render: r => `<span class="code" style="font-size:12.5px">${esc(r.reg)}</span>` },
      { h: 'Vehicle', render: r => `${esc(r.make)}<span class="sub-line">${esc(r.type)} · ${r.capacity} kg</span>` },
      { h: 'Assigned Driver', render: r => r.driver ? `<span class="who">${ava(r.driver, 28)}<span style="font-weight:500">${esc(r.driver)}</span></span>` : chip('Not assigned', 'semi') },
      { h: 'Insurance Valid Till', render: r => expiry(r.insurance) },
      { h: 'Fitness / PUC', render: r => expiry(r.fitness) },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ type: 'Two-wheeler' }),
    afterSave: d => { drivers().all().forEach(dr => { if (dr.vehicle === d.reg && dr.name !== d.driver) dr.vehicle = ''; if (dr.name === d.driver) dr.vehicle = d.reg; }); drivers().save(); },
    form: { size: 'md', addTitle: 'Add New Vehicle', saveLabel: 'Save Vehicle', sections: [
      { title: 'Vehicle', fields: [
        { key: 'reg', label: 'Registration Number', req: true, upper: true, placeholder: 'e.g. WB 02 AK 4521', pattern: /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{4}$/, patternMsg: 'Format like WB 02 AK 4521', hint: 'As printed on the RC.' },
        { key: 'type', label: 'Vehicle Type', req: true, type: 'select', options: VEH_TYPES },
        { key: 'make', label: 'Make & Model', req: true, placeholder: 'e.g. Tata Ace Gold' },
        { key: 'capacity', label: 'Load Capacity', type: 'number', min: 0, suffix: 'kg', placeholder: 'e.g. 500' },
        { key: 'driver', label: 'Assigned Driver', type: 'select', options: () => drivers().all().filter(x => x.active).map(x => x.name), placeholder: 'Select driver (optional)', span: 'full' },
      ] },
      { title: 'Documents', fields: [
        { key: 'insurance', label: 'Insurance Valid Till', type: 'date', req: true, hint: 'You will be alerted 30 days before expiry.' },
        { key: 'fitness', label: 'Fitness / PUC Valid Till', type: 'date' },
        { key: 'active', type: 'switch', label: 'Active', desc: 'Inactive vehicles are hidden from dispatch.', span: 'full' },
      ] },
    ] },
  });

  crud({
    key: 'driver', group: 'setting', title: 'Driver Master', entity: 'Driver', db: drivers,
    sub: 'Drivers who deliver orders or move stock between locations.',
    info: 'Drivers who deliver orders and move stock. Give each one a <a href="#vehicle">Vehicle</a> and keep the licence date current — an expired licence means they must not drive.',
    name: r => r.name, unique: ['license'],
    searchText: r => [r.name, r.phone, r.license, r.vehicle].join(' '),
    stats: rows => [
      { label: 'Drivers', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Licence expiring ≤ 30 days', value: rows.filter(r => R.daysBetween(R.ymd(R.TODAY), r.licExp) <= 30 && R.daysBetween(R.ymd(R.TODAY), r.licExp) >= 0).length, sub: 'ask for renewal', cls: 'warn' },
      { label: 'Licence expired', value: rows.filter(r => R.daysBetween(R.ymd(R.TODAY), r.licExp) < 0).length, sub: 'must not drive', cls: 'bad' },
    ],
    columns: [
      { h: 'Driver', render: r => `<span class="who">${ava(r.name)}<span><b>${esc(r.name)}</b><span class="sub-line">${esc(r.phone)}</span></span></span>` },
      { h: 'Licence No.', render: r => `<span class="code">${esc(r.license)}</span>` },
      { h: 'Licence Valid Till', render: r => expiry(r.licExp) },
      { h: 'Vehicle', render: r => r.vehicle ? `<span class="code">${esc(r.vehicle)}</span>` : '<span class="muted">—</span>' },
    ],
    toggle: { field: 'active' },
    form: { size: 'md', addTitle: 'Add New Driver', saveLabel: 'Save Driver', sections: [
      { title: 'Driver details', fields: [
        { key: 'name', label: 'Driver Name', req: true, placeholder: 'Full name', span: 'full' },
        { key: 'phone', label: 'Mobile Number', req: true, type: 'tel', placeholder: '10-digit mobile', pattern: /^[6-9]\d{9}$/, patternMsg: 'Enter a valid 10-digit mobile number' },
        { key: 'photo', label: 'Photo', type: 'custom', span: '', render: d => `<span class="field-lbl">Photo (optional)</span><div class="img-pick">${ava(d.name || 'Driver', 42)}<button type="button" class="btn-outline">Upload photo</button><span class="fhint" style="margin:0">JPG/PNG, max 2 MB</span></div>` },
        { key: 'addr', label: 'Address', placeholder: 'Area, city', span: 'full' },
      ] },
      { title: 'Licence & vehicle', fields: [
        { key: 'license', label: 'Driving Licence No.', req: true, upper: true, placeholder: 'e.g. WB0220190012345', pattern: /^[A-Z]{2}\d{2}\s?\d{11}$/, patternMsg: 'Format: 2 letters + 13 digits (e.g. WB0220190012345)' },
        { key: 'licExp', label: 'Licence Valid Till', type: 'date', req: true },
        { key: 'vehicle', label: 'Assigned Vehicle', type: 'select', options: () => vehicles().all().map(v => ({ v: v.reg, l: `${v.reg} · ${v.make}` })), placeholder: 'None', span: 'full' },
        { key: 'active', type: 'switch', label: 'Active', span: 'full' },
      ] },
    ] },
  });
})();
