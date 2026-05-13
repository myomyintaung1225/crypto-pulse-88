import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';

import { db } from './firebase';

const USERS_COL = 'users';
const ESCROW_ORDERS_COL = 'escrow_orders';

/**
 * Atomic purchase transaction.
 * - subtract balance from users/{userId}.balance
 * - create escrow_orders doc
 * @returns {{ escrowOrderId: string }}
 */
export async function atomicCreateEscrowOrder({ userId, plan, amount }) {
  if (!userId) throw new Error('Missing userId');
  if (!plan) throw new Error('Missing plan');

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error('Invalid amount');

  const escrowOrderRef = doc(collection(db, ESCROW_ORDERS_COL));

  await runTransaction(db, async (tx) => {
    const userRef = doc(db, USERS_COL, userId);
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error('User not found');

    const currentBalance = Number(userSnap.data().balance) || 0;
    if (currentBalance < amt) throw new Error('Insufficient balance');

    // user balance update
    tx.update(userRef, { balance: currentBalance - amt });

    // escrow order creation
    tx.set(escrowOrderRef, {
      userId,
      planId: plan.id,
      planName: plan.name,
      amount: amt,
      durationDays: Number.parseInt(plan.listBadge, 10) || 0,
      profitLabel: plan.profitLabel,
      participationLimit: plan.participationLimit,
      status: 'active',
      type: 'escrow_order',
      currencies: Array.isArray(plan.currencies) ? plan.currencies : [],
      initialAmount: amt,
      startTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      completedAt: null,
      totalProfit: 0,
      totalReturn: 0
    });
  });

  return { escrowOrderId: escrowOrderRef.id };
}

/**
 * Subscribe to active escrow orders for a given user.
 * Must match composite index order: userId(Asc), planId(Asc), createdAt(Desc)
 * => We include planId equality as well (either provided or via an all-plan query per planId).
 */
export function subscribeActiveEscrowOrders({ userId, planId, onData }) {
  if (!userId) return () => {};

  // If planId is unknown, we must query per planId to satisfy the index.
  if (!planId) {
    // Caller can create multiple subscriptions; here we just no-op.
    return () => {};
  }

  const q = query(
    collection(db, ESCROW_ORDERS_COL),
    where('userId', '==', userId),
    where('planId', '==', planId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    onData(rows);
  });
}

/**
 * One-shot fetch to support UI reads.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} [params.planId]
 */
export async function fetchActiveEscrowOrders({ userId, planId }) {
  if (!userId) return [];

  if (planId) {
    const q = query(
      collection(db, ESCROW_ORDERS_COL),
      where('userId', '==', userId),
      where('planId', '==', planId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // Without planId, we can't guarantee matching the provided composite index order.
  // For this project, the UI only allows one active order at a time, so callers should pass the planId.
  return [];
}

