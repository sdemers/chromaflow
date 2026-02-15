export type Grid = number[][];

export function createGrid(size: number, colorCount: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => Math.floor(Math.random() * colorCount))
  );
}

export function indexOf(row: number, col: number, size: number): number {
  return row * size + col;
}

export function inBounds(row: number, col: number, size: number): boolean {
  return row >= 0 && row < size && col >= 0 && col < size;
}

export function neighbors(row: number, col: number, size: number): [number, number][] {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1]
  ].filter(([r, c]) => inBounds(r, c, size)) as [number, number][];
}

export function floodFill(
  grid: Grid,
  size: number,
  startRow: number,
  startCol: number,
  targetColor: number
): Set<number> {
  const filled = new Set<number>();
  const stack: Array<[number, number]> = [[startRow, startCol]];

  while (stack.length) {
    const [row, col] = stack.pop() as [number, number];
    const id = indexOf(row, col, size);
    if (filled.has(id)) continue;
    if (grid[row][col] !== targetColor) continue;
    filled.add(id);
    for (const [r, c] of neighbors(row, col, size)) {
      if (!filled.has(indexOf(r, c, size))) stack.push([r, c]);
    }
  }

  return filled;
}

export function isAdjacentToRegion(
  region: Set<number>,
  size: number,
  row: number,
  col: number
): boolean {
  for (const [r, c] of neighbors(row, col, size)) {
    if (region.has(indexOf(r, c, size))) return true;
  }
  return false;
}

export function recolorRegion(
  grid: Grid,
  size: number,
  region: Set<number>,
  newColor: number
): void {
  for (const id of region) {
    const row = Math.floor(id / size);
    const col = id % size;
    grid[row][col] = newColor;
  }
}

export function expandRegion(
  grid: Grid,
  size: number,
  region: Set<number>,
  newColor: number
): Set<number> {
  const expanded = new Set<number>(region);
  const stack = Array.from(region, (id) => [Math.floor(id / size), id % size] as [number, number]);

  while (stack.length) {
    const [row, col] = stack.pop() as [number, number];
    for (const [r, c] of neighbors(row, col, size)) {
      const id = indexOf(r, c, size);
      if (expanded.has(id)) continue;
      if (grid[r][c] !== newColor) continue;
      expanded.add(id);
      stack.push([r, c]);
    }
  }

  return expanded;
}

export function checkWin(grid: Grid, size: number): boolean {
  const firstColor = grid[0][0];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (grid[row][col] !== firstColor) return false;
    }
  }
  return true;
}
