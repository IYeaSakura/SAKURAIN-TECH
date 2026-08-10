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

/**
 * Pick a random target point for autonomous roaming.
 * Targets respect obstacle zones and can optionally snap to ledges or hide
 * behind cover zones.
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

  // 15% chance to lie on a ledge.
  if (ledges.length > 0 && Math.random() < 0.15) {
    const ledge = ledges[Math.floor(Math.random() * ledges.length)];
    return {
      x: ledge.rect.left + ledge.rect.width / 2 - SIZE / 2,
      y: ledge.rect.top - SIZE / 2,
      behind: false,
      ledge: true,
    };
  }

  // 20% chance to hide behind a cover zone.
  const wantsBehind = covers.length > 0 && Math.random() < 0.2;
  const restricted = wantsBehind ? obstacles : [...obstacles, ...covers];

  let attempts = 0;
  while (attempts < 40) {
    attempts += 1;

    const tx = randomBetween(MARGIN, width - SIZE - MARGIN);
    const ty = randomBetween(MARGIN, height - SIZE - MARGIN);

    const insideRestricted = restricted.some((z) => isInsideRect(z.rect, tx, ty, -8));
    if (insideRestricted) continue;

    const tooClose = Math.hypot(tx - currentX, ty - currentY) < 80;
    if (tooClose) continue;

    return { x: tx, y: ty, behind: wantsBehind, ledge: false };
  }

  // Fallback: stay close to the current position.
  return {
    x: clamp(currentX, MARGIN, width - SIZE - MARGIN),
    y: clamp(currentY, MARGIN, height - SIZE - MARGIN),
    behind: false,
    ledge: false,
  };
}
