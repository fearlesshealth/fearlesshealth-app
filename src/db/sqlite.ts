/**
 * SQLite adapter — mimics the pg Pool.query() interface so all routes
 * work without modification. Used for local development.
 * Swap src/db/pool.ts import to pg Pool for production PostgreSQL.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'hospital.db');
const db = new Database(DB_PATH);

// Enable WAL for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── pg-compatible query wrapper ─────────────────────────────────────────────

interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): QueryResult<T> {
  // Convert $1, $2 ... placeholders to ? for SQLite
  const converted = sql.replace(/\$(\d+)/g, '?');

  // Detect statement type
  const trimmed = converted.trimStart().toUpperCase();

  try {
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const rows = db.prepare(converted).all(...params) as T[];
      return { rows, rowCount: rows.length };
    }

    if (trimmed.startsWith('INSERT')) {
      // Handle RETURNING clause by splitting the statement
      const returningMatch = converted.match(/(.+)\s+RETURNING\s+(.+)$/is);
      if (returningMatch) {
        const insertSql = returningMatch[1].trim();
        const stmt = db.prepare(insertSql);
        const info = stmt.run(...params);
        const tableName = insertSql.match(/INSERT\s+INTO\s+(\w+)/i)?.[1];
        if (tableName && info.lastInsertRowid) {
          const row = db.prepare(`SELECT * FROM ${tableName} WHERE rowid = ?`).get(info.lastInsertRowid) as T;
          return { rows: row ? [row] : [], rowCount: info.changes };
        }
        return { rows: [], rowCount: info.changes };
      }
      const info = db.prepare(converted).run(...params);
      return { rows: [], rowCount: info.changes };
    }

    if (trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE')) {
      const returningMatch = converted.match(/(.+)\s+RETURNING\s+(.+)$/is);
      if (returningMatch) {
        // For UPDATE/DELETE RETURNING, run as a SELECT after the mutation
        // SQLite doesn't support RETURNING natively in older versions;
        // better-sqlite3 v9+ with SQLite 3.35+ does support it
        try {
          const rows = db.prepare(converted).all(...params) as T[];
          return { rows, rowCount: rows.length };
        } catch {
          const plainSql = returningMatch[1].trim();
          const info = db.prepare(plainSql).run(...params);
          return { rows: [], rowCount: info.changes };
        }
      }
      const info = db.prepare(converted).run(...params);
      return { rows: [], rowCount: info.changes };
    }

    // DDL / other
    db.exec(converted);
    return { rows: [], rowCount: 0 };
  } catch (err) {
    throw err;
  }
}

// ─── Transaction support ──────────────────────────────────────────────────────

interface Client {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => QueryResult<T>;
  release: () => void;
}

let txActive = false;

function connect(): Client {
  if (!txActive) {
    db.prepare('BEGIN').run();
    txActive = true;
  }
  return {
    query: <T>(sql: string, params: unknown[] = []) => query<T>(sql, params),
    release: () => {},
  };
}

function commitTransaction() {
  if (txActive) {
    db.prepare('COMMIT').run();
    txActive = false;
  }
}

function rollbackTransaction() {
  if (txActive) {
    db.prepare('ROLLBACK').run();
    txActive = false;
  }
}

// ─── Pool-compatible client wrapper ───────────────────────────────────────────

/**
 * Mimics pg Pool.connect() — returns a client with BEGIN/COMMIT/ROLLBACK support.
 */
function connectClient(): {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => QueryResult<T>;
  release: () => void;
} {
  return {
    query: <T>(sql: string, params: unknown[] = []) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed === 'BEGIN') { db.prepare('BEGIN').run(); return { rows: [], rowCount: 0 }; }
      if (trimmed === 'COMMIT') { db.prepare('COMMIT').run(); return { rows: [], rowCount: 0 }; }
      if (trimmed === 'ROLLBACK') { db.prepare('ROLLBACK').run(); return { rows: [], rowCount: 0 }; }
      return query<T>(sql, params);
    },
    release: () => {},
  };
}

// ─── Schema init ──────────────────────────────────────────────────────────────

export function initSchema(): void {
  const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    try {
      // db.exec handles multiple statements in one call
      db.exec(sql);
    } catch (err) {
      console.error('Schema init error:', err);
    }
  }
}

// ─── Export pool-compatible object ───────────────────────────────────────────

const pool = {
  query: <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => query<T>(sql, params),
  connect: () => connectClient(),
  end: () => { db.close(); return Promise.resolve(); },
  on: (_event: string, _cb: unknown) => {},
};

export default pool;
