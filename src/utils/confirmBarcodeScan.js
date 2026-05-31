import { normalizeProductBarcode } from './normalizeProductBarcode.js'

/**
 * Require the same valid product barcode several times in a row
 * before accepting (reduces misreads from glare / wrong symbology).
 */
export function createConfirmedBarcodeHandler(onCode, requiredMatches = 3) {
  let lastCode = null
  let matchCount = 0

  return (raw) => {
    const normalized = normalizeProductBarcode(raw)
    if (!normalized) {
      lastCode = null
      matchCount = 0
      return
    }

    if (normalized === lastCode) {
      matchCount += 1
      if (matchCount >= requiredMatches) {
        lastCode = null
        matchCount = 0
        onCode(normalized)
      }
    } else {
      lastCode = normalized
      matchCount = 1
    }
  }
}
