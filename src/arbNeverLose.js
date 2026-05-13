import { ARBITRAGE_PLANS_BY_ID, parseProfitRange } from './arbitragePlans';

/**
 * Guaranteed settlement: initial amount + (profit % from arbitragePlans.js)
 * using mid-point of the plan's profit range, multiplied by duration.
 *
 * @param {object} params
 * @param {number} params.amount - initial pledged amount
 * @param {string} params.planId
 * @param {number} params.durationDays - plan duration in days
 * @returns {{ totalReturn: number, totalProfit: number, profitPctPerDayMid: number }}
 */
export function calculateNeverLoseSettlement({ amount, planId, durationDays }) {
  const plan = ARBITRAGE_PLANS_BY_ID[planId];
  if (!plan) {
    throw new Error(`Unknown planId: ${planId}`);
  }

  const [minProfit, maxProfit] = parseProfitRange(plan.profitLabel);
  const profitPctPerDayMid = (minProfit + maxProfit) / 2;

  const amt = Number(amount) || 0;
  const days = Number(durationDays) || 0;

  const totalProfit = amt * (profitPctPerDayMid / 100) * days;
  const totalReturn = amt + totalProfit;

  return { totalReturn, totalProfit, profitPctPerDayMid };
}

