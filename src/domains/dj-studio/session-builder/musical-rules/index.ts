/**
 * DJ Studio session-builder musical rules (P1).
 *
 * Pure, deterministic helpers. No Prisma / network / env.
 * Energy product scale is not normalized here — relative scoring belongs to P2.
 */

export {
  BPM_TOLERANCE_BPM,
  effectiveBpm,
  evaluateBpmFit,
  evaluateBpmTransition,
  getTargetBpmAtPosition,
  type BpmDirection,
  type BpmFitResult,
  type BpmFitSeverity,
  type BpmTransitionResult,
} from './bpm'

export {
  compareCamelot,
  effectiveCamelotKey,
  parseCamelotKey,
  type CamelotCompatibility,
  type CamelotKey,
  type CamelotLetter,
} from './camelot'

export {
  analyzeBpmProgression,
  sumKnownDurations,
  type BpmProgressionAnalysis,
  type BpmProgressionShape,
  type DurationAggregation,
  type DurationAggregationMode,
} from './sequence'
