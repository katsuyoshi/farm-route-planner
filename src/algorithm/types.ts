/** GeoJSON convention: [longitude, latitude] */
export type Position = [number, number];

export interface FieldPolygon {
  /** Outer ring coordinates (closed: first === last) */
  coordinates: Position[];
  /** Entry/exit point (e.g. ramp/slope location) */
  entryPoint?: Position;
}

/** Angle selection mode */
export type AngleMode = "auto" | "east-west" | "north-south" | "manual";

export interface PlannerConfig {
  /** Working width of machinery in meters */
  workingWidth: number;
  /** Number of headland (perimeter) laps */
  headlandLaps: number;
  /** Angle step in degrees for optimization search */
  angleStep: number;
  /** Overlap ratio between passes (0.0 - 0.5) */
  overlapRatio: number;
  /** Angle selection mode */
  angleMode: AngleMode;
  /** Manual sweep angle in degrees (used when angleMode is "manual") */
  manualAngle: number;
}

export interface Swath {
  start: Position;
  end: Position;
}

export interface RouteResult {
  /** Ordered list of coordinates forming the complete path */
  path: Position[];
  /** Total travel distance in meters */
  totalDistance: number;
  /** Interior (boustrophedon) distance in meters */
  interiorDistance: number;
  /** Headland (perimeter laps) distance in meters */
  headlandDistance: number;
  /** Number of interior passes (parallel lines) */
  passCount: number;
  /** Optimal angle in degrees */
  optimalAngle: number;
  /** Total number of turns */
  turnCount: number;
  /** Individual swaths for visualization */
  swaths: Swath[];
  /** Headland path positions (for separate visualization) */
  headlandPath: Position[];
  /** Number of positions in each headland lap (for separating laps from transits) */
  headlandLapSizes: number[];
  /** Entry/exit point used */
  entryPoint?: Position;
}

export interface SavedField {
  id: string;
  name: string;
  polygon: FieldPolygon;
  config: PlannerConfig;
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_CONFIG: PlannerConfig = {
  workingWidth: 1.5,
  headlandLaps: 3,
  angleStep: 5,
  overlapRatio: 0.1,
  angleMode: "auto",
  manualAngle: 0,
};
