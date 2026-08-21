import { describe, it, expect } from "vitest";
import {
  transformEvidencePoint,
  transformEvidencePolygon,
  transformCellBbox,
} from "../src/evidence/evidence-geometry.js";

describe("transformEvidencePoint", () => {
  it("scales point proportionally", () => {
    const result = transformEvidencePoint(
      [100, 200],
      { width: 600, height: 800 },
      { width: 300, height: 400 },
    );
    expect(result).toEqual({ x: 50, y: 100 });
  });

  it("returns null for non-finite point", () => {
    expect(
      transformEvidencePoint(
        [NaN, 200],
        { width: 600, height: 800 },
        { width: 300, height: 400 },
      ),
    ).toBeNull();
  });

  it("returns null for zero canonical dimension", () => {
    expect(
      transformEvidencePoint(
        [100, 200],
        { width: 0, height: 800 },
        { width: 300, height: 400 },
      ),
    ).toBeNull();
  });

  it("returns null for zero rendered dimension", () => {
    expect(
      transformEvidencePoint(
        [100, 200],
        { width: 600, height: 800 },
        { width: 0, height: 400 },
      ),
    ).toBeNull();
  });
});

describe("transformEvidencePolygon", () => {
  it("transforms valid polygon", () => {
    const result = transformEvidencePolygon(
      [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ],
      { width: 200, height: 200 },
      { width: 100, height: 100 },
    );
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ]);
  });

  it("returns null for polygon with fewer than 3 points", () => {
    expect(
      transformEvidencePolygon(
        [
          [0, 0],
          [100, 0],
        ],
        { width: 200, height: 200 },
        { width: 100, height: 100 },
      ),
    ).toBeNull();
  });

  it("returns null if any point is invalid", () => {
    expect(
      transformEvidencePolygon(
        [
          [0, 0],
          [NaN, 0],
          [100, 100],
        ],
        { width: 200, height: 200 },
        { width: 100, height: 100 },
      ),
    ).toBeNull();
  });
});

describe("transformCellBbox", () => {
  it("transforms valid bbox", () => {
    const result = transformCellBbox(
      [10, 20, 50, 60],
      { width: 200, height: 200 },
      { width: 100, height: 100 },
    );
    expect(result).toEqual({ x: 5, y: 10, width: 25, height: 30 });
  });

  it("returns null for negative dimensions", () => {
    expect(
      transformCellBbox(
        [10, 20, -50, 60],
        { width: 200, height: 200 },
        { width: 100, height: 100 },
      ),
    ).toBeNull();
  });

  it("returns null for short bbox", () => {
    expect(
      transformCellBbox(
        [10, 20, 50],
        { width: 200, height: 200 },
        { width: 100, height: 100 },
      ),
    ).toBeNull();
  });
});
