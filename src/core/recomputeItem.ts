import { roundHalfUp } from './money';
import { roundQty } from './units';

// 00 §6.2 — stock and average cost are never edited; they are replayed from the ledger.

export type LedgerEvent =
  | { kind: 'purchase'; id: string; date: string; createdAt: string; qty: number; landedUnitCostPaise: number }
  | { kind: 'sale'; id: string; date: string; createdAt: string; qty: number }
  | { kind: 'adjustment'; id: string; date: string; createdAt: string; qtyChange: number };

export type ItemOpening = { openingQty: number; openingCostPaise: number };

export type RecomputeResult = {
  stockQty: number;
  avgCostPaise: number;
  lastPurchaseCostPaise: number | null;
  lastSaleDate: string | null;
  /** Snapshotted cost per sale line id. */
  saleCosts: Record<string, { unitCostPaise: number; cogsPaise: number }>;
};

function byLedgerOrder(a: LedgerEvent, b: LedgerEvent): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return 0;
}

export function recomputeItem(opening: ItemOpening, events: readonly LedgerEvent[]): RecomputeResult {
  let qty = roundQty(opening.openingQty);
  let avg = opening.openingCostPaise;
  let lastPurchaseCostPaise: number | null = null;
  let lastSaleDate: string | null = null;
  const saleCosts: RecomputeResult['saleCosts'] = {};

  for (const e of [...events].sort(byLedgerOrder)) {
    if (e.kind === 'purchase') {
      if (e.qty <= 0) continue;
      avg = qty <= 0
        ? e.landedUnitCostPaise
        : roundHalfUp((qty * avg + e.qty * e.landedUnitCostPaise) / (qty + e.qty));
      qty = roundQty(qty + e.qty);
      lastPurchaseCostPaise = e.landedUnitCostPaise;
    } else if (e.kind === 'sale') {
      saleCosts[e.id] = { unitCostPaise: avg, cogsPaise: roundHalfUp(e.qty * avg) };
      qty = roundQty(qty - e.qty);
      lastSaleDate = e.date;
    } else {
      qty = roundQty(qty + e.qtyChange);
    }
  }

  return { stockQty: qty, avgCostPaise: avg, lastPurchaseCostPaise, lastSaleDate, saleCosts };
}
