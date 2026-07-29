const colorMap = {
  gold: 'bg-gold/15 text-gold border-gold/20',
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  gray: 'bg-gray-500/15 text-dark-muted border-dark-border',
}

export default function AdminBadge({ color = 'gray', children }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${colorMap[color] || colorMap.gray}`}>
      {children}
    </span>
  )
}