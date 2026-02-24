import { useState, useEffect } from 'react';
import { getStockWithQuantity } from '../api';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await getStockWithQuantity();
    setProducts(list || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="products-page">
      <div className="card products-table-card">
        <h2>Stock ({products.length})</h2>
        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p>No stock yet. Add a purchase on the Purchases page to see stock here.</p>
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
                </tr>
              </thead>
              <tbody>
                {products.map((p, index) => (
                  <tr key={p.id}>
                    <td>{index + 1}</td>
                    <td>{p.name ?? '—'}</td>
                    <td>{p.quantity}</td>
                    <td>{Number(p.purchase_price).toFixed(2)}</td>
                    <td>{Number(p.sale_price).toFixed(2)}</td>
                    <td>{p.expiry_date ? p.expiry_date.slice(0, 10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
