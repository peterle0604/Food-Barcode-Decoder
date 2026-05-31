/** GS1 check digit for EAN-13, UPC-A (12 digit), and EAN-8. */
function hasValidGs1CheckDigit(digits) {
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
 * Normalize a raw scan to a retail product barcode (8, 12, or 13 digits).
 * Returns null if the value is not a valid product barcode.
 */
export function normalizeProductBarcode(raw) {
  if (!raw || typeof raw !== 'string') return null

  const digits = raw.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 13) return null

  if (digits.length === 13 && hasValidGs1CheckDigit(digits)) {
    return digits
  }

  if (digits.length === 12 && hasValidGs1CheckDigit(digits)) {
    return `0${digits}`
  }

  if (digits.length === 8 && hasValidGs1CheckDigit(digits)) {
    return digits
  }

  return null
}

/** Barcode strings to try with Open Food Facts (EAN-13 and UPC variants). */
export function getBarcodeLookupVariants(normalized) {
  if (!normalized) return []

  const variants = [normalized]
  if (normalized.length === 13 && normalized.startsWith('0')) {
    variants.push(normalized.slice(1))
  }
  if (normalized.length === 12) {
    variants.push(`0${normalized}`)
  }

  return [...new Set(variants)]
}
