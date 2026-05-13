# TODO - PrimeBlock “Never Lose” + Global Notifications

- [ ] Implement Firestore Atomic Purchase + escrow_orders creation in `src/ArbitragePage.js`
- [ ] Implement `escrow_orders` query so it matches composite index (userId asc, planId asc, createdAt desc)
- [ ] Save `plan.currencies` into `escrow_orders` for Trading Result display
- [ ] Implement “Never Lose” settlement logic derived from `arbitragePlans.js` profit range
- [ ] Create `src/ArbNotificationProvider.js` (global listener + notification UI)
- [ ] Integrate provider into `src/App.js`
- [ ] Ensure `Total Active Arbitrage` UI updates immediately after purchase
- [ ] Basic manual validation checklist (purchase, active UI, completion notification, settlement correctness)

