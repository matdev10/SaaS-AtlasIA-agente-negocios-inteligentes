import { isWidgetOriginAllowed } from './origin-policy';

const allowed = ['https://nuvcore.cl', 'https://www.nuvcore.cl'];

describe('isWidgetOriginAllowed', () => {
  it('allows the configured site and its www host', () => {
    expect(isWidgetOriginAllowed('https://nuvcore.cl', allowed)).toBe(true);
    expect(isWidgetOriginAllowed('https://www.nuvcore.cl', allowed)).toBe(true);
  });

  it('rejects other sites', () => {
    expect(isWidgetOriginAllowed('https://example.com', allowed)).toBe(false);
  });

  it('allows localhost only when loopback is enabled', () => {
    expect(isWidgetOriginAllowed('http://localhost:3000', allowed)).toBe(false);
    expect(
      isWidgetOriginAllowed('http://localhost:3000', allowed, {
        allowLoopback: true,
      }),
    ).toBe(true);
  });

  it('allows requests without an origin', () => {
    expect(isWidgetOriginAllowed(undefined, allowed)).toBe(true);
  });
});
