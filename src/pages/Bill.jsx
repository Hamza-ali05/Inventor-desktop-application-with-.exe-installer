import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getStockWithQuantity, createBill, setBillPrinted, printBill, isNearExpiry } from '../api';
import './Bill.css';

export default function Bill() {
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [creditAmountModal, setCreditAmountModal] = useState(false);
  const [creditCurrentAmount, setCreditCurrentAmount] = useState('');
  const [creditCustomerName, setCreditCustomerName] = useState('');
  const [creditCustomerMobile, setCreditCustomerMobile] = useState('');
  const [printPreviewModal, setPrintPreviewModal] = useState(false);
  const [printContent, setPrintContent] = useState(null);

  const location = useLocation();
  const loadProducts = async () => {
    const list = await getStockWithQuantity();
    const inStock = (list || []).filter((p) => {
      const qty = Number(p.quantity);
      if (Number.isNaN(qty) || qty <= 0) return false;
      return !isNearExpiry(p);
    });
    setProducts(inStock);
  };
  useEffect(() => {
    if (location.pathname === '/') loadProducts();
  }, [location.pathname]);

  const billItems = lines.slice(1);

  /** Available quantity for a product = stock minus quantities already on the bill (optionally excluding one line index). */
  const getAvailableForProduct = (productId, excludeLineIndex) => {
    const p = products.find((x) => x.id === Number(productId));
    if (!p) return 0;
    const inBill = lines.reduce((sum, line, i) => {
      if (i === 0) return sum;
      if (excludeLineIndex !== undefined && i === excludeLineIndex) return sum;
      if (Number(line.product_id) === Number(productId)) return sum + (Number(line.quantity) || 0);
      return sum;
    }, 0);
    return Math.max(0, (Number(p.quantity) || 0) - inBill);
  };

  const addLine = () => {
    const first = lines[0];
    if (!first?.product_id || !first?.quantity) return;
    const available = getAvailableForProduct(first.product_id);
    if (available <= 0) return;
    const qtyToAdd = Math.min(Number(first.quantity) || 1, available);
    setLines([{ product_id: '', quantity: 1 }, ...lines.slice(1), { product_id: first.product_id, quantity: qtyToAdd }]);
  };
  const removeLine = (index) => {
    if (index < 1 || index >= lines.length) return;
    setLines((l) => l.filter((_, i) => i !== index));
  };
  const updateLine = (index, field, value) => {
    if (field === 'quantity' && index >= 1) {
      const line = lines[index];
      const available = getAvailableForProduct(line.product_id, index);
      const capped = Math.min(Math.max(1, Number(value) || 1), available);
      setLines((l) => l.map((item, i) => (i === index ? { ...item, quantity: capped } : item)));
      return;
    }
    if (field === 'quantity' && index === 0) {
      const available = getAvailableForProduct(lines[0].product_id);
      const capped = Math.min(Math.max(1, Number(value) || 1), Math.max(1, available));
      setLines((l) => l.map((item, i) => (i === index ? { ...item, quantity: capped } : item)));
      return;
    }
    if (field === 'product_id' && index === 0) {
      const available = getAvailableForProduct(value);
      const newQty = Math.min(Number(lines[0].quantity) || 1, Math.max(1, available));
      setLines((l) => l.map((item, i) => (i === index ? { ...item, product_id: value, quantity: newQty } : item)));
      return;
    }
    setLines((l) => l.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const getLineTotal = (line) => {
    const p = products.find((x) => x.id === Number(line.product_id));
    if (!p) return 0;
    return (p.sale_price * (line.quantity || 0));
  };
  const subtotal = billItems.reduce((sum, line) => sum + getLineTotal(line), 0);
  const discountNum = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountNum);
  const canComplete = billItems.length > 0 && total > 0;

  const onCompleteBill = () => {
    if (!canComplete) return;
    if (paymentMethod === 'cash') {
      finishBill('cash', total, 0, true);
    } else {
      setCreditCurrentAmount('');
      setCreditCustomerName('');
      setCreditCustomerMobile('');
      setCreditAmountModal(true);
    }
  };

  const confirmCreditBill = () => {
    const current = Math.max(0, Number(creditCurrentAmount) || 0);
    const remaining = Math.max(0, total - current);
    finishBill('credit', total, current, true, remaining, creditCustomerName.trim(), creditCustomerMobile.trim());
    setCreditAmountModal(false);
    setCreditCurrentAmount('');
    setCreditCustomerName('');
    setCreditCustomerMobile('');
  };

  const finishBill = async (method, billTotal, amountPaid = 0, doPrint, creditRemaining, customerName = '', customerMobile = '') => {
    const items = billItems.map((l) => {
        const p = products.find((x) => x.id === Number(l.product_id));
        const q = Number(l.quantity) || 1;
        const unit_price = p.sale_price;
        const line_total = unit_price * q;
        return { product_id: p.id, quantity: q, unit_price, line_total, product_name: p.name };
      });
    if (billTotal <= 0) return;
    try {
      const payload = {
        payment_method: method,
        total: billTotal,
        items: items.map(({ product_id, quantity, unit_price, line_total }) => ({ product_id, quantity, unit_price, line_total })),
      };
      if (method === 'credit') {
        payload.amount_paid = amountPaid;
        payload.credit_remaining = creditRemaining ?? Math.max(0, billTotal - amountPaid);
        payload.customer_name = customerName || null;
        payload.customer_mobile = customerMobile || null;
      }
      const billId = await createBill(payload);
      if (doPrint && billId) {
        setBillPrinted(billId);
        setPrintContent({
          date: new Date().toLocaleString(),
          items,
          subtotal,
          discount: discountNum,
          total: billTotal,
          method: method === 'cash' ? 'Cash' : 'Credit',
          amountPaid: method === 'credit' ? amountPaid : billTotal,
          creditRemaining: method === 'credit' ? (creditRemaining ?? Math.max(0, billTotal - amountPaid)) : 0,
        });
        setLines([{ product_id: '', quantity: 1 }]);
        setDiscount('');
        setPrintPreviewModal(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create bill.');
    }
  };

  const handlePrintFromPreview = () => {
    printBill();
    setPrintPreviewModal(false);
    setTimeout(() => setPrintContent(null), 500);
  };

  const handleClosePreview = () => {
    setPrintPreviewModal(false);
    setPrintContent(null);
  };

  return (
    <div className="bill-page">
      <h1 className="page-title">Bill</h1>
      <div className="bill-items card">
        <div className="bill-add-row">
          <select
            value={lines[0]?.product_id ?? ''}
            onChange={(e) => updateLine(0, 'product_id', e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({Number(p.sale_price).toFixed(2)})
              </option>
            ))}
          </select>
          <select
            value={lines[0]?.quantity ?? 1}
            onChange={(e) => updateLine(0, 'quantity', Number(e.target.value))}
            className="bill-qty-select"
          >
            {(() => {
              const max = lines[0]?.product_id ? getAvailableForProduct(lines[0].product_id) : 1;
              const options = Array.from({ length: Math.max(1, max) }, (_, i) => i + 1);
              return options.map((n) => <option key={n} value={n}>{n}</option>);
            })()}
          </select>
          <button type="button" className="btn btn-primary" onClick={addLine}>
            Add item
          </button>
          <div className="bill-payment-options">
            <label className="bill-radio-label">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
              <span>Cash</span>
            </label>
            <label className="bill-radio-label">
              <input type="radio" name="paymentMethod" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
              <span>Credit</span>
            </label>
          </div>
        </div>
        <div className="bill-items-table-wrap">
          <table className="bill-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Total Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((line) => {
                const lineIndex = lines.findIndex((l) => l === line);
                const p = products.find((x) => x.id === Number(line.product_id));
                if (!p) return null;
                const lineTotal = getLineTotal(line);
                const available = getAvailableForProduct(line.product_id, lineIndex);
                const qtyOptions = Array.from({ length: Math.max(1, available) }, (_, i) => i + 1);
                return (
                  <tr key={lineIndex}>
                    <td>{p.name}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <select
                        value={line.quantity}
                        onChange={(e) => updateLine(lineIndex, 'quantity', Number(e.target.value))}
                        className="bill-qty-select"
                      >
                        {qtyOptions.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </td>
                    <td>{Number(p.sale_price).toFixed(2)}</td>
                    <td>{lineTotal.toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeLine(lineIndex)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {billItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="bill-empty-msg">No items added. Select a product above and click Add item.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bill-total card">
        {subtotal !== total && (
          <span className="bill-subtotal">Subtotal: {subtotal.toFixed(2)}</span>
        )}
        <label className="bill-discount-label">
          Discount (Rs): <input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bill-discount-input" placeholder="0" />
        </label>
        <strong>Total: {total.toFixed(2)}</strong>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCompleteBill}
          disabled={!canComplete}
          style={{ marginLeft: '1rem' }}
        >
          Complete bill
        </button>
      </div>

      {creditAmountModal && (
        <div className="modal-overlay" onClick={() => setCreditAmountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Credit — Customer & amount</h3>
            <div className="form-group">
              <label>Customer name</label>
              <input
                type="text"
                value={creditCustomerName}
                onChange={(e) => setCreditCustomerName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div className="form-group">
              <label>Mobile number</label>
              <input
                type="text"
                value={creditCustomerMobile}
                onChange={(e) => setCreditCustomerMobile(e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <p>Bill total: {total.toFixed(2)}</p>
            <div className="form-group">
              <label>Current amount (paid now)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={creditCurrentAmount}
                onChange={(e) => setCreditCurrentAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <p className="credit-remaining-line">
              <strong>Remaining amount:</strong> {(Math.max(0, total - (Number(creditCurrentAmount) || 0))).toFixed(2)}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={confirmCreditBill}>
                Confirm & Print
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setCreditAmountModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {printPreviewModal && printContent && (
        <div className="modal-overlay" onClick={handleClosePreview}>
          <div className="modal print-preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Print Preview</h3>
            <div className="bill-receipt-preview">
              <h1 className="receipt-shop-name">Hussnain Traders</h1>
              <p className="receipt-contact">Contact No: 0336-5230571</p>
              <p className="receipt-contact">Address: Shop # 900</p>
              <h2 className="receipt-title">Bill Receipt</h2>
              <p className="receipt-date">{printContent.date} — {printContent.method}</p>
              <table>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {printContent.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.unit_price).toFixed(2)}</td>
                      <td>{Number(item.line_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {printContent.discount > 0 && <p className="receipt-discount">Discount: {printContent.discount.toFixed(2)}</p>}
              <p className="bill-total">Total: {printContent.total.toFixed(2)}</p>
              {printContent.method === 'Credit' && (
                <>
                  <p className="receipt-credit-paid">Amount paid: {Number(printContent.amountPaid || 0).toFixed(2)}</p>
                  <p className="receipt-credit-remaining">Remaining: {Number(printContent.creditRemaining || 0).toFixed(2)}</p>
                </>
              )}
              <p className="receipt-footer">Software Developed By: Hamza Ali - 03115337854</p>
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={handlePrintFromPreview}>
                Print
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClosePreview}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {printContent && (
        <div className="print-only bill-receipt">
          <h1 className="receipt-shop-name">Hussnain Traders</h1>
          <p className="receipt-contact">Contact No: 0336-5230571</p>
          <p className="receipt-contact">Address: Shop # 900</p>
          <h2 className="receipt-title">Bill Receipt</h2>
          <p className="receipt-date">{printContent.date} — {printContent.method}</p>
          <table>
            <thead>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {printContent.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.unit_price).toFixed(2)}</td>
                  <td>{Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {printContent.discount > 0 && <p className="receipt-discount">Discount: {printContent.discount.toFixed(2)}</p>}
          <p className="bill-total">Total: {printContent.total.toFixed(2)}</p>
          {printContent.method === 'Credit' && (
            <>
              <p className="receipt-credit-paid">Amount paid: {Number(printContent.amountPaid || 0).toFixed(2)}</p>
              <p className="receipt-credit-remaining">Remaining: {Number(printContent.creditRemaining || 0).toFixed(2)}</p>
            </>
          )}
          <p className="receipt-footer">Software Developed By: Hamza Ali - 03115337854</p>
        </div>
      )}
    </div>
  );
}
