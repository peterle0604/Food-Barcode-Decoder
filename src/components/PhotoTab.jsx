import { useEffect, useRef, useState } from 'react'
import { createWorker } from 'tesseract.js'
import OcrTextConfirmation from './OcrTextConfirmation.jsx'
import Results from './Results.jsx'
import { analyzeFoodDeterministic } from '../utils/analyzeFoodDeterministic.js'

function PhotoTab() {
  const fileInputRef = useRef(null)
  const workerRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [phase, setPhase] = useState('idle')
  const [extractedText, setExtractedText] = useState('')
  const [results, setResults] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let worker
    let active = true

    ;(async () => {
      worker = await createWorker('eng')
      if (active) workerRef.current = worker
      else await worker.terminate()
    })()

    return () => {
      active = false
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setExtractedText('')
    setResults(null)
    setErrorMessage('')
    setPhase('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setExtractedText('')
    setResults(null)
    setErrorMessage('')
    setPhase('loading')

    try {
      const worker = workerRef.current
      if (!worker) {
        const w = await createWorker('eng')
        workerRef.current = w
      }

      const { data } = await workerRef.current.recognize(file, 'eng')
      const text = (data.text || '').trim()

      if (!text) {
        setErrorMessage(
          'Could not read the label. Try the Paste tab instead.',
        )
        setPhase('error')
        return
      }

      setExtractedText(text)
      setPhase('analyzing')
      await new Promise((resolve) => requestAnimationFrame(resolve))
      setResults(analyzeFoodDeterministic(text))
      setPhase('results')
    } catch {
      setErrorMessage(
        'Could not read the label. Try the Paste tab instead.',
      )
      setPhase('error')
    }
  }

  if ((phase === 'analyzing' || phase === 'results') && extractedText) {
    return (
      <div className="tab-panel">
        {previewUrl && (
          <img src={previewUrl} alt="Label preview" className="photo-preview" />
        )}
        <OcrTextConfirmation text={extractedText} />
        {phase === 'analyzing' && (
          <div className="loading-row">
            <div className="spinner" aria-hidden="true" />
            <p className="loading-text">Analyzing ingredients...</p>
          </div>
        )}
        {phase === 'results' && results && (
          <>
            <Results data={results} />
            <button type="button" className="btn-primary" onClick={resetSelection}>
              Take another photo
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <input
        ref={fileInputRef}
        id="photo-input"
        type="file"
        accept="image/*"
        capture="environment"
        className="file-input-hidden"
        onChange={handleFileChange}
      />

      {phase === 'idle' && (
        <label htmlFor="photo-input" className="photo-tap-target">
          Tap to photograph nutrition label
        </label>
      )}

      {(phase === 'loading' || phase === 'error') && previewUrl && (
        <img src={previewUrl} alt="Label preview" className="photo-preview" />
      )}

      {phase === 'loading' && (
        <div className="loading-row">
          <div className="spinner" aria-hidden="true" />
          <p className="loading-text">Reading label...</p>
        </div>
      )}

      {phase === 'error' && (
        <>
          <p className="message message--error">{errorMessage}</p>
          <button type="button" className="btn-primary" onClick={resetSelection}>
            Try again
          </button>
        </>
      )}
    </div>
  )
}

export default PhotoTab
