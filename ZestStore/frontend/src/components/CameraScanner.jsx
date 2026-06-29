import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

export default function CameraScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('')
  const mountedRef = useRef(true)
  const streamRef = useRef(null)
  const countRef = useRef({})

  useEffect(() => {
    mountedRef.current = true
    let intervalId

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
      .then(stream => {
        if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.onloadedmetadata = () => {
          video.play()
          startScanning(video)
        }
      })
      .catch(err => {
        setLoading(false)
        setError('Không thể truy cập camera: ' + (err.message?.includes('NotAllowed') ? 'Vui lòng cấp quyền camera' : err.message?.includes('NotFound') ? 'Không tìm thấy camera' : err.message || ''))
      })

    function startScanning(video) {
      if ('BarcodeDetector' in window) {
        BarcodeDetector.getSupportedFormats().then(fmts => {
          if (fmts.includes('qr_code')) {
            setMode('BarcodeDetector')
            setLoading(false)
            const detector = new BarcodeDetector({ formats: ['qr_code'] })
            intervalId = setInterval(async () => {
              if (!mountedRef.current) return
              try {
                const codes = await detector.detect(video)
                for (const c of codes) {
                  if (processCode(c.rawValue)) return
                }
              } catch { /* skip */ }
            }, 300)
            return
          }
          startJsQr(video)
        }).catch(() => startJsQr(video))
      } else {
        startJsQr(video)
      }
    }

    function startJsQr(video) {
      setMode('jsQR')
      setLoading(false)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      canvas.width = 640
      canvas.height = 480

      intervalId = setInterval(() => {
        if (!mountedRef.current || !video.videoWidth) return
        ctx.drawImage(video, 0, 0, 640, 480)
        const imageData = ctx.getImageData(0, 0, 640, 480)
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })
        if (code && code.data) {
          if (processCode(code.data)) return
        }
      }, 300)
    }

    function processCode(code) {
      if (!code) return false
      const cnt = (countRef.current[code] || 0) + 1
      countRef.current[code] = cnt
      setTimeout(() => { if (countRef.current[code] === cnt) delete countRef.current[code] }, 2000)
      if (cnt >= 2) {
        countRef.current = {}
        clearInterval(intervalId)
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
        onScan(code)
        return true
      }
      return false
    }

    return () => {
      mountedRef.current = false
      clearInterval(intervalId)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="relative bg-black" style={{ minHeight: '16rem' }}>
      {loading && <div className="absolute inset-0 flex items-center justify-center z-10"><div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20">Đóng</button>
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ height: '16rem', objectFit: 'cover' }} />
      <canvas ref={canvasRef} className="hidden" />
      {!loading && !error && (
        <>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-0.5 bg-red-500 opacity-80 animate-pulse rounded" />
          </div>
          <p className="absolute bottom-3 left-0 right-0 text-center text-white text-xs bg-black/50 py-1 mx-4 rounded">
            {mode === 'jsQR' ? 'QR scan (jsQR) — đưa QR vào vùng đỏ' : 'Đưa QR code vào vùng đỏ'}
          </p>
        </>
      )}
    </div>
  )
}
