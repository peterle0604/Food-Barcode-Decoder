import { useEffect, useRef } from 'react'

const VERDICT_CLASS = {
  'mostly ok': 'verdict--ok',
  'some concerns': 'verdict--warn',
  'significant concerns': 'verdict--danger',
}

const FLAG_CLASS = {
  danger: 'flag-card--danger',
  warn: 'flag-card--warn',
  ok: 'flag-card--ok',
}

function Results({ data }) {
  const containerRef = useRef(null)

  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const { summary, flags, overall, alternative, productName } = data
  const verdictClass = VERDICT_CLASS[overall] || 'verdict--warn'

  return (
    <div className="results" ref={containerRef}>
      <span className={`verdict ${verdictClass}`}>{overall}</span>

      {productName && (
        <p className="results-product-name">{productName}</p>
      )}

      <p className="results-summary">{summary}</p>

      {flags.length > 0 && (
        <section>
          <h2 className="section-label">What we found</h2>
          <ul className="flag-list">
            {flags.map((flag, index) => (
              <li
                key={`${flag.category}-${flag.item}-${index}`}
                className={`flag-card ${FLAG_CLASS[flag.severity] || 'flag-card--warn'}`}
              >
                <span className="flag-category">{flag.category}</span>
                <p className="flag-item">{flag.item}</p>
                <p className="flag-explanation">{flag.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="results-alternative">
        <h2 className="section-label">Try instead</h2>
        <p className="alternative-text">{alternative}</p>
      </section>
    </div>
  )
}

export default Results
