// ===================== Sidebar (recommended order) + router =====================
(() => {
  const R = window.RMS; const { esc, VIEWS } = R;
  const I = {
    dash: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/></svg>',
    setting: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="8" r="4"/><path d="M1 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z"/><circle cx="17.5" cy="9" r="3"/><path d="M18 13.6c2.9.4 5 2.4 5 5.4h-4.5c0-2.2-.9-4-2.4-5.2.6-.1 1.2-.2 1.9-.2z"/></svg>',
    inventory: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="6" r="2.5"/><circle cx="5" cy="12" r="2.5"/><circle cx="5" cy="18" r="2.5"/><rect x="9" y="4.5" width="13" height="3" rx="1.5"/><rect x="9" y="10.5" width="13" height="3" rx="1.5"/><rect x="9" y="16.5" width="13" height="3" rx="1.5"/></svg>',
    vendor: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l2-4h14l2 4v2a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3z"/><path d="M5 13.5V21h14v-7.5a4.5 4.5 0 0 1-3-1 4.5 4.5 0 0 1-4 1.4A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3 1z"/></svg>',
    pos: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6v2H8v2h8v-2h-2v-2h6a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 12H4V5h16v10z"/></svg>',
    staff: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V9h14v11zM7 11h5v5H7z"/></svg>',
    housekeeping: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h2v2H3zm4 0h14v2H7zM3 11h2v2H3zm4 0h14v2H7zm-4 6h2v2H3zm4 0h14v2H7z"/></svg>',
  };
  const NAV = [
    { g: 'dashboard', l: 'Dashboard', i: I.dash, single: 'dashboard' },
    { g: 'setting', l: 'Setting', i: I.setting, items: [['location', 'Location'], ['department', 'Department'], ['wastage', 'Reason of Wastage'], ['vehicle', 'Vehicle Master'], ['driver', 'Driver Master']] },
    { g: 'users', l: 'User Management', i: I.users, items: [['roles', 'Roles'], ['users', 'Users']] },
    { g: 'inventory', l: 'Inventory', i: I.inventory, items: [['category-master', 'Category Master'], ['brand', 'Brand'], ['subbrand', 'Sub-Brand'], ['rawmaterial', 'Raw Material'], ['menu-section', 'Menu Section'], ['recipe', 'Recipe']] },
    { g: 'vendor', l: 'Vendor', i: I.vendor, single: 'vendor' },
    { g: 'pos', l: 'POS Configurations', i: I.pos, items: [['tax', 'Tax Setting'], ['pos-table-config', 'POS Table Config']] },
    { g: 'staff', l: 'Staff Management', i: I.staff, items: [['#Setup'], ['shift', 'Shift Master'], ['leavepolicy', 'Leave Policy'], ['rosterpattern', 'Roster Pattern'], ['#Manager'], ['teamroster', 'Team Roster'], ['approveleave', 'Approve Leave'], ['#My space'], ['attendance', 'Attendance'], ['myroster', 'My Roster'], ['applyleave', 'Apply Leave']] },
    { g: 'housekeeping', l: 'Housekeeping', i: I.housekeeping, items: [['ckforms', 'Checklist Forms'], ['ckassign', 'Checklist Assignment'], ['mychecklist', 'My Checklist']] },
  ];
  const GROUP_LABEL = Object.fromEntries(NAV.map(n => [n.g, n.l]));
  // the four pages the user already redesigned (static DOM)
  const STATIC = { 'category-master': 'inventory', 'menu-section': 'inventory', recipe: 'inventory', 'pos-table-config': 'pos' };
  Object.entries(STATIC).forEach(([k, g]) => { if (!VIEWS[k]) VIEWS[k] = { group: g, title: NAV.find(n => n.g === g).items.find(x => x[0] === k)[1], static: true }; });

  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
  const nav = document.querySelector('.sidebar .nav');
  let openGroup = null;
  function drawNav() {
    nav.innerHTML = NAV.map(n => {
      if (n.single) return `<a class="nav-item single" data-single="${n.single}" href="#${n.single}" style="text-decoration:none" title="${esc(n.l)}">${n.i}<span class="label">${esc(n.l)}</span></a>`;
      const badge = n.items.reduce((s, it) => s + (VIEWS[it[0]] && VIEWS[it[0]].badge ? VIEWS[it[0]].badge() : 0), 0);
      return `<div class="nav-item" data-group="${n.g}" title="${esc(n.l)}">${n.i}<span class="label">${esc(n.l)}</span>${badge ? `<span class="n-badge">${badge}</span>` : ''}${chev}</div><div class="nav-group" data-gbody="${n.g}">${n.items.map(it => it[0][0] === '#' ? `<div class="nav-sec">${esc(it[0].slice(1))}</div>` : `<a class="sub-item" href="#${it[0]}" data-view="${it[0]}">${esc(it[1])}${VIEWS[it[0]] && VIEWS[it[0]].badge && VIEWS[it[0]].badge() ? `<span class="s-badge">${VIEWS[it[0]].badge()}</span>` : ''}</a>`).join('')}</div>`;
    }).join('');
    nav.querySelectorAll('[data-group]').forEach(h => h.addEventListener('click', () => {
      const g = h.dataset.group;
      if (document.getElementById('sidebar').classList.contains('collapsed')) { document.getElementById('sidebar').classList.remove('collapsed'); }
      openGroup = openGroup === g ? null : g; syncNav();
    }));
    syncNav();
  }
  function syncNav() {
    const key = current();
    nav.querySelectorAll('.nav-item[data-group]').forEach(el => el.classList.toggle('open', el.dataset.group === openGroup));
    nav.querySelectorAll('.nav-group').forEach(el => el.classList.toggle('open', el.dataset.gbody === openGroup));
    nav.querySelectorAll('.sub-item').forEach(el => el.classList.toggle('active', el.dataset.view === key));
    nav.querySelectorAll('[data-single]').forEach(el => el.classList.toggle('active-single', el.dataset.single === key));
  }
  const current = () => { const k = location.hash.slice(1); return VIEWS[k] ? k : 'dashboard'; };

  const content = document.querySelector('.content');
  function show() {
    const key = current(); const v = VIEWS[key];
    openGroup = v.group === 'dashboard' || v.group === 'vendor' ? null : v.group;
    let el = document.getElementById('view-' + key);
    if (!el) { el = document.createElement('div'); el.className = 'page view'; el.id = 'view-' + key; content.appendChild(el); }
    document.querySelectorAll('.view').forEach(x => x.classList.toggle('show', x === el));
    if (v.render) v.render(el);
    document.getElementById('crumbGroup').textContent = GROUP_LABEL[v.group] || '';
    document.getElementById('crumbPage').textContent = v.title;
    document.getElementById('crumbGroup').style.display = v.group === 'dashboard' ? 'none' : '';
    document.querySelector('.breadcrumb svg').style.display = v.group === 'dashboard' ? 'none' : '';
    document.title = `${v.title} | Wize Restaurant`;
    content.scrollTop = 0;
    drawNav();
  }
  window.addEventListener('hashchange', show);
  window.RMSNav = { refreshBadges: drawNav, NAV };

  // top bar: user menu with logout (moved out of the sidebar)
  const tr = document.querySelector('.top-right');
  const av = tr.querySelector('.avatar');
  const wrap = document.createElement('div'); wrap.className = 'avatar-wrap'; av.parentNode.insertBefore(wrap, av); wrap.appendChild(av);
  wrap.insertAdjacentHTML('beforeend', `<div class="user-menu" id="userMenu"><div class="um-head"><b>Uttiyo Ghosh</b><span>Administrator · uttiyo.ghosh@wize.in</span></div><a href="#myroster">My Roster</a><a href="#attendance">My Attendance</a><a href="#applyleave">Apply Leave</a><a href="#" data-noop>Change Password</a><a href="#" class="danger" data-logout>Logout</a></div>`);
  av.addEventListener('click', e => { e.stopPropagation(); document.getElementById('userMenu').classList.toggle('show'); });
  document.addEventListener('click', () => document.getElementById('userMenu').classList.remove('show'));
  wrap.querySelector('[data-logout]').addEventListener('click', e => { e.preventDefault(); R.toast('Logged out (prototype)'); });
  wrap.querySelector('[data-noop]').addEventListener('click', e => { e.preventDefault(); R.toast('Change password (prototype)'); });

  show();
})();
