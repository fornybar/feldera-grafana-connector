import React, { useCallback, useEffect, useState } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { Button, CodeEditor, Tooltip } from '@grafana/ui';
import { DataSource } from '../datasource';
import { FelderaColumn, FelderaOptions, FelderaQuery, FelderaView } from '../types';
import { ColumnSelector } from './ColumnSelector';
import { PipelineSelector } from './PipelineSelector';
import { ViewSelector } from './ViewSelector';

type Props = QueryEditorProps<DataSource, FelderaQuery, FelderaOptions>;

function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const [selectedView, setSelectedView] = useState<FelderaView>();
  const update = (patch: Partial<FelderaQuery>) => onChange({ ...query, ...patch });
  const selectedPipeline = query.pipeline || datasource.defaultPipeline;

  useEffect(() => setSelectedView(undefined), [selectedPipeline]);
  const rehydrateView = useCallback((views: FelderaView[]) => {
    setSelectedView(views.find((view) => view.name === query.view));
  }, [query.view]);

  const queryForView = (view: FelderaView, columns: string[] = []) => {
    const projection = columns.length ? columns.map(quoteIdentifier).join(',\n  ') : '*';
    return `SELECT ${projection}\nFROM ${quoteIdentifier(view.name)}\nLIMIT 100`;
  };

  const selectView = (view: FelderaView) => {
    setSelectedView(view);
    update({ view: view.name, columns: [], queryText: queryForView(view) });
  };

  const selectColumns = (columns: FelderaColumn[]) => {
    if (!selectedView) {
      return;
    }
    const names = columns.map((column) => column.name);
    update({ columns: names, queryText: queryForView(selectedView, names) });
  };

  return (
    <>
      <PipelineSelector datasource={datasource} value={query.pipeline} onChange={(pipeline) => update({ pipeline, view: undefined, columns: undefined })} />
      {!query.pipeline && datasource.defaultPipeline && <div>Using datasource default: {datasource.defaultPipeline}</div>}
      <ViewSelector
        datasource={datasource}
        pipeline={selectedPipeline}
        value={query.view}
        onSelect={selectView}
        onViewsLoaded={rehydrateView}
      />
      <ColumnSelector columns={selectedView?.columns ?? []} value={query.columns} onChange={selectColumns} />
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
