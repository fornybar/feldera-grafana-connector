import { buildSelectQuery } from './queryBuilder';

describe('buildSelectQuery', () => {
  it('uses selected columns and default limit', () => {
    expect(buildSelectQuery('daily_power', ['event_time', 'power_mw'])).toBe(
      'SELECT\n  "event_time",\n  "power_mw"\nFROM "daily_power"\nLIMIT 100'
    );
  });

  it('adds a selected time constraint', () => {
    expect(buildSelectQuery('daily_power', [], 'event_time')).toBe(
      'SELECT *\nFROM "daily_power"\nWHERE "event_time" >= $__timeFrom()\n  AND "event_time" <= $__timeTo()\nLIMIT 100'
    );
  });

  it('quotes identifiers', () => {
    expect(buildSelectQuery('view"name')).toBe('SELECT *\nFROM "view""name"\nLIMIT 100');
  });
});
