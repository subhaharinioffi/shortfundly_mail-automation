import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');

export function getDb() {
  if (!global.__dbInstance) {
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    global.__dbInstance = db;
  }
  return global.__dbInstance;
}

export default getDb;
