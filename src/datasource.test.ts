import { DataSource } from './datasource';

describe('DataSource.getPipelines', () => {
  it('extracts and sorts only named pipeline records', async () => {
    const getResource = jest.fn().mockResolvedValue([{ name: 'zeta' }, {}, { name: 'alpha', status: 'RUNNING' }, { name: 3 }]);
    const result = await DataSource.prototype.getPipelines.call({ getResource } as unknown as DataSource);
    expect(result).toEqual([{ name: 'alpha', status: 'RUNNING' }, { name: 'zeta' }]);
    expect(getResource).toHaveBeenCalledWith('pipelines');
  });

  it('returns no choices for unsupported metadata response', async () => {
    const result = await DataSource.prototype.getPipelines.call({ getResource: jest.fn().mockResolvedValue({}) } as unknown as DataSource);
    expect(result).toEqual([]);
  });
});

describe('DataSource.getViews', () => {
  it('uses pipeline-scoped resource route and sorts views', async () => {
    const getResource = jest.fn().mockResolvedValue([{ name: 'zeta' }, { name: 'alpha', materialized: true }, {}]);
    const result = await DataSource.prototype.getViews.call({ getResource } as unknown as DataSource, 'power pipeline');
    expect(result).toEqual([{ name: 'alpha', materialized: true }, { name: 'zeta' }]);
    expect(getResource).toHaveBeenCalledWith('pipelines/power%20pipeline/views');
  });
});
