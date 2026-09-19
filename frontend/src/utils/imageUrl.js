import legacyBlack from '../pictures/strip/Áo Thun Nam Cao Cấp Polo Màu Đen.webp'
import legacyWhite from '../pictures/strip/Áo Thun Nam Cao Cấp Polo Màu Trắng.webp'
import legacyCream from '../pictures/strip/Áo Thun Nam Cao Cấp Polo Màu Kem.webp'
import legacyChocolate from '../pictures/strip/Áo Thun Nam Cao Cấp Polo Màu Nâu Socola.webp'
import legacyNavy from '../pictures/Áo Thun Nam Cao Cấp Polo Màu Xanh Navy.webp'

const LEGACY_IMAGES = {
  'ao-thun-nam-cao-cap-polo-mau-den.webp': legacyBlack,
  'ao-thun-nam-cao-cap-polo-mau-trang.webp': legacyWhite,
  'ao-thun-nam-cao-cap-polo-mau-kem.webp': legacyCream,
  'ao-thun-nam-cao-cap-polo-mau-nau-socola.webp': legacyChocolate,
  'ao-thun-nam-cao-cap-polo-mau-xanh-navy.webp': legacyNavy,
}

export const imageUrl = (path) => {
  if (!path) return null
  const fileName = path.split('/').pop()?.toLowerCase()
  if (fileName && LEGACY_IMAGES[fileName]) return LEGACY_IMAGES[fileName]
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/api/files/${path}`
}
