# Galla — Modules 0, 1, 2

This is the Expo (SDK 58) + TypeScript + expo-router app for Indian small businesses. It builds the foundation (module 0), onboarding and the business profile (module 1), and items and inventory (module 2). The spec lives in `galla-prd/`.

## Run

```bash
npm install
npx expo start          # press a for Android, or scan the QR code in Expo Go
npm test                # core logic + route guard tests
npm run typecheck
npm run i18n:check      # en/hi key parity
```

**Demo login:** any valid number works, and the OTP is `123456` (this is a stub, see below).
Log in with **98110 45672** to get the "Old data found" restore flow with a sample kirana shop of about 20 items. That data includes a loss-making item, a negative-stock item, a slow mover and an item with no cost.

## Layout

```
src/app/            routes: (auth)/language, phone, otp, restore, setup · quickstart
                    (tabs)/home, items, buy, sell, more · items/new, items/starter,
                    items/[id], items/[id]/edit · more/business, more/categories
src/core/           pure, tested logic: money, units, recomputeItem, stock rules,
                    roundNice, pricing, phone, bilingual search
src/store/          zustand stores persisted to on-device SQLite (expo-sqlite kv-store)
src/ui/             design system: tokens, T, Icon, Button, fields, chips, stepper,
                    keypad, sheets, banners, stock chip, profit text, toast
src/features/       onboarding guard + quick-start list, item form/row/adjust sheet
src/services/       auth (OTP stub), backup (restore stub + demo data), starter catalogue
src/i18n/           en.json + hi.json (every UI string)
```

## Stubs and deviations to know about

- **Auth:** `src/services/auth.ts` is a local stub. To make it real, replace `sendOtp` and `verifyOtp` with Supabase `signInWithOtp` and `verifyOtp`. The internet check is real.
- **Backup:** `src/services/backup.ts` is a stub until module 10 is built.
- **Storage:** data is kept in zustand stores persisted to SQLite (`expo-sqlite/kv-store`), not in Drizzle tables yet. Every write still replays the item's ledger through `recomputeItem` inside the same state update, so moving to the Drizzle schema in 00 §5 only means changing the repository layer.
- **Low-stock alert:** the one-time threshold-crossing logic is implemented, but the alert shows as an in-app toast. To make it a phone notification, add `expo-notifications` in `store/data.ts` (`maybeAlertLow`).
- **Lists** use `FlatList`. For 5,000+ items, swap in `@shopify/flash-list`.
- **Buy/Sell tabs, price history and the full price suggestion** belong to modules 04, 05, 06 and 08. The item detail screen already uses the core pricing formula for its suggested-price card.
