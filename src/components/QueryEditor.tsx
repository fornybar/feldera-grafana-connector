import React, { useCallback, useEffect, useState } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { Button, CodeEditor, InlineField, Input, Tooltip } from '@grafana/ui';
import { DataSource } from '../datasource';
import { FelderaColumn, FelderaOptions, FelderaQuery, FelderaView } from '../types';
import { buildSelectQuery } from '../queryBuilder';
import { ColumnSelector } from './ColumnSelector';
import { PipelineSelector } from './PipelineSelector';
import { ViewSelector } from './ViewSelector';

type Props = QueryEditorProps<DataSource, FelderaQuery, FelderaOptions>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [selectedView, setSelectedView] = useState<FelderaView>();
  const mode = query.mode ?? 'sql';
  const limit = query.limit ?? 100;
  const selectedPipeline = query.pipeline || datasource.defaultPipeline;
  const update = (patch: Partial<FelderaQuery>) => onChange({ ...query, ...patch });

  useEffect(() => setSelectedView(undefined), [selectedPipeline]);
  const rehydrateView = useCallback((views: FelderaView[]) => {
    setSelectedView(views.find((view) => view.name === query.view));
  }, [query.view]);

  const updateBuilderQuery = (patch: Partial<FelderaQuery>, view = selectedView, columns = query.columns ?? [], nextLimit = limit) => {
    update({ ...patch, queryText: buildSelectQuery(view?.name, columns, nextLimit) });
  };

  const selectView = (view: FelderaView) => {
    setSelectedView(view);
    updateBuilderQuery({ view: view.name, columns: [] }, view, []);
  };

  const selectColumns = (columns: FelderaColumn[]) => {
    updateBuilderQuery({ columns: columns.map((column) => column.name) }, selectedView, columns.map((column) => column.name));
  };

  const appendMacro = (macro: string) => {
    const separator = query.queryText?.trim() ? '\n' : '';
    update({ queryText: `${query.queryText ?? ''}${separator}${macro}` });
  };

  return (
    <>
      <InlineField label="Mode" labelWidth={14}>
        <>
          <Button variant={mode === 'sql' ? 'primary' : 'secondary'} onClick={() => update({ mode: 'sql' })}>SQL</Button>
          <Button variant={mode === 'builder' ? 'primary' : 'secondary'} onClick={() => update({ mode: 'builder' })}>Builder</Button>
        </>
      </InlineField>
      <PipelineSelector datasource={datasource} value={query.pipeline} onChange={(pipeline) => update({ pipeline, view: undefined, columns: undefined })} />
      {!query.pipeline && datasource.defaultPipeline && <div>Using datasource default: {datasource.defaultPipeline}</div>}
      {mode === 'builder' && (
        <>
          <ViewSelector datasource={datasource} pipeline={selectedPipeline} value={query.view} onSelect={selectView} onViewsLoaded={rehydrateView} />
          <ColumnSelector columns={selectedView?.columns ?? []} value={query.columns} onChange={selectColumns} />
          <InlineField label="Limit" labelWidth={14}>
            <Input
              type="number"
              min={1}
              value={limit}
              onChange={(event) => {
                const nextLimit = Math.max(1, Number(event.currentTarget.value) || 1);
                updateBuilderQuery({ limit: nextLimit }, selectedView, query.columns ?? [], nextLimit);
              }}
            />
          </InlineField>
        </>
      )}
      {mode === 'sql' && (
        <InlineField label="Insert" labelWidth={14}>
          <>
            <Button variant="secondary" onClick={() => appendMacro('$__timeFrom()')}>From time</Button>
            <Button variant="secondary" onClick={() => appendMacro('$__timeTo()')}>To time</Button>
          </>
        </InlineField>
      )}
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
