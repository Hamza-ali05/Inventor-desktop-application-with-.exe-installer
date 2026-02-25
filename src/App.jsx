import { useState, useCallback } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import Login, { isAuthenticated, setAuthenticated } from './pages/Login';
import Bill from './pages/Bill';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchase from './pages/Purchase';

function Layout({ children, onLogout }) {
  return (
    <div className="app">
      <nav className="nav">
        <span className="nav-brand">Hussnain Traders</span>
        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Bill
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) => (isActive ? 'active' : '')}>
            Stock
          </NavLink>
          <NavLink to="/sales" className={({ isActive }) => (isActive ? 'active' : '')}>
            Sales
          </NavLink>
          <NavLink to="/purchase" className={({ isActive }) => (isActive ? 'active' : '')}>
            Purchase
          </NavLink>
        </div>
        <button type="button" className="btn btn-logout" onClick={onLogout}>
          Logout
        </button>
      </nav>
      <main className="main">{children}</main>
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
        </Routes>
      </Layout>
    </HashRouter>
  );
}
