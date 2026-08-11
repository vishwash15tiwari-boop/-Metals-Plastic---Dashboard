# KRA / KPI Tracker (Operations) — Metals & Plastics

A single-page **Executive Operations Control Tower** for the Open Marketplace (OMP) team.
It connects live to the two Google Sheets workbooks (Metal + Plastic), treats them as the
single source of truth, and adapts automatically when tabs or columns are added.

**Two files. That's the whole app.**

| File | Role |
|------|------|
| `Code.gs` | Server — reads every visible worksheet from both spreadsheets and returns the raw grids. No business logic. |
| `Index.html` | The dashboard — schema detection, KPIs, filters, charts, drill-downs, insights. All intelligence lives here. |

---

## See it in 10 seconds (no setup)

**Double-click `Index.html`** — it opens in your browser and runs the full,
interactive dashboard on built-in **demo data**. Every section, filter, drill-down
and animation works. This is the UI you'll get; only the numbers change once it's
connected to your live sheets.

> **How do I know it's reading my sheets?** A **connected-sources bar** sits under the
> filters. In demo it shows the sample workbooks; once deployed it shows *your* real
> workbook titles with live tab and row counts, and the status flips to **● Live**.
> That bar is your proof the data flowed.

## Why the live data only appears after deploying

The dashboard reads your sheets through Google Apps Script (`SpreadsheetApp`),
which runs **inside your Google account**. That's the only place with permission to
open your private workbooks — so the live read happens in the deployed web app, not
when the file is opened standalone (which is why standalone shows demo data). Deploy
once (below) and it's live and auto-syncing.

## Deploy (5 minutes)

1. Open [script.google.com](https://script.google.com) → **New project** (use the Google account that has access to both sheets).
2. Replace the default `Code.gs` content with this repo's **`Code.gs`**.
3. **+ → HTML** file, name it exactly **`Index`**, paste in **`Index.html`**.
4. (Recommended) Project Settings → set the time zone to **Asia/Kolkata**.
5. **Deploy → New deployment → Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone within your organisation** (or "Anyone with the link")
6. Authorize when prompted (Sheets + Drive read access), open the Web app URL. Done.

> Opening `Index.html` directly in a browser (outside Apps Script) runs it with built-in
> **demo data** — useful for previewing the UI before deployment.

## How it stays in sync

- The client polls a lightweight `getVersion()` (file last-modified fingerprint) every **60 s**;
  when the sheets change, it silently pulls a fresh snapshot and re-renders.
- Server responses are cached for 120 s (`CacheService`) so many viewers don't hammer the sheets.
- The ⟳ button forces an immediate refresh.

## How it adapts to schema changes

Nothing is hardcoded to a tab or column name:

- **Sheet types** (transactions / sellers / buyers / demand / mapping / review) are inferred
  from *content signatures* — which roles a sheet's columns play — with the tab name only as a hint.
- **Column roles** (Date, Region, RH, POC, Seller, Buyer, Material, State, Status, Shipment
  Status, Tonnage, GMV, Targets, …) are detected by prioritized fuzzy header matching.
- **Review tabs** (`Metric | Target | Achieved | Ach % | LMTD | Growth` blocks per region)
  are parsed generically, wherever they appear.
- New tabs land automatically in the right section; unknown tabs are still fully available
  in the **Data Explorer** with search, sort and CSV export.
- Seller ↔ POC/RH/Region/State relationships are learned from the seller & mapping tabs and
  used to enrich transaction rows (that's how RH-wise and State-wise views work).

## What's on the page

1. **KPI strip** — GMV, Tonnage, Transactions, Active Sellers, Sellers Onboarded, Target Achieved. Every card drills to its rows.
2. **At a Glance** — the month in three plain-English lines + four business-health chips (Pace / Growth / Concentration / Data quality).
3. **POC Scorecard — KRAs** — the centrepiece. One card per POC: achievement vs monthly plan as the hero number (green = on pace, red = behind), plus six KRAs — Tonnage, GMV, Txns, Active sellers, Onboarded, Pending. Click any card for that owner's transactions; pick a POC in the filter to scope the whole dashboard to them.
4. **Target vs Achievement** — review-tab targets by region (demand-plan fallback).
5. **Operational Performance** — daily MTD vs LMTD trend.
6. **Where Volume Comes From** — tonnage by region and regional head.
7. **Procurement & Shipment** — status mix, realization, invoice coverage, stuck orders.
8. **Seller Intelligence** — funnel, new, inactive, top sellers.
9. **Buyer Intelligence** — top buyers, repeat buyers, payment terms.
10. **Attention Required** — exceptions engine (behind-plan POCs, stuck orders, inactive sellers, silent regions…).
11. **Data Explorer** — every worksheet, filtered, sortable, CSV-exportable.

Global filters: Vertical · Region · RH · POC · Seller · Buyer · Material · Status · State ·
date presets (Today / 7D / MTD / 30D / All / custom range) · free-text search.

## Configuration

Both knobs live at the top of `Code.gs`:

```js
var SOURCES = [
  { vertical: 'Metal',   id: '18zvAGqARKVyDpPElxoFDJwatt4xTgFTyjtqJ5gAGF-M' },
  { vertical: 'Plastic', id: '1glt36fhT1c5U-eE3-gRBfC2cMTnR289LbQBvuXF-CEc' }
];
var CACHE_SECONDS = 120;
```

Add a third vertical by adding one line to `SOURCES` — the UI picks it up automatically.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
