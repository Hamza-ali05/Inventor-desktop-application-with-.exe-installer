import { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import Login, { isAuthenticated, setAuthenticated } from './pages/Login';
import Bill from './pages/Bill';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';
import NearExpiry from './pages/NearExpiry';
import Credit from './pages/Credit';

const iconBill = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const iconStock = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const iconSales = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const iconPurchase = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const iconNearExpiry = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const iconCredit = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const sidebarLinks = [
  { to: '/', end: true, label: 'Bill', icon: iconBill },
  { to: '/stock', end: false, label: 'Stock', icon: iconStock },
  { to: '/sales', end: false, label: 'Sales', icon: iconSales },
  { to: '/purchase', end: false, label: 'Purchase', icon: iconPurchase },
  { to: '/near-expiry', end: false, label: 'Near Expiry', icon: iconNearExpiry },
  { to: '/credit', end: false, label: 'Credit', icon: iconCredit },
];

function Layout({ children, onLogout }) {
  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-brand">Hussnain Traders</span>
        <button type="button" className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </nav>
      <div className="app-body">
        <aside className="sidebar">
          {sidebarLinks.map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </NavLink>
          ))}
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => isAuthenticated());

  const handleLogin = useCallback(() => {
    setAuth(true);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthenticated(false);
    setAuth(false);
  }, []);

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Bill />} />
          <Route path="/stock" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/near-expiry" element={<NearExpiry />} />
          <Route path="/credit" element={<Credit />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
