import type { Unit } from '@/core/units';

export type Item = {
  id: string;
  name: string;
  categoryId: string | null;
  unit: Unit;
  sku: string | null;
  photoUri: string | null;
  sellingPricePaise: number;
  targetMarginBp: number | null;
  lowStockQty: number | null;
  openingQty: number;
  openingCostPaise: number;
  // Derived — always written by recompute, never edited.
  stockQty: number;
  avgCostPaise: number;
  lastPurchaseCostPaise: number | null;
  lastSaleDate: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Category = { id: string; name: string; createdAt: string; updatedAt: string; deletedAt: string | null };

export type AdjustReason = 'damage' | 'loss' | 'count' | 'return' | 'other';

export type Adjustment = {
  id: string;
  itemId: string;
  date: string;
  qtyChange: number;
  reason: AdjustReason;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

// Purchase and sale lines are owned by modules 04/05; module 02 only reads them for activity and stock.
export type PurchaseLine = {
  id: string; itemId: string; date: string; createdAt: string; qty: number;
  ratePaise: number; landedUnitCostPaise: number; partyName: string | null; deletedAt: string | null;
};
export type SaleLine = {
  id: string; itemId: string; date: string; createdAt: string; qty: number; pricePaise: number;
  partyName: string | null; channel: 'shop' | 'wholesale' | 'online' | 'social';
  unitCostPaise: number; cogsPaise: number; deletedAt: string | null;
};
export type PricePoint = { id: string; itemId: string; date: string; unitPricePaise: number; createdAt: string };

export type ItemInput = {
  name: string;
  categoryId: string | null;
  unit: Unit;
  sku: string | null;
  photoUri: string | null;
  sellingPricePaise: number;
  lowStockQty: number | null;
  openingQty: number;
  openingCostPaise: number;
};
