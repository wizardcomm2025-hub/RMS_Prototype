// Wize Restaurant RMS — Menu Section
// The groups shown on the POS menu.
(() => {
  // ---------- markup this module owns ----------
  const VIEW = `
  <div class="page-head">
    <div class="ph-txt">
      <h1>Menu Section</h1>
      <p class="page-sub">The groups cashiers and guests see on the POS menu (e.g. Starters, Main Course, Beverages).</p>
    </div>
  </div>
  <div class="info-strip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
    <span>A <b>Menu Section</b> is a group on the POS menu that cashiers and guests see (Starters, Main Course, Beverages). It is separate from inventory: a finished item keeps its <a href="#category-master">Category</a> for stock &amp; costing and is mapped to a Menu Section for selling. Finished Goods pick their section in <a href="#recipe">Recipe</a>, so create sections before you add sellable recipes.</span>
  </div>
  <div class="table-card">
    <div class="tbl-tools">
      <div class="toolbar-left">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input type="text" id="msSearch" placeholder="Search menu section…" />
        </div>
      </div>
      <div class="tb-right">
        <button class="btn-ghost icon-only" id="msRefresh" title="Refresh list"></button>
        <button class="btn-ghost" id="msExport" title="Download the filtered rows as CSV">Export</button>
        <span class="tb-sep"></span>
        <button class="btn-primary" id="msAddBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Menu Section
        </button>
      </div>
    </div>
    <div class="tbl-wrap" id="msWrap">
      <table class="g-table pin-2 ms-table">
        <thead><tr><th class="pin-l">Actions</th><th class="pin-n">Menu Section Name</th><th class="c-center">Shown on POS</th></tr></thead>
        <tbody id="msBody"></tbody>
      </table>
    </div>
    <div class="tbl-foot"><span class="pg-info" id="msInfo"></span><span id="msSize"></span><div class="pagination" id="msPagination"></div></div>
  </div>

`;
  const DIALOGS = `
<div class="overlay" id="msModal">
  <div class="modal" style="width:420px">
    <div class="modal-head">
      <h2 id="msTitle">Add Menu Section</h2>
      <button data-ms-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <form class="modal-body" id="msForm" autocomplete="off">
      <div class="field" id="msNameField">
        <input type="text" id="msName" placeholder=" " maxlength="40" />
        <label for="msName">Menu Section Name *</label>
        <div class="err-msg" id="msNameErr"></div>
      </div>
      <div class="switch-row">
        Active
        <label class="switch"><input type="checkbox" id="msActive" checked /><span></span></label>
      </div>
    
    </form>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-ms-close>Cancel</button>
        <button type="submit" class="btn-primary" id="msSubmit" form="msForm" disabled>Add Menu Section</button>
      </div>
  </div>
</div>

<div class="overlay" id="msDeleteModal">
  <div class="modal">
    <div class="modal-head">
      <h2>Delete Menu Section</h2>
      <button data-ms-close title="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </div>
    <div class="modal-body">
      <p class="confirm-text" id="msDeleteText"></p>
    
    </div>
    <div class="modal-foot">
        <button type="button" class="btn-outline" data-ms-close>Cancel</button>
        <button type="button" class="btn-danger" id="msConfirmDelete">Delete</button>
      </div>
  </div>
</div>
`;

  const host = document.createElement('div');
  host.className = 'page view';
  host.id = 'view-menu-section';
  host.innerHTML = VIEW;
  document.querySelector('.content').appendChild(host);
  document.body.insertAdjacentHTML('beforeend', DIALOGS);
  const STORAGE_KEY = 'rms_menu_sections_v1';
  let pageSize = 10;
  const UI = window.RMSUI;
  // Listed in typical POS display order
  const SEED = [
    ["Chef's Specials", true], ['Starters', true], ['Soups & Salads', true], ['Tandoor', true],
    ['Main Course', true], ['Rice & Biryani', true], ['Breads', true], ['Chinese', true],
    ['Pizza & Pasta', true], ['Burgers & Sandwiches', true], ['Desserts', true], ['Hot Beverages', true],
    ['Cold Beverages & Mocktails', true], ['Kids Menu', true], ['Combos & Meal Deals', true], ['Seasonal Specials', false],
  ];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const toast = (m, e) => window.rmsToast && window.rmsToast(m, e);

  function load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ }
    const seeded = SEED.map(([name, active]) => ({ id: uid(), name, active, createdAt: Date.now() }));
    save(seeded);
    return seeded;
  }
  function save(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { toast('Could not save to local storage', true); }
  }

  let sections = load();
  let page = 1, editingId = null, deletingId = null;
  const byId = id => sections.find(x => x.id === id);

  // ---------- Table ----------
  function filtered() {
    const q = $('msSearch').value.trim().toLowerCase();
    return q ? sections.filter(x => x.name.toLowerCase().includes(q)) : sections;
  }
  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    if (page > pages) page = pages;
    const start = (page - 1) * pageSize;
    const rows = list.slice(start, start + pageSize);

    $('msBody').innerHTML = rows.length ? rows.map(x => `<tr>
      <td class="pin-l"><span class="actions">
        <button class="icon-btn" data-edit="${x.id}" title="Edit" aria-label="Edit ${esc(x.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></button>
        <button class="icon-btn del" data-delete="${x.id}" title="Delete" aria-label="Delete ${esc(x.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg></button>
      </span></td>
      <td class="pin-n strong">${esc(x.name)}</td>
      <td class="c-center"><label class="switch" title="${x.active ? 'Shown on POS' : 'Hidden from POS'}"><input type="checkbox" data-toggle="${x.id}" ${x.active ? 'checked' : ''}/><span></span></label></td>
    </tr>`).join('') : `<tr><td colspan="3" class="empty">No menu sections found</td></tr>`;

    UI.pager($('msPagination'), $('msInfo'), list.length, page, p => { page = p; render(); }, pageSize);
    UI.bindPin($('msWrap'));
  }

  $('msSearch').addEventListener('input', () => { page = 1; render(); });
  UI.mountSize('msSize', pageSize, n => { pageSize = n; page = 1; render(); });
  $('msRefresh').innerHTML = UI.ICREFRESH;
  $('msRefresh').addEventListener('click', () => { render(); toast('Menu Section refreshed'); });
  $('msExport').insertAdjacentHTML('afterbegin', UI.ICDOWN);
  $('msExport').addEventListener('click', () => {
    const n = UI.csv('menu-section', ['Menu Section Name', 'Shown on POS'], filtered().map(x => [x.name, x.active ? 'Yes' : 'No']));
    toast(n < 0 ? 'Export not available here' : `Exported ${n} rows`, n < 0);
  });

  $('msBody').addEventListener('change', e => {
    const t = e.target.closest('[data-toggle]');
    if (!t) return;
    const x = byId(t.dataset.toggle);
    x.active = t.checked;
    save(sections);
    toast(`"${x.name}" ${x.active ? 'is now shown on POS' : 'hidden from POS'}`, !x.active);
    render();
  });
  $('msBody').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (ed) openForm(ed.dataset.edit);
    if (del) openDelete(del.dataset.delete);
  });

  // ---------- Add / Edit ----------
  function validate() {
    const name = $('msName').value.trim();
    const dup = name && sections.some(x => x.id !== editingId && x.name.toLowerCase() === name.toLowerCase());
    $('msNameErr').textContent = dup ? 'A menu section with this name already exists.' : '';
    $('msNameField').classList.toggle('error', !!dup);
    $('msSubmit').disabled = !name || !!dup;
    return !$('msSubmit').disabled;
  }
  $('msName').addEventListener('input', validate);

  function openForm(id = null) {
    editingId = id;
    const x = id ? byId(id) : null;
    $('msTitle').textContent = x ? 'Edit Menu Section' : 'Add Menu Section';
    $('msSubmit').textContent = x ? 'Update Menu Section' : 'Add Menu Section';
    $('msName').value = x ? x.name : '';
    $('msActive').checked = x ? x.active : true;
    validate();
    $('msModal').classList.add('show');
    setTimeout(() => $('msName').focus(), 50);
  }
  $('msAddBtn').addEventListener('click', () => openForm());

  $('msForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const data = { name: $('msName').value.trim(), active: $('msActive').checked };
    if (editingId) {
      Object.assign(byId(editingId), data, { updatedAt: Date.now() });
      toast(`"${data.name}" updated successfully`);
    } else {
      sections.push({ id: uid(), ...data, createdAt: Date.now() });
      toast(`"${data.name}" added`);
      $('msSearch').value = '';
      page = Math.ceil(sections.length / pageSize);
    }
    save(sections);
    close();
    render();
  });

  // ---------- Delete ----------
  function openDelete(id) {
    const x = byId(id);
    if (!x) return;
    deletingId = id;
    const mapped = window.rmsRecipeUsage ? window.rmsRecipeUsage.menuSection(id) : 0;
    $('msDeleteText').innerHTML = `Are you sure you want to delete <b>${esc(x.name)}</b>?` + (mapped
      ? `<span class="warn">⚠ ${mapped} recipe${mapped > 1 ? 's are' : ' is'} mapped to this section and will not appear on the POS until re-mapped.</span>`
      : ' Finished items mapped to this section will not appear on the POS until they are mapped to another section.');
    $('msDeleteModal').classList.add('show');
  }
  $('msConfirmDelete').addEventListener('click', () => {
    const x = byId(deletingId);
    if (!x) return close();
    sections = sections.filter(s => s.id !== deletingId);
    save(sections);
    toast(`"${x.name}" deleted`, true);
    close();
    render();
  });

  function close() {
    $('msModal').classList.remove('show');
    $('msDeleteModal').classList.remove('show');
    editingId = deletingId = null;
  }
  document.querySelectorAll('[data-ms-close]').forEach(b => b.addEventListener('click', close));
  ['msModal', 'msDeleteModal'].forEach(id => $(id).addEventListener('mousedown', e => { if (e.target.id === id) close(); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) { sections = load(); render(); } });

  render();
})();
