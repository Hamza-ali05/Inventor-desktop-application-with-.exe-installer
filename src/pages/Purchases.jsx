import { useState, useEffect } from 'react';
import { getProducts, getPurchases, addPurchase } from '../api';
import './Purchases.css';

export default function Purchases() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    product_id: '',
    quantity: 1,
    total_value: '',
    purchase_date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    const [prods, purch] = await Promise.all([
      getProducts(),
      getPurchases({ fromDate: fromDate || undefined, toDate: toDate || undefined }),
    ]);
    setProducts(prods || []);
    setPurchases(purch || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id || !form.quantity || Number(form.total_value) <= 0) return;
    await addPurchase({
      product_id: Number(form.product_id),
      quantity: Number(form.quantity),
      total_value: Number(form.total_value),
      purchase_date: form.purchase_date,
    });
    setForm({
      product_id: '',
      quantity: 1,
      total_value: '',
      purchase_date: new Date().toISOString().slice(0, 10),
    });
    load();
  };

  const totalValue = purchases.reduce((s, p) => s + Number(p.total_value), 0);
  const totalQty = purchases.reduce((s, p) => s + Number(p.quantity), 0);

  return (
    <div className="purchases-page">
      <h1 className="page-title">Purchases</h1>
      <form onSubmit={handleSubmit} className="card purchase-form">
        <h2>Add purchase</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Product</label>
            <select
              value={form.product_id}
              onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Total value (₹)</label>
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
            <label>Date</label>
            <input
              type="date"
              value={form.purchase_date}
              onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary">Add purchase</button>
          </div>
        </div>
      </form>
      <div className="filters card form-row">
        <div className="form-group">
          <label>From date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>To date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="form-group">
          <button type="button" className="btn btn-primary" onClick={load}>Apply</button>
        </div>
      </div>
      <div className="summary card">
        <strong>Total quantity purchased:</strong> {totalQty} &nbsp;|&nbsp;
        <strong>Total purchase value:</strong> ₹{totalValue.toFixed(2)}
      </div>
      <div className="card">
        <h2>Purchase records</h2>
        {loading ? (
          <p>Loading…</p>
        ) : purchases.length === 0 ? (
          <p>No purchases in this period.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.product_name}</td>
                  <td>{p.quantity}</td>
                  <td>₹{Number(p.total_value).toFixed(2)}</td>
                  <td>{p.purchase_date.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
