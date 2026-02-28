/**
 * GTSearch — Google Apps Script Export
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. Abra o Google Sheets "Gestao GT Group"
 *    URL: https://docs.google.com/spreadsheets/d/1Z5IWpfRtu_D5zwdNbB3u68BMjirKOsdF2t_SoZJLJ04
 * 2. Clique em "Extensões" → "Apps Script"
 * 3. Apague todo o código existente
 * 4. Cole este código completo
 * 5. Clique em "Salvar" (ícone de disquete)
 * 6. Clique em "Implantar" → "Nova implantação"
 * 7. Tipo: "App da Web"
 * 8. Executar como: "Eu (seu email)"
 * 9. Quem tem acesso: "Qualquer pessoa"
 * 10. Clique em "Implantar"
 * 11. Copie a URL gerada (começa com https://script.google.com/macros/s/...)
 * 12. Cole essa URL nas Settings do GTSearch (campo "Google Sheets Web App URL")
 */

const SHEET_NAME = 'GTSearch Export';
const HEADERS = [
  'Data Export',
  'Case #',
  'Parcel #',
  'Endereço',
  'Condado',
  'Acres',
  'Amount Due ($)',
  'Market Value ($)',
  'Reforma ($)',
  'Liens ($)',
  'Other Costs ($)',
  'Closing Cost %',
  'Clean Title ($)',
  'Max Bid ROI 30% ($)',
  'Max Bid ROI 40% ($)',
  'Max Bid ROI 50% ($)',
  'Profit ROI 30% ($)',
  'Profit ROI 40% ($)',
  'Profit ROI 50% ($)',
  'FEMA Zone',
  'Flood Risk',
  'Wetlands',
  'Zoning',
  'Land Use',
  'Risk Level',
  'Risk Score',
  'Status Leilão',
  'Lance Final ($)',
  'Comprador',
  'Data Leilão',
  'Notas'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get or create the export sheet
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      
      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#1e3a5f');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
    }
    
    const properties = data.properties || [];
    const exportDate = new Date().toLocaleDateString('pt-BR');
    
    const rows = properties.map(prop => [
      exportDate,
      prop.caseNumber || '',
      prop.parcelNumber || '',
      prop.address || '',
      prop.county || '',
      prop.acres || '',
      prop.amountDue || '',
      prop.marketValue || '',
      prop.reforma || '',
      prop.liens || '',
      prop.otherCosts || '',
      prop.closingCostPct || '',
      prop.cleanTitle || '',
      prop.maxBid30 || '',
      prop.maxBid40 || '',
      prop.maxBid50 || '',
      prop.profit30 || '',
      prop.profit40 || '',
      prop.profit50 || '',
      prop.femaZone || '',
      prop.floodRisk || '',
      prop.wetlands || '',
      prop.zoning || '',
      prop.landUse || '',
      prop.riskLevel || '',
      prop.riskScore || '',
      prop.auctionStatus || '',
      prop.finalBid || '',
      prop.buyer || '',
      prop.auctionDate || '',
      prop.notes || ''
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, HEADERS.length);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, exported: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'GTSearch Export API is running',
      sheet: SHEET_NAME,
      version: '1.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
