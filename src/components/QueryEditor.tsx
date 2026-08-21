import React, { useCallback, useState } from 'react';
import { QueryEditorProps } from '@grafana/data';
import { Button, CodeEditor, Divider, InlineField, Select, Stack, Text, Tooltip } from '@grafana/ui';
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

  return (
    <Stack direction="column" gap={2} alignItems="flex-start">
      <Text element="h6" color="secondary">Build query</Text>
      <PipelineSelector datasource={datasource} value={query.pipeline} onChange={(pipeline) => update({ pipeline, view: undefined, columns: undefined, timeColumn: undefined })} />
      {!query.pipeline && datasource.defaultPipeline && <div>Using datasource default: {datasource.defaultPipeline}</div>}
      <ViewSelector
        datasource={datasource}
        pipeline={selectedPipeline}
        value={query.view}
        onSelect={(view) => {
          setSelectedViewState({ pipeline: selectedPipeline, view });
          update({ view: view.name, columns: [], timeColumn: undefined });
        }}
        onViewsLoaded={rehydrateView}
      />
      <ColumnSelector columns={selectedView?.columns ?? []} value={query.columns} onChange={(columns: FelderaColumn[]) => update({ columns: columns.map((column) => column.name) })} />
      <InlineField label="Time" labelWidth={14} tooltip="Optional time column. Adds Grafana time-range macros when generating a query.">
        <Select
          isClearable
          width={40}
          isDisabled={!selectedView}
          options={(selectedView?.columns ?? []).map((column) => ({ label: column.name, value: column.name }))}
          value={query.timeColumn}
          placeholder="No time constraint"
          onChange={(option) => update({ timeColumn: option?.value })}
        />
      </InlineField>
      <Button variant="secondary" disabled={!selectedView} onClick={() => update({ queryText: buildSelectQuery(selectedView?.name, query.columns, query.timeColumn) })}>
        Generate query
      </Button>
      <Divider spacing={1} />
      <Text element="h6" color="secondary">Query</Text>
      <CodeEditor
        width="80%"
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
    </Stack>
  );
}
