import { useCallback, useState } from 'react'
import ProductIdentificationCard from './ProductIdentificationCard.jsx'
import Results from './Results.jsx'
import { analyzeFoodDeterministic } from '../utils/analyzeFoodDeterministic.js'
import { lookupProductBarcode } from '../utils/lookupBarcode.js'

function getProductImageUrl(product) {
  return product.image_front_url || product.image_front_small_url || null
}

function formatBarcodeDisplay(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 4) return digits
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function ScanTab({ onGoToPaste }) {
  const [phase, setPhase] = useState('idle')
  const [barcode, setBarcode] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [results, setResults] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  const digitCount = manualBarcode.length
  const canSubmit =
    digitCount === 8 || digitCount === 12 || digitCount === 13

  const runLookup = useCallback(async (code) => {
    setBarcode(code)
    setPhase('loading')

    try {
      const lookup = await lookupProductBarcode(code)
      if (!lookup) {
        setPhase('not-found')
        return
      }
      setBarcode(lookup.barcode)
      setProduct(lookup.product)
      setPhase('analyzing')
      await new Promise((resolve) => requestAnimationFrame(resolve))
      setResults(analyzeFoodDeterministic(lookup.product))
      setPhase('results')
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong.',
      )
      setPhase('error')
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    runLookup(manualBarcode.trim())
  }

  const resetForm = () => {
    setBarcode('')
    setManualBarcode('')
    setProduct(null)
    setResults(null)
    setErrorMessage('')
    setPhase('idle')
  }

  if ((phase === 'results' || phase === 'analyzing') && product) {
    return (
      <div className="tab-panel">
        <ProductIdentificationCard
          productName={product.product_name}
          brand={product.brands}
          imageUrl={getProductImageUrl(product)}
        />
        {phase === 'analyzing' && (
          <div className="status-card status-card--loading">
            <div className="spinner" aria-hidden="true" />
            <p className="status-card__title">Analyzing ingredients</p>
            <p className="status-card__text">Checking for seed oils, additives, and more…</p>
          </div>
        )}
        {phase === 'results' && results && (
          <>
            <Results data={results} />
            <button type="button" className="btn-primary" onClick={resetForm}>
              Look up another product
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="tab-panel barcode-tab">
      {phase === 'idle' && (
        <>
          <section className="card barcode-intro" aria-labelledby="barcode-intro-title">
            <div className="barcode-intro__icon" aria-hidden="true">
              <span className="barcode-bars" />
            </div>
            <div className="barcode-intro__text">
              <h2 id="barcode-intro-title" className="barcode-intro__title">
                Look up by barcode
              </h2>
              <p className="barcode-intro__desc">
                Enter the numbers printed below the barcode on any packaged food.
                We&apos;ll pull ingredients from Open Food Facts and analyze them
                for you.
              </p>
            </div>
          </section>

          <form
            className="card barcode-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="manual-barcode" className="barcode-form__label">
              Barcode number
            </label>
            <p className="barcode-form__hint">
              Enter 8 digits (EAN-8), 12 (UPC), or 13 (EAN) — no spaces needed
            </p>
            <div className="barcode-input-wrap">
              <input
                id="manual-barcode"
                type="text"
                inputMode="numeric"
                className="barcode-input"
                value={manualBarcode}
                onChange={(e) =>
                  setManualBarcode(e.target.value.replace(/\D/g, ''))
                }
                placeholder="12345678"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                maxLength={13}
                aria-describedby="barcode-digit-hint"
              />
            </div>
            <p
              id="barcode-digit-hint"
              className={`barcode-digit-hint ${canSubmit ? 'barcode-digit-hint--ok' : ''}`}
            >
              {digitCount === 0
                ? 'Enter 8, 12, or 13 digits to continue'
                : canSubmit
                  ? `${digitCount} digits — ready to decode`
                  : `${digitCount} digit${digitCount === 1 ? '' : 's'} — need 8, 12, or 13 total`}
            </p>
            <button
              type="submit"
              className="btn-primary"
              disabled={!canSubmit}
            >
              Decode product
            </button>
          </form>

          <section className="barcode-help card card--subtle">
            <h3 className="barcode-help__title">Where to find it</h3>
            <ol className="barcode-help__list">
              <li>Flip the package to the back or side panel</li>
              <li>Look for vertical black bars with numbers underneath</li>
              <li>Type those numbers in the box above</li>
            </ol>
          </section>
        </>
      )}

      {phase === 'loading' && (
        <div className="status-card status-card--loading">
          <div className="spinner" aria-hidden="true" />
          <p className="status-card__title">Looking up product</p>
          <p className="status-card__text">
            Searching Open Food Facts for{' '}
            <strong>{formatBarcodeDisplay(barcode)}</strong>
          </p>
        </div>
      )}

      {phase === 'not-found' && (
        <div className="status-card status-card--warn">
          <p className="status-card__title">Product not found</p>
          <p className="status-card__text">
            We couldn&apos;t find barcode{' '}
            <strong>{formatBarcodeDisplay(barcode)}</strong> in Open Food Facts.
            Double-check the number, or paste the ingredients list instead.
          </p>
          <button type="button" className="btn-primary" onClick={resetForm}>
            Try another barcode
          </button>
          {onGoToPaste && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onGoToPaste}
            >
              Paste ingredients instead
            </button>
          )}
        </div>
      )}

      {phase === 'error' && (
        <div className="status-card status-card--error">
          <p className="status-card__title">Something went wrong</p>
          <p className="status-card__text">{errorMessage}</p>
          <button type="button" className="btn-primary" onClick={resetForm}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

export default ScanTab
