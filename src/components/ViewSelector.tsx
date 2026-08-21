import React, { useEffect, useState } from 'react';
import { InlineField, Select } from '@grafana/ui';
import { DataSource } from '../datasource';
import { FelderaView } from '../types';

interface Props {
  datasource: DataSource;
  pipeline?: string;
  value?: string;
  onSelect: (view: FelderaView) => void;
  onViewsLoaded: (views: FelderaView[]) => void;
}

export function ViewSelector({ datasource, pipeline, value, onSelect, onViewsLoaded }: Props) {
  const [views, setViews] = useState<FelderaView[]>([]);
  const [discoveryFailed, setDiscoveryFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!pipeline) {
      onViewsLoaded([]);
      return () => { active = false; };
    }
    datasource.getViews(pipeline).then(
      (items) => {
        if (active) {
          setViews(items);
          onViewsLoaded(items);
          setDiscoveryFailed(false);
        }
      },
      () => {
        if (active) {
          setViews([]);
          onViewsLoaded([]);
          setDiscoveryFailed(true);
        }
      }
    );
    return () => { active = false; };
  }, [datasource, onViewsLoaded, pipeline]);

  const options = (pipeline ? views : []).map((view) => ({
    label: view.name,
    value: view.name,
    view,
  }));

  return (
    <>
      <InlineField label="View" labelWidth={14} tooltip="Pipeline output views available for querying">
        <Select
          inputId="query-editor-view"
          isDisabled={!pipeline}
          value={value}
          options={options}
          placeholder={pipeline ? 'Select a view' : 'Select a pipeline first'}
          onChange={(option) => option?.view && onSelect(option.view)}
        />
      </InlineField>
      {pipeline && discoveryFailed && <div role="alert">Could not load views for this pipeline.</div>}
    </>
  );
}
