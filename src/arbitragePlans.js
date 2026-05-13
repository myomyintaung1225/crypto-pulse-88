/** Coin icon URLs (small) for arbitrage currency rows */
export const COIN_ICONS = {
  btc: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  eth: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  trx: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  usdt: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png',
  doge: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  usdc: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  shib: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  eos: 'https://assets.coingecko.com/coins/images/738/small/eos_coin.png',
  pepe: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  ltc: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  xrp: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  sol: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ada: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  waves: 'https://assets.coingecko.com/coins/images/425/small/waves.png',
  okb: 'https://assets.coingecko.com/coins/images/4463/small/okex_token.png',
  xmr: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png'
};

/**
 * Seven plans aligned to the arbitrage plan structure with investment thresholds and profit ranges.
 */
export const ARBITRAGE_PLANS = [
  {
    id: 'smart-a',
    listBadge: '1 DAY',
    durationShort: '1 Day',
    name: 'Smart Plan A',
    minAmount: 1001,
    maxAmount: 2000,
    profitLabel: '1.60-1.70%',
    participationLimit: 2,
    currencies: ['eth', 'btc', 'trx', 'usdt', 'doge', 'usdc']
  },
  {
    id: 'smart-b',
    listBadge: '3 DAY',
    durationShort: '3 Day',
    name: 'Smart Plan B',
    minAmount: 2001,
    maxAmount: 10000,
    profitLabel: '1.90-2.10%',
    participationLimit: 2,
    currencies: ['btc', 'eth', 'shib', 'trx', 'doge', 'usdc']
  },
  {
    id: 'smart-c',
    listBadge: '5 DAY',
    durationShort: '5 Day',
    name: 'Smart Plan C',
    minAmount: 10001,
    maxAmount: 50000,
    profitLabel: '2.20-2.70%',
    participationLimit: 2,
    currencies: ['eth', 'btc', 'trx', 'usdt', 'doge', 'usdc']
  },
  {
    id: 'smart-d',
    listBadge: '7 DAY',
    durationShort: '7 Day',
    name: 'Smart Plan D',
    minAmount: 50001,
    maxAmount: 200000,
    profitLabel: '2.80-3.30%',
    participationLimit: 3,
    currencies: ['doge', 'eos', 'btc', 'eth', 'usdc', 'pepe', 'shib', 'ltc']
  },
  {
    id: 'smart-e',
    listBadge: '10 DAY',
    durationShort: '10 Day',
    name: 'Smart Plan E',
    minAmount: 200001,
    maxAmount: 500000,
    profitLabel: '3.50-5.50%',
    participationLimit: 5,
    currencies: ['eth', 'trx', 'xrp', 'shib', 'doge', 'pepe', 'sol', 'btc']
  },
  {
    id: 'smart-vip',
    listBadge: '15 DAY',
    durationShort: '15 Day',
    name: 'Smart Plan VIP',
    minAmount: 500001,
    maxAmount: 3000000,
    profitLabel: '5.50-8.50%',
    participationLimit: 7,
    currencies: ['btc', 'eth', 'usdt', 'trx', 'doge', 'usdc', 'shib', 'sol']
  },
  {
    id: 'pulse-max',
    listBadge: '20 DAY',
    durationShort: '20 Day',
    name: 'Crypto pulse Max',
    minAmount: 3000001,
    maxAmount: 10000000,
    profitLabel: '6.50-10.00%',
    participationLimit: 9,
    currencies: ['ada', 'ltc', 'waves', 'eos', 'pepe', 'xrp', 'okb', 'trx', 'xmr', 'btc']
  }
];

export const ARBITRAGE_PLANS_BY_ID = ARBITRAGE_PLANS.reduce((acc, p) => {
  acc[p.id] = p;
  return acc;
}, {});

export function formatUsdRange(plan) {
  const lo = plan.minAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const hi = plan.maxAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return `$${lo}-${hi}`;
}

/** @returns {[number, number]} min and max daily % from label like "1.60-1.70%" */
export function parseProfitRange(label) {
  const m = String(label).match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (!m) return [0, 0];
  return [parseFloat(m[1]), parseFloat(m[2])];
}
