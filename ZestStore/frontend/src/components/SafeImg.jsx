import { useState } from 'react'
import { imageUrl } from '../utils/imageUrl'

const FALLBACK = 'https://placehold.co/300x300/e2e8f0/475569?text=Polo'

export default function SafeImg({ src, fallback = FALLBACK, alt = '', ...props }) {
  const [failed, setFailed] = useState(false)
  const resolved = imageUrl(src)
  return <img src={failed || !resolved ? fallback : resolved} alt={alt} onError={() => setFailed(true)} {...props} />
}
