import { nextRoute } from '../../features/onboarding/guard';
import { businessDefaults } from '../../store/app';

jest.mock('expo-sqlite/kv-store', () => ({ __esModule: true, default: { getItem: jest.fn(async () => null), setItem: jest.fn(), removeItem: jest.fn() } }));

describe('route guard', () => {
  it('walks first-run steps in order', () => {
    expect(nextRoute({ language: null, session: null, business: null })).toBe('/language');
    expect(nextRoute({ language: 'hi', session: null, business: null })).toBe('/phone');
    expect(nextRoute({ language: 'hi', session: {}, business: null })).toBe('/setup');
    expect(nextRoute({ language: 'hi', session: {}, business: {} })).toBe('/home');
  });
  it('logged out with an existing business goes back to phone, data kept', () => {
    expect(nextRoute({ language: 'en', session: null, business: {} })).toBe('/phone');
  });
});

describe('useBusinessDefaults flags (ON-7)', () => {
  it('online expands fees and defaults channel', () => {
    expect(businessDefaults('online')).toMatchObject({ sellFeesExpanded: true, defaultChannel: 'online' });
  });
  it('wholesale shows party field', () => {
    expect(businessDefaults('wholesale')).toMatchObject({ partyFieldVisible: true, defaultChannel: 'wholesale' });
  });
  it('retail hides party behind a button', () => {
    expect(businessDefaults('retail')).toMatchObject({ partyBehindButton: true, partyFieldVisible: false });
  });
  it('home relabels extra cost', () => {
    expect(businessDefaults('home').extraCostLabelKey).toBe('buy.extraCostHome');
  });
});
