import { searchReviewSteps } from './review-search';

describe('Local configuration search', () => {
  it('returns every step for an empty search', () => {
    expect(searchReviewSteps('  ').length).toBe(7);
  });
  it('ignores accents and case and retains the correct destination after filtering', () => {
    const results = searchReviewSteps('PREÇOS');
    expect(results.map(step => step.id)).toEqual([3]);
    expect(results[0].route).toBe('/wizard-step-3-services');
  });
  it('supports a phrase with multiple relevant terms', () => {
    expect(searchReviewSteps('Quero alterar o horário da IA').map(step => step.id)).toEqual([7]);
  });
  it('finds related vocabulary and partial words', () => {
    expect(searchReviewSteps('convidar').map(step => step.id)).toEqual([5]);
    expect(searchReviewSteps('sincron').map(step => step.id)).toEqual([6]);
  });
  it('returns no unrelated steps when no match exists', () => {
    expect(searchReviewSteps('estacionamento')).toEqual([]);
  });
});
