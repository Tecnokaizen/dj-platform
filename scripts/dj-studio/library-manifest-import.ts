#!/usr/bin/env node
/**
 * Operator CLI for dj-studio-library-manifest.v1 import.
 *
 * Default mode: preview (zero writes).
 * Apply requires --apply semantics via subcommand + --confirm-target staging.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { prisma } from '@/lib/prisma'
import {
  LIBRARY_MANIFEST_VERSION,
  applyLibraryImportRollback,
  applyLibraryManifestImport,
  previewLibraryImportRollback,
  previewLibraryManifestImportWithPrisma,
  writeImportReceipt,
  type ImportReceipt,
} from '@/domains/dj-studio/library-import'

type Args = {
  command: 'preview' | 'apply' | 'rollback-preview' | 'rollback-apply'
  file?: string
  organization?: string
  profile?: string
  batch?: string
  confirmTarget?: string
  receipt?: string
  receiptOut?: string
}

function printUsage(): void {
  console.log(`Usage:
  npm run dj-studio:library-import -- preview --file <manifest.csv> --organization <uuid> --profile <uuid> --batch <id>
  npm run dj-studio:library-import -- apply --file <manifest.csv> --organization <uuid> --profile <uuid> --batch <id> --confirm-target staging [--receipt <path>]
  npm run dj-studio:library-import -- rollback-preview --organization <uuid> --profile <uuid> --receipt <path>
  npm run dj-studio:library-import -- rollback-apply --organization <uuid> --profile <uuid> --receipt <path> --confirm-target staging

Manifest version: ${LIBRARY_MANIFEST_VERSION}
Default mode is preview (zero database writes).
Production targets are refused.
`)
}

function parseArgs(argv: string[]): Args {
  const [command, ...rest] = argv
  if (
    command !== 'preview' &&
    command !== 'apply' &&
    command !== 'rollback-preview' &&
    command !== 'rollback-apply'
  ) {
    throw new Error('Command must be preview | apply | rollback-preview | rollback-apply')
  }

  const args: Args = { command }
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]
    const next = rest[i + 1]
    if (token === '--file' && next) {
      args.file = next
      i += 1
    } else if (token === '--organization' && next) {
      args.organization = next
      i += 1
    } else if (token === '--profile' && next) {
      args.profile = next
      i += 1
    } else if (token === '--batch' && next) {
      args.batch = next
      i += 1
    } else if (token === '--confirm-target' && next) {
      args.confirmTarget = next
      i += 1
    } else if (token === '--receipt' && next) {
      args.receipt = next
      i += 1
    } else if (token === '--help' || token === '-h') {
      printUsage()
      process.exit(0)
    } else {
      throw new Error(`Unknown or incomplete argument: ${token}`)
    }
  }
  return args
}

function requireArg(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required argument --${name}`)
  }
  return value
}

function summarizePreview(preview: {
  manifestHash: string
  batchId: string
  counts: Record<string, number>
  hasRejects: boolean
  rows: Array<{
    rowNumber: number
    externalSource: string
    externalId: string
    action: string
    warnings: Array<{ code: string }>
    rejectCode: string | null
    rejectMessage: string | null
  }>
}): void {
  console.log(
    JSON.stringify(
      {
        manifestVersion: LIBRARY_MANIFEST_VERSION,
        manifestHash: preview.manifestHash,
        batchId: preview.batchId,
        counts: preview.counts,
        hasRejects: preview.hasRejects,
        rows: preview.rows.map((row) => ({
          rowNumber: row.rowNumber,
          identity: `${row.externalSource}:${row.externalId}`,
          action: row.action,
          warnings: row.warnings.map((warning) => warning.code),
          rejectCode: row.rejectCode,
          rejectMessage: row.rejectMessage,
        })),
      },
      null,
      2,
    ),
  )
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  try {
    if (args.command === 'preview' || args.command === 'apply') {
      const file = requireArg(args.file, 'file')
      const organizationId = requireArg(args.organization, 'organization')
      const profileId = requireArg(args.profile, 'profile')
      const batchId = requireArg(args.batch, 'batch')
      const csv = await readFile(path.resolve(file))

      if (args.command === 'preview') {
        const preview = await previewLibraryManifestImportWithPrisma({
          prisma,
          csv,
          batchId,
          organizationId,
          profileId,
        })
        summarizePreview(preview)
        process.exitCode = preview.hasRejects ? 2 : 0
        return
      }

      const { preview, receipt } = await applyLibraryManifestImport({
        prisma,
        csv,
        batchId,
        organizationId,
        profileId,
        confirmTarget: args.confirmTarget,
      })

      const receiptPath =
        args.receipt ??
        path.join(
          'tmp',
          'dj-studio-import',
          'receipts',
          `${batchId}-${Date.now()}.json`,
        )
      const written = await writeImportReceipt(receipt, receiptPath)
      summarizePreview(preview)
      console.log(JSON.stringify({ receiptPath: written, receipt }, null, 2))
      return
    }

    const organizationId = requireArg(args.organization, 'organization')
    const profileId = requireArg(args.profile, 'profile')
    const receiptPath = requireArg(args.receipt, 'receipt')
    const receipt = JSON.parse(
      await readFile(path.resolve(receiptPath), 'utf8'),
    ) as ImportReceipt

    if (args.command === 'rollback-preview') {
      const preview = await previewLibraryImportRollback({
        prisma,
        organizationId,
        profileId,
        receipt,
      })
      console.log(JSON.stringify(preview, null, 2))
      return
    }

    const preview = await applyLibraryImportRollback({
      prisma,
      organizationId,
      profileId,
      receipt,
      confirmTarget: args.confirmTarget,
    })
    console.log(JSON.stringify({ rolledBack: true, preview }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exit(1)
})
