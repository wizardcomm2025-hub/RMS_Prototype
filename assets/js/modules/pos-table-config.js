// Wize Restaurant RMS — POS Table Config
// Tables and the other order channels cashiers pick from.
(() => {
  // ---------- markup this module owns ----------
  const VIEW = `
  <div class="page-head">
    <div class="ph-txt">
      <h1>POS Table Config</h1>
      <p class="page-sub">Tables and other order channels cashiers pick from when they start an order.</p>
    </div>
  </div>
  <div class="info-strip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>These are the <b>tables</b> and <b>order channels</b> (Takeaway, Home Delivery, Swiggy / Zomato) a cashier chooses from on the POS. They belong to a POS <a href="#location">Location</a>, and the <a href="#tax">Tax</a> group that applies depends on the channel type. Seats and Area apply to seated tables only; anything switched off here disappears from the POS.</span>
  </div>
  <div class="pt-stats" id="ptStats"></div>
  <div class="table-card">
    <div class="tbl-tools">
      <div class="toolbar-left">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input type="text" id="ptSearch" placeholder="Search table or channel…" />
        </div>
        <div class="seg" id="ptTabs"></div>
        <select class="filter-sel" id="ptAreaFilter" title="Filter tables by area"></select>
      </div>
      <div class="tb-right">
        <button class="btn-ghost icon-only" id="ptRefresh" title="Refresh list"></button>
        <button class="btn-ghost" id="ptExport" title="Download the filtered rows as CSV">Export</button>
        <span class="tb-sep"></span>
        <button class="btn-primary" id="ptAddBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Table / Channel
        </button>
      </div>
    </div>
    <div class="tbl-wrap" id="ptWrap">
      <table class="g-table pin-2 pt-table">
        <thead><tr>
          <th class="pin-l">Actions</th>
          <th class="pin-n">Table / Channel Name</th><th>Channel Type</th><th>Area / Section</th><th class="num">Seats</th>
          <th class="c-center">Active on POS</th><th class="c-center">Show Online</th>
        </tr></thead>
        <tbody id="ptBody"></tbody>
      </table>
    </div>
    <div class="tbl-foot"><span class="pg-info" id="ptInfo"></span><span id="ptSize"></span><div class="pagination" id="ptPagination"></div></div>
  </div>

`;
  const DIALOGS = `
<div class="overlay" id="ptModal">
  <div class="modal">
    <div class="modal-head">
      <h2 id="ptTitle">Add Table / Channel</h2>
      <button data-pt-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <form class="modal-body" id="ptForm" autocomplete="off">
      <div class="pt-grid">
        <div class="field fixed span2">
          <select id="ptType"></select>
          <label for="ptType">Channel Type *</label>
          <div class="fhint" id="ptTypeHint"></div>
        </div>

        <div class="span2 seated-only" id="ptBulkRow">
          <label class="check"><input type="checkbox" id="ptBulk" /> Add several tables at once (e.g. T1 to T10)</label>
        </div>

        <div class="field fixed single-only" id="ptNameField">
          <input type="text" id="ptName" placeholder="e.g. T1" maxlength="30" />
          <label for="ptName" id="ptNameLbl">Table Name / No. *</label>
          <div class="err-msg" id="ptNameErr"></div>
          <div class="fhint">Shown on the POS table screen and KOT.</div>
        </div>

        <div class="span2 bulk-only">
          <div class="pt-bulk-grid">
            <div class="field fixed">
              <input type="text" id="ptPrefix" placeholder="e.g. T" maxlength="10" />
              <label for="ptPrefix">Name Prefix</label>
              <div class="fhint">Letters before the number.</div>
            </div>
            <div class="field fixed">
              <input type="number" id="ptFrom" min="0" step="1" placeholder="1" />
              <label for="ptFrom">From No. *</label>
            </div>
            <div class="field fixed">
              <input type="number" id="ptTo" min="0" step="1" placeholder="10" />
              <label for="ptTo">To No. *</label>
            </div>
          </div>
          <div class="pt-preview" id="ptBulkPreview"></div>
        </div>

        <div class="field fixed seated-only">
          <input type="number" id="ptSeats" min="1" max="100" step="1" placeholder="e.g. 4" />
          <label for="ptSeats" id="ptSeatsLbl">Seats *</label>
          <div class="fhint">Number of guests the table can seat.</div>
        </div>
        <div class="field fixed seated-only">
          <input type="text" id="ptAreaInput" list="ptAreaList" placeholder="e.g. Ground Floor" maxlength="30" />
          <label for="ptAreaInput">Area / Section</label>
          <datalist id="ptAreaList"></datalist>
          <div class="fhint">Optional. Groups tables on the POS floor view.</div>
        </div>

        <div class="field fixed span2">
          <textarea id="ptDesc" placeholder="e.g. Window side, near the stage" maxlength="120"></textarea>
          <label for="ptDesc">Description</label>
          <div class="fhint">Optional note for staff.</div>
        </div>
      </div>

      <div class="pt-switches">
        <div class="switch-row2">
          <div><b>Active on POS</b><small>Inactive tables / channels are hidden from the POS.</small></div>
          <label class="switch"><input type="checkbox" id="ptActive" checked /><span></span></label>
        </div>
        <div class="switch-row2">
          <div><b>Show Online</b><small id="ptOnlineHint"></small></div>
          <label class="switch"><input type="checkbox" id="ptOnline" checked /><span></span></label>
        </div>
      </div>
    
    </form>
    <div class="modal-foot">
        <span class="pt-need" id="ptNeed"></span>
        <button type="button" class="btn-outline" data-pt-close>Cancel</button>
        <button type="submit" class="btn-primary" id="ptSubmit" form="ptForm" disabled>Save</button>
      </div>
  </div>
</div>

<div class="overlay" id="ptDeleteModal">
  <div class="modal">
    <div class="modal-head">
      <h2>Delete Table / Channel</h2>
      <button data-pt-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="modal-body">
      <p class="confirm-text" id="ptDeleteText"></p>
    
    </div>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-pt-close>Cancel</button>
        <button type="button" class="btn-danger" id="ptConfirmDelete">Delete</button>
      </div>
  </div>
</div>
`;

  const host = document.createElement('div');
  host.className = 'page view';
  host.id = 'view-pos-table-config';
  host.innerHTML = VIEW;
  document.querySelector('.content').appendChild(host);
  document.body.insertAdjacentHTML('beforeend', DIALOGS);
  const STORAGE_KEY = 'rms_pos_tables_v1';
  let pageSize = 10;
  const UI = window.RMSUI;
  // Seated types need seats + area; the others are order channels without tables
  const TYPES = [
    { id: 'dinein', label: 'Dine-In Table', seated: true, chip: '', ph: 'e.g. T1', hint: 'A table in the dining area where guests sit and order.' },
    { id: 'bar', label: 'Bar Seating', seated: true, chip: 'semi', ph: 'e.g. B1', hint: 'Bar counter or high-top seating.' },
    { id: 'private', label: 'Private Room / Cabin', seated: true, chip: 'purple', ph: 'e.g. PD1', hint: 'A private dining room or cabin booked as one unit.' },
    { id: 'takeaway', label: 'Takeaway', seated: false, chip: 'grey', ph: 'e.g. Takeaway Counter', hint: 'Counter orders packed to go. No seats needed.' },
    { id: 'delivery', label: 'Home Delivery', seated: false, chip: 'grey', ph: 'e.g. Home Delivery', hint: 'Orders delivered by your own staff. No seats needed.' },
    { id: 'aggregator', label: 'Online Aggregator', seated: false, chip: 'finished', ph: 'e.g. Swiggy', hint: 'Orders coming in from apps like Swiggy or Zomato. No seats needed.' },
  ];
  const ONLINE_HINT = {
    dinein: 'Allow online table booking / QR ordering for this table.',
    bar: 'Allow online booking / QR ordering for these seats.',
    private: 'Allow this room to be booked online.',
    takeaway: 'Accept pickup orders from your website / app.',
    delivery: 'Accept delivery orders from your website / app.',
    aggregator: 'Receive orders from this app on the POS.',
  };
  const TABS = [['ALL', 'All'], ['SEATED', 'Tables & Seating'], ['OFF', 'Takeaway & Delivery'], ['APP', 'Online Aggregators']];

  // [type, name, seats, area, showOnline, active, description]
  const SEED = [
    ['dinein', 'T1', 4, 'Ground Floor', true, true, 'Window side'], ['dinein', 'T2', 4, 'Ground Floor', true, true, ''],
    ['dinein', 'T3', 4, 'Ground Floor', true, true, ''], ['dinein', 'T4', 4, 'Ground Floor', true, true, ''],
    ['dinein', 'T5', 2, 'Ground Floor', true, true, 'Couple table'], ['dinein', 'T6', 2, 'Ground Floor', true, true, 'Couple table'],
    ['dinein', 'T7', 6, 'Ground Floor', true, true, 'Family table'], ['dinein', 'T8', 6, 'Ground Floor', true, true, 'Family table'],
    ['dinein', 'R1', 4, 'Rooftop', false, true, ''], ['dinein', 'R2', 4, 'Rooftop', false, true, ''],
    ['dinein', 'R3', 4, 'Rooftop', false, true, ''], ['dinein', 'R4', 4, 'Rooftop', false, false, 'Under repair'],
    ['bar', 'B1', 2, 'Bar Lounge', false, true, ''], ['bar', 'B2', 2, 'Bar Lounge', false, true, ''], ['bar', 'B3', 2, 'Bar Lounge', false, true, ''],
    ['private', 'PD1', 12, 'First Floor', true, true, 'Private dining room with TV'],
    ['takeaway', 'Takeaway Counter', '', '', true, true, 'Pickup orders'],
    ['delivery', 'Home Delivery', '', '', true, true, 'Own delivery staff'],
    ['aggregator', 'Swiggy', '', '', true, true, ''], ['aggregator', 'Zomato', '', '', true, true, ''],
  ];

  const $ = id => document.getElementById(id);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (m, e) => window.rmsToast && window.rmsToast(m, e);
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const typeOf = c => TYPES.find(t => t.id === (c.type || c)) || TYPES[0];
  const inTab = (c, tab) => tab === 'ALL' ||
    (tab === 'SEATED' ? typeOf(c).seated : tab === 'APP' ? c.type === 'aggregator' : !typeOf(c).seated && c.type !== 'aggregator');

  function load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ }
    const seeded = SEED.map(([type, name, seats, area, online, active, description]) =>
      ({ id: uid(), type, name, seats, area, online, active, description, createdAt: Date.now() }));
    save(seeded);
    return seeded;
  }
  function save(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { toast('Could not save to local storage', true); }
  }

  let channels = load();
  let tab = 'ALL', page = 1, editingId = null, deletingId = null;
  const byId = id => channels.find(c => c.id === id);
  const nameTaken = (name, exceptId) => channels.some(c => c.id !== exceptId && c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const areas = () => [...new Set(channels.filter(c => typeOf(c).seated && c.area).map(c => c.area))].sort(collator.compare);

  // ---------- List ----------
  function sorted(list) {
    const order = t => TYPES.findIndex(x => x.id === t);
    return [...list].sort((a, b) => order(a.type) - order(b.type) || collator.compare(a.area || '~', b.area || '~') || collator.compare(a.name, b.name));
  }
  function filtered() {
    const q = $('ptSearch').value.trim().toLowerCase();
    const area = $('ptAreaFilter').value;
    return sorted(channels.filter(c => inTab(c, tab)
      && (!area || (area === '__none' ? typeOf(c).seated && !c.area : c.area === area))
      && (!q || [c.name, c.area, c.description, typeOf(c).label].some(v => (v || '').toLowerCase().includes(q)))));
  }
  function renderStats() {
    const act = channels.filter(c => c.active);
    const seated = act.filter(c => typeOf(c).seated);
    const stat = (l, v, s) => `<div class="pt-stat"><span>${l}</span><b>${v}</b><small>${s}</small></div>`;
    $('ptStats').innerHTML =
      stat('Active tables', seated.length, 'dine-in, bar & private') +
      stat('Total seats', seated.reduce((t, c) => t + (+c.seats || 0), 0), 'across active tables') +
      stat('Other order channels', act.length - seated.length, 'takeaway, delivery & apps') +
      stat('Inactive', channels.length - act.length, 'hidden from the POS');
  }
  function renderAreaFilter() {
    const cur = $('ptAreaFilter').value;
    const list = areas();
    $('ptAreaFilter').innerHTML = '<option value="">All areas</option>' +
      list.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('') +
      '<option value="__none">No area set</option>';
    $('ptAreaFilter').value = cur === '__none' || list.includes(cur) ? cur : '';
    $('ptAreaList').innerHTML = list.map(a => `<option value="${esc(a)}"></option>`).join('');
  }
  function render() {
    renderStats();
    renderAreaFilter();
    $('ptTabs').innerHTML = TABS.map(([k, l]) =>
      `<button class="${k === tab ? 'active' : ''}" data-tab="${k}">${l}<span class="n">${channels.filter(c => inTab(c, k)).length}</span></button>`).join('');

    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > pages) page = pages;
    const start = (page - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);
    const na = '<span class="muted">—</span>';
    $('ptBody').innerHTML = rows.length ? rows.map(c => {
      const t = typeOf(c);
      return `<tr>
        <td class="pin-l"><span class="actions">
          <button class="icon-btn" data-edit="${c.id}" title="Edit" aria-label="Edit ${esc(c.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
          <button class="icon-btn del" data-delete="${c.id}" title="Delete" aria-label="Delete ${esc(c.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
        </span></td>
        <td class="pin-n strong">${esc(c.name)}${c.description ? `<span class="parent-hint">${esc(c.description)}</span>` : ''}</td>
        <td><span class="chip ${t.chip}">${t.label}</span></td>
        <td>${t.seated ? (c.area ? esc(c.area) : na) : na}</td>
        <td class="num">${t.seated ? c.seats : na}</td>
        <td class="c-center"><label class="switch" title="${c.active ? 'Shown on POS' : 'Hidden from POS'}"><input type="checkbox" data-toggle="active" data-id="${c.id}" ${c.active ? 'checked' : ''} /><span></span></label></td>
        <td class="c-center"><label class="switch" title="${esc(ONLINE_HINT[c.type])}"><input type="checkbox" data-toggle="online" data-id="${c.id}" ${c.online ? 'checked' : ''} /><span></span></label></td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" class="empty">No tables or order channels found</td></tr>';

    UI.pager($('ptPagination'), $('ptInfo'), list.length, page, p => { page = p; render(); }, pageSize);
    UI.bindPin($('ptWrap'));
  }
  $('ptTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; page = 1; render(); } });
  $('ptSearch').addEventListener('input', () => { page = 1; render(); });
  $('ptAreaFilter').addEventListener('change', () => { page = 1; render(); });
  UI.mountSize('ptSize', pageSize, n => { pageSize = n; page = 1; render(); });
  $('ptRefresh').innerHTML = UI.ICREFRESH;
  $('ptRefresh').addEventListener('click', () => { render(); toast('POS Table Config refreshed'); });
  $('ptExport').insertAdjacentHTML('afterbegin', UI.ICDOWN);
  $('ptExport').addEventListener('click', () => {
    const n = UI.csv('pos-table-config',
      ['Table / Channel Name', 'Channel Type', 'Area / Section', 'Seats', 'Active on POS', 'Show Online'],
      filtered().map(c => { const t = typeOf(c); return [c.name, t.label, t.seated ? (c.area || '') : '', t.seated ? c.seats : '', c.active ? 'Yes' : 'No', c.online ? 'Yes' : 'No']; }));
    toast(n < 0 ? 'Export not available here' : `Exported ${n} rows`, n < 0);
  });
  $('ptBody').addEventListener('change', e => {
    const t = e.target.closest('[data-toggle]');
    if (!t) return;
    const c = byId(t.dataset.id);
    c[t.dataset.toggle] = t.checked;
    save(channels);
    toast(t.dataset.toggle === 'active'
      ? `"${c.name}" ${c.active ? 'is now shown on the POS' : 'hidden from the POS'}`
      : `"${c.name}" ${c.online ? 'is now available online' : 'removed from online'}`, !t.checked);
    render();
  });
  $('ptBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-delete]');
    if (ed) openForm(ed.dataset.edit);
    if (del) openDelete(del.dataset.delete);
  });

  // ---------- Add / Edit ----------
  $('ptType').innerHTML =
    `<optgroup label="Tables & seating">${TYPES.filter(t => t.seated).map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</optgroup>` +
    `<optgroup label="Other order channels">${TYPES.filter(t => !t.seated).map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</optgroup>`;

  const isBulk = () => !editingId && typeOf($('ptType').value).seated && $('ptBulk').checked;
  function bulkNames() {
    const from = $('ptFrom').value, to = $('ptTo').value;
    if (from === '' || to === '') return null;
    const f = +from, t = +to;
    if (!Number.isInteger(f) || !Number.isInteger(t) || f < 0 || t < f || t - f >= 50) return null;
    const prefix = $('ptPrefix').value.trim();
    return Array.from({ length: t - f + 1 }, (_, i) => prefix + (f + i));
  }
  function applyType() {
    const t = typeOf($('ptType').value);
    $('ptTypeHint').textContent = t.hint;
    $('ptName').placeholder = t.ph;
    $('ptNameLbl').textContent = t.seated ? 'Table Name / No. *' : 'Channel Name *';
    $('ptOnlineHint').textContent = ONLINE_HINT[t.id];
    document.querySelectorAll('#ptModal .seated-only').forEach(el => { el.style.display = t.seated ? '' : 'none'; });
    $('ptBulkRow').style.display = t.seated && !editingId ? '' : 'none';
    applyBulk();
  }
  function applyBulk() {
    const bulk = isBulk();
    document.querySelectorAll('#ptModal .single-only').forEach(el => { el.style.display = bulk ? 'none' : ''; });
    document.querySelectorAll('#ptModal .bulk-only').forEach(el => { el.style.display = bulk ? '' : 'none'; });
    $('ptSeatsLbl').textContent = bulk ? 'Seats per Table *' : 'Seats *';
    validate();
  }
  function validate() {
    const t = typeOf($('ptType').value);
    const need = [];
    let nameErr = '', bulkMsg = '', bulkErr = false;
    if (isBulk()) {
      const names = bulkNames();
      if (!names) { need.push('a valid From / To range (max 50)'); bulkMsg = 'Enter From and To numbers, e.g. 1 to 10.'; bulkErr = true; }
      else {
        const taken = names.filter(n => nameTaken(n));
        if (taken.length) { bulkMsg = `Already exists: ${taken.slice(0, 6).join(', ')}${taken.length > 6 ? '…' : ''}`; bulkErr = true; need.push('unused table names'); }
        else bulkMsg = `Will create ${names.length} table${names.length > 1 ? 's' : ''}: ${names.length > 6 ? names.slice(0, 3).join(', ') + ' … ' + names[names.length - 1] : names.join(', ')}`;
      }
    } else {
      const name = $('ptName').value.trim();
      if (!name) need.push(t.seated ? 'table name' : 'channel name');
      else if (nameTaken(name, editingId)) { nameErr = 'This name is already used on the POS.'; need.push('a unique name'); }
    }
    if (t.seated) {
      const s = $('ptSeats').value;
      if (s === '' || !Number.isInteger(+s) || +s < 1 || +s > 100) need.push('seats (1–100)');
    }
    $('ptNameErr').textContent = nameErr;
    $('ptNameField').classList.toggle('error', !!nameErr);
    $('ptBulkPreview').textContent = bulkMsg;
    $('ptBulkPreview').classList.toggle('bad', bulkErr);
    $('ptNeed').textContent = need.length ? 'Needed: ' + need.join(', ') : '';
    $('ptSubmit').disabled = !!need.length;
    return !need.length;
  }
  ['ptName', 'ptSeats', 'ptPrefix', 'ptFrom', 'ptTo'].forEach(id => $(id).addEventListener('input', validate));
  $('ptType').addEventListener('change', applyType);
  $('ptBulk').addEventListener('change', applyBulk);

  function openForm(id = null) {
    editingId = id;
    const c = id ? byId(id) : null;
    const defType = { SEATED: 'dinein', OFF: 'takeaway', APP: 'aggregator' }[tab] || 'dinein';
    $('ptTitle').textContent = c ? `Edit ${typeOf(c).seated ? 'Table' : 'Order Channel'} — ${c.name}` : 'Add Table / Channel';
    $('ptSubmit').textContent = c ? 'Update' : 'Save';
    $('ptType').value = c ? c.type : defType;
    $('ptName').value = c ? c.name : '';
    $('ptSeats').value = c ? c.seats : 4;
    $('ptAreaInput').value = c ? c.area || '' : '';
    $('ptDesc').value = c ? c.description || '' : '';
    $('ptActive').checked = c ? c.active : true;
    $('ptOnline').checked = c ? c.online : true;
    $('ptBulk').checked = false;
    $('ptPrefix').value = 'T'; $('ptFrom').value = ''; $('ptTo').value = '';
    applyType();
    $('ptModal').classList.add('show');
    setTimeout(() => $('ptName').focus(), 50);
  }
  $('ptAddBtn').addEventListener('click', () => openForm());

  $('ptForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const t = typeOf($('ptType').value);
    const base = {
      type: t.id,
      seats: t.seated ? +$('ptSeats').value : '',
      area: t.seated ? $('ptAreaInput').value.trim() : '',
      description: $('ptDesc').value.trim(),
      active: $('ptActive').checked,
      online: $('ptOnline').checked,
    };
    if (isBulk()) {
      const names = bulkNames();
      names.forEach(name => channels.push({ id: uid(), name, ...base, createdAt: Date.now() }));
      toast(`${names.length} tables added`);
    } else if (editingId) {
      Object.assign(byId(editingId), { name: $('ptName').value.trim(), ...base, updatedAt: Date.now() });
      toast(`"${$('ptName').value.trim()}" updated`);
    } else {
      channels.push({ id: uid(), name: $('ptName').value.trim(), ...base, createdAt: Date.now() });
      toast(`"${$('ptName').value.trim()}" added`);
    }
    save(channels);
    close();
    render();
  });

  // ---------- Delete ----------
  function openDelete(id) {
    const c = byId(id);
    if (!c) return;
    deletingId = id;
    $('ptDeleteText').innerHTML = `Are you sure you want to delete <b>${esc(c.name)}</b> (${typeOf(c).label})? It will no longer be available on the POS.` +
      '<span class="warn" style="color:#6b7280">Tip: turn off “Active on POS” instead if you may need it again.</span>';
    $('ptDeleteModal').classList.add('show');
  }
  $('ptConfirmDelete').addEventListener('click', () => {
    const c = byId(deletingId);
    if (!c) return close();
    channels = channels.filter(x => x.id !== deletingId);
    save(channels);
    toast(`"${c.name}" deleted`, true);
    close();
    render();
  });

  function close() {
    $('ptModal').classList.remove('show');
    $('ptDeleteModal').classList.remove('show');
    editingId = deletingId = null;
  }
  document.querySelectorAll('[data-pt-close]').forEach(b => b.addEventListener('click', close));
  ['ptModal', 'ptDeleteModal'].forEach(id => $(id).addEventListener('mousedown', e => { if (e.target.id === id) close(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) { channels = load(); render(); } });

  render();
})();
