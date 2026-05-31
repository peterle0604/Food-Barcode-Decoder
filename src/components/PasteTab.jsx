import { useState } from 'react'
import Results from './Results.jsx'
import { analyzeFoodDeterministic } from '../utils/analyzeFoodDeterministic.js'

function PasteTab() {
  const [text, setText] = useState('')
  const [results, setResults] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = text.trim()
    if (!value) return
    setResults(analyzeFoodDeterministic(value))
  }

  const handleReset = () => {
    setText('')
    setResults(null)
  }

  if (results) {
    return (
      <div className="tab-panel">
        <Results data={results} />
        <button type="button" className="btn-primary" onClick={handleReset}>
          Analyze another list
        </button>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <form className="paste-form" onSubmit={handleSubmit}>
        <label htmlFor="paste-ingredients" className="visually-hidden">
          Ingredients or nutrition facts
        </label>
        <textarea
          id="paste-ingredients"
          className="paste-textarea"
          placeholder="Paste ingredients list or nutrition facts text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={!text.trim()}
        >
          Analyze ingredients
        </button>
      </form>
    </div>
  )
}

export default PasteTab
