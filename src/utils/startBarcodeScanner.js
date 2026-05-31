import { BrowserMultiFormatReader } from '@zxing/browser'
import {
  BARCODE_SCAN_HINTS,
  BARCODE_SCAN_OPTIONS,
} from './barcodeScanHints.js'
import { createConfirmedBarcodeHandler } from './confirmBarcodeScan.js'
import {
  getCameraStream,
  stopMediaStream,
  waitForVideoReady,
} from './getCameraStream.js'
import { normalizeProductBarcode } from './normalizeProductBarcode.js'

/** Retail formats only — avoids shipping codes / QR codes on the label. */
const NATIVE_FORMATS = ['ean_13', 'upc_a', 'ean_8', 'upc_e']

const NATIVE_FORMAT_PRIORITY = ['ean_13', 'upc_a', 'ean_8', 'upc_e']

function pickRetailNativeCode(codes) {
  for (const format of NATIVE_FORMAT_PRIORITY) {
    const match = codes.find((c) => c.format === format)
    const raw = match?.rawValue?.trim()
    if (raw && normalizeProductBarcode(raw)) return raw
  }
  return null
}

async function startVideoPreview(video, stream) {
  video.srcObject = stream
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', 'true')
  video.setAttribute('webkit-playsinline', 'true')
  video.setAttribute('autoplay', 'true')
  await video.play().catch(async () => {
    await new Promise((resolve) => {
      video.addEventListener('loadedmetadata', resolve, { once: true })
    })
    await video.play()
  })
}

function startNativeBarcodeScan(video, onRawCode, isActive) {
  if (typeof globalThis.BarcodeDetector === 'undefined') {
    return null
  }

  let rafId = 0
  let busy = false

  const detector = new globalThis.BarcodeDetector({
    formats: NATIVE_FORMATS,
  })

  const tick = async () => {
    if (!isActive()) return

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      rafId = requestAnimationFrame(tick)
      return
    }

    if (!busy) {
      busy = true
      try {
        const codes = await detector.detect(video)
        const value = pickRetailNativeCode(codes)
        if (value) {
          onRawCode(value)
        }
      } catch {
        /* keep scanning */
      }
      busy = false
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(rafId)
  }
}

function startZxingScan(reader, video, onRawCode, isActive) {
  return reader.scan(video, (result) => {
    if (!isActive() || !result) return
    const text = result.getText()?.trim()
    if (text) onRawCode(text)
  })
}

/**
 * Opens the rear camera and continuously scans for barcodes.
 * Returns a stop() function.
 */
export async function startBarcodeScanner(video, onCode, isActive) {
  const stream = await getCameraStream()
  await startVideoPreview(video, stream)
  await waitForVideoReady(video)

  if (!isActive()) {
    stopMediaStream(stream)
    return () => {}
  }

  if (video.paused) {
    await video.play().catch(() => {})
  }

  const reader = new BrowserMultiFormatReader(
    BARCODE_SCAN_HINTS,
    BARCODE_SCAN_OPTIONS,
  )

  const onRawCode = createConfirmedBarcodeHandler(onCode, 3)

  let stopNative = null
  let zxingControls = null

  stopNative = startNativeBarcodeScan(video, onRawCode, isActive)

  if (!stopNative) {
    zxingControls = startZxingScan(reader, video, onRawCode, isActive)
  }

  return () => {
    stopNative?.()
    zxingControls?.stop()
    stopMediaStream(stream)
    if (video) {
      video.srcObject = null
    }
  }
}
