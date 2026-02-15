import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addScore, getTopScores } from '$lib/server/db';

const validSizes = new Set([10, 20, 30]);

export const GET: RequestHandler = async ({ url }) => {
  const size = Number(url.searchParams.get('size'));
  if (!validSizes.has(size)) {
    return json({ error: 'Invalid size' }, { status: 400 });
  }

  const scores = await getTopScores(size, 10);
  return json({ size, scores });
};

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.json();
  const size = Number(payload?.size);
  const moves = Number(payload?.moves);
  const seconds = Number(payload?.seconds ?? 0);

  if (
    !validSizes.has(size) ||
    !Number.isFinite(moves) ||
    moves < 1 ||
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return json({ error: 'Invalid payload' }, { status: 400 });
  }

  await addScore(size, moves, seconds, 10);
  const scores = await getTopScores(size, 10);
  return json({ size, scores });
};
