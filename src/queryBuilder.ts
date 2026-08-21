export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function buildSelectQuery(view?: string, columns: string[] = [], timeColumn?: string): string {
  if (!view) {
    return '';
  }
  const projection = columns.length
    ? `SELECT\n  ${columns.map(quoteIdentifier).join(',\n  ')}`
    : 'SELECT *';
  const filter = timeColumn
    ? `\nWHERE ${quoteIdentifier(timeColumn)} >= $__timeFrom()\n  AND ${quoteIdentifier(timeColumn)} <= $__timeTo()`
    : '';
  return `${projection}\nFROM ${quoteIdentifier(view)}${filter}\nLIMIT 100`;
}
