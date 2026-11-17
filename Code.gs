/**
 * ============================================================================
 * INDOBAY TRADING CO — REAL-TIME STOCK TO GOOGLE DOC VALUATION SYNC ENGINE
 * (With Dynamic Fallback for Newly Added Google Doc Products)
 * ============================================================================
 * Architecture:
 * 1. Scans all product category tabs in the active Google Spreadsheet
 *    (automatically skipping non-inventory tabs like Dashboard / Sync Log).
 * 2. Dynamically detects "Item Name" and "Current Stock" columns per tab.
 * 3. First checks explicit SKU_RULES for exact mapping. If a new product is
 *    added to the Google Doc that isn't in SKU_RULES, automatically falls back
 *    to token + category matching (`calculateDynamicStockFallback_`).
 * 4. Sums all batch quantities (including 0-stock items -> 0,00).
 * 5. Updates Column 4 ("Общая стоимость / Total Valuation") and the bottom
 *    "ИТОГО / TOTAL" row in the target Google Doc under a concurrency lock.
 * ============================================================================
 */

const CONFIG = {
  // Replace with your Google Doc URL (paste the full URL from your browser)
  TARGET_DOC_URL: 'https://docs.google.com/document/d/1_5kjawm0wFJFTKwS-dLB6hx36qMIPT94jTkPby5YnBA/edit?tab=t.0',

  // Tabs in your spreadsheet that are NOT product inventory tabs (case-insensitive)
  EXCLUDED_TABS: [
    'dashboard',
    'sync log',
    'summary',
    'config',
    'settings',
    'каталог продукции'
  ],

  // Header keywords used to auto-detect columns across different category tabs
  ITEM_HEADER_KEYWORDS: ['item name', 'item', 'наименование', 'product'],
  STOCK_HEADER_KEYWORDS: ['current stock', 'stock', 'остаток', 'available'],

  // Lock timeout in milliseconds to prevent overlapping onEdit executions
  LOCK_TIMEOUT_MS: 20000
};

/**
 * Explicit SKU Mapping Dictionary for existing catalog items.
 * Key format: "CATEGORY_KEY::PROPOSAL_PRODUCT_NAME"
 */
const SKU_RULES = {
  // ── 1. OLEORESINS (ОЛЕОРЕЗИНЫ) ─────────────────────────────────────────────
  'OLEORESINS::ALLSPICE 30%':        { mustInclude: ['ALLSPICE', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::ALLSPICE 40%':        { mustInclude: ['ALLSPICE', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::BASIL 15%':           { mustInclude: ['BASIL', '15%'], mustExclude: ['OIL'] },
  'OLEORESINS::BLACK PEPPER 40/20':  { mustInclude: ['BLACK PEPPER', '40/20'], mustExclude: ['OIL'] },
  'OLEORESINS::CAPSICUM OR 6.6% OS': { mustInclude: ['CAPSICUM', '6.6%'], mustExclude: ['WS', 'W/S', 'WATER'] },
  'OLEORESINS::CARAWAY 30%':         { mustInclude: ['CARAWAY', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CARDAMOM 30%':        { mustInclude: ['CARDAMOM', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CARDAMOM 40%':        { mustInclude: ['CARDAMOM', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::CELERY 12%':          { mustInclude: ['CELERY'], mustExclude: ['OIL'] },
  'OLEORESINS::CINNAMON 40%':        { mustInclude: ['CINNAMON', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::CINNAMON 30%':        { mustInclude: ['CINNAMON', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CORIANDER 10%':       { mustInclude: ['CORIANDER', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::CUMIN (ZIRA) 30%':    { mustInclude: ['CUMIN', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 10%':          { mustInclude: ['GARLIC', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 20%':          { mustInclude: ['GARLIC', '20%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 50%':          { mustInclude: ['GARLIC', '50%'], mustExclude: ['OIL'] },
  'OLEORESINS::GINGER 30%':          { mustInclude: ['GINGER', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::GINGER 40%':          { mustInclude: ['GINGER', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::NUTMEG 30%':          { mustInclude: ['NUTMEG', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::NUTMEG 40%':          { mustInclude: ['NUTMEG', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::ONION 5%':            { mustInclude: ['ONION', '5%'], mustExclude: ['ROASTED', 'OIL'] },
  'OLEORESINS::ONION ROASTED':       { mustInclude: ['ONION', 'ROASTED'], mustExclude: ['OIL'] },
  'OLEORESINS::PAPRIKA 100000 CU':   { mustInclude: ['PAPRIKA', '100000'], mustExclude: ['WS', 'W/S'] },
  'OLEORESINS::PAPRIKA 40000CU OS':  { mustInclude: ['PAPRIKA', '40000'], mustExclude: ['WS', 'W/S', 'WATER'] },
  'OLEORESINS::PAPRIKA 80000 CU':    { mustInclude: ['PAPRIKA', '80000'], mustExclude: ['WS', 'W/S'] },
  'OLEORESINS::THYME 5%':            { mustInclude: ['THYME', '5%'], mustExclude: ['OIL', '15%'] },
  'OLEORESINS::TURMERIC 10%':        { mustInclude: ['TURMERIC', '10%'], mustExclude: ['OIL', '22%'] },
  'OLEORESINS::TURMERIC 22%':        { mustInclude: ['TURMERIC', '22%'], mustExclude: ['OIL', '10%'] },
  'OLEORESINS::JUNIPER OR OS':       { mustInclude: ['JUNIPER'], mustIncludeAny: ['OR', 'O/S', 'OS'], mustExclude: ['OIL'] },
  'OLEORESINS::ROSEMARY 6% OR OS':   { mustInclude: ['ROSEMARY', '6%'], mustExclude: ['OIL'] },

  // ── 2. WATER-SOLUBLE (ВОДОРАСТВОРИМЫЕ) ─────────────────────────────────────
  'WATER-SOLUBLE::CAPSICUM OR 6.6% WS': { mustInclude: ['CAPSICUM', '6.6%'], mustIncludeAny: ['WS', 'W/S', 'WATER'], mustExclude: ['OS', 'O/S'] },
  'WATER-SOLUBLE::PAPRIKA 40000 CU WS': { mustInclude: ['PAPRIKA', '40000'], mustIncludeAny: ['WS', 'W/S', 'WATER'], mustExclude: ['OS', 'O/S'] },

  // ── 3. NATURAL DYES (НАТУРАЛЬНЫЕ КРАСИТЕЛИ) ────────────────────────────────
  'NATURAL DYES::RED':                 { mustInclude: ['RED'], mustExclude: [] },
  'NATURAL DYES::YELLOW':              { mustInclude: ['YELLOW'], mustExclude: [] },
  'NATURAL DYES::BROWN':               { mustInclude: ['BROWN'], mustExclude: [] },
  'NATURAL DYES::GREEN (CHLOROPHYLL)': { mustIncludeAny: ['GREEN', 'CHLOROPHYLL'], mustExclude: [] },

  // ── 4. ESSENTIAL OILS (ЭФИРНЫЕ МАСЛА) ──────────────────────────────────────
  'ESSENTIAL OILS::CUMIN (CUMIN)': { mustInclude: ['CUMIN', 'OIL'], mustExclude: ['OR', 'O/S', '30%'] },
  'ESSENTIAL OILS::LEMON':         { mustInclude: ['LEMON', 'OIL'], mustExclude: ['LEMONGRASS', 'OR', 'O/S'] },
  'ESSENTIAL OILS::NUTMEG':        { mustInclude: ['NUTMEG', 'OIL'], mustExclude: ['OR', 'O/S', '30%', '40%'] },
  'ESSENTIAL OILS::BLACK PEPPER':  { mustInclude: ['BLACK PEPPER', 'OIL'], mustExclude: ['OR', 'O/S', '40/20'] },
  'ESSENTIAL OILS::GARLIC':        { mustInclude: ['GARLIC', 'OIL'], mustExclude: ['OR', 'O/S', '10%', '20%', '50%'] }
};

/**
 * Adds a manual sync menu when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 Indobay Doc Sync')
    .addItem('Sync Valuation to Google Doc Now', 'syncInventoryToProposalDoc')
    .addToUi();
}

/**
 * Installable onEdit trigger handler.
 * Runs automatically whenever any cell in any inventory tab is edited.
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e
 */
function handleInventoryEdit(e) {
  if (!e || !e.range) return;

  const sheetName = e.range.getSheet().getName().trim().toLowerCase();
  if (CONFIG.EXCLUDED_TABS.includes(sheetName)) {
    return; // Ignore edits made on Dashboard / Sync Log tabs
  }

  syncInventoryToProposalDoc();
}

/**
 * Main orchestrator: Reads all category tabs, calculates valuations
 * (using explicit rules + dynamic fallback), and updates the Google Doc table.
 */
function syncInventoryToProposalDoc() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) {
    console.warn('Sync skipped: Another sync execution is currently in progress.');
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rawInventory = collectInventoryAcrossAllTabs_(ss);
    const stockBySkuKey = aggregateStockByProposalSku_(rawInventory);

    updateProposalDocTable_(stockBySkuKey, rawInventory);
    console.log('Successfully synced stock valuations to Google Doc.');
  } catch (err) {
    console.error('Error syncing inventory to Google Doc: ' + err.stack);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Step 1: Scans all non-excluded tabs in the spreadsheet and extracts
 * { itemName, stockKg, tabName } records.
 */
function collectInventoryAcrossAllTabs_(ss) {
  const sheets = ss.getSheets();
  const records = [];

  for (const sheet of sheets) {
    const tabName = sheet.getName().trim();
    if (CONFIG.EXCLUDED_TABS.includes(tabName.toLowerCase())) continue;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    // Locate header row within the first 10 rows
    const headerInfo = findHeaderColumns_(data);
    if (!headerInfo) continue;

    const { headerRowIndex, itemColIndex, stockColIndex } = headerInfo;

    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const rawName = String(data[r][itemColIndex] || '').trim();
      if (!rawName) continue;

      const stockVal = parseNumericValue_(data[r][stockColIndex]);
      records.push({
        itemName: rawName.toUpperCase(),
        stockKg: stockVal,
        tabName: tabName
      });
    }
  }

  return records;
}

/**
 * Dynamically finds the row and column indices for Item Name and Current Stock.
 */
function findHeaderColumns_(data) {
  const maxScanRows = Math.min(data.length, 10);

  for (let r = 0; r < maxScanRows; r++) {
    let itemColIndex = -1;
    let stockColIndex = -1;

    for (let c = 0; c < data[r].length; c++) {
      const cellText = String(data[r][c] || '').trim().toLowerCase();
      if (!cellText) continue;

      if (itemColIndex === -1 && CONFIG.ITEM_HEADER_KEYWORDS.some(k => cellText.includes(k))) {
        itemColIndex = c;
      }
      if (stockColIndex === -1 && CONFIG.STOCK_HEADER_KEYWORDS.some(k => cellText.includes(k))) {
        stockColIndex = c;
      }
    }

    if (itemColIndex !== -1 && stockColIndex !== -1) {
      return { headerRowIndex: r, itemColIndex, stockColIndex };
    }
  }
  return null;
}

/**
 * Step 2: Sums stock quantities across all tabs for each explicit Proposal SKU key.
 */
function aggregateStockByProposalSku_(rawInventory) {
  const totals = {};

  for (const skuKey of Object.keys(SKU_RULES)) {
    totals[skuKey] = 0;
    const rule = SKU_RULES[skuKey];

    for (const item of rawInventory) {
      if (matchesSkuRule_(item.itemName, rule)) {
        totals[skuKey] += item.stockKg;
      }
    }
  }

  return totals;
}

/**
 * Evaluates whether an upper-case inventory item name satisfies an explicit SKU rule.
 */
function matchesSkuRule_(upperName, rule) {
  if (rule.mustInclude && rule.mustInclude.length > 0) {
    for (const kw of rule.mustInclude) {
      if (!upperName.includes(kw.toUpperCase())) return false;
    }
  }

  if (rule.mustIncludeAny && rule.mustIncludeAny.length > 0) {
    const matchedAny = rule.mustIncludeAny.some(kw => upperName.includes(kw.toUpperCase()));
    if (!matchedAny) return false;
  }

  if (rule.mustExclude && rule.mustExclude.length > 0) {
    for (const kw of rule.mustExclude) {
      if (upperName.includes(kw.toUpperCase())) return false;
    }
  }

  return true;
}

/**
 * Dynamic fallback when a newly added Google Doc row is not in SKU_RULES.
 * Tokenizes the Doc product name (e.g., "FENNEL 10%" or "BAY LEAF") and
 * sums matching Sheet items within the appropriate category guardrails.
 */
function calculateDynamicStockFallback_(category, docProductName, rawInventory) {
  // Remove generic solubility/oleoresin suffixes from required tokens so
  // e.g. "FENNEL 10% OR OS" still matches "FENNEL 10% O/S" in the Sheet
  const ignoredTokens = new Set(['OR', 'OS', 'O/S', 'WS', 'W/S', 'CU']);

  const tokens = docProductName
    .toUpperCase()
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0 && !ignoredTokens.has(token));

  if (tokens.length === 0) return 0;

  let matchedStock = 0;

  for (const item of rawInventory) {
    const name = item.itemName;

    // 1. Category guardrails to prevent cross-category collisions
    if (category === 'ESSENTIAL OILS' && !name.includes('OIL')) continue;
    if (category === 'OLEORESINS' && (name.includes('OIL') || name.includes('WS') || name.includes('W/S') || name.includes('WATER'))) continue;
    if (category === 'WATER-SOLUBLE' && !(name.includes('WS') || name.includes('W/S') || name.includes('WATER'))) continue;

    // 2. Check that all core tokens from the Doc product name appear in the Sheet Item Name
    const allTokensMatch = tokens.every(token => name.includes(token));
    if (allTokensMatch) {
      matchedStock += item.stockKg;
    }
  }

  return matchedStock;
}

/**
 * Step 3: Opens the Google Doc, iterates through the table rows, computes
 * Unit Price * Total Stock, writes formatted values to Column 4, and updates
 * the bottom "ИТОГО / TOTAL" row.
 */
function updateProposalDocTable_(stockBySkuKey, rawInventory) {
  const doc = openTargetDocument_();
  const body = doc.getBody();
  const tables = body.getTables();

  if (!tables || tables.length === 0) {
    throw new Error('No tables found in the target Google Doc.');
  }

  const table = tables[0];
  const numRows = table.getNumRows();
  let currentCategory = '';
  let grandTotalValuation = 0;

  const KNOWN_CATEGORIES = ['OLEORESINS', 'WATER-SOLUBLE', 'NATURAL DYES', 'ESSENTIAL OILS'];

  for (let r = 1; r < numRows; r++) {
    const row = table.getRow(r);
    if (row.getNumCells() < 4) continue;

    const col0Text = row.getCell(0).getText().trim();
    const col0Upper = col0Text.toUpperCase();
    const col2Text = row.getCell(2).getText().trim();

    // Check if this is the Grand Total row at the bottom
    if (col0Upper.includes('ИТОГО') || col0Upper.includes('TOTAL')) {
      setCellTextPreservingStyle_(row.getCell(3), formatRussianCurrency_(grandTotalValuation), true);
      continue;
    }

    // Check if this row is a Category Section Header
    if (KNOWN_CATEGORIES.includes(col0Upper)) {
      currentCategory = col0Upper;
      continue;
    }

    // Skip empty separator rows
    if (!col0Text && !col2Text) continue;

    // Parse unit price from Column 3 (index 2)
    const unitPrice = parseNumericValue_(col2Text);
    const skuKey = `${currentCategory}::${col0Upper}`;

    // Use explicit SKU_RULES if present; otherwise dynamically match from rawInventory
    const totalStockKg = Object.prototype.hasOwnProperty.call(stockBySkuKey, skuKey)
      ? stockBySkuKey[skuKey]
      : calculateDynamicStockFallback_(currentCategory, col0Upper, rawInventory);

    const rowValuation = unitPrice * totalStockKg;
    grandTotalValuation += rowValuation;

    // Write formatted valuation (0,00 when stock is 0) into Column 4 (index 3)
    const formattedValuation = formatRussianCurrency_(rowValuation);
    setCellTextPreservingStyle_(row.getCell(3), formattedValuation, false);
  }

  doc.saveAndClose();
}

/**
 * Opens the target Google Doc using either a full URL or Document ID.
 */
function openTargetDocument_() {
  const target = CONFIG.TARGET_DOC_URL.trim();
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return DocumentApp.openByUrl(target);
  }
  return DocumentApp.openById(target);
}

/**
 * Safely parses Russian/English formatted numbers (e.g., "3 698,50", "1,737", 8200).
 */
function parseNumericValue_(val) {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;

  let str = String(val).trim();
  // Remove spaces and non-breaking spaces
  str = str.replace(/[\s\u00A0]/g, '');

  // Handle comma vs. dot decimal separators
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf(',') < str.indexOf('.')) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(',', '.');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  str = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number into Russian standard currency string: "12 345,67" (or "0,00").
 */
function formatRussianCurrency_(amount) {
  const fixed = Math.abs(amount) < 0.005 ? 0 : amount;
  const parts = fixed.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart},${parts[1]}`;
}

/**
 * Updates a Google Doc table cell text cleanly while applying bold formatting if needed.
 */
function setCellTextPreservingStyle_(cell, newText, isBold) {
  cell.setText(newText);
  const textElement = cell.editAsText();
  if (newText.length > 0) {
    textElement.setBold(0, newText.length - 1, Boolean(isBold));
  }
}