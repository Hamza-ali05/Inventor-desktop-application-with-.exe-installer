/**
 * In-memory store replacing the backend/DB. All data is lost on page refresh.
 */

let productId = 1;
let billId = 1;
let billItemId = 1;
let purchaseId = 1;
let creditPaymentId = 1;

const products = [];
const bills = [];
const billItems = [];
const purchases = [];
const creditPayments = [];

function nextId(prefix) {
  if (prefix === 'product') return productId++;
  if (prefix === 'bill') return billId++;
  if (prefix === 'billItem') return billItemId++;
  if (prefix === 'purchase') return purchaseId++;
  if (prefix === 'credit') return creditPaymentId++;
  return 1;
}

export function getProducts() {
  return Promise.resolve(products.map((p) => ({ ...p })));
}

export function getProductsFromPurchases() {
  const ids = new Set(purchases.map((p) => p.product_id));
  return Promise.resolve(products.filter((p) => ids.has(p.id)).map((p) => ({ ...p })));
}

/**
 * Stock quantity = sum of all purchase quantities (old + new) minus sum of quantities used in completed bills.
 * Stock increases when a purchase is added; stock decreases when a bill is completed (bill items).
 */
export function getStockWithQuantity() {
  const byProduct = {};
  purchases.forEach((p) => {
    byProduct[p.product_id] = (byProduct[p.product_id] || 0) + p.quantity;
  });
  billItems.forEach((bi) => {
    byProduct[bi.product_id] = (byProduct[bi.product_id] || 0) - bi.quantity;
  });
  const withQuantity = products.map((p) => ({
    id: p.id,
    name: p.name,
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    stock_entry_date: p.stock_entry_date,
    expiry_date: p.expiry_date,
    quantity: Math.max(0, byProduct[p.id] || 0),
  }));
  // Only show products that have stock > 0; remove from stock until added again via purchase
  return Promise.resolve(withQuantity.filter((p) => p.quantity > 0));
}

export function addProduct(data) {
  const id = nextId('product');
  const row = {
    id,
    name: data.name,
    quantity: data.quantity ?? 0,
    purchase_price: data.purchase_price ?? 0,
    sale_price: data.sale_price ?? 0,
    stock_entry_date: data.stock_entry_date || new Date().toISOString().slice(0, 10),
    expiry_date: data.expiry_date || null,
  };
  products.push(row);
  return Promise.resolve(id);
}

export function updateProduct(id, data) {
  const p = products.find((x) => x.id === id);
  if (!p) return Promise.resolve();
  Object.assign(p, {
    name: data.name ?? p.name,
    quantity: data.quantity ?? p.quantity,
    purchase_price: data.purchase_price ?? p.purchase_price,
    sale_price: data.sale_price ?? p.sale_price,
    stock_entry_date: data.stock_entry_date ?? p.stock_entry_date,
    expiry_date: data.expiry_date !== undefined ? data.expiry_date : p.expiry_date,
  });
  return Promise.resolve();
}

export function deleteProduct(id) {
  const i = products.findIndex((x) => x.id === id);
  if (i !== -1) products.splice(i, 1);
  return Promise.resolve();
}

export function getProductById(id) {
  const p = products.find((x) => x.id === id);
  return Promise.resolve(p ? { ...p } : null);
}

export function seedDefaultProducts() {
  return Promise.resolve(0);
}

export function createBill(data) {
  const id = nextId('bill');
  const billDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const amountPaid = data.payment_method === 'cash' ? data.total : (Number(data.amount_paid) || 0);
  const creditRemaining = data.payment_method === 'credit' ? (Number(data.credit_remaining) ?? Math.max(0, data.total - (Number(data.amount_paid) || 0))) : 0;
  bills.push({
    id,
    bill_date: billDate,
    payment_method: data.payment_method,
    total: data.total,
    amount_paid: amountPaid,
    credit_remaining: creditRemaining,
    printed: 0,
    customer_name: data.customer_name || null,
    customer_mobile: data.customer_mobile || null,
  });
  // Bill items reduce stock: stock = sum(purchases) - sum(bill items)
  data.items.forEach((item) => {
    billItems.push({
      id: nextId('billItem'),
      bill_id: id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    });
  });
  return Promise.resolve(id);
}

export function setBillPrinted(billId) {
  const b = bills.find((x) => x.id === billId);
  if (b) b.printed = 1;
  return Promise.resolve();
}

export function getBills(filters = {}) {
  let list = [...bills];
  if (filters.fromDate) list = list.filter((b) => b.bill_date >= filters.fromDate);
  if (filters.toDate) list = list.filter((b) => b.bill_date.slice(0, 10) <= filters.toDate);
  list.sort((a, b) => (b.bill_date > a.bill_date ? 1 : -1));
  return Promise.resolve(list);
}

export function getBillItems(billId) {
  const items = billItems.filter((bi) => bi.bill_id === billId);
  const withName = items.map((bi) => {
    const p = products.find((x) => x.id === bi.product_id);
    return { ...bi, product_name: p ? p.name : '—' };
  });
  return Promise.resolve(withName);
}

export function getSalesSummary(filters = {}) {
  let items = billItems.map((bi) => {
    const p = products.find((x) => x.id === bi.product_id);
    const bill = bills.find((x) => x.id === bi.bill_id);
    const profit = (bi.unit_price - (p ? p.purchase_price : 0)) * bi.quantity;
    return {
      bill_id: bi.bill_id,
      bill_date: bill ? bill.bill_date : '',
      payment_method: bill ? bill.payment_method : '',
      total: bill ? bill.total : 0,
      amount_paid: bill ? bill.amount_paid : 0,
      credit_remaining: bill ? bill.credit_remaining : 0,
      product_id: bi.product_id,
      product_name: p ? p.name : '—',
      quantity: bi.quantity,
      unit_price: bi.unit_price,
      line_total: bi.line_total,
      purchase_price: p ? p.purchase_price : 0,
      profit,
    };
  });
  if (filters.date) items = items.filter((i) => (i.bill_date || '').slice(0, 10) === filters.date);
  items.sort((a, b) => (b.bill_date > a.bill_date ? 1 : -1));
  return Promise.resolve(items);
}

export function getPurchases(filters = {}) {
  let list = purchases.map((pur) => {
    const p = products.find((x) => x.id === pur.product_id);
    return { ...pur, product_name: p ? p.name : '—' };
  });
  if (filters.date) list = list.filter((pur) => (pur.purchase_date || '').slice(0, 10) === filters.date);
  list.sort((a, b) => (b.purchase_date > a.purchase_date ? 1 : -1));
  const limit = Math.max(1, Math.min(1000, Number(filters.limit) || 10));
  const offset = Math.max(0, Number(filters.offset) || 0);
  list = list.slice(offset, offset + limit);
  return Promise.resolve(list);
}

export function getPurchasesCount(filters = {}) {
  let list = purchases;
  if (filters.date) list = list.filter((pur) => (pur.purchase_date || '').slice(0, 10) === filters.date);
  return Promise.resolve(list.length);
}

export function getPurchaseById(id) {
  const pur = purchases.find((x) => x.id === id);
  if (!pur) return Promise.resolve(null);
  const p = products.find((x) => x.id === pur.product_id);
  return Promise.resolve({ ...pur, product_name: p ? p.name : '—' });
}

export function addPurchase(data) {
  const id = nextId('purchase');
  const expiry = data.expiry_date || null;
  purchases.push({
    id,
    product_id: data.product_id,
    quantity: data.quantity,
    total_value: data.total_value,
    purchase_date: data.purchase_date,
    expiry_date: expiry,
    sale_price: data.sale_price != null ? data.sale_price : null,
  });
  // Stock is computed as sum(purchases) - sum(bill items) in getStockWithQuantity
  const prod = products.find((x) => x.id === data.product_id);
  if (prod) {
    if (expiry) prod.expiry_date = expiry;
    if (data.sale_price != null) prod.sale_price = data.sale_price;
  }
  return Promise.resolve(id);
}

export function updatePurchase(id, data) {
  const pur = purchases.find((x) => x.id === id);
  if (!pur) return Promise.resolve();
  pur.quantity = Number(data.quantity) || 0;
  pur.total_value = Number(data.total_value);
  pur.purchase_date = data.purchase_date;
  pur.expiry_date = data.expiry_date || null;
  pur.sale_price = data.sale_price != null ? data.sale_price : null;
  const prod = products.find((x) => x.id === pur.product_id);
  if (prod) {
    if (pur.expiry_date) prod.expiry_date = pur.expiry_date;
    if (pur.sale_price != null) prod.sale_price = pur.sale_price;
  }
  return Promise.resolve();
}

export function deletePurchase(id) {
  const pur = purchases.find((x) => x.id === id);
  if (pur) purchases.splice(purchases.indexOf(pur), 1);
  return Promise.resolve();
}

export function getBillsWithCredit() {
  return Promise.resolve(bills.filter((b) => b.payment_method === 'credit' && b.credit_remaining > 0));
}

export function addCreditPayment(billId, amount, paymentDate) {
  const bill = bills.find((x) => x.id === billId);
  if (!bill) return Promise.resolve();
  bill.amount_paid = (bill.amount_paid || 0) + amount;
  bill.credit_remaining = Math.max(0, (bill.credit_remaining || 0) - amount);
  creditPayments.push({
    id: nextId('credit'),
    bill_id: billId,
    amount,
    payment_date: paymentDate,
  });
  return Promise.resolve();
}

export function getCreditPayments(billId) {
  return Promise.resolve(creditPayments.filter((c) => c.bill_id === billId));
}

export function printBill() {
  if (typeof window !== 'undefined' && window.print) window.print();
}

export function clearAllTables() {
  products.length = 0;
  bills.length = 0;
  billItems.length = 0;
  purchases.length = 0;
  creditPayments.length = 0;
  productId = 1;
  billId = 1;
  billItemId = 1;
  purchaseId = 1;
  creditPaymentId = 1;
  return Promise.resolve();
}
