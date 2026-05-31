const CONSTRAINT_ATTEMPTS = [
  {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  { video: { facingMode: { ideal: 'environment' } }, audio: false },
  { video: { facingMode: 'environment' }, audio: false },
  { video: true, audio: false },
]

export async function getCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera not supported in this browser')
  }

  let lastError
  for (const constraints of CONSTRAINT_ATTEMPTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError ?? new Error('Could not open camera')
}

export function stopMediaStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((track) => track.stop())
}

/** Wait until the video element has real frame dimensions for ZXing canvas capture. */
export function waitForVideoReady(video, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const isReady = () =>
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA

    if (isReady()) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Camera preview did not become ready'))
    }, timeoutMs)

    const onReady = () => {
      if (isReady()) {
        cleanup()
        resolve()
      }
    }

    const cleanup = () => {
      clearTimeout(timeoutId)
      video.removeEventListener('loadedmetadata', onReady)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('playing', onReady)
    }

    video.addEventListener('loadedmetadata', onReady)
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('playing', onReady)
    requestAnimationFrame(onReady)
  })
}
