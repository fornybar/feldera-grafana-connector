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

  it('adds Grafana time macros for selected time column', () => {
    expect(buildSelectQuery('daily_power', [], 100, 'event_time')).toBe(
      'SELECT *\nFROM "daily_power"\nWHERE "event_time" >= $__timeFrom()\n  AND "event_time" <= $__timeTo()\nLIMIT 100'
    );
  });
});
