// Wize Restaurant RMS — Staff Management
// Setup (Shift Master, Leave Policy, Roster Pattern), Manager (Team Roster,
// Approve Leave) and My space (Attendance, My Roster, Apply Leave).
// Publishes the roster/attendance helpers that Housekeeping and the Dashboard read.
(() => {
  const R = window.RMS; const D = window.RMSData;
  const { esc, store, chip, status, ava, crud, IC, ymd, fmtDate, addDays, TODAY, daysBetween, pad, register, openForm, toast, confirmDelete } = R;
  const ME = 'Uttiyo Ghosh';
  const staff = () => D.users().all().filter(u => u.active).map(u => ({ name: D.fullName(u), role: u.role, dept: u.dept, loc: u.loc }));
  const toMin = t => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const durMin = (a, b) => { const x = toMin(a), y = toMin(b); if (x == null || y == null) return 0; return y > x ? y - x : 1440 - x + y; };
  const hm = m => `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`;
  const t12 = t => { if (!t) return '—'; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const COLORS = { blue: ['#e8f1ff', '#1d4ed8'], green: ['#e7f8ee', '#15803d'], orange: ['#fff4e5', '#b45309'], purple: ['#f3e8ff', '#7e22ce'], teal: ['#e0f7f5', '#0f766e'], pink: ['#fdeef6', '#be185d'] };

  // ---------------- Shift Master ----------------
  const shifts = () => store('shifts', () => [
    { name: 'Morning', code: 'M', from: '07:00', to: '15:00', brk: 30, grace: 10, color: 'blue' },
    { name: 'General', code: 'G', from: '10:00', to: '19:00', brk: 60, grace: 15, color: 'green' },
    { name: 'Evening', code: 'E', from: '15:00', to: '23:00', brk: 30, grace: 10, color: 'orange' },
    { name: 'Night', code: 'N', from: '23:00', to: '07:00', brk: 30, grace: 10, color: 'purple' },
  ]);
  const shiftBy = code => shifts().find(s => s.code === code);
  const shiftChipStyle = s => { const [bg, fg] = COLORS[s.color] || COLORS.blue; return `background:${bg};color:${fg}`; };
  crud({
    key: 'shift', group: 'staff', title: 'Shift Master', entity: 'Shift', db: shifts,
    sub: 'Working hours your staff are rostered on. Late marks use the grace time.',
    info: 'A <b>Shift</b> is a start and end time with a break and a grace period. Shifts are the building block for <a href="#rosterpattern">Roster Patterns</a>, <a href="#teamroster">Team Roster</a> and <a href="#attendance">Attendance</a> — none of those work until at least one shift exists.',
    name: r => `${r.name} (${r.code})`, unique: ['name', 'code'],
    columns: [
      { h: 'Shift', render: r => `<span class="shift-chip" style="${shiftChipStyle(r)};display:inline-block;padding:4px 10px;margin-right:8px">${esc(r.code)}</span>${esc(r.name)}` },
      { h: 'Timing', render: r => `<span style="font-weight:600;white-space:nowrap">${t12(r.from)} – ${t12(r.to)}</span>${toMin(r.to) <= toMin(r.from) ? '<span class="sub-line">Ends next day</span>' : ''}` },
      { h: 'Duration', cls: 'num', render: r => `${hm(durMin(r.from, r.to))}<span class="sub-line">${hm(durMin(r.from, r.to) - (r.brk || 0))} working</span>` },
      { h: 'Break', cls: 'num', render: r => `${r.brk || 0} min` },
      { h: 'Late after', cls: 'num', render: r => `${r.grace || 0} min grace` },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ brk: 30, grace: 10, color: 'blue', from: '09:00', to: '18:00' }),
    form: { size: 'md', addTitle: 'Add Shift', saveLabel: 'Save Shift', sections: [{ fields: [
      { key: 'name', label: 'Shift Name', req: true, placeholder: 'e.g. Morning' },
      { key: 'code', label: 'Short Code', req: true, upper: true, maxlength: 2, placeholder: 'e.g. M', hint: 'Shown on the roster grid.' },
      { key: 'from', label: 'Start Time', req: true, type: 'time' },
      { key: 'to', label: 'End Time', req: true, type: 'time' },
      { key: '_d', type: 'preview', render: d => { const m = durMin(d.from, d.to); return m ? `<div class="preview-box">Shift length <b>${hm(m)}</b> · working time <b>${hm(Math.max(0, m - (d.brk || 0)))}</b>${toMin(d.to) <= toMin(d.from) ? ' · <b>overnight</b> (ends next day)' : ''}</div>` : '<div class="preview-box">Pick start and end time — duration is calculated automatically.</div>'; } },
      { key: 'brk', label: 'Break', type: 'number', min: 0, suffix: 'min' },
      { key: 'grace', label: 'Grace for late mark', type: 'number', min: 0, suffix: 'min' },
      { key: 'color', label: 'Colour on roster', type: 'select', options: Object.keys(COLORS).map(c => ({ v: c, l: c[0].toUpperCase() + c.slice(1) })) },
      { key: 'active', type: 'switch', label: 'Active', span: 'full' },
    ] }] },
  });

  // ---------------- Leave Policy (merges Company Leave Category + Company Leave) ----------------
  const leaveTypes = () => store('leavetypes', () => [
    { name: 'Casual Leave', code: 'CL', days: 12, paid: true, carry: false, carryMax: 0, maxRun: 3, half: true, doc: false },
    { name: 'Sick Leave', code: 'SL', days: 8, paid: true, carry: false, carryMax: 0, maxRun: 7, half: true, doc: true },
    { name: 'Earned Leave', code: 'EL', days: 15, paid: true, carry: true, carryMax: 30, maxRun: 15, half: false, doc: false },
    { name: 'Emergency Leave', code: 'EML', days: 3, paid: true, carry: false, carryMax: 0, maxRun: 2, half: true, doc: false },
    { name: 'Leave Without Pay', code: 'LWP', days: 0, paid: false, carry: false, carryMax: 0, maxRun: 30, half: true, doc: false },
  ]);
  let FY = '2026-27';
  crud({
    key: 'leavepolicy', group: 'staff', title: 'Leave Policy', entity: 'Leave Type', db: leaveTypes,
    sub: 'Leave types and how many days each employee gets per financial year.',
    info: 'Replaces the separate <b>Company Leave Category</b> and <b>Company Leave</b> pages — the leave type and its yearly allocation are set in one place. The days you allocate here become the balance staff see in <a href="#applyleave">Apply Leave</a>, so a type left at 0 days can never be taken.',
    name: r => `${r.name} (${r.code})`, unique: ['name', 'code'],
    extraBtns: () => `<select class="filter-sel" data-fy title="Financial year">${['2025-26', '2026-27', '2027-28'].map(y => `<option ${y === FY ? 'selected' : ''}>FY ${y}</option>`).join('')}</select>`,
    bindExtra: (el, rerender) => el.querySelector('[data-fy]').addEventListener('change', e => { FY = e.target.value.replace('FY ', ''); toast(`Showing allocation for FY ${FY}`); rerender(); }),
    stats: rows => [
      { label: 'Leave types', value: rows.length, sub: `${rows.filter(r => r.active).length} active` },
      { label: 'Paid days per year', value: rows.filter(r => r.paid && r.active).reduce((s, r) => s + Number(r.days || 0), 0), sub: `per employee · FY ${FY}` },
      { label: 'Carry-forward types', value: rows.filter(r => r.carry).length, sub: 'unused days roll over' },
    ],
    columns: [
      { h: 'Leave Type', render: r => `${esc(r.name)}<span class="rc-code">${esc(r.code)}</span>` },
      { h: 'Days / Year', cls: 'num', render: r => (r.paid && !r.days ? '<span style="color:#b91c1c;font-weight:700">0 — set days</span>' : r.days ? `<b>${r.days}</b>` : '<span class="muted">As needed</span>') },
      { h: 'Type', render: r => chip(r.paid ? 'Paid' : 'Unpaid', r.paid ? 'finished' : 'grey') },
      { h: 'Carry Forward', render: r => (r.carry ? `Up to ${r.carryMax} days` : '<span class="muted">No</span>') },
      { h: 'Rules', render: r => `<span class="chips">${r.half ? chip('Half-day', 'outline') : ''}${r.doc ? chip('Document > 2 days', 'outline') : ''}${chip(`Max ${r.maxRun} in a row`, 'outline')}</span>` },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ paid: true, half: true, days: 0, maxRun: 3 }),
    form: { size: 'md', addTitle: 'Add Leave Type', saveLabel: 'Save Leave Type', sections: [
      { fields: [
        { key: 'name', label: 'Leave Type Name', req: true, placeholder: 'e.g. Casual Leave' },
        { key: 'code', label: 'Short Code', req: true, upper: true, maxlength: 4, placeholder: 'e.g. CL' },
        { key: 'paid', type: 'switch', label: 'Paid leave', desc: 'Unpaid leave is deducted from salary.', span: 'full', rerender: true },
        { key: 'days', label: 'Days per year', type: 'number', min: 0, req: true, suffix: 'days', hint: d => `Allocated to every employee for FY ${FY}.` },
        { key: 'maxRun', label: 'Max consecutive days', type: 'number', min: 1, suffix: 'days' },
      ] },
      { title: 'Rules', fields: [
        { key: 'carry', type: 'switch', label: 'Carry forward unused days', span: 'full', rerender: true },
        { key: 'carryMax', label: 'Max days to carry', type: 'number', min: 0, suffix: 'days', show: d => d.carry },
        { key: 'half', type: 'switch', label: 'Allow half-day', span: 'full' },
        { key: 'doc', type: 'switch', label: 'Document required for more than 2 days', desc: 'e.g. medical certificate', span: 'full' },
        { key: 'active', type: 'switch', label: 'Active', span: 'full' },
      ] },
    ], validate: d => (d.paid && !Number(d.days) ? { days: 'Paid leave needs at least 1 day per year' } : {}) },
  });

  // ---------------- Roster Pattern ----------------
  const patterns = () => store('patterns', () => [
    { name: 'Kitchen 6-on-1-off', dept: 'Kitchen / Food Preparation', cycle: 7, seq: ['M', 'M', 'M', 'E', 'E', 'E', 'OFF'], start: '2026-10-05', emps: ['Rahul Das', 'Arjun Mehta'], isDefault: true },
    { name: 'Floor Rotation', dept: 'Service / Floor', cycle: 7, seq: ['G', 'G', 'E', 'E', 'E', 'OFF', 'G'], start: '2026-10-05', emps: ['Amit Roy', 'Riya Banerjee'] },
    { name: 'Office (Mon–Sat)', dept: 'Management / Administration', cycle: 7, seq: ['G', 'G', 'G', 'G', 'G', 'G', 'OFF'], start: '2026-10-05', emps: ['Uttiyo Ghosh', 'Mohitosh Sen', 'Priya Sharma', 'Vikram Singh'] },
    { name: 'Housekeeping Early', dept: 'Housekeeping', cycle: 7, seq: ['M', 'M', 'M', 'M', 'M', 'OFF', 'M'], start: '2026-10-05', emps: ['Sneha Paul'] },
  ]);
  const seqChip = c => { if (c === 'OFF') return '<span class="shift-chip off" style="display:inline-block;padding:3px 7px;margin:1px">Off</span>'; const s = shiftBy(c); return `<span class="shift-chip" style="${s ? shiftChipStyle(s) : ''};display:inline-block;padding:3px 7px;margin:1px">${esc(c)}</span>`; };
  function seqEditor(d) {
    const n = Number(d.cycle) || 7; d.seq = (d.seq || []).slice(0, n); while (d.seq.length < n) d.seq.push('OFF');
    const start = d.start ? new Date(d.start + 'T00:00:00') : TODAY;
    return `<span class="field-lbl">Shift for each day of the cycle *</span><div class="g-grid c4" style="grid-template-columns:repeat(${Math.min(n, 7)},minmax(0,1fr))">${d.seq.map((c, i) => `<div class="field fixed"><select data-sq="${i}"><option value="OFF" ${c === 'OFF' ? 'selected' : ''}>Week off</option>${shifts().all().filter(s => s.active).map(s => `<option value="${s.code}" ${c === s.code ? 'selected' : ''}>${esc(s.code)} · ${esc(s.name)}</option>`).join('')}</select><label>Day ${i + 1} · ${DOW[addDays(start, i).getDay()]}</label></div>`).join('')}</div><p class="fhint">Preview: ${d.seq.map(seqChip).join('')} then repeats.</p>`;
  }
  crud({
    key: 'rosterpattern', group: 'staff', title: 'Roster Pattern', entity: 'Roster Pattern', db: patterns,
    sub: 'A repeating weekly or custom cycle of shifts. Assign employees once — the Team Roster fills itself.',
    info: 'A pattern repeats one week of <a href="#shift">Shifts</a> and week-offs for a <a href="#department">Department</a>, so <a href="#teamroster">Team Roster</a> fills in automatically instead of being set day by day.',
    name: r => r.name, unique: ['name'],
    warn: () => (shifts().all().length ? '' : 'Create shifts in <a href="#shift">Shift Master</a> first.'),
    filters: [{ key: 'dept', label: 'All Departments', options: () => D.departments().all().map(x => x.name), match: (r, v) => r.dept === v }],
    columns: [
      { h: 'Pattern', render: r => `${esc(r.name)} ${r.isDefault ? chip('Default', 'grey') : ''}<span class="sub-line">${esc(r.dept)}</span>` },
      { h: 'Cycle', render: r => `<span style="white-space:nowrap">${(r.seq || []).map(seqChip).join('')}</span><span class="sub-line">${r.cycle}-day cycle from ${fmtDate(r.start)}</span>` },
      { h: 'Employees', render: r => `<span class="chips">${(r.emps || []).slice(0, 3).map(e => `<span title="${esc(e)}">${ava(e, 26)}</span>`).join('')}${(r.emps || []).length > 3 ? `<span class="muted">+${r.emps.length - 3}</span>` : ''}${!(r.emps || []).length ? chip('None', 'semi') : ''}</span>` },
    ],
    toggle: { field: 'active' },
    rowActions: r => `<a class="icon-btn" href="#teamroster" title="Open in Team Roster">${IC.eye}</a>`,
    defaults: () => ({ cycle: 7, start: ymd(addDays(TODAY, (8 - TODAY.getDay()) % 7 || 7)), seq: [], emps: [] }),
    form: { size: 'lg', addTitle: 'Add Roster Pattern', saveLabel: 'Save Pattern', sections: [
      { title: 'Pattern', fields: [
        { key: 'name', label: 'Pattern Name', req: true, placeholder: 'e.g. Kitchen 6-on-1-off', span: 'span2' },
        { key: 'dept', label: 'Department', req: true, type: 'select', options: () => D.departments().all().filter(x => x.active).map(x => x.name), rerender: true },
        { key: 'cycle', label: 'Cycle Length', type: 'select', req: true, options: [7, 14, 28].map(n => ({ v: n, l: `${n} days` })), rerender: true, onChange: d => { d.cycle = Number(d.cycle); } },
        { key: 'start', label: 'Starts On', type: 'date', req: true, rerender: true, hint: 'Day 1 of the cycle.' },
        { key: 'isDefault', type: 'switch', label: 'Default for new staff in this department' },
      ] },
      { title: 'Shifts', cols: 1, fields: [{ key: '_seq', type: 'custom', render: d => seqEditor(d), bind: (el, d, redraw) => el.querySelectorAll('[data-sq]').forEach(s => s.addEventListener('change', () => { d.seq[Number(s.dataset.sq)] = s.value; redraw(); })) }] },
      { title: 'Employees', cols: 1, fields: [{ key: 'emps', label: 'Assign employees', type: 'pills', options: d => staff().filter(s => !d.dept || s.dept === d.dept).map(s => s.name), hint: d => `Showing staff in ${esc(d.dept || 'all departments')}. An employee can follow one pattern at a time.` }] },
    ], validate: d => (d.seq && d.seq.every(x => x === 'OFF') ? { _seq: 'At least one day must have a shift' } : {}) },
    afterSave: d => { patterns().all().forEach(p => { if (p.id !== d.id) p.emps = (p.emps || []).filter(e => !(d.emps || []).includes(e)); }); patterns().save(); },
  });

  // ---------------- roster computation ----------------
  const overrides = () => store('rosterOverrides', () => [{ k: 'Amit Roy|2026-10-24', v: 'LEAVE' }, { k: 'Arjun Mehta|2026-10-22', v: 'G' }]);
  const leaves = () => store('leaves', () => [
    { emp: 'Amit Roy', type: 'CL', from: '2026-10-24', to: '2026-10-24', days: 1, half: false, reason: 'Family function', status: 'Pending', applied: '2026-10-21' },
    { emp: 'Rahul Das', type: 'SL', from: '2026-10-27', to: '2026-10-29', days: 3, half: false, reason: 'Dental surgery — certificate attached', status: 'Pending', applied: '2026-10-22', doc: true },
    { emp: 'Sneha Paul', type: 'CL', from: '2026-10-30', to: '2026-10-30', days: 0.5, half: true, reason: 'Bank work (first half)', status: 'Pending', applied: '2026-10-23' },
    { emp: 'Uttiyo Ghosh', type: 'CL', from: '2026-10-07', to: '2026-10-07', days: 1, half: false, reason: 'Personal work', status: 'Approved', applied: '2026-10-01', by: 'Mohitosh Sen' },
    { emp: 'Uttiyo Ghosh', type: 'SL', from: '2026-09-15', to: '2026-09-16', days: 2, half: false, reason: 'Fever', status: 'Approved', applied: '2026-09-15', by: 'Mohitosh Sen' },
    { emp: 'Priya Sharma', type: 'EL', from: '2026-11-10', to: '2026-11-14', days: 5, half: false, reason: 'Vacation', status: 'Approved', applied: '2026-10-10', by: 'Uttiyo Ghosh' },
    { emp: 'Vikram Singh', type: 'CL', from: '2026-10-12', to: '2026-10-12', days: 1, half: false, reason: 'Personal', status: 'Rejected', applied: '2026-10-11', by: 'Uttiyo Ghosh', note: 'Stock audit day' },
  ]);
  function cellFor(emp, date) {
    const k = `${emp}|${ymd(date)}`;
    const lv = leaves().find(l => l.emp === emp && l.status === 'Approved' && ymd(date) >= l.from && ymd(date) <= l.to);
    if (lv) return { v: 'LEAVE', src: 'leave', lv };
    const o = overrides().find(x => x.k === k); if (o) return { v: o.v, src: 'manual' };
    const p = patterns().find(x => x.active !== false && (x.emps || []).includes(emp));
    if (!p) return { v: '', src: 'none' };
    const diff = daysBetween(p.start, ymd(date));
    if (diff < 0) return { v: '', src: 'none' };
    return { v: p.seq[diff % p.cycle], src: 'pattern', p };
  }
  const weekStart = d => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return x; };
  function shiftCell(c) {
    if (c.v === 'LEAVE') return '<span class="shift-chip leave">Leave<small>approved</small></span>';
    if (c.v === 'OFF') return '<span class="shift-chip off">Off<small>week off</small></span>';
    if (!c.v) return '<span class="shift-chip empty">+ Assign</span>';
    const s = shiftBy(c.v); if (!s) return `<span class="shift-chip empty">${esc(c.v)}</span>`;
    return `<span class="shift-chip" style="${shiftChipStyle(s)}">${esc(s.name)}${c.src === 'manual' ? ' •' : ''}<small>${t12(s.from)}–${t12(s.to)}</small></span>`;
  }

  // ---------------- Team Roster ----------------
  let rosterWeek = weekStart(TODAY); let rosterLoc = 'all'; let rosterDept = 'all';
  register('teamroster', { group: 'staff', title: 'Team Roster', render: function renderRoster(el) {
    const days = [...Array(7)].map((_, i) => addDays(rosterWeek, i));
    let emps = staff(); if (rosterLoc !== 'all') emps = emps.filter(e => e.loc === rosterLoc); if (rosterDept !== 'all') emps = emps.filter(e => e.dept === rosterDept);
    const cells = emps.flatMap(e => days.map(d => cellFor(e.name, d)));
    const unassigned = cells.filter(c => !c.v).length;
    el.className = 'page view show';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>Team Roster</h1><p class="page-sub">Who works which shift this week. Cells fill from <a href="#rosterpattern" style="color:var(--primary);font-weight:600;text-decoration:none">Roster Patterns</a>; click any cell to change it for that day.</p></div></div>
      <div class="info-strip">${IC.info}<span>Cells fill from <a href="#rosterpattern">Roster Patterns</a> using the times in <a href="#shift">Shift Master</a>, so set those up first. What you publish here is what staff see in <a href="#myroster">My Roster</a>, and it decides whose <a href="#attendance">Attendance</a> is expected each day. Approved leave is locked — change it from <a href="#approveleave">Approve Leave</a>.</span></div>
      <div class="pt-stats"><div class="pt-stat"><span>Staff in view</span><b>${emps.length}</b><small>${rosterLoc === 'all' ? 'all locations' : esc(rosterLoc)}</small></div><div class="pt-stat"><span>Shifts planned</span><b>${cells.filter(c => c.v && !['OFF', 'LEAVE'].includes(c.v)).length}</b><small>this week</small></div><div class="pt-stat"><span>Not assigned</span><b class="${unassigned ? 'warn' : 'good'}">${unassigned}</b><small>${unassigned ? 'cells need a shift' : 'fully planned'}</small></div><div class="pt-stat"><span>On leave</span><b>${cells.filter(c => c.v === 'LEAVE').length}</b><small>person-days</small></div></div>
      <div class="table-card">
        <div class="tbl-tools"><div class="toolbar-left"><div class="week-nav"><button data-wk="-1" title="Previous week">${IC.left}</button><span>${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><button data-wk="1" title="Next week">${IC.right}</button></div><button class="btn-ghost" data-wk="0">This week</button>
        <select class="filter-sel" data-rl><option value="all">All Locations</option>${D.locations().all().map(l => `<option ${rosterLoc === l.name ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
        <select class="filter-sel" data-rd><option value="all">All Departments</option>${D.departments().all().map(x => `<option ${rosterDept === x.name ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div class="tb-right"><button class="btn-ghost" data-copy>${IC.copy} Copy last week</button><button class="btn-primary" data-pub>Publish &amp; notify staff</button></div></div>
        <div class="tbl-wrap" data-wrap><table class="roster"><thead><tr><th class="pin-l">Employee</th>${days.map(d => `<th class="${ymd(d) === ymd(TODAY) ? 'today' : ''}">${DOW[d.getDay()]}<small>${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}</small></th>`).join('')}<th>Hours</th></tr></thead><tbody>
      ${emps.length ? emps.map(e => { let mins = 0; const tds = days.map(d => { const c = cellFor(e.name, d); const s = shiftBy(c.v); if (s) mins += durMin(s.from, s.to) - (s.brk || 0); return `<td data-cell="${esc(e.name)}|${ymd(d)}">${shiftCell(c)}</td>`; }).join(''); return `<tr><td class="pin-l"><span class="who">${ava(e.name)}<span><b>${esc(e.name)}</b><span class="sub-line">${esc(e.role)}</span></span></span></td>${tds}<td style="font-weight:700;white-space:nowrap">${hm(mins)}</td></tr>`; }).join('') : `<tr><td colspan="9" class="empty">No active staff for this filter.</td></tr>`}
      </tbody></table></div>
        <div class="tbl-foot"><div class="legend">${shifts().all().filter(s => s.active).map(s => `<span><i style="${shiftChipStyle(s)};border:1px solid currentColor"></i>${esc(s.name)} ${t12(s.from)}–${t12(s.to)}</span>`).join('')}<span><i style="background:#f3f4f6"></i>Week off</span><span><i style="background:#fdecec"></i>Approved leave</span><span>• = changed manually</span></div></div>
      </div>
      <div class="pop" id="rosterPop"></div>`;
    R.bindPin(el.querySelector('[data-wrap]'));
    el.querySelectorAll('[data-wk]').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.wk); rosterWeek = n === 0 ? weekStart(TODAY) : addDays(rosterWeek, 7 * n); renderRoster(el); }));
    el.querySelector('[data-rl]').addEventListener('change', e => { rosterLoc = e.target.value === 'All Locations' ? 'all' : e.target.value; renderRoster(el); });
    el.querySelector('[data-rd]').addEventListener('change', e => { rosterDept = e.target.value === 'All Departments' ? 'all' : e.target.value; renderRoster(el); });
    el.querySelector('[data-pub]').addEventListener('click', () => toast(`Roster published — ${emps.length} staff notified on app & SMS`));
    el.querySelector('[data-copy]').addEventListener('click', () => toast('Last week’s manual changes copied to this week'));
    const pop = el.querySelector('#rosterPop');
    el.querySelectorAll('[data-cell]').forEach(td => td.addEventListener('click', ev => {
      const [emp, date] = td.dataset.cell.split('|'); const c = cellFor(emp, new Date(date + 'T00:00:00'));
      if (c.v === 'LEAVE') { toast(`${emp} is on approved leave — change it from Approve Leave`, true); return; }
      pop.innerHTML = `<div class="pop-h">${esc(emp)} · ${fmtDate(date)}</div>${shifts().all().filter(s => s.active).map(s => `<a data-set="${s.code}"><span class="dot" style="background:${COLORS[s.color][1]}"></span>${esc(s.name)} <span class="muted" style="margin-left:auto">${t12(s.from)}</span></a>`).join('')}<a data-set="OFF"><span class="dot" style="background:#9ca3af"></span>Week off</a>${c.src === 'manual' ? '<a data-set="__reset"><span class="dot" style="background:#fff;border:1px solid #9ca3af"></span>Reset to pattern</a>' : ''}`;
      const r = td.getBoundingClientRect(); pop.style.left = Math.min(r.left, window.innerWidth - 220) + 'px'; pop.style.top = Math.min(r.bottom + 4, window.innerHeight - 260) + 'px'; pop.classList.add('show');
      pop.querySelectorAll('[data-set]').forEach(a => a.addEventListener('click', () => { const k = `${emp}|${date}`; const db = overrides(); const ex = db.find(x => x.k === k); if (a.dataset.set === '__reset') { if (ex) db.remove(ex.id); } else if (ex) { ex.v = a.dataset.set; db.save(); } else db.upsert({ k, v: a.dataset.set }); pop.classList.remove('show'); toast(`${emp}: ${fmtDate(date)} updated`); renderRoster(el); }));
      ev.stopPropagation();
    }));
    document.addEventListener('click', () => pop.classList.remove('show'), { once: true });
  } });

  // ---------------- My Roster ----------------
  let myWeek = weekStart(TODAY);
  register('myroster', { group: 'staff', title: 'My Roster', render: function renderMy(el) {
    const days = [...Array(7)].map((_, i) => addDays(myWeek, i));
    let mins = 0, offs = 0;
    const cards = days.map(d => { const c = cellFor(ME, d); const s = shiftBy(c.v); if (s) mins += durMin(s.from, s.to) - (s.brk || 0); if (c.v === 'OFF') offs++; return `<div class="wcard ${ymd(d) === ymd(TODAY) ? 'today' : ''}"><div class="wd">${DOW[d.getDay()]}${ymd(d) === ymd(TODAY) ? ' · Today' : ''}</div><div class="dd">${d.getDate()}</div>${s ? `<div class="sh" style="color:${COLORS[s.color][1]}">${esc(s.name)}</div><div class="tm">${t12(s.from)} – ${t12(s.to)}</div><div class="tm">${s.brk} min break</div>` : c.v === 'OFF' ? '<div class="sh" style="color:#6b7280">Week off</div>' : c.v === 'LEAVE' ? '<div class="sh" style="color:#b91c1c">On leave</div>' : '<div class="sh muted">Not rostered</div>'}</div>`; }).join('');
    const p = patterns().find(x => (x.emps || []).includes(ME));
    el.className = 'page view show flow';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>My Roster</h1><p class="page-sub">Your shifts for the week.</p></div></div>
      <div class="info-strip">${IC.info}<span>This is the roster your manager published in <a href="#teamroster">Team Roster</a> — you cannot edit it here. Need a day off? Raise it in <a href="#applyleave">Apply Leave</a>; once approved the day changes to leave here and in <a href="#attendance">Attendance</a>.</span></div>
      <div class="pt-stats s3"><div class="pt-stat"><span>Working hours this week</span><b>${hm(mins)}</b><small>excluding breaks</small></div><div class="pt-stat"><span>Week offs</span><b>${offs}</b><small>this week</small></div><div class="pt-stat"><span>My pattern</span><b style="font-size:16px">${p ? esc(p.name) : '—'}</b><small>${p ? esc(p.dept) : 'not assigned'}</small></div></div>
      <div class="toolbar"><div class="toolbar-left"><div class="week-nav"><button data-wk="-1">${IC.left}</button><span>${days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span><button data-wk="1">${IC.right}</button></div><button class="btn-ghost" data-wk="0">This week</button></div><div class="tb-right"><a class="btn-ghost" href="#applyleave" style="text-decoration:none">Apply leave</a></div></div>
      <div class="week-cards">${cards}</div>`;
    el.querySelectorAll('[data-wk]').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.wk); myWeek = n === 0 ? weekStart(TODAY) : addDays(myWeek, 7 * n); renderMy(el); }));
  } });

  // ---------------- Attendance ----------------
  const ATT = { P: 'Present', L: 'Late', A: 'Absent', LV: 'On leave', WO: 'Week off', H: 'Holiday', U: 'Upcoming' };
  function attFor(emp, d) {
    const key = ymd(d); const c = cellFor(emp, d); const s = shiftBy(c.v);
    if (key > ymd(TODAY)) return { st: 'U' };
    if (key === '2026-10-02') return { st: 'H', note: 'Gandhi Jayanti' };
    if (c.v === 'LEAVE') return { st: 'LV', note: c.lv ? c.lv.type : '' };
    if (c.v === 'OFF' || !s) return { st: 'WO' };
    let h = 0; for (const ch of emp + key) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
    if (key === ymd(TODAY)) { const rec = punches().find(p => p.emp === emp && p.date === key); if (!rec) return { st: emp === ME ? 'U' : (h % 9 === 0 ? 'A' : 'P'), shift: s, in: emp === ME ? '' : addMin(s.from, h % 20), out: '' }; return { st: toMin(rec.in) > toMin(s.from) + s.grace ? 'L' : 'P', shift: s, in: rec.in, out: rec.out || '' }; }
    if (h % 23 === 0) return { st: 'A', shift: s };
    const late = h % 7 === 0 ? 15 + (h % 25) : h % 9;
    const inT = addMin(s.from, late - 5); const outT = addMin(s.to, (h % 30) - 5);
    return { st: late - 5 > s.grace ? 'L' : 'P', shift: s, in: inT, out: outT };
  }
  const addMin = (t, m) => { const x = (toMin(t) + m + 1440) % 1440; return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`; };
  const punches = () => store('punches', () => []);
  let attTab = 'me'; let attMonth = '2026-10';
  register('attendance', { group: 'staff', title: 'Attendance', render: function renderAtt(el) {
    const [yy, mm] = attMonth.split('-').map(Number);
    const nDays = new Date(yy, mm, 0).getDate();
    const days = [...Array(nDays)].map((_, i) => new Date(yy, mm - 1, i + 1));
    const myRows = days.map(d => ({ d, a: attFor(ME, d) }));
    const cnt = k => myRows.filter(r => r.a.st === k).length;
    const todayRec = punches().find(p => p.emp === ME && p.date === ymd(TODAY));
    const todayShift = shiftBy(cellFor(ME, TODAY).v);
    const team = staff().map(e => ({ e, a: attFor(e.name, TODAY) }));
    el.className = 'page view show';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>Attendance</h1><p class="page-sub">Check in and out from here or the mobile app.</p></div>
      <div class="ph-act"><div class="seg"><button class="${attTab === 'me' ? 'active' : ''}" data-tab="me">My Attendance</button><button class="${attTab === 'team' ? 'active' : ''}" data-tab="team">Team Today<span class="n">${team.length}</span></button></div></div></div>
      <div class="info-strip">${IC.info}<span>Which shift you are expected on comes from <a href="#teamroster">Team Roster</a>, and <b>Late</b> is judged against that shift’s grace time in <a href="#shift">Shift Master</a>. Days approved in <a href="#approveleave">Approve Leave</a> show as leave automatically. Future dates are hidden and rows can never be deleted — ask for a correction with <b>Regularise</b>.</span></div>
      ${attTab === 'me' ? `
      <div class="today-card"><div><div class="t-meta">${TODAY.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div><div class="clock">11:24 AM</div><div class="t-meta">Shift: <b>${todayShift ? `${esc(todayShift.name)} · ${t12(todayShift.from)} – ${t12(todayShift.to)}` : 'Not rostered'}</b> · Location: <b>Rashbehari Kitchen</b></div></div>
        <div class="t-meta" style="margin-left:24px">Checked in: <b>${todayRec ? t12(todayRec.in) : '—'}</b><br>Checked out: <b>${todayRec && todayRec.out ? t12(todayRec.out) : '—'}</b></div>
        <div class="t-actions"><button class="btn-primary" data-in ${todayRec ? 'disabled' : ''}>Check In</button><button class="btn-outline" data-out ${!todayRec || todayRec.out ? 'disabled' : ''}>Check Out</button></div></div>
      <div class="pt-stats s5"><div class="pt-stat"><span>Present</span><b class="good">${cnt('P') + cnt('L')}</b><small>days this month</small></div><div class="pt-stat"><span>Late marks</span><b class="warn">${cnt('L')}</b><small>3 late = ½ day</small></div><div class="pt-stat"><span>Absent</span><b class="bad">${cnt('A')}</b><small>unapproved</small></div><div class="pt-stat"><span>Leave</span><b>${cnt('LV')}</b><small>approved</small></div><div class="pt-stat"><span>Week off / Holiday</span><b>${cnt('WO') + cnt('H')}</b><small>&nbsp;</small></div></div>
      <div class="table-card">
        <div class="tbl-tools"><div class="toolbar-left"><input type="month" class="month-pick" data-month value="${attMonth}" max="2026-10"></div><div class="tb-right"><button class="btn-ghost" data-exp>${IC.download} Download</button></div></div>
        <div class="tbl-wrap" data-wrap><table class="g-table pin-2"><thead><tr><th class="pin-l">Actions</th><th class="pin-n">Date</th><th>Shift</th><th>Check In</th><th>Check Out</th><th class="num">Worked</th><th>Status</th></tr></thead><tbody>
      ${myRows.filter(r => ymd(r.d) <= ymd(TODAY)).reverse().map(({ d, a }) => { const w = a.in && a.out ? durMin(a.in, a.out) : 0; return `<tr><td class="pin-l">${['A', 'L'].includes(a.st) ? '<button class="btn-sm ghost" data-reg>Regularise</button>' : '<span class="muted">—</span>'}</td><td class="pin-n strong">${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })}<span class="sub-line">${DOW[d.getDay()]}</span></td><td>${a.shift ? `${esc(a.shift.name)}<span class="sub-line">${t12(a.shift.from)}–${t12(a.shift.to)}</span>` : '<span class="muted">—</span>'}</td><td>${a.in ? t12(a.in) : '<span class="muted">—</span>'}</td><td>${a.out ? t12(a.out) : '<span class="muted">—</span>'}</td><td class="num">${w ? hm(w) : '<span class="muted">—</span>'}</td><td><span class="att-chip ${a.st}">${ATT[a.st]}${a.note ? ' · ' + esc(a.note) : ''}</span></td></tr>`; }).join('')}
      </tbody></table></div>
        <div class="tbl-foot"><span class="pg-info">Future dates are hidden. Rows can’t be deleted — use <b>Regularise</b> to request a correction.</span></div></div>`
      : `
      <div class="pt-stats s5"><div class="pt-stat"><span>Rostered today</span><b>${team.filter(t => !['WO', 'LV', 'H'].includes(t.a.st)).length}</b><small>of ${team.length} staff</small></div><div class="pt-stat"><span>Checked in</span><b class="good">${team.filter(t => ['P', 'L'].includes(t.a.st)).length}</b><small>on time + late</small></div><div class="pt-stat"><span>Late</span><b class="warn">${team.filter(t => t.a.st === 'L').length}</b><small>after grace</small></div><div class="pt-stat"><span>Not checked in</span><b class="bad">${team.filter(t => ['A', 'U'].includes(t.a.st)).length}</b><small>follow up</small></div><div class="pt-stat"><span>On leave / off</span><b>${team.filter(t => ['LV', 'WO'].includes(t.a.st)).length}</b><small>today</small></div></div>
      <div class="table-card">
        <div class="tbl-wrap" data-wrap><table class="g-table pin-2"><thead><tr><th class="pin-l">Actions</th><th class="pin-n">Employee</th><th>Location</th><th>Shift</th><th>Check In</th><th>Status</th></tr></thead><tbody>
      ${team.map(({ e, a }) => `<tr><td class="pin-l">${['A', 'U'].includes(a.st) && a.shift ? '<button class="btn-sm ghost" data-mark>Mark present</button>' : '<span class="muted">—</span>'}</td><td class="pin-n"><span class="who">${ava(e.name)}<span><b>${esc(e.name)}</b><span class="sub-line">${esc(e.role)}</span></span></span></td><td>${esc(e.loc)}</td><td>${a.shift ? `${esc(a.shift.name)}<span class="sub-line">${t12(a.shift.from)}</span>` : '<span class="muted">—</span>'}</td><td>${a.in ? t12(a.in) : '<span class="muted">—</span>'}</td><td><span class="att-chip ${a.st}">${a.st === 'U' ? 'Not checked in' : ATT[a.st]}</span></td></tr>`).join('')}
      </tbody></table></div>
        <div class="tbl-foot"><span class="pg-info">${team.length} staff · ${fmtDate(ymd(TODAY))}</span></div></div>`}`;
    R.bindPin(el.querySelector('[data-wrap]'));
    el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { attTab = b.dataset.tab; renderAtt(el); }));
    const bi = el.querySelector('[data-in]'); if (bi) bi.addEventListener('click', () => { punches().upsert({ emp: ME, date: ymd(TODAY), in: '11:24', out: '' }); toast('Checked in at 11:24 AM'); renderAtt(el); });
    const bo = el.querySelector('[data-out]'); if (bo) bo.addEventListener('click', () => { const r = punches().find(p => p.emp === ME && p.date === ymd(TODAY)); r.out = '19:05'; punches().save(); toast('Checked out at 7:05 PM'); renderAtt(el); });
    const mp = el.querySelector('[data-month]'); if (mp) mp.addEventListener('change', () => { attMonth = mp.value || '2026-10'; renderAtt(el); });
    el.querySelectorAll('[data-reg]').forEach(b => b.addEventListener('click', () => openForm({ title: 'Regularise Attendance', size: '', draft: {}, saveLabel: 'Send Request', form: { sections: [{ cols: 1, fields: [
      { key: 'in', label: 'Correct Check-in', type: 'time', req: true }, { key: 'out', label: 'Correct Check-out', type: 'time' }, { key: 'reason', label: 'Reason', type: 'textarea', req: true, placeholder: 'e.g. Forgot to check in, was at vendor visit' } ] }] }, onSave: () => { toast('Regularisation sent to your manager'); return true; } })));
    el.querySelectorAll('[data-mark]').forEach(b => b.addEventListener('click', () => toast('Marked present — staff will be notified')));
    const ex = el.querySelector('[data-exp]'); if (ex) ex.addEventListener('click', () => toast('Attendance report downloaded'));
  } });

  // ---------------- Apply Leave ----------------
  const ltBy = code => leaveTypes().find(l => l.code === code);
  const used = (emp, code) => leaves().filter(l => l.emp === emp && l.type === code && l.status === 'Approved').reduce((s, l) => s + Number(l.days), 0);
  const pending = (emp, code) => leaves().filter(l => l.emp === emp && l.type === code && l.status === 'Pending').reduce((s, l) => s + Number(l.days), 0);
  const leaveDays = (a, b, half) => { if (!a || !b || b < a) return 0; if (half && a === b) return 0.5; let n = 0; for (let d = new Date(a + 'T00:00:00'); ymd(d) <= b; d = addDays(d, 1)) if (d.getDay() !== 0) n++; return n; };
  const LSTAT = { Pending: 'semi', Approved: 'finished', Rejected: 'red', Cancelled: 'grey' };
  function leaveForm(onDone) {
    openForm({ title: 'Apply for Leave', sub: 'Your manager is notified instantly.', size: 'md', draft: { type: 'CL', from: ymd(addDays(TODAY, 3)), to: ymd(addDays(TODAY, 3)), half: false }, saveLabel: 'Submit Request', form: { sections: [{ fields: [
      { key: 'type', label: 'Leave Type', req: true, type: 'select', span: 'full', rerender: true, options: () => leaveTypes().all().filter(l => l.active).map(l => ({ v: l.code, l: `${l.name} (${l.code})${l.days ? ` — ${Math.max(0, l.days - used(ME, l.code) - pending(ME, l.code))} left` : ''}` })) },
      { key: 'from', label: 'From', type: 'date', req: true, rerender: true, onChange: d => { if (!d.to || d.to < d.from) d.to = d.from; } },
      { key: 'to', label: 'To', type: 'date', req: true, rerender: true },
      { key: 'half', type: 'switch', label: 'Half day', desc: 'Only for a single day.', span: 'full', show: d => d.from === d.to && (ltBy(d.type) || {}).half },
      { key: '_p', type: 'preview', render: d => { const lt = ltBy(d.type) || {}; const n = leaveDays(d.from, d.to, d.half); const left = lt.days ? lt.days - used(ME, d.type) - pending(ME, d.type) : null; const bad = left != null && n > left; return `<div class="preview-box ${bad ? 'bad' : ''}"><b>${n}</b> day${n === 1 ? '' : 's'} (Sundays excluded)${left != null ? ` · balance after approval: <b>${left - n}</b> of ${lt.days}` : ' · unpaid'}${bad ? ' — not enough balance' : ''}${n > (lt.maxRun || 99) ? ` · max ${lt.maxRun} days in a row` : ''}</div>`; } },
      { key: 'reason', label: 'Reason', type: 'textarea', req: true, placeholder: 'Briefly tell your manager why', span: 'full' },
      { key: 'doc', label: 'Attachment', type: 'custom', show: d => (ltBy(d.type) || {}).doc && leaveDays(d.from, d.to) > 2, render: () => '<span class="field-lbl">Medical certificate *</span><div class="img-pick"><button type="button" class="btn-outline">Upload file</button><span class="fhint" style="margin:0">PDF/JPG, required for more than 2 days</span></div>' },
      { key: '_to', type: 'preview', render: () => '<p class="fhint" style="margin:0">Goes to: <b>Mohitosh Sen</b> (HR) · Cc: department head</p>' },
    ] }], validate: d => { const e = {}; if (d.to < d.from) e.to = 'To date must be after From date'; const lt = ltBy(d.type) || {}; const n = leaveDays(d.from, d.to, d.half); if (!n) e.to = 'Selected dates have no working days'; if (lt.days && n > lt.days - used(ME, d.type) - pending(ME, d.type)) e.type = 'Not enough balance for this leave type'; if (n > (lt.maxRun || 99)) e.to = `Max ${lt.maxRun} consecutive days for ${lt.name}`; const clash = leaves().find(l => l.emp === ME && ['Pending', 'Approved'].includes(l.status) && !(d.to < l.from || d.from > l.to)); if (clash) e.from = `Overlaps your ${clash.status.toLowerCase()} leave on ${fmtDate(clash.from)}`; return e; } },
      onSave: d => { leaves().upsert({ emp: ME, type: d.type, from: d.from, to: d.to, half: d.half && d.from === d.to, days: leaveDays(d.from, d.to, d.half), reason: d.reason, status: 'Pending', applied: ymd(TODAY) }); toast('Leave request sent to Mohitosh Sen'); onDone(); return true; } });
  }
  register('applyleave', { group: 'staff', title: 'Apply Leave', render: function renderApply(el) {
    const mine = leaves().filter(l => l.emp === ME).sort((a, b) => b.applied.localeCompare(a.applied));
    el.className = 'page view show';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>Apply Leave</h1><p class="page-sub">Your leave balance for FY ${FY} and your requests.</p></div></div>
      <div class="info-strip">${IC.info}<span>Each balance below is the yearly allocation set in <a href="#leavepolicy">Leave Policy</a> minus what you have used and what is still pending. Requests go to your manager in <a href="#approveleave">Approve Leave</a>; once approved the days show as leave in <a href="#myroster">My Roster</a> and <a href="#attendance">Attendance</a>. Sundays are not counted.</span></div>
      <div class="bal-cards">${leaveTypes().all().filter(l => l.active && l.days).map(l => { const u = used(ME, l.code), p = pending(ME, l.code), left = l.days - u - p; return `<div class="bal"><div class="bt">${esc(l.name)}<span class="chip grey">${esc(l.code)}</span></div><div class="bn">${left}<small> / ${l.days} left</small></div><div class="progress"><i style="width:${Math.round((u + p) / l.days * 100)}%"></i></div><div class="sub-line" style="margin-top:6px">${u} used${p ? ` · ${p} pending` : ''}</div></div>`; }).join('')}</div>
      <div class="table-card">
        <div class="tbl-tools"><div class="toolbar-left"><div class="h3">My requests <span class="cnt">${mine.length}</span></div></div><div class="tb-right"><button class="btn-primary" data-apply>${IC.plus}Apply Leave</button></div></div>
        <div class="tbl-wrap" data-wrap><table class="g-table pin-2"><thead><tr><th class="pin-l">Actions</th><th class="pin-n">Leave</th><th>Dates</th><th class="num">Days</th><th>Reason</th><th>Status</th></tr></thead><tbody>
      ${mine.length ? mine.map(l => `<tr data-id="${l.id}"><td class="pin-l">${l.status === 'Pending' ? '<button class="btn-sm red" data-cancel>Cancel</button>' : '<span class="muted">—</span>'}</td><td class="pin-n strong">${esc((ltBy(l.type) || {}).name || l.type)}<span class="sub-line">Applied ${fmtDate(l.applied)}</span></td><td style="white-space:nowrap">${fmtDate(l.from)}${l.to !== l.from ? ' – ' + fmtDate(l.to) : ''}${l.half ? '<span class="sub-line">Half day</span>' : ''}</td><td class="num">${l.days}</td><td style="font-weight:500">${esc(l.reason)}${l.note ? `<span class="sub-line">Manager: ${esc(l.note)}</span>` : ''}</td><td>${chip(l.status, LSTAT[l.status])}${l.by ? `<span class="sub-line">by ${esc(l.by)}</span>` : ''}</td></tr>`).join('') : '<tr><td colspan="6" class="empty">No leave requests yet.</td></tr>'}
      </tbody></table></div>
        <div class="tbl-foot"><span class="pg-info">${mine.length} request${mine.length === 1 ? '' : 's'}</span></div></div>`;
    R.bindPin(el.querySelector('[data-wrap]'));
    el.querySelector('[data-apply]').addEventListener('click', () => leaveForm(() => renderApply(el)));
    el.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => { const l = leaves().get(b.closest('tr').dataset.id); confirmDelete({ title: 'Cancel leave request', text: `Cancel your ${esc(l.type)} request for <b>${fmtDate(l.from)}</b>?`, yesLabel: 'Cancel request', onYes: () => { l.status = 'Cancelled'; leaves().save(); toast('Leave request cancelled'); renderApply(el); } }); }));
  } });

  // ---------------- Approve Leave ----------------
  let apTab = 'Pending';
  register('approveleave', { group: 'staff', title: 'Approve Leave', badge: () => leaves().filter(l => l.status === 'Pending').length, render: function renderAp(el) {
    const all = leaves().filter(l => l.emp !== ME || apTab !== 'Pending');
    const list = all.filter(l => apTab === 'All' || l.status === apTab).sort((a, b) => a.from.localeCompare(b.from));
    const onToday = leaves().filter(l => l.status === 'Approved' && ymd(TODAY) >= l.from && ymd(TODAY) <= l.to).length;
    el.className = 'page view show';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>Approve Leave</h1><p class="page-sub">Requests from your team.</p></div></div>
      <div class="info-strip">${IC.info}<span>Check the <b>Balance</b> and <b>Team overlap</b> columns before you decide — balance comes from <a href="#leavepolicy">Leave Policy</a> and overlap shows who from the same <a href="#department">Department</a> is already off those days. Approving marks the days as leave in <a href="#teamroster">Team Roster</a> and <a href="#attendance">Attendance</a>; rejecting asks you for a reason the employee will see.</span></div>
      <div class="pt-stats"><div class="pt-stat"><span>Waiting for you</span><b class="warn">${leaves().filter(l => l.status === 'Pending').length}</b><small>oldest first</small></div><div class="pt-stat"><span>Approved this month</span><b class="good">${leaves().filter(l => l.status === 'Approved' && l.from.startsWith('2026-10')).length}</b><small>October 2026</small></div><div class="pt-stat"><span>Rejected</span><b>${leaves().filter(l => l.status === 'Rejected').length}</b><small>with reason</small></div><div class="pt-stat"><span>On leave today</span><b>${onToday}</b><small>${fmtDate(ymd(TODAY))}</small></div></div>
      <div class="table-card">
        <div class="tbl-tools"><div class="toolbar-left"><div class="seg">${['Pending', 'Approved', 'Rejected', 'All'].map(t => `<button class="${apTab === t ? 'active' : ''}" data-t="${t}">${t}<span class="n">${t === 'All' ? leaves().all().length : leaves().filter(l => l.status === t).length}</span></button>`).join('')}</div></div></div>
        <div class="tbl-wrap" data-wrap><table class="g-table pin-2"><thead><tr><th class="pin-l">${apTab === 'Pending' ? 'Decision' : 'Status'}</th><th class="pin-n">Employee</th><th>Leave</th><th>Dates</th><th>Reason</th><th>Balance</th><th>Team overlap</th></tr></thead><tbody>
      ${list.length ? list.map(l => { const lt = ltBy(l.type) || { name: l.type, days: 0 }; const u = D.users().all().find(x => D.fullName(x) === l.emp) || {}; const left = lt.days ? lt.days - used(l.emp, l.type) : '—'; const overlap = leaves().filter(x => x.id !== l.id && x.status === 'Approved' && !(l.to < x.from || l.from > x.to) && (D.users().all().find(y => D.fullName(y) === x.emp) || {}).dept === u.dept).map(x => x.emp); return `<tr data-id="${l.id}"><td class="pin-l">${l.status === 'Pending' ? '<span class="actions" style="gap:4px"><button class="btn-sm green" data-ok>' + IC.check + 'Approve</button><button class="btn-sm red" data-no>' + IC.x + 'Reject</button></span>' : chip(l.status, LSTAT[l.status]) + (l.note ? `<span class="sub-line">${esc(l.note)}</span>` : '')}</td><td class="pin-n"><span class="who">${ava(l.emp)}<span><b>${esc(l.emp)}</b><span class="sub-line">${esc(u.dept || '')}</span></span></span></td><td>${esc(lt.name)}<span class="sub-line">Applied ${fmtDate(l.applied)}</span></td><td style="white-space:nowrap">${fmtDate(l.from)}${l.to !== l.from ? ' – ' + fmtDate(l.to) : ''}<span class="sub-line">${l.days} day${l.days === 1 ? '' : 's'}${l.half ? ' · half' : ''}</span></td><td style="font-weight:500;max-width:220px">${esc(l.reason)}${l.doc ? '<span class="sub-line">📎 certificate attached</span>' : ''}</td><td>${lt.days ? `<b>${left}</b> / ${lt.days}` : '<span class="muted">Unpaid</span>'}</td><td>${overlap.length ? chip(`${overlap.length} off same day`, 'semi') : '<span class="ok-txt">None</span>'}</td></tr>`; }).join('') : `<tr><td colspan="7" class="empty">${apTab === 'Pending' ? 'All caught up — no requests waiting.' : 'Nothing here.'}</td></tr>`}
      </tbody></table></div>
        <div class="tbl-foot"><span class="pg-info">${list.length} request${list.length === 1 ? '' : 's'} · ${esc(apTab)}</span></div></div>`;
    R.bindPin(el.querySelector('[data-wrap]'));
    el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { apTab = b.dataset.t; renderAp(el); }));
    el.querySelectorAll('[data-ok]').forEach(b => b.addEventListener('click', () => { const l = leaves().get(b.closest('tr').dataset.id); l.status = 'Approved'; l.by = ME; leaves().save(); toast(`Approved — ${l.emp} has been notified`); window.RMSNav && window.RMSNav.refreshBadges(); renderAp(el); }));
    el.querySelectorAll('[data-no]').forEach(b => b.addEventListener('click', () => { const l = leaves().get(b.closest('tr').dataset.id); openForm({ title: 'Reject leave', sub: `${l.emp} · ${fmtDate(l.from)}`, draft: {}, saveLabel: 'Reject', form: { sections: [{ cols: 1, fields: [{ key: 'note', label: 'Reason for rejection', req: true, type: 'textarea', placeholder: 'Shared with the employee' }] }] }, onSave: d => { l.status = 'Rejected'; l.by = ME; l.note = d.note; leaves().save(); toast(`Rejected — ${l.emp} has been notified`, true); window.RMSNav && window.RMSNav.refreshBadges(); renderAp(el); return true; } }); }));
  } });

  window.RMSStaff = {
    ME, staff, DOW, COLORS, toMin, durMin, hm, t12,
    shifts, shiftBy, leaveTypes, leaves, patterns, overrides,
    cellFor, attFor, ATT, FY: () => FY,
  };
})();
