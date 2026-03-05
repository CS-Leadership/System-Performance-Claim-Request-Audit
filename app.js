const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'audits.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS audits (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    review_date TEXT NOT NULL,
    project_id  TEXT NOT NULL,
    specialist  TEXT NOT NULL,
    score       INTEGER NOT NULL,
    total       INTEGER NOT NULL,
    results     TEXT NOT NULL,
    notes       TEXT NOT NULL,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────

// Submit a new audit
app.post('/api/audits', (req, res) => {
  const { review_date, project_id, specialist, score, total, results, notes } = req.body;

  if (!review_date || !project_id || !specialist) {
    return res.status(400).json({ error: 'review_date, project_id, and specialist are required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO audits (review_date, project_id, specialist, score, total, results, notes, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const info = stmt.run(
    review_date,
    project_id,
    specialist,
    score,
    total,
    JSON.stringify(results),
    JSON.stringify(notes)
  );

  res.status(201).json({ id: info.lastInsertRowid, message: 'Audit saved successfully.' });
});

// Get all audits (summary list)
app.get('/api/audits', (req, res) => {
  const rows = db.prepare(`
    SELECT id, review_date, project_id, specialist, score, total, submitted_at
    FROM audits
    ORDER BY submitted_at DESC
  `).all();
  res.json(rows);
});

// Get a single audit by ID (full detail)
app.get('/api/audits/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM audits WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Audit not found.' });

  row.results = JSON.parse(row.results);
  row.notes = JSON.parse(row.notes);
  res.json(row);
});

// Delete an audit
app.delete('/api/audits/:id', (req, res) => {
  const info = db.prepare('DELETE FROM audits WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Audit not found.' });
  res.json({ message: 'Audit deleted.' });
});

// Catch-all: serve frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  SPCR Audit server running at http://localhost:${PORT}\n`);
});
