/**
 * ════════════════════════════════════════════════════════════════
 *   OMP EXECUTIVE CONTROL TOWER — SERVER  (Code.gs)
 * ════════════════════════════════════════════════════════════════
 *   The server has exactly ONE job: read every visible worksheet
 *   from the source spreadsheets and hand the raw grids to the
 *   dashboard, untouched.
 *
 *   ALL intelligence — schema detection, KPI math, filters,
 *   insights — lives in Index.html. That is why new tabs or new
 *   columns added to the Google Sheets need no code changes here.
 *
 *   Project files:  Code.gs (this file)  +  Index.html
 *   Deploy:         Deploy → New deployment → Web app
 * ════════════════════════════════════════════════════════════════
 */

var SOURCES = [
  { vertical: 'Metal',   id: '18zvAGqARKVyDpPElxoFDJwatt4xTgFTyjtqJ5gAGF-M' },
  { vertical: 'Plastic', id: '1glt36fhT1c5U-eE3-gRBfC2cMTnR289LbQBvuXF-CEc' }
];

// Snapshots are cached long (max allowed = 6h). Freshness is NOT sacrificed:
// the client polls getVersion() every 60s and forces a re-read the instant the
// sheets change — so between edits, every load is served fast from cache.
var CACHE_SECONDS       = 21600; // 6 hours
var MAX_ROWS_PER_SHEET  = 5000;  // safety cap so a huge tab cannot break the payload


/** Serves the dashboard. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('KRA / KPI Tracker (Operations)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Cheap fingerprint of the source files (their last-modified times).
 * The client polls this every minute; when it changes, it pulls a
 * fresh snapshot — that is the real-time sync loop.
 */
function getVersion() {
  return SOURCES.map(function (s) {
    try { return DriveApp.getFileById(s.id).getLastUpdated().getTime(); }
    catch (e) { return 'na'; }
  }).join('|');
}


/**
 * The one data endpoint. Returns the entire snapshot as a JSON string:
 *   { version, fetchedAt,
 *     verticals: [ { vertical, title, error?, sheets:[ { name, values } ] } ] }
 */
function getDashboardData(forceRefresh) {
  var cache = CacheService.getScriptCache();

  if (!forceRefresh) {
    var cached = cacheRead_(cache);
    if (cached) return cached;
  }

  var snapshot = {
    version:   getVersion(),
    fetchedAt: new Date().toISOString(),
    verticals: SOURCES.map(readSpreadsheet_)
  };

  var json = JSON.stringify(snapshot);
  cacheWrite_(cache, json);
  return json;
}


/** Reads every visible sheet of one spreadsheet into raw value grids. */
function readSpreadsheet_(source) {
  try {
    var ss = SpreadsheetApp.openById(source.id);
    var sheets = [];
    ss.getSheets().forEach(function (sh) {
      if (sh.isSheetHidden()) return;
      var values = sh.getDataRange().getValues();
      if (values.length > MAX_ROWS_PER_SHEET) values = values.slice(0, MAX_ROWS_PER_SHEET);
      sheets.push({
        name:   sh.getName(),
        values: values.map(function (row) { return row.map(cleanCell_); })
      });
    });
    return { vertical: source.vertical, title: ss.getName(), sheets: sheets };
  } catch (e) {
    return { vertical: source.vertical, title: source.vertical, error: String(e), sheets: [] };
  }
}


/**
 * Dates → "yyyy-MM-dd HH:mm:ss" strings (google.script.run cannot
 * serialize Date objects). Strings are trimmed; numbers pass through.
 */
function cleanCell_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  }
  if (typeof v === 'string') return v.trim();
  return v;
}


/* ────────────────────────────────────────────────────────────────
   CacheService holds max ~100KB per key, so the snapshot is stored
   in chunks. If it ever outgrows the cache, caching is skipped and
   every call simply reads the sheets live — correct, just slower.
   ──────────────────────────────────────────────────────────────── */

function cacheWrite_(cache, json) {
  try {
    var SIZE = 90000;
    var n = Math.ceil(json.length / SIZE);
    if (n > 90) return;                               // beyond cache capacity
    var chunks = { omp_n: String(n) };
    for (var i = 0; i < n; i++) chunks['omp_' + i] = json.substr(i * SIZE, SIZE);
    cache.putAll(chunks, CACHE_SECONDS);
  } catch (e) { /* caching is best-effort */ }
}

function cacheRead_(cache) {
  var n = Number(cache.get('omp_n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push('omp_' + i);
  var got = cache.getAll(keys);
  var json = '';
  for (var j = 0; j < n; j++) {
    if (got['omp_' + j] == null) return null;         // a chunk expired
    json += got['omp_' + j];
  }
  return json;
}
