# SPCR QC Audit Tool

A local web application for completing and tracking **System Performance Claim Request (SPCR) QC Audits**. Audits are saved to a local SQLite database so you can review history at any time.

---

## Project Structure

```
spcr-audit/
├── app.js              # Express backend + SQLite API
├── package.json        # Node dependencies
├── .gitignore
├── audits.db           # Auto-created on first run (not committed)
└── public/
    ├── index.html      # App shell
    ├── styles.css      # All styles
    └── SPCR Audit.js   # Frontend logic
```

---

## Requirements

- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_ORG/spcr-audit.git
cd spcr-audit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
npm start
```

The app will be available at **http://localhost:3000**

> For development with auto-reload on file changes:
> ```bash
> npm run dev
> ```
> *(Requires nodemon — installed automatically as a dev dependency)*

---

## Usage

### New Audit Tab
1. Fill in the **QC Review Date**, **Project ID**, and **Claim Processing Specialist**
2. Work through all 20 QC checks — click **PASS** or **FAIL** for each
3. Add optional notes per row
4. Watch the live score bar update as you go
5. Click **Submit Audit** — the audit is saved to the database

### Audit History Tab
- See all previously submitted audits in a sortable table
- Click **View** to see the full breakdown of any audit
- Click **Delete** to remove an audit permanently
- Click **↻ Refresh** to reload the list

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audits` | Submit a new audit |
| `GET`  | `/api/audits` | List all audits (summary) |
| `GET`  | `/api/audits/:id` | Get full detail for one audit |
| `DELETE` | `/api/audits/:id` | Delete an audit |

---

## Data Storage

Audits are stored in a local **SQLite** database file (`audits.db`) in the project root. This file is excluded from git (see `.gitignore`). Back it up manually if needed.

---

## Customizing the QC Checklist

To add, remove, or rename checklist items, edit the `QC_CHECKS` array at the top of `public/SPCR Audit.js`:

```js
const QC_CHECKS = [
  { id: 1, label: 'Task Completed' },
  { id: 2, label: 'Review Period Start Date (Correct)' },
  // ... add or edit items here
];
```

> **Note:** Changing IDs may affect how existing audit records are displayed in the detail view.

---

## Changing the Port

The server runs on port `3000` by default. To change it, set a `PORT` environment variable:

```bash
PORT=8080 npm start
```

If you change the port, also update the `API` constant at the top of `public/SPCR Audit.js`:

```js
const API = 'http://localhost:8080/api';
```
