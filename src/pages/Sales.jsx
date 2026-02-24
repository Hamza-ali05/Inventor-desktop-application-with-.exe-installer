import { useState, useEffect } from 'react';
import { getSalesSummary, getBillsWithCredit, addCreditPayment, getCreditPayments } from '../api';
import './Sales.css';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [creditBills, setCreditBills] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [creditModal, setCreditModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  const load = async () => {
    setLoading(true);
    const filters = {};
    if (fromDate) filters.fromDate = fromDate;
    if (toDate) filters.toDate = toDate;
    const [summary, credit] = await Promise.all([
      getSalesSummary(filters),
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

  const byBill = sales.reduce((acc, row) => {
    const id = row.bill_id;
    if (!acc[id]) acc[id] = { date: row.bill_date, method: row.payment_method, total: row.total, amount_paid: row.amount_paid, credit_remaining: row.credit_remaining, items: [] };
    acc[id].items.push(row);
    return acc;
  }, {});
  const billList = Object.entries(byBill);
  const totalRevenue = billList.reduce((s, [, b]) => s + (b.total || 0), 0);
  const totalProfit = billList.reduce((s, [, b]) => {
    const itemsProfit = (b.items || []).reduce((sp, i) => sp + (Number(i.profit) || 0), 0);
    return s + itemsProfit;
  }, 0);
  const totalQty = sales.reduce((s, r) => s + (r.quantity || 0), 0);

  return (
    <div className="sales-page">
      <h1 className="page-title">Sales</h1>
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
        <strong>Total quantity sold:</strong> {totalQty} &nbsp;|&nbsp;
        <strong>Total revenue:</strong> ₹{totalRevenue.toFixed(2)} &nbsp;|&nbsp;
        <strong>Total profit:</strong> ₹{totalProfit.toFixed(2)}
      </div>
      <div className="card">
        <h2>Sales by bill</h2>
        {loading ? (
          <p>Loading…</p>
        ) : billList.length === 0 ? (
          <p>No sales in this period.</p>
        ) : (
          <>
            {billList.map(([billId, bill]) => (
              <div key={billId} className="bill-block">
                <div className="bill-header">
                  Bill #{billId} — {bill.date} — {bill.method} — Total: ₹{Number(bill.total).toFixed(2)}
                  {bill.method === 'credit' && Number(bill.credit_remaining) > 0 && (
                    <span className="credit-badge"> Credit remaining: ₹{Number(bill.credit_remaining).toFixed(2)}</span>
                  )}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit price</th>
                      <th>Line total</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bill.items || []).map((item, i) => (
                      <tr key={i}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>₹{Number(item.unit_price).toFixed(2)}</td>
                        <td>₹{Number(item.line_total).toFixed(2)}</td>
                        <td>₹{Number(item.profit).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
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
                  <td>₹{Number(b.total).toFixed(2)}</td>
                  <td>₹{Number(b.amount_paid).toFixed(2)}</td>
                  <td>₹{Number(b.credit_remaining).toFixed(2)}</td>
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
            <p>Remaining: ₹{Number(creditModal.credit_remaining).toFixed(2)}</p>
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
