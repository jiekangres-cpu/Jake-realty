// Paste this into Extensions > Apps Script inside your Google Sheet, then deploy as a Web app.
const HEADERS = ['Submitted','Tier','Name','Phone','Best time','Goal','Current property','Budget','Income','Residency','Timeline','Source'];

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  const d = JSON.parse(e.postData.contents);
  // Phone stored as text so the leading + or 0 is kept
  sheet.appendRow([d.submittedAt, d.tier, d.name, "'" + d.phone, d.when, d.goal, d.current,
                   d.budget, d.income, d.status, d.timeline, d.source]);
  return ContentService.createTextOutput('ok');
}
