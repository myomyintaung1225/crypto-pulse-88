import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';

import { db } from './firebase';

const ArbNotificationContext = createContext({
  notifications: [],
  dismiss: () => {}
});

export function useArbNotifications() {
  return useContext(ArbNotificationContext);
}

function ArbNotificationBar({ item, onDismiss }) {
  if (!item) return null;

  return (
    <div
      className="arb-notif-bar"
      role="status"
      aria-live="polite"
    >
      <div className="arb-notif-title">Arbitrage completed</div>
      <div className="arb-notif-body">
        {item.planName ? `${item.planName} · ` : ''}
        +${Number(item.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT profit
      </div>
      <div className="arb-notif-actions">
        <button type="button" className="arb-notif-btn" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function ArbNotificationProvider({ userId, children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return undefined;

    // Listen for completed escrow orders for this user.
    // We rely on status changes to 'completed'.
    const q = query(
      collection(db, 'escrow_orders'),
      where('userId', '==', userId),
      where('status', '==', 'completed')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const completed = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d) => d.completedAt);

      // Deduplicate by doc id.
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((x) => x.id));
        const next = [...prev];
        for (const item of completed) {
          if (!existingIds.has(item.id)) next.push(item);
        }
        return next.slice(-3);
      });
    });

    return () => unsub();
  }, [userId]);

  const activeItem = notifications[notifications.length - 1] || null;

  const dismiss = () => {
    if (!activeItem) return;
    setNotifications((prev) => prev.filter((x) => x.id !== activeItem.id));
  };

  const value = useMemo(() => ({ notifications, dismiss }), [notifications]);

  return (
    <ArbNotificationContext.Provider value={value}>
      {children}
      {activeItem && <ArbNotificationBar item={activeItem} onDismiss={dismiss} />}

      {/* Lightweight styles - ensure it doesn't depend on missing CSS */}
      <style>{`
        .arb-notif-bar{
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 99999;
          background: rgba(10, 14, 22, 0.92);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 14px;
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap: 12px;
          backdrop-filter: blur(10px);
        }
        .arb-notif-title{font-weight: 800; margin-bottom: 4px;}
        .arb-notif-body{opacity:0.9; font-size: 0.95rem;}
        .arb-notif-actions{flex: 0 0 auto;}
        .arb-notif-btn{
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.18);
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
        }
        .arb-notif-btn:hover{border-color: rgba(255,255,255,0.35)}
      `}</style>
    </ArbNotificationContext.Provider>
  );
}

