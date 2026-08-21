# Contributing

## Development

```bash
npm ci
go test ./...
npm run lint
npm run test:ci
npm run typecheck
npm run build
```

## Guidelines

- Keep Feldera API access backend-only.
- Keep resource routes explicit; do not add arbitrary proxy routes.
- Preserve read-only SQL enforcement.
- Add focused tests for behavior changes.
- Keep UI components small and query model changes backward compatible.

## Pull requests

Describe user-visible behavior, validation performed, and any Feldera/Grafana version assumptions.
