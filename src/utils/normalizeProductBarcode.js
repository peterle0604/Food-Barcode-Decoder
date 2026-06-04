/** GS1 check digit for EAN-13, UPC-A (12 digit), and EAN-8. */
export function hasValidGs1CheckDigit(digits) {
  const len = digits.length
  if (len !== 8 && len !== 12 && len !== 13) return false

  let sum = 0
  for (let i = 0; i < len - 1; i++) {
    const weight =
      len === 8 ? (i % 2 === 0 ? 3 : 1) : (i % 2 === 0 ? 1 : 3)
    sum += Number(digits[i]) * weight
  }
  const expected = (10 - (sum % 10)) % 10
  return Number(digits[len - 1]) === expected
}

/**
 * Normalize manual entry to a retail barcode (8, 12, or 13 digits).
 * Check digit is not required — Open Food Facts is queried either way.
 */
export function normalizeProductBarcode(raw) {
  if (!raw || typeof raw !== 'string') return null

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 8 || digits.length === 12 || digits.length === 13) {
    return digits
  }

  return null
}

/** Barcode strings to try with Open Food Facts (EAN-13, UPC, and EAN-8 variants). */
export function getBarcodeLookupVariants(normalized) {
  if (!normalized) return []

  const variants = [normalized]

  if (normalized.length === 13 && normalized.startsWith('0')) {
    variants.push(normalized.slice(1))
  }

  if (normalized.length === 12) {
    variants.push(`0${normalized}`)
  }

  if (normalized.length === 8) {
    variants.push(normalized.padStart(13, '0'))
    variants.push(`0${normalized.padStart(12, '0')}`)
  }

  return [...new Set(variants)]
}
