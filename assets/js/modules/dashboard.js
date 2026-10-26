// Wize Restaurant RMS — Dashboard
// Read-only overview; every number links back to the module it came from.
(() => {
  const R = window.RMS; const D = window.RMSData; const S = window.RMSStaff; const H = window.RMSHousekeeping;
  const { esc, chip, register, ymd, fmtDate, TODAY, daysBetween, IC } = R;
  const { staff, shifts, leaveTypes, leaves, attFor } = S;
  const { assigns, AST } = H;
  const FY = S.FY();

  // ---------------- Dashboard ----------------
  register('dashboard', { group: 'dashboard', title: 'Dashboard', render: function renderDash(el) {
    const rm = D.rawMaterials().all(); const low = rm.filter(r => r.active && r.stock < r.reorder);
    const team = staff().map(e => attFor(e.name, TODAY)); const rostered = team.filter(a => !['WO', 'LV', 'H'].includes(a.st)).length; const inNow = team.filter(a => ['P', 'L'].includes(a.st)).length;
    const pend = leaves().filter(l => l.status === 'Pending').length;
    const ck = assigns().all(); const ckDone = ck.filter(a => a.st === 'Submitted').length;
    let recipes = 0, channels = 0; try { recipes = JSON.parse(localStorage.getItem('rms_recipes_v4') || '[]').length; channels = JSON.parse(localStorage.getItem('rms_pos_tables_v1') || '[]').length; } catch (e) { /* ignore */ }
    const setup = [
      ['Locations & departments', D.locations().all().length > 0 && D.departments().all().length > 0, `${D.locations().all().length} locations, ${D.departments().all().length} departments`, '#location'],
      ['Roles have permissions', D.roles().all().every(r => r.perms && (r.perms === 'ALL' || Object.keys(r.perms).length || typeof r.perms === 'string')), 'every role can open at least one page', '#roles'],
      ['Tax group active', D.taxes().all().some(t => t.active), 'needed before billing', '#tax'],
      ['Shifts created', shifts().all().length > 0, `${shifts().all().length} shifts`, '#shift'],
      ['Leave days allocated', leaveTypes().all().filter(l => l.paid && l.active).every(l => l.days > 0), `FY ${S.FY()}`, '#leavepolicy'],
      ['Every raw material has a vendor', rm.every(r => r.vendor), `${rm.filter(r => !r.vendor).length} items without vendor`, '#rawmaterial'],
      ['Recipes costed', recipes > 0, `${recipes} recipes`, '#recipe'],
      ['Tables & order channels', channels > 0, `${channels} configured`, '#pos-table-config'],
    ];
    const doneN = setup.filter(s => s[1]).length;
    const bars = rm.slice(0, 8);
    const maxv = Math.max(...bars.map(b => Math.max(b.stock, b.reorder)), 1);
    el.className = 'page view show flow';
    el.innerHTML = `<div class="dash-hello"><div><h1>Good morning, Uttiyo</h1><p>Here’s what needs your attention at <b>Rashbehari Kitchen</b> today — ${TODAY.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.</p></div><div class="tb-right"><a class="btn-ghost" href="#rawmaterial" style="text-decoration:none">${IC.plus} Raw Material</a><a class="btn-primary" href="#approveleave" style="text-decoration:none">Review approvals (${pend})</a></div></div>
      <div class="info-strip">${IC.info}<span>Everything on this page is pulled live from the other modules — stock from <a href="#rawmaterial">Raw Material</a>, people from <a href="#attendance">Attendance</a> and <a href="#approveleave">Approve Leave</a>, tasks from <a href="#ckassign">Checklist Assignment</a>. New to Wize? Work down <b>Setup completeness</b> below: each unfinished item links to the page that fixes it.</span></div>
      <div class="pt-stats s5">
        <a class="pt-stat click" href="#rawmaterial" style="text-decoration:none;color:inherit"><span>Below reorder level</span><b class="bad">${low.length}</b><small>of ${rm.length} items</small></a>
        <a class="pt-stat click" href="#attendance" style="text-decoration:none;color:inherit"><span>Staff checked in</span><b>${inNow} / ${rostered}</b><small>rostered today</small></a>
        <a class="pt-stat click" href="#approveleave" style="text-decoration:none;color:inherit"><span>Leave requests</span><b class="warn">${pend}</b><small>waiting for approval</small></a>
        <a class="pt-stat click" href="#ckassign" style="text-decoration:none;color:inherit"><span>Checklists done</span><b>${ckDone} / ${ck.length}</b><small>${ck.filter(a => a.st === 'Overdue').length} overdue</small></a>
        <a class="pt-stat click" href="#vehicle" style="text-decoration:none;color:inherit"><span>Documents expiring</span><b class="warn">${D.vehicles().all().filter(v => daysBetween(ymd(TODAY), v.insurance) <= 30).length + D.drivers().all().filter(v => daysBetween(ymd(TODAY), v.licExp) <= 30).length}</b><small>vehicle & licence, 30 days</small></a>
      </div>
      <div class="dash-grid"><div>
        <div class="card-box"><div class="cb-head"><h3>Stock vs reorder level</h3><a href="#rawmaterial">All items →</a></div><div class="bars">${bars.map(b => `<div class="bar" title="${esc(b.name)}: ${b.stock} ${b.pu} (reorder ${b.reorder})"><i class="${b.stock < b.reorder ? 'lo' : ''}" style="height:${Math.max(4, Math.round(b.stock / maxv * 120))}px"></i><span>${esc(b.name.split(' ')[0])}</span></div>`).join('')}</div><div class="legend"><span><i style="background:var(--primary)"></i>Healthy</span><span><i style="background:#f59e0b"></i>Below reorder</span></div></div>
        <div class="card-box"><div class="cb-head"><h3>Low stock — order now</h3><a href="#rawmaterial">Raise PO →</a></div><div class="table-card" style="border:0"><table class="g-table" style="min-width:0"><thead><tr><th>Item</th><th class="num">In stock</th><th class="num">Reorder at</th><th>Vendor</th></tr></thead><tbody>${low.map(r => `<tr><td>${esc(r.name)}</td><td class="num" style="color:#b91c1c;font-weight:700">${r.stock} ${esc(r.pu)}</td><td class="num">${r.reorder}</td><td>${r.vendor ? esc(r.vendor) : chip('Map vendor', 'semi')}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">All items are above reorder level.</td></tr>'}</tbody></table></div></div>
      </div><div>
        <div class="card-box"><div class="cb-head"><h3>Setup completeness</h3><span class="chip ${doneN === setup.length ? 'finished' : 'semi'}">${doneN}/${setup.length}</span></div><div class="progress" style="margin-bottom:6px"><i style="width:${Math.round(doneN / setup.length * 100)}%"></i></div>${setup.map(([t, ok, sub, href]) => `<div class="setup-item"><span class="si-ic ${ok ? 'ok' : 'todo'}">${ok ? '✓' : '!'}</span><span>${esc(t)}<small>${esc(sub)}</small></span>${ok ? '' : `<a href="${href}">Fix →</a>`}</div>`).join('')}</div>
        <div class="card-box"><div class="cb-head"><h3>Today’s checklists</h3><a href="#ckassign">All →</a></div><div class="mini-list">${ck.slice(0, 5).map(a => `<div class="ml"><span>${esc(a.form)}<span class="sub-line">${esc(a.to)}</span></span>${chip(a.st, AST[a.st])}</div>`).join('')}</div></div>
      </div></div>`;
  } });

  window.RMSStaff = { leaves, shifts };
})();
