import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'chromaflow.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_size INTEGER NOT NULL,
    moves INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertScore = db.prepare(
  'INSERT INTO scores (board_size, moves) VALUES (?, ?)'
);

const selectTopScores = db.prepare(
  'SELECT moves FROM scores WHERE board_size = ? ORDER BY moves ASC, id ASC LIMIT ?'
);

const deleteExcessScores = db.prepare(
  `
    DELETE FROM scores
    WHERE id IN (
      SELECT id FROM scores
      WHERE board_size = ?
      ORDER BY moves ASC, id ASC
      LIMIT -1 OFFSET ?
    )
  `
);

export function getTopScores(boardSize, limit = 10) {
  return selectTopScores.all(boardSize, limit).map((row) => row.moves);
}

export function addScore(boardSize, moves) {
  insertScore.run(boardSize, moves);
  deleteExcessScores.run(boardSize, 10);
}
