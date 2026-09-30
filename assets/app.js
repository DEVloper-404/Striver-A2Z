/* A2Z DSA Sheet — local clone app logic (vanilla JS, no build step) */
(function () {
  const DATA = window.SHEET_DATA;
  const SOL = window.SOLUTIONS || {};
  const LS_KEY = 'a2z_clone_state_v1';

  // ---------- state ----------
  const defaultState = () => ({ solved: {}, revision: {}, notes: {}, open: {}, openSub: {}, solvedAt: {}, theme: 'dark' });
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (s && typeof s === 'object') return Object.assign(defaultState(), s); } catch (e) {}
    return defaultState();
  }
  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }

  // flat index
  const ALL = [];
  DATA.steps.forEach(st => st.substeps.forEach(ss => ss.problems.forEach(p => {
    p.step = st; p.substep = ss; p.idx = ALL.length; ALL.push(p);
  })));
  const byId = Object.fromEntries(ALL.map(p => [p.id, p]));

  // ---------- filters ----------
  const ui = {
    tab: 'all', q: '', status: 'all', diff: 'all', view: 'sheet'
  };
  function matches(p) {
    if (ui.tab === 'revision' && !state.revision[p.id]) return false;
    if (ui.status === 'solved' && !state.solved[p.id]) return false;
    if (ui.status === 'unsolved' && state.solved[p.id]) return false;
    if (ui.diff !== 'all' && p.difficulty !== ui.diff) return false;
    if (ui.q) {
      const q = ui.q.toLowerCase();
      if (!(p.name.toLowerCase().includes(q) || p.substep.title.toLowerCase().includes(q) || p.step.title.toLowerCase().includes(q))) return false;
    }
    return true;
  }
  const filtering = () => ui.tab !== 'all' || ui.q || ui.status !== 'all' || ui.diff !== 'all';

  // ---------- render ----------
  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ICON = {
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6"/></svg>',
    yt: '<svg viewBox="0 0 24 24"><path d="M10 8l6 4-6 4z"/></svg>',
    lc: '<svg viewBox="0 0 24 24"><path d="M14 4 8 10a5 5 0 0 0 0 7l3 3a5 5 0 0 0 7 0 M10 14h9 M17 8l3 3"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8 M8 12h8"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 4h14v12l-4 4H5z M9 10h6 M9 14h4"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 3 1.1-6.2L3 9.7l6.2-.9z"/></svg>'
  };

  function counts(list) {
    let done = 0; list.forEach(p => { if (state.solved[p.id]) done++; });
    return { done, total: list.length };
  }

  function renderHeader() {
    $('#sheetTitle').textContent = DATA.title;
    $('#sheetDesc').textContent = DATA.description;
    $('#lastUpdated').textContent = 'Last updated : ' + DATA.lastUpdated;
    document.title = DATA.title + ' — Local Clone';
  }

  function renderOverall() {
    const c = counts(ALL);
    const pct = c.total ? Math.round(c.done * 100 / c.total) : 0;
    $('#ring').style.setProperty('--p', pct);
    $('#ringPct').textContent = pct + '%';
    $('#solvedCount').textContent = c.done; $('#totalCount').textContent = c.total;
    const d = { Easy: [0, 0], Medium: [0, 0], Hard: [0, 0] };
    ALL.forEach(p => { const k = d[p.difficulty] || (d[p.difficulty] = [0, 0]); k[1]++; if (state.solved[p.id]) k[0]++; });
    $('#easyDone').textContent = d.Easy[0]; $('#easyTot').textContent = d.Easy[1];
    $('#medDone').textContent = d.Medium[0]; $('#medTot').textContent = d.Medium[1];
    $('#hardDone').textContent = d.Hard[0]; $('#hardTot').textContent = d.Hard[1];
    renderSide();
    renderStreak();
  }

  function renderSide() {
    const box = $('#sideSteps'); box.innerHTML = '';
    DATA.steps.forEach(st => {
      const list = st.substeps.flatMap(s => s.problems);
      const c = counts(list);
      const row = el('div', 'side-step');
      row.innerHTML = `<span class="lbl">${st.index}. ${st.title}</span><span class="bar"><i style="width:${c.total ? c.done * 100 / c.total : 0}%"></i></span><span>${c.done}/${c.total}</span>`;
      row.onclick = () => { state.open[st.id] = true; save(); renderSteps(); document.getElementById('step-' + st.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      box.appendChild(row);
    });
  }

  function renderStreak() {
    const days = new Set(Object.values(state.solvedAt).map(t => new Date(t).toDateString()));
    let streak = 0; const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
    $('#streak').textContent = streak + (streak === 1 ? ' day' : ' days');
  }

  function problemRow(p) {
    const tr = el('tr'); tr.dataset.id = p.id;
    if (state.solved[p.id]) tr.classList.add('done');
    const link = p.article || p.leetcode || p.practice || '#';
    const practice = p.leetcode || p.practice;
    tr.innerHTML = `
      <td class="c"><input type="checkbox" ${state.solved[p.id] ? 'checked' : ''} title="Mark solved"></td>
      <td class="name"><a href="${link}" target="_blank" rel="noopener">${esc(p.name)}</a><span class="diff ${p.difficulty}">${p.difficulty}</span></td>
      <td class="c"><a href="#" class="solve" data-act="solve">Solve</a></td>
      <td class="c"><a href="#" class="res ed" data-act="solve" title="Editorial / solution">ED</a></td>
      <td class="c">
        ${p.article ? `<a class="res doc" href="${p.article}" target="_blank" rel="noopener" title="Article">${ICON.doc}</a>` : ''}
        ${p.youtube ? `<a class="res yt" href="${p.youtube}" target="_blank" rel="noopener" title="Video">${ICON.yt}</a>` : ''}
      </td>
      <td class="c">${practice ? `<a class="res lc" href="${practice}" target="_blank" rel="noopener" title="Practice">${ICON.lc}</a>` : '<span class="dash">---</span>'}</td>
      <td class="c"><button class="note-btn ${state.notes[p.id] ? 'has' : ''}" data-act="note" title="${state.notes[p.id] ? 'Edit note' : 'Add note'}">${state.notes[p.id] ? ICON.note : ICON.plus}</button></td>
      <td class="c"><button class="star-btn ${state.revision[p.id] ? 'on' : ''}" data-act="rev" title="Mark for revision">${ICON.star}</button></td>`;
    tr.querySelector('input').onchange = e => setSolved(p.id, e.target.checked);
    tr.querySelectorAll('[data-act]').forEach(b => b.onclick = e => {
      e.preventDefault();
      const a = b.dataset.act;
      if (a === 'solve') openSolution(p.id);
      else if (a === 'note') openNote(p.id);
      else if (a === 'rev') toggleRevision(p.id);
    });
    return tr;
  }

  function renderSteps() {
    const root = $('#steps'); root.innerHTML = '';
    let shown = 0;
    const filt = filtering();
    DATA.steps.forEach(st => {
      const stepProblems = st.substeps.flatMap(s => s.problems);
      const visible = stepProblems.filter(matches);
      if (filt && !visible.length) return;
      shown += visible.length;
      const c = counts(stepProblems);
      const open = filt ? true : !!state.open[st.id];
      const step = el('div', 'step' + (open ? ' open' : '')); step.id = 'step-' + st.id;
      const head = el('div', 'step-head');
      head.innerHTML = `${ICON.chev}<span class="step-title">${esc(st.title)}</span><span class="bar"><i style="width:${c.total ? c.done * 100 / c.total : 0}%"></i></span><span class="step-count">${c.done} / ${c.total}</span>`;
      head.onclick = () => { state.open[st.id] = !step.classList.contains('open'); save(); step.classList.toggle('open'); };
      step.appendChild(head);
      const body = el('div', 'step-body');
      st.substeps.forEach(ss => {
        const vis = ss.problems.filter(matches);
        if (filt && !vis.length) return;
        const sc = counts(ss.problems);
        const sopen = filt ? true : !!state.openSub[ss.id];
        const sub = el('div', 'step substep' + (sopen ? ' open' : ''));
        const sh = el('div', 'step-head');
        sh.innerHTML = `${ICON.chev}<span class="step-title">${esc(ss.title)}</span><span class="bar"><i style="width:${sc.total ? sc.done * 100 / sc.total : 0}%"></i></span><span class="step-count">${sc.done} / ${sc.total}</span>`;
        sh.onclick = () => { state.openSub[ss.id] = !sub.classList.contains('open'); save(); sub.classList.toggle('open'); };
        sub.appendChild(sh);
        const sb = el('div', 'step-body');
        const tbl = el('table', 'tbl');
        tbl.innerHTML = '<thead><tr><th>Status</th><th>Problem</th><th>Solve</th><th>Editorial</th><th>Resource</th><th>Practice</th><th>Note</th><th>Revision</th></tr></thead>';
        const tb = el('tbody');
        vis.forEach(p => tb.appendChild(problemRow(p)));
        tbl.appendChild(tb); sb.appendChild(tbl); sub.appendChild(sb); body.appendChild(sub);
      });
      step.appendChild(body); root.appendChild(step);
    });
    $('#emptyMsg').hidden = shown > 0;
  }

  function renderStats() {
    const v = $('#statsView'); v.innerHTML = '';
    const total = counts(ALL);
    const card = el('div', 'stat-card');
    card.innerHTML = `<h3>Overview</h3>
      <div class="stat-row"><span>Solved</span><b>${total.done} / ${total.total}</b></div>
      <div class="stat-row"><span>Marked for revision</span><b>${Object.keys(state.revision).filter(k => state.revision[k]).length}</b></div>
      <div class="stat-row"><span>Notes written</span><b>${Object.keys(state.notes).filter(k => state.notes[k]).length}</b></div>
      <div class="stat-row"><span>Solutions available locally</span><b>${ALL.filter(p => SOL[p.id]).length} / ${ALL.length}</b></div>`;
    v.appendChild(card);
    DATA.steps.forEach(st => {
      const list = st.substeps.flatMap(s => s.problems);
      const c = counts(list);
      const d = { Easy: [0, 0], Medium: [0, 0], Hard: [0, 0] };
      list.forEach(p => { const k = d[p.difficulty]; if (!k) return; k[1]++; if (state.solved[p.id]) k[0]++; });
      const cd = el('div', 'stat-card');
      cd.innerHTML = `<h3>${st.index}. ${esc(st.title)}</h3>
        <div class="bar" style="width:100%;margin:6px 0"><i style="width:${c.total ? c.done * 100 / c.total : 0}%"></i></div>
        <div class="stat-row"><span>Total</span><b>${c.done} / ${c.total}</b></div>
        <div class="stat-row"><span style="color:var(--easy)">Easy</span><span>${d.Easy[0]} / ${d.Easy[1]}</span></div>
        <div class="stat-row"><span style="color:var(--medium)">Medium</span><span>${d.Medium[0]} / ${d.Medium[1]}</span></div>
        <div class="stat-row"><span style="color:var(--hard)">Hard</span><span>${d.Hard[0]} / ${d.Hard[1]}</span></div>`;
      v.appendChild(cd);
    });
  }

  function renderAll() { renderOverall(); if (ui.view === 'sheet') renderSteps(); else renderStats(); }

  // ---------- actions ----------
  function setSolved(id, on) {
    if (on) { state.solved[id] = true; state.solvedAt[id] = Date.now(); }
    else { delete state.solved[id]; delete state.solvedAt[id]; }
    save();
    const tr = document.querySelector(`tr[data-id="${id}"]`);
    if (tr) { tr.classList.toggle('done', on); tr.querySelector('input').checked = on; }
    refreshBars();
  }
  function refreshBars() {
    renderOverall();
    // update per-step / sub-step bars in place
    DATA.steps.forEach(st => {
      const s = document.getElementById('step-' + st.id); if (!s) return;
      const c = counts(st.substeps.flatMap(x => x.problems));
      const h = s.querySelector(':scope > .step-head');
      h.querySelector('.bar i').style.width = (c.total ? c.done * 100 / c.total : 0) + '%';
      h.querySelector('.step-count').textContent = `${c.done} / ${c.total}`;
      s.querySelectorAll(':scope > .step-body > .substep').forEach((sub, i) => {
        const ss = st.substeps.filter(x => !filtering() || x.problems.some(matches))[i]; if (!ss) return;
        const sc = counts(ss.problems);
        sub.querySelector('.bar i').style.width = (sc.total ? sc.done * 100 / sc.total : 0) + '%';
        sub.querySelector('.step-count').textContent = `${sc.done} / ${sc.total}`;
      });
    });
    if (ui.status !== 'all') renderSteps();
  }
  function toggleRevision(id) {
    if (state.revision[id]) delete state.revision[id]; else state.revision[id] = true;
    save();
    const b = document.querySelector(`tr[data-id="${id}"] .star-btn`);
    if (b) b.classList.toggle('on', !!state.revision[id]);
    if (ui.tab === 'revision') renderSteps();
    toast(state.revision[id] ? 'Added to revision' : 'Removed from revision');
  }

  // ---------- solution modal ----------
  let curId = null, curLang = 'all';
  async function getSolution(id) {
    if (SOL[id]) return SOL[id];
    try { const r = await fetch('solutions/' + id + '.md'); if (r.ok) return SOL[id] = await r.text(); } catch (e) {}
    return null;
  }
  async function openSolution(id) {
    const p = byId[id]; if (!p) return;
    curId = id;
    $('#solKicker').textContent = `${p.step.title} › ${p.substep.title} · ${p.difficulty}`;
    $('#solTitle').textContent = p.name;
    $('#solSolved').checked = !!state.solved[id];
    $('#solRev').checked = !!state.revision[id];
    const links = [];
    if (p.article) links.push(`<a href="${p.article}" target="_blank" rel="noopener">Article ↗</a>`);
    if (p.youtube) links.push(`<a href="${p.youtube}" target="_blank" rel="noopener">Video ↗</a>`);
    if (p.leetcode || p.practice) links.push(`<a href="${p.leetcode || p.practice}" target="_blank" rel="noopener">Practice ↗</a>`);
    $('#solLinks').innerHTML = links.join('');
    const body = $('#solBody');
    body.innerHTML = '<p class="muted">Loading…</p>';
    $('#solModal').hidden = false;
    const md = await getSolution(id);
    if (curId !== id) return;
    body.innerHTML = md ? window.renderMarkdown(md) : '<div class="missing">No local solution file found for this problem yet.<br>Expected at <code>solutions/' + id + '.md</code>.</div>';
    body.dataset.lang = curLang;
    body.scrollTop = 0;
    body.querySelectorAll('pre .copy').forEach(b => b.onclick = () => {
      navigator.clipboard?.writeText(b.nextElementSibling.textContent).then(() => toast('Copied'));
    });
    $('#solPrev').disabled = p.idx === 0;
    $('#solNext').disabled = p.idx === ALL.length - 1;
  }
  function closeSolution() { $('#solModal').hidden = true; curId = null; }
  $('#solClose').onclick = closeSolution;
  $('#solPrev').onclick = () => { const p = byId[curId]; if (p && p.idx > 0) openSolution(ALL[p.idx - 1].id); };
  $('#solNext').onclick = () => { const p = byId[curId]; if (p && p.idx < ALL.length - 1) openSolution(ALL[p.idx + 1].id); };
  $('#solSolved').onchange = e => setSolved(curId, e.target.checked);
  $('#solRev').onchange = () => toggleRevision(curId);
  $('#solTabs').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    curLang = b.dataset.lang;
    $('#solTabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    $('#solBody').dataset.lang = curLang;
  };

  // ---------- notes ----------
  let noteId = null;
  function openNote(id) {
    noteId = id;
    $('#noteTitle').textContent = 'Note · ' + byId[id].name;
    $('#noteText').value = state.notes[id] || '';
    $('#noteModal').hidden = false;
    setTimeout(() => $('#noteText').focus(), 0);
  }
  function closeNote() { $('#noteModal').hidden = true; noteId = null; }
  function refreshNoteBtn(id) {
    const b = document.querySelector(`tr[data-id="${id}"] .note-btn`);
    if (b) { const has = !!state.notes[id]; b.classList.toggle('has', has); b.innerHTML = has ? ICON.note : ICON.plus; b.title = has ? 'Edit note' : 'Add note'; }
  }
  $('#noteClose').onclick = closeNote;
  $('#noteSave').onclick = () => {
    const t = $('#noteText').value.trim();
    if (t) state.notes[noteId] = t; else delete state.notes[noteId];
    save(); refreshNoteBtn(noteId); closeNote(); toast('Note saved');
  };
  $('#noteDelete').onclick = () => { delete state.notes[noteId]; save(); refreshNoteBtn(noteId); closeNote(); toast('Note deleted'); };

  // ---------- toolbar ----------
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    ui.tab = t.dataset.tab; renderSteps();
  });
  $('#search').oninput = e => { ui.q = e.target.value.trim(); renderSteps(); };
  $('#statusFilter').onchange = e => { ui.status = e.target.value; renderSteps(); };
  $('#diffFilter').onchange = e => { ui.diff = e.target.value; renderSteps(); };
  function randomProblem() {
    const pool = ALL.filter(p => !state.solved[p.id] && (ui.diff === 'all' || p.difficulty === ui.diff));
    const list = pool.length ? pool : ALL;
    const p = list[Math.floor(Math.random() * list.length)];
    state.open[p.step.id] = true; state.openSub[p.substep.id] = true; save();
    if (ui.view !== 'sheet') switchView('sheet');
    renderSteps();
    const tr = document.querySelector(`tr[data-id="${p.id}"]`);
    if (tr) { tr.scrollIntoView({ behavior: 'smooth', block: 'center' }); tr.style.outline = '2px solid var(--accent)'; setTimeout(() => tr.style.outline = '', 1800); }
    openSolution(p.id);
  }
  $('#randomBtn').onclick = randomProblem;

  // menu
  const menu = $('#menu');
  $('#menuBtn').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.hidden = true; });
  menu.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.act; menu.hidden = true;
    if (a === 'export') {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2)], { type: 'application/json' });
      const u = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = u; link.download = 'a2z-progress.json'; link.click(); URL.revokeObjectURL(u);
    } else if (a === 'import') { $('#importFile').click(); }
    else if (a === 'expandAll') { DATA.steps.forEach(s => { state.open[s.id] = true; s.substeps.forEach(x => state.openSub[x.id] = true); }); save(); renderSteps(); }
    else if (a === 'collapseAll') { state.open = {}; state.openSub = {}; save(); renderSteps(); }
    else if (a === 'reset') { if (confirm('Reset ALL progress, notes and revision marks? This cannot be undone.')) { state = defaultState(); save(); renderAll(); toast('Progress reset'); } }
  };
  $('#importFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const j = JSON.parse(r.result); state = Object.assign(defaultState(), j.state || j); save(); renderAll(); toast('Progress imported'); } catch (err) { toast('Invalid file'); } };
    r.readAsText(f); e.target.value = '';
  };

  // views
  function switchView(v) {
    ui.view = v;
    document.querySelectorAll('.rail-item[data-view]').forEach(x => x.classList.toggle('active', x.dataset.view === v));
    const sheet = v === 'sheet';
    $('#steps').hidden = !sheet; $('.toolbar').hidden = !sheet; $('#emptyMsg').hidden = true;
    $('#statsView').hidden = sheet;
    renderAll();
  }
  document.querySelectorAll('.rail-item[data-view]').forEach(a => a.onclick = e => { e.preventDefault(); switchView(a.dataset.view); });

  // theme
  function applyTheme() { document.documentElement.dataset.theme = state.theme; }
  $('#themeToggle').onclick = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); };

  // keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSolution(); closeNote(); menu.hidden = true; return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    else if (e.key === 'r') randomProblem();
    else if (e.key === 'ArrowRight' && curId) $('#solNext').click();
    else if (e.key === 'ArrowLeft' && curId) $('#solPrev').click();
  });
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) { closeSolution(); closeNote(); } }));

  // quote
  const QUOTES = [
    'Consistency beats intensity. One problem a day compounds.',
    'Don\'t memorise solutions. Memorise the questions you asked yourself to reach them.',
    'Brute force first. Optimal comes from understanding why brute force is slow.',
    'The sheet is a map, not the territory. Solve, revisit, re-solve.',
    'Every hard problem is two medium problems in a trench coat.',
    'Read the constraints. They whisper the intended complexity.'
  ];
  $('#quoteText').textContent = QUOTES[new Date().getDate() % QUOTES.length];
  $('#knowMore').onclick = e => { e.preventDefault(); toast('Work through steps top to bottom. Tick problems as you solve them; star ones to revisit.'); };

  // toast
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 1800); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // hash deep-link: #p=<id>
  function handleHash() { const m = location.hash.match(/p=([\w-]+)/); if (m && byId[m[1]]) openSolution(m[1]); }
  window.addEventListener('hashchange', handleHash);

  // ---------- init ----------
  applyTheme(); renderHeader(); renderAll(); handleHash();
})();
