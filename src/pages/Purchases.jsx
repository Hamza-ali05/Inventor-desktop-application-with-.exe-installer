import { useState, useEffect } from 'react';
import { getProducts, addPurchase, addProduct, getPurchases } from '../api';
import './Purchases.css';

const QUANTITY_OPTIONS = Array.from({ length: 1000 }, (_, i) => i + 1);

function formatDate(str) {
  if (!str) return '—';
  return str.slice(0, 10);
}

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({
    product_name: '',
    quantity: 1,
    total_value: '',
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
  });

  const totalVal = Number(form.total_value) || 0;
  const qty = Number(form.quantity) || 1;
  const salePriceAuto = qty > 0 ? (totalVal / qty).toFixed(2) : '';

  const loadPurchases = async () => {
    const list = await getPurchases({});
    setPurchases(list || []);
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.product_name.trim();
    if (!name || !form.quantity || Number(form.total_value) <= 0) return;
    let productId;
    const products = await getProducts();
    const product = products.find((p) => (p.name || '').trim().toLowerCase() === name.toLowerCase());
    if (product) {
      productId = product.id;
    } else {
      const salePriceNum = qty > 0 ? totalVal / qty : 0;
      productId = await addProduct({
        name,
        quantity: 0,
        purchase_price: salePriceNum,
        sale_price: salePriceNum,
        stock_entry_date: form.purchase_date,
        expiry_date: form.expiry_date || null,
      });
      if (!productId) {
        alert('Could not create product.');
        return;
      }
    }
    const salePrice = qty > 0 ? totalVal / qty : undefined;
    await addPurchase({
      product_id: productId,
      quantity: Number(form.quantity),
      total_value: Number(form.total_value),
      sale_price: salePrice,
      purchase_date: form.purchase_date,
      expiry_date: form.expiry_date || undefined,
    });
    setForm({
      product_name: '',
      quantity: 1,
      total_value: '',
      purchase_date: new Date().toISOString().slice(0, 10),
      expiry_date: '',
    });
    loadPurchases();
  };

  return (
    <div className="purchases-page">
      <h1 className="page-title">Purchases</h1>
      <form onSubmit={handleSubmit} className="card purchase-form">
        <h2>Add purchase</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={form.product_name}
              onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
              placeholder="Enter product name"
              required
            />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <select
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
            >
              {QUANTITY_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Total value</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.total_value}
              onChange={(e) => setForm((f) => ({ ...f, total_value: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Sale price for single quantity</label>
            <input
              type="text"
              value={salePriceAuto}
              readOnly
              placeholder="Total value ÷ Quantity"
            />
          </div>
          <div className="form-group">
            <label>Purchase date</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Expiry date</label>
            <input
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary">Add purchase</button>
          </div>
        </div>
      </form>

      <div className="card purchases-list">
        <h2>All purchases</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total value</th>
                <th>Sale price (unit)</th>
                <th>Purchase date</th>
                <th>Expiry date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={6}>No purchases yet. Add one above.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.product_name ?? '—'}</td>
                    <td>{p.quantity}</td>
                    <td>{Number(p.total_value).toFixed(2)}</td>
                    <td>{p.sale_price != null ? Number(p.sale_price).toFixed(2) : '—'}</td>
                    <td>{formatDate(p.purchase_date)}</td>
                    <td>{formatDate(p.expiry_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
