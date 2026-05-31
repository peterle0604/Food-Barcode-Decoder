import { useCallback, useEffect, useRef, useState } from 'react'
import ProductIdentificationCard from './ProductIdentificationCard.jsx'
import Results from './Results.jsx'
import { analyzeFoodDeterministic } from '../utils/analyzeFoodDeterministic.js'
import { startBarcodeScanner } from '../utils/startBarcodeScanner.js'
import { lookupProductBarcode } from '../utils/lookupBarcode.js'

function getProductImageUrl(product) {
  return product.image_front_url || product.image_front_small_url || null
}

function ScanTab({ onSwitchToPhoto }) {
  const videoRef = useRef(null)
  const stopScanRef = useRef(null)
  const handleDetectionRef = useRef(null)

  const [scanKey, setScanKey] = useState(0)
  const [phase, setPhase] = useState('scanning')
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [results, setResults] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [manualBarcode, setManualBarcode] = useState('')
  const handlingRef = useRef(false)

  const stopScanner = useCallback(() => {
    stopScanRef.current?.()
    stopScanRef.current = null
    const video = videoRef.current
    if (video) video.srcObject = null
  }, [])

  const handleDetection = useCallback(async (code) => {
    if (handlingRef.current) return
    handlingRef.current = true
    stopScanner()

    setBarcode(code)
    setPhase('loading')

    try {
      const lookup = await lookupProductBarcode(code)
      if (!lookup) {
        setPhase('not-found')
        handlingRef.current = false
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
    handlingRef.current = false
  }, [stopScanner])

  handleDetectionRef.current = handleDetection

  const handleManualSubmit = (event) => {
    event.preventDefault()
    const value = manualBarcode.trim()
    if (!value) return
    handleDetection(value)
  }

  const scanAgain = useCallback(() => {
    stopScanner()
    handlingRef.current = false
    setBarcode('')
    setProduct(null)
    setResults(null)
    setErrorMessage('')
    setCameraError('')
    setManualBarcode('')
    setPhase('scanning')
    setScanKey((k) => k + 1)
  }, [stopScanner])

  useEffect(() => {
    if (phase !== 'scanning') return undefined

    let active = true

    const startScan = async () => {
      const video = videoRef.current
      if (!video || !active) return

      setCameraError('')

      try {
        const stop = await startBarcodeScanner(
          video,
          (text) => handleDetectionRef.current?.(text),
          () => active && !handlingRef.current,
        )

        if (!active) {
          stop()
          return
        }

        stopScanRef.current = stop
      } catch {
        if (active) {
          setCameraError(
            'Could not start the camera preview. Tap Scan again or use the Photo tab.',
          )
          setPhase('camera-denied')
        }
      }
    }

    startScan()

    return () => {
      active = false
      stopScanRef.current?.()
      stopScanRef.current = null
      const el = videoRef.current
      if (el) el.srcObject = null
    }
  }, [scanKey, phase])

  if ((phase === 'results' || phase === 'analyzing') && product) {
    return (
      <div className="tab-panel">
        <ProductIdentificationCard
          productName={product.product_name}
          brand={product.brands}
          imageUrl={getProductImageUrl(product)}
        />
        {phase === 'analyzing' && (
          <div className="loading-row">
            <div className="spinner" aria-hidden="true" />
            <p className="loading-text">Analyzing ingredients...</p>
          </div>
        )}
        {phase === 'results' && results && (
          <>
            <Results data={results} />
            <button type="button" className="btn-primary" onClick={scanAgain}>
              Scan again
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="tab-panel">
      {(phase === 'scanning' || phase === 'loading') && (
        <div className="scanner-wrap">
          <video
            ref={videoRef}
            className="scanner-video"
            autoPlay
            muted
            playsInline
          />
          {phase === 'loading' && (
            <div className="scanner-overlay">
              <p className="barcode-detected">Barcode: {barcode}</p>
              <div className="loading-row">
                <div className="spinner" aria-hidden="true" />
                <p className="loading-text">Looking up product...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'scanning' && (
        <form className="manual-barcode-form" onSubmit={handleManualSubmit}>
          <label htmlFor="manual-barcode" className="manual-barcode-label">
            Enter barcode manually
          </label>
          <input
            id="manual-barcode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="manual-barcode-input"
            value={manualBarcode}
            onChange={(e) =>
              setManualBarcode(e.target.value.replace(/\D/g, ''))
            }
            placeholder="UPC / EAN number"
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!manualBarcode.trim()}
          >
            Look up product
          </button>
        </form>
      )}

      {phase === 'scanning' && (
        <p className="scanner-hint">
          Center the product barcode (UPC/EAN) and hold steady for a moment
        </p>
      )}

      {phase === 'scanning' && cameraError && (
        <p className="message message--error">{cameraError}</p>
      )}

      {phase === 'not-found' && (
        <>
          <p className="message">
            Product not found. Try the Photo or Paste tab.
          </p>
          <button type="button" className="btn-primary" onClick={scanAgain}>
            Scan again
          </button>
        </>
      )}

      {phase === 'camera-denied' && (
        <>
          <p className="message">
            {cameraError ||
              'Camera access is needed to scan barcodes.'}
          </p>
          <button type="button" className="btn-primary" onClick={scanAgain}>
            Try camera again
          </button>
          <button
            type="button"
            className="btn-primary btn-secondary-spacing"
            onClick={onSwitchToPhoto}
          >
            Use Photo tab
          </button>
        </>
      )}

      {phase === 'error' && (
        <>
          <p className="message message--error">{errorMessage}</p>
          <button type="button" className="btn-primary" onClick={scanAgain}>
            Scan again
          </button>
        </>
      )}
    </div>
  )
}

export default ScanTab
