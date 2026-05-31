function ProductIdentificationCard({ productName, brand, imageUrl }) {
  const name = productName || 'Unknown product'
  const brandLine = brand || 'Unknown brand'
  const src = imageUrl || null

  return (
    <div className="product-id-card">
      <div className="product-id-card__image-wrap">
        {src ? (
          <img
            src={src}
            alt=""
            className="product-id-card__image"
          />
        ) : (
          <div className="product-id-card__placeholder" aria-hidden="true">
            📷
          </div>
        )}
      </div>
      <div className="product-id-card__text">
        <p className="product-id-card__name">{name}</p>
        <p className="product-id-card__brand">{brandLine}</p>
      </div>
    </div>
  )
}

export default ProductIdentificationCard
