import { buildSelectQuery } from './queryBuilder';

describe('buildSelectQuery', () => {
  it('uses selected columns and limit', () => {
    expect(buildSelectQuery('daily_power', ['event_time', 'power_mw'], 50)).toBe(
      'SELECT "event_time",\n  "power_mw"\nFROM "daily_power"\nLIMIT 50'
    );
  });

  it('quotes identifiers and uses star by default', () => {
    expect(buildSelectQuery('view"name')).toBe('SELECT *\nFROM "view""name"\nLIMIT 100');
  });
});
