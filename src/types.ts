import { DataSourceJsonData } from '@grafana/data';
import { DataQuery } from '@grafana/schema';

export interface FelderaQuery extends DataQuery {
  queryText?: string;
  pipeline?: string;
  view?: string;
  columns?: string[];
  mode?: 'sql' | 'builder';
  limit?: number;
  timeColumn?: string;
}

export interface FelderaColumn {
  name: string;
}

export interface FelderaView {
  name: string;
  materialized?: boolean;
  columns?: FelderaColumn[];
}

export interface FelderaOptions extends DataSourceJsonData {
  baseUrl?: string;
  pipeline?: string;
}

export interface FelderaSecureJsonData {
  apiKey?: string;
}
