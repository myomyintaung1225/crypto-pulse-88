import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
  orderBy
} from 'firebase/firestore';
import {
  ArrowLeft,
  Bot,
  Check,
  Cpu,
  Info,
  Sparkles,
  ShieldCheck,
  X,
  Zap
} from 'lucide-react';
import { db } from './firebase';
import {
  ARBITRAGE_PLANS,
  ARBITRAGE_PLANS_BY_ID,
  COIN_ICONS,
  formatUsdRange,
  parseProfitRange
} from './arbitragePlans';
import './ArbitragePage.css';

const RULE_MODAL_TITLE = 'What is AI Arbitrage?';

const COOLDOWN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function generateRandomProfitRate(plan) {
  const [minProfit, maxProfit] = parseProfitRange(plan.profitLabel);
  if (!Number.isFinite(minProfit) || !Number.isFinite(maxProfit) || maxProfit < minProfit) {
    return minProfit || 0;
  }
  const rate = minProfit + Math.random() * (maxProfit - minProfit);
  return Number(rate.toFixed(4));
}

function buildProfitValues(amount, profitRate) {
  const totalProfit = Number((amount * (profitRate / 100)).toFixed(2));
  const totalReturn = Number((amount + totalProfit).toFixed(2));
  return { totalProfit, totalReturn };
}

function getCooldownWindowStart() {
  return new Date(Date.now() - COOLDOWN_WINDOW_MS);
}

const RULE_PARAGRAPHS = [
  'AI Arbitrage is a smart engine that balances your funds, buys low and sells high, and captures systematic spread opportunities across 200+ exchanges.',
  'Our arbitrage robot continuously scans global markets, screens price spreads, and routes orders automatically without manual oversight.',
  'This strategy is built to reduce execution friction with a focus on balanced capital allocation and encrypted risk controls.'
];

function ArbHexLogo({ size = 44 }) {
  return (
    <div className="arb-hex-logo" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 48 48" className="arb-hex-logo-svg">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M24 6l16 9v18l-16 9-16-9V15z"
        />
        <text x="24" y="31" textAnchor="middle" className="arb-hex-logo-c" fill="currentColor">
          C
        </text>
      </svg>
    </div>
  );
}

function ArbRuleModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="arb-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="arb-modal glass-modal"
        role="dialog"
        aria-labelledby="arb-rule-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="arb-modal-head">
          <div className="arb-modal-info-icon-wrap" aria-hidden>
            <Info size={26} strokeWidth={2} />
          </div>
          <button type="button" className="arb-modal-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        <h2 id="arb-rule-title" className="arb-modal-title">
          {RULE_MODAL_TITLE}
        </h2>
        <div className="arb-modal-body">
          {RULE_PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArbConfirmModal({ open, plan, amount, busy, onConfirm, onCancel }) {
  if (!open || !plan) return null;
  return (
    <div className="arb-modal-overlay" onClick={onCancel} role="presentation">
      <div className="arb-modal glass-modal arb-confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="arb-confirm-title">Confirm escrow order</h3>
        <p className="arb-confirm-plan">
          {plan.name} · {plan.durationShort}
        </p>
        <p className="arb-confirm-amt">
          Pledge <strong>${Number(amount).toLocaleString()}</strong> USDT from your wallet?
        </p>
        <p className="arb-confirm-note">
          This creates an active pledge (escrow). Your balance will be reduced immediately.
        </p>
        <div className="arb-confirm-actions">
          <button type="button" className="arb-btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="arb-btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArbCompletionModal({ open, amount, onContinue }) {
  if (!open || !amount) return null;
  return (
    <div className="arb-modal-overlay" onClick={onContinue} role="presentation">
      <div className="arb-modal glass-modal arb-completion" onClick={(e) => e.stopPropagation()}>
        <h3 className="arb-completion-title">Arbitrage Plan Finished</h3>
        <p className="arb-completion-body">
          Your investment plus profit of <strong>${Number(amount).toLocaleString()}</strong> USDT has been successfully returned to your wallet.
        </p>
        <div className="arb-completion-actions">
          <button type="button" className="arb-btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArbitragePage({ userId, userBalance, isLoggedIn, onBack, onRequireLogin }) {
  const [ruleOpen, setRuleOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [escrowInput, setEscrowInput] = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrderTotal, setActiveOrderTotal] = useState(0);

  const [timeRemaining, setTimeRemaining] = useState('--:--:--');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [pageBalance, setPageBalance] = useState(userBalance);
  const [completedAmount, setCompletedAmount] = useState(0);
  const completingOrderIdsRef = useRef(new Set());

  useEffect(() => {
    setEscrowInput('');
  }, [selectedPlanId]);

  useEffect(() => {
    setPageBalance(userBalance);
  }, [userBalance]);

  // Never Lose completion (escrow_orders)
  const completeEscrowOrder = useCallback(
    async (order) => {
      if (!order?.id) return;
      if (completingOrderIdsRef.current.has(order.id)) return;
      completingOrderIdsRef.current.add(order.id);

      const plan = ARBITRAGE_PLANS_BY_ID[order.planId];
      if (!plan) {
        completingOrderIdsRef.current.delete(order.id);
        return;
      }

      let completedTotalReturn = 0;
      let completedTotalProfit = 0;

      try {
        await runTransaction(db, async (tx) => {
          const orderRef = doc(db, 'escrow_orders', order.id);
          const orderSnap = await tx.get(orderRef);
          if (!orderSnap.exists()) return;
          const orderData = orderSnap.data();
          if (orderData.status !== 'active') return;

          const userRef = doc(db, 'users', userId);
          const userSnap = await tx.get(userRef);
          if (!userSnap.exists()) throw new Error('User not found');

          const currentBalance = Number(userSnap.data().balance) || 0;
          const initialAmount = Number(orderData.initialAmount ?? orderData.amount) || 0;
          const profitRate = Number(orderData.profitRate ?? generateRandomProfitRate(plan));
          const { totalProfit, totalReturn } = buildProfitValues(initialAmount, profitRate);

          completedTotalProfit = totalProfit;
          completedTotalReturn = totalReturn;

          tx.update(orderRef, {
            status: 'completed',
            completedAt: new Date(),
            totalProfit,
            totalReturn,
            profitRate
          });

          tx.update(userRef, { balance: currentBalance + totalReturn });
        });

        if (completedTotalReturn > 0) {
          setCompletedAmount(completedTotalReturn);
          setPageBalance((prev) => prev + completedTotalReturn);
        }
      } catch (e) {
        console.error('Failed to complete escrow order:', e);
      } finally {
        completingOrderIdsRef.current.delete(order.id);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!userId) {
      setActiveOrders([]);
      return;
    }

    // Simplified query to match index: userId only
    const q = query(
      collection(db, 'escrow_orders'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter 'active' status in JS memory to avoid index requirements
      const activeOnly = allOrders.filter(o => o.status === 'active');
      
      console.log('Database Data Found:', activeOnly);
      setActiveOrders(activeOnly);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, [userId]);


  useEffect(() => {
    setActiveOrderTotal(
      activeOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0)
    );
  }, [activeOrders]);

  const getPlanEndTime = (order) => {
    const start = order.startTime?.toDate?.() || order.createdAt?.toDate?.();
    const durationDays = Number(order.durationDays || order.duration || 0);
    return start ? start.getTime() + durationDays * 24 * 60 * 60 * 1000 : 0;
  };

  const latestActiveOrder = useMemo(() => {
    const orders = activeOrders
      .map((order) => ({ ...order, endTime: getPlanEndTime(order) }))
      .filter((order) => order.endTime > 0);
    if (!orders.length) return null;
    return orders.reduce((latest, order) => (!latest || order.endTime > latest.endTime ? order : latest), null);
  }, [activeOrders]);

  useEffect(() => {
    if (!latestActiveOrder) {
      setTimeRemaining('--:--:--');
      return undefined;
    }

    const tick = async () => {
      const diff = Math.max(0, latestActiveOrder.endTime - Date.now());
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimeRemaining(`${hours}:${minutes}:${seconds}`);

      if (diff <= 0) {
        await completeEscrowOrder(latestActiveOrder);
      }
    };

    tick();
    const timerId = window.setInterval(() => {
      void tick();
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [latestActiveOrder, completeEscrowOrder]);


  const selectedPlan = useMemo(
    () => ARBITRAGE_PLANS.find((p) => p.id === selectedPlanId) || null,
    [selectedPlanId]
  );

  const hasActiveEscrowOrder = activeOrders.length > 0;

  // Keep one-plan limit + investment-range validation at UI level
  const clampAndValidateAmountForPlan = (plan, raw) => {
    if (!plan) return { ok: false, amount: 0, error: 'No plan selected' };
    const cleaned = String(raw ?? '').replace(/,/g, '').trim();
    const amt = Number(cleaned);
    if (!Number.isFinite(amt) || amt <= 0) return { ok: false, amount: 0, error: 'Please enter a valid quantity.' };
    if (amt < plan.minAmount || amt > plan.maxAmount) {
      return {
        ok: false,
        amount: amt,
        error: `Amount must be between $${plan.minAmount.toLocaleString()} and $${plan.maxAmount.toLocaleString()}.`
      };
    }
    if (amt > userBalance) return { ok: false, amount: amt, error: 'Insufficient wallet balance.' };
    return { ok: true, amount: amt, error: '' };
  };


  const countRecentPlanOrders = async (planId) => {
    const windowStart = getCooldownWindowStart();
    const planOrders = await getDocs(
      query(
        collection(db, 'escrow_orders'),
        where('userId', '==', userId),
        where('planId', '==', planId),
        orderBy('createdAt', 'desc')
      )
    );
    return planOrders.docs.filter((doc) => {
      const createdAt = doc.data().createdAt;
      return createdAt && createdAt.toDate() >= windowStart;
    }).length;
  };

  const isPlanCooldownBlocked = async (plan) => {
    if (!plan || !userId) return false;
    const count = await countRecentPlanOrders(plan.id);
    return count >= plan.participationLimit;
  };

  // Purchase (atomic): users.balance - amount + create escrow_orders doc
  const submitPledge = async (plan, amount) => {
    if (!plan || !userId) return;
    if (hasActiveEscrowOrder) {
      alert('Please wait for your current plan to finish before starting a new one.');
      return;
    }
    if (await isPlanCooldownBlocked(plan)) {
      alert(`You have reached the ${plan.participationLimit}-investment limit for ${plan.name} within the last 30 days. Please wait until the cooldown period expires.`);
      return;
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    if (amt < plan.minAmount || amt > plan.maxAmount) {
      alert(`Amount must be between $${plan.minAmount.toLocaleString()} and $${plan.maxAmount.toLocaleString()}.`);
      return;
    }
    if (amt > userBalance) {
      alert('Insufficient balance.');
      return;
    }

    setSubmitBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        const balance = Number(userSnap.data().balance) || 0;
        if (balance < amt) throw new Error('Insufficient balance');

        const profitRate = generateRandomProfitRate(plan);
        const orderRef = doc(collection(db, 'escrow_orders'));
        tx.set(orderRef, {
          userId,
          planId: plan.id,
          planName: plan.name,
          amount: amt,
          initialAmount: amt,
          profitRate,
          durationDays: Number.parseInt(plan.listBadge, 10) || 0,
          profitLabel: plan.profitLabel,
          participationLimit: plan.participationLimit,
          status: 'active',
          currencies: Array.isArray(plan.currencies) ? plan.currencies : [],
          createdAt: new Date(),
          startTime: new Date(),
          completedAt: null,
          totalProfit: 0,
          totalReturn: 0
        });

        tx.update(userRef, { balance: balance - amt });
      });

      setPageBalance((prev) => Math.max(0, prev - amt));
      setEscrowInput('');
      setConfirmOpen(false);
      alert('Escrow order created. Funds have been pledged from your wallet.');
    } catch (e) {
      console.error(e);
      alert(e.message || 'Could not complete pledge. Try again.');
    } finally {
      setSubmitBusy(false);
    }
  };


  const investPlan = async (plan) => {
    if (!isLoggedIn || !userId) {
      onRequireLogin();
      return;
    }
    if (hasActiveEscrowOrder) {
      alert('Please wait for your current plan to finish before starting a new one.');
      return;
    }
    if (await isPlanCooldownBlocked(plan)) {
      alert(`You have reached the ${plan.participationLimit}-investment limit for ${plan.name} within the last 30 days. Please wait until the cooldown period expires.`);
      return;
    }
    if (pageBalance < plan.minAmount) {
      alert('Insufficient wallet balance.');
      return;
    }
    await submitPledge(plan, plan.minAmount);
  };

  const countPlanPledges = useCallback(
    (planId) => activeOrders.filter((o) => o.planId === planId && o.status === 'active').length,
    [activeOrders]
  );



  const scrollToPlans = () => {
    document.getElementById('arb-plans')?.scrollIntoView({ behavior: 'smooth' });
  };


  const validateAndPromptHost = async () => {
    if (!isLoggedIn || !userId) {
      onRequireLogin();
      return;
    }
    if (hasActiveEscrowOrder) {
      alert('Please wait for your current plan to finish before starting a new one.');
      return;
    }
    if (!selectedPlan) return;
    if (await isPlanCooldownBlocked(selectedPlan)) {
      alert(`You have reached the ${selectedPlan.participationLimit}-investment limit for ${selectedPlan.name} within the last 30 days. Please wait until the cooldown period expires.`);
      return;
    }
    const { ok, amount, error } = clampAndValidateAmountForPlan(selectedPlan, escrowInput);
    if (!ok) {
      alert(error);
      return;
    }
    setConfirmOpen(true);
  };

  const executePledge = async () => {
    // uses submitPledge to create escrow_orders atomically
    if (!selectedPlan) return;
    const { ok, amount, error } = clampAndValidateAmountForPlan(selectedPlan, escrowInput);
    if (!ok) {
      alert(error);
      return;
    }
    await submitPledge(selectedPlan, amount);
  };


  if (selectedPlan) {
    const nActive = countPlanPledges(selectedPlan.id);
    return (
      <div className="arb-page">
        <header className="arb-topbar glass-bar">
          <button type="button" className="arb-icon-btn" onClick={() => setSelectedPlanId(null)} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="arb-title">Arbitrage</h1>
          <button type="button" className="arb-icon-btn" onClick={() => setRuleOpen(true)} aria-label="Rules information">
            <Info size={22} />
          </button>
        </header>

        <div className="arb-scroll">
          <section className="arb-detail-card glass-panel arb-detail-card--single">
            <div className="arb-detail-head">
              <ArbHexLogo size={48} />
              <div className="arb-detail-head-text">
                <h2 className="arb-detail-name">{selectedPlan.name}</h2>
                <p className="arb-detail-sub">{selectedPlan.listBadge} • {selectedPlan.profitLabel} daily</p>
              </div>
              <span className="arb-detail-duration">{selectedPlan.durationShort}</span>
            </div>

            <div className="arb-metric-row">
              <div>
                <span className="arb-metric-label">Investment range</span>
                <div className="arb-metric-val">{formatUsdRange(selectedPlan)}</div>
              </div>
              <div className="arb-metric-right">
                <span className="arb-metric-label">Estimated yield</span>
                <div className="arb-metric-val">{selectedPlan.profitLabel}</div>
              </div>
            </div>
            <div className="arb-divider" />

            <div className="arb-section-label">Allocation instruments</div>
            <div className="arb-coin-row">
              {selectedPlan.currencies.map((c) => (
                <div key={c} className="arb-coin-pill">
                  <img src={COIN_ICONS[c] || COIN_ICONS.btc} alt={c} className="arb-coin" />
                  <span>{c.toUpperCase()}</span>
                </div>
              ))}
            </div>

            <div className="arb-divider" />
            <div className="arb-limit-row">
              <span>Participation limit</span>
              <em>{selectedPlan.participationLimit}/Person · {nActive} active</em>
            </div>

            <div className="arb-section-label">Invest amount</div>
            <div className="arb-input-row">
              <img src={COIN_ICONS.usdt} alt="USDT" className="arb-input-usdt" />
              <span className="arb-input-qty-lbl">Minimum</span>
              <input
                className="arb-input"
                type="text"
                inputMode="decimal"
                placeholder="Enter amount"
                value={escrowInput}
                onChange={(e) => setEscrowInput(e.target.value)}
              />
            </div>

            <button type="button" className="arb-host-btn" onClick={validateAndPromptHost} disabled={submitBusy || hasActiveEscrowOrder}>
              Invest this plan
            </button>
            {hasActiveEscrowOrder && (
              <div className="arb-active-message">
                Please wait for your current plan to finish before starting a new one.
              </div>
            )}

            <ul className="arb-foot-list">
              <li><Check size={18} className="arb-check" /> Daily income paid to USDT wallet</li>
              <li><Check size={18} className="arb-check" /> AI arbitrage robot scans 200+ exchanges</li>
            </ul>
          </section>
        </div>

        <ArbRuleModal open={ruleOpen} onClose={() => setRuleOpen(false)} />
        <ArbConfirmModal
          open={confirmOpen}
          plan={selectedPlan}
          amount={escrowInput}
          busy={submitBusy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={executePledge}
        />
      </div>
    );
  }

  return (
    <div className="arb-page">
      <header className="arb-topbar glass-bar">
        <button type="button" className="arb-icon-btn" onClick={onBack} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="arb-title">AI Arbitrage</h1>
        <button type="button" className="arb-icon-btn" onClick={() => setRuleOpen(true)} aria-label="Rules information">
          <Info size={22} />
        </button>
      </header>

      <div className="arb-scroll">
        <section className="arb-active-header glass-panel">
          <div className="arb-active-info">
            <span className="arb-active-title">Total Active Arbitrage</span>
            <div className="arb-active-amount">
              ${activeOrderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="arb-active-timer">
            <span className="arb-active-label">Time Remaining</span>
            <div className="arb-active-countdown">
              {latestActiveOrder ? timeRemaining : '--:--:--'}
            </div>
          </div>
        </section>
        {hasActiveEscrowOrder && (
          <section className="arb-active-warning glass-panel">
            You have an active arbitrage order in progress. New investments are disabled until the current order completes.
          </section>
        )}

        <section className="arb-hero glass-hero">
          <div className="arb-hero-inner">
            <div className="arb-hero-copy">
              <span className="arb-pos-label">Wallet balance</span>
              <div className="arb-pos-value">${pageBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <p className="arb-hero-copy-sub">Automatic fund balancing, buy-low/sell-high order routing, and 200+ exchange screening by our AI robot.</p>
              <button type="button" className="arb-escrow-ghost" onClick={scrollToPlans}>
                Browse plans
              </button>
            </div>
            <div className="arb-hero-bot" aria-hidden>
              <Bot size={112} strokeWidth={1} className="arb-bot-svg" />
            </div>
          </div>
        </section>

        <section className="arb-info-panel glass-panel">
          <div className="arb-info-head">
            <div>
              <h2>What is AI Arbitrage?</h2>
              <p>AI Arbitrage is an automated market strategy that balances capital across price paths, buys low and sells high, and continuously scans 200+ global exchanges to capture spreads faster than manual trading.</p>
            </div>
            <div className="arb-info-icon"><Zap size={28} /></div>
          </div>
          <ul className="arb-info-list">
            <li><Sparkles size={18} />Balances funds automatically to optimize exposure to arbitrage opportunities.</li>
            <li><Cpu size={18} />Uses a screening robot that monitors more than 200 exchanges for cross-market inefficiencies.</li>
            <li><ShieldCheck size={18} />Executes trades with consistent risk-aware rules and high-standard vault controls.</li>
          </ul>
        </section>

        <section id="arb-plans" className="arb-plans">
          {ARBITRAGE_PLANS.map((plan) => (
            <div key={plan.id} className="arb-plan-card glass-panel">
              <div className="arb-plan-card-head">
                <div className="arb-plan-icon">
                  <Cpu size={24} />
                </div>
                <div className="arb-plan-card-title">
                  <span className="arb-badge">{plan.listBadge}</span>
                  <h3>{plan.name}</h3>
                </div>
              </div>
              <p className="arb-plan-card-copy">Invest between ${plan.minAmount.toLocaleString()} and ${plan.maxAmount.toLocaleString()} with {plan.profitLabel} daily returns.</p>
              <div className="arb-plan-grid">
                <div>
                  <span className="arb-plan-label">Min investment</span>
                  <strong>${plan.minAmount.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="arb-plan-label">Max investment</span>
                  <strong>${plan.maxAmount.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="arb-plan-label">Profit rate</span>
                  <strong>{plan.profitLabel}</strong>
                </div>
                <div>
                  <span className="arb-plan-label">Max participants</span>
                  <strong>{plan.participationLimit}</strong>
                </div>
              </div>
              <div className="arb-plan-footer">
                <div className="arb-plan-coins">
                  {plan.currencies.slice(0, 5).map((c) => (
                    <img key={c} src={COIN_ICONS[c] || COIN_ICONS.btc} alt={c} className="arb-coin" />
                  ))}
                  {plan.currencies.length > 5 && <span className="arb-more-coins">+{plan.currencies.length - 5}</span>}
                </div>
                <button type="button" className="arb-plan-invest" onClick={() => investPlan(plan)} disabled={submitBusy || hasActiveEscrowOrder}>
                  Invest ${plan.minAmount.toLocaleString()}
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <ArbRuleModal open={ruleOpen} onClose={() => setRuleOpen(false)} />
      <ArbCompletionModal open={completedAmount > 0} amount={completedAmount} onContinue={() => setCompletedAmount(0)} />
    </div>
  );
}
