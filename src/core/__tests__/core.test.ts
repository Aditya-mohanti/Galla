import { formatINR, groupIndian, parseRupees, paiseToInput } from '../money';
import { parseQty, formatQtyNumber } from '../units';
import { recomputeItem, type LedgerEvent } from '../recomputeItem';
import { stockStatus, crossedLowThreshold, isSlowMoving, stockValue, countDelta, profitPerUnit } from '../stock';
import { roundNice } from '../roundNice';
import { suggestPrice } from '../pricing';
import { normalizePhone, phoneError, formatPhone } from '../phone';
import { matchesSearch, soundKey } from '../search';

describe('money', () => {
  it('groups the Indian way', () => {
    expect(groupIndian(184320)).toBe('1,84,320');
    expect(groupIndian(12345678)).toBe('1,23,45,678');
    expect(groupIndian(999)).toBe('999');
  });
  it('formats rupees', () => {
    expect(formatINR(18432000)).toBe('₹1,84,320');
    expect(formatINR(12850)).toBe('₹128.50');
    expect(formatINR(-220)).toBe('−₹2.20');
    expect(formatINR(4400, { decimals: 'always' })).toBe('₹44.00');
    expect(formatINR(500, { signed: true })).toBe('+₹5');
  });
  it('parses typed amounts', () => {
    expect(parseRupees('128.5')).toBe(12850);
    expect(parseRupees('₹ 1,049')).toBe(104900);
    expect(parseRupees('1.234')).toBeNull();
    expect(parseRupees('')).toBeNull();
    expect(parseRupees('abc')).toBeNull();
    expect(paiseToInput(12850)).toBe('128.50');
  });
});

describe('units', () => {
  it('blocks decimals for whole-number units', () => {
    expect(parseQty('2.5', 'piece')).toBeNull();
    expect(parseQty('2.5', 'kg')).toBe(2.5);
    expect(parseQty('1.2345', 'kg')).toBeNull();
    expect(formatQtyNumber(-3)).toBe('−3');
  });
});

describe('recomputeItem', () => {
  const t = (i: number) => `2026-10-01T00:00:0${i}Z`;
  it('replays weighted average cost', () => {
    const ev: LedgerEvent[] = [
      { kind: 'purchase', id: 'p1', date: '2026-10-02', createdAt: t(1), qty: 10, landedUnitCostPaise: 40000 },
      { kind: 'sale', id: 's1', date: '2026-10-03', createdAt: t(2), qty: 4 },
      { kind: 'purchase', id: 'p2', date: '2026-10-04', createdAt: t(3), qty: 6, landedUnitCostPaise: 42000 },
    ];
    const r = recomputeItem({ openingQty: 0, openingCostPaise: 0 }, ev);
    expect(r.saleCosts.s1).toEqual({ unitCostPaise: 40000, cogsPaise: 160000 });
    expect(r.stockQty).toBe(12);
    expect(r.avgCostPaise).toBe(41000);
    expect(r.lastPurchaseCostPaise).toBe(42000);
    expect(r.lastSaleDate).toBe('2026-10-03');
  });
  it('orders by date even if entered out of order', () => {
    const ev: LedgerEvent[] = [
      { kind: 'sale', id: 's1', date: '2026-10-05', createdAt: t(1), qty: 1 },
      { kind: 'purchase', id: 'p1', date: '2026-10-01', createdAt: t(2), qty: 5, landedUnitCostPaise: 1000 },
    ];
    expect(recomputeItem({ openingQty: 0, openingCostPaise: 0 }, ev).saleCosts.s1.unitCostPaise).toBe(1000);
  });
  it('resets average after negative stock', () => {
    const ev: LedgerEvent[] = [
      { kind: 'sale', id: 's1', date: '2026-10-01', createdAt: t(1), qty: 3 },
      { kind: 'purchase', id: 'p1', date: '2026-10-02', createdAt: t(2), qty: 10, landedUnitCostPaise: 15000 },
    ];
    const r = recomputeItem({ openingQty: 0, openingCostPaise: 14000 }, ev);
    expect(r.stockQty).toBe(7);
    expect(r.avgCostPaise).toBe(15000);
  });
  it('adjustments change qty only', () => {
    const r = recomputeItem({ openingQty: 7, openingCostPaise: 39860 }, [
      { kind: 'adjustment', id: 'a1', date: '2026-10-01', createdAt: t(1), qtyChange: -2 },
    ]);
    expect(r).toMatchObject({ stockQty: 5, avgCostPaise: 39860 });
  });
  it('ignores zero-quantity purchase lines', () => {
    const r = recomputeItem({ openingQty: 2, openingCostPaise: 100 }, [
      { kind: 'purchase', id: 'p', date: '2026-10-01', createdAt: t(1), qty: 0, landedUnitCostPaise: 999 },
    ]);
    expect(r.avgCostPaise).toBe(100);
  });
});

describe('stock rules', () => {
  it('chip status', () => {
    expect(stockStatus(0, 5)).toBe('out');
    expect(stockStatus(-3, 5)).toBe('out');
    expect(stockStatus(5, 5)).toBe('low');
    expect(stockStatus(6, 5)).toBe('in');
    expect(stockStatus(1, null)).toBe('in');
  });
  it('low-stock alert fires only on crossing', () => {
    expect(crossedLowThreshold(6, 5, 5)).toBe(true);
    expect(crossedLowThreshold(5, 4, 5)).toBe(false);
    expect(crossedLowThreshold(4, 8, 5)).toBe(false);
  });
  it('slow moving', () => {
    const base = { stockQty: 4, lastSaleDate: '2026-09-20', createdAt: '2026-01-01T00:00:00Z' };
    expect(isSlowMoving(base, '2026-10-20', 30)).toBe(true);
    expect(isSlowMoving(base, '2026-10-19', 30)).toBe(false);
    expect(isSlowMoving({ ...base, stockQty: 0 }, '2026-12-01', 30)).toBe(false);
    expect(isSlowMoving({ ...base, lastSaleDate: null }, '2026-01-31', 30)).toBe(true);
  });
  it('stock value ignores negative stock', () => {
    const items = [
      { stockQty: 7, avgCostPaise: 39860, sellingPricePaise: 43700 },
      { stockQty: -3, avgCostPaise: 14000, sellingPricePaise: 15000 },
    ];
    expect(stockValue(items, 'cost')).toBe(279020);
    expect(stockValue(items, 'price')).toBe(305900);
  });
  it('count delta and profit', () => {
    expect(countDelta(5, 7)).toBe(-2);
    expect(countDelta(2.4, 2.75)).toBe(-0.35);
    expect(profitPerUnit(4400, 4620)).toBe(-220);
    expect(profitPerUnit(4400, 0)).toBeNull();
  });
});

describe('roundNice', () => {
  it('handles band boundaries', () => {
    expect(roundNice(999)).toBe(1000);
    expect(roundNice(921)).toBe(950);
    expect(roundNice(9999)).toBe(10000);
    expect(roundNice(14101)).toBe(14900);
    expect(roundNice(14900)).toBe(14900);
    expect(roundNice(99999)).toBe(100900);
    expect(roundNice(102000)).toBe(104900);
    expect(roundNice(105000)).toBe(109900);
    expect(roundNice(12345, '5')).toBe(12500);
  });
});

describe('suggestPrice', () => {
  it('markup mode', () => {
    const r = suggestPrice({ costPaise: 4620, marginBp: 2000, mode: 'markup', rounding: 'nice' });
    expect(r).toMatchObject({ ok: true, suggestedPaise: 5600 });
  });
  it('rejects f% + m ≥ 1 on price', () => {
    expect(suggestPrice({ costPaise: 100, feePctBp: 5000, marginBp: 5000, mode: 'on_price', rounding: 'nice' }))
      .toEqual({ ok: false, reason: 'margin_too_high' });
  });
  it('needs a cost', () => {
    expect(suggestPrice({ costPaise: 0, marginBp: 2000, mode: 'markup', rounding: 'nice' }).ok).toBe(false);
  });
});

describe('phone', () => {
  it('normalises pasted numbers', () => {
    expect(normalizePhone('+91 98110-45672')).toBe('9811045672');
    expect(normalizePhone('09811045672')).toBe('9811045672');
  });
  it('validates', () => {
    expect(phoneError('9811045672')).toBeNull();
    expect(phoneError('5811045672')).toBe('start');
    expect(phoneError('98110')).toBe('short');
    expect(phoneError('')).toBe('empty');
    expect(formatPhone('9811045672')).toBe('98110 45672');
  });
});

describe('bilingual search', () => {
  it('finds Devanagari names from Latin typing', () => {
    expect(soundKey('चीनी')).toBe(soundKey('chini'));
    expect(matchesSearch({ name: 'चीनी (खुली)' }, 'chini')).toBe('sound');
    expect(matchesSearch({ name: 'तूर दाल' }, 'toor daal')).toBe('sound');
    expect(matchesSearch({ name: 'हल्दीराम नमकीन' }, 'namkeen')).toBe('sound');
  });
  it('matches SKU and category', () => {
    expect(matchesSearch({ name: 'Maggi 70 g', sku: 'MG70' }, 'mg70')).toBe('exact');
    expect(matchesSearch({ name: 'Maggi', category: 'Snacks' }, 'snack')).toBe('exact');
    expect(matchesSearch({ name: 'Parle-G' }, 'surf')).toBeNull();
  });
});
