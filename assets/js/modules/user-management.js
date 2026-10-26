// Wize Restaurant RMS — User Management
// Roles with the permission matrix, and Users.
(() => {
  const R = window.RMS;
  const { esc, store, chip, status, ava, money, expiry, fmtDate, crud, IC } = R;
  const D = window.RMSData;
  const { STATES, LOC_TYPES, LOC_CHIP, locations, departments, roles, users, fullName,
    vendors, brands, subBrands, rawMaterials, rmCategories, vehicles, drivers, taxes,
    UOMS, VEH_TYPES } = D;

  // =============== USER MANAGEMENT ===============
  // Permission model: module groups -> pages -> actions
  const MODULES = [
    ['Dashboard', ['Dashboard']],
    ['Setting', ['Location', 'Department', 'Reason of Wastage', 'Vehicle Master', 'Driver Master']],
    ['User Management', ['Roles', 'Users']],
    ['Inventory', ['Category Master', 'Brand', 'Sub-Brand', 'Raw Material', 'Menu Section', 'Recipe']],
    ['Purchase & Vendor', ['Vendor', 'Purchase Order', 'Goods Receive']],
    ['Stock', ['Stock Check', 'Requisition', 'Transfer', 'Wastage Entry', 'Yield']],
    ['Production', ['Production Plan']],
    ['POS Configurations', ['Tax Setting', 'POS Table Config']],
    ['Staff Management', ['Shift Master', 'Leave Policy', 'Roster Pattern', 'Team Roster', 'Attendance', 'Approve Leave']],
    ['Self Service', ['My Roster', 'My Attendance', 'Apply Leave', 'My Checklist']],
    ['Housekeeping', ['Checklist Forms', 'Checklist Assignment']],
    ['Reports', ['Stock Report', 'Wastage Report', 'Transfer Report', 'Attendance Report']],
  ];
  const ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export'];
  const APPROVABLE = ['Requisition', 'Transfer', 'Wastage Entry', 'Purchase Order', 'Approve Leave', 'Goods Receive'];
  const SELF = ['My Roster', 'My Attendance', 'Apply Leave', 'My Checklist', 'Dashboard'];
  const allowed = (page, a) => (page === 'Dashboard' ? a === 'View' : a === 'Approve' ? APPROVABLE.includes(page) : SELF.includes(page) ? ['View', 'Create'].includes(a) || (page === 'My Checklist' && a === 'Edit') : true);
  const TOTAL_PERMS = MODULES.flatMap(([, ps]) => ps).reduce((n, p) => n + ACTIONS.filter(a => allowed(p, a)).length, 0);
  function presetPerms(kind) {
    const out = {};
    MODULES.forEach(([g, ps]) => ps.forEach(p => ACTIONS.forEach(a => {
      if (!allowed(p, a)) return;
      let on = false;
      if (kind === 'ALL') on = true;
      else if (kind === 'SELF') on = g === 'Self Service' || p === 'Dashboard';
      else if (kind === 'CHEF') on = g === 'Self Service' || p === 'Dashboard' || (['Inventory', 'Production'].includes(g) && a !== 'Delete') || (g === 'Stock' && a !== 'Delete') || (['Wastage Report', 'Stock Report'].includes(p) && ['View', 'Export'].includes(a)) || (['Team Roster', 'Attendance'].includes(p) && a === 'View');
      else if (kind === 'STORE') on = g === 'Self Service' || p === 'Dashboard' || g === 'Stock' || g === 'Purchase & Vendor' || (['Raw Material', 'Brand', 'Sub-Brand'].includes(p) && a !== 'Delete') || (g === 'Reports' && ['View', 'Export'].includes(a));
      else if (kind === 'MANAGER') on = !['Setting', 'User Management', 'POS Configurations'].includes(g) && a !== 'Delete' || (g === 'Setting' && a === 'View');
      if (on) out[`${p}|${a}`] = 1;
    })));
    return out;
  }
  const permCount = r => (r.perms === 'ALL' ? TOTAL_PERMS : Object.keys(typeof r.perms === 'string' ? presetPerms(r.perms) : r.perms || {}).length);
  const permObj = r => (typeof r.perms === 'string' ? presetPerms(r.perms) : Object.assign({}, r.perms || {}));

  function permMatrix(d) {
    const P = d._p;
    const q = (d._pq || '').toLowerCase();
    const cell = (p, a) => (allowed(p, a) ? `<span class="pcb ${P[`${p}|${a}`] ? 'on' : ''}" data-pc="${esc(p)}|${a}" title="${a} ${esc(p)}"></span>` : '<span class="pcb na"></span>');
    const grpState = (ps, a) => { const cells = ps.filter(p => allowed(p, a)); if (!cells.length) return 'na'; const n = cells.filter(p => P[`${p}|${a}`]).length; return n === 0 ? '' : n === cells.length ? 'on' : 'part'; };
    const n = Object.keys(P).length;
    return `<div class="perm-tools">
        <div class="search" style="height:36px;width:240px">${IC.search}<input type="text" data-pq placeholder="Find a page..." value="${esc(d._pq || '')}"></div>
        <select class="filter-sel" data-preset><option value="">Copy permissions from…</option>${roles().all().filter(r => r.id !== d.id).map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select>
        <button type="button" class="btn-sm ghost" data-pall>Grant all</button><button type="button" class="btn-sm ghost" data-pnone>Clear all</button>
        <span class="perm-count"><b style="color:var(--text)">${n}</b> of ${TOTAL_PERMS} permissions enabled</span>
      </div>
      <div class="progress" style="margin-bottom:12px"><i style="width:${Math.round(n / TOTAL_PERMS * 100)}%"></i></div>
      <div class="perm-wrap"><table class="perm-table"><thead><tr><th>Module / Page</th>${ACTIONS.map(a => `<th>${a}</th>`).join('')}</tr></thead><tbody>
      ${MODULES.map(([g, ps]) => { const vis = ps.filter(p => !q || p.toLowerCase().includes(q) || g.toLowerCase().includes(q)); if (!vis.length) return ''; return `<tr class="grp"><td>${esc(g)}</td>${ACTIONS.map(a => { const s = grpState(ps, a); return `<td>${s === 'na' ? '<span class="pcb na"></span>' : `<span class="pcb ${s}" data-pg="${esc(g)}|${a}" title="All ${a} in ${esc(g)}"></span>`}</td>`; }).join('')}</tr>${vis.map(p => `<tr><td>${esc(p)}</td>${ACTIONS.map(a => `<td>${cell(p, a)}</td>`).join('')}</tr>`).join('')}`; }).join('')}
      </tbody></table></div>
      <p class="sec-note">Tick <b>View</b> to show the page in the menu. Group rows tick or clear a whole module. <b>Approve</b> applies only to pages that have an approval step.</p>`;
  }
  function bindMatrix(el, d, redraw) {
    const P = d._p;
    const mutate = () => { d.perms = Object.assign({}, P); redraw(); };
    el.querySelectorAll('[data-pc]').forEach(c => c.addEventListener('click', () => { const k = c.dataset.pc; const [p, a] = k.split('|'); if (P[k]) { delete P[k]; if (a === 'View') ACTIONS.forEach(x => delete P[`${p}|${x}`]); } else { P[k] = 1; if (a !== 'View') P[`${p}|View`] = 1; } mutate(); }));
    el.querySelectorAll('[data-pg]').forEach(c => c.addEventListener('click', () => { const [g, a] = c.dataset.pg.split('|'); const ps = MODULES.find(m => m[0] === g)[1].filter(p => allowed(p, a)); const allOn = ps.every(p => P[`${p}|${a}`]); ps.forEach(p => { if (allOn) { delete P[`${p}|${a}`]; if (a === 'View') ACTIONS.forEach(x => delete P[`${p}|${x}`]); } else { P[`${p}|${a}`] = 1; P[`${p}|View`] = 1; } }); mutate(); }));
    const pq = el.querySelector('[data-pq]'); pq.addEventListener('input', () => { d._pq = pq.value; redraw(); const n = document.querySelector('[data-pq]'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    el.querySelector('[data-pall]').addEventListener('click', () => { Object.assign(P, presetPerms('ALL')); mutate(); });
    el.querySelector('[data-pnone]').addEventListener('click', () => { Object.keys(P).forEach(k => delete P[k]); mutate(); });
    el.querySelector('[data-preset]').addEventListener('change', e => { const r = roles().get(e.target.value); if (!r) return; Object.keys(P).forEach(k => delete P[k]); Object.assign(P, permObj(r)); R.toast(`Copied ${permCount(r)} permissions from “${r.name}”`); mutate(); });
  }

  crud({
    key: 'roles', group: 'users', title: 'Roles', entity: 'Role', db: roles,
    sub: 'A role is a set of permissions. Create roles first, then assign one to each user.',
    info: 'A <b>Role</b> is a set of permissions, not a person. Roles must exist before you create <a href="#users">Users</a> — each user gets exactly one role, and it decides which pages in this menu they can open.',
    name: r => r.name, unique: ['name'],
    searchText: r => r.name + ' ' + r.desc,
    columns: [
      { h: 'Role', render: r => `${esc(r.name)}<span class="sub-line">${esc(r.desc || '—')}</span>` },
      { h: 'Users', cls: 'num', render: r => { const n = users().all().filter(u => u.role === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
      { h: 'Access', render: r => { const n = permCount(r); const pct = Math.round(n / TOTAL_PERMS * 100); return `<div class="prog-cell"><div class="progress ${n === TOTAL_PERMS ? 'green' : ''}" style="width:120px"><i style="width:${pct}%"></i></div>${n === TOTAL_PERMS ? '<span class="ok-txt">Full access</span>' : n === 0 ? '<span style="color:#b91c1c;font-weight:600">No access</span>' : `${n} / ${TOTAL_PERMS}`}</div>`; } },
    ],
    toggle: { field: 'active', block: r => (r.name === 'Administrator' ? 'The Administrator role cannot be deactivated.' : '') },
    rowActions: r => `<button class="icon-btn" data-dup title="Duplicate role">${IC.copy}</button>`,
    bindRow: (tr, r, rerender) => tr.querySelector('[data-dup]').addEventListener('click', () => { const c = JSON.parse(JSON.stringify(r)); delete c.id; c.name = r.name + ' (Copy)'; c.perms = permObj(r); roles().upsert(c); R.toast(`“${c.name}” created`); rerender(); }),
    deleteBlock: r => { const n = users().all().filter(u => u.role === r.name).length; return r.name === 'Administrator' ? 'The Administrator role cannot be deleted.' : n ? `<b>${n} user(s)</b> have this role. Assign them another role first.` : ''; },
    defaults: () => ({ perms: {}, _p: {} }),
    beforeSave: d => { d.perms = Object.assign({}, d._p); delete d._p; delete d._pq; },
    form: d => { if (!d._p) d._p = permObj(d); return {
      size: 'full', addTitle: 'Add New Role', sub: 'Name the role, then choose what it can see and do.', saveLabel: 'Save Role', updateLabel: 'Update Role',
      summary: x => { const n = Object.keys(x._p).length; const mods = MODULES.filter(([, ps]) => ps.some(p => x._p[`${p}|View`])).map(m => m[0]); return `<div class="sum-head"><h3>Role summary</h3><span>live</span></div><div class="kpis"><div class="kpi"><span>Permissions</span><b>${n}</b></div><div class="kpi"><span>Modules</span><b>${mods.length} / ${MODULES.length}</b></div></div><div class="sum-group">Can open</div>${mods.length ? mods.map(m => `<div class="sum-row"><span>${esc(m)}</span><b class="ok-txt">✓</b></div>`).join('') : '<p class="sum-note">Nothing yet — users with this role will see an empty menu.</p>'}<p class="sum-note">Users with this role: <b>${users().all().filter(u => u.role === x.name).length}</b></p>`; },
      sections: [
        { title: 'Role details', desc: 'Shown when assigning a role to a user.', fields: [
          { key: 'name', label: 'Role Name', req: true, placeholder: 'e.g. Outlet Manager' },
          { key: 'desc', label: 'Description', placeholder: 'What this role is responsible for' },
          { key: 'active', type: 'switch', label: 'Active', desc: 'Inactive roles cannot be assigned to new users.', span: 'full' },
        ] },
        { title: 'Permissions', desc: 'Available while creating the role — no need to save first.', cols: 1, fields: [
          { key: '_perm', type: 'custom', render: x => permMatrix(x), bind: (el, x, redraw) => bindMatrix(el, x, redraw) },
        ] },
      ] }; },
  });

  crud({
    key: 'users', group: 'users', title: 'Users', menuTitle: 'Users', entity: 'User', db: users,
    sub: 'Everyone who signs in to Wize. Each user has one role, a home location and a department.',
    info: 'Everyone who signs in to Wize. A user needs a <a href="#roles">Role</a>, a home <a href="#location">Location</a> and a <a href="#department">Department</a>, so set those three up first.',
    name: r => fullName(r), unique: ['email', 'phone'], export: true,
    searchText: r => [fullName(r), r.email, r.phone, r.code].join(' '), searchPh: 'Search by name, email, phone or emp. code...',
    stats: rows => [
      { label: 'Total users', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Signed in today', value: rows.filter(r => /^Today/.test(r.lastLogin)).length, sub: 'last 24 hours' },
      { label: 'Never signed in', value: rows.filter(r => r.lastLogin === 'Never').length, sub: 'send invite again', cls: 'warn', filter: 'never' },
      { label: 'Administrators', value: rows.filter(r => r.role === 'Administrator').length, sub: 'full access', filter: 'admin' },
    ],
    statFilter: (r, f) => (f === 'never' ? r.lastLogin === 'Never' : r.role === 'Administrator'),
    filters: [
      { key: 'role', label: 'All Roles', options: () => roles().all().map(r => r.name), match: (r, v) => r.role === v },
      { key: 'loc', label: 'All Locations', options: () => locations().all().map(l => l.name), match: (r, v) => r.loc === v },
    ],
    columns: [
      { h: 'User', render: r => `<span class="who">${ava(fullName(r))}<span><b>${esc(fullName(r))}</b><span class="sub-line">${esc(r.code)} · ${esc(r.email)}</span></span></span>` },
      { h: 'Phone', render: r => `<span style="font-weight:500;white-space:nowrap">${esc(r.cc)} ${esc(r.phone.replace(/(\d{5})(\d{5})/, '$1 $2'))}</span>` },
      { h: 'Role', render: r => chip(r.role, r.role === 'Administrator' ? 'purple' : '') },
      { h: 'Location / Dept.', render: r => `<span style="font-weight:500">${esc(r.loc)}</span><span class="sub-line">${esc(r.dept)}</span>` },
      { h: 'Last Sign-in', render: r => (r.lastLogin === 'Never' ? chip('Never', 'semi') : `<span style="font-weight:500;white-space:nowrap">${esc(r.lastLogin)}</span>`) },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ cc: '+91', state: 'West Bengal', city: 'Kolkata', lastLogin: 'Never', code: 'EMP' + String(users().all().length + 1).padStart(3, '0'), sendInvite: true, join: R.ymd(R.TODAY) }),
    beforeSave: d => { delete d.pw; delete d.pw2; },
    form: {
      size: 'full', addTitle: 'Add New User', sub: 'One screen — personal details, role and sign-in together.', saveLabel: 'Create User', updateLabel: 'Update User',
      summary: d => `<div style="text-align:center;padding:6px 0 10px">${ava(fullName(d) || 'New User', 64)}<div style="font-weight:700;margin-top:8px">${esc(fullName(d) || 'New User')}</div><div class="sum-sub" style="margin:2px 0 0">${esc(d.email || 'No email yet')}</div><div style="margin-top:8px">${status(d.active)}</div></div>
        <div class="sum-group">Access</div><div class="sum-row"><span>Role</span><b>${esc(d.role || '—')}</b></div><div class="sum-row"><span>Location</span><b>${esc(d.loc || '—')}</b></div><div class="sum-row"><span>Department</span><b>${esc(d.dept || '—')}</b></div>
        <div class="sum-group">Sign-in</div><div class="sum-row"><span>Username</span><b>${esc((d.email || '').split('@')[0] || '—')}</b></div><p class="sum-note">${d.sendInvite ? 'An invite with a one-time password will be sent by email and SMS. The user sets their own password on first sign-in.' : 'Share the password with the user securely.'}</p>`,
      sections: [
        { title: 'Personal information', fields: [
          { key: 'first', label: 'First Name', req: true, placeholder: 'e.g. Riya' },
          { key: 'last', label: 'Last Name', req: true, placeholder: 'e.g. Banerjee' },
          { key: 'code', label: 'Employee Code', req: true, upper: true, hint: 'Auto-generated, editable.' },
          { key: 'email', label: 'Email ID', req: true, type: 'email', placeholder: 'name@company.com', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email', hint: 'Used as the sign-in username.' },
          { key: 'phone', label: 'Mobile Number', req: true, type: 'tel', prefix: '+91', placeholder: '10-digit mobile', pattern: /^[6-9]\d{9}$/, patternMsg: 'Enter a valid 10-digit mobile number' },
          { key: 'join', label: 'Date of Joining', type: 'date' },
        ] },
        { title: 'Role & workplace', desc: 'Decides what the user can see and where they work. No separate step needed.', fields: [
          { key: 'role', label: 'Role', req: true, type: 'select', options: () => roles().all().filter(r => r.active).map(r => r.name), hint: d => { const r = roles().find(x => x.name === d.role); return r ? `${esc(r.desc)} · ${permCount(r)} permissions` : 'Pick the closest role. You can change it later.'; }, rerender: true },
          { key: 'loc', label: 'Home Location', req: true, type: 'select', options: () => locations().all().filter(l => l.active).map(l => l.name) },
          { key: 'dept', label: 'Department', req: true, type: 'select', options: () => departments().all().filter(x => x.active).map(x => x.name) },
        ] },
        { title: 'Sign-in', fields: [
          { key: 'sendInvite', type: 'switch', label: 'Send invite & let user set password', desc: 'Recommended. Avoids sharing passwords on chat.', span: 'full' },
          { key: 'pw', label: 'Temporary Password', type: 'password', show: d => !d.sendInvite, req: true, hint: 'Min 8 characters with a number.', pattern: /^(?=.*\d).{8,}$/, patternMsg: 'Min 8 characters including a number' },
          { key: 'pw2', label: 'Confirm Password', type: 'password', show: d => !d.sendInvite, req: true },
          { key: 'active', type: 'switch', label: 'Account active', desc: 'Inactive users cannot sign in.', span: 'full' },
        ] },
        { title: 'Address (optional)', desc: 'Not required to create the user.', fields: [
          { key: 'line1', label: 'Address', placeholder: 'House, street, area', span: 'full' },
          { key: 'city', label: 'City' },
          { key: 'state', label: 'State', type: 'select', options: STATES },
          { key: 'pin', label: 'Pincode', maxlength: 6, pattern: /^\d{6}$/, patternMsg: 'Pincode must be 6 digits' },
        ] },
      ],
      validate: d => (!d.sendInvite && d.pw && d.pw !== d.pw2 ? { pw2: 'Passwords do not match' } : {}),
    },
  });
})();
