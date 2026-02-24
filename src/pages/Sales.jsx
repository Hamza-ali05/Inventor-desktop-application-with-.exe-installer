import { useState, useEffect } from 'react';
import { getSalesSummary, getBillsWithCredit, addCreditPayment, getCreditPayments } from '../api';
import './Sales.css';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [creditBills, setCreditBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creditModal, setCreditModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const load = async () => {
    setLoading(true);
    const [summary, credit] = await Promise.all([
      getSalesSummary({}),
      getBillsWithCredit(),
    ]);
    setSales(summary || []);
    setCreditBills(credit || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePayCredit = async () => {
    if (!creditModal || !payAmount || Number(payAmount) <= 0) return;
    const amount = Number(payAmount);
    await addCreditPayment(creditModal.id, amount, new Date().toISOString().slice(0, 19).replace('T', ' '));
    setCreditModal(null);
    setPayAmount('');
    load();
  };

  const totalRevenue = sales.reduce((s, r) => s + (Number(r.line_total) || 0), 0);
  const totalProfit = sales.reduce((s, r) => s + (Number(r.profit) || 0), 0);
  const totalQty = sales.reduce((s, r) => s + (r.quantity || 0), 0);

  return (
    <div className="sales-page">
      <h1 className="page-title">Sales</h1>
      <div className="summary card">
        <strong>Total quantity sold:</strong> {totalQty} &nbsp;|&nbsp;
        <strong>Total revenue:</strong> {totalRevenue.toFixed(2)} &nbsp;|&nbsp;
        <strong>Total profit:</strong> {totalProfit.toFixed(2)}
      </div>
      <div className="card">
        {loading ? (
          <p>Loading…</p>
        ) : sales.length === 0 ? (
          <p>No sales yet.</p>
        ) : (
          <div className="sales-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((row, i) => (
                  <tr key={`${row.bill_id}-${row.product_id}-${i}`}>
                    <td>{row.bill_id}</td>
                    <td>{row.product_name}</td>
                    <td>{row.quantity}</td>
                    <td>{Number(row.unit_price).toFixed(2)}</td>
                    <td>{Number(row.line_total).toFixed(2)}</td>
                    <td>{Number(row.profit).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {creditBills.length > 0 && (
        <div className="card">
          <h2>Credit bills (pay remaining)</h2>
          <table>
            <thead>
              <tr>
                <th>Bill ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {creditBills.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.bill_date}</td>
                  <td>{Number(b.total).toFixed(2)}</td>
                  <td>{Number(b.amount_paid).toFixed(2)}</td>
                  <td>{Number(b.credit_remaining).toFixed(2)}</td>
                  <td>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreditModal(b)}>
                      Pay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creditModal && (
        <div className="modal-overlay" onClick={() => setCreditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pay credit — Bill #{creditModal.id}</h3>
            <p>Remaining: {Number(creditModal.credit_remaining).toFixed(2)}</p>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Amount to pay"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handlePayCredit}>
                Pay
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setCreditModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
