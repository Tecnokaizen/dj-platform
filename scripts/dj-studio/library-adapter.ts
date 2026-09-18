#!/usr/bin/env node
/**
 * Operator CLI: vendor CSV adapters → dj-studio-library-manifest.v1.csv
 *
 * Pure local file transformation. No DATABASE_URL. No Domain writes.
 *
 * Mixed In Key is an OPTIONAL personal-pilot enrichment source.
 * Commercial DJ Studio does NOT require MIK / Engine / Rekordbox / Serato.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  ENGINE_MIK_ADAPTER_ID,
  ENGINE_MIK_EXTERNAL_SOURCE,
  convertEngineMikToManifest,
  formatAdapterReport,
} from '@/domains/dj-studio/library-adapters/engine-mik'

type Args = {
  adapter: string
  engine?: string
  mik?: string
  batch?: string
  out?: string
  tags?: string
}

function printUsage(): void {
  console.log(`Usage:
  npm run dj-studio:library-adapter -- engine-mik \\
    --engine <engine.csv> \\
    --mik <mik.csv> \\
    --batch <batch-id> \\
    --out <manifest.csv> \\
    [--tags "Latin House|Afro House"]

Adapter: ${ENGINE_MIK_ADAPTER_ID}
external_source: ${ENGINE_MIK_EXTERNAL_SOURCE}

No database required. Strict gate: ambiguous/rejected → non-zero exit, no apply-ready manifest.
`)
}

function parseArgs(argv: string[]): Args {
  const [adapter, ...rest] = argv
  if (!adapter || adapter === '--help' || adapter === '-h') {
    printUsage()
    process.exit(adapter ? 0 : 1)
  }

  const args: Args = { adapter }
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]
    const next = rest[i + 1]
    if (token === '--engine' && next) {
      args.engine = next
      i += 1
    } else if (token === '--mik' && next) {
      args.mik = next
      i += 1
    } else if (token === '--batch' && next) {
      args.batch = next
      i += 1
    } else if (token === '--out' && next) {
      args.out = next
      i += 1
    } else if (token === '--tags' && next) {
      args.tags = next
      i += 1
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (args.adapter !== ENGINE_MIK_ADAPTER_ID && args.adapter !== 'engine-mik') {
    throw new Error(`Unsupported adapter: ${args.adapter}`)
  }

  const enginePath = requireArg(args.engine, 'engine')
  const mikPath = requireArg(args.mik, 'mik')
  const batchId = requireArg(args.batch, 'batch')
  const outPath = requireArg(args.out, 'out')

  const engineCsv = await readFile(path.resolve(enginePath))
  const mikCsv = await readFile(path.resolve(mikPath))

  const result = convertEngineMikToManifest({
    engineCsv,
    mikCsv,
    batchId,
    operatorTags: args.tags,
  })

  const report = formatAdapterReport(result)
  console.log(JSON.stringify(report, null, 2))

  if (!result.applyReady || !result.manifestCsv) {
    console.error(
      'Adapter generation refused: ambiguous or rejected rows present. Fix inputs before P2 apply.',
    )
    process.exitCode = 2
    return
  }

  const absoluteOut = path.resolve(outPath)
  await mkdir(path.dirname(absoluteOut), { recursive: true })
  await writeFile(absoluteOut, result.manifestCsv, 'utf8')
  console.log(
    JSON.stringify(
      {
        written: true,
        // Basename only — never echo operator absolute paths in summary
        outBasename: path.basename(absoluteOut),
        manifestRows: result.manifestRows,
        externalSource: ENGINE_MIK_EXTERNAL_SOURCE,
      },
      null,
      2,
    ),
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  printUsage()
  process.exit(1)
})
