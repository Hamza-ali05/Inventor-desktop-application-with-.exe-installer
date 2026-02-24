const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

function getDbPath() {
  const userData = app.getPath('userData');
  return path.join(userData, 'inventory.db');
}

let db = null;

function getDb() {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    initTables(db);
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
      stock_entry_date TEXT NOT NULL
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
}

// Products
function getProducts() {
  return getDb().prepare('SELECT * FROM products ORDER BY name').all();
}

function addProduct({ name, quantity, purchase_price, sale_price, stock_entry_date }) {
  const stmt = getDb().prepare(
    'INSERT INTO products (name, quantity, purchase_price, sale_price, stock_entry_date) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(name, quantity, purchase_price, sale_price, stock_entry_date);
  return result.lastInsertRowid;
}

function updateProduct(id, { name, quantity, purchase_price, sale_price, stock_entry_date }) {
  getDb().prepare(
    'UPDATE products SET name=?, quantity=?, purchase_price=?, sale_price=?, stock_entry_date=? WHERE id=?'
  ).run(name, quantity, purchase_price, sale_price, stock_entry_date, id);
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

function addPurchase({ product_id, quantity, total_value, purchase_date }) {
  const db = getDb();
  const insertPurchase = db.prepare(
    'INSERT INTO purchases (product_id, quantity, total_value, purchase_date) VALUES (?, ?, ?, ?)'
  );
  const updateStock = db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?');
  const run = db.transaction(() => {
    insertPurchase.run(product_id, quantity, total_value, purchase_date);
    updateStock.run(quantity, product_id);
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
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
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
