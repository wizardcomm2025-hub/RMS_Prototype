// Wize Restaurant RMS — Inventory masters
// Brand, Sub-Brand and Raw Material.
(() => {
  const R = window.RMS;
  const { esc, store, chip, status, ava, money, expiry, fmtDate, crud, IC } = R;
  const D = window.RMSData;
  const { STATES, LOC_TYPES, LOC_CHIP, locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories, vehicles, drivers, taxes,
    UOMS, VEH_TYPES } = D;

  // =============== INVENTORY: Brand, Sub-Brand, Raw Material ===============
  crud({
    key: 'brand', group: 'inventory', title: 'Brand', entity: 'Brand', db: brands,
    sub: 'Manufacturer brands of the items you buy (e.g. Amul, Fortune). Optional on Raw Material.',
    info: 'Brands are the manufacturer names on what you buy (e.g. Amul, Fortune). They are optional: a <a href="#rawmaterial">Raw Material</a> can be mapped to a brand and a <a href="#subbrand">Sub-Brand</a> to compare purchase rates.',
    name: r => r.name, unique: ['name'],
    columns: [
      { h: 'Brand', render: r => `<span class="who">${ava(r.name, 30)}<span>${esc(r.name)}</span></span>` },
      { h: 'Sub-Brands', render: r => { const s = subBrands().all().filter(x => x.brand === r.name); return s.length ? `<span class="chips">${s.slice(0, 3).map(x => chip(x.name, 'grey')).join('')}${s.length > 3 ? `<span class="muted">+${s.length - 3}</span>` : ''}</span>` : '<span class="muted">—</span>'; } },
      { h: 'Items', cls: 'num', render: r => { const n = rawMaterials().all().filter(x => x.brand === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
    ],
    toggle: { field: 'active' },
    deleteBlock: r => { const s = subBrands().all().filter(x => x.brand === r.name).length; const n = rawMaterials().all().filter(x => x.brand === r.name).length; return s || n ? `“${esc(r.name)}” is used by <b>${s} sub-brand(s)</b> and <b>${n} item(s)</b>. Mark it Inactive instead.` : ''; },
    form: { saveLabel: 'Save Brand', sections: [{ cols: 1, fields: [
      { key: 'name', label: 'Brand Name', req: true, placeholder: 'e.g. Amul', hint: 'Duplicate names are blocked automatically.' },
      { key: 'active', type: 'switch', label: 'Active' },
    ] }] },
  });

  crud({
    key: 'subbrand', group: 'inventory', title: 'Sub-Brand', entity: 'Sub-Brand', db: subBrands,
    sub: 'Product lines under a brand (e.g. Thums Up under Coca-Cola).',
    info: 'A Sub-Brand is a product line inside a <a href="#brand">Brand</a> (e.g. Thums Up under Coca-Cola). Create the brand first — sub-brands then become selectable on <a href="#rawmaterial">Raw Material</a>.',
    name: r => r.name, unique: ['name'],
    searchText: r => r.name + ' ' + r.brand,
    filters: [{ key: 'brand', label: 'All Brands', options: () => brands().all().map(b => b.name), match: (r, v) => r.brand === v }],
    sort: (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
    columns: [
      { h: 'Sub-Brand', render: r => esc(r.name) },
      { h: 'Brand', render: r => `<span class="who">${ava(r.brand, 26)}<span style="font-weight:500">${esc(r.brand)}</span></span>` },
      { h: 'Items', cls: 'num', render: r => { const n = rawMaterials().all().filter(x => x.sub === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
    ],
    toggle: { field: 'active' },
    form: { saveLabel: 'Save Sub-Brand', sections: [{ cols: 1, fields: [
      { key: 'brand', label: 'Brand', req: true, type: 'select', options: () => brands().all().filter(b => b.active).map(b => b.name), hint: 'Pick the parent brand first.' },
      { key: 'name', label: 'Sub-Brand Name', req: true, placeholder: 'e.g. Thums Up' },
      { key: 'active', type: 'switch', label: 'Active' },
    ] }] },
  });

  const STORAGE = { Dry: '', Chilled: 'teal', Frozen: 'purple' };
  crud({
    key: 'rawmaterial', group: 'inventory', title: 'Raw Material', entity: 'Raw Material', db: rawMaterials,
    sub: 'Everything you buy from vendors. Units, reorder level and preferred vendor drive purchase and stock alerts.',
    info: 'A <b>Raw Material</b> is a single purchasable item (e.g. Onion, Amul Butter 500 g). Its <a href="#category-master">Category</a> is only the group it belongs to — don’t create items as categories. Map a <a href="#vendor">Vendor</a> and a reorder level so stock alerts and purchase orders work.',
    name: r => r.name, unique: ['name', 'sku'], export: true,
    searchText: r => [r.name, r.sku, r.cat, r.brand, r.vendor].join(' '), searchPh: 'Search by name, SKU, category or vendor...',
    stats: rows => [
      { label: 'Items', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Below reorder level', value: rows.filter(r => r.stock < r.reorder).length, sub: 'raise a purchase order', cls: 'bad', filter: 'low' },
      { label: 'No vendor mapped', value: rows.filter(r => !r.vendor).length, sub: 'cannot auto-order', cls: 'warn', filter: 'novendor' },
      { label: 'Stock value', value: money(rows.reduce((s, r) => s + (r.stock / (r.su === r.pu ? 1 : 1)) * r.price, 0)), sub: 'at last purchase price' },
    ],
    statFilter: (r, f) => (f === 'low' ? r.stock < r.reorder : !r.vendor),
    seg: { options: Object.keys(STORAGE).map(s => ({ v: s, l: s })), match: (r, v) => r.storage === v },
    filters: [{ key: 'cat', label: 'All Categories', options: () => [...new Set(rawMaterials().all().map(r => r.parent))].sort(), match: (r, v) => r.parent === v }],
    columns: [
      { h: 'Item', render: r => `${esc(r.name)}<span class="rc-code">${esc(r.sku)}</span>` },
      { h: 'Category', render: r => `<span style="font-weight:500">${esc(r.cat)}</span>${r.parent !== r.cat ? `<span class="sub-line">${esc(r.parent)}</span>` : ''}` },
      { h: 'Units', render: r => `<span style="font-weight:500;white-space:nowrap">${esc(r.pu)}${r.pu !== r.su ? ` → ${esc(r.su)}` : ''}</span><span class="sub-line">1 ${esc(r.pu)} = ${r.conv} ${esc(r.su)}</span>` },
      { h: 'In Stock', cls: 'num', render: r => `<span style="${r.stock < r.reorder ? 'color:#b91c1c;font-weight:700' : ''}">${r.stock} ${esc(r.pu)}</span><span class="sub-line">reorder at ${r.reorder}</span>` },
      { h: 'Preferred Vendor', render: r => (r.vendor ? `<span style="font-weight:500">${esc(r.vendor)}</span><span class="sub-line">${money(r.price)} / ${esc(r.pu)}</span>` : chip('Not mapped', 'semi')) },
      { h: 'Storage', render: r => chip(r.storage, STORAGE[r.storage]) },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ pu: 'Kg', su: 'g', conv: 1000, storage: 'Dry', yieldP: 100, gst: 5, stock: 0, usedBy: locations().all().filter(l => l.pos || l.type === 'CK').map(l => l.name) }),
    beforeSave: d => { const c = rmCategories().find(x => x.v === d.cat); d.parent = c ? c.parent : d.cat; },
    form: {
      size: 'full', addTitle: 'Add New Raw Material', sub: 'One item you buy from a vendor. Cost & stock are tracked automatically.', saveLabel: 'Save Raw Material', updateLabel: 'Update Raw Material',
      summary: d => {
        const low = d.stock != null && d.reorder && d.stock < d.reorder;
        return `<div class="sum-head"><h3>Item preview</h3><span>updates as you type</span></div>
        <div class="kpis"><div class="kpi"><span>Last price</span><b>${d.price ? money(d.price) : '—'}</b></div><div class="kpi"><span>Per ${esc(d.su || 'unit')}</span><b>${d.price && d.conv ? money(d.price / d.conv) : '—'}</b></div><div class="kpi"><span>Reorder at</span><b>${d.reorder || '—'} ${esc(d.pu || '')}</b></div><div class="kpi ${low ? 'neg' : ''}"><span>In stock</span><b>${d.stock || 0} ${esc(d.pu || '')}</b></div></div>
        <div class="sum-group">Conversion</div><div class="preview-box">${d.pu && d.su && d.conv ? `1 <b>${esc(d.pu)}</b> = <b>${d.conv}</b> ${esc(d.su)}` : 'Set purchase & stock units'}</div>
        <div class="sum-group">Purchase cost history</div><p class="sum-note">${d.id ? 'Last 3 purchases: ₹' + (d.price || 0) + ', ₹' + Math.round((d.price || 0) * 0.97) + ', ₹' + Math.round((d.price || 0) * 0.95) + ' — price trend ▲ 5%' : 'Starts after the first Goods Receive for this item.'}</p>`;
      },
      sections: [
        { title: 'Name & identification', desc: 'How staff find this item in purchase, stock and recipes.', fields: [
          { key: 'name', label: 'Item Name', req: true, placeholder: 'e.g. Amul Butter 500 g', span: 'span2', hint: 'Include pack size if you buy a specific pack.' },
          { key: 'sku', label: 'SKU / Item Code', req: true, upper: true, placeholder: 'e.g. RM-BTR-001', hint: 'Must be unique.' },
          { key: 'barcode', label: 'Barcode (EAN)', placeholder: 'Scan or type (optional)' },
        ] },
        { title: 'Classification', desc: 'Groups the item for stock and food-cost reports (from Category Master).', fields: [
          { key: 'cat', label: 'Category', req: true, type: 'select', options: () => rmCategories(), placeholder: 'Select category' },
          { key: 'brand', label: 'Brand', type: 'select', options: () => brands().all().filter(b => b.active).map(b => b.name), placeholder: 'No brand / loose', rerender: true, onChange: d => { d.sub = ''; } },
          { key: 'sub', label: 'Sub-Brand', type: 'select', options: d => subBrands().all().filter(s => s.brand === d.brand).map(s => s.name), disabled: d => !d.brand, placeholder: 'Select brand first' },
          { key: 'storage', label: 'Storage Type', req: true, type: 'select', options: ['Dry', 'Chilled', 'Frozen'], hint: 'Used for store layout & temperature checklists.' },
        ] },
        { title: 'Units & conversion', desc: 'You buy in one unit and use it in recipes in another.', fields: [
          { key: 'pu', label: 'Purchase Unit', req: true, type: 'select', options: UOMS, rerender: true },
          { key: 'su', label: 'Stock / Recipe Unit', req: true, type: 'select', options: UOMS, rerender: true },
          { key: 'conv', label: 'Conversion', req: true, type: 'number', min: 0.0001, suffix: d => d.su || '', hint: d => `How many ${esc(d.su || 'stock units')} in 1 ${esc(d.pu || 'purchase unit')}.` },
          { key: '_c', type: 'preview', render: d => `<div class="preview-box">${d.pu && d.su && d.conv ? `1 <b>${esc(d.pu)}</b> = <b>${d.conv}</b> ${esc(d.su)} — e.g. a recipe using 250 ${esc(d.su)} consumes ${(250 / d.conv).toFixed(3)} ${esc(d.pu)}` : 'Fill both units and conversion to see the preview.'}</div>` },
        ] },
        { title: 'Stock control', desc: 'Drives low-stock alerts on the Dashboard and suggested purchase quantity.', fields: [
          { key: 'reorder', label: 'Reorder Level', type: 'number', min: 0, suffix: d => d.pu || '', hint: 'Alert when stock falls below this.' },
          { key: 'moq', label: 'Min. Order Qty', type: 'number', min: 0, suffix: d => d.pu || '' },
          { key: 'shelf', label: 'Shelf Life', type: 'number', min: 0, suffix: 'days', hint: '0 = non-perishable' },
          { key: 'yieldP', label: 'Usable Yield', type: 'number', min: 1, max: 100, suffix: '%', hint: 'After cleaning / trimming. 100% = no loss.' },
        ] },
        { title: 'Vendor & cost', desc: 'Preferred vendor is pre-filled on purchase orders. Add more vendors later from the Vendor page.', fields: [
          { key: 'vendor', label: 'Preferred Vendor', type: 'select', options: () => vendors().all().filter(v => v.active).map(v => v.name), placeholder: 'Select vendor' },
          { key: 'price', label: 'Last Purchase Price', type: 'number', min: 0, prefix: '₹', suffix: d => '/ ' + (d.pu || 'unit') },
          { key: 'gst', label: 'GST Rate', type: 'select', options: ['0', '5', '12', '18', '28'].map(v => ({ v, l: v + '%' })) },
        ] },
        { title: 'Availability', desc: 'Locations that can stock and use this item.', cols: 1, fields: [
          { key: 'usedBy', label: 'Used by locations', req: true, type: 'pills', options: () => locations().all().filter(l => l.active).map(l => l.name) },
          { key: 'desc', label: 'Notes', type: 'textarea', placeholder: 'Quality specs, preferred pack, handling notes (optional)' },
          { key: 'active', type: 'switch', label: 'Active', desc: 'Inactive items cannot be ordered or used in new recipes.' },
        ] },
      ],
    },
  });
})();
