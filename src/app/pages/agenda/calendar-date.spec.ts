import { addDays, clinicInstant, weekStart, zonedParts } from './calendar-date';

describe('Calendar clinic dates', () => {
  it('converts clinic wall time to an explicit instant independent of browser timezone', () => {
    expect(clinicInstant('2026-09-21T08:00', 'America/Sao_Paulo')).toBe('2026-09-21T11:00:00.000Z');
    expect(zonedParts('2026-09-22T01:00:00Z', 'America/Sao_Paulo')).toBe('2026-09-21T22:00');
  });
  it('handles positive and fractional timezone offsets', () => {
    expect(clinicInstant('2026-09-21T08:00', 'Asia/Kolkata')).toBe('2026-09-21T02:30:00.000Z');
  });
  it('rejects a nonexistent time at a daylight-saving transition', () => {
    expect(() => clinicInstant('2026-03-08T02:30', 'America/New_York')).toThrowError(/não existe/);
  });
  it('starts weeks on Monday and handles month/year boundaries', () => {
    expect(weekStart('2027-01-03')).toBe('2026-12-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
