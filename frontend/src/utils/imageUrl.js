export const imageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/api/files/')) return path
  return `/api/files/${path}`
}
