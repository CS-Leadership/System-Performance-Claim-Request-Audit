/* ============================================================
   SPCR Audit.js  —  Frontend Logic
   ============================================================ */

const API = window.location.origin + '/api';

const QC_CHECKS = [
  { id: 1,  label: 'Task Completed' },
  { id: 2,  label: 'Review Period Start Date (Correct)' },
  { id: 3,  label: 'Review Period End Date (Correct)' },
  { id: 4,  label: 'Reason for Claim Identified' },
  { id: 5,  label: 'Production Guarantee Matches Contract' },
  { id: 6,  label: 'Energy Price Matches Contract' },
  { id: 7,  label: 'Guarantee Percentage Correct (85/90/etc)' },
  { id: 8,  label: 'Contracted Production Calculation Correct' },
  { id: 9,  label: 'Actual Production Verified' },
  { id: 10, label: 'Production Period Matches Review Window' },
  { id: 11, label: 'Deficit Calculation Correct' },
  { id: 12, label: 'Compensation Calculation Correct' },
  { id: 13, label: 'Root Cause Verified (Service Records)' },
  { id: 14, label: 'Repair Completion Verified', hint: 'If system is not producing — did we trigger a monitoring task?' },
  { id: 15, label: 'Unified Note Values Match SPCR Task' },
  { id: 16, label: 'Monitoring Reports Attached' },
  { id: 17, label: 'Contract Attached' },
  { id: 18, label: 'Results sent to the homeowner via email' },
  { id: 19, label: 'Unified Notes' },
  { id: 20, label: 'AP Task Created (Warranted Compensation)' },
];

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  results: {},   // { id: 'pass' | 'fail' | null }
  notes:   {},   // { id: string }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(pct) {
  if (pct === 100) return '#22c55e';
  if (pct >= 80)   return '#f59e0b';
  return '#ef4444';
}

function badgeClass(pct) {
  if (pct === 100) return 'badge badge-pass';
  if (pct >= 80)   return 'badge badge-warn';
  return 'badge badge-fail';
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

// ─── Render: Audit Form ───────────────────────────────────────────────────────
function renderAuditForm(submitted = false) {
  const container = document.getElementById('audit-form-container');

  const passCount = Object.values(state.results).filter(v => v === 'pass').length;
  const answered  = Object.keys(state.results).length;
  const total     = QC_CHECKS.length;
  const pct       = Math.round((passCount / total) * 100);
  const color     = scoreColor(pct);
  const remaining = total - answered;

  if (submitted) {
    const projectId  = document.getElementById('field-project-id')?.value || '—';
    const specialist = document.getElementById('field-specialist')?.value || '—';
    const reviewer   = document.getElementById('field-reviewer')?.value || '—';
    const reviewDate = document.getElementById('field-review-date')?.value || '—';
    const failCount  = Object.values(state.results).filter(v => v === 'fail').length;

    container.innerHTML = `
      <div class="success-banner">
        <h3>✓ Audit Submitted</h3>
        <p>Project <span>${projectId}</span> &nbsp;·&nbsp; Processed by <span>${specialist}</span> &nbsp;·&nbsp; Reviewed by <span>${reviewer}</span> &nbsp;·&nbsp; <span>${reviewDate}</span></p>
        <p>Final Score: <span style="color:${color};font-weight:700">${passCount}/${total}</span>
          ${failCount > 0 ? `<span style="color:#f87171;margin-left:1rem">${failCount} item(s) failed</span>` : ''}
        </p>
        <button class="btn-reset" onclick="resetForm()">Start New Audit</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Meta fields -->
    <div class="meta-grid" style="grid-template-columns: repeat(4, 1fr)">
      <div class="meta-field">
        <label for="field-review-date">QC Review Date</label>
        <input type="date" id="field-review-date" />
      </div>
      <div class="meta-field">
        <label for="field-project-id">Project ID</label>
        <input type="text" id="field-project-id" placeholder="e.g. PRJ-00001" />
      </div>
      <div class="meta-field">
        <label for="field-specialist">Claim Processing Specialist</label>
        <input type="text" id="field-specialist" placeholder="Who processed the claim" />
      </div>
      <div class="meta-field">
        <label for="field-reviewer">QC Reviewer</label>
        <input type="text" id="field-reviewer" placeholder="Who is reviewing" />
      </div>
    </div>

    <!-- Column headers -->
    <div class="check-header">
      <span>QC Check</span>
      <span>Pass</span>
      <span>Fail</span>
      <span>Notes</span>
    </div>

    <!-- Checklist -->
    <div class="check-list" id="check-list">
      ${QC_CHECKS.map(c => renderCheckRow(c)).join('')}
    </div>

    <!-- Score bar -->
    <div class="score-bar-wrap">
      <div class="score-num">
        <span class="score-label">Score</span>
        <span class="score-val" id="score-val" style="color:${color}">${passCount}<span style="font-size:1rem;color:var(--border2)">/${total}</span></span>
      </div>
      <div class="score-track">
        <div class="score-progress">
          <div class="score-fill" id="score-fill" style="width:${pct}%;background:${color};box-shadow:0 0 12px ${color}55"></div>
        </div>
        <div class="score-pct" id="score-pct">${pct}% complete</div>
      </div>
      <div class="score-remain">
        <span class="score-label">Remaining</span>
        <span id="score-remain">${remaining}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="form-actions">
      <button class="btn-submit" onclick="submitAudit()">Submit Audit</button>
      <button class="btn-reset"  onclick="resetForm()">Reset Form</button>
    </div>
  `;

  // Restore values if state has them
  restoreMetaFields();
}

function renderCheckRow(check) {
  const res = state.results[check.id];
  const labelClass = res === 'pass' ? 'check-text is-pass'
                   : res === 'fail' ? 'check-text is-fail'
                   : 'check-text';
  return `
    <div class="check-row" id="row-${check.id}">
      <div class="check-label">
        <span class="${labelClass}" id="label-${check.id}">
          <span class="check-num">${String(check.id).padStart(2, '0')}</span>${check.label}
        </span>
        ${check.hint ? `<span class="check-hint">${check.hint}</span>` : ''}
      </div>
      <button class="btn-pass ${res === 'pass' ? 'active' : ''}" onclick="setResult(${check.id}, 'pass')">PASS</button>
      <button class="btn-fail ${res === 'fail' ? 'active' : ''}" onclick="setResult(${check.id}, 'fail')">FAIL</button>
      <textarea class="check-note" rows="1" placeholder="—"
        onchange="setNote(${check.id}, this.value)">${state.notes[check.id] || ''}</textarea>
    </div>
  `;
}

// ─── Restore meta fields after re-render ─────────────────────────────────────
const _meta = { reviewDate: '', projectId: '', specialist: '', reviewer: '' };

function saveMetaFields() {
  _meta.reviewDate = document.getElementById('field-review-date')?.value || '';
  _meta.projectId  = document.getElementById('field-project-id')?.value || '';
  _meta.specialist = document.getElementById('field-specialist')?.value || '';
  _meta.reviewer   = document.getElementById('field-reviewer')?.value || '';
}

function restoreMetaFields() {
  const rd = document.getElementById('field-review-date');
  const pi = document.getElementById('field-project-id');
  const sp = document.getElementById('field-specialist');
  const rv = document.getElementById('field-reviewer');
  if (rd) rd.value = _meta.reviewDate;
  if (pi) pi.value = _meta.projectId;
  if (sp) sp.value = _meta.specialist;
  if (rv) rv.value = _meta.reviewer;
}

// ─── Interactions ─────────────────────────────────────────────────────────────
function setResult(id, value) {
  state.results[id] = state.results[id] === value ? null : value;
  if (state.results[id] === null) delete state.results[id];
  saveMetaFields();
  renderAuditForm();
}

function setNote(id, value) {
  state.notes[id] = value;
}

function resetForm() {
  state.results = {};
  state.notes   = {};
  _meta.reviewDate = '';
  _meta.projectId  = '';
  _meta.specialist = '';
  _meta.reviewer   = '';
  renderAuditForm();
}

// ─── Submit ───────────────────────────────────────────────────────────────────
async function submitAudit() {
  const reviewDate = document.getElementById('field-review-date')?.value;
  const projectId  = document.getElementById('field-project-id')?.value;
  const specialist = document.getElementById('field-specialist')?.value;
  const reviewer   = document.getElementById('field-reviewer')?.value;

  if (!reviewDate || !projectId || !specialist || !reviewer) {
    alert('Please fill in QC Review Date, Project ID, Claim Processing Specialist, and QC Reviewer before submitting.');
    return;
  }

  const passCount = Object.values(state.results).filter(v => v === 'pass').length;

  const payload = {
    review_date: reviewDate,
    project_id:  projectId,
    specialist,
    reviewer,
    score:   passCount,
    total:   QC_CHECKS.length,
    results: state.results,
    notes:   state.notes,
  };

  try {
    const btn = document.querySelector('.btn-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    const res = await fetch(`${API}/audits`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error((await res.json()).error || 'Server error');

    renderAuditForm(true);
  } catch (err) {
    alert(`Failed to save audit: ${err.message}\n\nMake sure the server (app.js) is running.`);
    const btn = document.querySelector('.btn-submit');
    if (btn) { btn.disabled = false; btn.textContent = 'Submit Audit'; }
  }
}

// ─── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
  const container = document.getElementById('history-container');
  container.innerHTML = '<p class="loading-text">Loading audits…</p>';

  try {
    const res  = await fetch(`${API}/audits`);
    const data = await res.json();

    if (!data.length) {
      container.innerHTML = '<p class="empty-text">No audits submitted yet.</p>';
      return;
    }

    container.innerHTML = `
      <table class="history-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Project ID</th>
            <th>Claim Processor</th>
            <th>QC Reviewer</th>
            <th>Review Date</th>
            <th>Score</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => {
            const pct = Math.round((row.score / row.total) * 100);
            return `
              <tr>
                <td style="color:var(--muted)">${row.id}</td>
                <td>${row.project_id}</td>
                <td>${row.specialist}</td>
                <td>${row.reviewer || '—'}</td>
                <td>${row.review_date}</td>
                <td><span class="${badgeClass(pct)}">${row.score}/${row.total} (${pct}%)</span></td>
                <td style="color:var(--muted);font-size:0.72rem">${formatDate(row.submitted_at)}</td>
                <td>
                  <button class="btn-view" onclick="viewAudit(${row.id})">View</button>
                  <button class="btn-delete" onclick="deleteAudit(${row.id})">Delete</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<p class="empty-text" style="color:#f87171">Could not load history. Is the server running?<br><small>${err.message}</small></p>`;
  }
}

async function viewAudit(id) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  content.innerHTML = '<p class="loading-text">Loading…</p>';
  overlay.classList.remove('hidden');

  try {
    const res  = await fetch(`${API}/audits/${id}`);
    const data = await res.json();
    const pct  = Math.round((data.score / data.total) * 100);
    const color = scoreColor(pct);

    content.innerHTML = `
      <div class="modal-title">Audit #${data.id} — ${data.project_id}</div>
      <div class="modal-meta">
        Processor: <span>${data.specialist}</span> &nbsp;·&nbsp; Reviewer: <span>${data.reviewer || '—'}</span> &nbsp;·&nbsp;
        Review Date: <span>${data.review_date}</span> &nbsp;·&nbsp;
        Submitted: <span>${formatDate(data.submitted_at)}</span> &nbsp;·&nbsp;
        Score: <span style="color:${color};font-weight:700">${data.score}/${data.total} (${pct}%)</span>
      </div>
      <table class="modal-table">
        <thead>
          <tr>
            <th>#</th><th>QC Check</th><th>Result</th><th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${QC_CHECKS.map(c => {
            const r = data.results[c.id];
            const n = data.notes[c.id] || '';
            const resColor = r === 'pass' ? '#4ade80' : r === 'fail' ? '#f87171' : 'var(--muted)';
            return `
              <tr>
                <td style="color:var(--muted)">${String(c.id).padStart(2,'0')}</td>
                <td>${c.label}</td>
                <td style="color:${resColor};font-weight:700;text-transform:uppercase;font-size:0.65rem">${r || '—'}</td>
                <td style="color:var(--muted)">${n || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    content.innerHTML = `<p style="color:#f87171">Error loading audit: ${err.message}</p>`;
  }
}

async function deleteAudit(id) {
  if (!confirm(`Delete Audit #${id}? This cannot be undone.`)) return;

  try {
    await fetch(`${API}/audits/${id}`, { method: 'DELETE' });
    loadHistory();
  } catch (err) {
    alert(`Failed to delete: ${err.message}`);
  }
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.remove('hidden');
      if (tab === 'history') loadHistory();
    });
  });
}

// ─── Modal Close ──────────────────────────────────────────────────────────────
function initModal() {
  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('hidden');
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  });
}

// ─── Refresh Button ───────────────────────────────────────────────────────────
function initRefresh() {
  document.getElementById('refresh-history').addEventListener('click', loadHistory);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAuditForm();
  initTabs();
  initModal();
  initRefresh();
});
