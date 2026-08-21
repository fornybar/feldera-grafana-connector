import { DataSourceInstanceSettings, ScopedVars } from '@grafana/data';
import { DataSourceWithBackend, getTemplateSrv } from '@grafana/runtime';

import { FelderaPipeline, FelderaQuery, FelderaOptions, FelderaView } from './types';

export class DataSource extends DataSourceWithBackend<FelderaQuery, FelderaOptions> {
  readonly defaultPipeline?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<FelderaOptions>) {
    super(instanceSettings);
    this.defaultPipeline = instanceSettings.jsonData.pipeline?.trim() || undefined;
  }

  async getPipelines(): Promise<FelderaPipeline[]> {
    const response = await this.getResource<unknown>('pipelines');
    if (!Array.isArray(response)) {
      return [];
    }
    return response
      .filter((item): item is FelderaPipeline => typeof item === 'object' && item !== null && typeof (item as FelderaPipeline).name === 'string')
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async getViews(pipeline: string): Promise<FelderaView[]> {
    const response = await this.getResource<unknown>(`pipelines/${encodeURIComponent(pipeline)}/views`);
    if (!Array.isArray(response)) {
      return [];
    }
    return response
      .filter((item): item is FelderaView => typeof item === 'object' && item !== null && typeof (item as FelderaView).name === 'string')
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  applyTemplateVariables(query: FelderaQuery, scopedVars: ScopedVars) {
    return {
      ...query,
      queryText: getTemplateSrv().replace(query.queryText, scopedVars),
      pipeline: getTemplateSrv().replace(query.pipeline, scopedVars),
    };
  }

  filterQuery(query: FelderaQuery): boolean {
    return !!query.queryText?.trim();
  }
}
