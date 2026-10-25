import { roundHalfUp } from './money';
import { roundQty } from './units';

export type StockStatus = 'in' | 'low' | 'out';

/** IT-5: Out ≤ 0, Low when 0 < stock ≤ threshold, otherwise In. */
export function stockStatus(stockQty: number, lowStockQty: number | null | undefined): StockStatus {
  if (stockQty <= 0) return 'out';
  if (lowStockQty != null && stockQty <= lowStockQty) return 'low';
  return 'in';
}

/** IT-7: fire once when the item moves from above the threshold to at or below it. */
export function crossedLowThreshold(prevQty: number, nextQty: number, lowStockQty: number | null | undefined): boolean {
  if (lowStockQty == null) return false;
  return prevQty > lowStockQty && nextQty <= lowStockQty;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.floor((b - a) / 86_400_000);
}

/** IT-8: stock > 0 and no sale for `days` since the last sale (or since creation). */
export function isSlowMoving(
  item: { stockQty: number; lastSaleDate: string | null; createdAt: string },
  today: string,
  days: number,
): boolean {
  if (item.stockQty <= 0) return false;
  const since = item.lastSaleDate ?? item.createdAt.slice(0, 10);
  return daysBetween(since, today) >= days;
}

/** IT-9: Σ max(stock, 0) × unit value. */
export function stockValue(
  items: readonly { stockQty: number; avgCostPaise: number; sellingPricePaise: number }[],
  basis: 'cost' | 'price',
): number {
  return items.reduce((sum, it) => {
    const unit = basis === 'cost' ? it.avgCostPaise : it.sellingPricePaise;
    return sum + roundHalfUp(Math.max(it.stockQty, 0) * unit);
  }, 0);
}

/** IT-6: physical count stores qty_change = counted − current. */
export function countDelta(counted: number, current: number): number {
  return roundQty(counted - current);
}

/** IT-12 / edge case: null when there is no cost yet, so the UI never shows a fake 100% margin. */
export function profitPerUnit(sellingPricePaise: number, avgCostPaise: number): number | null {
  if (avgCostPaise <= 0) return null;
  return sellingPricePaise - avgCostPaise;
}

/** Markup on cost in basis points; null when cost is unknown. */
export function markupBp(sellingPricePaise: number, costPaise: number): number | null {
  if (costPaise <= 0) return null;
  return roundHalfUp(((sellingPricePaise - costPaise) * 10000) / costPaise);
}
