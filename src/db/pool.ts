/**
 * Re-exports the SQLite pool for local development.
 * For production PostgreSQL, replace this file's contents with the pg Pool version.
 */
export { default, initSchema } from './sqlite';
