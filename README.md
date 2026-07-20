# OMP Executive Control Tower — Metals & Plastics

A single-page **Executive Operations Control Tower** for the Open Marketplace (OMP) team.
It connects live to the two Google Sheets workbooks (Metal + Plastic), treats them as the
single source of truth, and adapts automatically when tabs or columns are added.

**Two files. That's the whole app.**

| File | Role |
|------|------|
| `Code.gs` | Server — reads every visible worksheet from both spreadsheets and returns the raw grids. No business logic. |
| `Index.html` | The dashboard — schema detection, KPIs, filters, charts, drill-downs, insights. All intelligence lives here. |

---

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

1. Executive KPI strip (GMV, Tonnage, Transactions, Active Sellers, Onboarding, Target %, Balance, MTD vs LMTD) — every card drills down
2. Operational Brief — auto-generated insights + business-health chips
3. Target vs Achievement (review-tab targets; demand-plan fallback)
4. Operational Performance — daily MTD vs LMTD trend
5. POC Intelligence — leaderboard, plan achievement, workload, pending
6. Region / RH / State intelligence
7. Procurement & Shipment — status mix, realization, invoice coverage, stuck orders
8. Seller Intelligence — funnel, new, inactive, top sellers
9. Buyer Intelligence — top buyers, repeat buyers, payment terms
10. Live Activity feed
11. Attention Required — exceptions engine
12. Data Explorer — every worksheet, filtered, sortable, exportable

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
