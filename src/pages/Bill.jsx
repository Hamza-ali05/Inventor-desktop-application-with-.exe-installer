import { useState, useEffect } from 'react';
import { getProducts, createBill, setBillPrinted, printBill } from '../api';
import './Bill.css';

const QUANTITY_OPTIONS = Array.from({ length: 200 }, (_, i) => i + 1);

export default function Bill() {
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [printModal, setPrintModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [printContent, setPrintContent] = useState(null);

  const loadProducts = async () => {
    const list = await getProducts();
    setProducts(list || []);
  };
  useEffect(() => {
    loadProducts();
  }, []);

  const addLine = () => {
    setLines((l) => [...l, { product_id: '', quantity: 1 }]);
  };
  const removeLine = (index) => {
    if (lines.length <= 1) return;
    setLines((l) => l.filter((_, i) => i !== index));
  };
  const updateLine = (index, field, value) => {
    setLines((l) => l.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const getLineTotal = (line) => {
    const p = products.find((x) => x.id === Number(line.product_id));
    if (!p) return 0;
    return (p.sale_price * (line.quantity || 0));
  };
  const total = lines.reduce((sum, line, i) => sum + getLineTotal(line), 0);
  const canComplete = lines.some((l) => l.product_id && l.quantity) && total > 0;

  const openPaymentModal = () => {
    if (!canComplete) return;
    setPaymentModal(true);
  };

  const handlePaymentChoice = (method) => {
    setPendingPayment({ method });
    setPaymentModal(false);
    if (method === 'cash') {
      setPrintModal(true);
    } else {
      finishBill('credit', false);
    }
  };

  const finishBill = async (method, doPrint) => {
    const items = lines
      .filter((l) => l.product_id && l.quantity)
      .map((l) => {
        const p = products.find((x) => x.id === Number(l.product_id));
        const q = Number(l.quantity) || 1;
        const unit_price = p.sale_price;
        const line_total = unit_price * q;
        return { product_id: p.id, quantity: q, unit_price, line_total, product_name: p.name };
      });
    const billTotal = items.reduce((s, i) => s + i.line_total, 0);
    if (billTotal <= 0) return;
    try {
      const billId = await createBill({
        payment_method: method,
        total: billTotal,
        items: items.map(({ product_id, quantity, unit_price, line_total }) => ({ product_id, quantity, unit_price, line_total })),
      });
      if (doPrint && billId) {
        setBillPrinted(billId);
        setPrintContent({
          date: new Date().toLocaleString(),
          items,
          total: billTotal,
          method: 'Cash',
        });
        setLines([{ product_id: '', quantity: 1 }]);
        setPrintModal(false);
        setPendingPayment(null);
        setTimeout(() => {
          printBill();
          setTimeout(() => setPrintContent(null), 500);
        }, 100);
      } else {
        setLines([{ product_id: '', quantity: 1 }]);
        setPrintModal(false);
        setPendingPayment(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create bill.');
    }
  };

  const handlePrintAnswer = (yes) => {
    if (yes) {
      finishBill('cash', true);
    } else {
      finishBill('cash', false);
    }
  };

  return (
    <div className="bill-page">
      <h1 className="page-title">Bill</h1>
      <div className="bill-items card">
        {lines.map((line, index) => (
          <div key={index} className="bill-item-row">
            <select
              value={line.product_id}
              onChange={(e) => updateLine(index, 'product_id', e.target.value)}
            >
              <option value="">Select product</option>
              {products.filter((p) => p.quantity > 0).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{Number(p.sale_price).toFixed(2)})
                </option>
              ))}
            </select>
            <select
              value={line.quantity}
              onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
              style={{ width: '80px' }}
            >
              {QUANTITY_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="line-total">
              ₹{getLineTotal(line).toFixed(2)}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeLine(index)} disabled={lines.length <= 1}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-primary" onClick={addLine}>
          Add item
        </button>
      </div>
      <div className="bill-total card">
        Total: ₹{total.toFixed(2)}
        <button
          type="button"
          className="btn btn-primary"
          onClick={openPaymentModal}
          disabled={!canComplete}
          style={{ marginLeft: '1rem' }}
        >
          Complete bill
        </button>
      </div>

      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Payment method</h3>
            <p>Total: ₹{total.toFixed(2)}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => handlePaymentChoice('cash')}>
                Cash
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handlePaymentChoice('credit')}>
                Credit
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setPaymentModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {printModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Print bill?</h3>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => handlePrintAnswer(true)}>
                Yes, print
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handlePrintAnswer(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {printContent && (
        <div className="print-only bill-receipt">
          <h1 className="receipt-shop-name">Hussnain Traders</h1>
          <h2>Bill Receipt</h2>
          <p>{printContent.date} — {printContent.method}</p>
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {printContent.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{Number(item.unit_price).toFixed(2)}</td>
                  <td>₹{Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="bill-total">Total: ₹{printContent.total.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
