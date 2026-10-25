import { addDays, todayISO } from '@/lib/date';
import { uuid } from '@/lib/id';
import type { Category, Item, PurchaseLine, SaleLine } from '@/store/types';
import type { Unit } from '@/core/units';

// A realistic kirana backup used by the restore flow (ON-5) in the stub backup service.

type Spec = {
  name: string; cat: string | null; unit: Unit; price: number; low?: number;
  open?: [number, number]; buys?: [number, number, number, string][]; sells?: [number, number, number, string][];
  created?: number;
};

const S: Spec[] = [
  { name: 'Aashirvaad Atta 10 kg', cat: 'Atta & Grains', unit: 'bag', price: 43700, low: 5, open: [3, 39200],
    buys: [[-60, 5, 39200, 'Gupta Traders'], [-33, 4, 39800, 'Gupta Traders'], [-3, 10, 40573, 'Gupta Traders']],
    sells: [[-50, 4, 43000, 'Sharma ji'], [-25, 6, 43000, 'Walk-in'], [-7, 3, 43000, 'Sharma ji'], [-2, 1, 43700, 'Walk-in'], [-1, 2, 43700, 'Ramesh ji']] },
  { name: 'Toor Dal (loose)', cat: 'Dal & Pulses', unit: 'kg', price: 16800, low: 10, open: [25, 13850],
    sells: [[-6, 4.5, 16800, 'Walk-in'], [-2, 2.25, 16800, 'Walk-in']] },
  { name: 'चीनी (खुली)', cat: 'Atta & Grains', unit: 'kg', price: 4800, low: 15, open: [50, 4160],
    sells: [[-3, 12, 4800, 'Walk-in']] },
  { name: 'Amul Butter 100 g', cat: 'Dairy', unit: 'piece', price: 4400, low: 6,
    buys: [[-4, 12, 4620, 'Jain Wholesale']], sells: [[-3, 7, 4400, 'Walk-in'], [-1, 1, 4400, 'Walk-in']] },
  { name: 'Amul Taaza Milk 1 L', cat: 'Dairy', unit: 'piece', price: 6800, low: 10, open: [24, 6400], sells: [[-1, 10, 6800, 'Walk-in']] },
  { name: 'Colgate Strong Teeth 100 g', cat: 'Personal Care', unit: 'piece', price: 5800, low: 6, open: [36, 4750], sells: [[-5, 2, 5800, 'Walk-in']] },
  { name: 'Dove Soap 100 g', cat: 'Personal Care', unit: 'piece', price: 6500, low: 4, open: [18, 5480], sells: [[-9, 3, 6500, 'Walk-in']] },
  { name: 'Fortune Sunflower Oil 1 L', cat: 'Oil & Ghee', unit: 'piece', price: 15000, low: 6, open: [0, 13950],
    sells: [[-2, 2, 15000, 'Walk-in'], [-1, 1, 15000, 'Ramesh ji']] },
  { name: 'Amul Ghee 1 L', cat: 'Oil & Ghee', unit: 'piece', price: 64000, low: 2, open: [6, 58500], sells: [[-12, 1, 64000, 'Walk-in']] },
  { name: 'Haldiram’s Aloo Bhujia Namkeen Family Pack 400 g', cat: 'Snacks', unit: 'packet', price: 10500, low: 5, open: [22, 8640], sells: [[-4, 3, 10500, 'Walk-in']] },
  { name: 'Maggi 70 g', cat: 'Snacks', unit: 'piece', price: 1400, low: 24, open: [96, 1180], sells: [[-1, 12, 1400, 'Walk-in']] },
  { name: 'Parle-G 250 g', cat: 'Biscuits', unit: 'packet', price: 1000, low: 12, open: [41, 830], sells: [[-1, 6, 1000, 'Walk-in']] },
  { name: 'Good Day Cashew 100 g', cat: 'Biscuits', unit: 'packet', price: 3000, low: 6, open: [10, 2520], sells: [[-6, 10, 3000, 'Walk-in']] },
  { name: 'Surf Excel 500 g', cat: 'Detergent', unit: 'packet', price: 6800, low: 5, open: [14, 5640], sells: [[-8, 2, 6800, 'Walk-in']] },
  { name: 'Vim Bar 200 g', cat: 'Detergent', unit: 'piece', price: 2000, low: 4, open: [20, 1650], created: -80, sells: [[-45, 2, 2000, 'Walk-in']] },
  { name: 'Tata Salt 1 kg', cat: 'Spices', unit: 'packet', price: 2800, low: 10, open: [30, 2300], sells: [[-2, 4, 2800, 'Walk-in']] },
  { name: 'MDH Garam Masala 100 g', cat: 'Spices', unit: 'packet', price: 8900, low: 3, open: [9, 7400], sells: [[-14, 1, 8900, 'Walk-in']] },
  { name: 'Everest Haldi 200 g', cat: 'Spices', unit: 'packet', price: 6200, low: 3, open: [3, 5150] },
  { name: 'Kissan Mixed Fruit Jam 500 g', cat: 'Jam & Spreads', unit: 'piece', price: 16500, low: 3, open: [12, 12850], sells: [[-10, 2, 16500, 'Walk-in']] },
  { name: 'Cycle Agarbatti 3-in-1', cat: null, unit: 'packet', price: 5000, open: [15, 0] },
];

export const DEMO_EXTRA_CATEGORIES = ['Frozen'];

export function buildDemoData(today = todayISO()) {
  const created = (days = -90) => `${addDays(today, days)}T09:00:00.000Z`;
  const categories: Record<string, Category> = {};
  const catId = (name: string | null) => {
    if (!name) return null;
    const found = Object.values(categories).find((c) => c.name === name);
    if (found) return found.id;
    const id = uuid();
    categories[id] = { id, name, createdAt: created(), updatedAt: created(), deletedAt: null };
    return id;
  };
  DEMO_EXTRA_CATEGORIES.forEach(catId);

  const items: Record<string, Item> = {};
  const purchaseLines: Record<string, PurchaseLine> = {};
  const saleLines: Record<string, SaleLine> = {};
  let n = 0;
  for (const s of S) {
    const id = uuid();
    items[id] = {
      id, name: s.name, categoryId: catId(s.cat), unit: s.unit, sku: null, photoUri: null,
      sellingPricePaise: s.price, targetMarginBp: null, lowStockQty: s.low ?? null,
      openingQty: s.open?.[0] ?? 0, openingCostPaise: s.open?.[1] ?? 0,
      stockQty: 0, avgCostPaise: 0, lastPurchaseCostPaise: null, lastSaleDate: null,
      archived: false, createdAt: created(s.created), updatedAt: created(s.created), deletedAt: null,
    };
    for (const [d, qty, rate, party] of s.buys ?? []) {
      const lid = uuid();
      purchaseLines[lid] = { id: lid, itemId: id, date: addDays(today, d), createdAt: created(d) + n++, qty, ratePaise: rate, landedUnitCostPaise: rate, partyName: party, deletedAt: null };
    }
    for (const [d, qty, price, party] of s.sells ?? []) {
      const lid = uuid();
      saleLines[lid] = { id: lid, itemId: id, date: addDays(today, d), createdAt: created(d) + n++, qty, pricePaise: price, partyName: party, channel: 'shop', unitCostPaise: 0, cogsPaise: 0, deletedAt: null };
    }
  }
  return { items, categories, purchaseLines, saleLines, adjustments: {}, pricePoints: {} };
}
