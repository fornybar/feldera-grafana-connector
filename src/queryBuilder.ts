export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function buildSelectQuery(view?: string, columns: string[] = [], limit = 100, timeColumn?: string): string {
  if (!view) {
    return '';
  }
  const projection = columns.length ? columns.map(quoteIdentifier).join(',\n  ') : '*';
  const filter = timeColumn
    ? `\nWHERE ${quoteIdentifier(timeColumn)} >= $__timeFrom()\n  AND ${quoteIdentifier(timeColumn)} <= $__timeTo()`
    : '';
  return `SELECT ${projection}\nFROM ${quoteIdentifier(view)}${filter}\nLIMIT ${limit}`;
}
