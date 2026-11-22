import {
  MAX_QUANTITY,
  MIN_QUANTITY,
  RFQ_ATTACHMENT_ALLOWED_MIMES,
  RFQ_ATTACHMENT_MAX_BYTES,
  CartLineInput,
  canActAsOrgBuyer,
  canReadOrgData,
  checkQuantity,
  checkRfqAttachment,
  checkRfqAttachmentFilename,
  computeCartTotals,
  displayUnit,
  mergeQuantity,
} from './index';

/** Helper for building cart lines in the totals tests. */
const line = (priceMinor: number, quantity: number): CartLineInput => ({ priceMinor, quantity });

describe('quantity bounds constants', () => {
  it('pin the contract range 1..99 (aligned with V6 clamp)', () => {
    expect(MIN_QUANTITY).toBe(1);
    expect(MAX_QUANTITY).toBe(99);
  });
});

describe('checkQuantity', () => {
  it('accepts the full inclusive range 1..99', () => {
    expect(checkQuantity(MIN_QUANTITY)).toBe('ok');
    expect(checkQuantity(MAX_QUANTITY)).toBe('ok');
    expect(checkQuantity(50)).toBe('ok');
  });

  it('rejects quantities below the minimum', () => {
    expect(checkQuantity(0)).toBe('too_low');
    expect(checkQuantity(-1)).toBe('too_low');
    expect(checkQuantity(-99)).toBe('too_low');
  });

  it('rejects quantities above the maximum', () => {
    expect(checkQuantity(MAX_QUANTITY + 1)).toBe('too_high');
    expect(checkQuantity(100)).toBe('too_high');
    expect(checkQuantity(1000)).toBe('too_high');
  });

  it('maps non-integer quantities to too_low (invalid, not too high)', () => {
    // The implementation treats "not a valid quantity" as too_low: any
    // non-integer (including NaN) fails the Number.isInteger guard first.
    expect(checkQuantity(1.5)).toBe('too_low');
    expect(checkQuantity(98.999)).toBe('too_low');
    expect(checkQuantity(Number.NaN)).toBe('too_low');
  });
});

describe('mergeQuantity', () => {
  it('sums a normal merge within bounds', () => {
    expect(mergeQuantity(2, 3)).toBe(5);
    expect(mergeQuantity(1, 1)).toBe(2);
    expect(mergeQuantity(10, 40)).toBe(50);
  });

  it('clamps merges that would exceed MAX_QUANTITY to MAX_QUANTITY', () => {
    expect(mergeQuantity(95, 10)).toBe(MAX_QUANTITY);
    expect(mergeQuantity(MAX_QUANTITY, 1)).toBe(MAX_QUANTITY);
    expect(mergeQuantity(50, 60)).toBe(MAX_QUANTITY);
    expect(mergeQuantity(MAX_QUANTITY, MAX_QUANTITY)).toBe(MAX_QUANTITY);
  });

  it('floors merges that would fall below MIN_QUANTITY at MIN_QUANTITY', () => {
    expect(mergeQuantity(0, 0)).toBe(MIN_QUANTITY);
    expect(mergeQuantity(1, -5)).toBe(MIN_QUANTITY);
  });

  it('keeps in-bounds sums untouched (no accidental flooring/clamping)', () => {
    expect(mergeQuantity(0, 5)).toBe(5);
    expect(mergeQuantity(1, 0)).toBe(MIN_QUANTITY);
    expect(mergeQuantity(MAX_QUANTITY, 0)).toBe(MAX_QUANTITY);
  });
});

describe('computeCartTotals', () => {
  it('returns zero totals for an empty cart', () => {
    expect(computeCartTotals([])).toEqual({ subtotalMinor: 0, itemCount: 0, lineCount: 0 });
  });

  it('computes multi-line math exactly in integer minor units', () => {
    const totals = computeCartTotals([line(1000, 2), line(250, 3), line(1_890_000, 1)]);
    expect(totals.subtotalMinor).toBe(2_000 + 750 + 1_890_000);
    expect(totals.itemCount).toBe(6);
    expect(totals.lineCount).toBe(3);
    expect(Number.isInteger(totals.subtotalMinor)).toBe(true);
  });

  it('distinguishes itemCount (sum of quantities) from lineCount (distinct lines)', () => {
    // One line of ten units: itemCount 10 but only a single line.
    const single = computeCartTotals([line(500, 10)]);
    expect(single.itemCount).toBe(10);
    expect(single.lineCount).toBe(1);

    // Three lines of one unit each: itemCount and lineCount agree.
    const many = computeCartTotals([line(1, 1), line(1, 1), line(1, 1)]);
    expect(many.itemCount).toBe(3);
    expect(many.lineCount).toBe(3);
  });

  it('handles large minor-unit amounts without float drift', () => {
    const totals = computeCartTotals([line(1_890_000, MAX_QUANTITY)]);
    expect(totals.subtotalMinor).toBe(1_890_000 * 99);
    expect(totals.itemCount).toBe(MAX_QUANTITY);
    expect(totals.lineCount).toBe(1);
  });

  it('throws on a negative priceMinor', () => {
    expect(() => computeCartTotals([line(-1, 1)])).toThrow(/invalid priceMinor/);
  });

  it('throws on a fractional (float) priceMinor', () => {
    expect(() => computeCartTotals([line(10.5, 1)])).toThrow(/invalid priceMinor/);
    expect(() => computeCartTotals([line(0.1, 1)])).toThrow(/invalid priceMinor/);
  });

  it('throws on out-of-range quantities (0, above max, fractional)', () => {
    expect(() => computeCartTotals([line(100, 0)])).toThrow(/invalid quantity/);
    expect(() => computeCartTotals([line(100, MAX_QUANTITY + 1)])).toThrow(/invalid quantity/);
    expect(() => computeCartTotals([line(100, 1.5)])).toThrow(/invalid quantity/);
  });

  it('throws even when only one line of many is malformed', () => {
    const lines = [line(100, 2), line(200, 3), line(-5, 1)];
    expect(() => computeCartTotals(lines)).toThrow(/invalid priceMinor/);
  });
});

describe('displayUnit', () => {
  it('returns IRR unchanged — no silent Rial/Toman conversion (CUR-01)', () => {
    expect(displayUnit('IRR')).toBe('IRR');
  });

  it('passes other currencies through untouched', () => {
    expect(displayUnit('USD')).toBe('USD');
    expect(displayUnit('EUR')).toBe('EUR');
  });
});

describe('organization roles (N16)', () => {
  it('lets OWNER and BUYER raise/accept org RFQs', () => {
    expect(canActAsOrgBuyer('OWNER')).toBe(true);
    expect(canActAsOrgBuyer('BUYER')).toBe(true);
  });

  it('denies ACCOUNTANT purchasing actions (finance-only role)', () => {
    expect(canActAsOrgBuyer('ACCOUNTANT')).toBe(false);
  });

  it('lets every active member read their own organization data', () => {
    expect(canReadOrgData('OWNER')).toBe(true);
    expect(canReadOrgData('BUYER')).toBe(true);
    expect(canReadOrgData('ACCOUNTANT')).toBe(true);
  });
});

describe('RFQ attachments (B3)', () => {
  it('accepts the whitelisted MIME types within the byte budget', () => {
    for (const mime of RFQ_ATTACHMENT_ALLOWED_MIMES) {
      expect(checkRfqAttachment(mime, 1024)).toBe('ok');
    }
    expect(checkRfqAttachment('application/pdf', RFQ_ATTACHMENT_MAX_BYTES)).toBe('ok');
  });

  it('rejects non-whitelisted MIME types', () => {
    expect(checkRfqAttachment('application/zip', 100)).toBe('bad_mime');
    expect(checkRfqAttachment('text/html', 100)).toBe('bad_mime');
    expect(checkRfqAttachment('image/svg+xml', 100)).toBe('bad_mime');
  });

  it('rejects sizes outside 1..max bytes (incl. non-integers)', () => {
    expect(checkRfqAttachment('application/pdf', 0)).toBe('too_large');
    expect(checkRfqAttachment('application/pdf', RFQ_ATTACHMENT_MAX_BYTES + 1)).toBe('too_large');
    expect(checkRfqAttachment('application/pdf', 1.5)).toBe('too_large');
  });

  it('rejects path-like or control-character filenames', () => {
    expect(checkRfqAttachmentFilename('spec.pdf')).toBe('ok');
    expect(checkRfqAttachmentFilename('../etc/passwd')).toBe('bad_filename');
    expect(checkRfqAttachmentFilename('C:\\tmp\\x.pdf')).toBe('bad_filename');
    expect(checkRfqAttachmentFilename('bad\x01name.pdf')).toBe('bad_filename');
    expect(checkRfqAttachmentFilename('a'.repeat(121))).toBe('bad_filename');
    expect(checkRfqAttachmentFilename('')).toBe('bad_filename');
  });
});
