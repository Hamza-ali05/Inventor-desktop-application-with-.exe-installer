const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

function getDbPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'inventory.db');
}

let db = null;

const SEED_PRODUCTS = [
  'Coca Cola 2 Liter', 'Coca Cola 1.5 Liter', 'Coca Cola 1 Liter', 'Coca Cola 500 ml', 'Coca Cola 330 ml Can', 'Coca Cola 250 ml', 'Coca Cola NR (Normal Returnable Glass Bottle)', 'Coca Cola Diet 500 ml', 'Coca Cola Diet 1.5 Liter', 'Coca Cola Zero 500 ml',
  'Pepsi 2 Liter', 'Pepsi 1.5 Liter', 'Pepsi 1 Liter', 'Pepsi 500 ml', 'Pepsi 330 ml Can', 'Pepsi 250 ml', 'Pepsi NR', 'Pepsi Black 500 ml', 'Pepsi Black 1.5 Liter',
  '7UP 2 Liter', '7UP 1.5 Liter', '7UP 1 Liter', '7UP 500 ml', '7UP 250 ml', '7UP NR', '7UP Diet 500 ml', '7UP Can',
  'Sprite 2 Liter', 'Sprite 1.5 Liter', 'Sprite 1 Liter', 'Sprite 500 ml', 'Sprite 250 ml', 'Sprite NR', 'Sprite Can',
  'Fanta Orange 1.5 Liter', 'Fanta Orange 500 ml', 'Fanta Orange Can', 'Fanta NR',
  'Mirinda 1.5 Liter', 'Mirinda 500 ml', 'Mirinda NR',
  'Mountain Dew 1.5 Liter', 'Mountain Dew 500 ml', 'Mountain Dew 250 ml', 'Mountain Dew NR', 'Mountain Dew Can',
  'Sting 500 ml', 'Sting 250 ml', 'Sting Can',
  'Pakola Ice Cream Soda 1.5 Liter', 'Pakola Ice Cream Soda 500 ml', 'Pakola NR', 'Pakola Raspberry 500 ml',
  'Gourmet Cola 1.5 Liter', 'Gourmet Cola 500 ml', 'Gourmet Lemon Up 1.5 Liter', 'Gourmet Lemon Up 500 ml', 'Gourmet Orange 1.5 Liter', 'Gourmet Orange 500 ml', 'Gourmet NR',
  'Next Cola 1.5 Liter', 'Next Cola 500 ml', 'Next Cola NR', 'RC Cola 1.5 Liter', 'RC Cola 500 ml',
  'Fruita Vitals Mango 1 Liter', 'Fruita Vitals Apple 1 Liter', 'Fruita Vitals Orange 1 Liter', 'Fruita Vitals 200 ml', 'Fruita Vitals 250 ml',
  'Shezan Mango 1 Liter', 'Shezan Apple 1 Liter', 'Shezan Orange 1 Liter', 'Shezan 250 ml', 'Shezan 200 ml',
  'Slice Mango 1 Liter', 'Slice Mango 250 ml', 'Maaza Mango 1 Liter', 'Maaza Mango 250 ml',
  'MilkPak 1 Liter', 'MilkPak 500 ml', 'MilkPak 250 ml',
  'Olpers 1 Liter', 'Olpers 500 ml', 'Olpers 250 ml', 'Olpers Cream 200 ml',
  'Omung 1 Liter', 'Omung 500 ml',
  'Haleeb 1 Liter', 'Haleeb 500 ml', 'Haleeb 250 ml',
  'Nurpur 1 Liter', 'Nurpur 500 ml',
  'EveryDay 1 Liter', 'EveryDay 500 ml', 'EveryDay 200 ml',
  'Tarang 1 Liter', 'Tarang 500 ml', 'Dairy Omung Tea Whitener 1 Liter',
  'Olpers Chocolate Milk 250 ml', 'Olpers Strawberry Milk 250 ml', 'Nurpur Chocolate Milk 250 ml',
  'Nestle Water 1.5 Liter', 'Nestle Water 500 ml', 'Nestle Water 250 ml',
  'Aquafina 1.5 Liter', 'Aquafina 500 ml', 'Gourmet Water 1.5 Liter', 'Gourmet Water 500 ml',
  'Aqua Green Water 1.5 Liter', 'Aqua Green Water 500 ml', 'Aqua Green Water 250 ml',
];

function defaultPrice(name) {
  const n = name.toLowerCase();
  if (n.includes('2 liter') || n.includes('2 l')) return { purchase: 220, sale: 260 };
  if (n.includes('1.5 liter') || n.includes('1.5 l')) return { purchase: 180, sale: 210 };
  if (n.includes('1 liter') || n.includes('1 l')) return { purchase: 140, sale: 170 };
  if (n.includes('500 ml')) return { purchase: 80, sale: 95 };
  if (n.includes('330') || n.includes('can')) return { purchase: 60, sale: 75 };
  if (n.includes('250 ml')) return { purchase: 45, sale: 55 };
  if (n.includes('200 ml')) return { purchase: 40, sale: 50 };
  if (n.includes('nr')) return { purchase: 55, sale: 65 };
  return { purchase: 80, sale: 100 };
}

function seedIfEmpty(database) {
  const count = database.prepare('SELECT COUNT(*) as c FROM products').get();
  if (count.c > 0) return;
  const stmt = database.prepare(
    'INSERT INTO products (name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const today = new Date().toISOString().slice(0, 10);
  for (const name of SEED_PRODUCTS) {
    const { purchase, sale } = defaultPrice(name);
    const result = stmt.run(name, 0, purchase, sale, today, null);
    addPurchase({
      product_id: result.lastInsertRowid,
      quantity: 200,
      total_value: 200 * purchase,
      purchase_date: today,
    });
  }
}

function seedDefaultProducts() {
  const database = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const existing = database.prepare('SELECT name FROM products').all();
  const existingNames = new Set(existing.map((r) => r.name));
  const stmt = database.prepare(
    'INSERT INTO products (name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  let added = 0;
  for (const name of SEED_PRODUCTS) {
    if (existingNames.has(name)) continue;
    const { purchase, sale } = defaultPrice(name);
    const result = stmt.run(name, 0, purchase, sale, today, null);
    addPurchase({
      product_id: result.lastInsertRowid,
      quantity: 200,
      total_value: 200 * purchase,
      purchase_date: today,
    });
    existingNames.add(name);
    added++;
  }
  return added;
}

function getDb() {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    initTables(db);
    seedIfEmpty(db);
  }
  return db;
}

function initTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      stock_entry_date TEXT NOT NULL,
      expiry_date TEXT
    );
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      total REAL NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      credit_remaining REAL NOT NULL DEFAULT 0,
      printed INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_value REAL NOT NULL,
      purchase_date TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE TABLE IF NOT EXISTS credit_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );
  `);
  try {
    const info = database.prepare('PRAGMA table_info(products)').all();
    if (!info.some((c) => c.name === 'expiry_date')) {
      database.exec('ALTER TABLE products ADD COLUMN expiry_date TEXT');
      database.exec("UPDATE products SET expiry_date = date(stock_entry_date, '+1 year') WHERE stock_entry_date IS NOT NULL AND stock_entry_date != ''");
    }
  } catch (_) {}
}

// Products
function getProducts() {
  return getDb().prepare('SELECT * FROM products ORDER BY name').all();
}

function getProductsFromPurchases() {
  return getDb().prepare(
    `SELECT DISTINCT p.* FROM products p
     INNER JOIN purchases pur ON pur.product_id = p.id
     ORDER BY p.name`
  ).all();
}

function addProduct({ name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date }) {
  const stmt = getDb().prepare(
    'INSERT INTO products (name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date || null);
  return result.lastInsertRowid;
}

function updateProduct(id, { name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date }) {
  getDb().prepare(
    'UPDATE products SET name=?, quantity=?, purchase_price=?, sale_price=?, stock_entry_date=?, expiry_date=? WHERE id=?'
  ).run(name, quantity, purchase_price, sale_price, stock_entry_date, expiry_date || null, id);
}

function deleteProduct(id) {
  getDb().prepare('DELETE FROM products WHERE id=?').run(id);
}

function getProductById(id) {
  return getDb().prepare('SELECT * FROM products WHERE id=?').get(id);
}

// Bills
function createBill({ payment_method, total, items }) {
  const db = getDb();
  const insertBill = db.prepare(
    'INSERT INTO bills (bill_date, payment_method, total, amount_paid, credit_remaining, printed) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    'INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)'
  );
  const updateStock = db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?');
  const billDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const amountPaid = payment_method === 'cash' ? total : 0;
  const creditRemaining = payment_method === 'credit' ? total : 0;
  const printed = 0;

  const run = db.transaction(() => {
    const billResult = insertBill.run(billDate, payment_method, total, amountPaid, creditRemaining, printed);
    const billId = billResult.lastInsertRowid;
    for (const item of items) {
      insertItem.run(billId, item.product_id, item.quantity, item.unit_price, item.line_total);
      updateStock.run(item.quantity, item.product_id);
    }
    return billId;
  });
  return run();
}

function setBillPrinted(billId) {
  getDb().prepare('UPDATE bills SET printed=1 WHERE id=?').run(billId);
}

function getBills(filters = {}) {
  let sql = 'SELECT * FROM bills WHERE 1=1';
  const params = [];
  if (filters.fromDate) {
    sql += ' AND date(bill_date) >= date(?)';
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    sql += ' AND date(bill_date) <= date(?)';
    params.push(filters.toDate);
  }
  sql += ' ORDER BY bill_date DESC';
  return getDb().prepare(sql).all(...params);
}

function getBillItems(billId) {
  return getDb().prepare(
    `SELECT bi.*, p.name as product_name FROM bill_items bi
     JOIN products p ON p.id = bi.product_id WHERE bi.bill_id = ?`
  ).all(billId);
}

// Sales summary (for Sales page)
function getSalesSummary(filters = {}) {
  let sql = `
    SELECT bi.bill_id, b.bill_date, b.payment_method, b.total, b.amount_paid, b.credit_remaining,
           bi.product_id, p.name as product_name, bi.quantity, bi.unit_price, bi.line_total,
           p.purchase_price,
           (bi.line_total - (p.purchase_price * bi.quantity)) as profit
    FROM bill_items bi
    JOIN bills b ON b.id = bi.bill_id
    JOIN products p ON p.id = bi.product_id WHERE 1=1
  `;
  const params = [];
  if (filters.fromDate) {
    sql += ' AND date(b.bill_date) >= date(?)';
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    sql += ' AND date(b.bill_date) <= date(?)';
    params.push(filters.toDate);
  }
  sql += ' ORDER BY b.bill_date DESC, bi.id';
  return getDb().prepare(sql).all(...params);
}

// Purchases
function getPurchases(filters = {}) {
  let sql = `
    SELECT pur.*, p.name as product_name FROM purchases pur
    JOIN products p ON p.id = pur.product_id WHERE 1=1
  `;
  const params = [];
  if (filters.fromDate) {
    sql += ' AND date(purchase_date) >= date(?)';
    params.push(filters.fromDate);
  }
  if (filters.toDate) {
    sql += ' AND date(purchase_date) <= date(?)';
    params.push(filters.toDate);
  }
  sql += ' ORDER BY pur.purchase_date DESC';
  return getDb().prepare(sql).all(...params);
}

function addPurchase({ product_id, quantity, total_value, purchase_date, expiry_date }) {
  const db = getDb();
  const insertPurchase = db.prepare(
    'INSERT INTO purchases (product_id, quantity, total_value, purchase_date) VALUES (?, ?, ?, ?)'
  );
  const updateStock = db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?');
  const updateExpiry = db.prepare('UPDATE products SET expiry_date = ? WHERE id = ?');
  const run = db.transaction(() => {
    insertPurchase.run(product_id, quantity, total_value, purchase_date);
    updateStock.run(quantity, product_id);
    if (expiry_date) updateExpiry.run(expiry_date, product_id);
  });
  run();
  return getDb().prepare('SELECT last_insert_rowid() as id').get().id;
}

// Credit
function getBillsWithCredit() {
  return getDb().prepare('SELECT * FROM bills WHERE payment_method=? AND credit_remaining > 0 ORDER BY bill_date')
    .all('credit');
}

function addCreditPayment(billId, amount, paymentDate) {
  const db = getDb();
  const bill = db.prepare('SELECT * FROM bills WHERE id=?').get(billId);
  if (!bill) return;
  const newPaid = bill.amount_paid + amount;
  const newRemaining = Math.max(0, bill.credit_remaining - amount);
  db.prepare('INSERT INTO credit_payments (bill_id, amount, payment_date) VALUES (?, ?, ?)').run(billId, amount, paymentDate);
  db.prepare('UPDATE bills SET amount_paid=?, credit_remaining=? WHERE id=?').run(newPaid, newRemaining, billId);
}

function getCreditPayments(billId) {
  return getDb().prepare('SELECT * FROM credit_payments WHERE bill_id=? ORDER BY payment_date').all(billId);
}

module.exports = {
  getProducts,
  getProductsFromPurchases,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  seedDefaultProducts,
  createBill,
  setBillPrinted,
  getBills,
  getBillItems,
  getSalesSummary,
  getPurchases,
  addPurchase,
  getBillsWithCredit,
  addCreditPayment,
  getCreditPayments,
};
