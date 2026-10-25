import type { TFunction } from 'i18next';
import { isSlowMoving, stockStatus } from '@/core/stock';
import { matchesSearch } from '@/core/search';
import { formatQtyNumber, type Unit } from '@/core/units';
import type { Category, Item } from '@/store/types';

export function unitLabel(t: TFunction, unit: Unit, qty: number): string {
  return t(`unit.${unit}`, { count: Math.abs(qty) === 1 ? 1 : 2 });
}

/** "7 bags", "2.5 kg", "−3 pcs" */
export function qtyText(t: TFunction, qty: number, unit: Unit): string {
  return `${formatQtyNumber(qty)} ${unitLabel(t, unit, qty)}`;
}

export type ItemFilter = 'all' | 'low' | 'out' | 'slow' | 'archived';
export type ItemSort = 'name' | 'stockAsc' | 'value' | 'lastSold';

export type ListQuery = {
  filter: ItemFilter; categoryId: string | null | 'none'; search: string; sort: ItemSort; today: string; slowDays: number;
};

export function filterItems(items: Item[], cats: Record<string, Category>, q: ListQuery) {
  let soundMatches = 0;
  const out = items.filter((i) => {
    if (q.filter === 'archived') { if (!i.archived) return false; } else if (i.archived) return false;
    if (q.filter === 'low' && stockStatus(i.stockQty, i.lowStockQty) !== 'low') return false;
    if (q.filter === 'out' && i.stockQty > 0) return false;
    if (q.filter === 'slow' && !isSlowMoving(i, q.today, q.slowDays)) return false;
    if (q.categoryId === 'none' && i.categoryId) return false;
    if (q.categoryId && q.categoryId !== 'none' && i.categoryId !== q.categoryId) return false;
    if (q.search) {
      const m = matchesSearch({ name: i.name, sku: i.sku, category: i.categoryId ? cats[i.categoryId]?.name : null }, q.search);
      if (!m) return false;
      if (m === 'sound') soundMatches++;
    }
    return true;
  });
  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  const sorters: Record<ItemSort, (a: Item, b: Item) => number> = {
    name: byName,
    stockAsc: (a, b) => a.stockQty - b.stockQty || byName(a, b),
    value: (a, b) => Math.max(b.stockQty, 0) * b.avgCostPaise - Math.max(a.stockQty, 0) * a.avgCostPaise || byName(a, b),
    lastSold: (a, b) => (b.lastSaleDate ?? '').localeCompare(a.lastSaleDate ?? '') || byName(a, b),
  };
  return { items: out.sort(sorters[q.sort]), soundMatches };
}

/** WhatsApp-ready reorder list for the supplier. */
export function reorderText(t: TFunction, shop: string, items: Item[]): string {
  const lines = items.map((i, n) => `${n + 1}. ${i.name} — ${t('items.reorderHave', { qty: qtyText(t, i.stockQty, i.unit) })}`);
  return [t('items.reorderHeader', { shop }), '', ...lines].join('\n');
}
