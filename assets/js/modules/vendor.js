// Wize Restaurant RMS — Vendor
// Suppliers mapped to raw materials.
(() => {
  const R = window.RMS;
  const { esc, store, chip, status, ava, money, expiry, fmtDate, crud, IC } = R;
  const D = window.RMSData;
  const { STATES, LOC_TYPES, LOC_CHIP, locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories, vehicles, drivers, taxes,
    UOMS, VEH_TYPES } = D;

  // =============== VENDOR ===============
  crud({
    key: 'vendor', group: 'vendor', title: 'Vendor', entity: 'Vendor', db: vendors,
    sub: 'Suppliers you buy raw materials from. Used in purchase orders and goods receive.',
    info: 'Vendors supply your <a href="#rawmaterial">Raw Materials</a>. Set a preferred vendor on each item so reorder alerts and purchase orders know who to buy from, and keep GSTIN and payment terms accurate for billing.',
    name: r => r.name, unique: ['name', 'gstin'], export: true,
    searchText: r => [r.name, r.gstin, r.contact, r.phone, r.city].join(' '), searchPh: 'Search by name, GSTIN, contact or city...',
    stats: rows => [
      { label: 'Vendors', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Items mapped', value: rawMaterials().all().filter(x => x.vendor).length, sub: `${rawMaterials().all().filter(x => !x.vendor).length} items have no vendor`, cls: '' },
      { label: 'Avg. lead time', value: (rows.reduce((s, r) => s + Number(r.lead || 0), 0) / Math.max(1, rows.length)).toFixed(1) + ' days', sub: 'order → delivery' },
    ],
    filters: [{ key: 'terms', label: 'All Payment Terms', options: ['Advance', 'Net 7', 'Net 15', 'Net 30'], match: (r, v) => r.terms === v }],
    columns: [
      { h: 'Vendor', render: r => `${esc(r.name)}<span class="rc-code">GSTIN ${esc(r.gstin)}</span>` },
      { h: 'Contact', render: r => `<span style="font-weight:500">${esc(r.contact)}</span><span class="sub-line">${esc(r.phone)}${r.wa ? ' · WhatsApp ✓' : ''}</span>` },
      { h: 'Supplies', render: r => `<span class="chips">${(r.supplies || []).slice(0, 2).map(s => chip(s, 'grey')).join('')}${(r.supplies || []).length > 2 ? `<span class="muted">+${r.supplies.length - 2}</span>` : ''}</span>` },
      { h: 'Items', cls: 'num', render: r => { const n = rawMaterials().all().filter(x => x.vendor === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
      { h: 'Terms', render: r => `<span style="font-weight:500;white-space:nowrap">${esc(r.terms)}</span><span class="sub-line">Lead ${r.lead} day${r.lead == 1 ? '' : 's'}</span>` },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ state: 'West Bengal', terms: 'Net 15', lead: 1, waSame: true, supplies: [] }),
    beforeSave: d => { if (d.waSame) d.wa = d.phone; },
    form: { size: 'lg', addTitle: 'Add New Vendor', saveLabel: 'Save Vendor', sections: [
      { title: 'Business', fields: [
        { key: 'name', label: 'Vendor / Business Name', req: true, placeholder: 'e.g. Metro Cash & Carry', span: 'span2' },
        { key: 'gstin', label: 'GSTIN', req: true, upper: true, placeholder: '15 characters', pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, patternMsg: 'Enter a valid 15-character GSTIN', hint: 'State & PAN are read from the GSTIN.' },
        { key: 'website', label: 'Website', placeholder: 'optional' },
      ] },
      { title: 'Contact', fields: [
        { key: 'contact', label: 'Contact Person', req: true, placeholder: 'Who takes your orders' },
        { key: 'email', label: 'Email', req: true, type: 'email', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email', hint: 'Purchase orders are emailed here.' },
        { key: 'phone', label: 'Mobile Number', req: true, type: 'tel', prefix: '+91', pattern: /^[6-9]\d{9}$/, patternMsg: 'Enter a valid 10-digit mobile number' },
        { key: 'waSame', type: 'switch', label: 'WhatsApp on same number', desc: 'POs can be shared on WhatsApp.' },
        { key: 'wa', label: 'WhatsApp Number', type: 'tel', prefix: '+91', show: d => !d.waSame, pattern: /^[6-9]\d{9}$/, patternMsg: 'Enter a valid 10-digit mobile number' },
      ] },
      { title: 'Address', fields: [
        { key: 'line1', label: 'Address', req: true, placeholder: 'Building, street, area', span: 'full' },
        { key: 'city', label: 'City', req: true },
        { key: 'state', label: 'State', req: true, type: 'select', options: STATES },
        { key: 'pin', label: 'Pincode', req: true, maxlength: 6, pattern: /^\d{6}$/, patternMsg: 'Pincode must be 6 digits' },
      ] },
      { title: 'Commercial', fields: [
        { key: 'terms', label: 'Payment Terms', req: true, type: 'select', options: ['Advance', 'Net 7', 'Net 15', 'Net 30'] },
        { key: 'lead', label: 'Delivery Lead Time', type: 'number', min: 0, suffix: 'days' },
        { key: 'supplies', label: 'Supplies (categories)', type: 'pills', options: () => [...new Set(rmCategories().map(c => c.parent))], span: 'full' },
        { key: 'active', type: 'switch', label: 'Active', desc: 'Inactive vendors are hidden on new purchase orders.', span: 'full' },
      ] },
    ] },
  });
})();
