function OcrTextConfirmation({ text }) {
  const shortText = text.length < 20

  return (
    <div className="ocr-confirmation">
      {shortText && (
        <p className="message message--warn">
          We could not read much text from this photo. Results may be incomplete.
          Try better lighting or the Paste tab.
        </p>
      )}
      <details className="ocr-details">
        <summary className="ocr-details__summary">
          Text we read from your photo
        </summary>
        <pre className="ocr-details__text">{text}</pre>
      </details>
    </div>
  )
}

export default OcrTextConfirmation
