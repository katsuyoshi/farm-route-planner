import type { Position, Swath } from "./types";
import { distSq } from "./geometry";

/**
 * Connect swath segments into a continuous boustrophedon (back-and-forth) path.
 *
 * For each sweep line, swaths are ordered by proximity to the current position.
 * Direction alternates between lines to create the serpentine pattern.
 */
export function connectSwaths(
  swathsByLine: Swath[][],
  entryPoint?: Position,
): Position[] {
  const path: Position[] = [];
  let currentEnd: Position | null = entryPoint ?? null;
  let reverseDirection = false;

  for (const lineSwaths of swathsByLine) {
    if (lineSwaths.length === 0) continue;

    // Copy and potentially reorder segments within this line
    let segments = [...lineSwaths];

    if (reverseDirection) {
      segments.reverse();
      segments = segments.map((s) => ({ start: s.end, end: s.start }));
    }

    // If we have a current position, order segments by proximity
    if (currentEnd !== null && segments.length > 1) {
      segments = orderByProximity(segments, currentEnd);
    }

    for (const segment of segments) {
      // Choose direction: connect nearest end to current position
      let start = segment.start;
      let end = segment.end;

      if (currentEnd !== null) {
        const distToStart = distSq(currentEnd, start);
        const distToEnd = distSq(currentEnd, end);
        if (distToEnd < distToStart) {
          [start, end] = [end, start];
        }
        // Add the turn (connection from previous swath end to this swath start)
        path.push(start);
      } else {
        path.push(start);
      }

      path.push(end);
      currentEnd = end;
    }

    reverseDirection = !reverseDirection;
  }

  return path;
}

/**
 * Order segments by greedy nearest-neighbor from the current position.
 */
function orderByProximity(segments: Swath[], from: Position): Swath[] {
  const remaining = [...segments];
  const ordered: Swath[] = [];
  let current = from;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d1 = distSq(current, remaining[i].start);
      const d2 = distSq(current, remaining[i].end);
      const d = Math.min(d1, d2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const chosen = remaining.splice(bestIdx, 1)[0];
    // Flip segment if end is closer
    if (distSq(current, chosen.end) < distSq(current, chosen.start)) {
      ordered.push({ start: chosen.end, end: chosen.start });
      current = chosen.start;
    } else {
      ordered.push(chosen);
      current = chosen.end;
    }
  }

  return ordered;
}
