import { useState, useEffect } from 'react';
import { getProductsFromPurchases } from '../api';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await getProductsFromPurchases();
    setProducts(list || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="products-page">
      <div className="card products-table-card">
        <h2>Products ({products.length})</h2>
        <p className="products-hint">Only products added through the Purchase page are listed here.</p>
        {loading ? (
          <p>Loading…</p>
        ) : products.length === 0 ? (
          <p>No products yet. Add a purchase on the Purchases page to see products here.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Purchase price</th>
                  <th>Sale price</th>
                  <th>Entry date</th>
                  <th>Expiry date</th>
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
                    <td>{p.stock_entry_date ? p.stock_entry_date.slice(0, 10) : '—'}</td>
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
