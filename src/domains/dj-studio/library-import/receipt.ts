import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { ImportReceipt } from '@/domains/dj-studio/library-import/types'

const FORBIDDEN_RECEIPT_KEYS = [
  'password',
  'secret',
  'token',
  'databaseUrl',
  'DATABASE_URL',
  'apiKey',
  'path',
  'filename',
  'csv',
  'rawCsv',
] as const

export function assertReceiptSafe(receipt: ImportReceipt): void {
  const serialized = JSON.stringify(receipt)
  for (const key of FORBIDDEN_RECEIPT_KEYS) {
    if (serialized.includes(`"${key}"`)) {
      throw new Error(`Receipt contains forbidden key material: ${key}`)
    }
  }
  if (
    serialized.includes('/Users/') ||
    serialized.includes('C:\\\\') ||
    serialized.includes('file:')
  ) {
    throw new Error('Receipt appears to contain filesystem path material')
  }
}

export async function writeImportReceipt(
  receipt: ImportReceipt,
  receiptPath: string,
): Promise<string> {
  assertReceiptSafe(receipt)
  const absolute = path.resolve(receiptPath)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
  return absolute
}
