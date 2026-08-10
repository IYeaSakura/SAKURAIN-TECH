'use client';

/**
 * Mascot environment helpers — query DOM for interactive zones.
 *
 * Any element can declare data-mascot-zone with one or more space-separated
 * values:
 * - obstacle: SAKU-CHAN will not walk inside this rectangle.
 * - cover:    SAKU-CHAN can hide behind this rectangle (lower z-index).
 * - ledge:    SAKU-CHAN can lie on the top edge of this rectangle.
 *
 * If a page contains a <main> element without an explicit zone, it is treated
 * as a soft obstacle so the pet prefers margins and does not cover text.
 */

export type MascotZoneType = 'obstacle' | 'cover' | 'ledge';

export interface MascotZone {
  type: MascotZoneType;
  rect: DOMRectReadOnly;
}

export interface RoamTarget {
  x: number;
  y: number;
  behind: boolean;
  ledge: boolean;
}

const SIZE = 64;
const MARGIN = 24;
const VALID_TYPES: MascotZoneType[] = ['obstacle', 'cover', 'ledge'];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function isInsideRect(rect: DOMRectReadOnly, x: number, y: number, padding = 0) {
  return (
    x >= rect.left - padding &&
    x + SIZE <= rect.right + padding &&
    y >= rect.top - padding &&
    y + SIZE <= rect.bottom + padding
  );
}

export function getMascotZones(): MascotZone[] {
  if (typeof document === 'undefined') return [];

  const zones: MascotZone[] = [];

  document.querySelectorAll('[data-mascot-zone]').forEach((el) => {
    const raw = el.getAttribute('data-mascot-zone') ?? '';
    const types = raw
      .split(/\s+/)
      .filter((token): token is MascotZoneType => VALID_TYPES.includes(token as MascotZoneType));

    if (types.length === 0) return;

    const rect = el.getBoundingClientRect();
    types.forEach((type) => zones.push({ type, rect }));
  });

  const main = document.querySelector('main');
  if (main && !main.hasAttribute('data-mascot-zone')) {
    const rect = main.getBoundingClientRect();
    zones.push({ type: 'obstacle', rect });
  }

  return zones;
}

function pickLedgeTarget(ledges: MascotZone[]): RoamTarget | null {
  const ledge = ledges[Math.floor(Math.random() * ledges.length)];
  return {
    x: ledge.rect.left + ledge.rect.width / 2 - SIZE / 2,
    y: ledge.rect.top - SIZE / 2,
    behind: false,
    ledge: true,
  };
}

function pickCoverEdgeTarget(
  covers: MascotZone[],
  obstacles: MascotZone[],
  width: number,
  height: number
): RoamTarget | null {
  const cover = covers[Math.floor(Math.random() * covers.length)];
  const side = Math.random() < 0.5 ? 'left' : 'right';

  const x =
    side === 'left'
      ? cover.rect.left - SIZE + 14
      : cover.rect.right - 14;

  const y = randomBetween(
    cover.rect.top,
    Math.max(cover.rect.top, cover.rect.bottom - SIZE)
  );

  if (
    x < MARGIN ||
    x > width - SIZE - MARGIN ||
    y < MARGIN ||
    y > height - SIZE - MARGIN
  ) {
    return null;
  }

  if (obstacles.some((z) => isInsideRect(z.rect, x, y, -8))) return null;

  return { x, y, behind: true, ledge: false };
}

function pickEdgeTarget(
  currentX: number,
  currentY: number,
  width: number,
  height: number,
  restricted: MascotZone[]
): RoamTarget | null {
  const edges = ['top', 'bottom', 'left', 'right'] as const;
  const edge = edges[Math.floor(Math.random() * edges.length)];

  let tx = 0;
  let ty = 0;

  switch (edge) {
    case 'top':
      tx = randomBetween(MARGIN, width - SIZE - MARGIN);
      ty = MARGIN;
      break;
    case 'bottom':
      tx = randomBetween(MARGIN, width - SIZE - MARGIN);
      ty = height - SIZE - MARGIN;
      break;
    case 'left':
      tx = MARGIN;
      ty = randomBetween(MARGIN, height - SIZE - MARGIN);
      break;
    case 'right':
      tx = width - SIZE - MARGIN;
      ty = randomBetween(MARGIN, height - SIZE - MARGIN);
      break;
  }

  if (restricted.some((z) => isInsideRect(z.rect, tx, ty, -8))) return null;

  const tooClose = Math.hypot(tx - currentX, ty - currentY) < 80;
  if (tooClose) return null;

  return { x: tx, y: ty, behind: false, ledge: false };
}

function pickFreeTarget(
  currentX: number,
  currentY: number,
  width: number,
  height: number,
  restricted: MascotZone[]
): RoamTarget | null {
  let attempts = 0;
  while (attempts < 40) {
    attempts += 1;

    const tx = randomBetween(MARGIN, width - SIZE - MARGIN);
    const ty = randomBetween(MARGIN, height - SIZE - MARGIN);

    if (restricted.some((z) => isInsideRect(z.rect, tx, ty, -8))) continue;

    const tooClose = Math.hypot(tx - currentX, ty - currentY) < 80;
    if (tooClose) continue;

    return { x: tx, y: ty, behind: false, ledge: false };
  }
  return null;
}

/**
 * Pick a target point for autonomous roaming.
 *
 * The pet prefers to patrol viewport edges, but occasionally snaps to a
 * ledge, peeks from behind a cover zone, or explores a random free area.
 */
export function pickRoamTarget(
  currentX: number,
  currentY: number,
  width: number,
  height: number
): RoamTarget {
  const zones = getMascotZones();
  const obstacles = zones.filter((z) => z.type === 'obstacle');
  const covers = zones.filter((z) => z.type === 'cover');
  const ledges = zones.filter((z) => z.type === 'ledge');

  const hasLedge = ledges.length > 0;
  const hasCover = covers.length > 0;

  // Weighted strategy: patrol > cover peek > ledge > free explore.
  const patrolWeight = 1;
  const coverWeight = hasCover ? 0.35 : 0;
  const ledgeWeight = hasLedge ? 0.25 : 0;
  const totalWeight = patrolWeight + coverWeight + ledgeWeight;
  const roll = Math.random() * totalWeight;

  let cursor = 0;

  if (hasLedge) {
    cursor += ledgeWeight;
    if (roll < cursor) {
      const target = pickLedgeTarget(ledges);
      if (target) return target;
    }
  }

  if (hasCover) {
    cursor += coverWeight;
    if (roll < cursor) {
      const target = pickCoverEdgeTarget(covers, obstacles, width, height);
      if (target) return target;
    }
  }

  const restricted = [...obstacles, ...covers];

  const edgeTarget = pickEdgeTarget(currentX, currentY, width, height, restricted);
  if (edgeTarget) return edgeTarget;

  const freeTarget = pickFreeTarget(currentX, currentY, width, height, restricted);
  if (freeTarget) return freeTarget;

  // Fallback: stay close to the current position.
  return {
    x: clamp(currentX, MARGIN, width - SIZE - MARGIN),
    y: clamp(currentY, MARGIN, height - SIZE - MARGIN),
    behind: false,
    ledge: false,
  };
}
