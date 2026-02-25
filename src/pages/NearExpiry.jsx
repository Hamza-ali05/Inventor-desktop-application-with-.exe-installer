import { useState, useEffect } from 'react';
import { getStockWithQuantity, isNearExpiry } from '../api';
import './NearExpiry.css';

const NEAR_DAYS = 30;

function formatDate(str) {
  if (!str) return '—';
  return str.slice(0, 10);
}

function daysUntil(expiryStr) {
  if (!expiryStr) return null;
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.ceil((new Date(expiryStr.slice(0, 10)) - new Date(today)) / (24 * 60 * 60 * 1000));
  return days;
}

export default function NearExpiry() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await getStockWithQuantity();
    const near = (list || []).filter(
      (p) => (Number(p.quantity) || 0) > 0 && p.expiry_date && isNearExpiry(p, NEAR_DAYS)
    );
    setProducts(near);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="near-expiry-page">
      <div className="card near-expiry-card">
        <h2>Near expiry items ({products.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p>No near-expiry items. All stocked products have expiry dates more than {NEAR_DAYS} days away or no expiry set.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Purchase price</th>
                  <th>Sale price</th>
                  <th>Expiry date</th>
                  <th>Days until expiry</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, index) => {
                  const days = daysUntil(p.expiry_date);
                  return (
                    <tr key={p.id}>
                      <td>{index + 1}</td>
                      <td>{p.name ?? '—'}</td>
                      <td>{p.quantity}</td>
                      <td>{Number(p.purchase_price).toFixed(2)}</td>
                      <td>{Number(p.sale_price).toFixed(2)}</td>
                      <td>{formatDate(p.expiry_date)}</td>
                      <td className={days !== null && days <= 7 ? 'near-expiry-soon' : ''}>
                        {days !== null ? (days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
