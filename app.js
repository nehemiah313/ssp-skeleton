let CONTROLS = [];
const entries = {}; // id -> {status, narrative, role, evidence, na_just}
const company = {};
const LS_KEY = 'ssp-gen-v1';
const LS_CALC = 'sprs-calc-v1';
const $ = (id) => document.getElementById(id);

const STATUSES = ['Not answered', 'Implemented', 'Planned', 'Partially implemented', 'Inherited', 'Not Applicable'];

const PROMPTS = {
  'Implemented': 'How is this implemented? Name the tool, configuration, or procedure. Be specific enough that an assessor could verify it.',
  'Planned': 'What is the plan? Target date and the POA&M item that tracks it.',
  'Partially implemented': 'What is done, what is missing, and what remains? Note: partial scores as not implemented (except 3.5.3 and 3.13.11).',
  'Inherited': 'Inherited from whom? Name the provider or common control and what portion they cover.',
  'Not Applicable': 'Justification required: why does this requirement not apply to your environment?',
  'Not answered': '',
};

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function byId(id) { return CONTROLS.find(c => c.id === id); }
function entry(id) {
  if (!entries[id]) entries[id] = { status: 'Not answered', narrative: '', role: '', evidence: '', na_just: '' };
  return entries[id];
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ entries, company })); } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
    if (d) { Object.assign(entries, d.entries || {}); Object.assign(company, d.company || {}); }
  } catch (e) {}
}

function documented(e) {
  if (e.status === 'Not answered') return false;
  if (!e.narrative.trim()) return false;
  if (e.status === 'Not Applicable' && !e.na_just.trim()) return false;
  return true;
}

function updateProgress() {
  const n = CONTROLS.filter(c => documented(entry(c.id))).length;
  $('progressFill').style.width = (n / CONTROLS.length * 100) + '%';
  $('progressText').textContent = n + ' of ' + CONTROLS.length + ' requirements documented';
}

function buildUI() {
  const fams = {};
  for (const c of CONTROLS) (fams[c.family] = fams[c.family] || []).push(c);
  const fs = $('familyFilter');
  for (const f of Object.keys(fams).sort((a, b) => parseFloat(a) - parseFloat(b))) {
    const o = document.createElement('option');
    o.value = f; o.textContent = f + ' ' + fams[f][0].family_name;
    fs.appendChild(o);
  }
  $('families').innerHTML = Object.keys(fams).sort((a, b) => parseFloat(a) - parseFloat(b)).map(f => {
    const list = fams[f];
    return '<div class="family" data-fam="' + f + '"><h2>' + f + ' ' + esc(list[0].family_name) + '</h2>' +
      list.map(c => {
        const e = entry(c.id);
        const done = documented(e);
        return '<div class="ctrl' + (done ? ' done' : '') + '" data-ctrl="' + c.id + '" data-req="' + esc(c.requirement.toLowerCase()) + '">' +
          '<div class="ctrl-head"><span class="ctrl-id">' + c.id + '</span>' +
          '<span class="badge w' + c.weight.replace('/', '') + '">' + c.weight + 'pt</span>' +
          (c.never_deferrable ? '<span class="badge nd">NEVER DEFERRABLE</span>' : '') +
          (done ? '<span class="badge ok">documented</span>' : '') + '</div>' +
          '<p class="ctrl-req">' + esc(c.requirement) + '</p>' +
          '<div class="grid2">' +
          '<label class="fld sm">Status <select data-f="status">' +
          STATUSES.map(s => '<option' + (e.status === s ? ' selected' : '') + '>' + s + '</option>').join('') +
          '</select></label>' +
          '<label class="fld sm">Responsible role <input data-f="role" value="' + esc(e.role) + '" placeholder="e.g., System Administrator"></label>' +
          '</div>' +
          '<label class="fld sm">How is this met? <textarea data-f="narrative" rows="3" placeholder="' + esc(PROMPTS[e.status] || 'Describe the implementation…') + '">' + esc(e.narrative) + '</textarea></label>' +
          '<div class="na-just' + (e.status === 'Not Applicable' ? '' : ' hidden') + '"><label class="fld sm">N/A justification (required) <textarea data-f="na_just" rows="2" placeholder="Why does this not apply? Reference policy if access is prohibited.">' + esc(e.na_just) + '</textarea></label></div>' +
          '<label class="fld sm">Evidence reference <input data-f="evidence" value="' + esc(e.evidence) + '" placeholder="Where an assessor finds proof: ticket, config export, policy section…"></label>' +
          '</div>';
      }).join('') + '</div>';
  }).join('');
  $('families').querySelectorAll('[data-ctrl] [data-f]').forEach(inp => {
    inp.addEventListener('change', () => {
      const id = inp.closest('[data-ctrl]').dataset.ctrl;
      const e = entry(id);
      e[inp.dataset.f] = inp.value;
      save(); updateProgress(); applyFilters();
    });
  });
}

function applyFilters() {
  const q = ($('search').value || '').toLowerCase();
  const fam = $('familyFilter').value;
  const doc = $('docFilter').value;
  document.querySelectorAll('#families .family').forEach(f => {
    let vis = 0;
    f.querySelectorAll('[data-ctrl]').forEach(el => {
      const c = byId(el.dataset.ctrl);
      const e = entry(c.id);
      let show = true;
      if (fam && c.family !== fam) show = false;
      if (q && !(c.id.includes(q) || c.requirement.toLowerCase().includes(q))) show = false;
      if (doc === 'done' && !documented(e)) show = false;
      if (doc === 'todo' && documented(e)) show = false;
      el.style.display = show ? '' : 'none';
      if (show) vis++;
    });
    f.style.display = vis ? '' : 'none';
  });
}

function importFromCalc() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(LS_CALC) || '{}'); } catch (e) {}
  const map = { yes: 'Implemented', no: 'Planned', partial: 'Partially implemented', na: 'Not Applicable' };
  let n = 0;
  for (const id of Object.keys(d)) {
    if (!byId(id) || !map[d[id]]) continue;
    entry(id).status = map[d[id]];
    n++;
  }
  $('importNote').textContent = n ? 'Imported ' + n + ' statuses. Add your narratives next.' : 'No saved calculator answers in this browser.';
  save(); buildUI(); updateProgress(); applyFilters();
}

function md() {
  const g = (id) => (company[id] || '').trim();
  const today = new Date().toISOString().slice(0, 10);
  let s = '# System Security Plan\n\n';
  s += '**Company:** ' + (g('ci_company') || 'TBD') + '\n\n';
  s += '**System:** ' + (g('ci_system') || 'TBD') + '\n\n';
  s += '**Author:** ' + (g('ci_author') || 'TBD') + ' | **Date:** ' + (g('ci_date') || today) + '\n\n';
  if (g('ci_cage')) s += '**CAGE:** ' + g('ci_cage') + '\n\n';
  if (g('ci_uei')) s += '**UEI:** ' + g('ci_uei') + '\n\n';
  s += '---\n\n## 1. Introduction\n\n';
  s += 'This System Security Plan (SSP) describes the security requirements in place for the system identified above, ' +
    'mapped to NIST SP 800-171 Rev. 2. It is the authoritative record of how each requirement is met, who is responsible, and where evidence lives.\n\n';
  s += '## 2. System description\n\n' + (g('ci_desc') || '_Not provided._') + '\n\n';
  s += '## 3. System boundary\n\n' + (g('ci_boundary') || '_Not provided._') + '\n\n';
  s += '## 4. CUI categories\n\n' + (g('ci_cui') || '_Not provided._') + '\n\n';
  s += '## 5. Control implementation statements\n\n';
  const fams = {};
  for (const c of CONTROLS) (fams[c.family] = fams[c.family] || []).push(c);
  for (const f of Object.keys(fams).sort((a, b) => parseFloat(a) - parseFloat(b))) {
    s += '### ' + f + ' ' + fams[f][0].family_name + '\n\n';
    for (const c of fams[f]) {
      const e = entry(c.id);
      s += '#### ' + c.id + '\n\n';
      s += '**Requirement:** ' + c.requirement + '\n\n';
      s += '**Status:** ' + e.status + '\n\n';
      if (e.status === 'Not Applicable' && e.na_just.trim()) s += '**N/A justification:** ' + e.na_just.trim() + '\n\n';
      s += '**Implementation:** ' + (e.narrative.trim() || '_Not documented._') + '\n\n';
      if (e.role.trim()) s += '**Responsible role:** ' + e.role.trim() + '\n\n';
      if (e.evidence.trim()) s += '**Evidence:** ' + e.evidence.trim() + '\n\n';
    }
  }
  s += '## Appendix A: POA&M reference\n\n';
  s += 'Requirements marked Planned or Partially implemented are tracked in the Plan of Action & Milestones. A POA&M does not change the SPRS score.\n\n';
  s += '_Generated with the AI Tech Pros SSP Skeleton Generator._\n';
  return s;
}

function csvCell(v) {
  v = String(v == null ? '' : v).replace(/\r?\n/g, ' | ');
  return /[",]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

async function init() {
  const res = await fetch('data/nist-800-171-controls.json');
  const ds = await res.json();
  CONTROLS = ds.controls;
  load();
  for (const k of ['ci_company', 'ci_system', 'ci_author', 'ci_date', 'ci_cage', 'ci_uei', 'ci_desc', 'ci_boundary', 'ci_cui']) {
    if (company[k]) $(k).value = company[k];
    $(k).addEventListener('change', () => { company[k] = $(k).value; save(); });
  }
  if (!$('ci_date').value) { $('ci_date').value = new Date().toISOString().slice(0, 10); company['ci_date'] = $('ci_date').value; }
  buildUI();
  updateProgress();
  applyFilters();
  $('search').addEventListener('input', applyFilters);
  $('familyFilter').addEventListener('change', applyFilters);
  $('docFilter').addEventListener('change', applyFilters);
  $('importCalc').addEventListener('click', importFromCalc);
  $('exportMd').addEventListener('click', () => download('ssp-nist-800-171.md', md(), 'text/markdown'));
  $('exportCsv').addEventListener('click', () => {
    const head = ['Control ID', 'Family', 'Weight', 'Status', 'Implementation', 'N/A Justification', 'Responsible Role', 'Evidence'];
    const lines = [head.join(',')].concat(CONTROLS.map(c => {
      const e = entry(c.id);
      return [c.id, c.family + ' ' + c.family_name, c.weight, e.status, e.narrative, e.na_just, e.role, e.evidence].map(csvCell).join(',');
    }));
    download('ssp-tracking.csv', lines.join('\n'), 'text/csv');
  });
  $('printBtn').addEventListener('click', () => window.print());
  $('resetAll').addEventListener('click', () => {
    if (confirm('Clear all SSP entries?')) {
      Object.keys(entries).forEach(k => delete entries[k]);
      save(); buildUI(); updateProgress(); applyFilters();
    }
  });
}
init();
