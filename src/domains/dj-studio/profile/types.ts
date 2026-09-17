/**
 * DjStudioProfile contracts.
 *
 * Conceptual Domain extension of Core Profile (1:1 optional).
 * Persistence is out of scope for Phase 1 scaffold.
 *
 * ExperienceLevel remains owned by the Prisma schema until an authorized
 * Domain Profile migration relocates it. Do not invent a second enum here.
 */

export type DjStudioProfile = {
  profileId: string
  stageName: string | null
  /**
   * Domain-owned conceptually (ADR-011 / DJ-STUDIO-001).
   * Typed as string | null until schema work defines the single enum SoT.
   */
  experienceLevel: string | null
  createdAt: Date
  updatedAt: Date
}
