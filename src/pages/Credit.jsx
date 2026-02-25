import { useState, useEffect } from 'react';
import { getBillsWithCredit, getBillItems, addCreditPayment } from '../api';
import './Credit.css';

export default function Credit() {
  const [bills, setBills] = useState([]);
  const [itemsByBill, setItemsByBill] = useState({});
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const load = async () => {
    setLoading(true);
    const list = await getBillsWithCredit();
    setBills(list || []);
    const items = {};
    await Promise.all(
      (list || []).map(async (b) => {
        items[b.id] = await getBillItems(b.id);
      })
    );
    setItemsByBill(items);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openPayModal = (bill) => {
    setPayModal(bill);
    setPayAmount('');
  };

  const handlePay = async () => {
    if (!payModal || !payAmount || Number(payAmount) <= 0) return;
    const amount = Number(payAmount);
    if (amount > (payModal.credit_remaining || 0)) {
      alert('Amount cannot exceed remaining amount.');
      return;
    }
    await addCreditPayment(payModal.id, amount, new Date().toISOString().slice(0, 19).replace('T', ' '));
    setPayModal(null);
    setPayAmount('');
    load();
  };

  return (
    <div className="credit-page">
      <h1 className="page-title">Credit</h1>
      <p className="credit-intro">Bills on credit. Add payment via Update to reduce remaining amount. Bill stays until remaining is 0.</p>
      {loading ? (
        <p>Loading…</p>
      ) : bills.length === 0 ? (
        <div className="card">
          <p>No credit bills. All bills are either paid or cash.</p>
        </div>
      ) : (
        <div className="credit-bills-list">
          {bills.map((bill) => (
            <div key={bill.id} className="card credit-bill-card">
              <div className="credit-bill-header">
                <span className="credit-bill-id">Bill #{bill.id}</span>
                <span className="credit-bill-date">{bill.bill_date ? bill.bill_date.slice(0, 16) : '—'}</span>
              </div>
              <div className="credit-bill-customer">
                <strong>Customer:</strong> {bill.customer_name || '—'} &nbsp;|&nbsp; <strong>Mobile:</strong> {bill.customer_mobile || '—'}
              </div>
              <div className="credit-bill-items-wrap">
                <table className="credit-bill-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(itemsByBill[bill.id] || []).map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name ?? '—'}</td>
                        <td>{item.quantity}</td>
                        <td>{Number(item.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="credit-bill-totals">
                <span><strong>Total:</strong> {Number(bill.total).toFixed(2)}</span>
                <span><strong>Paid:</strong> {Number(bill.amount_paid).toFixed(2)}</span>
                <span className="credit-remaining"><strong>Remaining:</strong> {Number(bill.credit_remaining).toFixed(2)}</span>
              </div>
              <div className="credit-bill-actions">
                <button type="button" className="btn btn-primary" onClick={() => openPayModal(bill)}>
                  Update (add payment)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add payment — Bill #{payModal.id}</h3>
            <p>Remaining: {Number(payModal.credit_remaining).toFixed(2)}</p>
            <div className="form-group">
              <label>Amount to pay</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                max={payModal.credit_remaining}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={handlePay}>
                Pay
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPayModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
