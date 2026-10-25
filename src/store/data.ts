import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import { recomputeItem, type LedgerEvent } from '@/core/recomputeItem';
import { crossedLowThreshold } from '@/core/stock';
import { formatQtyNumber, roundQty } from '@/core/units';
import { nowIso, todayISO } from '@/lib/date';
import { uuid } from '@/lib/id';
import { sqliteStorage } from './storage';
import { toast } from './toast';
import { useApp } from './app';
import type { Adjustment, AdjustReason, Category, Item, ItemInput, PricePoint, PurchaseLine, SaleLine } from './types';

type Data = {
  items: Record<string, Item>;
  categories: Record<string, Category>;
  adjustments: Record<string, Adjustment>;
  purchaseLines: Record<string, PurchaseLine>;
  saleLines: Record<string, SaleLine>;
  pricePoints: Record<string, PricePoint>;
};

export type CreateItemResult = { ok: true; id: string } | { ok: false; error: 'duplicate'; existingId: string };

type DataState = Data & {
  createItem: (input: ItemInput) => CreateItemResult;
  updateItem: (id: string, input: ItemInput) => CreateItemResult;
  setSellingPrice: (id: string, paise: number) => void;
  archiveItem: (id: string) => boolean;
  restoreItem: (id: string) => void;
  addAdjustment: (a: { itemId: string; date: string; qtyChange: number; reason: AdjustReason; note: string | null }) => void;
  deleteAdjustment: (id: string) => void;
  createCategory: (name: string) => { ok: true; id: string } | { ok: false; error: 'duplicate' | 'empty' };
  renameCategory: (id: string, name: string) => { ok: true } | { ok: false; error: 'duplicate' | 'empty' };
  deleteCategory: (id: string) => boolean;
  moveCategoryItems: (fromId: string | null, toId: string | null) => void;
  addStarterItems: (items: { name: string; unit: Item['unit']; category: string }[]) => number;
  replaceAll: (d: Data) => void;
};

const empty: Data = { items: {}, categories: {}, adjustments: {}, purchaseLines: {}, saleLines: {}, pricePoints: {} };

const live = <T extends { deletedAt: string | null }>(r: Record<string, T>) => Object.values(r).filter((x) => !x.deletedAt);

/** Case-insensitive, trimmed, ignores archived items (IT-1). */
export function findDuplicateItem(items: Record<string, Item>, name: string, exceptId?: string): Item | undefined {
  const n = name.trim().toLocaleLowerCase();
  return live(items).find((i) => !i.archived && i.id !== exceptId && i.name.trim().toLocaleLowerCase() === n);
}

function findDuplicateCategory(cats: Record<string, Category>, name: string, exceptId?: string) {
  const n = name.trim().toLocaleLowerCase();
  return live(cats).find((c) => c.id !== exceptId && c.name.trim().toLocaleLowerCase() === n);
}

function ledgerFor(d: Data, itemId: string): LedgerEvent[] {
  const ev: LedgerEvent[] = [];
  for (const p of live(d.purchaseLines)) if (p.itemId === itemId)
    ev.push({ kind: 'purchase', id: p.id, date: p.date, createdAt: p.createdAt, qty: p.qty, landedUnitCostPaise: p.landedUnitCostPaise });
  for (const s of live(d.saleLines)) if (s.itemId === itemId)
    ev.push({ kind: 'sale', id: s.id, date: s.date, createdAt: s.createdAt, qty: s.qty });
  for (const a of live(d.adjustments)) if (a.itemId === itemId)
    ev.push({ kind: 'adjustment', id: a.id, date: a.date, createdAt: a.createdAt, qtyChange: a.qtyChange });
  return ev;
}

/**
 * Replays one item's ledger and returns the patched collections. Every write goes through this
 * in the same `set` call as the change itself — the store's equivalent of one DB transaction.
 */
export function withRecompute(d: Data, itemId: string): Pick<Data, 'items' | 'saleLines'> {
  const item = d.items[itemId];
  if (!item) return { items: d.items, saleLines: d.saleLines };
  const r = recomputeItem({ openingQty: item.openingQty, openingCostPaise: item.openingCostPaise }, ledgerFor(d, itemId));
  const saleLines = { ...d.saleLines };
  for (const [id, c] of Object.entries(r.saleCosts)) saleLines[id] = { ...saleLines[id], ...c };
  return {
    items: {
      ...d.items,
      [itemId]: {
        ...item,
        stockQty: r.stockQty,
        avgCostPaise: r.avgCostPaise,
        lastPurchaseCostPaise: r.lastPurchaseCostPaise,
        lastSaleDate: r.lastSaleDate,
      },
    },
    saleLines,
  };
}

/** IT-7: one-shot alert when stock moves from above the threshold to at/below it. */
function maybeAlertLow(before: Item | undefined, after: Item) {
  if (!before || after.archived) return;
  if (!crossedLowThreshold(before.stockQty, after.stockQty, after.lowStockQty)) return;
  toast({
    kind: 'warning',
    message: i18n.t('items.lowAlert', {
      name: after.name,
      qty: formatQtyNumber(after.stockQty),
      unit: i18n.t(`unit.${after.unit}`, { count: after.stockQty }),
    }),
  });
  // TODO(module 10 settings): also schedule a local notification via expo-notifications.
}

const changed = () => useApp.getState().bumpChanges();

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...empty,

      createItem: (input) => {
        const dup = findDuplicateItem(get().items, input.name);
        if (dup) return { ok: false, error: 'duplicate', existingId: dup.id };
        const t = nowIso();
        const id = uuid();
        const item: Item = {
          id, ...input, name: input.name.trim(), openingQty: roundQty(input.openingQty),
          targetMarginBp: null, stockQty: 0, avgCostPaise: 0, lastPurchaseCostPaise: null, lastSaleDate: null,
          archived: false, createdAt: t, updatedAt: t, deletedAt: null,
        };
        const d = get();
        const items = { ...d.items, [id]: item };
        const pid = uuid();
        const pricePoints = input.sellingPricePaise > 0
          ? { ...d.pricePoints, [pid]: { id: pid, itemId: id, date: todayISO(), unitPricePaise: input.sellingPricePaise, createdAt: t } }
          : d.pricePoints;
        set({ ...withRecompute({ ...d, items }, id), pricePoints });
        useApp.getState().setQuickstart({ item: true });
        changed();
        return { ok: true, id };
      },

      updateItem: (id, input) => {
        const d = get();
        const before = d.items[id];
        const dup = findDuplicateItem(d.items, input.name, id);
        if (dup) return { ok: false, error: 'duplicate', existingId: dup.id };
        const t = nowIso();
        const items = { ...d.items, [id]: { ...before, ...input, name: input.name.trim(), updatedAt: t } };
        let pricePoints = d.pricePoints;
        if (input.sellingPricePaise !== before.sellingPricePaise) {
          const pid = uuid();
          pricePoints = { ...pricePoints, [pid]: { id: pid, itemId: id, date: todayISO(), unitPricePaise: input.sellingPricePaise, createdAt: t } };
        }
        const next = withRecompute({ ...d, items }, id);
        set({ ...next, pricePoints });
        maybeAlertLow(before, next.items[id]);
        changed();
        return { ok: true, id };
      },

      setSellingPrice: (id, paise) => {
        const it = get().items[id];
        if (!it) return;
        get().updateItem(id, { ...it, sellingPricePaise: paise });
      },

      // IT-10: only zero-stock items can be archived.
      archiveItem: (id) => {
        const it = get().items[id];
        if (!it || it.stockQty !== 0) return false;
        set({ items: { ...get().items, [id]: { ...it, archived: true, updatedAt: nowIso() } } });
        changed();
        return true;
      },

      restoreItem: (id) => {
        const it = get().items[id];
        if (!it) return;
        // Restoring must not create a duplicate active name.
        const dup = findDuplicateItem(get().items, it.name, id);
        const name = dup ? `${it.name} (2)` : it.name;
        set({ items: { ...get().items, [id]: { ...it, name, archived: false, updatedAt: nowIso() } } });
        changed();
      },

      addAdjustment: ({ itemId, date, qtyChange, reason, note }) => {
        if (qtyChange === 0) return;
        const d = get();
        const before = d.items[itemId];
        const t = nowIso();
        const id = uuid();
        const adjustments = { ...d.adjustments, [id]: { id, itemId, date, qtyChange: roundQty(qtyChange), reason, note, createdAt: t, updatedAt: t, deletedAt: null } };
        const next = withRecompute({ ...d, adjustments }, itemId);
        set({ adjustments, ...next });
        maybeAlertLow(before, next.items[itemId]);
        changed();
      },

      deleteAdjustment: (id) => {
        const d = get();
        const a = d.adjustments[id];
        if (!a) return;
        const before = d.items[a.itemId];
        const adjustments = { ...d.adjustments, [id]: { ...a, deletedAt: nowIso() } };
        const next = withRecompute({ ...d, adjustments }, a.itemId);
        set({ adjustments, ...next });
        maybeAlertLow(before, next.items[a.itemId]);
        changed();
      },

      createCategory: (name) => {
        if (!name.trim()) return { ok: false, error: 'empty' };
        if (findDuplicateCategory(get().categories, name)) return { ok: false, error: 'duplicate' };
        const t = nowIso();
        const id = uuid();
        set({ categories: { ...get().categories, [id]: { id, name: name.trim(), createdAt: t, updatedAt: t, deletedAt: null } } });
        changed();
        return { ok: true, id };
      },

      renameCategory: (id, name) => {
        if (!name.trim()) return { ok: false, error: 'empty' };
        if (findDuplicateCategory(get().categories, name, id)) return { ok: false, error: 'duplicate' };
        const c = get().categories[id];
        set({ categories: { ...get().categories, [id]: { ...c, name: name.trim(), updatedAt: nowIso() } } });
        changed();
        return { ok: true };
      },

      deleteCategory: (id) => {
        const inUse = live(get().items).some((i) => i.categoryId === id);
        if (inUse) return false;
        const c = get().categories[id];
        set({ categories: { ...get().categories, [id]: { ...c, deletedAt: nowIso() } } });
        changed();
        return true;
      },

      moveCategoryItems: (fromId, toId) => {
        const t = nowIso();
        const items = { ...get().items };
        for (const it of Object.values(items)) if (it.categoryId === fromId && !it.deletedAt) items[it.id] = { ...it, categoryId: toId, updatedAt: t };
        set({ items });
        changed();
      },

      addStarterItems: (list) => {
        let added = 0;
        for (const s of list) {
          const cat = findDuplicateCategory(get().categories, s.category);
          const catId = cat?.id ?? (get().createCategory(s.category) as { ok: true; id: string }).id;
          const r = get().createItem({
            name: s.name, unit: s.unit, categoryId: catId, sku: null, photoUri: null,
            sellingPricePaise: 0, lowStockQty: null, openingQty: 0, openingCostPaise: 0,
          });
          if (r.ok) added++;
        }
        return added;
      },

      replaceAll: (data) => {
        let next: Data = data;
        for (const id of Object.keys(data.items)) next = { ...next, ...withRecompute(next, id) };
        set(next);
      },
    }),
    { name: 'galla-data', storage: sqliteStorage },
  ),
);

export function liveItems(items: Record<string, Item>): Item[] {
  return live(items);
}
export function liveCategories(c: Record<string, Category>): Category[] {
  return live(c).sort((a, b) => a.name.localeCompare(b.name));
}
