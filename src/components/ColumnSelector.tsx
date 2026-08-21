import React from 'react';
import { InlineField, Select } from '@grafana/ui';
import { FelderaColumn } from '../types';

const allColumnsValue = '__feldera_all_columns__';

interface Props {
  columns: FelderaColumn[];
  value?: string[];
  onChange: (columns: FelderaColumn[]) => void;
}

export function ColumnSelector({ columns, value = [], onChange }: Props) {
  const allSelected = columns.length > 0 && value.length === columns.length;
  const allOption = { label: 'All columns', value: allColumnsValue, column: undefined };
  const columnOptions = columns.map((column) => ({ label: column.name, value: column.name, column }));
  const options = [allOption, ...columnOptions];
  const selected = allSelected ? [allOption] : columnOptions.filter((option) => value.includes(option.value));

  return (
    <InlineField label="Columns" labelWidth={14} tooltip="Columns in selected materialized view">
      <Select
        inputId="query-editor-columns"
        isDisabled={columns.length === 0}
        isMulti
        options={options}
        value={selected}
        placeholder={columns.length ? 'Select columns' : 'Select a view first'}
        onChange={(selection) => {
          const choices = selection as typeof options;
          onChange(choices.some((option) => option.value === allColumnsValue) ? columns : choices.flatMap((option) => option.column ? [option.column] : []));
        }}
      />
    </InlineField>
  );
}
