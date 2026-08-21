export function quoteIdentifier(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

export function buildSelectQuery(view?: string, columns: string[] = [], limit = 100): string {
  if (!view) {
    return '';
  }
  const projection = columns.length ? columns.map(quoteIdentifier).join(',\n  ') : '*';
  return `SELECT ${projection}\nFROM ${quoteIdentifier(view)}\nLIMIT ${limit}`;
}
