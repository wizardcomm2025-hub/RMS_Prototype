// Wize Restaurant RMS — POS: Tax Setting
// Tax groups and their components, applied on POS bills.
(() => {
  const R = window.RMS;
  const { esc, store, chip, status, ava, money, expiry, fmtDate, crud, IC } = R;
  const D = window.RMSData;
  const { STATES, LOC_TYPES, LOC_CHIP, locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories, vehicles, drivers, taxes,
    UOMS, VEH_TYPES } = D;

  // =============== POS: Tax Setting ===============
  const total = r => (r.comps || []).reduce((s, c) => s + Number(c.p || 0), 0);
  function compEditor(d) {
    const rows = d.comps || [];
    return `<span class="field-lbl">Tax components *</span><div class="comp-wrap"><table class="comp-table"><thead><tr><th>Component</th><th style="width:150px">Rate (%)</th><th style="width:44px"></th></tr></thead><tbody>${rows.map((c, i) => `<tr><td><input data-cn="${i}" value="${esc(c.n)}" placeholder="e.g. CGST"></td><td><input type="number" min="0" step="0.01" data-cp="${i}" value="${c.p}" placeholder="0.00"></td><td><button type="button" class="icon-btn del" data-cd="${i}" title="Remove">${IC.del}</button></td></tr>`).join('')}</tbody><tfoot><tr><td style="text-align:right">Total tax</td><td data-ctot>${total(d).toFixed(2)}%</td><td></td></tr></tfoot></table></div><button type="button" class="btn-link" data-cadd>${IC.plus} Add component</button>`;
  }
  crud({
    key: 'tax', group: 'pos', title: 'Tax Setting', entity: 'Tax', db: taxes,
    sub: 'Tax groups applied on POS bills. A group is made of components (e.g. GST 5% = CGST 2.5% + SGST 2.5%).',
    info: 'Tax groups are applied on POS bills. A group is made of components (GST 5% = CGST 2.5% + SGST 2.5%). At least one group must be <b>Active</b>, and it only applies to the order types you tick under <a href="#pos-table-config">Applies to</a>.',
    warn: rows => (rows.some(r => r.active) ? '' : '<b>No tax is active.</b> Bills will be raised without tax. Activate at least one tax group.'),
    name: r => r.name, unique: ['name', 'code'],
    searchText: r => r.name + ' ' + r.code + ' ' + (r.comps || []).map(c => c.n).join(' '),
    columns: [
      { h: 'Tax Group', render: r => `${esc(r.name)} ${r.isDefault ? chip('Default', 'grey') : ''}<span class="rc-code">${esc(r.code)}</span>` },
      { h: 'Components', render: r => `<span class="chips">${(r.comps || []).map(c => chip(`${c.n} ${c.p}%`, 'outline')).join('<span class="muted">+</span>')}</span>` },
      { h: 'Total', cls: 'num', render: r => `<b>${total(r).toFixed(2)}%</b>` },
      { h: 'Calculation', render: r => chip(r.mode === 'INC' ? 'Inclusive' : 'Exclusive', r.mode === 'INC' ? 'purple' : '') },
      { h: 'Applies To', render: r => `<span class="chips">${(r.appliesTo || []).map(a => chip(a, 'grey')).join('')}</span>` },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ mode: 'EXC', comps: [{ n: 'CGST', p: 2.5 }, { n: 'SGST', p: 2.5 }], appliesTo: ['Dine-in', 'Takeaway', 'Delivery'] }),
    beforeSave: d => { d.comps = (d.comps || []).filter(c => c.n); if (d.isDefault) taxes().all().forEach(t => { if (t.id !== d.id) t.isDefault = false; }); },
    form: { size: 'md', addTitle: 'Add Tax Group', saveLabel: 'Save Tax', sections: [
      { fields: [
        { key: 'name', label: 'Tax Group Name', req: true, placeholder: 'e.g. GST 5% (Restaurant)', span: 'span2' },
        { key: 'code', label: 'Short Code', req: true, upper: true, placeholder: 'e.g. GST5', hint: 'Printed on the bill.' },
        { key: 'mode', label: 'Price Calculation', req: true, type: 'select', options: [{ v: 'EXC', l: 'Exclusive — tax added on top of price' }, { v: 'INC', l: 'Inclusive — price already includes tax' }], rerender: true },
        { key: '_comps', type: 'custom', render: d => compEditor(d), bind: (el, d, redraw, refresh) => {
          el.querySelectorAll('[data-cn]').forEach(i => i.addEventListener('input', () => { d.comps[i.dataset.cn].n = i.value; }));
          el.querySelectorAll('[data-cp]').forEach(i => i.addEventListener('input', () => { d.comps[i.dataset.cp].p = Number(i.value || 0); el.querySelector('[data-ctot]').textContent = total(d).toFixed(2) + '%'; refresh(); }));
          el.querySelectorAll('[data-cd]').forEach(b => b.addEventListener('click', () => { d.comps.splice(Number(b.dataset.cd), 1); redraw(); }));
          el.querySelector('[data-cadd]').addEventListener('click', () => { d.comps = (d.comps || []).concat({ n: '', p: 0 }); redraw(); });
        } },
        { key: '_ex', type: 'preview', render: d => { const t = total(d); const base = 200; return `<div class="preview-box">Example on a ₹${base} item: ${d.mode === 'INC' ? `tax ₹${(base - base / (1 + t / 100)).toFixed(2)} is included — guest pays <b>₹${base.toFixed(2)}</b>` : `tax ₹${(base * t / 100).toFixed(2)} is added — guest pays <b>₹${(base * (1 + t / 100)).toFixed(2)}</b>`}</div>`; } },
        { key: 'appliesTo', label: 'Applies to order types', req: true, type: 'pills', options: ['Dine-in', 'Takeaway', 'Delivery', 'Catering'], span: 'full' },
        { key: 'isDefault', type: 'switch', label: 'Default tax for new menu items', span: 'full' },
        { key: 'active', type: 'switch', label: 'Active', span: 'full' },
      ] },
    ], validate: d => { if (!(d.comps || []).filter(c => c.n).length) return { _comps: 'Add at least one component' }; if (total(d) <= 0) return { _comps: 'Total rate must be more than 0%' }; return {}; } },
  });
})();
