import React, { useEffect, useState } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { DataSource } from '../datasource';

interface Props {
  datasource: DataSource;
  value?: string;
  onChange: (pipeline?: string) => void;
}

export function PipelineSelector({ datasource, value, onChange }: Props) {
  const [pipelines, setPipelines] = useState<string[]>([]);
  const [discoveryFailed, setDiscoveryFailed] = useState(false);

  useEffect(() => {
    let active = true;
    datasource
      .getPipelines()
      .then((items) => {
        if (active) {
          setPipelines(items);
          setDiscoveryFailed(false);
        }
      })
      .catch(() => {
        if (active) {
          setPipelines([]);
          setDiscoveryFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [datasource]);

  const options = pipelines.map((name) => ({ label: name, value: name }));
  return (
    <>
      <InlineField label="Pipeline" labelWidth={14} tooltip="Empty uses datasource default pipeline">
        <Select
          inputId="query-editor-pipeline"
          width={40}
          value={value ?? ''}
          options={options}
          isClearable
          allowCustomValue
          placeholder="Datasource default"
          onChange={(option) => onChange(option?.value)}
        />
      </InlineField>
      {discoveryFailed && <div role="alert">Could not load pipelines. Enter a pipeline name manually.</div>}
    </>
  );
}
