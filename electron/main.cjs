const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db.cjs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Hussnain Traders - Inventory',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Store for print
  global.mainWindow = win;
}

// IPC handlers
ipcMain.handle('db:getProducts', () => db.getProducts());
ipcMain.handle('db:getProductsFromPurchases', () => db.getProductsFromPurchases());
ipcMain.handle('db:getStockWithQuantity', () => db.getStockWithQuantity());
ipcMain.handle('db:addProduct', (_, data) => db.addProduct(data));
ipcMain.handle('db:updateProduct', (_, id, data) => db.updateProduct(id, data));
ipcMain.handle('db:deleteProduct', (_, id) => db.deleteProduct(id));
ipcMain.handle('db:getProductById', (_, id) => db.getProductById(id));
ipcMain.handle('db:seedDefaultProducts', () => db.seedDefaultProducts());

ipcMain.handle('db:createBill', (_, data) => db.createBill(data));
ipcMain.handle('db:setBillPrinted', (_, billId) => db.setBillPrinted(billId));
ipcMain.handle('db:getBills', (_, filters) => db.getBills(filters || {}));
ipcMain.handle('db:getBillItems', (_, billId) => db.getBillItems(billId));

ipcMain.handle('db:getSalesSummary', (_, filters) => db.getSalesSummary(filters || {}));

ipcMain.handle('db:getPurchases', (_, filters) => db.getPurchases(filters || {}));
ipcMain.handle('db:addPurchase', (_, data) => db.addPurchase(data));

ipcMain.handle('db:getBillsWithCredit', () => db.getBillsWithCredit());
ipcMain.handle('db:addCreditPayment', (_, billId, amount, paymentDate) => db.addCreditPayment(billId, amount, paymentDate));
ipcMain.handle('db:getCreditPayments', (_, billId) => db.getCreditPayments(billId));

ipcMain.on('bill:print', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) win.webContents.print({ silent: false });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
