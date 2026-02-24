import { useState, useEffect } from 'react';
import { getProducts, getProductsFromPurchases, addPurchase, addProduct, getPurchases, getPurchaseById, updatePurchase, deletePurchase } from '../api';
import './Purchases.css';

const QUANTITY_OPTIONS = Array.from({ length: 1000 }, (_, i) => i + 1);

function formatDate(str) {
  if (!str) return '—';
  return str.slice(0, 10);
}

const INITIAL_FORM = {
  product_name: '',
  product_id: '',
  quantity: 1,
  total_value: '',
  single_sale_price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  expiry_date: '',
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);
  const [addMode, setAddMode] = useState(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const totalVal = Number(form.total_value) || 0;
  const qty = Number(form.quantity) || 1;
  const singlePurchasePrice = qty > 0 ? (totalVal / qty).toFixed(2) : '';

  const loadPurchases = async () => {
    const list = await getPurchases({});
    setPurchases(list || []);
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const openNewPurchase = () => {
    setForm({ ...INITIAL_FORM, product_name: '', product_id: '' });
    setAddMode('new');
  };

  const openExistingItem = async () => {
    const products = await getProductsFromPurchases();
    setExistingProducts(products || []);
    setForm({ ...INITIAL_FORM, product_id: products?.length ? String(products[0].id) : '' });
    setAddMode('existing');
  };

  const closeForm = () => {
    setAddMode(null);
    setEditingPurchaseId(null);
    setForm(INITIAL_FORM);
  };

  const openEditPurchase = (purchase) => {
    setForm({
      product_name: purchase.product_name ?? '',
      product_id: String(purchase.product_id),
      quantity: purchase.quantity,
      total_value: String(purchase.total_value),
      single_sale_price: purchase.sale_price != null ? String(purchase.sale_price) : '',
      purchase_date: purchase.purchase_date ? purchase.purchase_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expiry_date: purchase.expiry_date ? purchase.expiry_date.slice(0, 10) : '',
    });
    setEditingPurchaseId(purchase.id);
    setAddMode('edit');
  };

  const handleDelete = async (id) => {
    try {
      await deletePurchase(Number(id));
      await loadPurchases();
    } catch (err) {
      console.error('Delete purchase failed:', err);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPurchaseId || !form.quantity || Number(form.total_value) <= 0) return;
    const salePrice = form.single_sale_price !== '' && !isNaN(Number(form.single_sale_price)) ? Number(form.single_sale_price) : undefined;
    await updatePurchase(editingPurchaseId, {
      quantity: Number(form.quantity),
      total_value: Number(form.total_value),
      sale_price: salePrice,
      purchase_date: form.purchase_date,
      expiry_date: form.expiry_date || undefined,
    });
    closeForm();
    loadPurchases();
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      purchase_date: new Date().toISOString().slice(0, 10),
    });
    if (addMode === 'existing' && existingProducts.length) {
      setForm((f) => ({ ...f, product_id: String(existingProducts[0].id) }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.quantity || Number(form.total_value) <= 0) return;
    let productId;
    if (addMode === 'existing') {
      productId = form.product_id ? Number(form.product_id) : null;
      if (!productId) return;
    } else {
      const name = form.product_name.trim();
      if (!name) return;
      const products = await getProducts();
      const product = products.find((p) => (p.name || '').trim().toLowerCase() === name.toLowerCase());
      if (product) {
        productId = product.id;
      } else {
        const purchasePricePerUnit = qty > 0 ? totalVal / qty : 0;
        const salePriceNum = form.single_sale_price !== '' && !isNaN(Number(form.single_sale_price)) ? Number(form.single_sale_price) : purchasePricePerUnit;
        productId = await addProduct({
          name,
          quantity: 0,
          purchase_price: purchasePricePerUnit,
          sale_price: salePriceNum,
          stock_entry_date: form.purchase_date,
          expiry_date: form.expiry_date || null,
        });
        if (!productId) {
          alert('Could not create product.');
          return;
        }
      }
    }
    const salePrice = form.single_sale_price !== '' && !isNaN(Number(form.single_sale_price)) ? Number(form.single_sale_price) : undefined;
    await addPurchase({
      product_id: productId,
      quantity: Number(form.quantity),
      total_value: Number(form.total_value),
      sale_price: salePrice,
      purchase_date: form.purchase_date,
      expiry_date: form.expiry_date || undefined,
    });
    resetForm();
    loadPurchases();
  };

  return (
    <div className="purchases-page">
      <h1 className="page-title">Purchases</h1>

      {addMode === null ? (
        <div className="card purchase-form purchase-form-buttons">
          <h2>Add purchase</h2>
          <div className="form-row form-row-buttons">
            <button type="button" className="btn btn-primary" onClick={openNewPurchase}>
              Add New Purchase
            </button>
            <button type="button" className="btn btn-primary" onClick={openExistingItem}>
              Add Existing Item
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={addMode === 'edit' ? handleUpdateSubmit : handleAddSubmit} className="card purchase-form">
          <h2>{addMode === 'edit' ? 'Update purchase' : addMode === 'new' ? 'Add New Purchase' : 'Add Existing Item'}</h2>
          <button type="button" className="btn btn-back" onClick={closeForm} aria-label="Back">
            ← Back
          </button>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              {addMode === 'edit' ? (
                <input type="text" value={form.product_name} readOnly className="input-readonly" />
              ) : addMode === 'new' ? (
                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              ) : (
                <select
                  value={form.product_id}
                  onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                  required
                >
                  <option value="">Select product</option>
                  {existingProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
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
            <label>Purchase Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.total_value}
              onChange={(e) => setForm((f) => ({ ...f, total_value: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>
          <div className="form-group">
            <label>Single Purchase Price</label>
            <input
              type="text"
              value={singlePurchasePrice}
              readOnly
              placeholder="0.00"
              className="input-single-purchase-price"
            />
          </div>
          <div className="form-group">
            <label>Single Sale Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.single_sale_price}
              onChange={(e) => setForm((f) => ({ ...f, single_sale_price: e.target.value }))}
              placeholder="0.00"
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
            <button type="submit" className="btn btn-primary">{addMode === 'edit' ? 'Update purchase' : 'Add purchase'}</button>
          </div>
        </div>
      </form>
      )}

      <div className="card purchases-list">
        <h2>All purchases</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Purchase Price</th>
                <th>Single Purchase Price</th>
                <th>Single Sale Price</th>
                <th>Purchase date</th>
                <th>Expiry date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={8}>No purchases yet. Add one above.</td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.product_name ?? '—'}</td>
                    <td>{p.quantity}</td>
                    <td>{Number(p.total_value).toFixed(2)}</td>
                    <td>{p.quantity > 0 ? (Number(p.total_value) / p.quantity).toFixed(2) : '—'}</td>
                    <td>{p.sale_price != null ? Number(p.sale_price).toFixed(2) : '—'}</td>
                    <td>{formatDate(p.purchase_date)}</td>
                    <td>{formatDate(p.expiry_date)}</td>
                    <td className="purchase-actions">
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => openEditPurchase(p)}>Update</button>
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                    </td>
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
