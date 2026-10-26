// Wize Restaurant RMS — Category Master
// Inventory groups by type, with a two-level parent/sub hierarchy.
(() => {
  // ---------- markup this module owns ----------
  const VIEW = `
  <div class="page-head">
    <div class="ph-txt">
      <h1>Category Master</h1>
      <p class="page-sub">Group your inventory by type — Raw Material, Semi-Finished and Finished Goods each keep their own category list. A sub-category can only sit under a parent of the same type. Categories are groups only — individual items are created in Inventory › Items.</p>
    </div>
  </div>

  <div class="tabs" id="tabs"></div>

  <div class="info-strip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>A <b>Category</b> is a group, not an item. Each type keeps its own list and a sub-category must sit under a parent of the same type. The items themselves (Onion, Amul Butter 500&nbsp;g) are created in <a href="#rawmaterial">Raw Material</a>, and recipes in <a href="#recipe">Recipe</a> pick a category from here.</span>
  </div>

  <div class="info-strip" id="fgNote" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>Finished Goods categories are for <b>stock &amp; food-cost reporting only</b> and are not shown on the POS. How a finished item appears on the POS menu is controlled by <a href="#menu-section">Menu Section</a>.</span>
  </div>

  <div class="table-card">
    <div class="tbl-tools">
      <div class="toolbar-left">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input type="text" id="searchInput" placeholder="Search category…" />
        </div>
        <select class="filter-sel" id="statusFilter">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="tb-right">
        <button class="btn-ghost icon-only" id="cmRefresh" title="Refresh list"></button>
        <button class="btn-ghost" id="cmExport" title="Download the filtered rows as CSV">Export</button>
        <span class="tb-sep"></span>
        <button class="btn-primary" id="addBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          <span id="addBtnText">Add Category</span>
        </button>
      </div>
    </div>
    <div class="tbl-wrap" id="cmWrap">
      <table class="g-table pin-2 cm-table">
        <thead>
          <tr><th class="pin-l">Actions</th><th class="pin-n">Category Name</th><th>Category Code</th><th>Parent Category</th><th>Status</th></tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
    <div class="tbl-foot"><span class="pg-info" id="pgInfo"></span><span id="cmSize"></span><div class="pagination" id="pagination"></div></div>
  </div>

`;
  const DIALOGS = `
<div class="overlay" id="formModal">
  <div class="modal">
    <div class="modal-head">
      <h2 id="modalTitle">Add Item Category</h2>
      <button data-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <form class="modal-body" id="categoryForm" autocomplete="off">
      <div class="field filled">
        <div class="select" id="typeSelect">
          <div class="select-box" tabindex="0"><span class="val"></span><span class="caret"></span></div>
          <div class="options"></div>
        </div>
        <label>Inventory Type *</label>
      </div>

      <div class="field" id="nameField">
        <input type="text" id="nameInput" placeholder=" " maxlength="60" />
        <label for="nameInput">Category Name *</label>
        <div class="err-msg" id="nameErr"></div>
      </div>

      <div class="field" id="parentField">
        <div class="select" id="parentSelect">
          <div class="select-box" tabindex="0"><span class="val"></span><span class="caret"></span></div>
          <div class="options"></div>
        </div>
        <label>Parent Category</label>
        <div class="hint" id="parentHint">Leave empty to create a main category.</div>
      </div>

      <div class="field" id="codeField">
        <input type="text" id="codeInput" placeholder=" " maxlength="12" style="text-transform:uppercase" />
        <label for="codeInput">Category Code *</label>
        <div class="err-msg" id="codeErr"></div>
        <div class="hint" id="codeHint">Auto-generated from the name. Used on stock and food-cost reports.</div>
      </div>

      <div class="switch-row">
        Active
        <label class="switch"><input type="checkbox" id="activeInput" checked /><span></span></label>
      </div>
    
    </form>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-close>Cancel</button>
        <button type="submit" class="btn-primary" id="submitBtn" form="categoryForm" disabled>Add Category</button>
      </div>
  </div>
</div>

<div class="overlay" id="deleteModal">
  <div class="modal">
    <div class="modal-head">
      <h2>Delete Item Category</h2>
      <button data-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="modal-body">
      <p class="confirm-text" id="deleteText"></p>
    
    </div>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-close>Cancel</button>
        <button type="button" class="btn-danger" id="confirmDelete">Delete</button>
      </div>
  </div>
</div>
`;

  const host = document.createElement('div');
  host.className = 'page view';
  host.id = 'view-category-master';
  host.innerHTML = VIEW;
  document.querySelector('.content').appendChild(host);
  document.body.insertAdjacentHTML('beforeend', DIALOGS);
  const STORAGE_KEY = 'rms_item_categories_v4';
  const TAB_KEY = 'rms_item_categories_tab';
  let pageSize = 10;
  const UI = window.RMSUI;

  // Inventory types — standard RMS naming
  const TYPES = {
    RM: { label: 'Raw Material',      badge: 'b-rm', desc: 'Purchased stock from vendors — ingredients, beverages, packaging.' },
    SF: { label: 'Semi-Finished',     badge: 'b-sf', desc: 'Prepared in the kitchen from raw materials — gravies, doughs, marinades.' },
    FG: { label: 'Finished Goods',    badge: 'b-fg', desc: 'Ready-to-sell dishes & drinks, grouped for stock and food-cost. POS display is set in Menu Section.' },
  };

  // Seed data: [code, name, [[subCode, subName], ...]]
  const SEED = {
    RM: [
      ['DAI', 'Dairy & Eggs', [['MLK', 'Milk & Cream'], ['CHS', 'Cheese & Paneer'], ['BTR', 'Butter & Ghee'], ['YGT', 'Yogurt & Curd'], ['EGG', 'Eggs']]],
      ['MEA', 'Meat & Poultry', [['CHK', 'Chicken'], ['MTN', 'Mutton & Lamb'], ['BEF', 'Beef'], ['PRK', 'Pork']]],
      ['SEA', 'Seafood', [['FWF', 'Freshwater Fish'], ['SWF', 'Saltwater Fish'], ['SHL', 'Shellfish & Prawns']]],
      ['PRD', 'Fresh Produce', [['VEG', 'Vegetables'], ['FRT', 'Fruits'], ['HRB', 'Fresh Herbs & Greens']]],
      ['DRY', 'Dry Goods & Grains', [['RIC', 'Rice'], ['FLR', 'Flour & Atta'], ['PUL', 'Pulses & Lentils'], ['PST', 'Pasta & Noodles'], ['NUT', 'Nuts & Dry Fruits']]],
      ['SPC', 'Spices & Seasonings', [['WSP', 'Whole Spices'], ['GSP', 'Ground Spices'], ['SLT', 'Salt & Sugar']]],
      ['OIL', 'Edible Oils & Fats', []],
      ['CND', 'Sauces & Condiments', [['SCB', 'Bottled Sauces'], ['PKL', 'Pickles & Chutneys'], ['VNG', 'Vinegar']]],
      ['BAK', 'Bakery & Baking Supplies', [['BRD', 'Breads & Buns'], ['BKI', 'Baking Ingredients']]],
      ['FRZ', 'Frozen Foods', []],
      ['BEV', 'Beverage Stock', [['TEA', 'Tea & Coffee'], ['SFT', 'Soft Drinks & Juices'], ['SYR', 'Syrups & Concentrates'], ['WTR', 'Packaged Water']]],
      ['PKG', 'Packaging & Disposables', []],
      ['CLN', 'Cleaning & Housekeeping', []],
    ],
    SF: [
      // Categories only — actual prep items (Makhani Gravy, Pizza Dough, Ginger-Garlic Paste…) belong in the Item master
      ['GRV', 'Gravies & Curry Bases', []],
      ['SAU', 'Sauces, Dips & Dressings', [['CSA', 'Cooking Sauces'], ['DRS', 'Salad Dressings'], ['DIP', 'Dips & Spreads']]],
      ['STK', 'Stocks & Broths', []],
      ['MAR', 'Marinated Proteins', [['MPL', 'Marinated Poultry'], ['MMT', 'Marinated Meat'], ['MSF', 'Marinated Seafood'], ['MVG', 'Marinated Veg & Paneer']]],
      ['DGH', 'Doughs & Batters', []],
      ['PRC', 'Par-cooked Rice & Grains', []],
      ['MEP', 'Mise en Place (Pre-cut Veg)', []],
      ['PST', 'Pastes & Spice Blends', []],
      ['DSB', 'Dessert Bases & Fillings', []],
      ['BVP', 'Beverage Premixes', []],
    ],
    FG: [
      // Grouped by production kitchen for stock & food-cost reports; POS grouping lives in Menu Section
      ['IND', 'Indian Kitchen', [['IVG', 'Indian Veg'], ['INV', 'Indian Non-Veg']]],
      ['TDR', 'Tandoor', [['TVG', 'Tandoor Veg'], ['TNV', 'Tandoor Non-Veg'], ['TBR', 'Tandoori Breads']]],
      ['CHN', 'Chinese & Asian Kitchen', [['CVG', 'Chinese Veg'], ['CNV', 'Chinese Non-Veg']]],
      ['CON', 'Continental Kitchen', [['PZP', 'Pizza & Pasta'], ['BSW', 'Burgers & Sandwiches']]],
      ['BKC', 'Bakery & Confectionery', []],
      ['DES', 'Desserts & Ice Creams', []],
      ['BEV', 'Prepared Beverages', [['HBV', 'Hot Beverages'], ['CBV', 'Shakes & Mocktails']]],
      ['RSL', 'Resale Goods (Bought-out)', []],
    ],
  };

  // ---------- Storage ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function buildSeed() {
    const out = [];
    Object.entries(SEED).forEach(([type, list]) => {
      list.forEach(([code, name, subs]) => {
        const id = uid();
        out.push({ id, type, name, code: `${type}-${code}`, parentId: '', active: true, createdAt: Date.now() });
        subs.forEach(([sc, sn]) => out.push({ id: uid(), type, name: sn, code: `${type}-${code}-${sc}`, parentId: id, active: true, createdAt: Date.now() }));
      });
    });
    return out;
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    const seeded = buildSeed();
    save(seeded);
    return seeded;
  }
  function save(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { toast('Could not save to local storage', true); }
  }

  let categories = load();
  let activeType = 'RM';
  try { const t = localStorage.getItem(TAB_KEY); if (TYPES[t]) activeType = t; } catch (e) { /* ignore */ }
  let currentPage = 1;
  let editingId = null;
  let deletingId = null;
  let codeTouched = false;

  // ---------- Elements ----------
  const $ = id => document.getElementById(id);
  const tableBody = $('tableBody'), pagination = $('pagination'), pgInfo = $('pgInfo');
  const searchInput = $('searchInput'), statusFilter = $('statusFilter');
  const formModal = $('formModal'), deleteModal = $('deleteModal');
  const nameInput = $('nameInput'), codeInput = $('codeInput'), activeInput = $('activeInput'), submitBtn = $('submitBtn');

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const byId = id => categories.find(c => c.id === id);
  const childrenOf = id => categories.filter(c => c.parentId === id);
  const byName = (a, b) => a.name.localeCompare(b.name);

  // ---------- Tabs ----------
  function renderTabs() {
    $('tabs').innerHTML = Object.entries(TYPES).map(([k, t]) => {
      const n = categories.filter(c => c.type === k).length;
      return `<button class="tab ${k === activeType ? 'active' : ''}" data-type="${k}">
        <span class="badge ${t.badge}">${k}</span>
        <span><span class="t-title">${t.label} <span class="count">${n}</span></span>
        <span class="t-desc">${t.desc}</span></span>
      </button>`;
    }).join('');
    $('addBtnText').textContent = `Add ${TYPES[activeType].label} Category`;
    $('fgNote').style.display = activeType === 'FG' ? '' : 'none';
  }
  $('tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    activeType = b.dataset.type;
    try { localStorage.setItem(TAB_KEY, activeType); } catch (e) { /* ignore */ }
    currentPage = 1;
    searchInput.value = '';
    render();
  });

  // ---------- Table (parents followed by their sub-categories) ----------
  function rowsForView() {
    const q = searchInput.value.trim().toLowerCase();
    const st = statusFilter.value;
    const pass = c =>
      (st === 'all' || (st === 'active') === c.active) &&
      (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    const inType = categories.filter(c => c.type === activeType);
    const mains = inType.filter(c => !c.parentId || !byId(c.parentId)).sort(byName);
    const rows = [];
    mains.forEach(m => {
      const kids = inType.filter(c => c.parentId === m.id).sort(byName);
      const kidHits = kids.filter(pass);
      if (pass(m) || kidHits.length) {
        rows.push({ c: m, sub: false, kids: kids.length });
        (q || st !== 'all' ? kidHits : kids).forEach(k => rows.push({ c: k, sub: true }));
      }
    });
    return rows;
  }

  function render() {
    renderTabs();
    const list = rowsForView();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (currentPage > pages) currentPage = pages;
    const start = (currentPage - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);

    tableBody.innerHTML = rows.length ? rows.map(({ c, sub, kids }) => {
      const parent = sub ? byId(c.parentId) : null;
      return `<tr>
        <td class="pin-l"><span class="actions">
          <button class="icon-btn" data-edit="${c.id}" title="Edit" aria-label="Edit ${esc(c.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn del" data-delete="${c.id}" title="Delete" aria-label="Delete ${esc(c.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
        </span></td>
        <td class="pin-n ${sub ? 'sub-cell' : 'strong'}">${esc(c.name)}${!sub && kids ? `<span class="kids">${kids} sub</span>` : ''}</td>
        <td><span class="code">${esc(c.code)}</span></td>
        <td>${parent ? esc(parent.name) : '<span class="muted">—</span>'}</td>
        <td><span class="status ${c.active ? '' : 'off'}">${c.active ? 'Active' : 'Inactive'}</span></td>
      </tr>`;
    }).join('') : `<tr><td colspan="5" class="empty">${searchInput.value.trim() || statusFilter.value !== 'all' ? 'No categories match your filters.' : `No ${TYPES[activeType].label} categories yet.`}</td></tr>`;

    UI.pager(pagination, pgInfo, list.length, currentPage, p => { currentPage = p; render(); }, pageSize);
    UI.bindPin($('cmWrap'));
  }

  searchInput.addEventListener('input', () => { currentPage = 1; render(); });
  statusFilter.addEventListener('change', () => { currentPage = 1; render(); });
  UI.mountSize('cmSize', pageSize, n => { pageSize = n; currentPage = 1; render(); });
  $('cmRefresh').innerHTML = UI.ICREFRESH;
  $('cmRefresh').addEventListener('click', () => { render(); toast('Category Master refreshed'); });
  $('cmExport').insertAdjacentHTML('afterbegin', UI.ICDOWN);
  $('cmExport').addEventListener('click', () => {
    const n = UI.csv('category-master',
      ['Category Name', 'Category Code', 'Parent Category', 'Inventory Type', 'Status'],
      rowsForView().map(({ c, sub }) => [c.name, c.code, sub ? (byId(c.parentId) || {}).name : '', TYPES[c.type].label, c.active ? 'Active' : 'Inactive']));
    toast(n < 0 ? 'Export not available here' : `Exported ${n} rows`, n < 0);
  });

  tableBody.addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) openForm(edit.dataset.edit);
    if (del) openDelete(del.dataset.delete);
  });

  // ---------- Custom select ----------
  function makeSelect(root, { onChange } = {}) {
    const box = root.querySelector('.select-box');
    const valEl = root.querySelector('.val');
    const optsEl = root.querySelector('.options');
    const field = root.closest('.field');
    let options = [], value = '';

    function draw() {
      const opt = value === '' ? null : options.find(o => o.value === value);
      valEl.textContent = opt ? opt.label : '';
      valEl.classList.toggle('placeholder', !opt);
      field.classList.toggle('filled', !!opt || root.classList.contains('open'));
      optsEl.innerHTML = options.map(o =>
        `<div class="option ${o.value === value ? 'selected' : ''} ${o.value === '' ? 'none' : ''}" data-v="${esc(o.value)}">${esc(o.label)}</div>`).join('');
    }
    function toggle(force) {
      const open = force ?? !root.classList.contains('open');
      document.querySelectorAll('.select.open').forEach(s => s !== root && s.classList.remove('open'));
      root.classList.toggle('open', open);
      draw();
    }
    box.addEventListener('click', () => toggle());
    box.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'Escape') toggle(false);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = options.findIndex(o => o.value === value);
        const n = Math.min(options.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
        if (options[n]) api.set(options[n].value, true);
      }
    });
    optsEl.addEventListener('click', e => {
      const o = e.target.closest('.option');
      if (!o) return;
      api.set(o.dataset.v, true);
      toggle(false);
    });
    const api = {
      setOptions(list) { options = list; draw(); },
      set(v, fire) { value = v; draw(); if (fire && onChange) onChange(v); },
      get: () => value,
      close: () => toggle(false),
      disable(d) { root.classList.toggle('disabled', d); },
    };
    return api;
  }
  document.addEventListener('click', e => {
    if (e.target.closest('.select')) return;
    document.querySelectorAll('.select.open').forEach(s => {
      s.classList.remove('open');
      if (s.querySelector('.val.placeholder')) s.closest('.field').classList.remove('filled');
    });
  });

  const typeSelect = makeSelect($('typeSelect'), { onChange: () => { fillParentOptions(); parentSelect.set(''); autoCode(); validate(); } });
  typeSelect.setOptions(Object.entries(TYPES).map(([k, t]) => ({ value: k, label: t.label })));
  const parentSelect = makeSelect($('parentSelect'), { onChange: () => { autoCode(); validate(); } });

  // Two-level hierarchy: parent must be a main category of the same type
  function fillParentOptions() {
    const type = typeSelect.get();
    const opts = categories
      .filter(c => c.type === type && !c.parentId && c.id !== editingId)
      .sort(byName)
      .map(c => ({ value: c.id, label: c.name }));
    parentSelect.setOptions([{ value: '', label: 'None (main category)' }, ...opts]);
    const hasKids = editingId && childrenOf(editingId).length;
    parentSelect.disable(!!hasKids);
    $('parentHint').textContent = hasKids
      ? 'This category has sub-categories, so it must stay a main category.'
      : `Only ${TYPES[type].label} main categories are listed. Leave empty to create a main category.`;
  }

  // ---------- Code generation ----------
  function abbrev(name) {
    const words = name.toUpperCase().replace(/&/g, ' ').replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(w => w && !['AND', 'OF', 'THE'].includes(w));
    if (!words.length) return '';
    if (words.length === 1) return words[0].slice(0, 3);
    return words.slice(0, 3).map(w => w[0]).join('').padEnd(3, words[0][1] || 'X');
  }
  function autoCode() {
    if (codeTouched) return;
    const ab = abbrev(nameInput.value.trim());
    if (!ab) { codeInput.value = ''; return; }
    const parent = byId(parentSelect.get());
    const base = parent ? `${parent.code}-${ab}` : `${typeSelect.get()}-${ab}`;
    let code = base, n = 2;
    while (categories.some(c => c.id !== editingId && c.code === code)) code = base + n++;
    codeInput.value = code;
  }

  // ---------- Validation ----------
  function setErr(field, errEl, msg) {
    $(errEl).textContent = msg;
    $(field).classList.toggle('error', !!msg);
  }
  function validate() {
    const name = nameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    const type = typeSelect.get();
    const parentId = parentSelect.get();
    let nameMsg = '', codeMsg = '';
    if (name && categories.some(c => c.id !== editingId && c.type === type && (c.parentId || '') === parentId && c.name.toLowerCase() === name.toLowerCase())) {
      nameMsg = `"${name}" already exists at this level in ${TYPES[type].label}.`;
    }
    if (code && !/^[A-Z0-9-]+$/.test(code)) codeMsg = 'Use letters, numbers and hyphens only.';
    else if (code && categories.some(c => c.id !== editingId && c.code === code)) codeMsg = 'This code is already in use.';
    setErr('nameField', 'nameErr', nameMsg);
    setErr('codeField', 'codeErr', codeMsg);
    $('codeHint').style.display = codeMsg ? 'none' : '';
    submitBtn.disabled = !name || !code || !type || !!nameMsg || !!codeMsg;
    return !submitBtn.disabled;
  }
  nameInput.addEventListener('input', () => { autoCode(); validate(); });
  codeInput.addEventListener('input', () => { codeTouched = codeInput.value.trim() !== ''; validate(); });

  // ---------- Form ----------
  function openForm(id = null) {
    editingId = id;
    const c = id ? byId(id) : null;
    codeTouched = !!c;
    const type = c ? c.type : activeType;
    $('modalTitle').textContent = `${c ? 'Edit' : 'Add'} ${TYPES[type].label} Category`;
    submitBtn.textContent = c ? 'Update Category' : 'Add Category';
    typeSelect.set(type);
    typeSelect.disable(!!(c && childrenOf(c.id).length));
    fillParentOptions();
    parentSelect.set(c && byId(c.parentId) ? c.parentId : '');
    nameInput.value = c ? c.name : '';
    codeInput.value = c ? c.code : '';
    activeInput.checked = c ? c.active : true;
    validate();
    setErr('nameField', 'nameErr', $('nameErr').textContent);
    formModal.classList.add('show');
    setTimeout(() => nameInput.focus(), 50);
  }

  $('categoryForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      type: typeSelect.get(),
      name: nameInput.value.trim(),
      code: codeInput.value.trim().toUpperCase(),
      parentId: parentSelect.get(),
      active: activeInput.checked,
    };
    if (editingId) {
      const c = byId(editingId);
      Object.assign(c, data, { updatedAt: Date.now() });
      // deactivating a main category deactivates its sub-categories
      if (!data.active) childrenOf(c.id).forEach(k => { k.active = false; });
      toast(`"${data.name}" updated successfully`);
    } else {
      categories.push({ id: uid(), ...data, createdAt: Date.now() });
      toast(`"${data.name}" added to ${TYPES[data.type].label}`);
    }
    save(categories);
    // show the tab the record belongs to
    if (data.type !== activeType) {
      activeType = data.type;
      try { localStorage.setItem(TAB_KEY, activeType); } catch (e) { /* ignore */ }
    }
    searchInput.value = '';
    closeModals();
    const idx = rowsForView().findIndex(r => r.c.code === data.code);
    if (idx >= 0) currentPage = Math.floor(idx / pageSize) + 1;
    render();
  });

  // ---------- Delete ----------
  function openDelete(id) {
    const c = byId(id);
    if (!c) return;
    const kids = childrenOf(id);
    deletingId = kids.length ? null : id;
    $('confirmDelete').style.display = kids.length ? 'none' : '';
    $('deleteText').innerHTML = kids.length
      ? `<b>${esc(c.name)}</b> cannot be deleted because it has ${kids.length} sub-categor${kids.length > 1 ? 'ies' : 'y'}:<span class="warn">${kids.map(k => esc(k.name)).join(', ')}</span><span class="warn" style="color:#6b7280">Delete or move the sub-categories first, or mark this category Inactive.</span>`
      : `Are you sure you want to delete <b>${esc(c.name)}</b> (<span class="code">${esc(c.code)}</span>) from ${TYPES[c.type].label}? This action cannot be undone.`;
    deleteModal.classList.add('show');
  }
  $('confirmDelete').addEventListener('click', () => {
    const c = byId(deletingId);
    if (!c) return closeModals();
    categories = categories.filter(x => x.id !== deletingId);
    save(categories);
    toast(`"${c.name}" deleted`, true);
    closeModals();
    render();
  });

  // ---------- Modal helpers ----------
  function closeModals() {
    formModal.classList.remove('show');
    deleteModal.classList.remove('show');
    typeSelect.close(); parentSelect.close();
    editingId = deletingId = null;
  }
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModals));
  [formModal, deleteModal].forEach(m => m.addEventListener('mousedown', e => { if (e.target === m) closeModals(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.querySelector('.select.open')) closeModals(); });

  $('addBtn').addEventListener('click', () => openForm());
  $('collapseBtn').addEventListener('click', () => $('sidebar').classList.toggle('collapsed'));

  // Mobile sidebar toggle
  const mobBtn = document.getElementById('mobMenuBtn');
  const backdrop = document.getElementById('sidebarBackdrop');
  function openMobSidebar() {
    document.getElementById('sidebar').classList.add('mob-open');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeMobSidebar() {
    document.getElementById('sidebar').classList.remove('mob-open');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }
  if (mobBtn) mobBtn.addEventListener('click', openMobSidebar);
  if (backdrop) backdrop.addEventListener('click', closeMobSidebar);
  // Close sidebar on nav item click (mobile)
  document.querySelector('.nav').addEventListener('click', () => {
    if (window.innerWidth <= 900) closeMobSidebar();
  });

  // ---------- Toast ----------
  function toast(msg, isError = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (isError ? ' error' : '');
    t.textContent = msg;
    $('toastWrap').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) { categories = load(); render(); } });
  window.rmsToast = toast;

  render();
})();
