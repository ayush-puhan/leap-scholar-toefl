/**
 * TOEFL Batch Registration — backend for the registration form.
 *
 * Handles two kinds of events, both POSTed as JSON, both logged to the single
 * "Registrations" tab:
 *  - Registration (default / no "type" field): appends a new row.
 *  - Payment link click ("type": "payment_click"): finds that registrant's row
 *    (matched by email, falling back to phone) and fills in the "Payment Option
 *    Clicked" / "Last Payment Click Time" columns on it. If no matching row is
 *    found, a new row is appended so the click isn't lost.
 *    Note: this tracks CLICKS on the payment link, not confirmed payment — the
 *    actual transaction happens on Leap Scholar's payment page, outside this
 *    script's visibility. Reconcile against your payment gateway for who actually paid.
 *
 * SETUP:
 * 1. Create (or open) a Google Sheet to collect registrations.
 * 2. Extensions > Apps Script. Delete any starter code and paste this file in.
 * 3. Click Deploy > New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into the APPS_SCRIPT_URL constant
 *    inside the <script> block near the top of index.html.
 * 5. Re-deploy (Deploy > Manage deployments > Edit > New version) any time
 *    you change this file — editing alone does not update a live deployment.
 */

const REG_SHEET_NAME = "Registrations";
const REG_HEADERS = [
  "Timestamp", "Name", "Email", "Phone", "Source", "Page URL",
  "Payment Option Clicked", "Last Payment Click Time"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === "payment_click") {
      return logPaymentClick_(data);
    }
    return logRegistration_(data);
  } catch (error) {
    return jsonResponse_({ status: "error", message: error.toString() });
  }
}

function doGet(e) {
  return jsonResponse_({ status: "ok", message: "TOEFL registration endpoint is live." });
}

function logRegistration_(data) {
  const name = cleanString_(data.name);
  const email = cleanString_(data.email);
  const phone = cleanString_(data.phone);
  const source = cleanString_(data.source) || "TOEFL Batch Registration Website";
  const page = cleanString_(data.page);

  if (!name || !email || !phone) {
    return jsonResponse_({ status: "error", message: "Missing required fields." });
  }

  const sheet = getOrCreateSheet_(REG_SHEET_NAME, REG_HEADERS);
  sheet.appendRow([new Date(), name, email, phone, source, page, "", ""]);

  return jsonResponse_({ status: "success" });
}

function logPaymentClick_(data) {
  const name = cleanString_(data.name);
  const email = cleanString_(data.email);
  const phone = cleanString_(data.phone);
  const tier = cleanString_(data.tier);
  const amount = cleanString_(data.amount);
  const source = cleanString_(data.source);
  const page = cleanString_(data.page);

  const sheet = getOrCreateSheet_(REG_SHEET_NAME, REG_HEADERS);
  const label = tier + (amount ? " (₹" + amount + ")" : "");
  const now = new Date();

  const rowIndex = findLatestRegistrationRow_(sheet, email, phone);

  if (rowIndex) {
    const paymentCol = REG_HEADERS.indexOf("Payment Option Clicked") + 1;
    const timeCol = REG_HEADERS.indexOf("Last Payment Click Time") + 1;
    const existing = cleanString_(sheet.getRange(rowIndex, paymentCol).getValue());
    const newValue = existing ? existing + "; " + label : label;
    sheet.getRange(rowIndex, paymentCol).setValue(newValue);
    sheet.getRange(rowIndex, timeCol).setValue(now);
  } else {
    sheet.appendRow([now, name, email, phone, source, page, label, now]);
  }

  return jsonResponse_({ status: "success" });
}

// Searches column B (Email) then column D (Phone) from the bottom up, so a
// person who registered more than once gets their most recent row updated.
function findLatestRegistrationRow_(sheet, email, phone) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const emailCol = REG_HEADERS.indexOf("Email") + 1;
  const phoneCol = REG_HEADERS.indexOf("Phone") + 1;
  const numRows = lastRow - 1;
  const emails = sheet.getRange(2, emailCol, numRows, 1).getValues();
  const phones = sheet.getRange(2, phoneCol, numRows, 1).getValues();

  const targetEmail = email.toLowerCase();
  for (let i = numRows - 1; i >= 0; i--) {
    const rowEmail = cleanString_(emails[i][0]).toLowerCase();
    const rowPhone = cleanString_(phones[i][0]);
    if ((targetEmail && rowEmail === targetEmail) || (phone && rowPhone === phone)) {
      return i + 2; // data starts at row 2; i is 0-indexed within that range
    }
  }
  return null;
}

function getOrCreateSheet_(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  } else {
    // Migrate older sheets (fewer columns) up to the current header set.
    const existingCount = sheet.getLastColumn();
    if (existingCount < headers.length) {
      const missing = headers.slice(existingCount);
      const range = sheet.getRange(1, existingCount + 1, 1, missing.length);
      range.setValues([missing]);
      range.setFontWeight("bold");
    }
  }
  return sheet;
}

function cleanString_(value) {
  return (value || "").toString().trim();
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
