import React from 'react';

/**
 * Icons in this app are drawn on a character grid instead of with SVG curves.
 *
 * The old icon set was rounded-stroke line art: it fought the pixel theme at
 * every size, and a few of the paths were plain garbage (the "flame" was a
 * mangled sun). Drawing on a grid means every mark lands on a whole cell, so
 * `crispEdges` keeps the staircase edges sharp at any scale instead of
 * anti-aliasing them into mush.
 *
 * Grid syntax: '.' or ' ' is empty, any other character is a filled cell.
 * 'x' (and any character with no palette entry) paints with `currentColor`, so
 * the icon still follows text color; other characters take a fixed hex from the
 * palette, for icons that are genuinely multi-colored art (flame, coin, heart).
 */
export const pixelIcon = (
  rows: string[],
  palette: Record<string, string> = {},
): React.FC<React.SVGProps<SVGSVGElement>> => {
  const width = Math.max(...rows.map(r => r.length));
  const height = rows.length;

  // Collapse each horizontal run of identical cells into a single <rect>, so a
  // 16×16 icon costs a handful of nodes rather than 256.
  const runs: { x: number; y: number; w: number; fill: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const cell = row[x];
      if (cell === '.' || cell === ' ') {
        x += 1;
        continue;
      }
      let end = x;
      while (end + 1 < row.length && row[end + 1] === cell) end += 1;
      runs.push({ x, y, w: end - x + 1, fill: palette[cell] ?? 'currentColor' });
      x = end + 1;
    }
  });

  const Icon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      {...props}
    >
      {runs.map((run, i) => (
        <rect key={i} x={run.x} y={run.y} width={run.w} height={1} fill={run.fill} />
      ))}
    </svg>
  );

  return Icon;
};
