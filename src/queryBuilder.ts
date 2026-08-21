export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function buildSelectQuery(view?: string, columns: string[] = []): string {
  if (!view) {
    return '';
  }
  const projection = columns.length
    ? `SELECT\n  ${columns.map(quoteIdentifier).join(',\n  ')}`
    : 'SELECT *';
  return `${projection}\nFROM ${quoteIdentifier(view)}`;
}
