const api = typeof window !== 'undefined' && window.electronAPI ? window.electronAPI : {};

export async function getProducts() {
  return api.getProducts ? api.getProducts() : [];
}
export async function getProductsFromPurchases() {
  return api.getProductsFromPurchases ? api.getProductsFromPurchases() : [];
}
export async function getStockWithQuantity() {
  return api.getStockWithQuantity ? api.getStockWithQuantity() : [];
}
export async function addProduct(data) {
  return api.addProduct ? api.addProduct(data) : null;
}
export async function updateProduct(id, data) {
  return api.updateProduct ? api.updateProduct(id, data) : undefined;
}
export async function deleteProduct(id) {
  return api.deleteProduct ? api.deleteProduct(id) : undefined;
}
export async function getProductById(id) {
  return api.getProductById ? api.getProductById(id) : null;
}
export async function seedDefaultProducts() {
  return api.seedDefaultProducts ? api.seedDefaultProducts() : 0;
}

export async function createBill(data) {
  return api.createBill ? api.createBill(data) : null;
}
export async function setBillPrinted(billId) {
  return api.setBillPrinted ? api.setBillPrinted(billId) : undefined;
}
export async function getBills(filters) {
  return api.getBills ? api.getBills(filters) : [];
}
export async function getBillItems(billId) {
  return api.getBillItems ? api.getBillItems(billId) : [];
}

export async function getSalesSummary(filters) {
  return api.getSalesSummary ? api.getSalesSummary(filters) : [];
}

export async function getPurchases(filters) {
  return api.getPurchases ? api.getPurchases(filters) : [];
}
export async function addPurchase(data) {
  return api.addPurchase ? api.addPurchase(data) : null;
}

export async function getBillsWithCredit() {
  return api.getBillsWithCredit ? api.getBillsWithCredit() : [];
}
export async function addCreditPayment(billId, amount, paymentDate) {
  return api.addCreditPayment ? api.addCreditPayment(billId, amount, paymentDate) : undefined;
}
export async function getCreditPayments(billId) {
  return api.getCreditPayments ? api.getCreditPayments(billId) : [];
}

export function printBill() {
  if (api.printBill) api.printBill();
}
