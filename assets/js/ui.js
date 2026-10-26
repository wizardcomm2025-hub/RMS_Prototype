// ===================== Shared list-view chrome (one implementation for every page) =====================
// Pager, page-size picker, pinned-column scroll shadow and CSV export, used by the four
// hand-built pages below and by the generic crud() engine further down.
window.RMSUI = (() => {
  const PAGE_SIZES = [10, 25, 50, 100];
  const ICL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>';
  const ICR = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>';
  const ICREFRESH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>';
  const ICDOWN = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

  // Windowed page buttons so the footer bar keeps a fixed height on any dataset.
  function pageButtons(p, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const out = [1];
    const from = Math.max(2, p - 1), to = Math.min(pages - 1, p + 1);
    if (from > 2) out.push('…');
    for (let i = from; i <= to; i++) out.push(i);
    if (to < pages - 1) out.push('…');
    out.push(pages);
    return out;
  }

  function pager(host, info, total, page, onGo, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    const p = Math.min(page, pages);
    let html = `<button class="pg-btn" data-p="${p - 1}" ${p <= 1 ? 'disabled' : ''} title="Previous page">${ICL}</button>`;
    html += pageButtons(p, pages).map(i => i === '…'
      ? '<span class="pg-btn" style="pointer-events:none;opacity:.5">…</span>'
      : `<button class="pg-btn ${i === p ? 'active' : ''}" data-p="${i}">${i}</button>`).join('');
    html += `<button class="pg-btn" data-p="${p + 1}" ${p >= pages ? 'disabled' : ''} title="Next page">${ICR}</button>`;
    host.innerHTML = pages > 1 ? html : '';
    if (info) info.textContent = total ? `${(p - 1) * size + 1}–${Math.min(p * size, total)} of ${total}` : 'No records';
    host.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => onGo(Number(b.dataset.p))));
    return p;
  }

  const sizePicker = size =>
    `<span class="pg-size">Rows <select data-ps>${PAGE_SIZES.map(n => `<option ${n === size ? 'selected' : ''}>${n}</option>`).join('')}</select></span>`;

  // Keeps the pinned rail honest: measures where the name column has to start and shows
  // the divider shadow only once the table is actually scrolled sideways. Safe to call
  // after every redraw — the listeners are attached once.
  function bindPin(wrap) {
    if (!wrap) return;
    const measure = () => {
      const w = sel => { const c = wrap.querySelector('tbody ' + sel) || wrap.querySelector('thead ' + sel); return c ? c.offsetWidth : 0; };
      const selW = w('.pin-sel'), actW = w('.pin-l');
      wrap.style.setProperty('--sel-w', selW + 'px');
      wrap.style.setProperty('--pin-w', (selW + actW) + 'px');
      wrap.classList.toggle('x-scrolled', wrap.scrollLeft > 0);
    };
    if (!wrap._pin) {
      wrap._pin = true;
      wrap.addEventListener('scroll', measure, { passive: true });
      if (window.ResizeObserver) new ResizeObserver(measure).observe(wrap);
    }
    measure();
  }

  // Mounts footer controls (count + rows-per-page + pager) into a static page's .tbl-foot.
  function mountSize(hostId, size, onChange) {
    const host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = sizePicker(size);
    host.querySelector('[data-ps]').addEventListener('change', e => onChange(Number(e.target.value)));
  }

  function csv(name, header, rows) {
    const q = x => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`;
    const body = [header].concat(rows).map(l => l.map(q).join(',')).join('\n');
    try {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
      a.download = name + '.csv';
      a.click();
      return rows.length;
    } catch (e) { return -1; }
  }
  const strip = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  return { PAGE_SIZES, pager, pageButtons, sizePicker, bindPin, mountSize, csv, strip, ICREFRESH, ICDOWN };
})();
