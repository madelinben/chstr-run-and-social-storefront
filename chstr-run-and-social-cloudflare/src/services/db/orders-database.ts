export interface DatabaseRunResult {
  meta: { changes: number; last_row_id: number };
}

export interface DatabaseStatement {
  bind(...values: (string | number | null)[]): DatabaseStatement;
  first<Row>(): Promise<Row | null>;
  all<Row>(): Promise<{ results: Row[] }>;
  run(): Promise<DatabaseRunResult>;
}

/** Structural subset of the Cloudflare D1 binding that this app uses. */
export interface DatabaseBinding {
  prepare(sql: string): DatabaseStatement;
  batch(statements: DatabaseStatement[]): Promise<DatabaseRunResult[]>;
}
