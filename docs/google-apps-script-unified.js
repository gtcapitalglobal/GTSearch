/****************************************************
 * CONFIGURACAO GERAL - AJUSTAR APENAS O NECESSARIO
 ****************************************************/

// Aba do Forms (origem das respostas)
const FORM_SHEET_NAME = 'Respostas ao formulario';

// Aba operacional de contratos (PSA + CFD)
const PSA_SHEET_NAME = 'PSA CFD Personal';

/**
 * Mapeamento das colunas da aba PSA CFD Personal
 * (1 = coluna A, 2 = coluna B, etc.)
 */
const PSA_CONFIG = {
  SHEET_NAME: PSA_SHEET_NAME,

  COL_BUYER1_NAME: 1,        // A - Buyer 1 Name
  COL_BUYER2_NAME: 2,        // B - Buyer 2 Name
  COL_BUYER1_EMAIL: 3,       // C - Buyer 1 Email
  COL_BUYER2_EMAIL: 4,       // D - Buyer 2 Email
  COL_BUYER1_ADDRESS: 5,     // E - Buyer 1 Address
  COL_BUYER2_ADDRESS: 6,     // F - Buyer 2 Address
  COL_PROPERTY_ADDRESS: 7,   // G - Property Address
  COL_PARCEL_ID: 8,          // H - Parcel ID
  COL_LEGAL_DESCRIPTION: 9,  // I - Legal Description
  COL_PURCHASE_PRICE: 10,    // J - PURCHASE_PRICE
  COL_DOWN_PAYMENT: 11,      // K - DOWN_PAYMENT
  COL_BALANCE: 12,           // L - BALANCE
  COL_MONTHLY_PAYMENT: 13,   // M - MONTHLY_PAYMENT
  COL_NUM_INSTALLMENTS: 14,  // N - NUMBER_OF_INSTALLMENTS
  COL_EFFECTIVE_DATE: 15,    // O - Effective Date (usado no CFD)
  COL_FIRST_PAYMENT_DATE: 16,// P - First Payment Date (usado no CFD)
  COL_PSA_DOC_LINK: 17,      // Q - Link Doc PSA
  COL_PSA_PDF_LINK: 18,      // R - Link PDF PSA
  COL_CFD_DOC_LINK: 19,      // S - Link Doc CFD
  COL_CFD_PDF_LINK: 20,      // T - Link PDF CFD

  // IDs fixos (PSA)
  PSA_TEMPLATE_ID: '1aIczaDJCk7y4lnV5U-J3J15UE33onIEFG67SWcz0TT4',
  PSA_FOLDER_ID:   '1u9PUHg8ECx9p6uxdH-ZMNkMjxYYLLure'
};

// Config CFD (usa a mesma aba, mas template/pasta diferentes)
const CFD_CONFIG = {
  SHEET_NAME: PSA_SHEET_NAME,

  COL_BUYER1_NAME: PSA_CONFIG.COL_BUYER1_NAME,
  COL_BUYER2_NAME: PSA_CONFIG.COL_BUYER2_NAME,
  COL_BUYER1_EMAIL: PSA_CONFIG.COL_BUYER1_EMAIL,
  COL_BUYER2_EMAIL: PSA_CONFIG.COL_BUYER2_EMAIL,
  COL_BUYER1_ADDRESS: PSA_CONFIG.COL_BUYER1_ADDRESS,
  COL_BUYER2_ADDRESS: PSA_CONFIG.COL_BUYER2_ADDRESS,
  COL_PROPERTY_ADDRESS: PSA_CONFIG.COL_PROPERTY_ADDRESS,
  COL_PARCEL_ID: PSA_CONFIG.COL_PARCEL_ID,
  COL_LEGAL_DESCRIPTION: PSA_CONFIG.COL_LEGAL_DESCRIPTION,
  COL_PURCHASE_PRICE: PSA_CONFIG.COL_PURCHASE_PRICE,
  COL_DOWN_PAYMENT: PSA_CONFIG.COL_DOWN_PAYMENT,
  COL_BALANCE: PSA_CONFIG.COL_BALANCE,
  COL_MONTHLY_PAYMENT: PSA_CONFIG.COL_MONTHLY_PAYMENT,
  COL_NUM_INSTALLMENTS: PSA_CONFIG.COL_NUM_INSTALLMENTS,
  COL_EFFECTIVE_DATE: PSA_CONFIG.COL_EFFECTIVE_DATE,
  COL_FIRST_PAYMENT_DATE: PSA_CONFIG.COL_FIRST_PAYMENT_DATE,
  COL_CFD_DOC_LINK: PSA_CONFIG.COL_CFD_DOC_LINK,
  COL_CFD_PDF_LINK: PSA_CONFIG.COL_CFD_PDF_LINK,

  // IDs fixos (CFD)
  CFD_TEMPLATE_ID: '1U0fha2knQ-pXQMNB6jyHBY5d2UVG5_HmmQI15er7jNY',
  CFD_FOLDER_ID:   '1NFcFDGrMo3rdpRYsBQqWSgDYLKYVyVZO'
};


/****************************************************
 * MENU INICIAL
 ****************************************************/

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('GT Lands')
    .addItem('Importar dados do formulario', 'importarDadosDoFormulario')
    .addSeparator()
    .addItem('Gerar PSA', 'gerarPSA')
    .addItem('Gerar Contract for Deed', 'gerarContractForDeed')
    .addToUi();
}


/****************************************************
 * 1) IMPORTAR DADOS DO FORMULARIO -> PSA CFD Personal
 ****************************************************/

function importarDadosDoFormulario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const formSheet = ss.getSheetByName(FORM_SHEET_NAME);
  const targetSheet = ss.getSheetByName(PSA_CONFIG.SHEET_NAME);

  if (!formSheet) {
    ui.alert('Aba "' + FORM_SHEET_NAME + '" nao encontrada.');
    return;
  }
  if (!targetSheet) {
    ui.alert('Aba "' + PSA_CONFIG.SHEET_NAME + '" nao encontrada.');
    return;
  }

  const activeSheet = ss.getActiveSheet();
  if (activeSheet.getName() !== formSheet.getName()) {
    ui.alert('Selecione uma linha na aba "' + FORM_SHEET_NAME + '" para importar.');
    return;
  }

  const row = activeSheet.getActiveCell().getRow();
  if (row <= 1) {
    ui.alert('Selecione uma linha de dados (abaixo do cabecalho).');
    return;
  }

  // Le a linha inteira do Forms
  const lastCol = formSheet.getLastColumn();
  const values = formSheet.getRange(row, 1, 1, lastCol).getValues()[0];

  // Mapeamento das colunas do Forms
  const timestamp           = values[0];  // A
  const fullName            = values[1];  // B
  const mobile              = values[2];  // C
  const email               = values[3];  // D
  const personalOrBusiness  = values[4];  // E
  const coBuyerFullName     = values[5];  // F
  const coBuyerEmail        = values[6];  // G
  const businessName        = values[7];  // H
  const representativeName  = values[8];  // I
  const streetAddress       = values[9];  // J
  const city                = values[10]; // K
  const state               = values[11]; // L
  const zipCode             = values[12]; // M
  const driverLicense       = values[13]; // N
  const willHaveCobuyer     = values[14]; // O (Yes/No)
  const preferredPayment    = values[15]; // P

  if (!fullName) {
    ui.alert('O registro selecionado nao possui "Full Name".');
    return;
  }

  // Monta endereco completo do comprador
  const buyer1Address = [
    streetAddress,
    city,
    state,
    zipCode
  ].filter(Boolean).join(', ');

  // Co-buyer so se marcado como Yes e tiver nome
  let buyer2Name  = '';
  let buyer2Email = '';

  const cobuyerFlag = (willHaveCobuyer || '').toString().toLowerCase();
  if (cobuyerFlag.startsWith('yes') || cobuyerFlag.startsWith('sim')) {
    buyer2Name = coBuyerFullName || '';
    buyer2Email = coBuyerEmail || '';
  }

  // Monta linha de destino na aba PSA CFD Personal
  const targetRow = targetSheet.getLastRow() + 1;
  const rowData = new Array(20).fill('');

  rowData[PSA_CONFIG.COL_BUYER1_NAME - 1]     = fullName;
  rowData[PSA_CONFIG.COL_BUYER2_NAME - 1]     = buyer2Name;
  rowData[PSA_CONFIG.COL_BUYER1_EMAIL - 1]    = email;
  rowData[PSA_CONFIG.COL_BUYER2_EMAIL - 1]    = buyer2Email;
  rowData[PSA_CONFIG.COL_BUYER1_ADDRESS - 1]  = buyer1Address;
  // COL_BUYER2_ADDRESS fica em branco por enquanto

  targetSheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);

  ss.toast('Dados importados para a aba "' + PSA_CONFIG.SHEET_NAME + '" (linha ' + targetRow + ').', 'GT Lands', 5);
}


/****************************************************
 * 2) GERAR PSA - ABRE POPUP PARA DADOS DA PROPRIEDADE
 ****************************************************/

function gerarPSA() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getSheetByName(PSA_CONFIG.SHEET_NAME);

  if (!sheet) {
    ui.alert('Aba "' + PSA_CONFIG.SHEET_NAME + '" nao encontrada.');
    return;
  }

  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    ui.alert('Selecione uma linha com dados na aba "' + PSA_CONFIG.SHEET_NAME + '".');
    return;
  }

  const rowValues = sheet.getRange(row, 1, 1, 20).getValues()[0];

  const buyer1Name    = rowValues[PSA_CONFIG.COL_BUYER1_NAME - 1];
  const buyer1Email   = rowValues[PSA_CONFIG.COL_BUYER1_EMAIL - 1];
  const buyer1Address = rowValues[PSA_CONFIG.COL_BUYER1_ADDRESS - 1];

  // Valores ja salvos (para pre-preencher o formulario, se quiser)
  const propertyAdr     = rowValues[PSA_CONFIG.COL_PROPERTY_ADDRESS - 1] || '';
  const parcelId        = rowValues[PSA_CONFIG.COL_PARCEL_ID - 1] || '';
  const legalDesc       = rowValues[PSA_CONFIG.COL_LEGAL_DESCRIPTION - 1] || '';
  const downPayment     = rowValues[PSA_CONFIG.COL_DOWN_PAYMENT - 1] || '';
  const monthlyPayment  = rowValues[PSA_CONFIG.COL_MONTHLY_PAYMENT - 1] || '';
  const numInstallments = rowValues[PSA_CONFIG.COL_NUM_INSTALLMENTS - 1] || '';

  if (!buyer1Name || !buyer1Email || !buyer1Address) {
    ui.alert('Preencha pelo menos Buyer 1 Name, Buyer 1 Email e Buyer 1 Address antes de gerar o PSA.');
    return;
  }

  // HTML do formulario
  const html = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 16px 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 18px; margin-top: 16px; margin-bottom: 8px; }
          label { display: block; margin-top: 10px; font-weight: bold; }
          input[type="text"], input[type="number"], textarea, select {
            width: 100%; box-sizing: border-box; padding: 6px 8px; margin-top: 4px;
          }
          textarea { min-height: 70px; }
          .buttons { margin-top: 16px; }
          button { padding: 6px 16px; }
        </style>
      </head>
      <body>
        <h1>GT Lands - Dados para PSA</h1>
        <h2>Dados da Propriedade</h2>
        <form id="psaForm" onsubmit="handleSubmit(event)">
          <label>Endereco da Propriedade:</label>
          <input type="text" id="propertyAddress" value="${propertyAdr}" required>
          <label>Parcel Number:</label>
          <input type="text" id="parcelId" value="${parcelId}" required>
          <label>Legal Description:</label>
          <textarea id="legalDescription" required>${legalDesc}</textarea>
          <label>Down Payment (USD):</label>
          <input type="number" id="downPayment" value="${downPayment}" required>
          <label>Valor da Parcela (USD):</label>
          <input type="number" id="monthlyPayment" value="${monthlyPayment}" required>
          <label>Quantidade de Parcelas:</label>
          <input type="number" id="installments" value="${numInstallments}" required>
          <label>Dia dos Pagamentos Mensais:</label>
          <select id="dueDay" required>
            <option value="">Selecione...</option>
            <option value="15">Todo dia 15</option>
            <option value="25">Todo dia 25</option>
          </select>
          <div class="buttons">
            <button type="submit">Gerar PSA</button>
            <button type="button" onclick="google.script.host.close();" style="margin-left:8px;">Cancelar</button>
          </div>
        </form>
        <script>
          function handleSubmit(e) {
            e.preventDefault();
            const data = {
              row: ${row},
              propertyAddress: document.getElementById('propertyAddress').value,
              parcelId: document.getElementById('parcelId').value,
              legalDescription: document.getElementById('legalDescription').value,
              downPayment: document.getElementById('downPayment').value,
              monthlyPayment: document.getElementById('monthlyPayment').value,
              installments: document.getElementById('installments').value,
              dueDay: document.getElementById('dueDay').value
            };
            google.script.run
              .withSuccessHandler(function() { google.script.host.close(); })
              .processPSAForm(data);
          }
        </script>
      </body>
    </html>
  `).setWidth(600).setHeight(500);

  ui.showModalDialog(html, 'GT Lands - Dados para PSA');
}

/**
 * Funcao chamada pelo formulario HTML para:
 * - salvar os dados na linha
 * - gerar o PSA (DOC + PDF)
 * - abrir popup final com link e mensagem
 */
function processPSAForm(formData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(PSA_CONFIG.SHEET_NAME);
  const row = Number(formData.row);

  const rowValues = sheet.getRange(row, 1, 1, 20).getValues()[0];

  const buyer1Name    = rowValues[PSA_CONFIG.COL_BUYER1_NAME - 1];
  const buyer2Name    = rowValues[PSA_CONFIG.COL_BUYER2_NAME - 1];
  const buyer1Email   = rowValues[PSA_CONFIG.COL_BUYER1_EMAIL - 1];
  const buyer1Address = rowValues[PSA_CONFIG.COL_BUYER1_ADDRESS - 1];

  // Dados vindos do formulario
  const propertyAdr     = (formData.propertyAddress || '').trim();
  const parcelId        = (formData.parcelId || '').trim();
  const legalDesc       = (formData.legalDescription || '').trim();
  const downPayment     = formData.downPayment || '';
  const monthlyPayment  = formData.monthlyPayment || '';
  const numInstallments = formData.installments || '';
  const dueDay          = (formData.dueDay || '').trim();

  if (!propertyAdr || !parcelId) {
    SpreadsheetApp.getUi().alert('Endereco da propriedade e Parcel Number sao obrigatorios.');
    return;
  }

  // Atualiza a linha na planilha com os dados informados
  sheet.getRange(row, PSA_CONFIG.COL_PROPERTY_ADDRESS).setValue(propertyAdr);
  sheet.getRange(row, PSA_CONFIG.COL_PARCEL_ID).setValue(parcelId);
  sheet.getRange(row, PSA_CONFIG.COL_LEGAL_DESCRIPTION).setValue(legalDesc);
  sheet.getRange(row, PSA_CONFIG.COL_DOWN_PAYMENT).setValue(downPayment);
  sheet.getRange(row, PSA_CONFIG.COL_MONTHLY_PAYMENT).setValue(monthlyPayment);
  sheet.getRange(row, PSA_CONFIG.COL_NUM_INSTALLMENTS).setValue(numInstallments);

  // Calcula PURCHASE_PRICE e BALANCE
  let purchasePrice = rowValues[PSA_CONFIG.COL_PURCHASE_PRICE - 1];
  let balance       = rowValues[PSA_CONFIG.COL_BALANCE - 1];

  if (!purchasePrice && downPayment && monthlyPayment && numInstallments) {
    const dp  = Number(downPayment);
    const mp  = Number(monthlyPayment);
    const qty = Number(numInstallments);
    if (!isNaN(dp) && !isNaN(mp) && !isNaN(qty)) {
      purchasePrice = dp + (mp * qty);
      balance = mp * qty;
      sheet.getRange(row, PSA_CONFIG.COL_PURCHASE_PRICE).setValue(purchasePrice);
      sheet.getRange(row, PSA_CONFIG.COL_BALANCE).setValue(balance);
    }
  }

  purchasePrice = purchasePrice || '';
  balance       = balance || '';

  const buyerFullName = buyer2Name ? (buyer1Name + ' and ' + buyer2Name) : buyer1Name;

  // Cria copia do template de PSA
  const templateFile = DriveApp.getFileById(PSA_CONFIG.PSA_TEMPLATE_ID);
  const folder = DriveApp.getFolderById(PSA_CONFIG.PSA_FOLDER_ID);

  const docName = 'PSA - ' + buyer1Name + ' - ' + propertyAdr;
  const newFile = templateFile.makeCopy(docName, folder);
  const doc = DocumentApp.openById(newFile.getId());
  const body = doc.getBody();

  const replacements = {
    '{{Name}}': buyer1Name,
    '{{Buyer1PrintedName}}': buyer1Name,
    '{{Buyer2PrintedName}}': buyer2Name || '',
    '{{Address}}': buyer1Address || '',
    '{{Email}}': buyer1Email || '',
    '{{Phone}}': '',
    '{{PropertyAddress}}': propertyAdr || '',
    '{{ParcelID}}': parcelId || '',
    '{{LegalDescription}}': legalDesc || '',
    '{{PURCHASE_PRICE}}': purchasePrice || '',
    '{{DOWN_PAYMENT}}': downPayment || '',
    '{{BALANCE}}': balance || '',
    '{{NUMBER_OF_INSTALLMENTS}}': numInstallments || '',
    '{{MONTHLY_PAYMENT}}': monthlyPayment || '',
    '{{DUE_DAY}}': dueDay || ''
  };

  replaceAllInBody_(body, replacements);
  doc.saveAndClose();

  // Gera PDF
  const pdfBlob = newFile.getAs(MimeType.PDF);
  const pdfName = docName + '.pdf';
  const pdfFile = folder.createFile(pdfBlob).setName(pdfName);

  // Salva links na planilha
  sheet.getRange(row, PSA_CONFIG.COL_PSA_DOC_LINK).setValue(newFile.getUrl());
  sheet.getRange(row, PSA_CONFIG.COL_PSA_PDF_LINK).setValue(pdfFile.getUrl());

  mostrarPSAPopup_({
    buyerNames: buyerFullName,
    email: buyer1Email,
    propertyAddress: propertyAdr,
    psaLink: pdfFile.getUrl()
  });

  ss.toast('PSA gerado com sucesso.', 'GT Lands', 5);
}


/****************************************************
 * 3) GERAR CONTRACT FOR DEED (CFD)
 ****************************************************/

function gerarContractForDeed() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const sheet = ss.getSheetByName(CFD_CONFIG.SHEET_NAME);

  if (!sheet) {
    ui.alert('Aba "' + CFD_CONFIG.SHEET_NAME + '" nao encontrada.');
    return;
  }

  const row = sheet.getActiveCell().getRow();
  if (row <= 1) {
    ui.alert('Selecione uma linha com dados na aba "' + CFD_CONFIG.SHEET_NAME + '".');
    return;
  }

  const rowValues = sheet.getRange(row, 1, 1, 20).getValues()[0];

  const buyer1Name    = rowValues[CFD_CONFIG.COL_BUYER1_NAME - 1];
  const buyer2Name    = rowValues[CFD_CONFIG.COL_BUYER2_NAME - 1];
  const buyer1Email   = rowValues[CFD_CONFIG.COL_BUYER1_EMAIL - 1];
  const buyer1Address = rowValues[CFD_CONFIG.COL_BUYER1_ADDRESS - 1];
  const propertyAdr   = rowValues[CFD_CONFIG.COL_PROPERTY_ADDRESS - 1];
  const parcelId      = rowValues[CFD_CONFIG.COL_PARCEL_ID - 1];
  const legalDesc     = rowValues[CFD_CONFIG.COL_LEGAL_DESCRIPTION - 1];
  const purchasePrice = rowValues[CFD_CONFIG.COL_PURCHASE_PRICE - 1];
  const downPayment   = rowValues[CFD_CONFIG.COL_DOWN_PAYMENT - 1];
  const balance       = rowValues[CFD_CONFIG.COL_BALANCE - 1];
  const monthlyPayment= rowValues[CFD_CONFIG.COL_MONTHLY_PAYMENT - 1];
  const numInstallments = rowValues[CFD_CONFIG.COL_NUM_INSTALLMENTS - 1];

  let effectiveDate   = rowValues[CFD_CONFIG.COL_EFFECTIVE_DATE - 1];
  let firstPayDate    = rowValues[CFD_CONFIG.COL_FIRST_PAYMENT_DATE - 1];

  if (!buyer1Name || !propertyAdr || !parcelId || !legalDesc ||
      !purchasePrice || !downPayment || !balance || !monthlyPayment || !numInstallments) {
    ui.alert('Preencha todos os dados financeiros e do imovel (incluindo Legal Description) antes de gerar o Contract for Deed.');
    return;
  }

  const tz = ss.getSpreadsheetTimeZone() || 'America/New_York';

  if (!effectiveDate) {
    const today = new Date();
    effectiveDate = Utilities.formatDate(today, tz, 'MM/dd/yyyy');
    sheet.getRange(row, CFD_CONFIG.COL_EFFECTIVE_DATE).setValue(effectiveDate);
  }

  if (!firstPayDate) {
    const resp = ui.prompt(
      'First Payment Date',
      'Digite a data do primeiro pagamento (formato MM/DD/YYYY):',
      ui.ButtonSet.OK_CANCEL
    );
    if (resp.getSelectedButton() !== ui.Button.OK) {
      ui.alert('Operacao cancelada.');
      return;
    }
    firstPayDate = resp.getResponseText().trim();
    if (!firstPayDate) {
      ui.alert('Data invalida.');
      return;
    }
    sheet.getRange(row, CFD_CONFIG.COL_FIRST_PAYMENT_DATE).setValue(firstPayDate);
  }

  const buyerFullName = buyer2Name ? (buyer1Name + ' and ' + buyer2Name) : buyer1Name;

  // Cria copia do template de CFD
  const templateFile = DriveApp.getFileById(CFD_CONFIG.CFD_TEMPLATE_ID);
  const folder = DriveApp.getFolderById(CFD_CONFIG.CFD_FOLDER_ID);

  const docName = 'CFD - ' + buyerFullName + ' - ' + propertyAdr;
  const newFile = templateFile.makeCopy(docName, folder);
  const doc = DocumentApp.openById(newFile.getId());
  const body = doc.getBody();

  const replacements = {
    '{{EFFECTIVE_DATE}}': effectiveDate,
    '{{BUYER_NAME}}': buyerFullName,
    '{{BUYER_ADDRESS}}': buyer1Address || '',
    '{{LEGAL_DESCRIPTION}}': legalDesc || '',
    '{{PARCEL_ID}}': parcelId || '',
    '{{PROPERTY_ADDRESS}}': propertyAdr || '',
    '{{PURCHASE_PRICE}}': purchasePrice || '',
    '{{DOWN_PAYMENT}}': downPayment || '',
    '{{BALANCE}}': balance || '',
    '{{MONTHLY_PAYMENT}}': monthlyPayment || '',
    '{{NUMBER_OF_INSTALLMENTS}}': numInstallments || '',
    '{{FIRST_PAYMENT_DATE}}': firstPayDate || '',
    '{{BUYER_NAME_2}}': buyer2Name || ''
  };

  replaceAllInBody_(body, replacements);
  doc.saveAndClose();

  // Gera PDF
  const pdfBlob = newFile.getAs(MimeType.PDF);
  const pdfName = docName + '.pdf';
  const pdfFile = folder.createFile(pdfBlob).setName(pdfName);

  // Salva links na planilha
  sheet.getRange(row, CFD_CONFIG.COL_CFD_DOC_LINK).setValue(newFile.getUrl());
  sheet.getRange(row, CFD_CONFIG.COL_CFD_PDF_LINK).setValue(pdfFile.getUrl());

  mostrarCFDPopup_({
    buyerNames: buyerFullName,
    email: buyer1Email,
    propertyAddress: propertyAdr,
    cfdLink: pdfFile.getUrl()
  });

  ss.toast('Contract for Deed gerado com sucesso.', 'GT Lands', 5);
}


/****************************************************
 * HELPERS: REPLACE & POPUPS
 ****************************************************/

function replaceAllInBody_(body, replacements) {
  for (var key in replacements) {
    if (replacements.hasOwnProperty(key)) {
      body.replaceText(key, replacements[key]);
    }
  }
}

// Popup com dados do PSA
function mostrarPSAPopup_(data) {
  var html = `
    <div style="font-family: Arial, sans-serif; padding:16px;">
      <h2>GT Lands - Dados para PSA</h2>
      <p><b>Nome(s):</b> ${data.buyerNames || ''}</p>
      <p><b>Email:</b> ${data.email || ''}</p>
      <p><b>Link do PSA (PDF):</b> <a href="${data.psaLink}" target="_blank">Abrir PSA</a></p>
      <p><b>Mensagem padrao:</b></p>
      <textarea id="msg" style="width:100%;height:200px;">
Hi ${data.buyerNames || ''},

Here is your Purchase and Sale Agreement (PSA) for the property at ${data.propertyAddress || ''}.

Please review it carefully and sign it electronically. 
If you have any questions, just let me know.

Best regards,
Gustavo
GT Lands
      </textarea>
      <br><br>
      <button onclick="navigator.clipboard.writeText(document.getElementById('msg').value);">Copiar mensagem</button>
      <button onclick="google.script.host.close();" style="margin-left:8px;">Fechar</button>
    </div>
  `;
  var output = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(output, 'GT Lands - Dados para PSA');
}

// Popup com dados do CFD
function mostrarCFDPopup_(data) {
  var html = `
    <div style="font-family: Arial, sans-serif; padding:16px;">
      <h2>GT Lands - Dados para Contract for Deed</h2>
      <p><b>Nome(s):</b> ${data.buyerNames || ''}</p>
      <p><b>Email:</b> ${data.email || ''}</p>
      <p><b>Link do Contract for Deed (PDF):</b> <a href="${data.cfdLink}" target="_blank">Abrir Contract for Deed</a></p>
      <p><b>Mensagem padrao:</b></p>
      <textarea id="msg" style="width:100%;height:200px;">
Hi ${data.buyerNames || ''},

Attached is your Contract for Deed for the property at ${data.propertyAddress || ''}.

Please review it carefully and sign it electronically. 
If you have any questions, just let me know.

Best regards,
Gustavo
GT Lands
      </textarea>
      <br><br>
      <button onclick="navigator.clipboard.writeText(document.getElementById('msg').value);">Copiar mensagem</button>
      <button onclick="google.script.host.close();" style="margin-left:8px;">Fechar</button>
    </div>
  `;
  var output = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(output, 'GT Lands - Dados para Contract for Deed');
}


/****************************************************
 * GTSEARCH EXPORT - Web App API
 * Recebe dados da Tela 3 do GTSearch via POST
 * e grava na aba "GTSearch Export" desta planilha.
 *
 * COMO IMPLANTAR:
 * 1. Clique em "Implantar" -> "Nova implantacao"
 * 2. Tipo: "App da Web"
 * 3. Executar como: "Eu (seu email)"
 * 4. Quem tem acesso: "Qualquer pessoa"
 * 5. Copie a URL gerada e configure no GTSearch
 ****************************************************/

const GTSEARCH_SHEET_NAME = 'GTSearch Export';

const GTSEARCH_HEADERS = [
  'Data Export',
  'Case #',
  'Parcel #',
  'Endereco',
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
  'Status Leilao',
  'Lance Final ($)',
  'Comprador',
  'Data Leilao',
  'Notas'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Cria a aba se nao existir
    let sheet = ss.getSheetByName(GTSEARCH_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(GTSEARCH_SHEET_NAME);
      const headerRange = sheet.getRange(1, 1, 1, GTSEARCH_HEADERS.length);
      headerRange.setValues([GTSEARCH_HEADERS]);
      headerRange.setBackground('#1e3a5f');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(10);
      sheet.setFrozenRows(1);
    }

    const properties = data.properties || [];
    const exportDate = new Date().toLocaleDateString('pt-BR');

    const rows = properties.map(function(prop) {
      return [
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
      ];
    });

    if (rows.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, GTSEARCH_HEADERS.length).setValues(rows);
      sheet.autoResizeColumns(1, GTSEARCH_HEADERS.length);
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
      sheet: GTSEARCH_SHEET_NAME,
      version: '1.0'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
