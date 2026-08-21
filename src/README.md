# Feldera Datasource Connector

Grafana datasource for querying Feldera materialized views.

## Configure

Set the Feldera base URL and an API key in datasource settings. Use a dedicated read-only Feldera key where available.

## Query

Select a pipeline, materialized view, and optional columns, then run a `SELECT` query. The connector rejects write SQL.

Supported macros:

```text
$__timeFrom()
$__timeTo()
```

Source, installation, and release documentation: https://github.com/fornybar/feldera-grafana-connector
