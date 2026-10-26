// Wize Restaurant RMS — Housekeeping
// Checklist Forms (build), Checklist Assignment (schedule) and My Checklist (fill).
// Publishes its two stores so the Dashboard can show today's completion.
(() => {
  const R = window.RMS; const D = window.RMSData; const S = window.RMSStaff;
  const { esc, store, chip, ava, crud, IC, ymd, fmtDate, addDays, TODAY, register, openForm, toast } = R;
  const { ME, staff, t12 } = S;

  // ---------------- Housekeeping: Checklist Forms ----------------
  const QTYPES = { yesno: 'Yes / No', choice: 'Multiple choice', text: 'Short text', number: 'Number', temp: 'Temperature (°C)', photo: 'Photo' };
  const AREAS = ['Kitchen', 'Store / Cold Room', 'Dining Area', 'Washroom', 'Bar', 'Entrance & Exterior'];
  const forms = () => store('ckforms', () => [
    { name: 'Kitchen Opening Checklist', area: 'Kitchen', freq: 'Daily', due: '09:30', desc: 'Before first order is taken.', qs: [{ q: 'Gas lines and burners checked for leaks?', t: 'yesno', r: true }, { q: 'Walk-in chiller temperature', t: 'temp', r: true }, { q: 'Hand-wash station stocked (soap, towels)?', t: 'yesno', r: true }, { q: 'Photo of clean prep counters', t: 'photo', r: false }] },
    { name: 'Washroom Hourly Check', area: 'Washroom', freq: 'Hourly', due: '', desc: 'Every hour during service.', qs: [{ q: 'Floor dry and clean?', t: 'yesno', r: true }, { q: 'Soap & tissue refilled?', t: 'yesno', r: true }, { q: 'Any maintenance issue?', t: 'text', r: false }] },
    { name: 'Cold Room Temperature Log', area: 'Store / Cold Room', freq: 'Twice a day', due: '10:00', desc: 'FSSAI temperature record.', qs: [{ q: 'Chiller temperature', t: 'temp', r: true }, { q: 'Freezer temperature', t: 'temp', r: true }, { q: 'Expired items found?', t: 'yesno', r: true }] },
    { name: 'Dining Closing Checklist', area: 'Dining Area', freq: 'Daily', due: '23:30', desc: 'After last guest leaves.', qs: [{ q: 'All tables wiped and sanitised?', t: 'yesno', r: true }, { q: 'Lights & AC switched off?', t: 'yesno', r: true }], active: false },
  ]);
  function qEditor(d) {
    const qs = d.qs || [];
    return `<div class="q-list">${qs.length ? qs.map((q, i) => `<div class="q-card"><div class="q-top"><span class="q-no">${i + 1}</span><input data-qq="${i}" value="${esc(q.q)}" placeholder="Type the question staff will answer"><select data-qt="${i}">${Object.entries(QTYPES).map(([v, l]) => `<option value="${v}" ${q.t === v ? 'selected' : ''}>${l}</option>`).join('')}</select><label class="q-req"><input type="checkbox" data-qr="${i}" ${q.r ? 'checked' : ''} style="width:auto;height:auto;accent-color:var(--primary)"> Required</label><button type="button" class="icon-btn del" data-qd="${i}" title="Remove">${IC.del}</button></div>${q.t === 'choice' ? `<div class="q-opts">Options (comma separated): <input data-qo="${i}" value="${esc(q.o || '')}" placeholder="e.g. Good, Average, Poor" style="max-width:360px;display:inline-block;height:32px;margin-left:6px"></div>` : q.t === 'temp' ? '<div class="q-opts">Out-of-range answers (above 5 °C) are flagged to the manager.</div>' : q.t === 'photo' ? '<div class="q-opts">Staff take a photo from the app camera.</div>' : ''}</div>`).join('') : '<div class="q-empty">No questions yet. Add the first one below.</div>'}</div><button type="button" class="btn-link" data-qa>${IC.plus} Add question</button>`;
  }
  crud({
    key: 'ckforms', group: 'housekeeping', title: 'Checklist Forms', entity: 'Checklist', db: forms,
    sub: 'Reusable checklists for cleaning, opening/closing and food-safety logs.',
    info: 'A <b>Checklist Form</b> is the list of questions staff answer — opening checks, temperature logs, closing checks. Build the form here first, then decide who fills it and how often in <a href="#ckassign">Checklist Assignment</a>.',
    name: r => r.name, unique: ['name'],
    seg: { options: AREAS.map(a => ({ v: a, l: a })), match: (r, v) => r.area === v },
    columns: [
      { h: 'Checklist', render: r => `${esc(r.name)}<span class="sub-line">${esc(r.desc || '')}</span>` },
      { h: 'Area', render: r => chip(r.area, 'grey') },
      { h: 'Frequency', render: r => `<span style="font-weight:500">${esc(r.freq)}</span>${r.due ? `<span class="sub-line">due by ${t12(r.due)}</span>` : ''}` },
      { h: 'Questions', cls: 'num', render: r => `<b>${(r.qs || []).length}</b><span class="sub-line">${(r.qs || []).filter(q => q.r).length} required</span>` },
      { h: 'Assigned', cls: 'num', render: r => { const n = assigns().all().filter(a => a.form === r.name).length; return n ? `<b>${n}</b>` : '<span class="muted">0</span>'; } },
    ],
    toggle: { field: 'active' },
    defaults: () => ({ area: 'Kitchen', freq: 'Daily', qs: [{ q: '', t: 'yesno', r: true }] }),
    beforeSave: d => { d.qs = (d.qs || []).filter(q => q.q.trim()); },
    form: { size: 'full', addTitle: 'Add Checklist', sub: 'Build the questions staff answer on the app.', saveLabel: 'Save Checklist',
      summary: d => `<div class="sum-head"><h3>Preview</h3><span>as staff see it</span></div><div style="font-weight:700">${esc(d.name || 'Untitled checklist')}</div><div class="sum-sub" style="margin:2px 0 8px">${esc(d.area || '')} · ${esc(d.freq || '')}</div>${(d.qs || []).filter(q => q.q).map((q, i) => `<div class="sum-row"><span>${i + 1}. ${esc(q.q)}${q.r ? ' *' : ''}</span><b style="white-space:nowrap;font-weight:500;color:var(--muted)">${QTYPES[q.t]}</b></div>`).join('') || '<p class="sum-note">Questions appear here.</p>'}`,
      sections: [
        { title: 'Checklist details', fields: [
          { key: 'name', label: 'Checklist Name', req: true, placeholder: 'e.g. Kitchen Opening Checklist', span: 'span2' },
          { key: 'area', label: 'Area', req: true, type: 'select', options: AREAS },
          { key: 'freq', label: 'Frequency', req: true, type: 'select', options: ['Hourly', 'Twice a day', 'Daily', 'Weekly', 'Monthly', 'On demand'] },
          { key: 'due', label: 'Complete by', type: 'time', hint: 'Marked overdue after this time.' },
          { key: 'desc', label: 'Instructions', placeholder: 'Shown at the top of the checklist (optional)' },
        ] },
        { title: 'Questions', desc: 'Pick an answer type for each question. Temperature and photo answers are stored for audits.', aside: d => `${(d.qs || []).length} questions`, cols: 1, fields: [{ key: '_q', type: 'custom', render: d => qEditor(d), bind: (el, d, redraw, refresh) => {
          el.querySelectorAll('[data-qq]').forEach(i => i.addEventListener('input', () => { d.qs[i.dataset.qq].q = i.value; refresh(); }));
          el.querySelectorAll('[data-qo]').forEach(i => i.addEventListener('input', () => { d.qs[i.dataset.qo].o = i.value; }));
          el.querySelectorAll('[data-qt]').forEach(s => s.addEventListener('change', () => { d.qs[s.dataset.qt].t = s.value; redraw(); }));
          el.querySelectorAll('[data-qr]').forEach(c => c.addEventListener('change', () => { d.qs[c.dataset.qr].r = c.checked; refresh(); }));
          el.querySelectorAll('[data-qd]').forEach(b => b.addEventListener('click', () => { d.qs.splice(Number(b.dataset.qd), 1); redraw(); }));
          el.querySelector('[data-qa]').addEventListener('click', () => { d.qs = (d.qs || []).concat({ q: '', t: 'yesno', r: true }); redraw(); const ins = document.querySelectorAll('[data-qq]'); ins[ins.length - 1] && ins[ins.length - 1].focus(); });
        } }] },
        { title: 'Status', cols: 1, fields: [{ key: 'active', type: 'switch', label: 'Active', desc: 'Inactive checklists cannot be assigned.' }] },
      ],
      validate: d => (!(d.qs || []).some(q => q.q && q.q.trim()) ? { _q: 'Add at least one question' } : {}) },
  });

  // ---------------- Checklist Assignment ----------------
  const assigns = () => store('ckassign', () => [
    { form: 'Kitchen Opening Checklist', to: 'Arjun Mehta', loc: 'Rashbehari Kitchen', repeat: 'Daily', start: '2026-10-01', due: '09:30', done: 4, of: 4, st: 'Submitted' },
    { form: 'Washroom Hourly Check', to: 'Sneha Paul', loc: 'Rashbehari Kitchen', repeat: 'Hourly', start: '2026-10-01', due: '', done: 2, of: 3, st: 'In progress' },
    { form: 'Cold Room Temperature Log', to: 'Vikram Singh', loc: 'Rashbehari Avenue Store', repeat: 'Twice a day', start: '2026-10-10', due: '10:00', done: 0, of: 3, st: 'Overdue' },
    { form: 'Kitchen Opening Checklist', to: 'Rahul Das', loc: 'Central Kitchen – Topsia', repeat: 'Daily', start: '2026-10-15', due: '09:30', done: 4, of: 4, st: 'Submitted' },
    { form: 'Cold Room Temperature Log', to: ME, loc: 'Rashbehari Kitchen', repeat: 'Daily', start: '2026-10-20', due: '12:00', done: 0, of: 3, st: 'Pending' },
    { form: 'Washroom Hourly Check', to: ME, loc: 'Rashbehari Kitchen', repeat: 'Hourly', start: '2026-10-20', due: '', done: 1, of: 3, st: 'Draft' },
  ]);
  const AST = { Pending: 'grey', Draft: 'purple', 'In progress': '', Submitted: 'finished', Overdue: 'red' };
  crud({
    key: 'ckassign', group: 'housekeeping', title: 'Checklist Assignment', entity: 'Assignment', db: assigns, export: true,
    sub: 'Who fills which checklist, where and how often. Today’s progress updates live.',
    info: 'Assigns a <a href="#ckforms">Checklist Form</a> to a person at a <a href="#location">Location</a> on a repeat schedule. Whatever you assign here shows up for that person in <a href="#mychecklist">My Checklist</a>.',
    name: r => `${r.form} → ${r.to}`, searchText: r => [r.form, r.to, r.loc].join(' '), searchPh: 'Search by checklist, person or location...',
    stats: rows => [
      { label: 'Due today', value: rows.length, sub: fmtDate(ymd(TODAY)) },
      { label: 'Submitted', value: rows.filter(r => r.st === 'Submitted').length, sub: 'completed', cls: 'good', filter: 'Submitted' },
      { label: 'In progress / Draft', value: rows.filter(r => ['In progress', 'Draft'].includes(r.st)).length, sub: 'started, not submitted', filter: 'prog' },
      { label: 'Overdue', value: rows.filter(r => r.st === 'Overdue').length, sub: 'past due time', cls: 'bad', filter: 'Overdue' },
    ],
    statFilter: (r, f) => (f === 'prog' ? ['In progress', 'Draft'].includes(r.st) : r.st === f),
    filters: [{ key: 'loc', label: 'All Locations', options: () => D.locations().all().map(l => l.name), match: (r, v) => r.loc === v }, { key: 'st', label: 'All Status', options: Object.keys(AST), match: (r, v) => r.st === v }],
    columns: [
      { h: 'Checklist', render: r => `${esc(r.form)}<span class="sub-line">${esc(r.loc)}</span>` },
      { h: 'Assigned To', render: r => `<span class="who">${ava(r.to, 28)}<span style="font-weight:500">${esc(r.to)}</span></span>` },
      { h: 'Schedule', render: r => `<span style="font-weight:500">${esc(r.repeat)}</span><span class="sub-line">from ${fmtDate(r.start)}${r.due ? ' · due ' + t12(r.due) : ''}</span>` },
      { h: 'Today', render: r => `<div class="prog-cell"><div class="progress ${r.done === r.of ? 'green' : ''}" style="width:90px"><i style="width:${Math.round(r.done / r.of * 100)}%"></i></div>${r.done}/${r.of}</div>` },
      { h: 'Status', render: r => chip(r.st, AST[r.st]) },
    ],
    defaults: () => ({ repeat: 'Daily', start: ymd(TODAY), loc: 'Rashbehari Kitchen', st: 'Pending', done: 0 }),
    beforeSave: d => { const f = forms().find(x => x.name === d.form); d.of = f ? f.qs.length : 1; d.due = d.due || (f && f.due) || ''; },
    form: { size: 'md', addTitle: 'Assign Checklist', saveLabel: 'Assign', sections: [{ fields: [
      { key: 'form', label: 'Checklist', req: true, type: 'select', span: 'full', options: () => forms().all().filter(f => f.active).map(f => ({ v: f.name, l: `${f.name} · ${f.qs.length} questions` })), rerender: true, onChange: d => { const f = forms().find(x => x.name === d.form); if (f) { d.repeat = ['Hourly', 'Twice a day', 'Daily', 'Weekly', 'Monthly'].includes(f.freq) ? f.freq : 'One time'; d.due = f.due; } } },
      { key: 'to', label: 'Assign To', req: true, type: 'select', options: () => staff().filter(s => !document.querySelector('[data-f="loc"]') || true).map(s => ({ v: s.name, l: `${s.name} · ${s.role}` })) },
      { key: 'loc', label: 'Location', req: true, type: 'select', options: () => D.locations().all().filter(l => l.active).map(l => l.name) },
      { key: 'repeat', label: 'Repeat', req: true, type: 'select', options: ['One time', 'Hourly', 'Twice a day', 'Daily', 'Weekly', 'Monthly'] },
      { key: 'start', label: 'Start Date', req: true, type: 'date' },
      { key: 'due', label: 'Complete by', type: 'time' },
      { key: 'notes', label: 'Notes for staff', type: 'textarea', span: 'full', placeholder: 'Optional' },
    ] }] },
  });

  // ---------------- My Checklist ----------------
  let myDay = new Date(TODAY);
  register('mychecklist', { group: 'housekeeping', title: 'My Checklist', render: function renderMyCk(el) {
    const mine = assigns().filter(a => a.to === ME);
    const isToday = ymd(myDay) === ymd(TODAY);
    const list = isToday ? mine : mine.map(a => Object.assign({}, a, ymd(myDay) < ymd(TODAY) ? { st: 'Submitted', done: a.of } : { st: 'Pending', done: 0 }));
    const c = k => list.filter(a => a.st === k).length;
    el.className = 'page view show flow';
    el.innerHTML = `<div class="page-head"><div class="ph-txt"><h1>My Checklist</h1><p class="page-sub">Checklists assigned to you.</p></div>
      <div class="ph-act"><div class="week-nav"><button data-d="-1">${IC.left}</button><span>${isToday ? 'Today · ' : ''}${myDay.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span><button data-d="1">${IC.right}</button></div>${isToday ? '' : '<button class="btn-ghost" data-d="0">Today</button>'}</div></div>
      <div class="info-strip">${IC.info}<span>These come from <a href="#ckassign">Checklist Assignment</a> and the questions from <a href="#ckforms">Checklist Forms</a>, so nothing appears here until a manager assigns you one. Fill them on time — overdue ones are flagged to your manager. You can <b>Save Draft</b> and finish later.</span></div>
      <div class="pt-stats"><div class="pt-stat"><span>Total</span><b>${list.length}</b><small>assigned</small></div><div class="pt-stat"><span>Pending</span><b class="warn">${c('Pending') + c('Overdue')}</b><small>not started</small></div><div class="pt-stat"><span>Draft</span><b>${c('Draft') + c('In progress')}</b><small>saved, not submitted</small></div><div class="pt-stat"><span>Submitted</span><b class="good">${c('Submitted')}</b><small>done</small></div></div>
      <div class="ck-cards">${list.length ? list.map(a => { const f = forms().find(x => x.name === a.form) || { qs: [] }; return `<div class="ck-card"><div class="ck-top"><div><b>${esc(a.form)}</b><div class="ck-meta">${esc(a.loc)} · ${esc(a.repeat)}${a.due ? ' · due ' + t12(a.due) : ''}</div></div>${chip(a.st, AST[a.st])}</div><div class="prog-cell"><div class="progress ${a.done === a.of ? 'green' : ''}" style="flex:1"><i style="width:${Math.round(a.done / a.of * 100)}%"></i></div>${a.done}/${a.of} answered</div><div class="ck-foot"><span class="ck-meta">${f.qs.length} questions · ${f.qs.filter(q => q.r).length} required</span>${a.st === 'Submitted' ? '<button class="btn-sm ghost" data-view="' + a.id + '">View</button>' : isToday ? `<button class="btn-sm ghost" data-fill="${a.id}" style="border-color:var(--primary);color:var(--primary)">${a.done ? 'Continue' : 'Start'}</button>` : ''}</div></div>`; }).join('') : '<div class="q-empty">No checklists assigned to you for this day.</div>'}</div>`;
    el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { const n = Number(b.dataset.d); myDay = n === 0 ? new Date(TODAY) : addDays(myDay, n); renderMyCk(el); }));
    el.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => toast('Submitted checklist opened (read-only)')));
    el.querySelectorAll('[data-fill]').forEach(b => b.addEventListener('click', () => {
      const a = assigns().get(b.dataset.fill); const f = forms().find(x => x.name === a.form) || { qs: [] };
      const draft = a.answers ? JSON.parse(JSON.stringify(a.answers)) : {};
      const fields = f.qs.map((q, i) => q.t === 'yesno' ? { key: 'q' + i, label: q.q, req: q.r, type: 'select', options: ['Yes', 'No'], span: 'full' } : q.t === 'choice' ? { key: 'q' + i, label: q.q, req: q.r, type: 'select', options: (q.o || 'Good,Average,Poor').split(',').map(s => s.trim()), span: 'full' } : q.t === 'temp' ? { key: 'q' + i, label: q.q, req: q.r, type: 'number', step: 0.1, suffix: '°C', span: 'full', hint: d => (d['q' + i] !== '' && d['q' + i] != null && Number(d['q' + i]) > 5 ? '<span style="color:#b91c1c;font-weight:600">Above 5 °C — your manager will be alerted.</span>' : 'Safe range: 0 – 5 °C') } : q.t === 'photo' ? { key: 'q' + i, label: q.q, type: 'custom', render: () => `<span class="field-lbl">${esc(q.q)}${q.r ? ' *' : ''}</span><div class="img-pick"><button type="button" class="btn-outline">Take photo</button></div>` } : { key: 'q' + i, label: q.q, req: q.r, type: q.t === 'number' ? 'number' : 'text', span: 'full' });
      openForm({ title: a.form, sub: `${a.loc} · ${fmtDate(ymd(TODAY))}`, size: 'md', draft, saveLabel: 'Submit Checklist', form: { sections: [{ cols: 1, fields }] }, onSave: d => { a.answers = d; a.done = a.of; a.st = 'Submitted'; assigns().save(); toast('Checklist submitted'); renderMyCk(el); return true; } });
      const foot = document.querySelector('#gModal .modal-foot'); const sv = document.createElement('button'); sv.type = 'button'; sv.className = 'btn-outline'; sv.textContent = 'Save Draft';
      sv.addEventListener('click', () => { a.answers = draft; a.done = Object.values(draft).filter(v => v !== '' && v != null).length; a.st = 'Draft'; assigns().save(); R.closeModal(); toast('Draft saved'); renderMyCk(el); });
      foot.insertBefore(sv, foot.querySelector('[data-save]'));
    }));
  } });

  window.RMSHousekeeping = { forms, assigns, AST };
})();
