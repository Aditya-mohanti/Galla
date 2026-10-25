const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_HI = ['जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून', 'जुला', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];

/** Local (Asia/Kolkata on device) date as YYYY-MM-DD. */
export function todayISO(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

/** "2026-10-24" → "24 Oct" (or "24 अक्टू"). */
export function formatDay(iso: string, lang: 'hi' | 'en' = 'en'): string {
  const m = +iso.slice(5, 7) - 1;
  return `${+iso.slice(8, 10)} ${(lang === 'hi' ? MONTHS_HI : MONTHS)[m]}`;
}

export function formatDateTime(isoTs: string, lang: 'hi' | 'en' = 'en'): string {
  const d = new Date(isoTs);
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${formatDay(todayISO(d), lang)}, ${((h + 11) % 12) + 1}:${mm} ${ampm}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
