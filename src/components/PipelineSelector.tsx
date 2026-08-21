import React, { useEffect, useState } from 'react';
import { Icon, IconName, InlineField, Select, Stack, Tooltip } from '@grafana/ui';
import { DataSource } from '../datasource';
import { FelderaPipeline } from '../types';

interface Props {
  datasource: DataSource;
  value?: string;
  onChange: (pipeline?: string) => void;
}

const pipelineStatus = (status?: string): { icon: IconName; color: string; text: string } | undefined => {
  switch (status?.toUpperCase()) {
    case 'RUNNING':
      return { icon: 'check-circle', color: 'green', text: 'Pipeline is running and ready for queries.' };
    case 'PAUSED':
      return { icon: 'pause', color: 'blue', text: 'Pipeline is paused. Ad-hoc queries remain available.' };
    case 'FAILED':
      return { icon: 'exclamation-triangle', color: 'red', text: 'Pipeline is not ready for queries.' };
    case 'SHUTDOWN':
    case 'STOPPED':
      return { icon: 'times', color: 'red', text: 'Pipeline is stopped and not ready for queries.' };
    default:
      return status ? { icon: 'question-circle', color: 'gray', text: `Pipeline status: ${status}` } : undefined;
  }
};

export function PipelineSelector({ datasource, value, onChange }: Props) {
  const [pipelines, setPipelines] = useState<FelderaPipeline[]>([]);
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

  const options = pipelines.map((pipeline) => ({ label: pipeline.name, value: pipeline.name }));
  const status = pipelineStatus(pipelines.find((pipeline) => pipeline.name === value)?.status);
  return (
    <>
      <InlineField label="Pipeline" labelWidth={14} tooltip="Empty uses datasource default pipeline">
        <Stack gap={1} alignItems="center">
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
          {status && (
            <Tooltip content={status.text}>
              <Icon name={status.icon} color={status.color} title={status.text} />
            </Tooltip>
          )}
        </Stack>
      </InlineField>
      {discoveryFailed && <div role="alert">Could not load pipelines. Enter a pipeline name manually.</div>}
    </>
  );
}
