/**
 * TOEFL Batch Registration — backend for the registration form.
 *
 * Handles two kinds of events, both POSTed as JSON:
 *  - Registration (default / no "type" field): logged to the "Registrations" tab.
 *  - Payment link click ("type": "payment_click"): logged to the "PaymentClicks" tab,
 *    recording which of the 3 tiers (token/partial/full) the registrant clicked.
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
const REG_HEADERS = ["Timestamp", "Name", "Email", "Phone", "Source", "Page URL"];

const CLICKS_SHEET_NAME = "PaymentClicks";
const CLICKS_HEADERS = ["Timestamp", "Name", "Email", "Phone", "Tier", "Amount", "Source", "Page URL"];

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
  sheet.appendRow([new Date(), name, email, phone, source, page]);

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

  const sheet = getOrCreateSheet_(CLICKS_SHEET_NAME, CLICKS_HEADERS);
  sheet.appendRow([new Date(), name, email, phone, tier, amount, source, page]);

  return jsonResponse_({ status: "success" });
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
