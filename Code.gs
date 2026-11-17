/**
 * ============================================================================
 * INDOBAY TRADING CO — REAL-TIME STOCK TO CATALOG VALUATION SYNC ENGINE
 * Hosted in: "Indobay Stocks - Sales"
 * Target:    "Indobay Trading Co - Product Catalog & Stock Valuation"
 * ============================================================================
 */

const CONFIG = {
  CATALOG_SPREADSHEET_NAME: 'Indobay Trading Co - Product Catalog & Stock Valuation',

  EXCLUDED_TABS: [
    'dashboard',
    'sync log',
    'summary',
    'config',
    'settings',
    'каталог продукции'
  ],

  SOURCE_TAB_TO_CATEGORY: {
    'oleoresin products': 'OLEORESINS',
    'color products': 'NATURAL DYES',
    'oil products': 'ESSENTIAL OILS',
    'spice products': 'SPICES',
    'others': 'OTHERS'
  },

  CATEGORY_TO_CATALOG_TAB: {
    'OLEORESINS': 'Oleoresins',
    'WATER-SOLUBLE': 'Water-Soluble',
    'NATURAL DYES': 'Natural Dyes',
    'ESSENTIAL OILS': 'Essential Oils',
    'SPICES': 'Spices',
    'OTHERS': 'Others'
  },

  ITEM_HEADER_KEYWORDS: ['item name', 'item', 'наименование', 'product'],
  STOCK_HEADER_KEYWORDS: ['available stock', 'current stock', 'stock', 'остаток', 'available'],

  LOCK_TIMEOUT_MS: 20000
};

/**
 * Explicit SKU Mapping Dictionary for canonical Catalog items.
 */
const SKU_RULES = {
  // ── 1. OLEORESINS ──────────────────────────────────────────────────────────
  'OLEORESINS::ALLSPICE 30%':        { mustInclude: ['ALLSPICE', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::ALLSPICE 40%':        { mustInclude: ['ALLSPICE', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::BASIL 15%':           { mustInclude: ['BASIL', '15%'], mustExclude: ['OIL'] },
  'OLEORESINS::BLACK PEPPER 40/20':  { mustInclude: ['BLACK PEPPER', '40/20'], mustExclude: ['OIL'] },
  'OLEORESINS::CAPSICUM OR 6.6% OS': { mustInclude: ['CAPSICUM'], mustIncludeAny: ['6.6%', '6,6%'], mustExclude: ['WS', 'W/S', 'WATER'] },
  'OLEORESINS::CARAWAY 15%':         { mustInclude: ['CARAWAY', '15%'], mustExclude: ['OIL'] },
  'OLEORESINS::CARAWAY 30%':         { mustInclude: ['CARAWAY'], mustExclude: ['15%', 'OIL'] },
  'OLEORESINS::CARDAMOM 30%':        { mustInclude: ['CARDAMOM', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CARDAMOM 40%':        { mustInclude: ['CARDAMOM', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::CELERY 12%':          { mustInclude: ['CELERY'], mustExclude: ['OIL'] },
  'OLEORESINS::CINNAMON 40%':        { mustInclude: ['CINNAMON', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::CINNAMON 30%':        { mustInclude: ['CINNAMON', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CLOVE 30%':           { mustInclude: ['CLOVE', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::CORIANDER 10%':       { mustInclude: ['CORIANDER', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::CUMIN (ZIRA) 30%':    { mustInclude: ['CUMIN', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::FENNEL 10% OS':       { mustInclude: ['FENNEL', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 10%':          { mustInclude: ['GARLIC', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 20%':          { mustInclude: ['GARLIC', '20%'], mustExclude: ['OIL'] },
  'OLEORESINS::GARLIC 50%':          { mustInclude: ['GARLIC', '50%'], mustExclude: ['OIL'] },
  'OLEORESINS::GINGER 30%':          { mustInclude: ['GINGER', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::GINGER 40%':          { mustInclude: ['GINGER', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::LEMON':               { mustInclude: ['LEMON'], mustExclude: ['OIL'] },
  'OLEORESINS::MUSTARD OR 10%':      { mustInclude: ['MUSTARD', '10%'], mustExclude: ['OIL'] },
  'OLEORESINS::NUTMEG 30%':          { mustInclude: ['NUTMEG', '30%'], mustExclude: ['OIL'] },
  'OLEORESINS::NUTMEG 40%':          { mustInclude: ['NUTMEG', '40%'], mustExclude: ['OIL'] },
  'OLEORESINS::ONION 5%':            { mustInclude: ['ONION', '5%'], mustExclude: ['ROASTED', 'OIL'] },
  'OLEORESINS::ONION ROASTED':       { mustInclude: ['ONION', 'ROASTED'], mustExclude: ['OIL'] },
  'OLEORESINS::PAPRIKA 100000 CU':   { mustInclude: ['PAPRIKA', '100000'], mustExclude: ['WS', 'W/S'] },
  'OLEORESINS::PAPRIKA 40000CU OS':  { mustInclude: ['PAPRIKA', '40000'], mustExclude: ['WS', 'W/S', 'WATER'] },
  'OLEORESINS::PAPRIKA 80000 CU':    { mustInclude: ['PAPRIKA'], mustIncludeAny: ['80000', '80K'], mustExclude: ['WS', 'W/S'] },
  'OLEORESINS::THYME 5%':            { mustInclude: ['THYME'], mustExclude: ['OIL'] },
  'OLEORESINS::TURMERIC 10%':        { mustInclude: ['TURMERIC', '10%'], mustExclude: ['OIL', '22%'] },
  'OLEORESINS::TURMERIC 22%':        { mustInclude: ['TURMERIC', '22%'], mustExclude: ['OIL', '10%'] },
  'OLEORESINS::JUNIPER OR OS':       { mustInclude: ['JUNIPER'], mustIncludeAny: ['OR', 'O/S', 'OS'], mustExclude: ['OIL'] },
  'OLEORESINS::ROSEMARY 6% OR OS':   { mustInclude: ['ROSEMARY', '6%'], mustExclude: ['OIL'] },
  'OLEORESINS::WHITE PEPPER 40/20':  { mustInclude: ['WHITE PEPPER', '40/20'], mustExclude: ['OIL'] },
  'OLEORESINS::WHITTE PEPPER':       { mustInclude: ['WHITTE PEPPER'], mustExclude: ['OIL'] },

  // ── 2. WATER-SOLUBLE ───────────────────────────────────────────────────────
  'WATER-SOLUBLE::CAPSICUM OR 6.6% WS': { mustInclude: ['CAPSICUM'], mustIncludeAny: ['WS', 'W/S', 'WATER'], mustExclude: ['OS', 'O/S'] },
  'WATER-SOLUBLE::PAPRIKA 40000 CU WS': { mustInclude: ['PAPRIKA', '40000'], mustIncludeAny: ['WS', 'W/S', 'WATER'], mustExclude: ['OS', 'O/S'] },

  // ── 3. NATURAL DYES ────────────────────────────────────────────────────────
  'NATURAL DYES::RED':                 { mustInclude: ['RED'], mustExclude: [] },
  'NATURAL DYES::YELLOW':              { mustInclude: ['YELLOW'], mustExclude: [] },
  'NATURAL DYES::BROWN':               { mustInclude: ['BROWN'], mustExclude: [] },
  'NATURAL DYES::GREEN (CHLOROPHYLL)': { mustIncludeAny: ['GREEN', 'CHLOROPHYLL'], mustExclude: [] },

  // ── 4. ESSENTIAL OILS ──────────────────────────────────────────────────────
  'ESSENTIAL OILS::CUMIN (CUMIN)':        { mustInclude: ['CUMIN', 'OIL'], mustExclude: ['OR', 'O/S', '30%'] },
  'ESSENTIAL OILS::LEMON':                { mustInclude: ['LEMON', 'OIL'], mustExclude: ['LEMONGRASS', 'OR', 'O/S'] },
  'ESSENTIAL OILS::NUTMEG':               { mustInclude: ['NUTMEG', 'OIL'], mustExclude: ['OR', 'O/S', '30%', '40%'] },
  'ESSENTIAL OILS::BLACK PEPPER':         { mustInclude: ['BLACK PEPPER', 'OIL'], mustExclude: ['OR', 'O/S', '40/20'] },
  'ESSENTIAL OILS::GARLIC':               { mustInclude: ['GARLIC', 'OIL'], mustExclude: ['OR', 'O/S', '10%', '20%', '50%'] },
  'ESSENTIAL OILS::BAY LEAF':             { mustInclude: ['BAY LEAF', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::CARAWAY':              { mustInclude: ['CARAWAY', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::EUCALYPTUS ESSENTIAL': { mustInclude: ['EUCALYPTUS', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::JUNIPER':              { mustInclude: ['JUNIPER', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::LEMONGRASS':           { mustInclude: ['LEMONGRASS', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::MENTHA SPICATA 60%':   { mustInclude: ['MENTHA SPICATA', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::OREGANO':              { mustInclude: ['OREGANO', 'OIL'], mustExclude: [] },
  'ESSENTIAL OILS::PINE':                 { mustInclude: ['PINE', 'OIL'], mustExclude: [] }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 Indobay Catalog Sync')
    .addItem('Sync Stocks to Catalog Now', 'syncInventoryToCatalog')
    .addToUi();
}

function handleInventoryEdit(e) {
  if (!e || !e.range) return;
  const sheetName = e.range.getSheet().getName().trim().toLowerCase();
  if (CONFIG.EXCLUDED_TABS.includes(sheetName)) return;
  syncInventoryToCatalog();
}

function syncInventoryToCatalog() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) {
    console.warn('Sync skipped: Another sync execution is currently in progress.');
    return;
  }

  try {
    const sourceSs = SpreadsheetApp.getActiveSpreadsheet();
    const rawInventory = collectInventoryAcrossAllTabs_(sourceSs);
    const catalogDataByCategory = buildDynamicCategoryCatalog_(rawInventory);

    syncToCatalogSpreadsheet_(catalogDataByCategory);
    console.log('Successfully synced stock valuations to Catalog Spreadsheet.');
  } catch (err) {
    console.error('Error syncing inventory to Catalog: ' + err.stack);
    throw err;
  } finally {
    lock.releaseLock();
  }
}

function collectInventoryAcrossAllTabs_(ss) {
  const sheets = ss.getSheets();
  const records = [];

  for (const sheet of sheets) {
    const tabName = sheet.getName().trim();
    const lowerTab = tabName.toLowerCase();
    if (CONFIG.EXCLUDED_TABS.includes(lowerTab)) continue;

    const baseCategory = CONFIG.SOURCE_TAB_TO_CATEGORY[lowerTab];
    if (!baseCategory) continue;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) continue;

    const headerInfo = findHeaderColumns_(data);
    if (!headerInfo) continue;

    const { headerRowIndex, itemColIndex, stockColIndex } = headerInfo;

    for (let r = headerRowIndex + 1; r < data.length; r++) {
      const rawName = String(data[r][itemColIndex] || '').trim();
      if (!rawName) continue;

      const upperName = rawName.toUpperCase();
      const stockVal = parseNumericValue_(data[r][stockColIndex]);

      let resolvedCategory = baseCategory;
      if (
        baseCategory === 'OLEORESINS' &&
        (/\bWS\b/.test(upperName) || upperName.includes('W/S') || upperName.includes('WATER'))
      ) {
        resolvedCategory = 'WATER-SOLUBLE';
      }

      records.push({
        rawName: rawName,
        itemName: upperName,
        stockKg: stockVal,
        tabName: tabName,
        category: resolvedCategory
      });
    }
  }

  return records;
}

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

function buildDynamicCategoryCatalog_(rawInventory) {
  const catalog = {
    'OLEORESINS': {},
    'WATER-SOLUBLE': {},
    'NATURAL DYES': {},
    'ESSENTIAL OILS': {},
    'SPICES': {},
    'OTHERS': {}
  };

  for (const skuKey of Object.keys(SKU_RULES)) {
    const [cat, prodName] = skuKey.split('::');
    if (catalog[cat]) {
      catalog[cat][prodName] = 0;
    }
  }

  // Detect whether both 'CARDAMOM 6-7 MM' and 'CARDAMOM 6-7MM' currently coexist in Spice Products
  const spiceRawSet = new Set(
    rawInventory
      .filter(i => i.category === 'SPICES')
      .map(i => normalizeDynamicProductName_(i.rawName, 'SPICES', false))
  );
  const bothCardamomVariantsExist =
    spiceRawSet.has('CARDAMOM 6-7 MM') && spiceRawSet.has('CARDAMOM 6-7MM');

  for (const item of rawInventory) {
    const cat = item.category;
    if (!catalog[cat]) catalog[cat] = {};

    let matchedCanonicalName = null;

    for (const skuKey of Object.keys(SKU_RULES)) {
      const [ruleCat, ruleProdName] = skuKey.split('::');
      if (ruleCat !== cat) continue;

      if (matchesSkuRule_(item.itemName, SKU_RULES[skuKey])) {
        matchedCanonicalName = ruleProdName;
        break;
      }
    }

    if (!matchedCanonicalName) {
      // Collapse '6-7 MM' -> '6-7MM' only if the maintainer has merged/fixed one of the variants
      const collapseMmSpacing = !(cat === 'SPICES' && bothCardamomVariantsExist);
      matchedCanonicalName = normalizeDynamicProductName_(item.rawName, cat, collapseMmSpacing);
    }

    if (!Object.prototype.hasOwnProperty.call(catalog[cat], matchedCanonicalName)) {
      catalog[cat][matchedCanonicalName] = 0;
    }
    catalog[cat][matchedCanonicalName] += item.stockKg;
  }

  return catalog;
}

function normalizeDynamicProductName_(rawName, category, collapseMmSpacing = true) {
  let name = String(rawName || '').trim().toUpperCase();

  name = name
    .replace(/\bOLEORESIN(S)?\b/gi, '')
    .replace(/\bSPICE(S)?\b/gi, '')
    .replace(/\bCOLOR(S)?\b/gi, '')
    .replace(/\bOIL(S)?\b/gi, '');

  if (category === 'OLEORESINS' || category === 'WATER-SOLUBLE') {
    name = name
      .replace(/\(FOR\s+SPASSKY\)/gi, '')
      .replace(/\(ДЛЯ\s+СПАССКИЙ\)/gi, '')
      .replace(/\bSPASSKIY\b/gi, '')
      .replace(/\bAROMA\s+COM\b/gi, '')
      .replace(/\bTAROMA\b/gi, '')
      .replace(/\bVERDE\b/gi, '')
      .replace(/\bTRC\/\d+\b/gi, '')
      .replace(/\bE\d+\/\d+\b/gi, '')
      .replace(/\bO\/S\s+[AB]\b/gi, 'O/S')
      .replace(/\bO\/S\b/gi, 'OS')
      .replace(/\bW\/S\b/gi, 'WS');
  }

  if (collapseMmSpacing) {
    name = name.replace(/(\d)\s+MM\b/gi, '$1MM');
  }

  name = name.replace(/\s+/g, ' ').trim();
  return name || rawName.toUpperCase();
}

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

function syncToCatalogSpreadsheet_(catalogDataByCategory) {
  const files = DriveApp.getFilesByName(CONFIG.CATALOG_SPREADSHEET_NAME);
  if (!files.hasNext()) {
    throw new Error('Catalog spreadsheet not found: ' + CONFIG.CATALOG_SPREADSHEET_NAME);
  }

  const catalogSs = SpreadsheetApp.open(files.next());

  for (const [categoryKey, tabName] of Object.entries(CONFIG.CATEGORY_TO_CATALOG_TAB)) {
    const productStockMap = catalogDataByCategory[categoryKey] || {};
    let sheet = catalogSs.getSheetByName(tabName);

    if (!sheet) {
      sheet = catalogSs.insertSheet(tabName);
      sheet.appendRow([
        'Name',
        'Наименование (рус)',
        'Available Stock',
        'Price includes VAT',
        'Total Valuation of Stock includes VAT'
      ]);
    }

    // Consolidate duplicate spacing variants (e.g. CARDAMOM 6-7 MM vs CARDAMOM 6-7MM)
    // automatically once the maintainer fixes/merges them in Indobay Stocks - Sales
    consolidateResolvedDuplicatesInSheet_(sheet, productStockMap);

    const updatedData = sheet.getDataRange().getValues();
    const seenProducts = new Set();

    for (let r = 1; r < updatedData.length; r++) {
      const existingName = String(updatedData[r][0] || '').trim().toUpperCase();
      if (!existingName) continue;

      seenProducts.add(existingName);

      if (Object.prototype.hasOwnProperty.call(productStockMap, existingName)) {
        const rowNumber = r + 1;
        const newStock = productStockMap[existingName];
        sheet.getRange(rowNumber, 3).setValue(newStock);

        // Ensure Column E always has the live multiplication formula =C{row}*D{row}
        const formulaCell = sheet.getRange(rowNumber, 5);
        if (!formulaCell.getFormula()) {
          formulaCell.setFormula(`=C${rowNumber}*D${rowNumber}`);
        }
      }
    }

    // Append any newly added products from Indobay Stocks - Sales
    for (const [prodName, stockKg] of Object.entries(productStockMap)) {
      const upperProd = prodName.toUpperCase();
      if (!seenProducts.has(upperProd)) {
        const nextRow = sheet.getLastRow() + 1;
        sheet.appendRow([prodName, '', stockKg, 0, `=C${nextRow}*D${nextRow}`]);
      }
    }
  }
}

/**
 * If two spacing/formatting variants existed in the Catalog sheet (e.g. "CARDAMOM 6-7 MM"
 * and "CARDAMOM 6-7MM"), and the data maintainer later merges/fixes them in
 * "Indobay Stocks - Sales" so only one canonical key remains in productStockMap,
 * this helper combines them and removes the redundant Catalog row.
 */
function consolidateResolvedDuplicatesInSheet_(sheet, productStockMap) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 2) return;

  const rowsByCompactKey = {};
  for (let r = 1; r < data.length; r++) {
    const rawName = String(data[r][0] || '').trim().toUpperCase();
    if (!rawName) continue;
    const compactKey = rawName.replace(/\s+/g, '');
    if (!rowsByCompactKey[compactKey]) rowsByCompactKey[compactKey] = [];
    rowsByCompactKey[compactKey].push({ rowIndex: r + 1, name: rawName, price: parseNumericValue_(data[r][3]) });
  }

  const rowsToDelete = [];
  for (const group of Object.values(rowsByCompactKey)) {
    if (group.length < 2) continue;

    // Check if only one variant still exists in the active source inventory map
    const activeVariants = group.filter(g => Object.prototype.hasOwnProperty.call(productStockMap, g.name));
    if (activeVariants.length === 1) {
      const survivor = activeVariants[0];
      const maxPrice = Math.max(...group.map(g => g.price));
      if (maxPrice > 0 && survivor.price === 0) {
        sheet.getRange(survivor.rowIndex, 4).setValue(maxPrice);
      }
      for (const item of group) {
        if (item.rowIndex !== survivor.rowIndex) {
          rowsToDelete.push(item.rowIndex);
        }
      }
    }
  }

  // Delete redundant rows bottom-up so row indices don't shift
  rowsToDelete.sort((a, b) => b - a);
  for (const rowIdx of rowsToDelete) {
    sheet.deleteRow(rowIdx);
  }
}

function parseNumericValue_(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;

  let str = String(val).trim().replace(/[\s\u00A0]/g, '');
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