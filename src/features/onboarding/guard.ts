// Route guard (01 §5): no language → 1.1; no session → 1.2; session but no business → 1.4; else tabs.
// Killing the app mid-setup resumes at the first incomplete step because each step is persisted.

export type GuardState = { language: string | null; session: unknown | null; business: unknown | null };
export type GuardRoute = '/language' | '/phone' | '/setup' | '/home';

export function nextRoute(s: GuardState): GuardRoute {
  if (!s.language) return '/language';
  if (!s.session) return '/phone';
  if (!s.business) return '/setup';
  return '/home';
}
