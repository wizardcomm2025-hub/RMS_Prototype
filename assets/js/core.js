// ===================== RMS prototype core: store, CRUD engine, form engine =====================
window.RMS = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const toast = (m, e) => (window.rmsToast ? window.rmsToast(m, e) : console.log(m));
  const PAGE_SIZE = 10;
  const VERSION = 'rms_v2_';

  const IC = {
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    edit: '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    del: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/></svg>',
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18h.01"/></svg>',
    left: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    eye: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
    cols: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/></svg>',
    filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>',
  };

  // ---------- data store (localStorage with in-memory fallback) ----------
  const DB = {};
  function store(key, seedFn) {
    if (DB[key]) return DB[key];
    let data = null;
    try { const raw = localStorage.getItem(VERSION + key); if (raw) data = JSON.parse(raw); } catch (e) { /* ignore */ }
    if (!Array.isArray(data)) data = seedFn().map(r => Object.assign({ id: uid(), active: true }, r));
    const api = {
      key,
      all: () => data,
      get: id => data.find(r => r.id === id),
      find: fn => data.find(fn),
      filter: fn => data.filter(fn),
      save() { try { localStorage.setItem(VERSION + key, JSON.stringify(data)); } catch (e) { /* ignore */ } },
      upsert(r) {
        if (!r.id) { r.id = uid(); r.createdAt = Date.now(); data.unshift(r); }
        else { const i = data.findIndex(x => x.id === r.id); if (i >= 0) data[i] = r; else data.unshift(r); }
        api.save(); return r;
      },
      remove(id) { data = data.filter(r => r.id !== id); api.save(); },
    };
    api.save();
    DB[key] = api;
    return api;
  }

  // ---------- small helpers ----------
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const AVA = [['#e8f1ff', '#1d4ed8'], ['#e7f8ee', '#15803d'], ['#fff4e5', '#b45309'], ['#f3e8ff', '#7e22ce'], ['#e0f7f5', '#0f766e'], ['#fdecec', '#b91c1c']];
  const ava = (name, size) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; const [bg, fg] = AVA[h % AVA.length]; return `<span class="ava" style="background:${bg};color:${fg}${size ? `;width:${size}px;height:${size}px` : ''}">${esc(initials(name))}</span>`; };
  const status = (on, a = 'Active', b = 'Inactive') => `<span class="status ${on ? '' : 'off'}">${on ? a : b}</span>`;
  const chip = (t, cls = '') => `<span class="chip ${cls}">${esc(t)}</span>`;
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const pad = n => String(n).padStart(2, '0');
  const TODAY = new Date(2026, 9, 23); // prototype "today" (23 Oct 2026)
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fmtDate = s => { if (!s) return '—'; const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const expiry = s => {
    if (!s) return '<span class="muted">—</span>';
    const left = daysBetween(ymd(TODAY), s);
    if (left < 0) return `<span class="expiry bad">${fmtDate(s)}<span class="sub-line" style="color:#b91c1c">Expired ${-left}d ago</span></span>`;
    if (left <= 30) return `<span class="expiry soon">${fmtDate(s)}<span class="sub-line" style="color:#b45309">Expires in ${left}d</span></span>`;
    return `<span class="expiry">${fmtDate(s)}</span>`;
  };
  const opt = (arr) => arr.map(x => (typeof x === 'string' ? { v: x, l: x } : x));

  // ---------- view registry ----------
  const VIEWS = {};
  function register(key, meta) { VIEWS[key] = meta; }

  // ---------- form engine ----------
  function fieldOptions(f, d) { const o = typeof f.options === 'function' ? f.options(d) : f.options || []; return opt(o); }

  function renderField(f, d, errors) {
    if (f.show && !f.show(d)) return '';
    const err = errors && errors[f.key];
    const span = f.span ? ' ' + f.span : '';
    const req = f.req ? ' *' : '';
    const v = d[f.key];
    const dis = f.disabled && f.disabled(d) ? 'disabled' : '';
    const hint = f.hint ? `<div class="fhint">${typeof f.hint === 'function' ? f.hint(d) : f.hint}</div>` : '';
    const em = `<div class="err-msg">${esc(err || '')}</div>`;
    const cls = `field fixed${err ? ' error' : ''}${span}`;
    switch (f.type) {
      case 'select': {
        const o = fieldOptions(f, d);
        return `<div class="${cls}" data-k="${f.key}"><select data-f="${f.key}" ${dis}><option value="">${esc(f.placeholder || 'Select')}</option>${o.map(x => `<option value="${esc(x.v)}" ${String(v) === String(x.v) ? 'selected' : ''}>${esc(x.l)}</option>`).join('')}</select><label>${esc(f.label)}${req}</label>${em}${hint}</div>`;
      }
      case 'textarea':
        return `<div class="${cls}" data-k="${f.key}"><textarea data-f="${f.key}" placeholder="${esc(f.placeholder || '')}" ${dis}>${esc(v || '')}</textarea><label>${esc(f.label)}${req}</label>${em}${hint}</div>`;
      case 'switch':
        return `<div class="switch-row2${span}" data-k="${f.key}"><div><b>${esc(f.label)}</b>${f.desc ? `<small>${f.desc}</small>` : ''}</div><label class="switch"><input type="checkbox" data-f="${f.key}" ${v ? 'checked' : ''} ${dis}><span></span></label></div>`;
      case 'pills': {
        const o = fieldOptions(f, d); const arr = Array.isArray(v) ? v : [];
        return `<div class="${span.trim()}" data-k="${f.key}"><span class="field-lbl">${esc(f.label)}${req}</span><div class="pills">${o.map(x => `<span class="pill ${arr.includes(x.v) ? 'on' : ''}" data-pill="${f.key}" data-v="${esc(x.v)}"><span class="cb ${arr.includes(x.v) ? 'on' : ''}"></span>${esc(x.l)}</span>`).join('') || '<span class="muted">No options yet</span>'}</div>${err ? `<div class="err-msg" style="display:block">${esc(err)}</div>` : ''}${hint}</div>`;
      }
      case 'cards': {
        const o = fieldOptions(f, d);
        return `<div class="full" data-k="${f.key}">${f.label ? `<span class="field-lbl">${esc(f.label)}${req}</span>` : ''}<div class="type-pick" style="grid-template-columns:repeat(${Math.min(o.length, f.cols || 3)},1fr)">${o.map(x => `<label class="${String(v) === String(x.v) ? 'on' : ''}"><input type="radio" name="c_${f.key}" data-f="${f.key}" value="${esc(x.v)}" ${String(v) === String(x.v) ? 'checked' : ''}><span><b>${esc(x.l)}</b><small>${x.d || ''}</small></span></label>`).join('')}</div></div>`;
      }
      case 'preview':
        return `<div class="${span.trim() || 'full'} g-preview" data-prev="${f.key}">${f.render(d)}</div>`;
      case 'custom':
        return `<div class="${span.trim() || 'full'}" data-custom="${f.key}">${f.render(d, errors)}</div>`;
      default: {
        const type = f.type || 'text';
        const ph = f.placeholder || '';
        const val = v == null ? '' : v;
        const extra = `${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''} ${f.maxlength ? `maxlength="${f.maxlength}"` : ''}`;
        const input = `<input type="${type}" data-f="${f.key}" value="${esc(val)}" placeholder="${esc(ph)}" ${extra} ${dis} ${f.upper ? 'style="text-transform:uppercase"' : ''}>`;
        const wrapped = f.suffix ? `<div class="input-suffix">${input}<span>${esc(typeof f.suffix === 'function' ? f.suffix(d) : f.suffix)}</span></div>` : f.prefix ? `<div class="input-prefix${f.prefix.length > 1 ? ' wide' : ''}"><span>${esc(f.prefix)}</span>${input}</div>` : input;
        return `<div class="${cls}" data-k="${f.key}">${wrapped}<label>${esc(f.label)}${req}</label>${em}${hint}</div>`;
      }
    }
  }

  function allFields(form) { return (form.sections || []).flatMap(s => s.fields || []); }

  function validateForm(form, d, ctx) {
    const errors = {};
    for (const f of allFields(form)) {
      if (f.show && !f.show(d)) continue;
      const v = d[f.key];
      const empty = v == null || v === '' || (Array.isArray(v) && !v.length);
      if (f.req && empty) { errors[f.key] = `${f.label} is required`; continue; }
      if (!empty && f.pattern && !f.pattern.test(String(v).trim())) errors[f.key] = f.patternMsg || `Enter a valid ${f.label.toLowerCase()}`;
      if (!empty && f.type === 'number') {
        if (f.min != null && Number(v) < f.min) errors[f.key] = `Must be at least ${f.min}`;
        if (f.max != null && Number(v) > f.max) errors[f.key] = `Must be at most ${f.max}`;
      }
    }
    if (form.validate) Object.assign(errors, form.validate(d, ctx) || {});
    return errors;
  }

  function needList(form, d) {
    return allFields(form).filter(f => f.req && (!f.show || f.show(d)) && (d[f.key] == null || d[f.key] === '' || (Array.isArray(d[f.key]) && !d[f.key].length))).map(f => f);
  }

  // Opens a modal form. opts: {form, draft, title, sub, size, onSave(draft) -> true|errors, saveLabel}
  let modalState = null;
  function ensureModalHosts() {
    if ($('gModal')) return;
    const m = document.createElement('div');
    m.className = 'overlay'; m.id = 'gModal';
    document.body.appendChild(m);
    const dl = document.createElement('div');
    dl.className = 'overlay'; dl.id = 'gDel';
    document.body.appendChild(dl);
    m.addEventListener('mousedown', e => { if (e.target === m && !m.classList.contains('overlay-full')) closeModal(); });
    dl.addEventListener('mousedown', e => { if (e.target === dl) closeDel(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('gDel').classList.contains('show')) closeDel(); else if ($('gModal').classList.contains('show')) closeModal(); } });
  }
  function closeModal() { const m = $('gModal'); m.classList.remove('show', 'overlay-full'); m.innerHTML = ''; modalState = null; }
  function closeDel() { const m = $('gDel'); m.classList.remove('show'); m.innerHTML = ''; }

  function openForm(opts) {
    ensureModalHosts();
    const st = modalState = { opts, draft: opts.draft, errors: {}, tried: false };
    const m = $('gModal');
    const full = opts.size === 'full';
    m.className = 'overlay' + (full ? ' overlay-full' : '');
    const head = `<div class="modal-head"><div><h2>${esc(opts.title)}</h2>${opts.sub ? `<div class="head-sub">${esc(opts.sub)}</div>` : ''}</div><button type="button" data-x title="Close">${IC.close}</button></div>`;
    if (full) {
      m.innerHTML = `<div class="modal modal-full">${head}<div class="rc-body"><div class="gf-inner ${opts.form.summary ? '' : 'nosum'}"><form class="rc-main" autocomplete="off" onsubmit="return false"></form>${opts.form.summary ? '<aside class="sum-card"></aside>' : ''}</div></div><div class="rc-foot"><div class="missing"></div><div class="btns"><button type="button" class="btn-outline" data-x>Cancel</button><button type="button" class="btn-primary" data-save>${esc(opts.saveLabel || 'Save')}</button></div></div></div>`;
    } else {
      m.innerHTML = `<div class="modal g-modal ${opts.size || ''}">${head}<form class="modal-body" autocomplete="off" onsubmit="return false"></form><div class="modal-foot"><span class="pt-need"></span><button type="button" class="btn-outline" data-x>Cancel</button><button type="button" class="btn-primary" data-save>${esc(opts.saveLabel || 'Save')}</button></div></div>`;
    }
    m.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', closeModal));
    m.querySelector('[data-save]').addEventListener('click', () => trySave());
    drawForm();
    m.classList.add('show');
    const first = m.querySelector('form input:not([disabled]), form select, form textarea');
    if (first && !full) setTimeout(() => first.focus(), 30);
  }

  function drawForm() {
    const st = modalState; if (!st) return;
    const { form } = st.opts; const d = st.draft;
    const m = $('gModal'); const host = m.querySelector('form');
    const full = st.opts.size === 'full';
    const scroll = host.scrollTop;
    host.innerHTML = form.sections.filter(s => !s.show || s.show(d)).map((s, i) => {
      const fields = s.fields.map(f => renderField(f, d, st.errors)).join('');
      const grid = `<div class="g-grid ${s.cols ? 'c' + s.cols : ''}">${fields}</div>`;
      if (full) return `<div class="sec card"><div class="sec-head"><span class="step">${i + 1}</span><div><h3>${esc(s.title)}</h3>${s.desc ? `<p>${s.desc}</p>` : ''}</div>${s.aside ? `<span class="sec-aside">${s.aside(d)}</span>` : ''}</div>${grid}</div>`;
      return `<div class="g-sec">${s.title ? `<div class="sec-title">${esc(s.title)}</div>` : ''}${s.desc ? `<p class="fhint" style="margin:-6px 0 12px">${s.desc}</p>` : ''}${grid}</div>`;
    }).join('');
    host.scrollTop = scroll;
    bindForm(host);
    refreshDerived();
  }

  function refreshDerived() {
    const st = modalState; if (!st) return;
    const { form } = st.opts; const d = st.draft; const m = $('gModal');
    m.querySelectorAll('[data-prev]').forEach(el => { const f = allFields(form).find(x => x.key === el.dataset.prev); if (f) el.innerHTML = f.render(d); });
    const sum = m.querySelector('.sum-card'); if (sum && form.summary) sum.innerHTML = form.summary(d);
    const need = needList(form, d);
    const miss = m.querySelector('.missing');
    if (miss) miss.innerHTML = need.length ? `<span class="need-lbl">Still needed (${need.length}):</span>${need.map(f => `<button type="button" class="need" data-go="${f.key}">${esc(f.label)}</button>`).join('')}` : '<span class="ready">✓ All required details are filled</span>';
    const pn = m.querySelector('.pt-need'); if (pn) pn.textContent = need.length ? `${need.length} required field${need.length > 1 ? 's' : ''} left` : '';
    m.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { const el = m.querySelector(`[data-k="${b.dataset.go}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = el.querySelector('input,select,textarea'); i && i.focus(); } }));
    if (st.tried) { st.errors = validateForm(form, d, st.opts.ctx); m.querySelectorAll('[data-k]').forEach(el => { const k = el.dataset.k; el.classList.toggle('error', !!st.errors[k]); const e = el.querySelector('.err-msg'); if (e) e.textContent = st.errors[k] || ''; }); }
  }

  function bindForm(host) {
    const st = modalState; const { form } = st.opts; const d = st.draft;
    const fdef = k => allFields(form).find(x => x.key === k);
    host.querySelectorAll('[data-f]').forEach(el => {
      const k = el.dataset.f; const f = fdef(k);
      const isText = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['checkbox', 'radio'].includes(el.type));
      const handler = () => {
        let val = el.type === 'checkbox' ? el.checked : el.value;
        if (f && f.type === 'number' && val !== '') val = Number(val);
        if (f && f.upper && typeof val === 'string') val = val.toUpperCase();
        d[k] = val;
        if (f && f.onChange) f.onChange(d, val);
        if (isText && !(f && f.rerender)) refreshDerived(); else drawForm();
      };
      el.addEventListener(isText ? 'input' : 'change', handler);
    });
    host.querySelectorAll('[data-pill]').forEach(el => el.addEventListener('click', () => {
      const k = el.dataset.pill; const v = el.dataset.v; const f = fdef(k);
      let arr = Array.isArray(d[k]) ? d[k].slice() : [];
      if (f && f.single) arr = [v]; else arr = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v);
      d[k] = arr; if (f && f.onChange) f.onChange(d, arr); drawForm();
    }));
    host.querySelectorAll('[data-custom]').forEach(el => { const f = fdef(el.dataset.custom); if (f && f.bind) f.bind(el, d, drawForm, refreshDerived); });
  }

  function trySave() {
    const st = modalState; if (!st) return;
    st.tried = true;
    st.errors = validateForm(st.opts.form, st.draft, st.opts.ctx);
    if (Object.keys(st.errors).length) {
      drawForm();
      const firstK = Object.keys(st.errors)[0];
      const el = $('gModal').querySelector(`[data-k="${firstK}"]`) || $('gModal').querySelector('.error');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(Object.values(st.errors)[0], true);
      return;
    }
    const res = st.opts.onSave(st.draft);
    if (res === false) return;
    closeModal();
  }

  function confirmDelete({ title, text, warn, onYes, yesLabel }) {
    ensureModalHosts();
    const m = $('gDel');
    m.innerHTML = `<div class="modal"><div class="modal-head"><h2>${esc(title)}</h2><button type="button" data-x>${IC.close}</button></div><div class="modal-body"><p class="confirm-text">${text}${warn ? `<span class="warn">${warn}</span>` : ''}</p></div><div class="modal-foot"><button type="button" class="btn-outline" data-x>Cancel</button><button type="button" class="btn-danger" data-yes>${esc(yesLabel || 'Delete')}</button></div></div>`;
    m.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', closeDel));
    m.querySelector('[data-yes]').addEventListener('click', () => { closeDel(); onYes(); });
    m.classList.add('show');
  }

  function blocked(title, text) {
    ensureModalHosts();
    const m = $('gDel');
    m.innerHTML = `<div class="modal"><div class="modal-head"><h2>${esc(title)}</h2><button type="button" data-x>${IC.close}</button></div><div class="modal-body"><p class="confirm-text">${text}</p></div><div class="modal-foot"><button type="button" class="btn-primary" data-x>Got it</button></div></div>`;
    m.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', closeDel));
    m.classList.add('show');
  }

  // ---------- pagination (shared chrome, see window.RMSUI) ----------
  const UI = window.RMSUI;
  const { PAGE_SIZES, bindPin, sizePicker } = UI;
  const pager = (host, info, total, page, onGo, size = PAGE_SIZE) => UI.pager(host, info, total, page, onGo, size);

  // ---------- generic CRUD page ----------
  function crud(cfg) {
    const state = {
      q: '', seg: cfg.seg ? cfg.seg.def || 'all' : 'all', filters: {}, page: 1, stat: null,
      size: PAGE_SIZE, hidden: new Set(), sel: new Set(),
    };
    const db = () => cfg.db();
    const label = cfg.entity || cfg.title;
    const bulkable = !cfg.noDelete || cfg.toggle;
    const shown = () => cfg.columns.filter((c, i) => !state.hidden.has(i));

    function rowsFiltered() {
      let rows = db().all().slice();
      if (cfg.sort) rows.sort(cfg.sort);
      if (cfg.seg && state.seg !== 'all') rows = rows.filter(r => cfg.seg.match(r, state.seg));
      (cfg.filters || []).forEach(f => { const v = state.filters[f.key]; if (v && v !== 'all') rows = rows.filter(r => f.match(r, v)); });
      if (state.stat && cfg.statFilter) rows = rows.filter(r => cfg.statFilter(r, state.stat));
      const q = state.q.trim().toLowerCase();
      if (q) rows = rows.filter(r => (cfg.searchText ? cfg.searchText(r) : (cfg.searchKeys || ['name']).map(k => r[k]).join(' ')).toLowerCase().includes(q));
      return rows;
    }

    function render(el) {
      const rows = db().all();
      const stats = cfg.stats ? cfg.stats(rows) : null;
      const warn = cfg.warn ? cfg.warn(rows) : '';
      el.className = 'page view show';
      el.innerHTML = `
        <div class="page-head">
          <div class="ph-txt">
            <h1>${esc(cfg.title)}</h1>
            ${cfg.sub ? `<p class="page-sub">${cfg.sub}</p>` : ''}
          </div>
        </div>
        ${cfg.info ? `<div class="info-strip">${IC.info}<span>${cfg.info}</span></div>` : ''}
        ${warn ? `<div class="info-strip warn-strip">${IC.warn}<span>${warn}</span></div>` : ''}
        ${stats ? `<div class="pt-stats ${stats.length === 3 ? 's3' : stats.length === 5 ? 's5' : ''}">${stats.map(s => `<div class="pt-stat ${s.filter ? 'click' : ''} ${state.stat && s.filter === state.stat ? 'on' : ''}" ${s.filter ? `data-stat="${s.filter}"` : ''}><span>${esc(s.label)}</span><b class="${s.cls || ''}">${s.value}</b><small>${s.sub || ''}</small></div>`).join('')}</div>` : ''}
        <div class="table-card">
          <div class="tbl-tools">
            <div class="toolbar-left">
              <div class="search">${IC.search}<input type="text" data-q placeholder="${esc(cfg.searchPh || 'Search ' + label.toLowerCase() + '…')}" value="${esc(state.q)}"></div>
              ${cfg.seg ? `<div class="seg" data-seg>${[{ v: 'all', l: 'All' }].concat(opt(typeof cfg.seg.options === 'function' ? cfg.seg.options() : cfg.seg.options)).map(o => `<button type="button" class="${state.seg === o.v ? 'active' : ''}" data-sv="${esc(o.v)}">${esc(o.l)}<span class="n">${o.v === 'all' ? rows.length : rows.filter(r => cfg.seg.match(r, o.v)).length}</span></button>`).join('')}</div>` : ''}
              ${(cfg.filters || []).map(f => `<select class="filter-sel" data-flt="${f.key}"><option value="all">${esc(f.label)}</option>${opt(typeof f.options === 'function' ? f.options() : f.options).map(o => `<option value="${esc(o.v)}" ${state.filters[f.key] === o.v ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`).join('')}
              ${cfg.extraBtns ? cfg.extraBtns() : ''}
            </div>
            <div class="tb-right">
              <button class="btn-ghost icon-only" data-refresh title="Refresh list">${IC.refresh}</button>
              <div class="col-menu" data-colmenu>
                <button class="btn-ghost icon-only" data-coltoggle title="Choose columns" aria-haspopup="true">${IC.cols}</button>
                <div class="col-pop">
                  <div class="cp-h">Visible columns</div>
                  ${cfg.columns.map((c, i) => `<label><input type="checkbox" data-col="${i}" ${state.hidden.has(i) ? '' : 'checked'}>${esc(c.h)}</label>`).join('')}
                </div>
              </div>
              ${cfg.export ? `<button class="btn-ghost" data-export title="Download the filtered rows as CSV">${IC.download} Export</button>` : ''}
              ${cfg.noAdd ? '' : `<span class="tb-sep"></span><button class="btn-primary" data-add>${IC.plus}<span>${esc(cfg.addLabel || 'Add ' + label)}</span></button>`}
            </div>
          </div>
          <div class="bulk-bar" data-bulk hidden></div>
          <div class="tbl-wrap" data-wrap><table class="g-table pin-2 ${cfg.tableCls || ''} ${bulkable ? 'has-sel' : ''}"><thead data-head></thead><tbody data-body></tbody></table></div>
          <div class="tbl-foot"><span class="pg-info" data-pi></span>${sizePicker(state.size)}<div class="pagination" data-pg></div></div>
        </div>
        ${cfg.footer ? cfg.footer() : ''}`;
      el.querySelector('[data-q]').addEventListener('input', e => { state.q = e.target.value; state.page = 1; state.sel.clear(); drawTable(el); });
      el.querySelectorAll('[data-flt]').forEach(s => s.addEventListener('change', () => { state.filters[s.dataset.flt] = s.value; state.page = 1; state.sel.clear(); drawTable(el); }));
      el.querySelectorAll('[data-sv]').forEach(b => b.addEventListener('click', () => { state.seg = b.dataset.sv; state.page = 1; state.sel.clear(); render(el); }));
      el.querySelectorAll('[data-stat]').forEach(b => b.addEventListener('click', () => { state.stat = state.stat === b.dataset.stat ? null : b.dataset.stat; state.page = 1; state.sel.clear(); render(el); }));
      el.querySelector('[data-ps]').addEventListener('change', e => { state.size = Number(e.target.value); state.page = 1; drawTable(el); });
      el.querySelector('[data-refresh]').addEventListener('click', () => { state.sel.clear(); render(el); toast(`${cfg.title} refreshed`); });
      const cm = el.querySelector('[data-colmenu]');
      cm.querySelector('[data-coltoggle]').addEventListener('click', e => { e.stopPropagation(); cm.classList.toggle('open'); });
      cm.querySelectorAll('[data-col]').forEach(cb => cb.addEventListener('change', () => {
        const i = Number(cb.dataset.col);
        if (cb.checked) state.hidden.delete(i);
        else if (cfg.columns.length - state.hidden.size <= 1) { cb.checked = true; toast('Keep at least one column visible', true); return; }
        else state.hidden.add(i);
        drawTable(el);
      }));
      document.addEventListener('click', () => cm.classList.remove('open'));
      const add = el.querySelector('[data-add]'); if (add) add.addEventListener('click', () => edit(null, el));
      const ex = el.querySelector('[data-export]'); if (ex) ex.addEventListener('click', () => exportCsv());
      if (cfg.bindExtra) cfg.bindExtra(el, () => render(el));
      drawTable(el);
    }

    // Row actions live in a pinned left rail so they stay reachable on wide tables.
    function actionCell(r) {
      return `<span class="actions">${cfg.noEdit ? '' : `<button class="icon-btn" data-ed title="Edit" aria-label="Edit ${esc(cfg.name(r))}">${IC.edit}</button>`}${cfg.rowActions ? cfg.rowActions(r) : ''}${cfg.noDelete ? '' : `<button class="icon-btn del" data-dl title="Delete" aria-label="Delete ${esc(cfg.name(r))}">${IC.del}</button>`}</span>`;
    }

    function drawTable(el) {
      const rows = rowsFiltered();
      const body = el.querySelector('[data-body]');
      const cols = shown();
      const colspan = cols.length + (cfg.toggle ? 2 : 1) + (bulkable ? 1 : 0);
      const pages = Math.max(1, Math.ceil(rows.length / state.size));
      const start = (Math.min(state.page, pages) - 1) * state.size;
      const slice = rows.slice(start, start + state.size);
      const ids = slice.map(r => r.id);
      const allSel = ids.length && ids.every(id => state.sel.has(id));

      el.querySelector('[data-head]').innerHTML = `<tr>
        ${bulkable ? `<th class="pin-sel"><input type="checkbox" class="rcb" data-all ${allSel ? 'checked' : ''} title="Select all rows on this page"></th>` : ''}
        <th class="pin-l">Actions</th>
        ${cols.map((c, i) => `<th class="${c.cls || ''} ${i === 0 ? 'pin-n' : ''}">${esc(c.h)}</th>`).join('')}
        ${cfg.toggle ? `<th class="c-center">${esc(cfg.toggle.h || 'Status')}</th>` : ''}
      </tr>`;

      body.innerHTML = slice.length ? slice.map(r => `<tr data-id="${r.id}" class="${state.sel.has(r.id) ? 'sel' : ''}">
        ${bulkable ? `<td class="pin-sel"><input type="checkbox" class="rcb" data-pick ${state.sel.has(r.id) ? 'checked' : ''} aria-label="Select ${esc(cfg.name(r))}"></td>` : ''}
        <td class="pin-l">${actionCell(r)}</td>
        ${cols.map((c, i) => `<td class="${c.cls || ''} ${i === 0 ? 'pin-n strong' : ''}">${c.render(r)}</td>`).join('')}
        ${cfg.toggle ? `<td class="c-center"><label class="switch" title="${r[cfg.toggle.field] ? 'Active — click to deactivate' : 'Inactive — click to activate'}"><input type="checkbox" data-tg ${r[cfg.toggle.field] ? 'checked' : ''}><span></span></label></td>` : ''}
      </tr>`).join('')
        : `<tr><td colspan="${colspan}" class="empty">${state.q || Object.values(state.filters).some(v => v && v !== 'all') || state.seg !== 'all' || state.stat ? `No ${label.toLowerCase()} match your filters.` : (cfg.empty || `No ${label.toLowerCase()} added yet. Click “${cfg.addLabel || 'Add ' + label}” to create the first one.`)}</td></tr>`;

      state.page = pager(el.querySelector('[data-pg]'), el.querySelector('[data-pi]'), rows.length, state.page, p => { state.page = p; drawTable(el); }, state.size);
      bindPin(el.querySelector('[data-wrap]'));
      drawBulk(el);

      const all = el.querySelector('[data-all]');
      if (all) all.addEventListener('change', () => { ids.forEach(id => all.checked ? state.sel.add(id) : state.sel.delete(id)); drawTable(el); });

      body.querySelectorAll('tr[data-id]').forEach(tr => {
        const r = db().get(tr.dataset.id);
        const pk = tr.querySelector('[data-pick]'); if (pk) pk.addEventListener('change', () => { pk.checked ? state.sel.add(r.id) : state.sel.delete(r.id); drawTable(el); });
        const ed = tr.querySelector('[data-ed]'); if (ed) ed.addEventListener('click', () => edit(r, el));
        const dl = tr.querySelector('[data-dl]'); if (dl) dl.addEventListener('click', () => del(r, el));
        const tg = tr.querySelector('[data-tg]'); if (tg) tg.addEventListener('change', () => {
          const why = !tg.checked && cfg.toggle.block && cfg.toggle.block(r);
          if (why) { tg.checked = true; blocked(`Can't deactivate “${cfg.name(r)}”`, why); return; }
          r[cfg.toggle.field] = tg.checked; db().upsert(r); toast(`“${cfg.name(r)}” ${tg.checked ? 'activated' : 'deactivated'}`); render(el);
        });
        if (cfg.bindRow) cfg.bindRow(tr, r, () => render(el));
      });
    }

    // ---------- bulk actions on the current selection ----------
    function drawBulk(el) {
      const bar = el.querySelector('[data-bulk]');
      if (!bulkable) return;
      const live = [...state.sel].filter(id => db().get(id));
      state.sel = new Set(live);
      if (!live.length) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.hidden = false;
      bar.innerHTML = `<b>${live.length}</b> selected
        <div class="bb-act">
          ${cfg.toggle ? `<button class="btn-sm ghost" data-ba="on">Activate</button><button class="btn-sm ghost" data-ba="off">Deactivate</button>` : ''}
          ${cfg.noDelete ? '' : `<button class="btn-sm red" data-ba="del">Delete</button>`}
          <button class="btn-sm ghost" data-ba="clear">Clear</button>
        </div>`;
      bar.querySelectorAll('[data-ba]').forEach(b => b.addEventListener('click', () => bulk(b.dataset.ba, live, el)));
    }

    function bulk(act, ids, el) {
      if (act === 'clear') { state.sel.clear(); return drawTable(el); }
      const recs = ids.map(id => db().get(id)).filter(Boolean);
      if (act === 'del') {
        const blockedRecs = recs.filter(r => cfg.deleteBlock && cfg.deleteBlock(r));
        const okRecs = recs.filter(r => !blockedRecs.includes(r));
        if (!okRecs.length) return blocked(`Can't delete the selected ${label.toLowerCase()}`, cfg.deleteBlock(recs[0]));
        return confirmDelete({
          title: `Delete ${okRecs.length} ${label.toLowerCase()}${okRecs.length > 1 ? 's' : ''}`,
          text: `Are you sure you want to delete <b>${okRecs.length}</b> selected record${okRecs.length > 1 ? 's' : ''}?`,
          warn: blockedRecs.length
            ? `${blockedRecs.length} of the selected records are in use and will be skipped. This cannot be undone.`
            : 'This cannot be undone. Tip: deactivate them instead if you may need them later.',
          onYes: () => { okRecs.forEach(r => db().remove(r.id)); state.sel.clear(); toast(`${okRecs.length} ${label.toLowerCase()} deleted`, true); render(el); },
        });
      }
      const on = act === 'on';
      let done = 0, skipped = 0;
      recs.forEach(r => {
        if (!on && cfg.toggle.block && cfg.toggle.block(r)) { skipped++; return; }
        r[cfg.toggle.field] = on; db().upsert(r); done++;
      });
      state.sel.clear();
      toast(`${done} ${label.toLowerCase()} ${on ? 'activated' : 'deactivated'}${skipped ? ` · ${skipped} skipped (in use)` : ''}`, !!skipped);
      render(el);
    }

    function edit(r, el) {
      const draft = r ? JSON.parse(JSON.stringify(r)) : Object.assign({ active: true }, cfg.defaults ? cfg.defaults() : {});
      const form = typeof cfg.form === 'function' ? cfg.form(draft) : cfg.form;
      openForm({
        form, draft, size: form.size, ctx: { editing: r, rows: db().all() },
        title: r ? (form.editTitle || `Edit ${label}`) : (form.addTitle || `Add ${label}`),
        sub: r ? cfg.name(r) : form.sub,
        saveLabel: r ? (form.updateLabel || 'Update') : (form.saveLabel || `Save ${label}`),
        onSave: d => {
          if (cfg.unique) for (const u of cfg.unique) {
            const val = String(d[u] || '').trim().toLowerCase();
            const dup = db().all().find(x => x.id !== d.id && String(x[u] || '').trim().toLowerCase() === val);
            if (dup) { modalState.errors[u] = `“${d[u]}” already exists`; drawFormErr(u, `“${d[u]}” already exists — duplicates are not allowed`); toast(`${label} “${d[u]}” already exists`, true); return false; }
          }
          if (cfg.beforeSave) cfg.beforeSave(d);
          db().upsert(d);
          toast(r ? `“${cfg.name(d)}” updated` : `“${cfg.name(d)}” added`);
          if (cfg.afterSave) cfg.afterSave(d);
          render(el);
          return true;
        },
      });
    }
    function drawFormErr(k, msg) {
      const el = $('gModal').querySelector(`[data-k="${k}"]`);
      if (el) { el.classList.add('error'); const e = el.querySelector('.err-msg'); if (e) e.textContent = msg; el.scrollIntoView({ block: 'center' }); }
    }

    function del(r, el) {
      const why = cfg.deleteBlock && cfg.deleteBlock(r);
      if (why) return blocked(`Can't delete “${cfg.name(r)}”`, why);
      confirmDelete({
        title: `Delete ${label}`,
        text: `Are you sure you want to delete <b>${esc(cfg.name(r))}</b>?`,
        warn: cfg.deleteWarn ? cfg.deleteWarn(r) : 'This cannot be undone. Tip: switch it to Inactive instead if you may need it later.',
        onYes: () => { db().remove(r.id); toast(`“${cfg.name(r)}” deleted`, true); render(el); },
      });
    }

    function exportCsv() {
      const rows = rowsFiltered();
      const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const lines = [cfg.columns.map(c => c.h).concat(cfg.toggle ? ['Status'] : [])].concat(rows.map(r => cfg.columns.map(c => strip(c.render(r))).concat(cfg.toggle ? [r[cfg.toggle.field] ? 'Active' : 'Inactive'] : [])));
      const csv = lines.map(l => l.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = cfg.key + '.csv'; a.click(); toast(`Exported ${rows.length} rows`); } catch (e) { toast('Export not available here', true); }
    }

    register(cfg.key, { group: cfg.group, title: cfg.menuTitle || cfg.title, render, badge: cfg.badge });
    return { render, edit };
  }

  return { $, esc, uid, toast, IC, store, initials, ava, status, chip, money, pad, TODAY, ymd, fmtDate, daysBetween, addDays, expiry, opt, VIEWS, register, crud, openForm, closeModal, confirmDelete, blocked, pager, bindPin, sizePicker, PAGE_SIZES, PAGE_SIZE, drawForm: () => drawForm(), refresh: () => refreshDerived() };
})();
