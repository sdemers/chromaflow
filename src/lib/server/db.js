import { createClient } from '@libsql/client';
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$env/static/private';

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_size INTEGER NOT NULL,
    moves INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export async function getTopScores(boardSize, limit = 10) {
  const result = await client.execute({
    sql: 'SELECT moves FROM scores WHERE board_size = ? ORDER BY moves ASC, id ASC LIMIT ?',
    args: [boardSize, limit]
  });
  return result.rows.map((row) => Number(row.moves));
}

export async function addScore(boardSize, moves, limit = 10) {
  await client.execute({
    sql: 'INSERT INTO scores (board_size, moves) VALUES (?, ?)',
    args: [boardSize, moves]
  });

  await client.execute({
    sql: `
      DELETE FROM scores
      WHERE id IN (
        SELECT id FROM scores
        WHERE board_size = ?
        ORDER BY moves ASC, id ASC
        LIMIT -1 OFFSET ?
      )
    `,
    args: [boardSize, limit]
  });
}
