import { BarcodeFormat, DecodeHintType } from '@zxing/library'

/** Retail product barcodes only — avoids random Code 128 / QR misreads on packaging. */
export const BARCODE_SCAN_HINTS = new Map([
  [DecodeHintType.TRY_HARDER, true],
  [
    DecodeHintType.POSSIBLE_FORMATS,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ],
  ],
])

export const BARCODE_SCAN_OPTIONS = {
  tryPlayVideoTimeout: 20000,
  delayBetweenScanAttempts: 100,
  delayBetweenScanSuccess: 500,
}
