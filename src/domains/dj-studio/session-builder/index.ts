/**
 * Session Builder Domain surface (DJ-STUDIO-002).
 *
 * P1 exposes musical-rules only. Candidate engine / provider / UI arrive later.
 */

export {
  BPM_TOLERANCE_BPM,
  analyzeBpmProgression,
  compareCamelot,
  effectiveBpm,
  effectiveCamelotKey,
  evaluateBpmFit,
  evaluateBpmTransition,
  getTargetBpmAtPosition,
  parseCamelotKey,
  sumKnownDurations,
  type BpmDirection,
  type BpmFitResult,
  type BpmFitSeverity,
  type BpmProgressionAnalysis,
  type BpmProgressionShape,
  type BpmTransitionResult,
  type CamelotCompatibility,
  type CamelotKey,
  type CamelotLetter,
  type DurationAggregation,
  type DurationAggregationMode,
} from '@/domains/dj-studio/session-builder/musical-rules'
