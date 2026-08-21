# Security policy

## Reporting a vulnerability

Do not report security-sensitive issues in public GitHub issues.

Use GitHub private vulnerability reporting when enabled. Include affected version, reproduction steps, impact, and suggested mitigation when known.

## Security model

- Feldera API keys are stored in Grafana secure JSON data and used only by plugin backend.
- Browser resource routes expose only pipeline names and materialized-view/column metadata.
- Connector accepts only read-only `SELECT` and `EXPLAIN SELECT` SQL.
- A dedicated least-privilege Feldera key remains required for production use.
