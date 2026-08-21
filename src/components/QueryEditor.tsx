import React, { useCallback, useState } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { Button, CodeEditor, InlineField, Tooltip } from '@grafana/ui';
import { DataSource } from '../datasource';
import { FelderaColumn, FelderaOptions, FelderaQuery, FelderaView } from '../types';
import { buildSelectQuery } from '../queryBuilder';
import { ColumnSelector } from './ColumnSelector';
import { PipelineSelector } from './PipelineSelector';
import { ViewSelector } from './ViewSelector';

type Props = QueryEditorProps<DataSource, FelderaQuery, FelderaOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [selectedViewState, setSelectedViewState] = useState<{ pipeline?: string; view?: FelderaView }>({});
  const selectedPipeline = query.pipeline || datasource.defaultPipeline;
  const selectedView = selectedViewState.pipeline === selectedPipeline ? selectedViewState.view : undefined;
  const update = (patch: Partial<FelderaQuery>) => onChange({ ...query, ...patch });

  const rehydrateView = useCallback((views: FelderaView[]) => {
    setSelectedViewState({ pipeline: selectedPipeline, view: views.find((view) => view.name === query.view) });
  }, [query.view, selectedPipeline]);

  const insert = (text: string) => {
    const separator = query.queryText?.trim() ? '\n' : '';
    update({ queryText: `${query.queryText ?? ''}${separator}${text}` });
  };

  return (
    <>
      <PipelineSelector datasource={datasource} value={query.pipeline} onChange={(pipeline) => update({ pipeline, view: undefined, columns: undefined })} />
      {!query.pipeline && datasource.defaultPipeline && <div>Using datasource default: {datasource.defaultPipeline}</div>}
      <ViewSelector
        datasource={datasource}
        pipeline={selectedPipeline}
        value={query.view}
        onSelect={(view) => {
          setSelectedViewState({ pipeline: selectedPipeline, view });
          update({ view: view.name, columns: [] });
        }}
        onViewsLoaded={rehydrateView}
      />
      <ColumnSelector columns={selectedView?.columns ?? []} value={query.columns} onChange={(columns: FelderaColumn[]) => update({ columns: columns.map((column) => column.name) })} />
      <InlineField label="Insert" labelWidth={14}>
        <>
          <Button variant="secondary" onClick={() => insert('LIMIT 100')}>Limit</Button>
          <Button variant="secondary" onClick={() => insert('$__timeFrom()')}>From time</Button>
          <Button variant="secondary" onClick={() => insert('$__timeTo()')}>To time</Button>
        </>
      </InlineField>
      <Button variant="secondary" disabled={!selectedView} onClick={() => update({ queryText: buildSelectQuery(selectedView?.name, query.columns) })}>
        Generate SQL
      </Button>
      <CodeEditor
        width=""
        height="180px"
        language="sql"
        value={query.queryText ?? ''}
        onSave={(queryText) => update({ queryText })}
        onBlur={(queryText) => update({ queryText })}
        showMiniMap={false}
        showLineNumbers={true}
      />
      <Tooltip content="Queries run only when Run query is clicked. Only SELECT queries are allowed. Use $__timeFrom() and $__timeTo() for Grafana time range values.">
        <Button variant="primary" onClick={onRunQuery} disabled={!query.queryText?.trim()}>
          Run query
        </Button>
      </Tooltip>
    </>
  );
}
