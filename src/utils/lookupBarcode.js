import {
  getBarcodeLookupVariants,
  normalizeProductBarcode,
} from './normalizeProductBarcode.js'

const OFF_API = 'https://world.openfoodfacts.org/api/v0/product'

export async function lookupBarcode(barcode) {
  try {
    const response = await fetch(`${OFF_API}/${encodeURIComponent(barcode)}.json`)
    const data = await response.json()

    if (data.status === 0 || data.product == null) {
      return null
    }

    return data.product
  } catch {
    throw new Error('Could not reach Open Food Facts. Check your connection.')
  }
}

/** Lookup using normalized barcode and common UPC/EAN alternate forms. */
export async function lookupProductBarcode(rawOrNormalized) {
  const normalized =
    typeof rawOrNormalized === 'string' &&
    /^\d{8,13}$/.test(rawOrNormalized)
      ? rawOrNormalized
      : normalizeProductBarcode(rawOrNormalized)

  if (!normalized) return null

  const variants = getBarcodeLookupVariants(normalized)
  for (const code of variants) {
    const product = await lookupBarcode(code)
    if (product) {
      return { product, barcode: code }
    }
  }

  return null
}
