/**
 * Headset Batteries — sync script for a Google Sheet.
 *
 * Paste this whole file into Extensions → Apps Script of the Google Sheet that
 * holds your data, set the passphrase in Project Settings → Script properties
 * (property name PASSPHRASE), and deploy it as a web app:
 * Execute as: Me, Who has access: Anyone. See SETUP.md for the steps.
 *
 * The sheet "records" has one row per record:
 *   id | updatedAt | syncedAt | type | json
 * syncedAt is this script's own clock (milliseconds) and tells each device
 * what changed since it last synced. json is the whole record.
 */

var SHEET_NAME = "records";
var HEADER = ["id", "updatedAt", "syncedAt", "type", "json"];

function doGet() {
  return reply({ ok: true, app: "headset-batteries", note: "Sync is working. The page talks to this address with POST." });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "The request wasn't valid JSON." });
  }

  var pass = PropertiesService.getScriptProperties().getProperty("PASSPHRASE");
  if (!pass) return reply({ ok: false, error: "The script has no PASSPHRASE set in Project Settings → Script properties." });
  if (req.pass !== pass) return reply({ ok: false, error: "Wrong passphrase." });

  if (req.op === "ping") return reply({ ok: true });
  if (req.op !== "sync") return reply({ ok: false, error: "Unknown request." });

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return reply({ ok: false, error: "The sheet is busy. Try again in a moment." });
  try {
    var sheet = getSheet();
    var last = sheet.getLastRow();
    var rows = last > 1 ? sheet.getRange(2, 1, last - 1, HEADER.length).getValues() : [];
    var result = applySync(rows, req, Date.now());
    if (result.changed) {
      sheet.getRange(2, 1, result.rows.length, HEADER.length).setValues(result.rows);
    }
    return reply({ ok: true, cursor: result.cursor, records: result.records });
  } finally {
    lock.releaseLock();
  }
}

/**
 * The sync rules, kept free of Sheet calls so they can be tested on their own.
 * rows:  the sheet's rows (without the header)
 * req:   { since: number, records: [record, ...] } from a device
 * now:   current time in ms
 * Each incoming record is stored if it's new, or if its updatedAt is newer than
 * the stored copy. The reply holds every record stored after `since`.
 */
function applySync(rows, req, now) {
  var index = {}, maxSynced = 0, i;
  for (i = 0; i < rows.length; i++) {
    index[String(rows[i][0])] = i;
    maxSynced = Math.max(maxSynced, Number(rows[i][2]) || 0);
  }
  // Always move forward, even if two requests land in the same millisecond
  var stamp = Math.max(now, maxSynced + 1);
  var changed = false;
  var incoming = req.records || [];

  for (i = 0; i < incoming.length; i++) {
    var r = incoming[i];
    if (!r || typeof r.id !== "string" || !r.id || typeof r.updatedAt !== "string") continue;
    var row = [r.id, r.updatedAt, stamp, String(r.type || ""), JSON.stringify(r)];
    var at = index[r.id];
    if (at === undefined) {
      index[r.id] = rows.length;
      rows.push(row);
      changed = true;
    } else if (r.updatedAt > storedUpdatedAt(rows[at])) {
      rows[at] = row;
      changed = true;
    }
  }

  var since = Number(req.since) || 0;
  var out = [];
  for (i = 0; i < rows.length; i++) {
    if ((Number(rows[i][2]) || 0) > since) {
      try { out.push(JSON.parse(rows[i][4])); } catch (err) { /* skip a damaged row */ }
    }
  }
  return { rows: rows, changed: changed, cursor: changed ? stamp : maxSynced, records: out };
}

// Read updatedAt from the stored JSON: the sheet may have turned the
// updatedAt cell into a date, but the JSON text stays exact
function storedUpdatedAt(row) {
  try { return String(JSON.parse(row[4]).updatedAt || ""); } catch (err) { return String(row[1] || ""); }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight("bold");
    sheet.setFrozenRows(1);
    // Keep ids, dates and JSON as plain text so the sheet doesn't reformat them
    sheet.getRange("A:B").setNumberFormat("@");
    sheet.getRange("D:E").setNumberFormat("@");
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
