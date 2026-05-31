const SEED_OILS = [
  'canola oil',
  'soybean oil',
  'sunflower oil',
  'safflower oil',
  'cottonseed oil',
  'corn oil',
  'vegetable oil',
  'rapeseed oil',
]

const ADDITIVE_TAG_MAP = {
  'en:e407': 'Carrageenan (E407)',
  'en:e471': 'Mono- and diglycerides (E471)',
  'en:e472': 'Mono- and diglycerides (E472)',
  'en:e433': 'Polysorbate 80 (E433)',
  'en:e466': 'Carboxymethyl cellulose (E466)',
  'en:e415': 'Xanthan gum (E415)',
  'en:e412': 'Guar gum (E412)',
  'en:e410': 'Locust bean gum (E410)',
}

const ULTRA_PROCESSED_SUBSTRINGS = [
  'carrageenan',
  'tbhq',
  'bha',
  'bht',
  'xanthan gum',
  'guar gum',
  'locust bean gum',
  'soy lecithin',
  'mono and diglycerides',
  'artificial flavor',
  'natural flavor',
  'modified starch',
]

const HIDDEN_SUGARS = [
  'dextrose',
  'maltose',
  'corn syrup',
  'high fructose corn syrup',
  'evaporated cane juice',
  'cane sugar',
  'rice syrup',
  'agave',
  'fruit juice concentrate',
  'maltodextrin',
]

function isPlainText(input) {
  return typeof input === 'string'
}

function getNovaLabel(novaGroup) {
  switch (novaGroup) {
    case 1:
      return 'NOVA group 1 (minimally processed)'
    case 2:
      return 'NOVA group 2 (processed culinary ingredients)'
    case 3:
      return 'NOVA group 3 (processed food)'
    case 4:
      return 'NOVA group 4 (ultra-processed)'
    default:
      return 'an unclassified processing level'
  }
}

function capitalizeItem(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function extractProductData(input) {
  if (isPlainText(input)) {
    return {
      ingredientsText: input,
      additivesTags: [],
      nutriments: {},
      novaGroup: null,
      productName: null,
      brands: null,
    }
  }

  const ingredientsText =
    input.ingredients_text_en || input.ingredients_text || ''
  return {
    ingredientsText,
    additivesTags: input.additives_tags || [],
    nutriments: input.nutriments || {},
    novaGroup: input.nova_group ?? null,
    productName: input.product_name || null,
    brands: input.brands || null,
  }
}

function checkSeedOils(ingredientsLower) {
  const flags = []
  for (const oil of SEED_OILS) {
    if (ingredientsLower.includes(oil)) {
      flags.push({
        severity: 'warn',
        category: 'seed oil',
        item: capitalizeItem(oil),
        explanation:
          'Seed oils are high in omega-6 fatty acids. Most nutritionists recommend limiting them in favor of olive oil, butter, or coconut oil.',
      })
    }
  }
  return flags
}

function checkUltraProcessedAdditives(ingredientsLower, additivesTags) {
  const seen = new Set()
  const flags = []

  const addFlag = (item) => {
    const key = item.toLowerCase()
    if (seen.has(key) || flags.length >= 4) return
    seen.add(key)
    flags.push({
      severity: 'warn',
      category: 'ultra-processed additive',
      item,
      explanation:
        'This additive is commonly found in ultra-processed foods. It extends shelf life or improves texture in ways not possible with whole food ingredients.',
    })
  }

  for (const tag of additivesTags) {
    const label = ADDITIVE_TAG_MAP[tag]
    if (label) addFlag(label)
  }

  for (const substring of ULTRA_PROCESSED_SUBSTRINGS) {
    if (ingredientsLower.includes(substring)) {
      addFlag(capitalizeItem(substring))
    }
  }

  return flags
}

function checkHiddenSugars(ingredientsLower) {
  const flags = []
  for (const sugar of HIDDEN_SUGARS) {
    if (flags.length >= 3) break
    if (ingredientsLower.includes(sugar)) {
      flags.push({
        severity: 'warn',
        category: 'hidden sugar',
        item: capitalizeItem(sugar),
        explanation:
          'This is an added sugar listed under an alternate name. Multiple added sugars in an ingredients list usually means the total sugar content is higher than it appears.',
      })
    }
  }
  return flags
}

function checkHighSodium(nutriments, isProduct) {
  if (!isProduct) return []
  const sodiumPer100g = nutriments.sodium_100g
  if (sodiumPer100g == null) return []

  const sodiumMg = Math.round(sodiumPer100g * 1000)
  if (sodiumMg <= 400) return []

  return [
    {
      severity: 'danger',
      category: 'high sodium',
      item: 'Sodium',
      explanation: `This product contains ${sodiumMg}mg of sodium per 100g. The recommended daily limit is 2300mg total.`,
    },
  ]
}

function checkHighSugar(nutriments, isProduct) {
  if (!isProduct) return []
  const sugars = nutriments.sugars_100g
  if (sugars == null || sugars <= 15) return []

  const value = Math.round(sugars * 10) / 10
  return [
    {
      severity: 'warn',
      category: 'high sugar',
      item: 'Added sugars',
      explanation: `This product contains ${value}g of sugar per 100g. The WHO recommends limiting free sugars to less than 10% of total daily energy intake.`,
    },
  ]
}

function checkNovaScore(novaGroup, isProduct) {
  if (!isProduct || novaGroup !== 4) return []

  return [
    {
      severity: 'danger',
      category: 'ultra-processed food',
      item: 'NOVA group 4',
      explanation:
        'This product is classified as NOVA group 4 — ultra-processed. Associated with higher risks of obesity, cardiovascular disease, and other chronic conditions.',
    },
  ]
}

function buildSummary(isProduct, productName, brands, novaGroup, flagCount) {
  if (isProduct) {
    const name = productName || 'this product'
    const brand = brands || 'an unknown brand'
    const novaLabel = getNovaLabel(novaGroup)
    return `This is ${name} by ${brand}. It is classified as ${novaLabel}. We found ${flagCount} things worth knowing about.`
  }
  return `We analyzed the ingredients you provided and found ${flagCount} things worth knowing about.`
}

function buildOverall(flags) {
  const hasDanger = flags.some((f) => f.severity === 'danger')
  if (hasDanger || flags.length > 3) {
    return 'significant concerns'
  }
  if (flags.length >= 1) {
    return 'some concerns'
  }
  return 'mostly ok'
}

function buildAlternative(isProduct, novaGroup) {
  if (!isProduct) {
    return 'When possible, choose products whose ingredients list contains only items you would find in a home kitchen.'
  }
  if (novaGroup === 4) {
    return 'Look for a version with five or fewer recognizable ingredients, or make a homemade version using whole food ingredients.'
  }
  if (novaGroup === 3) {
    return 'Try to find a less processed version at a farmers market or natural grocery store.'
  }
  return 'This product looks relatively whole. No major substitution needed.'
}

export function analyzeFoodDeterministic(input) {
  const isProduct = !isPlainText(input)
  const {
    ingredientsText,
    additivesTags,
    nutriments,
    novaGroup,
    productName,
    brands,
  } = extractProductData(input)

  const ingredientsLower = (ingredientsText || '').toLowerCase()

  const flags = [
    ...checkSeedOils(ingredientsLower),
    ...checkUltraProcessedAdditives(ingredientsLower, additivesTags),
    ...checkHiddenSugars(ingredientsLower),
    ...checkHighSodium(nutriments, isProduct),
    ...checkHighSugar(nutriments, isProduct),
    ...checkNovaScore(novaGroup, isProduct),
  ]

  const summary = buildSummary(
    isProduct,
    productName,
    brands,
    novaGroup,
    flags.length,
  )
  const overall = buildOverall(flags)
  const alternative = buildAlternative(isProduct, novaGroup)

  const result = { summary, flags, overall, alternative }
  if (productName) {
    result.productName = productName
  }

  return result
}
