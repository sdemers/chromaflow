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
    seconds INTEGER NOT NULL DEFAULT 0,
    player_name TEXT NOT NULL DEFAULT 'AAA',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

await client.execute(`
  ALTER TABLE scores ADD COLUMN seconds INTEGER NOT NULL DEFAULT 0
`).catch(() => {});

await client.execute(`
  ALTER TABLE scores ADD COLUMN player_name TEXT NOT NULL DEFAULT 'AAA'
`).catch(() => {});

await client.execute(`
  UPDATE scores
  SET player_name = 'AAA'
  WHERE player_name IS NULL OR TRIM(player_name) = ''
`).catch(() => {});

export async function getTopScores(boardSize: number, limit = 10) {
  const result = await client.execute({
    sql: 'SELECT moves, seconds, player_name FROM scores WHERE board_size = ? ORDER BY moves ASC, seconds ASC, id ASC LIMIT ?',
    args: [boardSize, limit]
  });
  return result.rows.map((row) => ({
    moves: Number(row.moves),
    seconds: Number(row.seconds),
    name: String(row.player_name ?? 'AAA')
  }));
}

export async function addScore(
  boardSize: number,
  moves: number,
  seconds: number,
  name: string,
  limit = 10
) {
  await client.execute({
    sql: 'INSERT INTO scores (board_size, moves, seconds, player_name) VALUES (?, ?, ?, ?)',
    args: [boardSize, moves, seconds, name]
  });

  await client.execute({
    sql: `
      DELETE FROM scores
      WHERE id IN (
        SELECT id FROM scores
        WHERE board_size = ?
        ORDER BY moves ASC, seconds ASC, id ASC
        LIMIT -1 OFFSET ?
      )
    `,
    args: [boardSize, limit]
  });
}
