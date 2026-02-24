import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../api';
import './Products.css';

const QUANTITY_OPTIONS = Array.from({ length: 200 }, (_, i) => i + 1);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    quantity: 1,
    purchase_price: '',
    sale_price: '',
    stock_entry_date: new Date().toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    const list = await getProducts();
    setProducts(list || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      quantity: 1,
      purchase_price: '',
      sale_price: '',
      stock_entry_date: new Date().toISOString().slice(0, 10),
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity) || 0,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      stock_entry_date: form.stock_entry_date,
    };
    if (editingId) {
      await updateProduct(editingId, payload);
    } else {
      await addProduct(payload);
    }
    resetForm();
    load();
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      quantity: p.quantity,
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      stock_entry_date: p.stock_entry_date.slice(0, 10),
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(id);
      load();
    }
  };

  return (
    <div className="products-page">
      <h1 className="page-title">Products / Stock</h1>
      <form onSubmit={handleSubmit} className="product-form card">
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Product name"
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
              {editingId && form.quantity > 200 && (
                <option value={form.quantity}>{form.quantity}</option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Purchase price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={(e) => setForm((f) => ({ ...f, purchase_price: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Sale price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.sale_price}
              onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Stock entry date</label>
            <input
              type="date"
              value={form.stock_entry_date}
              onChange={(e) => setForm((f) => ({ ...f, stock_entry_date: e.target.value }))}
            />
          </div>
          <div className="form-group form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Add'} Product
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
      <div className="card">
        <h2>All products</h2>
        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p>No products. Add one above.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Purchase price</th>
                <th>Sale price</th>
                <th>Entry date</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>{Number(p.purchase_price).toFixed(2)}</td>
                  <td>{Number(p.sale_price).toFixed(2)}</td>
                  <td>{p.stock_entry_date.slice(0, 10)}</td>
                  <td className="no-print">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                    {' '}
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
