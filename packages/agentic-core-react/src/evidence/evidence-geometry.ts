/**
 * Geometry helpers for evidence block overlays.
 * Adapted from frontend/lib/evidence-transform.ts — no external dependencies.
 */

export type EvidencePoint = readonly number[];
export type EvidenceBbox = readonly number[];

export interface EvidenceDimensions {
  width: number;
  height: number;
}

export interface RenderedEvidencePoint {
  x: number;
  y: number;
}

export interface RenderedEvidenceRect extends RenderedEvidencePoint {
  width: number;
  height: number;
}

function isUsableDimension(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isFinitePoint(point: EvidencePoint): boolean {
  return (
    point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1])
  );
}

/**
 * Transform a point from canonical PDF coordinates to rendered pixel coordinates.
 * Coordinates are already normalized to the page's displayed orientation by
 * the backend; applying rotation here would move evidence twice.
 */
export function transformEvidencePoint(
  point: EvidencePoint,
  canonical: EvidenceDimensions,
  rendered: EvidenceDimensions,
): RenderedEvidencePoint | null {
  if (
    !isFinitePoint(point) ||
    !isUsableDimension(canonical.width) ||
    !isUsableDimension(canonical.height) ||
    !isUsableDimension(rendered.width) ||
    !isUsableDimension(rendered.height)
  ) {
    return null;
  }

  return {
    x: point[0] * (rendered.width / canonical.width),
    y: point[1] * (rendered.height / canonical.height),
  };
}

/** Transform a polygon from canonical to rendered coordinates. */
export function transformEvidencePolygon(
  polygon: readonly EvidencePoint[],
  canonical: EvidenceDimensions,
  rendered: EvidenceDimensions,
): RenderedEvidencePoint[] | null {
  if (polygon.length < 3) return null;

  const transformed = polygon.map((point) =>
    transformEvidencePoint(point, canonical, rendered),
  );
  return transformed.every((point) => point !== null)
    ? (transformed as RenderedEvidencePoint[])
    : null;
}

/** Transform a bounding box [x, y, width, height] from canonical to rendered. */
export function transformCellBbox(
  bbox: EvidenceBbox,
  canonical: EvidenceDimensions,
  rendered: EvidenceDimensions,
): RenderedEvidenceRect | null {
  const [x, y, width, height] = bbox;
  if (
    bbox.length < 4 ||
    ![x, y, width, height].every(Number.isFinite) ||
    width < 0 ||
    height < 0
  ) {
    return null;
  }

  const origin = transformEvidencePoint([x, y], canonical, rendered);
  if (!origin) return null;

  return {
    ...origin,
    width: width * (rendered.width / canonical.width),
    height: height * (rendered.height / canonical.height),
  };
}
