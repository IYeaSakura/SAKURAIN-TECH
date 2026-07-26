/**
 * Generate a simplified SVG path from the national China GeoJSON.
 *
 * The output is printed to stdout so it can be pasted into the travel map
 * component. Run manually when the source GeoJSON changes.
 */

import fs from 'fs';
import path from 'path';

const SRC = path.resolve('public/map-data/100000_full.json');

/**
 * Douglas-Peucker polyline simplification.
 * @param {number[][]} points - Array of [x, y] projected points.
 * @param {number} tolerance - Minimum deviation (in SVG units) to keep a point.
 */
function simplify(points, tolerance) {
  if (points.length <= 2) return points;

  const start = points[0];
  const end = points[points.length - 1];

  let maxDist = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplify(points.slice(0, index + 1), tolerance);
    const right = simplify(points.slice(index), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [start, end];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  if (x1 === x2 && y1 === y2) {
    return Math.hypot(x - x1, y - y1);
  }

  const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
  const denominator = Math.hypot(x2 - x1, y2 - y1);
  return numerator / denominator;
}

function project(lon, lat, bounds, width, height) {
  const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return [x, y];
}

function main() {
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));

  const allPoints = [];
  for (const feature of data.features) {
    const geom = feature.geometry;
    const polygons = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];
    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          allPoints.push([lon, lat]);
        }
      }
    }
  }

  const minLon = Math.min(...allPoints.map((p) => p[0]));
  const maxLon = Math.max(...allPoints.map((p) => p[0]));
  const minLat = Math.min(...allPoints.map((p) => p[1]));
  const maxLat = Math.max(...allPoints.map((p) => p[1]));

  const bounds = { minLon, maxLon, minLat, maxLat };
  const width = 1000;
  const height = 800;

  const tolerance = 3.5;
  let pathD = '';

  function ringBBoxArea(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of points) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return (maxX - minX) * (maxY - minY);
  }

  for (const feature of data.features) {
    const geom = feature.geometry;
    const polygons = geom.type === 'MultiPolygon' ? geom.coordinates : [geom.coordinates];

    for (const polygon of polygons) {
      for (const ring of polygon) {
        const projected = ring.map(([lon, lat]) => project(lon, lat, bounds, width, height));
        const simplified = simplify(projected, tolerance);
        if (simplified.length < 3) continue;
        if (ringBBoxArea(simplified) < 50) continue;

        // Remove duplicate consecutive points
        const cleaned = [simplified[0]];
        for (let i = 1; i < simplified.length; i++) {
          const prev = cleaned[cleaned.length - 1];
          const curr = simplified[i];
          if (Math.abs(curr[0] - prev[0]) > 0.05 || Math.abs(curr[1] - prev[1]) > 0.05) {
            cleaned.push(curr);
          }
        }
        if (cleaned.length < 3) continue;

        pathD += `M ${cleaned[0][0].toFixed(1)} ${cleaned[0][1].toFixed(1)}`;
        for (let i = 1; i < cleaned.length; i++) {
          pathD += ` L ${cleaned[i][0].toFixed(1)} ${cleaned[i][1].toFixed(1)}`;
        }
        pathD += ' Z ';
      }
    }
  }

  console.log(`viewBox="0 0 ${width} ${height}"`);
  console.log(`path length: ${pathD.length}`);
  console.log(pathD.trim());
}

main();
