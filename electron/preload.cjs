const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getProducts: () => ipcRenderer.invoke('db:getProducts'),
  addProduct: (data) => ipcRenderer.invoke('db:addProduct', data),
  updateProduct: (id, data) => ipcRenderer.invoke('db:updateProduct', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),
  getProductById: (id) => ipcRenderer.invoke('db:getProductById', id),

  createBill: (data) => ipcRenderer.invoke('db:createBill', data),
  setBillPrinted: (billId) => ipcRenderer.invoke('db:setBillPrinted', billId),
  getBills: (filters) => ipcRenderer.invoke('db:getBills', filters),
  getBillItems: (billId) => ipcRenderer.invoke('db:getBillItems', billId),

  getSalesSummary: (filters) => ipcRenderer.invoke('db:getSalesSummary', filters),

  getPurchases: (filters) => ipcRenderer.invoke('db:getPurchases', filters),
  addPurchase: (data) => ipcRenderer.invoke('db:addPurchase', data),

  getBillsWithCredit: () => ipcRenderer.invoke('db:getBillsWithCredit'),
  addCreditPayment: (billId, amount, paymentDate) => ipcRenderer.invoke('db:addCreditPayment', billId, amount, paymentDate),
  getCreditPayments: (billId) => ipcRenderer.invoke('db:getCreditPayments', billId),

  printBill: () => ipcRenderer.send('bill:print'),
});
