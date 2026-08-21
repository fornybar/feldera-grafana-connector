# Feldera Datasource Connector

Grafana datasource for querying [Feldera](https://www.feldera.com/) materialized views. Plugin ID: `feldera-datasource-connector`.

## Status

Initial production release. Validated with Grafana managed alerting and Feldera Arrow query results.

## Features

- One datasource can query multiple Feldera pipelines.
- Pipeline, materialized-view, and column discovery.
- Explicit **Run query** control in editor.
- Arrow IPC result decoding with JSON fallback.
- Backend-only API key handling.
- Connector-side read-only SQL policy: `SELECT` and `EXPLAIN SELECT` only.

## Install

Download release ZIP and extract it into Grafana's plugin directory:

```bash
unzip feldera-datasource-connector-<version>.zip -d /var/lib/grafana/plugins
```

Until plugin is signed, allow its ID in Grafana configuration:

```ini
[plugins]
allow_loading_unsigned_plugins = feldera-datasource-connector
```

## Configure

```yaml
apiVersion: 1
datasources:
  - name: Feldera
    type: feldera-datasource-connector
    jsonData:
      baseUrl: http://feldera.example:8080
    secureJsonData:
      apiKey: ${FELDERA_API_KEY}
```

Use a dedicated read-only Feldera API key. The datasource accepts a per-query pipeline; no datasource default pipeline is required.

## Queries

Only materialized views are shown because Feldera ad-hoc queries can read materialized relations. The connector rejects write SQL before sending it to Feldera.

Supported Grafana macros:

```sql
SELECT *
FROM "my_materialized_view"
WHERE event_time >= $__timeFrom()
  AND event_time <= $__timeTo()
```

## Build from source

Prerequisites: Go, Node 22, Python 3, Docker, Mage.

```bash
npm ci
go test ./...
npm run lint
npm run test:ci
npm run typecheck
npm run package
```

`npm run package` writes release ZIP and SHA256 checksum under `artifacts/`.

## Release process

Bump `package.json` version and merge to `main`. After CI passes, GitHub Actions creates `v<version>` release if that tag does not already exist and uploads plugin ZIP plus checksum.

## Security

See [SECURITY.md](SECURITY.md). Report vulnerabilities privately; do not open public issues for security-sensitive findings.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
