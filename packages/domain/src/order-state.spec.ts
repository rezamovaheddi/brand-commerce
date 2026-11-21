import { ORDER_TRANSITIONS, assertOrderTransition, canTransitionOrder } from './index';

/**
 * Order state machine rules (pure functions — no I/O). P2 ships DRAFT and
 * CANCELLED only; the transition map already pre-registers the P3 payment and
 * shipping states so the machine keeps its shape when they arrive.
 */
describe('order state machine (packages/domain)', () => {
  it('allows DRAFT -> CANCELLED', () => {
    expect(canTransitionOrder('DRAFT', 'CANCELLED')).toBe('ok');
  });

  it('allows DRAFT -> AWAITING_PAYMENT (pre-registered for the P3 payment flow)', () => {
    expect(canTransitionOrder('DRAFT', 'AWAITING_PAYMENT')).toBe('ok');
  });

  it('rejects every transition out of CANCELLED (terminal state)', () => {
    for (const to of Object.keys(ORDER_TRANSITIONS)) {
      expect(canTransitionOrder('CANCELLED', to)).toBe('invalid');
    }
  });

  it('allows PAID -> SHIPPED', () => {
    expect(canTransitionOrder('PAID', 'SHIPPED')).toBe('ok');
  });

  it('rejects PAID -> DRAFT (no going back)', () => {
    expect(canTransitionOrder('PAID', 'DRAFT')).toBe('invalid');
  });

  it('rejects transitions from unknown states (new states must extend the map, not bypass it)', () => {
    expect(canTransitionOrder('UNKNOWN', 'CANCELLED')).toBe('invalid');
    expect(canTransitionOrder('FOO', 'BAR')).toBe('invalid');
  });

  it('assertOrderTransition throws "invalid order transition" for illegal moves', () => {
    expect(() => assertOrderTransition('CANCELLED', 'DRAFT')).toThrow(/invalid order transition/);
    expect(() => assertOrderTransition('CANCELLED', 'CANCELLED')).toThrow(
      /invalid order transition/,
    );
    expect(() => assertOrderTransition('UNKNOWN', 'CANCELLED')).toThrow(
      /invalid order transition/,
    );
  });

  it('assertOrderTransition does not throw for legal moves', () => {
    expect(() => assertOrderTransition('DRAFT', 'CANCELLED')).not.toThrow();
    expect(() => assertOrderTransition('DRAFT', 'AWAITING_PAYMENT')).not.toThrow();
    expect(() => assertOrderTransition('PAID', 'SHIPPED')).not.toThrow();
  });
});
