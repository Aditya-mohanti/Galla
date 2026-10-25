import type { Unit } from '@/core/units';
import type { BusinessType } from '@/store/app';

// Starter catalogue: tick the items you stock and get going in two minutes.
// Prices and stock are left empty on purpose — the first purchase fills in cost.

export type StarterItem = { name: string; unit: Unit; category: string };

const KIRANA: StarterItem[] = [
  { name: 'Aashirvaad Atta 5 kg', unit: 'bag', category: 'Atta & Grains' },
  { name: 'Aashirvaad Atta 10 kg', unit: 'bag', category: 'Atta & Grains' },
  { name: 'Chini (loose)', unit: 'kg', category: 'Atta & Grains' },
  { name: 'Basmati Rice (loose)', unit: 'kg', category: 'Atta & Grains' },
  { name: 'Toor Dal (loose)', unit: 'kg', category: 'Dal & Pulses' },
  { name: 'Moong Dal (loose)', unit: 'kg', category: 'Dal & Pulses' },
  { name: 'Chana Dal (loose)', unit: 'kg', category: 'Dal & Pulses' },
  { name: 'Fortune Sunflower Oil 1 L', unit: 'piece', category: 'Oil & Ghee' },
  { name: 'Fortune Mustard Oil 1 L', unit: 'piece', category: 'Oil & Ghee' },
  { name: 'Amul Ghee 1 L', unit: 'piece', category: 'Oil & Ghee' },
  { name: 'Tata Salt 1 kg', unit: 'packet', category: 'Spices' },
  { name: 'Everest Haldi 100 g', unit: 'packet', category: 'Spices' },
  { name: 'MDH Garam Masala 100 g', unit: 'packet', category: 'Spices' },
  { name: 'Amul Butter 100 g', unit: 'piece', category: 'Dairy' },
  { name: 'Amul Taaza Milk 500 ml', unit: 'piece', category: 'Dairy' },
  { name: 'Parle-G 250 g', unit: 'packet', category: 'Biscuits' },
  { name: 'Britannia Good Day 100 g', unit: 'packet', category: 'Biscuits' },
  { name: 'Maggi 70 g', unit: 'piece', category: 'Snacks' },
  { name: 'Lay’s Classic 52 g', unit: 'packet', category: 'Snacks' },
  { name: 'Surf Excel 500 g', unit: 'packet', category: 'Detergent' },
  { name: 'Vim Bar 200 g', unit: 'piece', category: 'Detergent' },
  { name: 'Colgate Strong Teeth 100 g', unit: 'piece', category: 'Personal Care' },
  { name: 'Lifebuoy Soap 100 g', unit: 'piece', category: 'Personal Care' },
  { name: 'Clinic Plus Shampoo sachet', unit: 'packet', category: 'Personal Care' },
];

const HOME: StarterItem[] = [
  { name: 'Mango Pickle 500 g', unit: 'piece', category: 'Pickles' },
  { name: 'Mixed Pickle 250 g', unit: 'piece', category: 'Pickles' },
  { name: 'Papad (per kg)', unit: 'kg', category: 'Papad & Snacks' },
  { name: 'Besan Laddoo', unit: 'kg', category: 'Sweets' },
  { name: 'Hand-made Diya', unit: 'dozen', category: 'Handmade' },
  { name: 'Embroidered Cushion Cover', unit: 'piece', category: 'Handmade' },
];

export function starterFor(type: BusinessType | undefined): StarterItem[] {
  return type === 'home' ? [...HOME, ...KIRANA.slice(0, 6)] : KIRANA;
}
