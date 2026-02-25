import * as store from './store';

export async function getProducts() {
  return store.getProducts();
}
export async function getProductsFromPurchases() {
  return store.getProductsFromPurchases();
}
export async function getStockWithQuantity() {
  return store.getStockWithQuantity();
}
export async function addProduct(data) {
  return store.addProduct(data);
}
export async function updateProduct(id, data) {
  return store.updateProduct(id, data);
}
export async function deleteProduct(id) {
  return store.deleteProduct(id);
}
export async function getProductById(id) {
  return store.getProductById(id);
}
export async function seedDefaultProducts() {
  return store.seedDefaultProducts();
}

export async function createBill(data) {
  return store.createBill(data);
}
export async function setBillPrinted(billId) {
  return store.setBillPrinted(billId);
}
export async function getBills(filters) {
  return store.getBills(filters || {});
}
export async function getBillItems(billId) {
  return store.getBillItems(billId);
}

export async function getSalesSummary(filters) {
  return store.getSalesSummary(filters || {});
}

export async function getPurchases(filters) {
  return store.getPurchases(filters || {});
}
export async function getPurchasesCount(filters) {
  return store.getPurchasesCount(filters || {});
}
export async function getPurchaseById(id) {
  return store.getPurchaseById(id);
}
export async function addPurchase(data) {
  return store.addPurchase(data);
}
export async function updatePurchase(id, data) {
  return store.updatePurchase(id, data);
}
export async function deletePurchase(id) {
  return store.deletePurchase(id);
}

export async function getBillsWithCredit() {
  return store.getBillsWithCredit();
}
export async function addCreditPayment(billId, amount, paymentDate) {
  return store.addCreditPayment(billId, amount, paymentDate);
}
export async function getCreditPayments(billId) {
  return store.getCreditPayments(billId);
}

export function printBill() {
  store.printBill();
}
export async function clearAllTables() {
  return store.clearAllTables();
}
