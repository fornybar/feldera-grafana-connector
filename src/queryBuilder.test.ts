import { buildSelectQuery } from './queryBuilder';

describe('buildSelectQuery', () => {
  it('uses selected columns', () => {
    expect(buildSelectQuery('daily_power', ['event_time', 'power_mw'])).toBe(
      'SELECT\n  "event_time",\n  "power_mw"\nFROM "daily_power"'
    );
  });

  it('quotes identifiers and uses star by default', () => {
    expect(buildSelectQuery('view"name')).toBe('SELECT *\nFROM "view""name"');
  });
});
