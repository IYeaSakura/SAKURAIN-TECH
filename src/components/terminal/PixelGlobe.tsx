/**
 * Pixel-art Earth rendered on a <canvas>.
 *
 * Loads a high-resolution land mask from Natural Earth's 1:110m land vector
 * data and renders the globe in grayscale. Each canvas pixel is a rotated
 * surface sample, scaled up with CSS pixelation for a retro look.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { TerminalDanmaku } from './types';

interface PixelGlobeProps {
  danmakus: TerminalDanmaku[];
  selectedId?: string;
}

interface Ring {
  coords: Array<[number, number]>;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const MAP_WIDTH = 360;
const MAP_HEIGHT = 180;

function pointInRing(lat: number, lon: number, ring: Ring): boolean {
  if (lat < ring.minLat || lat > ring.maxLat || lon < ring.minLon || lon > ring.maxLon) {
    return false;
  }

  let inside = false;
  const coords = ring.coords;
  const centerLon = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
  const shift = Math.round((centerLon - lon) / 360) * 360;
  const adjustedLon = lon + shift;

  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [yi, xi] = coords[i];
    const [yj, xj] = coords[j];
    const xjAdj = xj + shift;
    const xiAdj = xi + shift;

    const intersects =
      yi > lat !== yj > lat &&
      adjustedLon < ((xjAdj - xiAdj) * (lat - yi)) / (yj - yi + 1e-12) + xiAdj;
    if (intersects) inside = !inside;
  }
  return inside;
}

function normalizeLongitude(lon: number): number {
  let v = lon % 360;
  if (v > 180) v -= 360;
  if (v <= -180) v += 360;
  return v;
}

function extractRings(geojson: unknown): Ring[] {
  const rings: Ring[] = [];
  const features = (geojson as { features?: Array<unknown> }).features ?? [];

  for (const feature of features) {
    const geom = (feature as { geometry?: { type?: string; coordinates?: unknown } }).geometry;
    if (!geom) continue;

    const collect = (polygon: Array<Array<[number, number]>>) => {
      for (const rawRing of polygon) {
        const coords: Array<[number, number]> = rawRing.map((p) => [p[1], normalizeLongitude(p[0])]);
        const lats = coords.map((c) => c[0]);
        const lons = coords.map((c) => c[1]);
        rings.push({
          coords,
          minLat: Math.min(...lats),
          maxLat: Math.max(...lats),
          minLon: Math.min(...lons),
          maxLon: Math.max(...lons),
        });
      }
    };

    if (geom.type === 'Polygon') {
      collect(geom.coordinates as Array<Array<[number, number]>>);
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates as Array<Array<Array<[number, number]>>>) {
        collect(polygon);
      }
    }
  }

  return rings;
}

async function buildLandMap(): Promise<boolean[]> {
  const res = await fetch('/map-data/ne_110m_land.geojson');
  if (!res.ok) throw new Error('Failed to load land mask');
  const geojson = (await res.json()) as unknown;
  const rings = extractRings(geojson);

  const map = new Array(MAP_WIDTH * MAP_HEIGHT).fill(false);

  for (let y = 0; y < MAP_HEIGHT; y += 1) {
    const lat = 90 - (y * 180) / (MAP_HEIGHT - 1);
    for (let x = 0; x < MAP_WIDTH; x += 1) {
      const lon = -180 + (x * 360) / (MAP_WIDTH - 1);
      for (const ring of rings) {
        if (pointInRing(lat, lon, ring)) {
          map[y * MAP_WIDTH + x] = true;
          break;
        }
      }
    }
  }

  return map;
}

function isLand(lat: number, lon: number, map: boolean[]): boolean {
  const y = Math.min(MAP_HEIGHT - 1, Math.max(0, Math.floor((90 - lat) * (MAP_HEIGHT - 1) / 180)));
  const x = Math.min(MAP_WIDTH - 1, Math.max(0, Math.floor((lon + 180) * (MAP_WIDTH - 1) / 360)));
  return map[y * MAP_WIDTH + x];
}

interface GlobeSize {
  w: number;
  h: number;
  r: number;
  cx: number;
  cy: number;
}

function drawPixelGlobe(
  ctx: CanvasRenderingContext2D,
  size: GlobeSize,
  rotation: number,
  danmakus: TerminalDanmaku[],
  landMap: boolean[],
  selectedId?: string
) {
  const { w, h, r, cx, cy } = size;
  const image = ctx.createImageData(w, h);
  const data = image.data;
  const r2 = r * r;

  const light = { x: 0.5, y: -0.5, z: -1 };
  const lightLen = Math.sqrt(light.x * light.x + light.y * light.y + light.z * light.z);
  const lx = light.x / lightLen;
  const ly = light.y / lightLen;
  const lz = light.z / lightLen;

  const cosR = Math.cos(-rotation);
  const sinR = Math.sin(-rotation);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      const idx = (y * w + x) * 4;

      if (d2 > r2) {
        data[idx + 3] = 0;
        continue;
      }

      const z = Math.sqrt(r2 - d2);
      const nx = dx / r;
      const ny = dy / r;
      const nz = z / r;

      // Rotate the surface sample in the opposite direction so the texture
      // appears to spin with the requested rotation.
      const tx = nx * cosR - nz * sinR;
      const tz = nx * sinR + nz * cosR;
      const ty = ny;

      // Invert latitude so the north pole appears at the top of the screen.
      const lat = -Math.asin(ty) * (180 / Math.PI);
      const lon = Math.atan2(tz, tx) * (180 / Math.PI);
      const land = isLand(lat, lon, landMap);

      const dot = Math.max(0, nx * lx + ny * ly + nz * lz);
      const shade = 0.25 + 0.75 * dot;

      // Grayscale palette: lighter for land, darker for ocean.
      const value = land ? Math.floor(180 * shade) : Math.floor(25 * shade);
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }

  // Project orbiting satellites onto the near side of the globe.
  // Each satellite travels in its own inclined orbital plane (RAAN + inclination)
  // at a radius scaled from its altitude so the paths wrap around the planet.
  // The RAAN is adjusted by the current Earth rotation so the orbital plane
  // appears fixed relative to the spinning globe, making satellites follow the
  // planet's rotation.
  const now = Date.now() / 1000;
  const satellites = danmakus.slice(0, 20);

  for (const dm of satellites) {
    const orbitR = r + 1.5 + ((dm.altitude ?? 400000) / 60000000) * 3;
    const angle = (dm.angle ?? 0) + (dm.speed ?? 0.5) * now;
    const inc = dm.inclination ?? 0;
    const raan = (dm.raan ?? 0) - rotation;

    // Orbital plane coordinates: x right, y down, z toward viewer.
    const ox = orbitR * Math.cos(angle);
    const oy = orbitR * Math.sin(angle);

    // Apply inclination (rotation around the x-axis).
    const iy = oy * Math.cos(inc);
    const iz = oy * Math.sin(inc);

    // Apply RAAN (rotation around the y-axis).
    const sx3 = ox * Math.cos(raan) + iz * Math.sin(raan);
    const sz3 = -ox * Math.sin(raan) + iz * Math.cos(raan);

    // Only render satellites on the near hemisphere.
    if (sz3 <= 0) continue;

    const sx = Math.floor(cx + sx3);
    const sy = Math.floor(cy + iy);

    if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
      const isSelected = selectedId && dm.id === selectedId;
      const color = isSelected ? { r: 255, g: 42, b: 109 } : { r: 255, g: 255, b: 255 };

      if (isSelected) {
        // Draw a 3x3 marker for the selected satellite so it stands out.
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const mx = sx + dx;
            const my = sy + dy;
            if (mx >= 0 && mx < w && my >= 0 && my < h) {
              const sIdx = (my * w + mx) * 4;
              data[sIdx] = color.r;
              data[sIdx + 1] = color.g;
              data[sIdx + 2] = color.b;
              data[sIdx + 3] = 255;
            }
          }
        }
      } else {
        const sIdx = (sy * w + sx) * 4;
        data[sIdx] = color.r;
        data[sIdx + 1] = color.g;
        data[sIdx + 2] = color.b;
        data[sIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function PixelGlobe({ danmakus, selectedId }: PixelGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef<GlobeSize>({ w: 0, h: 0, r: 0, cx: 0, cy: 0 });
  const frameIdRef = useRef<number>(0);
  const [landMap, setLandMap] = useState<boolean[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    buildLandMap()
      .then((map) => {
        if (!cancelled) setLandMap(map);
      })
      .catch(() => {
        // Keep rendering with an empty ocean if the land mask fails to load.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !landMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      // Pick a pixel size that keeps the logical resolution around 120-160 px
      // wide so the globe looks pixelated without becoming too blocky.
      const pixelSize = Math.max(3, Math.floor(cssW / 140));
      const logicalW = Math.max(30, Math.floor(cssW / pixelSize));
      const logicalH = Math.max(30, Math.floor(cssH / pixelSize));

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = logicalW;
      canvas.height = logicalH;

      const r = Math.floor(Math.min(logicalW, logicalH) / 2) - 1;
      sizeRef.current = {
        w: logicalW,
        h: logicalH,
        r,
        cx: logicalW / 2,
        cy: logicalH / 2,
      };
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener('resize', resize);

    const tick = (now: number) => {
      const rotation = (now / 2000) % (Math.PI * 2);
      drawPixelGlobe(ctx, sizeRef.current, rotation, danmakus, landMap, selectedId);
      frameIdRef.current = requestAnimationFrame(tick);
    };
    frameIdRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [danmakus, landMap, selectedId]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
